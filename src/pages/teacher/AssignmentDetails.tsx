import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, Trash2, Loader2, Users, FileText, Check, AlertCircle, Eye } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment, Rubric, Submission, Profile } from '../../lib/api'
import RubricBuilder, { type RubricItem } from '../../components/RubricBuilder'
import PDFViewer from '../../components/PDFViewer'

type TabType = 'details' | 'submissions' | 'requests'

export default function AssignmentDetails() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [rubric, setRubric] = useState<Rubric | null>(null)
    const [submissions, setSubmissions] = useState<(Submission & { profile: Profile })[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [activeTab, setActiveTab] = useState<TabType>('details')
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)
    const [previewTitle, setPreviewTitle] = useState<string>('')

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        due_date: ''
    })
    const [rubricItems, setRubricItems] = useState<RubricItem[]>([])

    useEffect(() => {
        if (id) fetchAllData()
    }, [id])

    const fetchAllData = async () => {
        try {
            const [assignmentRes, rubricRes, submissionsRes] = await Promise.all([
                api.assignments.get(id!),
                api.rubrics.getByAssignment(id!),
                api.submissions.listByAssignment(id!)
            ])

            if (assignmentRes.error) throw assignmentRes.error

            setAssignment(assignmentRes.data)
            setRubric(rubricRes.data)
            setSubmissions(submissionsRes.data || [])

            if (assignmentRes.data) {
                setFormData({
                    title: assignmentRes.data.title,
                    description: assignmentRes.data.description || '',
                    due_date: assignmentRes.data.due_date ? new Date(assignmentRes.data.due_date).toISOString().split('T')[0] : ''
                })
            }

            if (rubricRes.data) {
                setRubricItems(rubricRes.data.criteria as unknown as RubricItem[])
            }
        } catch (error) {
            console.error('Error fetching assignment details:', error)
            alert('Assignment not found')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!assignment) return

        setSaving(true)
        try {
            const { data: updatedAssignment, error: assignmentError } = await api.assignments.update(assignment.id, {
                title: formData.title,
                description: formData.description,
                due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
            })

            if (assignmentError) throw assignmentError

            if (rubricItems.length > 0) {
                if (rubric) {
                    await api.rubrics.update(rubric.id, { criteria: rubricItems as any })
                } else {
                    await api.rubrics.create({ assignment_id: assignment.id, criteria: rubricItems as any })
                }
            }

            setAssignment(updatedAssignment)
            setIsEditing(false)
            alert('Assignment updated successfully!')
            fetchAllData()
        } catch (error) {
            console.error('Error updating assignment:', error)
            alert('Failed to update assignment')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!assignment) return
        if (!confirm('Are you sure you want to delete this assignment? All submissions and reviews will also be removed.')) return

        setDeleting(true)
        try {
            const { error } = await api.assignments.delete(assignment.id)
            if (error) throw error
            alert('Assignment deleted successfully')
            navigate('/')
        } catch (error) {
            console.error('Error deleting assignment:', error)
            alert('Failed to delete assignment')
        } finally {
            setDeleting(false)
        }
    }

    const handleResubmission = async (submissionId: string, accept: boolean) => {
        const sub = submissions.find(s => s.id === submissionId)
        if (!sub) return

        try {
            if (accept) {
                await api.submissions.update(submissionId, {
                    file_url: sub.new_file_url || sub.file_url,
                    status: 'submitted',
                    new_file_url: null,
                    resubmission_justification: null
                })
                alert('Resubmission accepted!')
            } else {
                await api.submissions.update(submissionId, {
                    status: 'submitted',
                    new_file_url: null,
                    resubmission_justification: null
                })
                alert('Resubmission rejected.')
            }
            fetchAllData()
        } catch (error) {
            console.error('Error processing resubmission:', error)
        }
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading details...</div>
    if (!assignment) return <div className="p-8 text-center">Assignment not found</div>

    const pendingRequests = submissions.filter(s => s.status === 'resubmission_pending')

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
                    </button>
                    {!isEditing && (
                        <button onClick={handleDelete} disabled={deleting} className="inline-flex items-center px-3 py-2 border border-red-600 rounded text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
                            <Trash2 className="mr-2 h-4 w-4" /> {deleting ? 'Deleting...' : 'Delete Assignment'}
                        </button>
                    )}
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isEditing ? 'Edit Assignment' : assignment.title}
                            </h1>
                            {!isEditing && activeTab === 'details' && (
                                <button onClick={() => setIsEditing(true)} className="inline-flex items-center px-3 py-2 border border-blue-600 rounded text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition">
                                    <Edit2 className="mr-2 h-4 w-4" /> Edit
                                </button>
                            )}
                        </div>

                        {!isEditing && (
                            <div className="flex mt-4 -mb-4 space-x-8">
                                <button onClick={() => setActiveTab('details')} className={`py-4 px-1 border-b-2 font-medium text-sm transition ${activeTab === 'details' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    Details
                                </button>
                                <button onClick={() => setActiveTab('submissions')} className={`py-4 px-1 border-b-2 font-medium text-sm transition flex items-center ${activeTab === 'submissions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    Submissions <span className="ml-2 py-0.5 px-2 rounded-full bg-gray-100 text-gray-600 text-xs">{submissions.length}</span>
                                </button>
                                <button onClick={() => setActiveTab('requests')} className={`py-4 px-1 border-b-2 font-medium text-sm transition flex items-center ${activeTab === 'requests' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                                    Requests {pendingRequests.length > 0 && <span className="ml-2 py-0.5 px-2 rounded-full bg-yellow-100 text-yellow-700 text-xs">{pendingRequests.length}</span>}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="p-6">
                        {isEditing ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                                            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                                            <input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description / Instructions</label>
                                        <textarea rows={5} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 sm:text-sm dark:bg-gray-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500" />
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <RubricBuilder items={rubricItems} onChange={setRubricItems} />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button onClick={() => { setIsEditing(false); fetchAllData(); }} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                                        <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in duration-300">
                                {activeTab === 'details' && (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div className="md:col-span-2 space-y-4">
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Instructions</h3>
                                                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                                                    {assignment.description || 'No instructions provided.'}
                                                </div>
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md h-fit border border-gray-100 dark:border-gray-700">
                                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Deadline</h3>
                                                <div className="text-sm font-medium dark:text-gray-200">
                                                    {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date set'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Rubric Criteria</h3>
                                            {rubricItems.length > 0 ? (
                                                <div className="space-y-3">
                                                    {rubricItems.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-start bg-gray-50 dark:bg-gray-700/20 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                                                            </div>
                                                            <div className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-bold">{item.max_points} pts</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-gray-500 italic text-sm">No rubric criteria defined.</p>}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'submissions' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-lg">
                                            <div className="flex items-center space-x-3 text-indigo-900 dark:text-indigo-100">
                                                <Users className="h-5 w-5" />
                                                <span className="font-semibold text-sm">Received Submissions</span>
                                            </div>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                                <thead className="bg-gray-50 dark:bg-gray-800">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">File</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                    {submissions.length === 0 ? (
                                                        <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-500">No submissions yet.</td></tr>
                                                    ) : submissions.map((sub) => (
                                                        <tr key={sub.id}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{sub.profile?.full_name || 'Anonymous'}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end space-x-3">
                                                                <button
                                                                    onClick={() => {
                                                                        setPreviewUrl(sub.file_url)
                                                                        setPreviewTitle(`${sub.profile?.full_name}'s Submission`)
                                                                    }}
                                                                    className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center"
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" /> Preview
                                                                </button>
                                                                <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-gray-700 font-medium text-sm">External</a>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'requests' && (
                                    <div className="space-y-6">
                                        {pendingRequests.length === 0 ? (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                                <Check className="h-10 w-10 text-green-500 mx-auto mb-2" />
                                                <p className="text-gray-500">All caught up! No pending resubmission requests.</p>
                                            </div>
                                        ) : pendingRequests.map((sub) => (
                                            <div key={sub.id} className="bg-white dark:bg-gray-800 border-2 border-yellow-100 dark:border-yellow-900/30 rounded-lg overflow-hidden shadow-sm">
                                                <div className="px-6 py-4 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-900/30 flex justify-between items-center">
                                                    <span className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center">
                                                        <AlertCircle className="h-4 w-4 mr-2" />
                                                        Resubmission Request
                                                    </span>
                                                    <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full font-bold">PENDING APPROVAL</span>
                                                </div>
                                                <div className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase">Student</label>
                                                                <p className="text-gray-900 dark:text-white font-medium">{sub.profile?.full_name}</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase">Justification</label>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 italic p-3 bg-gray-50 dark:bg-gray-700/50 rounded border border-gray-100 dark:border-gray-600 mt-1">
                                                                    "{sub.resubmission_justification}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="text-xs font-bold text-gray-400 uppercase pb-2 block">Files Comparison</label>
                                                                <div className="space-y-3">
                                                                    <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded border border-red-100 dark:border-red-900/20">
                                                                        <span className="text-xs text-red-700 font-bold uppercase">Old File</span>
                                                                        <div className="flex space-x-3">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setPreviewUrl(sub.file_url)
                                                                                    setPreviewTitle(`${sub.profile?.full_name} - Old File`)
                                                                                }}
                                                                                className="text-xs font-bold text-red-600 underline flex items-center"
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-1" /> Preview
                                                                            </button>
                                                                            <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-red-400 underline flex items-center"><FileText className="h-3 w-3 mr-1" /> External</a>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded border border-green-100 dark:border-green-900/20">
                                                                        <span className="text-xs text-green-700 font-bold uppercase">New File</span>
                                                                        <div className="flex space-x-3">
                                                                            <button
                                                                                onClick={() => {
                                                                                    setPreviewUrl(sub.new_file_url!)
                                                                                    setPreviewTitle(`${sub.profile?.full_name} - New File`)
                                                                                }}
                                                                                className="text-xs font-bold text-green-600 underline flex items-center"
                                                                            >
                                                                                <Eye className="h-3 w-3 mr-1" /> Preview
                                                                            </button>
                                                                            <a href={sub.new_file_url!} target="_blank" rel="noreferrer" className="text-xs font-bold text-green-400 underline flex items-center font-bold"><FileText className="h-3 w-3 mr-1" /> External</a>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-8 flex justify-end space-x-3">
                                                        <button onClick={() => handleResubmission(sub.id, false)} className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition border border-red-200">Deny Request</button>
                                                        <button onClick={() => handleResubmission(sub.id, true)} className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm transition">Accept & Replace</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {previewUrl && (
                <PDFViewer
                    url={previewUrl}
                    title={previewTitle}
                    onClose={() => setPreviewUrl(null)}
                />
            )}
        </div>
    )
}
