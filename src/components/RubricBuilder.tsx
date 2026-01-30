import { Plus, Trash2 } from 'lucide-react'

export interface RubricItem {
    id: string
    title: string
    description: string
    max_points: number
}

interface RubricBuilderProps {
    items: RubricItem[]
    onChange: (items: RubricItem[]) => void
}

export default function RubricBuilder({ items, onChange }: RubricBuilderProps) {
    const addItem = () => {
        const newItem: RubricItem = {
            id: crypto.randomUUID(),
            title: '',
            description: '',
            max_points: 10,
        }
        onChange([...items, newItem])
    }

    const updateItem = (id: string, field: keyof RubricItem, value: string | number) => {
        onChange(items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ))
    }

    const removeItem = (id: string) => {
        onChange(items.filter(item => item.id !== id))
    }

    const totalPoints = items.reduce((sum, item) => sum + (Number(item.max_points) || 0), 0)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Rubric Criteria</h3>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Points: {totalPoints}
                </span>
            </div>

            <div className="space-y-4">
                {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 relative group">
                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-4">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Criteria Title</label>
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="e.g. Content Quality"
                                />
                            </div>
                            <div className="md:col-span-6">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</label>
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                    placeholder="Evaluate the accuracy of facts..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Points</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={item.max_points}
                                    onChange={(e) => updateItem(item.id, 'max_points', parseInt(e.target.value) || 0)}
                                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <Plus className="-ml-0.5 mr-2 h-4 w-4 text-gray-500" />
                Add Criteria
            </button>
        </div>
    )
}
