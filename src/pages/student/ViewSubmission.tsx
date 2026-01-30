import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Send, Loader2, FileCheck, UploadCloud, Eye } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import type { Assignment, Submission } from '../../lib/api'
import PDFViewer from '../../components/PDFViewer'

export default function ViewSubmission() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [submission, setSubmission] = useState<Submission | null>(null)
    const [loading, setLoading] = useState(true)
    const [isRequesting, setIsRequesting] = useState(false)
    const [justification, setJustification] = useState('')
    const [newFile, setNewFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    useEffect(() => {
        if (id && user) fetchData()
    }, [id, user])

    const fetchData = async () => {
        try {
            const [assignmentRes, submissionsRes] = await Promise.all([
                api.assignments.get(id!),
                api.submissions.list(user!.id)
            ])

            setAssignment(assignmentRes.data)
            const found = submissionsRes.data?.find(s => s.assignment_id === id)
            setSubmission(found || null)
        } catch (error) {
            console.error('Error fetching submission data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleRequestResubmission = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!submission || !newFile || !justification) return

        setSubmitting(true)
        try {
            // 1. Upload the NEW file
            const fileExt = newFile.name.split('.').pop()
            const fileName = `${user!.id}/${id}-resubmission-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await api.storage.uploadFile('submissions', filePath, newFile)
            if (uploadError) throw uploadError

            const publicUrl = api.storage.getPublicUrl('submissions', filePath)

            // 2. Update submission record with pending status
            const { error: updateError } = await api.submissions.update(submission.id, {
                status: 'resubmission_pending',
                resubmission_justification: justification,
                new_file_url: publicUrl
            })

            if (updateError) throw updateError

            alert('Resubmission request sent to teacher!')
            setIsRequesting(false)
            fetchData()
        } catch (error) {
            console.error('Error requesting resubmission:', error)
            alert('Failed to send request.')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading your submission...</div>
    if (!assignment || !submission) return <div className="p-8 text-center">Submission not found.</div>

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-6">
                <button
                    onClick={() => navigate('/')}
                    className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Dashboard
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-start">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{assignment.title}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wider font-semibold">
                                My Submission
                            </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${submission.status === 'resubmission_pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                            }`}>
                            {submission.status === 'resubmission_pending' ? 'RESUBMISSION PENDING' : 'SUBMITTED'}
                        </div>
                    </div>

                    <div className="p-6 space-y-8">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-4">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                    <FileCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">Uploaded Document</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Submitted on {new Date(submission.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={() => setPreviewUrl(submission.file_url)}
                                    className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                    <Eye className="mr-1 h-4 w-4" /> Preview
                                </button>
                                <a
                                    href={submission.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                >
                                    External <ExternalLink className="ml-1 h-4 w-4" />
                                </a>
                            </div>
                        </div>

                        {previewUrl && (
                            <PDFViewer
                                url={previewUrl}
                                title={assignment.title}
                                onClose={() => setPreviewUrl(null)}
                            />
                        )}

                        {submission.status === 'submitted' && !isRequesting && (
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    onClick={() => setIsRequesting(true)}
                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                                >
                                    Need to make changes? Request a resubmission
                                </button>
                            </div>
                        )}

                        {isRequesting && (
                            <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-6 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Resubmission</h3>
                                    <button onClick={() => setIsRequesting(false)} className="text-gray-400 hover:text-gray-500">
                                        Cancel
                                    </button>
                                </div>

                                <form onSubmit={handleRequestResubmission} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Justification
                                        </label>
                                        <textarea
                                            required
                                            rows={3}
                                            value={justification}
                                            onChange={(e) => setJustification(e.target.value)}
                                            placeholder="Why do you need to resubmit?"
                                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700/50 dark:text-white px-3 py-2"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            New File
                                        </label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                                            <div className="space-y-1 text-center">
                                                <UploadCloud className="mx-auto h-10 w-10 text-gray-400" />
                                                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                                    <label htmlFor="resubmit-file" className="relative cursor-pointer font-medium text-indigo-600 hover:text-indigo-500">
                                                        <span>{newFile ? 'Change file' : 'Select new file'}</span>
                                                        <input
                                                            id="resubmit-file"
                                                            name="resubmit-file"
                                                            type="file"
                                                            className="sr-only"
                                                            onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                                                        />
                                                    </label>
                                                </div>
                                                <p className="text-xs text-gray-500">{newFile?.name || 'PDF, DOCX up to 10MB'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={submitting || !newFile || !justification}
                                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {submitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
                                            Send Request
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {submission.status === 'resubmission_pending' && (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/30 rounded-lg">
                                <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-400">Request Pending</h3>
                                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
                                    Your request to resubmit is currently being reviewed by your teacher.
                                </p>
                                <div className="mt-3 text-xs text-yellow-600 dark:text-yellow-600 italic">
                                    " {submission.resubmission_justification} "
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
