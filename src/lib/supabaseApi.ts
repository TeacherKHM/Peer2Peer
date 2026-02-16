import { supabase } from './supabase'
import type { Api, AuthApi, AssignmentsApi, RubricsApi, SubmissionsApi, ReviewsApi, StorageApi, Profile, Assignment, Rubric, Submission, Review } from './api'
import type { Session } from '@supabase/supabase-js'
import type { Database } from './database.types'

class SupabaseAuth implements AuthApi {
    async signIn(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        return { user: data.user, session: data.session, error }
    }

    async signUp(email: string, password: string, metadata?: { full_name: string; role: 'student' | 'teacher' }) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })
        return { user: data.user, session: data.session, error }
    }

    async signOut(): Promise<{ error: any }> {
        const { error } = await supabase.auth.signOut()
        return { error }
    }

    async getSession() {
        const { data } = await supabase.auth.getSession()
        return { session: data.session }
    }

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(callback)
        return { subscription }
    }

    async getProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle() // Use maybeSingle to avoid 406/PGRST116 when 0 rows
        return { data: data as Profile | null, error }
    }

    async createProfile(profile: Database['public']['Tables']['profiles']['Insert']) {
        const { data, error } = await (supabase as any)
            .from('profiles')
            .insert(profile)
            .select()
            .single()
        return { data: data as Profile | null, error }
    }

    async listStudents() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'student')
        return { data: data as Profile[] | null, error }
    }

    async resetPassword(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        })
        return { error }
    }

    async updatePassword(password: string) {
        const { error } = await supabase.auth.updateUser({ password })
        return { error }
    }
}

class SupabaseAssignments implements AssignmentsApi {
    async list() {
        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .order('created_at', { ascending: false })
        return { data: data as Assignment[] | null, error }
    }

    async create(assignment: Database['public']['Tables']['assignments']['Insert']) {
        const { data, error } = await (supabase as any)
            .from('assignments')
            .insert(assignment)
            .select()
            .single()
        return { data: data as Assignment | null, error }
    }

    async get(id: string) {
        const { data, error } = await supabase
            .from('assignments')
            .select('*')
            .eq('id', id)
            .single()
        return { data: data as Assignment | null, error }
    }

    async update(id: string, updates: Database['public']['Tables']['assignments']['Update']) {
        const { data, error } = await (supabase as any)
            .from('assignments')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        return { data: data as Assignment | null, error }
    }

    async delete(id: string) {
        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', id)
        return { error }
    }
}

class SupabaseRubrics implements RubricsApi {
    async create(rubric: Database['public']['Tables']['rubrics']['Insert']) {
        const { data, error } = await (supabase as any)
            .from('rubrics')
            .insert(rubric)
            .select()
            .single()
        return { data: data as Rubric | null, error }
    }

    async getById(id: string) {
        const { data, error } = await supabase
            .from('rubrics')
            .select('*')
            .eq('id', id)
            .single()
        return { data: data as Rubric | null, error }
    }

    async getByAssignment(assignmentId: string) {
        const { data, error } = await supabase
            .from('rubrics')
            .select('*')
            .eq('assignment_id', assignmentId)
            .maybeSingle()
        return { data: data as Rubric | null, error }
    }

    async update(id: string, updates: Database['public']['Tables']['rubrics']['Update']) {
        const { data, error } = await (supabase as any)
            .from('rubrics')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        return { data: data as Rubric | null, error }
    }

    async listTemplates() {
        const { data, error } = await supabase
            .from('rubrics')
            .select('*')
            .is('assignment_id', null)
        return { data: data as Rubric[] | null, error }
    }
}

class SupabaseSubmissions implements SubmissionsApi {
    async create(submission: Database['public']['Tables']['submissions']['Insert']) {
        const { data, error } = await (supabase as any)
            .from('submissions')
            .insert(submission)
            .select()
            .single()
        return { data: data as Submission | null, error }
    }

    async list(studentId: string) {
        const { data, error } = await supabase
            .from('submissions')
            .select('*')
            .eq('student_id', studentId)
        return { data: data as Submission[] | null, error }
    }

