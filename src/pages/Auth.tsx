import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/bootstrap'
import { Mail, Lock, User, Loader2, ClipboardCheck, Eye, EyeOff } from 'lucide-react'
import { useNotification } from '../contexts/NotificationContext'

export default function Auth() {
    const { showNotification } = useNotification()
    const [isLogin, setIsLogin] = useState(true)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const navigate = useNavigate()

    const isRegistration = !isLogin
    const hasInvalidDomain = isRegistration && email.length > 0 && !email.endsWith('@irsl.edu.mx')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setLoading(true)

        try {
            if (isLogin) {
                const { error } = await api.auth.signIn(email, password)
                if (error) throw error
                showNotification('success', 'Welcome back!')
                navigate('/')
            } else {
                // Domain Restriction
                if (!email.endsWith('@irsl.edu.mx')) {
                    showNotification('error', 'Only accounts with @irsl.edu.mx domain are allowed for this test version.')
                    setLoading(false)
                    return
                }

                const { user: newUser, error } = await api.auth.signUp(email, password, {
                    full_name: fullName,
                    role: 'student' // Force student role for test deployment
                })
                if (error) throw error

                if (newUser) {
                    showNotification('success', 'Account created! Please check your email.')
                    navigate('/')
                }
            }
        } catch (err: any) {
            showNotification('error', err.message || 'Authentication failed')
        } finally {
            setLoading(false)
        }
    }

    const handleForgotPassword = async () => {
        if (!email) {
            showNotification('info', 'Please enter your email address first.')
            return
        }
        setLoading(true)
        try {
            const { error } = await api.auth.resetPassword(email)
            if (error) throw error
            showNotification('success', 'Password reset link sent! Check your email.')
        } catch (err: any) {
            showNotification('error', err.message || 'Failed to send reset email')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 dark:bg-gray-950 p-4">
            <div className="card-premium w-full max-w-md p-10 space-y-8 bg-white dark:bg-gray-900 shadow-2xl">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none mb-4 animate-in zoom-in duration-500">
                        <ClipboardCheck className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        {isLogin ? 'Welcome Back' : 'Get Started'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {isLogin ? 'Sign in to your account' : 'Register for the peer review app'}
                    </p>
                </div>

                <form className="mt-8 space-y-5" onSubmit={handleAuth}>
                    {!isLogin && (
                        <div>
                            <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-1 mb-2">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required={!isLogin}
                                    className="input-premium pl-11"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest ml-1 mb-2">Email address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Mail className={`h-5 w-5 ${hasInvalidDomain ? 'text-red-400' : 'text-gray-400'} group-focus-within:text-indigo-500 transition-colors`} />
                            </div>
                            <input
                                type="email"
                                required
                                className={`input-premium pl-11 ${hasInvalidDomain ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                                placeholder="name@irsl.edu.mx"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {hasInvalidDomain && (
                            <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                                Must use @irsl.edu.mx domain
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex justify-between items-center ml-1 mb-2">
                            <label className="block text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Password</label>
                            {isLogin && (
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-500 transition-colors"
                                >
                                    Forgot?
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="input-premium pl-11 pr-11"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-500 transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Role selection hidden for test deployment - all new accounts are students */}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-mac-primary h-12 text-base font-black uppercase tracking-widest text-white shadow-indigo-200 hover:shadow-indigo-300 transition-all"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-indigo-600 transition-colors underline underline-offset-4 decoration-gray-200 hover:decoration-indigo-200"
                        >
                            {isLogin ? "No account? Register here" : "Already have an account? Login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
