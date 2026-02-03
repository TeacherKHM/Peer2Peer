import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import './RubricBuilder.css'

export interface RubricItem {
    id: string
    title: string
    description: string
    max_points: number
    subcriteria?: RubricItem[]
    section_name?: string
}

interface RubricBuilderProps {
    items: RubricItem[]
    onChange: (items: RubricItem[]) => void
}

export default function RubricBuilder({ items, onChange }: RubricBuilderProps) {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedItems)
        if (newExpanded.has(id)) {
            newExpanded.delete(id)
        } else {
            newExpanded.add(id)
        }
        setExpandedItems(newExpanded)
    }

    const addItem = () => {
        const newItem: RubricItem = {
            id: crypto.randomUUID(),
            title: '',
            description: '',
            max_points: 10,
            subcriteria: []
        }
        onChange([...items, newItem])
        setExpandedItems(new Set([...expandedItems, newItem.id]))
    }

    const addSubcriteria = (parentId: string) => {
        const newSubItem: RubricItem = {
            id: crypto.randomUUID(),
            title: '',
            description: '',
            max_points: 5
        }

        const updatedItems = items.map(item => {
            if (item.id === parentId) {
                return {
                    ...item,
                    subcriteria: [...(item.subcriteria || []), newSubItem]
                }
            }
            return item
        })

        onChange(updatedItems)
        setExpandedItems(new Set([...expandedItems, parentId]))
    }

    const updateItem = (id: string, field: keyof RubricItem, value: string | number, parentId?: string) => {
        if (parentId) {
            // Update subcriteria
            onChange(items.map(item => {
                if (item.id === parentId) {
                    return {
                        ...item,
                        subcriteria: item.subcriteria?.map(sub =>
                            sub.id === id ? { ...sub, [field]: value } : sub
                        )
                    }
                }
                return item
            }))
        } else {
            // Update parent item
            onChange(items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            ))
        }
    }

    const removeItem = (id: string, parentId?: string) => {
        if (parentId) {
            // Remove subcriteria
            onChange(items.map(item => {
                if (item.id === parentId) {
                    return {
                        ...item,
                        subcriteria: item.subcriteria?.filter(sub => sub.id !== id)
                    }
                }
                return item
            }))
        } else {
            // Remove parent item
            onChange(items.filter(item => item.id !== id))
        }
    }

    const calculateTotal = (item: RubricItem): number => {
        if (item.subcriteria && item.subcriteria.length > 0) {
            return item.subcriteria.reduce((sum, sub) => sum + (Number(sub.max_points) || 0), 0)
        }
        return Number(item.max_points) || 0
    }

    const totalPoints = items.reduce((sum, item) => sum + calculateTotal(item), 0)

    const renderItem = (item: RubricItem, index: number, parentId?: string, parentIndex?: number) => {
        const hasSubcriteria = item.subcriteria && item.subcriteria.length > 0
        const isExpanded = expandedItems.has(item.id)
        const itemNumber = parentIndex !== undefined
            ? `${parentIndex + 1}.${index + 1}`
            : `${index + 1}.`
        const calculatedTotal = calculateTotal(item)
        const isParent = !parentId

        return (
            <div key={item.id} className={parentIndex !== undefined ? '' : ''}>
                <div className={`relative group bg-white dark:bg-gray-900/50 p-6 rounded-2xl border transition-all ${isParent
                        ? 'border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 mt-3 ml-8'
                    }`}>
                    <button
                        type="button"
                        onClick={() => removeItem(item.id, parentId)}
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>

                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            {isParent && hasSubcriteria && (
                                <button
                                    type="button"
                                    onClick={() => toggleExpanded(item.id)}
                                    className="mt-2 text-gray-400 hover:text-indigo-500 transition-colors"
                                >
                                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                                </button>
                            )}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-1 flex items-center">
                                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{itemNumber}</span>
                                </div>
                                {isParent ? (
                                    <>
                                        <div className="md:col-span-4">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Criteria Title</label>
                                            <input
                                                type="text"
                                                value={item.title}
                                                onChange={(e) => updateItem(item.id, 'title', e.target.value, parentId)}
                                                className="input-premium py-2 px-4"
                                                placeholder="e.g. Introduction"
                                            />
                                        </div>
                                        <div className="md:col-span-5">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, 'description', e.target.value, parentId)}
                                                className="input-premium py-2 px-4"
                                                placeholder="Brief explanation..."
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="md:col-span-9">
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => updateItem(item.id, 'description', e.target.value, parentId)}
                                            className="input-premium py-2 px-4"
                                            placeholder="What to evaluate..."
                                        />
                                    </div>
                                )}
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                        {hasSubcriteria ? 'Total' : 'Points'}
                                    </label>
                                    {hasSubcriteria ? (
                                        <div className="h-[42px] flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                                {calculatedTotal}
                                            </span>
                                        </div>
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            value={item.max_points}
                                            onChange={(e) => updateItem(item.id, 'max_points', parseInt(e.target.value) || 0, parentId)}
                                            className="input-premium no-spinner py-2 px-4 text-center font-black text-indigo-600"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {isParent && (
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => addSubcriteria(item.id)}
                                    className="btn-mac-secondary py-2 px-4 text-xs border border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-400"
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Add Subcriteria
                                </button>
                            </div>
                        )}

                        {isParent && hasSubcriteria && isExpanded && (
                            <div className="space-y-3 -mx-6 -mb-6 mt-4">
                                {item.subcriteria!.map((subItem, subIndex) =>
                                    renderItem(subItem, subIndex, item.id, index)
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

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
                {items.map((item, index) => renderItem(item, index))}
            </div>

            <button
                type="button"
                onClick={addItem}
                className="btn-mac-secondary w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 bg-transparent hover:border-indigo-400 hover:bg-indigo-50/10 transition-all flex items-center justify-center group"
            >
                <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform" />
                <span className="uppercase tracking-widest font-black text-[10px]">Add New Criteria</span>
            </button>
        </div>
    )
}
