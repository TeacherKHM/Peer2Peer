import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Save, Trash2, Loader2, Users, FileText, Check, AlertCircle, Eye } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment, Rubric, Submission, Profile, Review } from '../../lib/api'
import RubricBuilder, { type RubricItem } from '../../components/RubricBuilder'
import PDFViewer from '../../components/PDFViewer'
import { useNotification } from '../../contexts/NotificationContext'
import Modal from '../../components/Modal'

type TabType = 'details' | 'submissions' | 'requests' | 'reviews'

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
    const [reviews, setReviews] = useState<(Review & { reviewer: Profile, submission: Submission & { profile: Profile } })[]>([])
    const [assigning, setAssigning] = useState(false)
    const { showNotification } = useNotification()
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [isConfirmAssignModalOpen, setIsConfirmAssignModalOpen] = useState(false)

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
            const [assignmentRes, rubricRes, submissionsRes, reviewsRes] = await Promise.all([
                api.assignments.get(id!),
                api.rubrics.getByAssignment(id!),
                api.submissions.listByAssignment(id!),
                api.reviews.listByAssignment(id!)
            ]) as [any, any, any, any]

            if (assignmentRes.error) throw assignmentRes.error

            setAssignment(assignmentRes.data)
            setRubric(rubricRes.data)
            setSubmissions(submissionsRes.data || [])
            setReviews(reviewsRes.data || [])

            if (assignmentRes.data) {
                setFormData({
                    title: assignmentRes.data.title,
                    description: assignmentRes.data.description || '',
                    due_date: assignmentRes.data.due_date ? new Date(assignmentRes.data.due_date).toISOString().substring(0, 16) : ''
                })
            }

            if (rubricRes.data) {
                setRubricItems(rubricRes.data.criteria as unknown as RubricItem[])
            }
        } catch (error) {
            console.error('Error fetching assignment details:', error)
            showNotification('error', 'Assignment not found')
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
            showNotification('success', 'Assignment updated successfully!')
            fetchAllData()
        } catch (error: any) {
            console.error('Error updating assignment:', error)
            showNotification('error', error.message || 'Failed to update assignment')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!assignment) return
        setIsDeleteModalOpen(false)
        setDeleting(true)
        try {
            const { error } = await api.assignments.delete(assignment.id)
            if (error) throw error
            showNotification('success', 'Assignment deleted successfully!')
            navigate('/')
        } catch (error: any) {
            console.error('Error deleting assignment:', error)
            showNotification('error', error.message || 'Failed to delete assignment')
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
                showNotification('success', 'Resubmission accepted!')
            } else {
                await api.submissions.update(submissionId, {
                    status: 'submitted',
                    new_file_url: null,
                    resubmission_justification: null
                })
                showNotification('info', 'Resubmission rejected.')
            }
            fetchAllData()
        } catch (error) {
            console.error('Error processing resubmission:', error)
            showNotification('error', 'Failed to process resubmission')
        }
    }

    const handleAssignReviews = async () => {
        if (!id || submissions.length === 0) {
            showNotification('info', 'Need at least one submission to assign reviews.')
            return
        }

        setIsConfirmAssignModalOpen(false)
        setAssigning(true)
        try {
            const { data: students, error: studentsError } = await api.auth.listStudents()
            if (studentsError) throw studentsError

            const reviewerList = students || []
            if (reviewerList.length === 0) {
                showNotification('info', 'No students found to assign reviews to.')
                return
            }

            const newReviews: any[] = []
            reviewerList.forEach(student => {
                const eligibleSubmissions = submissions.filter(s => s.student_id !== student.id)
                const shuffled = [...eligibleSubmissions].sort(() => 0.5 - Math.random())
                const selected = shuffled.slice(0, 2)

                selected.forEach(sub => {
                    newReviews.push({
                        submission_id: sub.id,
                        reviewer_id: student.id
                    })
                })
            })

            const { error: assignError } = await api.reviews.assignPeerReviews(id, newReviews)
            if (assignError) throw assignError

            showNotification('success', `Successfully assigned ${newReviews.length} reviews!`)
            fetchAllData()
        } catch (error) {
            console.error('Error assigning reviews:', error)
            showNotification('error', 'Failed to assign reviews')
        } finally {
            setAssigning(false)
        }
    }

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-400">Loading Assignment Details...</p>
        </div>
    )

    if (!assignment) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
            <div className="h-16 w-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Assignment Not Found</h2>
            <button onClick={() => navigate('/')} className="btn-mac-secondary">
                Return to Dashboard
            </button>
        </div>
    )

    const pendingRequests = submissions.filter(s => s.status === 'resubmission_pending')

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 pb-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/')}
                            className="btn-mac-secondary group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Dashboard
                        </button>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                                {isEditing ? 'Edit Assignment' : assignment.title}
                            </h1>
                            {!isEditing && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${assignment.due_date && new Date(assignment.due_date) < new Date()
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/60'
                                    : 'bg-green-100 text-green-700 dark:bg-green-900/60'
                                    }`}>
                                    {assignment.due_date && new Date(assignment.due_date) < new Date() ? 'Past Due' : 'Active'}
                                </span>
                            )}
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="btn-mac-secondary"
                            >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(true)}
                                disabled={deleting}
                                className="btn-mac-secondary text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="card-premium overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                    {/* Tabs Navigation */}
                    {!isEditing && (
                        <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 px-6">
                            {[
                                { id: 'details', label: 'Overview', icon: FileText },
                                { id: 'submissions', label: 'Submissions', icon: Check, count: submissions.length },
                                { id: 'requests', label: 'Requests', icon: AlertCircle, count: pendingRequests.length, highlight: true },
                                { id: 'reviews', label: 'Peer Reviews', icon: Users, count: reviews.length }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`py-5 px-6 border-b-2 font-black text-[10px] uppercase tracking-widest transition-all relative flex items-center gap-2 ${activeTab === tab.id
                                        ? 'border-indigo-600 text-indigo-600 translate-y-[1px]'
                                        : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    <tab.icon className={`h-3 w-3 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                    {tab.label}
                                    {tab.count !== undefined && (
                                        <span className={`ml-1 py-0.5 px-2 rounded-full text-[10px] font-black ${tab.highlight && tab.count > 0
                                            ? 'bg-orange-100 text-orange-600 animate-pulse font-black'
                                            : activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-10">
                        {isEditing ? (
                            <div className="space-y-10">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Assignment Title</label>
                                            <input
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="input-premium"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Deadline</label>
                                            <input
                                                type="datetime-local"
                                                value={formData.due_date}
                                                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                                className="input-premium"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Description / Instructions</label>
                                        <textarea
                                            rows={6}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="input-premium resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="border-t border-gray-100 dark:border-gray-800 pt-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                        <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest leading-none">Assessment Rubric</h2>
                                    </div>
                                    <div className="bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl p-6 border border-gray-50 dark:border-gray-800/50">
                                        <RubricBuilder items={rubricItems} onChange={setRubricItems} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-8 border-t border-gray-100 dark:border-gray-800">
                                    <button
                                        onClick={() => { setIsEditing(false); fetchAllData(); }}
                                        className="btn-mac-secondary px-8"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="btn-mac-primary px-10"
                                    >
                                        {saving ? (
                                            <Loader2 className="animate-spin h-5 w-5 mr-3" />
                                        ) : (
                                            <Save className="h-5 w-5 mr-3" />
                                        )}
                                        {saving ? 'Saving...' : 'Update Assignment'}
                                    </button>
                                </div>
                            </div>
                        ) : activeTab === 'details' ? (
                            <div className="animate-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                    <div className="md:col-span-2 space-y-8">
                                        <div>
                                            <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-4">Description</h3>
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                                {assignment.description || 'No description provided.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-3xl p-8 space-y-6">
                                        <div>
                                            <h3 className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">Deadline</h3>
                                            <p className="text-lg font-black text-gray-900 dark:text-white">
                                                {assignment.due_date ? new Date(assignment.due_date).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' }) : 'No deadline'}
                                            </p>
                                        </div>
                                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <h3 className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2">Created On</h3>
                                            <p className="text-sm font-bold text-gray-500">
                                                {new Date(assignment.created_at || '').toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-800 pt-10">
                                    <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-8 text-center">Grading Rubric</h3>
                                    <div className="grid gap-4">
                                        {rubricItems.map((item, idx) => (
                                            <div key={idx} className="bg-gray-50/50 dark:bg-gray-800/30 p-6 rounded-2xl border border-gray-50 dark:border-gray-800/50 flex justify-between items-center group">
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">{item.title}</h4>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.description}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                                                        {item.max_points} pts
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'submissions' ? (
                            <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Received Work</h3>
                                    <span className="text-[10px] font-bold text-gray-400 italic">Sorted by submission date</span>
                                </div>
                                <div className="grid gap-4">
                                    {submissions.length === 0 ? (
                                        <div className="text-center py-20 bg-gray-50/30 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No submissions yet</p>
                                        </div>
                                    ) : (
                                        submissions.map(sub => (
                                            <div key={sub.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:shadow-lg transition-all duration-300 group">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-indigo-600 font-black">
                                                        {sub.profile?.full_name?.charAt(0) || 'S'}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-gray-900 dark:text-white capitalize">{sub.profile?.full_name || 'Student'}</h4>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            Submitted {new Date(sub.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${sub.status === 'resubmission_pending'
                                                        ? 'bg-orange-50 text-orange-600'
                                                        : 'bg-green-50 text-green-600'
                                                        }`}>
                                                        {sub.status.replace('_', ' ')}
                                                    </span>
                                                    <button
                                                        onClick={() => { setPreviewUrl(sub.file_url); setPreviewTitle(`${sub.profile?.full_name}'s Submission`); }}
                                                        className="btn-mac-secondary h-9 px-4 text-[10px]"
                                                    >
                                                        <Eye className="h-3 w-3 mr-2" /> View File
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ) : activeTab === 'requests' ? (
                            <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-6">
                                <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Resubmission Requests</h3>
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-20">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No pending requests</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-6">
                                        {pendingRequests.map(sub => (
                                            <div key={sub.id} className="card-premium p-8 bg-orange-50/10 border-orange-100 dark:border-orange-900/30">
                                                <div className="flex justify-between items-start gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-4">
                                                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-black">
                                                                {sub.profile?.full_name?.charAt(0)}
                                                            </div>
                                                            <h4 className="text-lg font-black text-gray-900 dark:text-white capitalize">{sub.profile?.full_name}</h4>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h5 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Justification</h5>
                                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-800/10 p-4 rounded-xl">
                                                                    {sub.resubmission_justification || 'No justification provided.'}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <button
                                                                    onClick={() => { setPreviewUrl(sub.new_file_url!); setPreviewTitle(`New File: ${sub.profile?.full_name}`); }}
                                                                    className="btn-mac-secondary text-[10px] h-9 px-4 border-orange-200 text-orange-700 bg-white"
                                                                >
                                                                    Review New File
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-2">
                                                        <button
                                                            onClick={() => handleResubmission(sub.id, true)}
                                                            className="btn-mac-primary bg-orange-600 hover:bg-orange-700 h-10 px-6"
                                                        >
                                                            Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleResubmission(sub.id, false)}
                                                            className="btn-mac-secondary border-red-200 text-red-600 h-10 px-6"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="animate-in slide-in-from-bottom-2 duration-300 space-y-10">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Peer Assessment Progress</h3>
                                    <button
                                        onClick={() => setIsConfirmAssignModalOpen(true)}
                                        disabled={assigning}
                                        className="btn-mac-primary h-11 px-6 text-xs"
                                    >
                                        <Users className="h-4 w-4 mr-2" />
                                        {assigning ? 'Distributing...' : 'Redistribute Reviews'}
                                    </button>
                                </div>

                                {reviews.length === 0 ? (
                                    <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                        <Users className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                                        <p className="text-gray-500 font-bold text-sm mb-6">No reviews have been assigned yet.</p>
                                        <button onClick={() => setIsConfirmAssignModalOpen(true)} className="btn-mac-primary inline-flex">
                                            Assign Reviews Now
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {reviews.map(review => (
                                            <div key={review.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all">
                                                <div className="flex flex-col gap-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex -space-x-4">
                                                                <div className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-black text-indigo-600 dark:text-indigo-400" title="Reviewer">
                                                                    {review.reviewer?.full_name?.charAt(0)}
                                                                </div>
                                                                <div className="h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-black text-emerald-600 dark:text-emerald-400" title="Author">
                                                                    {review.submission?.profile?.full_name?.charAt(0)}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-black text-gray-900 dark:text-white capitalize">
                                                                    {review.reviewer?.full_name} <span className="text-gray-400 font-medium">reviewing</span> {review.submission?.profile?.full_name}
                                                                </div>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${review.score !== null ? 'text-green-600' : 'text-gray-400'}`}>
                                                                        {review.score !== null ? 'Completed' : 'Pending'}
                                                                    </span>
                                                                    {review.score !== null && (
                                                                        <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                                                                    )}
                                                                    {review.score !== null && (
                                                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                                                            Score: {review.score}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {review.score !== null && review.feedback && typeof review.feedback === 'object' && (
                                                        <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-6">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {rubricItems.map((item) => {
                                                                    const fb = review.feedback as any;
                                                                    const score = fb?.scores?.[item.id] || 0;
                                                                    const comment = fb?.criteriaFeedback?.[item.id] || '';

                                                                    return (
                                                                        <div key={item.id} className="bg-gray-50/50 dark:bg-gray-900/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800/50">
                                                                            <div className="flex justify-between items-center mb-2">
                                                                                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.title}</span>
                                                                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">
                                                                                    {score}/{item.max_points} pts
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                                                "{comment || 'No comment provided.'}"
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            {(review.feedback as any).overallTips && (
                                                                <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100/20 dark:border-indigo-800/20">
                                                                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Overall Tips</p>
                                                                    <p className="text-xs font-bold text-gray-600 dark:text-gray-400 italic">"{(review.feedback as any).overallTips}"</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
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

            {/* Modals */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Assignment"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="btn-mac-secondary">Cancel</button>
                        <button onClick={handleDelete} className="btn-mac-primary bg-red-600 hover:bg-red-700 shadow-red-100 dark:shadow-none font-black uppercase tracking-widest text-xs">Confirm Delete</button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        Are you sure you want to delete <span className="font-black text-gray-900 dark:text-white">"{assignment.title}"</span>?
                    </p>
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
                        <p className="text-xs font-bold text-red-700 dark:text-red-400 leading-relaxed">
                            <span className="font-black uppercase tracking-widest block mb-1 underline underline-offset-4 decoration-red-200">Destructive Action</span>
                            All student submissions, peer reviews, and grading data associated with this assignment will be permanently erased.
                        </p>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={isConfirmAssignModalOpen}
                onClose={() => setIsConfirmAssignModalOpen(false)}
                title="Redistribute Reviews"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button onClick={() => setIsConfirmAssignModalOpen(false)} className="btn-mac-secondary">Cancel</button>
                        <button onClick={handleAssignReviews} disabled={assigning} className="btn-mac-primary">
                            {assigning ? 'Processing...' : 'Assign Reviews'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        This will automatically assign 2 peer reviews to every student.
                    </p>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed">
                            <span className="font-black uppercase tracking-widest block mb-1">Note</span>
                            Existing review assignments for this project will be overwritten. Completed reviews will be preserved but may be re-ordered.
                        </p>
                    </div>
                </div>
            </Modal>

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
