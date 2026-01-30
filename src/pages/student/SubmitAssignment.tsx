import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, UploadCloud } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function SubmitAssignment() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { user } = useAuth()
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
            alert('Assignment not found')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            alert('You must be logged in to submit.')
            return
        }
        if (!id) {
            alert('Error: Assignment ID is missing.')
            return
        }
        if (!file) {
            alert('Please select a file to upload.')
            return
        }

        setSubmitting(true)
        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${id}-${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            console.log('Uploading file...', filePath)
            const { error: uploadError } = await api.storage.uploadFile('submissions', filePath, file)

            if (uploadError) throw uploadError

            // 2. Get Public URL
            const publicUrl = api.storage.getPublicUrl('submissions', filePath)

            // 3. Create Submission record
            console.log('Creating submission record with URL:', publicUrl)
            const { error: submitError } = await api.submissions.create({
                assignment_id: id,
                student_id: user.id,
                file_url: publicUrl
            })

            if (submitError) throw submitError

            alert('Assignment submitted successfully!')
            navigate('/')
        } catch (error) {
            console.error('Error submitting:', error)
            alert('Failed to submit assignment: ' + ((error as any).message || 'Unknown error'))
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block mr-2" /> Loading...</div>
    if (!assignment) return <div className="p-8 text-center">Assignment not found</div>

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Submit Assignment</h1>
                    <div className="mt-2 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                        <p className="text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                            {assignment.title}
                        </p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow space-y-8">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Instructions</h3>
                        <div className="mt-2 prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700/30 p-4 rounded-md">
                            {assignment.description || 'No instructions provided.'}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 border-t border-gray-200 dark:border-gray-700 pt-8">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Upload Document (PDF, Word, etc.)
                            </label>

                            <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${file ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-300 dark:border-gray-600'}`}>
                                <div className="space-y-1 text-center">
                                    <UploadCloud className={`mx-auto h-12 w-12 ${file ? 'text-indigo-500' : 'text-gray-400'}`} />
                                    <div className="flex text-sm text-gray-600 dark:text-gray-400">
                                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                                            <span>{file ? 'Change file' : 'Select a file'}</span>
                                            <input
                                                id="file-upload"
                                                name="file-upload"
                                                type="file"
                                                className="sr-only"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            />
                                        </label>
                                        <p className="pl-1">or drag and drop</p>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {file ? `Selected: ${file.name}` : 'PDF, DOCX, etc. up to 10MB'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={submitting || !file}
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
                            >
                                {submitting ? <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" /> : <UploadCloud className="-ml-1 mr-3 h-5 w-5" />}
                                {submitting ? 'Uploading...' : 'Submit Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
