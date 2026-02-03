import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Loader2, Save, FileText, Globe, Link } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import RubricBuilder, { type RubricItem } from '../../components/RubricBuilder'
import type { Rubric } from '../../lib/api'
import { useNotification } from '../../contexts/NotificationContext'

export default function CreateAssignment() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()
    const { showNotification } = useNotification()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [submissionType, setSubmissionType] = useState<'pdf' | 'google_docs' | 'url'>('pdf')
    const [rubricItems, setRubricItems] = useState<RubricItem[]>([])

    // Rubric Template Logic
    const [templates, setTemplates] = useState<Rubric[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState('')

    useEffect(() => {
        api.rubrics.listTemplates().then(({ data }: { data: Rubric[] | null }) => {
            if (data) {
                setTemplates(data)

                // Check if we came from RubricTemplates with a specific template
                const state = location.state as { rubricTemplateId?: string }
                if (state?.rubricTemplateId) {
                    const template = data.find(t => t.id === state.rubricTemplateId)
                    if (template) {
                        setSelectedTemplate(template.id)
                        const items = (template.criteria as any[]).map(item => ({
                            ...item,
                            id: crypto.randomUUID()
                        }))
                        setRubricItems(items)
                    }
                }
            }
        })
    }, [location.state])

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId)
        if (!templateId) {
            setRubricItems([])
            return
        }

        const template = templates.find(t => t.id === templateId)
        if (template && Array.isArray(template.criteria)) {
            // Clone items with new IDs to avoid reference issues
            const items = (template.criteria as any[]).map(item => ({
                ...item,
                id: crypto.randomUUID()
            }))
            setRubricItems(items)
            showNotification('success', `Applying template: ${template.title || 'Untitled'}`)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setLoading(true)
        try {
            // 1. Create Assignment
            const { data: assignmentData, error: assignmentError } = await api.assignments.create({
                title,
                description,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
                submission_type: submissionType,
                created_by: user.id
            })

            if (assignmentError) throw assignmentError

            // 2. Create Rubric
            if (rubricItems.length > 0 && assignmentData) {
                const { error: rubricError } = await api.rubrics.create({
                    assignment_id: assignmentData.id,
                    criteria: rubricItems as any
                })

                if (rubricError) throw rubricError
            }

            showNotification('success', 'Assignment created successfully!')
            navigate('/')
        } catch (error) {
            console.error('Error creating assignment:', error)
            showNotification('error', 'Failed to create assignment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-mac-secondary mb-6 group"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Dashboard
                        </button>
                        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Create Assignment</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Define the task and assessment criteria for your students.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="card-premium p-10 bg-white dark:bg-gray-900 space-y-10 border border-gray-100 dark:border-gray-800">
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest leading-none">General Information</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Assignment Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="input-premium"
                                        placeholder="e.g. Midterm Research Project"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Instructions & Description</label>
                                    <textarea
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="input-premium resize-none"
                                        placeholder="What should students focus on? Any specific requirements?"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Submission Deadline</label>
                                    <input
                                        type="datetime-local"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="input-premium"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-3">Submission Type</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSubmissionType('pdf')}
                                            className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2 ${submissionType === 'pdf'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <FileText className="h-5 w-5" />
                                            <span>PDF</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubmissionType('google_docs')}
                                            className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2 ${submissionType === 'google_docs'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Globe className="h-5 w-5" />
                                            <span>Google Docs</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setSubmissionType('url')}
                                            className={`py-3 px-4 rounded-xl border-2 text-sm font-bold transition-all flex flex-col items-center gap-2 ${submissionType === 'url'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                                : 'border-gray-100 dark:border-gray-800 text-gray-500 hover:border-gray-200'
                                                }`}
                                        >
                                            <Link className="h-5 w-5" />
                                            <span>Web URL</span>
                                        </button>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {submissionType === 'pdf' && 'Students will upload PDF files'}
                                        {submissionType === 'google_docs' && 'Students will submit Google Docs share links'}
                                        {submissionType === 'url' && 'Students will submit website URLs (for web development projects)'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                                    <h2 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest leading-none">Assessment Rubric</h2>
                                </div>

                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                                    <label className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest pl-2">Template</label>
                                    <select
                                        value={selectedTemplate}
                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                        className="bg-transparent border-none text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-0 cursor-pointer"
                                    >
                                        <option value="">Choose a starting point...</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.title || 'Untitled'}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50/50 dark:bg-gray-800/20 rounded-3xl p-6 border border-gray-50 dark:border-gray-800/50">
                                <RubricBuilder items={rubricItems} onChange={setRubricItems} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-mac-primary h-14 px-10 shadow-indigo-100 dark:shadow-none"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5 mr-3" />
                            ) : (
                                <Save className="h-5 w-5 mr-3" />
                            )}
                            <span className="font-black uppercase tracking-widest text-sm">
                                {loading ? 'Creating Assignment...' : 'Publish Assignment'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
