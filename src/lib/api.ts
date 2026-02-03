import type { Session, User } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Types based on the Supabase schema
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Assignment = Database['public']['Tables']['assignments']['Row']
export type Rubric = Database['public']['Tables']['rubrics']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']

export interface AuthApi {
    signIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: any }>
    signUp(email: string, password: string, metadata?: { full_name: string; role: 'student' | 'teacher' }): Promise<{ user: User | null; session: Session | null; error: any }>
    getSession(): Promise<{ session: Session | null }>
    onAuthStateChange(callback: (event: string, session: Session | null) => void): { subscription: { unsubscribe: () => void } }
    getProfile(userId: string): Promise<{ data: Profile | null; error: any }>
    createProfile(profile: Database['public']['Tables']['profiles']['Insert']): Promise<{ data: Profile | null; error: any }>
    listStudents(): Promise<{ data: Profile[] | null; error: any }>
    resetPassword(email: string): Promise<{ error: any }>
    updatePassword(password: string): Promise<{ error: any }>
    signOut(): Promise<{ error: any }>
}

export interface AssignmentsApi {
    list(): Promise<{ data: Assignment[] | null; error: any }>
    create(assignment: Database['public']['Tables']['assignments']['Insert']): Promise<{ data: Assignment | null; error: any }>
    get(id: string): Promise<{ data: Assignment | null; error: any }>
    update(id: string, assignment: Database['public']['Tables']['assignments']['Update']): Promise<{ data: Assignment | null; error: any }>
    delete(id: string): Promise<{ error: any }>
}

export interface RubricsApi {
    create(rubric: Database['public']['Tables']['rubrics']['Insert']): Promise<{ data: Rubric | null; error: any }>
    getById(id: string): Promise<{ data: Rubric | null; error: any }>
    getByAssignment(assignmentId: string): Promise<{ data: Rubric | null; error: any }>
    update(id: string, rubric: Database['public']['Tables']['rubrics']['Update']): Promise<{ data: Rubric | null; error: any }>
    listTemplates(): Promise<{ data: Rubric[] | null; error: any }>
}

export interface SubmissionsApi {
    create(submission: Database['public']['Tables']['submissions']['Insert']): Promise<{ data: Submission | null; error: any }>
    list(studentId: string): Promise<{ data: Submission[] | null; error: any }>
    listByAssignment(assignmentId: string): Promise<{ data: (Submission & { profile: Profile })[] | null; error: any }>
    update(id: string, updates: Database['public']['Tables']['submissions']['Update']): Promise<{ data: Submission | null; error: any }>
    get(id: string): Promise<{ data: (Submission & { assignment: Assignment }) | null; error: any }>
}

export interface ReviewsApi {
    create(review: Database['public']['Tables']['reviews']['Insert']): Promise<{ data: Review | null; error: any }>
    get(id: string): Promise<{ data: (Review & { submission: Submission & { profile: Profile }, assignment: Assignment }) | null; error: any }>
    listToReview(reviewerId: string): Promise<{ data: Review[] | null; error: any }>
    assignPeerReviews(assignmentId: string, reviews: Database['public']['Tables']['reviews']['Insert'][]): Promise<{ error: any }>
    listToReviewWithDetails(reviewerId: string): Promise<{ data: (Review & { submission: Submission & { profile: Profile }, assignment: Assignment })[] | null; error: any }>
    listByAssignment(assignmentId: string): Promise<{ data: (Review & { reviewer: Profile, submission: Submission & { profile: Profile } })[] | null; error: any }>
    update(id: string, updates: Database['public']['Tables']['reviews']['Update']): Promise<{ data: Review | null; error: any }>
    listReviewsForSubmission(submissionId: string): Promise<{ data: (Review & { reviewer: Profile })[] | null; error: any }>
}

export interface StorageApi {
    uploadFile(bucket: string, path: string, file: File): Promise<{ data: any; error: any }>
    getPublicUrl(bucket: string, path: string): string
}

export interface Api {
    auth: AuthApi
    assignments: AssignmentsApi
    rubrics: RubricsApi
    submissions: SubmissionsApi
    reviews: ReviewsApi
    storage: StorageApi
}

// We will implement the concrete classes in separate files
// mockApi.ts -> LocalStorage
// supabaseApi.ts -> Supabase
