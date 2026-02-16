import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, ClipboardCheck, Loader2, Info, Users } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Review, Rubric } from '../../lib/api'
import { type RubricItem } from '../../components/RubricBuilder'

export default function ViewResults() {
    const { submissionId } = useParams()
    const navigate = useNavigate()
    const [reviews, setReviews] = useState<Review[]>([])
    const [rubric, setRubric] = useState<Rubric | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (submissionId) {
            loadData()
        }
    }, [submissionId])

    const loadData = async () => {
        try {
            // 1. Fetch reviews
            const { data: reviewsData, error: reviewsError } = await api.reviews.listReviewsForSubmission(submissionId!)
            if (reviewsError) throw reviewsError
            setReviews(reviewsData || [])

            // 2. Fetch submission (to get assignment_id)
            const { data: subData, error: subError } = await api.submissions.get(submissionId!)
            if (subError) throw subError

            // 3. Fetch rubric
            if (subData) {
                const { data: rubricData, error: rubricError } = await api.rubrics.getByAssignment(subData.assignment_id)
                if (rubricError) throw rubricError
                setRubric(rubricData)
            }
        } catch (error) {
            console.error('Error loading results:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateAverageScore = () => {
        if (reviews.length === 0) return 0
        const total = reviews.reduce((sum, r) => sum + (r.score || 0), 0)
        return Math.round(total / reviews.length)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50/50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    const rubricItems = (rubric?.criteria || []) as unknown as RubricItem[]

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950 py-12 px-4">
            <div className="max-w-4xl mx-auto space-y-8">
                <button
                    onClick={() => navigate(-1)}
                    className="btn-mac-secondary group"
                >
                    <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                <div className="card-premium p-8 border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Peer Feedback</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium italic">Evaluations from your classmates on your submission.</p>
                        </div>
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 px-6 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-800 text-center min-w-[120px]">
                            <span className="block text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                {calculateAverageScore()}%
                            </span>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global average</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-8">
                    {reviews.length === 0 ? (
                        <div className="card-premium p-16 text-center text-gray-500 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                            <ClipboardCheck className="h-12 w-12 mx-auto mb-4 text-gray-200" />
                            <p className="text-lg font-black text-gray-900 dark:text-white underline underline-offset-8 decoration-gray-100 mb-2">No Reviews Yet</p>
                            <p className="text-sm font-medium">Evaluation is still in progress. Please check back later.</p>
                        </div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} className="card-premium overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                <div className="px-8 py-5 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-xs text-indigo-600 shadow-sm">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        Anonymous Peer Review
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-800/50">
                                            Score: {review.score}%
                                        </span>
                                    </div>
                                </div>
                                <div className="p-8 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            Rubric Breakdown
                                        </div>
                                        <div className="space-y-4">
                                            {rubricItems.map((item, index) => {
                                                const fb = review.feedback as any
                                                const scores = fb?.scores || {}
                                                const criteriaFeedback = fb?.criteriaFeedback || {}

                                                const renderCriteriaResults = (currentItem: RubricItem, itemIdx: number, parentPrefix?: string) => {
                                                    const prefix = parentPrefix ? `${parentPrefix}.${itemIdx + 1}` : `${itemIdx + 1}`
                                                    const hasSubcriteria = currentItem.subcriteria && currentItem.subcriteria.length > 0

                                                    const calculateTotalVal = (it: RubricItem): number => {
                                                        if (it.subcriteria && it.subcriteria.length > 0) {
                                                            return it.subcriteria.reduce((sum, sub) => sum + calculateTotalVal(sub), 0)
                                                        }
                                                        return scores[it.id] || 0
                                                    }

                                                    const calculateMaxVal = (it: RubricItem): number => {
                                                        if (it.subcriteria && it.subcriteria.length > 0) {
                                                            return it.subcriteria.reduce((sum, sub) => sum + calculateMaxVal(sub), 0)
                                                        }
                                                        return it.max_points || 0
                                                    }

                                                    const totalScore = calculateTotalVal(currentItem)
                                                    const maxPoints = calculateMaxVal(currentItem)

                                                    return (
                                                        <div key={currentItem.id} className={parentPrefix ? 'ml-6' : 'mb-2'}>
                                                            <div className={`p-3 rounded-xl border transition-all ${hasSubcriteria
                                                                ? 'bg-indigo-50/10 dark:bg-indigo-900/5 border-indigo-100/50 dark:border-indigo-900/30'
                                                                : 'bg-gray-50/50 dark:bg-gray-900/40 border-gray-100 dark:border-gray-800/50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex flex-col gap-1"> {/* Changed to flex-col to stack title and description */}
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 tabular-nums">{prefix}.</span>
                                                                            <span className="font-bold text-gray-900 dark:text-white text-xs tracking-tight">{currentItem.title}</span>
                                                                        </div>
                                                                        {currentItem.description && (
                                                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 ml-[28px] leading-tight">{currentItem.description}</p>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-[10px] font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                                                                            {totalScore} / {maxPoints}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {!hasSubcriteria && criteriaFeedback[currentItem.id] && (
                                                                    <div className="mt-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-50 dark:border-gray-700/30">
                                                                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed italic">
                                                                            "{criteriaFeedback[currentItem.id]}"
                                                                        </p>
                                                                    </div>
                                                                )}

                                                                {hasSubcriteria && (
                                                                    <div className="mt-2 space-y-2">
                                                                        {currentItem.subcriteria!.map((sub, idx) => renderCriteriaResults(sub, idx, prefix))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                }

                                                return renderCriteriaResults(item, index)
                                            })}
                                        </div>
                                    </div>

                                    {(review.feedback as any)?.overallTips && (
                                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
                                                <Info className="h-3.5 w-3.5" />
                                                Overall Tips & Suggestions
                                            </div>
                                            <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-50 dark:border-indigo-900/30 leading-relaxed">
                                                <p className="text-sm font-bold text-gray-700 dark:text-gray-300 italic">
                                                    "{(review.feedback as any).overallTips}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
