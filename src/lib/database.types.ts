export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    role: 'student' | 'teacher'
                    created_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    role?: 'student' | 'teacher'
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    role?: 'student' | 'teacher'
                    created_at?: string
                }
            }
            assignments: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    due_date: string | null
                    submission_type: 'pdf' | 'google_docs' | 'url'
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    due_date?: string | null
                    submission_type?: 'pdf' | 'google_docs' | 'url'
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    due_date?: string | null
                    submission_type?: 'pdf' | 'google_docs' | 'url'
                    created_by?: string
                    created_at?: string
                }
            }
            rubrics: {
                Row: {
                    id: string
                    assignment_id: string | null
                    title: string | null
                    criteria: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    assignment_id?: string | null
                    title?: string | null
                    criteria: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    assignment_id?: string | null
                    title?: string | null
                    criteria?: Json
                    created_at?: string
                }
            }
            submissions: {
                Row: {
                    id: string
                    assignment_id: string
                    student_id: string
                    file_url: string
                    status: 'submitted' | 'resubmission_pending'
                    resubmission_justification: string | null
                    new_file_url: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    assignment_id: string
                    student_id: string
                    file_url: string
                    status?: 'submitted' | 'resubmission_pending'
                    resubmission_justification?: string | null
                    new_file_url?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    assignment_id?: string
                    student_id?: string
                    file_url?: string
                    status?: 'submitted' | 'resubmission_pending'
                    resubmission_justification?: string | null
                    new_file_url?: string | null
                    created_at?: string
                }
            }
            reviews: {
                Row: {
                    id: string
                    submission_id: string
                    reviewer_id: string
                    feedback: Json | null
                    score: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    submission_id: string
                    reviewer_id: string
                    feedback?: Json | null
                    score?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    submission_id?: string
                    reviewer_id?: string
                    feedback?: Json | null
                    score?: number | null
                    created_at?: string
                }
            }
        }
    }
}
