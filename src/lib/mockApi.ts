import type { Api, AuthApi, AssignmentsApi, RubricsApi, SubmissionsApi, ReviewsApi, StorageApi, Profile, Assignment, Rubric, Submission, Review } from './api'
import type { Session, User } from '@supabase/supabase-js'

const USERS_KEY = 'p2p_users'
const ASSIGNMENTS_KEY = 'p2p_assignments'
const RUBRICS_KEY = 'p2p_rubrics'
const SUBMISSIONS_KEY = 'p2p_submissions'
const REVIEWS_KEY = 'p2p_reviews'

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

class MockAuth implements AuthApi {
    private currentSession: Session | null = null
    private listeners: ((event: string, session: Session | null) => void)[] = []

    constructor() {
        const storedSession = localStorage.getItem('p2p_session')
        if (storedSession) {
            try {
                this.currentSession = JSON.parse(storedSession)
            } catch (e) {
                localStorage.removeItem('p2p_session')
            }
        }
    }

    private notify(event: string, session: Session | null) {
        this.listeners.forEach(cb => cb(event, session))
    }

    async signIn(email: string, _password: string) {
        await delay(500)
        // Auto-login/create for dev
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
        let user = users.find((u: any) => u.email === email)

        if (!user) {
            return { user: null, session: null, error: { message: 'User not found. Please Sign Up first.' } }
        }

        const session: Session = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: user
        }

        this.currentSession = session
        localStorage.setItem('p2p_session', JSON.stringify(session))
        this.notify('SIGNED_IN', session)
        return { user, session, error: null }
    }

    async signUp(email: string, _password: string, metadata?: { full_name: string; role: 'student' | 'teacher' }) {
        await delay(500)
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')

        if (users.find((u: any) => u.email === email)) {
            return { user: null, session: null, error: { message: 'User already exists' } }
        }

        const newUser: User = {
            id: crypto.randomUUID(),
            email: email,
            app_metadata: {},
            user_metadata: metadata || {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
        }

        users.push(newUser)
        localStorage.setItem(USERS_KEY, JSON.stringify(users))

        const session: Session = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: newUser
        }

        this.currentSession = session
        localStorage.setItem('p2p_session', JSON.stringify(session))
        this.notify('SIGNED_IN', session)

        // Also create profile mock
        this.saveProfile({
            id: newUser.id,
            full_name: metadata?.full_name || '',
            role: metadata?.role || 'student', // Default to student only if not provided
            created_at: new Date().toISOString()
        })

        return { user: newUser, session, error: null }
    }

    async signOut() {
        await delay(200)
        this.currentSession = null
        localStorage.removeItem('p2p_session')
        this.notify('SIGNED_OUT', null)
        return { error: null }
    }

    async listStudents() {
        await delay(300)
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')
        const students = profiles.filter((p: Profile) => p.role === 'student')
        return { data: students, error: null }
    }

    async resetPassword(_email: string) {
        await delay(300)
        return { error: null }
    }

    async updatePassword(_password: string) {
        await delay(300)
        return { error: null }
    }

    async getSession() {
        return { session: this.currentSession }
    }

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        this.listeners.push(callback)
        // Immediate callback with current state
        callback(this.currentSession ? 'SIGNED_IN' : 'SIGNED_OUT', this.currentSession)
        return {
            subscription: {
                unsubscribe: () => {
                    this.listeners = this.listeners.filter(cb => cb !== callback)
                }
            }
        }
    }

    async getProfile(userId: string) {
        await delay(200)
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')
        const profile = profiles.find((p: Profile) => p.id === userId)
        return { data: profile || null, error: null }
    }

    async createProfile(profile: Profile) {
        await delay(200)
        this.saveProfile(profile)
        return { data: profile, error: null }
    }

    // Helper for internal use
    saveProfile(profile: Profile) {
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')
        const index = profiles.findIndex((p: Profile) => p.id === profile.id)
        if (index >= 0) {
            profiles[index] = profile
        } else {
            profiles.push(profile)
        }
        localStorage.setItem('p2p_profiles', JSON.stringify(profiles))
    }
}

