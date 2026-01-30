import { useAuth } from '../contexts/AuthContext'
import TeacherDashboard from './teacher/TeacherDashboard'
import StudentDashboard from './student/StudentDashboard'

export default function Dashboard() {
    const { profile, signOut } = useAuth()

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-gray-700 dark:text-gray-300">
                            Welcome, {profile?.full_name} ({profile?.role})
                        </span>
                        <button
                            onClick={signOut}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>

                {profile?.role === 'teacher' ? (
                    <TeacherDashboard />
                ) : (
                    <StudentDashboard />
                )}
            </div>
        </div>
    )
}
