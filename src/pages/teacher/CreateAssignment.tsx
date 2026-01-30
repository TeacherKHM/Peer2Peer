import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import { useAuth } from '../../contexts/AuthContext'
import RubricBuilder, { type RubricItem } from '../../components/RubricBuilder'
import type { Rubric } from '../../lib/api'

export default function CreateAssignment() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [rubricItems, setRubricItems] = useState<RubricItem[]>([])

    // Rubric Template Logic
    const [templates, setTemplates] = useState<Rubric[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState('')

    useEffect(() => {
        api.rubrics.listTemplates().then(({ data }: { data: Rubric[] | null }) => {
            if (data) setTemplates(data)
        })
    }, [])

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId)
        if (!templateId) return

        const template = templates.find(t => t.id === templateId)
        if (template && Array.isArray(template.criteria)) {
            // Clone items with new IDs to avoid reference issues
            const items = (template.criteria as any[]).map(item => ({
                ...item,
                id: crypto.randomUUID()
            }))
            setRubricItems(items)
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
                created_by: user.id
            })

            if (assignmentError) throw assignmentError

            // 2. Create Rubric
            if (rubricItems.length > 0 && assignmentData) {
                const { error: rubricError } = await api.rubrics.create({
                    assignment_id: assignmentData.id,
                    criteria: rubricItems as any // Cast to any to avoid Json compatibility issues
                })

                if (rubricError) throw rubricError
            }

            navigate('/')
        } catch (error) {
            console.error('Error creating assignment:', error)
            alert('Failed to create assignment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <button
                        onClick={() => navigate('/')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Create New Assignment</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignment Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                                placeholder="e.g. History Essay Review"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                rows={4}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                                placeholder="Instructions for the students..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Assessment Rubric</h3>

                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-700 dark:text-gray-300">Import Template:</label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                                >
                                    <option value="">Select a template...</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.title || 'Untitled'}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <RubricBuilder items={rubricItems} onChange={setRubricItems} />
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Save className="-ml-1 mr-2 h-5 w-5" />}
                            Create Assignment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
