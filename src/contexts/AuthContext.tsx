import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { api } from '../lib/bootstrap'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AuthContextType {
    session: Session | null
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.auth.getSession().then(({ session }) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        const {
            subscription,
        } = api.auth.onAuthStateChange(async (_event, session) => {
            setSession(session)
            setUser(session?.user ?? null)
            if (session?.user) {
                // Only fetch if not already loaded or different user
                if (session.user.id !== user?.id) {
                    fetchProfile(session.user.id)
                }
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await api.auth.getProfile(userId)

            if (data) {
                setProfile(data)
            } else {
                // If profile is missing (e.g. no trigger in DB), try to create it from user metadata
                // This handles the case where the user just signed up and confirmed email
                const currentUserRes = await api.auth.getSession()
                const currentUser = currentUserRes.session?.user

                if (currentUser) {
                    const metadata = currentUser.user_metadata
                    const { data: newProfile, error: createError } = await api.auth.createProfile({
                        id: userId,
                        full_name: metadata?.full_name || '',
                        role: metadata?.role || 'student'
                    })

                    if (createError) {
                        console.error('Error creating profile:', createError)
                    } else {
                        setProfile(newProfile)
                    }
                }
            }

            if (error && !data) {
                console.error('Error fetching profile:', error)
            }
        } finally {
            setLoading(false)
        }
    }

    const signOut = async () => {
        await api.auth.signOut()
        setProfile(null)
        setSession(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