    async listByAssignment(assignmentId: string) {
        const { data, error } = await supabase
            .from('submissions')
            .select('*, profile:profiles(*)')
            .eq('assignment_id', assignmentId)
        return { data: data as any, error }
    }

    async update(id: string, updates: Database['public']['Tables']['submissions']['Update']) {
        const { data, error } = await (supabase as any)
            .from('submissions')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        return { data: data as Submission | null, error }
    }

    async get(id: string) {
        const { data, error } = await supabase
            .from('submissions')
            .select('*, assignment:assignments(*)')
            .eq('id', id)
            .single()
        return { data: data as any, error }
    }
}

class SupabaseReviews implements ReviewsApi {
    async create(review: Database['public']['Tables']['reviews']['Insert']) {
        const { data, error } = await (supabase as any)
            .from('reviews')
            .insert(review)
            .select()
            .single()
        return { data: data as Review | null, error }
    }

    async listToReview(reviewerId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('reviewer_id', reviewerId)
        return { data: data as Review[] | null, error }
    }

    async assignPeerReviews(assignmentId: string, reviews: Database['public']['Tables']['reviews']['Insert'][]) {
        // First, delete existing reviews for this assignment if we want to re-shuffle
        // Or we can just insert and handle duplicates if we want to be more careful.
        // User said "give 2 submissions to evaluate for each student" and "handle late works"
        // I will delete existing and re-assign for simplicity if the teacher triggers it again.

        // Find all submissions for this assignment to delete existing reviews linked to them
        const { data: subs } = await supabase.from('submissions').select('id').eq('assignment_id', assignmentId)
        if (subs && subs.length > 0) {
            await (supabase as any).from('reviews').delete().in('submission_id', (subs as any[]).map(s => s.id))
        }

        const { error } = await (supabase as any)
            .from('reviews')
            .insert(reviews)

        return { error }
    }

    async get(id: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                submission:submissions!inner (
                    *,
                    profile:profiles!inner (*),
                    assignment:assignments!inner (*)
                )
            `)
            .eq('id', id)
            .single()

        if (data) {
            const r = data as any
            return {
                data: {
                    ...r,
                    assignment: r.submission.assignment,
                    submission: {
                        ...r.submission,
                        profile: r.submission.profile,
                        assignment: undefined
                    }
                },
                error
            }
        }
        return { data: null, error }
    }

    async listToReviewWithDetails(reviewerId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                submission:submissions!inner (
                    *,
                    profile:profiles!inner (*),
                    assignment:assignments!inner (*)
                )
            `)
            .eq('reviewer_id', reviewerId)

        const finalData = (data as any[] | null)?.map(r => ({
            ...r,
            assignment: r.submission.assignment,
            submission: {
                ...r.submission,
                profile: r.submission.profile, // mapped from profile join
                assignment: undefined
            }
        }))

        return { data: finalData as any, error }
    }

    async listByAssignment(assignmentId: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewer:profiles!inner (*),
                submission:submissions!inner (
                    *,
                    profile:profiles!inner (*)
                )
            `)
            .eq('submission.assignment_id', assignmentId)

        return { data: data as any, error }
    }

    async update(id: string, updates: Database['public']['Tables']['reviews']['Update']) {
        const { data, error } = await (supabase as any)
            .from('reviews')
            .update(updates)
            .eq('id', id)
            .select()
            .single()
        return { data: data as Review | null, error }
    }

    async listReviewsForSubmission(submission_id: string) {
        const { data, error } = await supabase
            .from('reviews')
            .select(`
                *,
                reviewer:profiles!inner (*)
            `)
            .eq('submission_id', submission_id)

        return { data: data as any, error }
    }
}

class SupabaseStorage implements StorageApi {
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            })
        return { data, error }
    }

    getPublicUrl(bucket: string, path: string) {
        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path)
        return data.publicUrl
    }
}

export const supabaseApi: Api = {
    auth: new SupabaseAuth(),
    assignments: new SupabaseAssignments(),
    rubrics: new SupabaseRubrics(),
    submissions: new SupabaseSubmissions(),
    reviews: new SupabaseReviews(),
    storage: new SupabaseStorage()
}
