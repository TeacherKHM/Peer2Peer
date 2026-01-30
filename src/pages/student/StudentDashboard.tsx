import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileText, CheckCircle, Clock } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment, Submission } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function StudentDashboard() {
    const { user } = useAuth()
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [mySubmissions, setMySubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const loadData = async () => {
        try {
            const [assignmentsRes, submissionsRes] = await Promise.all([
                api.assignments.list(),
                api.submissions.list(user!.id)
            ])

            setAssignments(assignmentsRes.data || [])
            setMySubmissions(submissionsRes.data || [])
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
        <div className="space-y-8">
            <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">My Assignments</h2>
                {loading ? (
                    <div>Loading...</div>
                ) : assignments.length === 0 ? (
                    <p className="text-gray-500">No active assignments.</p>
                ) : (
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {assignments.map((assignment) => {
                                const status = getSubmissionStatus(assignment.id)
                                const StatusIcon = status.icon
                                return (
                                    <li key={assignment.id}>
                                        <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white truncate">
                                                    {assignment.title}
                                                </h3>
                                                <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="truncate">
                                                        Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                    <StatusIcon className="w-4 h-4 mr-1" />
                                                    {status.label}
                                                </span>
                                                {status.label === 'To Do' && (
                                                    <Link
                                                        to={`/student/assignments/${assignment.id}/submit`}
                                                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                    >
                                                        <Upload className="-ml-0.5 mr-2 h-4 w-4" />
                                                        Submit
                                                    </Link>
                                                )}
                                                {status.label === 'Submitted' && (
                                                    <Link
                                                        to={`/student/assignments/${assignment.id}/view`}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                                                    >
                                                        View Submission
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Peer Reviews</h2>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2">No reviews assigned yet.</p>
                </div>
            </section>
        </div>
    )
}
