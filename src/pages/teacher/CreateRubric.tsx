import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import RubricBuilder, { type RubricItem } from '../../components/RubricBuilder'

export default function CreateRubric() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [rubricItems, setRubricItems] = useState<RubricItem[]>([])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!title.trim()) {
            alert('Please enter a rubric title')
            return
        }

        if (rubricItems.length === 0) {
            alert('Please add at least one criteria')
            return
        }

        setLoading(true)
        try {
            const { error } = await api.rubrics.create({
                title,
                assignment_id: null,
                criteria: rubricItems as any
            })

            if (error) throw error

            navigate('/teacher/rubrics')
        } catch (error) {
            console.error('Error creating rubric:', error)
            alert('Failed to create rubric')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <button
                        onClick={() => navigate('/teacher')}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Dashboard
                    </button>
                    <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">Create Rubric Template</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rubric Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                            placeholder="e.g. Standard Essay Rubric"
                        />
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                        <RubricBuilder items={rubricItems} onChange={setRubricItems} />
                    </div>

                    <div className="flex justify-end pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" /> : <Save className="-ml-1 mr-2 h-5 w-5" />}
                            Save Template
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