class MockAssignments implements AssignmentsApi {
    async list() {
        await delay(300)
        return {
            data: JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]'),
            error: null
        }
    }

    async create(assignment: Partial<Assignment>) {
        await delay(300)
        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')
        const newAssignment = {
            ...assignment,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        } as Assignment

        assignments.unshift(newAssignment)
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
        return { data: newAssignment, error: null }
    }

    async get(id: string) {
        await delay(200)
        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')
        const found = assignments.find((a: Assignment) => a.id === id)
        return { data: found || null, error: found ? null : { message: 'Not found' } }
    }

    async update(id: string, updates: Partial<Assignment>) {
        await delay(300)
        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')
        const index = assignments.findIndex((a: Assignment) => a.id === id)

        if (index === -1) {
            return { data: null, error: { message: 'Assignment not found' } }
        }

        const updatedAssignment = {
            ...assignments[index],
            ...updates
        }

        assignments[index] = updatedAssignment
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
        return { data: updatedAssignment, error: null }
    }

    async delete(id: string) {
        await delay(300)
        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')
        const filtered = assignments.filter((a: Assignment) => a.id !== id)
        localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(filtered))
        return { error: null }
    }
}

class MockRubrics implements RubricsApi {
    async create(rubric: Partial<Rubric>) {
        await delay(300)
        const rubrics = JSON.parse(localStorage.getItem(RUBRICS_KEY) || '[]')
        const newRubric = {
            ...rubric,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        } as Rubric

        rubrics.push(newRubric)
        localStorage.setItem(RUBRICS_KEY, JSON.stringify(rubrics))
        return { data: newRubric, error: null }
    }

    async getById(id: string) {
        await delay(200)
        const rubrics = JSON.parse(localStorage.getItem(RUBRICS_KEY) || '[]')
        const found = rubrics.find((r: Rubric) => r.id === id)
        return { data: found || null, error: found ? null : { message: 'Rubric not found' } }
    }

    async getByAssignment(assignmentId: string) {
        await delay(200)
        const rubrics = JSON.parse(localStorage.getItem(RUBRICS_KEY) || '[]')
        const found = rubrics.find((r: Rubric) => r.assignment_id === assignmentId)
        return { data: found || null, error: null } // Return null if not found, not error
    }

    async update(id: string, updates: Partial<Rubric>) {
        await delay(300)
        const rubrics = JSON.parse(localStorage.getItem(RUBRICS_KEY) || '[]')
        const index = rubrics.findIndex((r: Rubric) => r.id === id)

        if (index === -1) {
            return { data: null, error: { message: 'Rubric not found' } }
        }

        const updatedRubric = {
            ...rubrics[index],
            ...updates
        }

        rubrics[index] = updatedRubric
        localStorage.setItem(RUBRICS_KEY, JSON.stringify(rubrics))
        return { data: updatedRubric, error: null }
    }

    async listTemplates() {
        await delay(300)
        const rubrics = JSON.parse(localStorage.getItem(RUBRICS_KEY) || '[]')
        // Filter rubrics that have no assignment_id (templates)
        const templates = rubrics.filter((r: Rubric) => !r.assignment_id)
        return { data: templates, error: null }
    }
}

class MockSubmissions implements SubmissionsApi {
    async create(submission: Partial<Submission>) {
        await delay(300)
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const newSubmission = {
            ...submission,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        } as Submission

        submissions.push(newSubmission)
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions))
        return { data: newSubmission, error: null }
    }

    async list(studentId: string) {
        await delay(300)
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const studentSubmissions = submissions.filter((s: Submission) => s.student_id === studentId)
        return { data: studentSubmissions, error: null }
    }

    async listByAssignment(assignmentId: string) {
        await delay(300)
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')

        const assignmentSubmissions = submissions
            .filter((s: Submission) => s.assignment_id === assignmentId)
            .map((s: Submission) => ({
                ...s,
                profile: profiles.find((p: Profile) => p.id === s.student_id)
            }))

        return { data: assignmentSubmissions, error: null }
    }

    async update(id: string, updates: Partial<Submission>) {
        await delay(300)
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const index = submissions.findIndex((s: Submission) => s.id === id)
        if (index === -1) return { data: null, error: { message: 'Not found' } }

        submissions[index] = { ...submissions[index], ...updates }
        localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions))
        return { data: submissions[index], error: null }
    }

    async get(id: string) {
        await delay(200)
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const sub = submissions.find((s: Submission) => s.id === id)
        if (!sub) return { data: null, error: { message: 'Not found' } }

        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')
        return {
            data: {
                ...sub,
                assignment: assignments.find((a: Assignment) => a.id === sub.assignment_id)
            },
            error: null
        }
    }
}

