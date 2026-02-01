import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

type NotificationType = 'success' | 'error' | 'info'

interface Notification {
    id: string
    type: NotificationType
    message: string
}

interface NotificationContextType {
    showNotification: (type: NotificationType, message: string) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([])

    const showNotification = useCallback((type: NotificationType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9)
        setNotifications(prev => [...prev, { id, type, message }])
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
        }, 5000)
    }, [])

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {notifications.map(n => (
                    <div
                        key={n.id}
                        className="pointer-events-auto flex items-center min-w-[300px] max-w-md p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl animate-in slide-in-from-right fade-in duration-300"
                    >
                        <div className="mr-3">
                            {n.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {n.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                            {n.type === 'info' && <Info className="h-5 w-5 text-indigo-500" />}
                        </div>
                        <p className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{n.message}</p>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    )
}

export const useNotification = () => {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}
