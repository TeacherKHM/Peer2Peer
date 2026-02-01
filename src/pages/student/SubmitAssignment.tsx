import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'

export default function SubmitAssignment() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { showNotification } = useNotification()
    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [file, setFile] = useState<File | null>(null)

    useEffect(() => {
        if (id) fetchAssignment()
    }, [id])

    const fetchAssignment = async () => {
        try {
            const { data, error } = await api.assignments.get(id!)
            if (error) throw error
            setAssignment(data)
        } catch (error) {
            console.error('Error fetching assignment:', error)
            showNotification('error', 'Assignment not found')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            showNotification('error', 'You must be logged in to submit.')
            return
        }
        if (!id) {
            showNotification('error', 'Error: Assignment ID is missing.')
            return
        }
        if (!file) {
            showNotification('info', 'Please select a file to upload.')
            return
        }

        setSubmitting(true)
        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await api.storage.uploadFile('submissions', filePath, file)
            if (uploadError) throw uploadError

            const publicUrl = api.storage.getPublicUrl('submissions', filePath)
            const { error: submitError } = await api.submissions.create({
                assignment_id: id,
                student_id: user.id,
                file_url: publicUrl
            })

            if (submitError) throw submitError

            showNotification('success', 'Assignment submitted successfully!')
            navigate('/')
        } catch (error) {
            console.error('Error submitting:', error)
            showNotification('error', 'Failed to submit: ' + ((error as any).message || 'Unknown error'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!assignment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 space-y-4">
                <p className="text-lg font-bold text-gray-900 dark:text-white">Assignment not found</p>
                <button onClick={() => navigate('/')} className="btn-mac-secondary">Back to Dashboard</button>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-12 px-4">
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-mac-secondary mb-6 group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Dashboard
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Submit Assignment</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Please review the instructions before uploading.</p>
                    </div>
                </div>

                <div className="card-premium p-10 bg-white dark:bg-gray-900 space-y-10 border border-gray-100 dark:border-gray-800">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Assignment Overview</h2>
                        </div>
                        <div className="p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-100 mb-2">
                                {assignment.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Due Date:</span>
                                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                                    {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'No due date'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Instructions</h2>
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap font-medium">
                            {assignment.description || 'No instructions provided.'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 pt-4">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">Upload Document</h2>
                            </div>

                            <div
                                className={`group relative flex flex-col items-center justify-center min-h-[220px] rounded-3xl border-2 border-dashed transition-all duration-300 ${file
                                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                                        : 'border-gray-200 dark:border-gray-800 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                            >
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <div className="text-center p-8">
                                    <div className={`mx-auto h-16 w-16 mb-4 rounded-2xl flex items-center justify-center transition-all ${file ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'
                                        }`}>
                                        <UploadCloud className="h-8 w-8" />
                                    </div>
                                    <p className="text-lg font-black text-gray-900 dark:text-white mb-1">
                                        {file ? 'File Attached' : 'Drop your file here'}
                                    </p>
                                    <p className="text-sm font-bold text-gray-400">
                                        {file ? file.name : 'PDF, DOCX, or ZIP up to 10MB'}
                                    </p>
                                    {file && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setFile(null); }}
                                            className="mt-4 text-xs font-black text-red-500 hover:text-red-600 uppercase tracking-widest relative z-20"
                                        >
                                            Remove File
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={submitting || !file}
                                className="w-full btn-mac-primary h-14 text-base shadow-indigo-100 dark:shadow-none"
                            >
                                {submitting ? (
                                    <Loader2 className="animate-spin h-6 w-6 mr-3" />
                                ) : (
                                    <UploadCloud className="h-6 w-6 mr-3" />
                                )}
                                <span className="font-black uppercase tracking-widest">
                                    {submitting ? 'Uploading Submission...' : 'Send Submission'}
                                </span>
                            </button>
                            <p className="text-center text-[10px] font-bold text-gray-400 mt-4 uppercase tracking-widest">
                                By submitting, you agree to have your work reviewed by peers.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
