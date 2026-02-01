import React from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
    footer?: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-6 py-6">
                    {children}
                </div>

                {footer && (
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}
