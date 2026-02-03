import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import RubricBuilder, { type RubricItem } from '../../components/RubricBuilder'

export default function CreateRubric() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(!!id)
    const [title, setTitle] = useState('')
    const [rubricItems, setRubricItems] = useState<RubricItem[]>([])

    useEffect(() => {
        if (id) {
            fetchRubric()
        }
    }, [id])

    const fetchRubric = async () => {
        try {
            const { data, error } = await api.rubrics.getById(id!)
            if (error) throw error
            if (data) {
                setTitle(data.title || '')
                setRubricItems(data.criteria as unknown as RubricItem[])
            }
        } catch (error) {
            console.error('Error fetching rubric:', error)
            alert('Failed to load rubric')
        } finally {
            setInitialLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (rubricItems.length === 0) {
            alert('Please add at least one criteria')
            return
        }

        setLoading(true)
        try {
            if (id) {
                // Update existing rubric
                const { error } = await api.rubrics.update(id, {
                    title: title.trim() || null,
                    criteria: rubricItems as any
                })
                if (error) throw error
            } else {
                // Create new rubric
                const { error } = await api.rubrics.create({
                    assignment_id: null,
                    title: title.trim() || null,
                    criteria: rubricItems as any
                })
                if (error) throw error
            }

            navigate('/teacher/rubrics')
        } catch (error) {
            console.error('Error saving rubric:', error)
            alert('Failed to save rubric')
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <button
                        onClick={() => navigate('/teacher/rubrics')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Templates
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                        {id ? 'Edit Rubric Template' : 'Create Rubric Template'}
                    </h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Template Title <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                            placeholder="e.g. Standard Essay Rubric"
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Give this template a name to easily identify it later
                        </p>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                        <RubricBuilder items={rubricItems} onChange={setRubricItems} />
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/teacher/rubrics')}
                            className="btn-mac-secondary h-11 px-6"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-mac-primary h-11 px-6"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            <span className="font-black uppercase tracking-widest text-[11px]">
                                {id ? 'Update Template' : 'Save Template'}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
