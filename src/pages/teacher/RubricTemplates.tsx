import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Rubric } from '../../lib/api'

export default function RubricTemplates() {
    const navigate = useNavigate()
    const [templates, setTemplates] = useState<Rubric[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            const { data, error } = await api.rubrics.listTemplates()
            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error fetching templates:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <button
                        onClick={() => navigate('/teacher')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex justify-between items-center mt-4">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rubric Templates</h1>
                        <Link
                            to="/teacher/rubrics/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" />
                            Create Template
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No templates found</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create a rubric template to assume for assignments.</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {templates.map((template) => (
                                <li key={template.id}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                                {template.title || 'Untitled Rubric'}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    Template
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Criteria: {(template.criteria as any[]).length} items
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    )
}
