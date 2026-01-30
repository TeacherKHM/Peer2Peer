import { X, Maximize2, Minimize2, Download } from 'lucide-react'
import { useState } from 'react'

interface PDFViewerProps {
    url: string
    title?: string
    onClose: () => void
}

export default function PDFViewer({ url, title, onClose }: PDFViewerProps) {
    const [isFullPage, setIsFullPage] = useState(false)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${isFullPage ? 'w-full h-full' : 'w-full max-w-5xl h-[85vh]'}`}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                            <span className="text-red-600 dark:text-red-400 font-bold text-xs uppercase">PDF</span>
                        </div>
                        <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-md">
                            {title || 'Document Preview'}
                        </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                        <a
                            href={url}
                            download
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title="Download"
                        >
                            <Download className="h-5 w-5" />
                        </a>
                        <button
                            onClick={() => setIsFullPage(!isFullPage)}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                            title={isFullPage ? 'Exit Full Screen' : 'Full Screen'}
                        >
                            {isFullPage ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            title="Close"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 dark:bg-gray-950 relative">
                    <iframe
                        src={`${url}#toolbar=0`}
                        className="absolute inset-0 w-full h-full border-none"
                        title="PDF Viewer"
                    />
                </div>

                {/* Footer / Status */}
                <div className="px-6 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-500 flex justify-between">
                    <span>SECURE VIEWING MODE</span>
                    <span>Note: If preview doesn't load, use the download button above.</span>
                </div>
            </div>
        </div>
    )
}