class MockReviews implements ReviewsApi {
    async create(review: Partial<Review>) {
        await delay(300)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const newReview = {
            ...review,
            id: crypto.randomUUID(),
            created_at: new Date().toISOString()
        } as Review

        reviews.push(newReview)
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
        return { data: newReview, error: null }
    }

    async listToReview(reviewerId: string) {
        await delay(300)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const assignedReviews = reviews.filter((r: Review) => r.reviewer_id === reviewerId)
        return { data: assignedReviews, error: null }
    }

    async get(id: string) {
        await delay(200)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const r = reviews.find((r: Review) => r.id === id)
        if (!r) return { data: null, error: { message: 'Not found' } }

        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const sub = submissions.find((s: Submission) => s.id === r.submission_id)
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')
        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')

        return {
            data: {
                ...r,
                submission: {
                    ...sub,
                    profile: profiles.find((p: Profile) => p.id === sub.student_id)
                },
                assignment: assignments.find((a: Assignment) => a.id === sub.assignment_id)
            },
            error: null
        }
    }

    async assignPeerReviews(_assignmentId: string, reviews: any[]) {
        await delay(500)
        const existingReviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const newReviews = reviews.map(r => ({ ...r, id: crypto.randomUUID(), created_at: new Date().toISOString() }))
        localStorage.setItem(REVIEWS_KEY, JSON.stringify([...existingReviews, ...newReviews]))
        return { error: null }
    }

    async listToReviewWithDetails(reviewerId: string) {
        await delay(300)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')
        const assignments = JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY) || '[]')

        const assigned = reviews
            .filter((r: Review) => r.reviewer_id === reviewerId)
            .map((r: Review) => {
                const sub = submissions.find((s: Submission) => s.id === r.submission_id)
                return {
                    ...r,
                    submission: {
                        ...sub,
                        profile: profiles.find((p: Profile) => p.id === sub.student_id)
                    },
                    assignment: assignments.find((a: Assignment) => a.id === sub.assignment_id)
                }
            })
        return { data: assigned, error: null }
    }

    async listByAssignment(assignmentId: string) {
        await delay(300)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const submissions = JSON.parse(localStorage.getItem(SUBMISSIONS_KEY) || '[]')
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')

        const assignmentReviews = reviews
            .filter((r: Review) => {
                const sub = submissions.find((s: Submission) => s.id === r.submission_id)
                return sub?.assignment_id === assignmentId
            })
            .map((r: Review) => {
                const sub = submissions.find((s: Submission) => s.id === r.submission_id)
                return {
                    ...r,
                    reviewer: profiles.find((p: Profile) => p.id === r.reviewer_id),
                    submission: {
                        ...sub,
                        profile: profiles.find((p: Profile) => p.id === sub.student_id)
                    }
                }
            })
        return { data: assignmentReviews, error: null }
    }

    async update(id: string, updates: any) {
        await delay(300)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const index = reviews.findIndex((r: Review) => r.id === id)
        if (index === -1) return { data: null, error: { message: 'Not found' } }

        reviews[index] = { ...reviews[index], ...updates }
        localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
        return { data: reviews[index], error: null }
    }

    async listReviewsForSubmission(submissionId: string) {
        await delay(300)
        const reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
        const profiles = JSON.parse(localStorage.getItem('p2p_profiles') || '[]')

        const submissionReviews = reviews
            .filter((r: Review) => r.submission_id === submissionId)
            .map((r: Review) => ({
                ...r,
                reviewer: profiles.find((p: Profile) => p.id === r.reviewer_id)
            }))
        return { data: submissionReviews, error: null }
    }
}

class MockStorage implements StorageApi {
    async uploadFile(bucket: string, path: string, _file: File) {
        await delay(500)
        console.log(`Mock upload to ${bucket}/${path}`)
        return { data: { path }, error: null }
    }

    getPublicUrl(bucket: string, path: string) {
        return `https://mock-storage.com/${bucket}/${path}`
    }
}

export const mockApi: Api = {
    auth: new MockAuth(),
    assignments: new MockAssignments(),
    rubrics: new MockRubrics(),
    submissions: new MockSubmissions(),
    reviews: new MockReviews(),
    storage: new MockStorage()
}

    // Global expose for console debugging
    ; (window as any).mockApi = mockApi
