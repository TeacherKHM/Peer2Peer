import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/bootstrap'
import { Mail, Lock, User, Loader2 } from 'lucide-react'

export default function Auth() {
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [role, setRole] = useState<'student' | 'teacher'>('student')
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            if (isLogin) {
                const { error } = await api.auth.signIn(email, password)
                if (error) throw error
                navigate('/')
            } else {
                const { user: newUser, error } = await api.auth.signUp(email, password, {
                    full_name: fullName,
                    role: role
                })
                if (error) throw error

                if (newUser) {
                    navigate('/')
                }
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
                        {isLogin ? 'Welcome back' : 'Create an account'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {isLogin ? 'Sign in to access your dashboard' : 'Join the peer review platform'}
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleAuth}>
                    <div className="space-y-4">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Full Name
                                </label>
                                <div className="mt-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required={!isLogin}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email address
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    I am a...
                                </label>
                                <div className="mt-2 flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="student"
                                            checked={role === 'student'}
                                            onChange={() => setRole('student')}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="ml-2 text-gray-700 dark:text-gray-300">Student</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="role"
                                            value="teacher"
                                            checked={role === 'teacher'}
                                            onChange={() => setRole('teacher')}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                        />
                                        <span className="ml-2 text-gray-700 dark:text-gray-300">Teacher</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (isLogin ? 'Sign in' : 'Sign up')}
                    </button>
                </form>

                <div className="text-center mt-4">
                    <button
                        type="button"
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                        {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                    </button>
                </div>
            </div>
        </div>
    )
}
