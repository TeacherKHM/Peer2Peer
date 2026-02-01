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
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Grading Criteria</h3>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Weight:</span>
                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-black border border-indigo-100 dark:border-indigo-800">
                        {totalPoints} pts
                    </span>
                </div>
            </div>

            <div className="grid gap-6">
                {items.map((item) => (
                    <div key={item.id} className="relative group bg-white dark:bg-gray-900/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
                        <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Item Title</label>
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                                    className="input-premium py-2 px-4"
                                    placeholder="e.g. Code Quality"
                                />
                            </div>
                            <div className="md:col-span-6">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detailed Description</label>
                                <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                    className="input-premium py-2 px-4"
                                    placeholder="Brief explanation of what to look for..."
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Max Points</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={item.max_points}
                                    onChange={(e) => updateItem(item.id, 'max_points', parseInt(e.target.value) || 0)}
                                    className="input-premium py-2 px-4 text-center font-black text-indigo-600"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addItem}
                className="btn-mac-secondary w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent hover:border-indigo-400 hover:bg-indigo-50/10 transition-all flex items-center justify-center group"
            >
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                <span className="uppercase tracking-widest font-black text-[10px]">Add New Rubric Item</span>
            </button>
        </div>
    )
}
