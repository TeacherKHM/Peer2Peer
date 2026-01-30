import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
    allowedRoles?: ('student' | 'teacher')[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        return <Navigate to="/" replace />
    }

    return <Outlet />
}
