import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, CheckCircle, Clock, Loader2, ClipboardCheck } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment, Submission, Review, Profile } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function StudentDashboard() {
    const { user } = useAuth()
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
    const [myReviews, setMyReviews] = useState<(Review & { submission: Submission & { profile: Profile }, assignment: Assignment })[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const loadData = async () => {
        try {
            const [assignmentsRes, submissionsRes, reviewsRes] = await Promise.all([
                api.assignments.list(),
                api.submissions.list(user!.id),
                api.reviews.listToReviewWithDetails(user!.id)
            ])

            console.log('Assignments loaded:', assignmentsRes.data?.length)
            console.log('Submissions loaded:', submissionsRes.data?.length)
            console.log('Reviews loaded:', reviewsRes.data?.length)
            if (reviewsRes.data && reviewsRes.data.length > 0) {
                console.log('First review data sample:', JSON.stringify(reviewsRes.data[0], null, 2).slice(0, 200))
            } else if (reviewsRes.error) {
                console.error('Reviews error:', reviewsRes.error)
            }

            setAssignments(assignmentsRes.data || [])
            setMySubmissions(submissionsRes.data || [])
            setMyReviews(reviewsRes.data || [])
        } catch (error) {
            console.error('Error loading student data:', error)
        } finally {
            setLoading(false)
        }
    }

    const getSubmissionStatus = (assignmentId: string) => {
        const submission = mySubmissions.find(s => s.assignment_id === assignmentId)
        if (submission) {
            if (submission.status === 'resubmission_pending') {
                return { label: 'Resubmission Requested', color: 'text-yellow-600 bg-yellow-100', icon: Clock }
            }
            return { label: 'Submitted', color: 'text-green-600 bg-green-100', icon: CheckCircle }
        }
        return { label: 'To Do', color: 'text-yellow-600 bg-yellow-100', icon: Clock }
    }

    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-12">
            <header className="flex justify-between items-end border-b border-gray-100 dark:border-gray-800 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Student Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your assignments and peer evaluations.</p>
                </div>
            </header>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Upload className="h-6 w-6 text-indigo-500" />
                        My Assignments
                    </h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : assignments.length === 0 ? (
                    <div className="card-premium p-12 text-center text-gray-500">
                        <p>No active assignments.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {assignments.map((assignment) => {
                            const status = getSubmissionStatus(assignment.id)
                            const StatusIcon = status.icon
                            const submission = mySubmissions.find(s => s.assignment_id === assignment.id)

                            return (
                                <div key={assignment.id} className="card-premium p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                            {assignment.title}
                                        </h3>
                                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                            <span>
                                                Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                                            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
                                            {status.label}
                                        </span>

                                        <div className="flex gap-2">
                                            {status.label === 'To Do' && (
                                                <Link
                                                    to={`/student/assignments/${assignment.id}/submit`}
                                                    className="btn-mac-primary"
                                                >
                                                    <Upload className="-ml-0.5 mr-2 h-4 w-4" />
                                                    Submit
                                                </Link>
                                            )}
                                            {(status.label === 'Submitted' || status.label === 'Resubmission Requested') && (
                                                <>
                                                    <Link
                                                        to={`/student/assignments/${assignment.id}/view`}
                                                        className="btn-mac-secondary"
                                                    >
                                                        View
                                                    </Link>
                                                    {submission && (
                                                        <Link
                                                            to={`/student/results/${submission.id}`}
                                                            className="btn-mac-primary"
                                                        >
                                                            Results
                                                        </Link>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-indigo-500" />
                        Peer Reviews to Complete
                    </h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : myReviews.length === 0 ? (
                    <div className="card-premium p-12 text-center text-gray-500">
                        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg">No reviews assigned yet.</p>
                        <p className="text-sm">Once your teacher distributes evaluations, they will appear here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {myReviews.map((review) => (
                            <div key={review.id} className="card-premium p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                        Review: {review.assignment?.title || 'Assignment'}
                                    </h3>
                                    <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                        <span>
                                            Author: {review.submission?.profile?.full_name || 'Anonymous'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${review.score !== null ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'}`}>
                                        {review.score !== null ? <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                                        {review.score !== null ? 'Completed' : 'Pending'}
                                    </span>
                                    <Link
                                        to={`/student/reviews/${review.id}`}
                                        className={review.score !== null ? 'btn-mac-secondary' : 'btn-mac-primary'}
                                    >
                                        {review.score !== null ? 'View Review' : 'Start Review'}
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
