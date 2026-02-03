import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, FileText, Loader2 } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Rubric } from '../../lib/api'
import { type RubricItem } from '../../components/RubricBuilder'

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

    const calculateTotalPoints = (criteria: RubricItem[]): number => {
        let total = 0
        const addPoints = (items: RubricItem[]) => {
            items.forEach(item => {
                if (item.subcriteria && item.subcriteria.length > 0) {
                    addPoints(item.subcriteria)
                } else {
                    total += item.max_points
                }
            })
        }
        addPoints(criteria)
        return total
    }

    const handleTemplateClick = (templateId: string) => {
        // Navigate to edit page
        navigate(`/teacher/rubrics/edit/${templateId}`)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-6">
                <div>
                    <button
                        onClick={() => navigate('/teacher')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Rubric Templates</h1>
                        <Link
                            to="/teacher/rubrics/new"
                            className="btn-mac-primary h-11 px-6"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            <span className="font-black uppercase tracking-widest text-[11px]">Create Template</span>
                        </Link>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : templates.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-gray-100">No templates found</h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Create a rubric template to reuse for assignments.</p>
                        <div className="mt-6">
                            <Link to="/teacher/rubrics/new" className="btn-mac-primary inline-flex h-11 px-6">
                                <Plus className="h-5 w-5 mr-2" />
                                Create Your First Template
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {templates.map((template) => {
                            const criteria = template.criteria as unknown as RubricItem[]
                            const totalPoints = calculateTotalPoints(criteria)
                            const criteriaCount = criteria.length
                            const hasSubcriteria = criteria.some(c => c.subcriteria && c.subcriteria.length > 0)

                            return (
                                <div
                                    key={template.id}
                                    onClick={() => handleTemplateClick(template.id)}
                                    className="card-premium p-6 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 cursor-pointer transition-all group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                                    {template.title || (criteria[0]?.title ? `${criteria[0].title}${criteriaCount > 1 ? ` +${criteriaCount - 1} more` : ''}` : 'Rubric Template')}
                                                </h3>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                <span className="flex items-center gap-1">
                                                    <span className="font-bold">{criteriaCount}</span> {criteriaCount === 1 ? 'criterion' : 'criteria'}
                                                </span>
                                                {hasSubcriteria && (
                                                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                                                        Hierarchical
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    Total: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalPoints} pts</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest">
                                                Template
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Click to edit or use for assignment
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/teacher/assignments/new', { state: { rubricTemplateId: template.id } });
                                                }}
                                                className="btn-mac-primary !h-8 px-4 !bg-emerald-600 hover:!bg-emerald-700"
                                            >
                                                <span className="text-[9px]">USE FOR ASSIGNMENT</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
