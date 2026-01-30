import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { api } from '../../lib/bootstrap'
import type { Assignment } from '../../lib/api'

export default function TeacherDashboard() {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Active Assignments</h2>
                <div className="flex gap-4">
                    <Link
                        to="/teacher/rubrics"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Manage Rubrics
                    </Link>
                    <Link
                        to="/teacher/assignments/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="-ml-1 mr-2 h-5 w-5" />
                        Create Assignment
                    </Link>
                </div>
            </div>

            {loading ? (
                <div>Loading...</div>
            ) : assignments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No assignments</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Get started by creating a new assignment.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {assignments.map((assignment) => (
                            <li key={assignment.id}>
                                <Link to={`/teacher/assignments/${assignment.id}`} className="block hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                                {assignment.title}
                                            </p>
                                            <div className="ml-2 flex-shrink-0 flex">
                                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2 sm:flex sm:justify-between">
                                            <div className="sm:flex">
                                                <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No due date'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
