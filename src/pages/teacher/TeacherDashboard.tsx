import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Users, Loader2 } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment } from '../../lib/api'
import { useNotification } from '../../contexts/NotificationContext'
import Modal from '../../components/Modal'

export default function TeacherDashboard() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)
    const { showNotification } = useNotification()
    const [confirmModalData, setConfirmModalData] = useState<{ isOpen: boolean, assignmentId: string } | null>(null)
    const [isAssigning, setIsAssigning] = useState(false)

    useEffect(() => {
        fetchAssignments()
    }, [])

    const fetchAssignments = async () => {
        try {
            const { data, error } = await api.assignments.list()
            if (error) throw error
            setAssignments(data || [])
        } catch (error) {
            console.error('Error fetching assignments:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleAssignReviewsRequest = (assignmentId: string) => {
        setConfirmModalData({ isOpen: true, assignmentId })
    }

    const handleAssignReviews = async (assignmentId: string) => {
        setConfirmModalData(null)
        setIsAssigning(true)
        try {
            const { data: submissions, error: submissionsError } = await api.submissions.listByAssignment(assignmentId)
            if (submissionsError) throw submissionsError

            if (!submissions || submissions.length === 0) {
                showNotification('info', 'Need at least one submission to assign reviews.')
                return
            }

            const { data: students, error: studentsError } = await api.auth.listStudents()
            if (studentsError) throw studentsError

            const reviewerList = students || []
            if (reviewerList.length === 0) {
                showNotification('info', 'No students found to assign reviews to.')
                return
            }

            const newReviews: any[] = []
            reviewerList.forEach(student => {
                const eligibleSubmissions = submissions.filter(s => s.student_id !== student.id)
                const shuffled = [...eligibleSubmissions].sort(() => 0.5 - Math.random())
                const selected = shuffled.slice(0, 2)

                selected.forEach(sub => {
                    newReviews.push({
                        submission_id: sub.id,
                        reviewer_id: student.id
                    })
                })
            })

            const { error: assignError } = await api.reviews.assignPeerReviews(assignmentId, newReviews)
            if (assignError) throw assignError

            showNotification('success', `Successfully assigned ${newReviews.length} reviews!`)
        } catch (error) {
            console.error('Error assigning reviews:', error)
            showNotification('error', 'Failed to assign reviews.')
        } finally {
            setIsAssigning(false)
        }
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Teacher Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Manage your assignments and peer review cycles.</p>
                </div>
                <div className="flex gap-4">
                    <Link
                        to="/teacher/rubrics"
                        className="btn-mac-secondary group"
                    >
                        Manage Rubrics
                    </Link>
                    <Link
                        to="/teacher/assignments/new"
                        className="btn-mac-primary group shadow-indigo-100 dark:shadow-none"
                    >
                        <Plus className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                        Create Assignment
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : assignments.length === 0 ? (
                <div className="card-premium p-16 text-center">
                    <div className="mx-auto h-16 w-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                        <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 underline underline-offset-8 decoration-gray-100 dark:decoration-gray-800">No Assignments Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8 font-medium">Create your first assignment to start the peer review process with your students.</p>
                    <Link to="/teacher/assignments/new" className="btn-mac-primary inline-flex">
                        Get Started
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="card-premium p-8 group transition-all duration-300 hover:border-indigo-200 dark:hover:border-indigo-800">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 transition-colors">
                                            {assignment.title}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${assignment.due_date && new Date(assignment.due_date) < new Date()
                                            ? 'bg-red-100 text-red-700 dark:bg-red-900/60'
                                            : 'bg-green-100 text-green-700 dark:bg-green-900/60'
                                            } transition-colors`}>
                                            {assignment.due_date && new Date(assignment.due_date) < new Date() ? 'Past Due' : 'Active'}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-6 text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500"></span>
                                            Due {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No due date'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 lg:pt-0">
                                    <Link
                                        to={`/teacher/assignments/${assignment.id}`}
                                        className="btn-mac-secondary h-11 px-6 justify-center"
                                    >
                                        View Submissions
                                    </Link>
                                    <button
                                        onClick={() => handleAssignReviewsRequest(assignment.id)}
                                        className="btn-mac-primary h-11 px-6 justify-center whitespace-nowrap"
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Assign Reviews
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={!!confirmModalData?.isOpen}
                onClose={() => setConfirmModalData(null)}
                title="Assign Peer Reviews"
                footer={
                    <div className="flex gap-3 justify-end w-full">
                        <button
                            onClick={() => setConfirmModalData(null)}
                            className="btn-mac-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => confirmModalData && handleAssignReviews(confirmModalData.assignmentId)}
                            disabled={isAssigning}
                            className="btn-mac-primary"
                        >
                            {isAssigning ? 'Assigning...' : 'Assign Reviews Now'}
                        </button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                        This will automatically assign peer reviews to all students who have submitted their work.
                    </p>
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded-2xl">
                        <p className="text-xs font-bold text-orange-700 dark:text-orange-400 leading-relaxed">
                            <span className="font-black uppercase tracking-widest block mb-1">Warning</span>
                            This action will overwrite any existing review assignments for this project. This cannot be undone.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
