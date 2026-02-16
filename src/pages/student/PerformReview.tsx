import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save, AlertCircle } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Review, Submission, Profile, Rubric, Assignment } from '../../lib/api'
import { type RubricItem } from '../../components/RubricBuilder'
import { useNotification } from '../../contexts/NotificationContext'
import Modal from '../../components/Modal'

export default function PerformReview() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const { showNotification } = useNotification()
    const [review, setReview] = useState<(Review & { submission: Submission & { profile: Profile }, assignment: Assignment }) | null>(null)
    const [rubric, setRubric] = useState<Rubric | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [scores, setScores] = useState<Record<string, number>>({})
    const [feedback, setFeedback] = useState<Record<string, string>>({})
    const [overallTips, setOverallTips] = useState('')
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)

    const [pdfZoom, setPdfZoom] = useState(100)

    useEffect(() => {
        if (id) fetchReviewData()
    }, [id])

    const getPdfUrl = () => {
        if (!review?.submission.file_url) return ''
        return `${review.submission.file_url}#toolbar=0&navpanes=0&zoom=${pdfZoom}`
    }

    const fetchReviewData = async () => {
        try {
            const { data, error } = await api.reviews.get(id!)
            if (error || !data) throw error || new Error('Review not found')

            setReview(data)

            const rubricRes = await api.rubrics.getByAssignment(data.submission.assignment_id)
            setRubric(rubricRes.data)

            // Initialize scores and feedback if they exist
            if (data.feedback) {
                const fb = data.feedback as any
                setScores(fb.scores || {})
                setFeedback(fb.criteriaFeedback || {})
                setOverallTips(fb.overallTips || '')
            }
        } catch (error) {
            console.error('Error fetching review data:', error)
            showNotification('error', 'Review not found')
            navigate('/')
        } finally {
            setLoading(false)
        }
    }

    const handleScoreChange = (criteriaId: string, score: number) => {
        setScores(prev => ({ ...prev, [criteriaId]: score }))
    }

    const handleFeedbackChange = (criteriaId: string, text: string) => {
        setFeedback(prev => ({ ...prev, [criteriaId]: text }))
    }

    const calculateTotalScore = () => {
        if (!rubric) return 0
        const criteria = rubric.criteria as unknown as RubricItem[]
        let total = 0
        let max = 0

        const addScores = (items: RubricItem[]) => {
            items.forEach(item => {
                if (item.subcriteria && item.subcriteria.length > 0) {
                    addScores(item.subcriteria)
                } else {
                    total += scores[item.id] || 0
                    max += item.max_points
                }
            })
        }

        addScores(criteria)
        return max > 0 ? Math.round((total / max) * 100) : 0
    }

    const handleSave = async () => {
        if (!review) return
        setIsConfirmModalOpen(false)
        setSaving(true)
        try {
            const totalScore = calculateTotalScore()
            const { error } = await api.reviews.update(review.id, {
                score: totalScore,
                feedback: {
                    scores,
                    criteriaFeedback: feedback,
                    overallTips
                }
            })

            if (error) throw error
            showNotification('success', 'Review submitted successfully!')
            navigate('/')
        } catch (error) {
            console.error('Error saving review:', error)
            showNotification('error', 'Failed to save review')
        } finally {
            setSaving(false)
        }
    }

    const renderCriteriaItem = (item: RubricItem, index: number, parentIndex?: number) => {
        const itemNumber = parentIndex !== undefined
            ? `${parentIndex + 1}.${index + 1}`
            : `${index + 1}`
        const hasSubcriteria = item.subcriteria && item.subcriteria.length > 0

        // Calculate total for parent if it has subcriteria
        const calculateItemTotal = (currentItem: RubricItem): number => {
            if (currentItem.subcriteria && currentItem.subcriteria.length > 0) {
                return currentItem.subcriteria.reduce((sum, sub) => sum + (scores[sub.id] || 0), 0)
            }
            return scores[currentItem.id] || 0
        }

        const calculateItemMax = (currentItem: RubricItem): number => {
            if (currentItem.subcriteria && currentItem.subcriteria.length > 0) {
                return currentItem.subcriteria.reduce((sum, sub) => sum + sub.max_points, 0)
            }
            return currentItem.max_points
        }

        return (
            <div key={item.id} className={`${parentIndex !== undefined ? 'ml-6 mt-3' : 'mb-4'}`}>
                <div className={`card-premium p-4 border ${hasSubcriteria ? 'border-indigo-100 dark:border-indigo-900 bg-indigo-50/10 dark:bg-indigo-900/5' : 'border-gray-100 dark:border-gray-800'}`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{itemNumber}.</span>
                                <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-1 hover:line-clamp-none transition-all">{item.description}</p>
                        </div>
                        <div className="text-right ml-3 flex flex-col items-end">
                            <span className="text-base font-black text-indigo-600 dark:text-indigo-400 tabular-nums leading-none">
                                {calculateItemTotal(item)}
                            </span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">max {calculateItemMax(item)}</span>
                        </div>
                    </div>

                    {!hasSubcriteria && (
                        <div className="flex gap-4 items-stretch">
                            <div className="flex-1">
                                <textarea
                                    value={feedback[item.id] || ''}
                                    onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                                    rows={2}
                                    placeholder="Add comments here..."
                                    className="input-premium py-2 px-3 text-[11px] resize-none h-full min-h-[60px]"
                                />
                            </div>
                            <div className="w-20 flex flex-col justify-center gap-1 bg-gray-50/50 dark:bg-gray-900/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800 shrink-0">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest transition-colors group-hover:text-indigo-600">Pts</span>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    max={item.max_points}
                                    value={scores[item.id] || 0}
                                    onChange={(e) => handleScoreChange(item.id, Math.min(item.max_points, Math.max(0, parseInt(e.target.value) || 0)))}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-indigo-600 dark:text-indigo-400 text-center py-1 focus:ring-1 focus:ring-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {hasSubcriteria && (
                    <div className="space-y-3">
                        {item.subcriteria!.map((subItem, subIndex) =>
                            renderCriteriaItem(subItem, subIndex, index)
                        )}
                    </div>
                )}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!review || !rubric) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 space-y-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">Review or Rubric not found</p>
                <button onClick={() => navigate('/')} className="btn-mac-secondary">Back to Dashboard</button>
            </div>
        )
    }

    const criteria = rubric.criteria as unknown as RubricItem[]

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30">
                <div className="max-w-screen-2xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                            <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                        </button>
                        <div>
                            <h1 className="text-sm font-black text-gray-900 dark:text-white tracking-tight line-clamp-1">{review.assignment.title}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Reviewing: {review.submission.profile.full_name}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Score</p>
                            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none mt-1">{calculateTotalScore()}%</p>
                        </div>
                        <button
                            onClick={() => setIsConfirmModalOpen(true)}
                            disabled={saving}
                            className="btn-mac-primary h-11 px-6 shadow-indigo-100 dark:shadow-none"
                        >
                            {saving ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                            <span className="font-black uppercase tracking-widest text-[11px]">Submit Review</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row h-[calc(100vh-73px)]">
                {/* PDF Viewer Side - Now Wider */}
                <div className="w-full lg:w-[65%] p-4 lg:p-6 h-[500px] lg:h-auto overflow-hidden">
                    <div className="card-premium h-full overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Submission Document</span>
                                <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                                <div className="flex items-center gap-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-0.5">
                                    <button
                                        onClick={() => setPdfZoom(prev => Math.max(50, prev - 10))}
                                        className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                                        title="Zoom Out"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                                    </button>
                                    <span className="text-[10px] font-black w-8 text-center text-gray-600 dark:text-gray-400">{pdfZoom}%</span>
                                    <button
                                        onClick={() => setPdfZoom(prev => Math.min(200, prev + 10))}
                                        className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors text-gray-500"
                                        title="Zoom In"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    </button>
                                </div>
                            </div>
                            <a href={review.submission.file_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 font-bold transition-colors">Open Full Page</a>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                            <iframe
                                src={getPdfUrl()}
                                className="w-full h-full border-none"
                                title="Submission Preview"
                                key={pdfZoom}
                            />
                        </div>
                    </div>
                </div>

                {/* Rubric Side - Now Narrower */}
                <div className="w-full lg:w-[35%] p-4 lg:p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {criteria.map((item, index) => renderCriteriaItem(item, index))}

                        <div className="card-premium p-6 border-l-4 border-l-indigo-600">
                            <h3 className="text-xs font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Overall Tips & Suggestions</h3>
                            <textarea
                                value={overallTips}
                                onChange={(e) => setOverallTips(e.target.value)}
                                rows={4}
                                placeholder="Add any final thoughts or summary..."
                                className="input-premium text-xs"
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Submit Peer Review"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="btn-mac-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn-mac-primary"
                        >
                            {saving ? 'Submitting...' : 'Confirm Submission'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                        <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                            {calculateTotalScore()}%
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Calculated Score</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Based on your rubric evaluation.</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 px-1 leading-relaxed">
                        Are you sure you want to submit this review? Once submitted, your feedback will be finalized and the author will be able to see it.
                    </p>
                </div>
            </Modal>
        </div>
    )
}
