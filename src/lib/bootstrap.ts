import type { Api } from './api'
import { supabaseApi } from './supabaseApi'

// Default to supabaseApi as requested
export const api: Api = supabaseApi 
