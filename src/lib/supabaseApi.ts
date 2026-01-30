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

    async signOut() {
        await supabase.auth.signOut()
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
