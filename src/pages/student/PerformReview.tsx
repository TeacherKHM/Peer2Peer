import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, Save, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
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

    useEffect(() => {
        if (id) fetchReviewData()
    }, [id])

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
        criteria.forEach(item => {
            total += scores[item.id] || 0
            max += item.max_points
        })
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!review || !rubric) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 space-y-4">
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
                            <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight line-clamp-1">{review.assignment.title}</h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md uppercase tracking-widest">Reviewing</span>
                                <p className="text-xs font-bold text-gray-500">{review.submission.profile.full_name}</p>
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
                {/* PDF Viewer Side */}
                <div className="w-full lg:w-1/2 p-4 lg:p-6 h-[500px] lg:h-auto overflow-hidden">
                    <div className="card-premium h-full overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-800/50 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Submission Document</span>
                            <a href={review.submission.file_url} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:text-indigo-500 font-bold transition-colors">Open Full Page</a>
                        </div>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-950 overflow-auto">
                            <iframe
                                src={`${review.submission.file_url}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Submission Preview"
                            />
                        </div>
                    </div>
                </div>

                {/* Rubric Side */}
                <div className="w-full lg:w-1/2 p-4 lg:p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {criteria.map((item) => (
                            <div key={item.id} className="card-premium p-8 border border-gray-100 dark:border-gray-800">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 leading-tight uppercase tracking-wide">{item.title}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">{item.description}</p>
                                    </div>
                                    <div className="text-right ml-4">
                                        <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                            {scores[item.id] || 0}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">out of {item.max_points}</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <input
                                        type="range"
                                        min="0"
                                        max={item.max_points}
                                        value={scores[item.id] || 0}
                                        onChange={(e) => handleScoreChange(item.id, parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />

                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Feedback Comments</label>
                                        <textarea
                                            value={feedback[item.id] || ''}
                                            onChange={(e) => handleFeedbackChange(item.id, e.target.value)}
                                            rows={3}
                                            placeholder="What did they do well? What could be improved?"
                                            className="input-premium resize-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className="card-premium p-8 border-l-4 border-l-indigo-600">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4 uppercase tracking-wide">Overall Tips & Suggestions</h3>
                            <textarea
                                value={overallTips}
                                onChange={(e) => setOverallTips(e.target.value)}
                                rows={4}
                                placeholder="Add any final thoughts or summary of the submission's strengths and weaknesses..."
                                className="input-premium"
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
