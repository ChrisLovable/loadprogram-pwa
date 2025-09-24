import { createClient } from '@supabase/supabase-js'

// Type definition for Vite environment variables
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface Load {
  id: number
  driver_name: string
  status: 'uploaded' | 'first_approved' | 'second_approved' | 'third_approved' | 'final_signed_off'
  ocr_data?: any
  created_at: string
  updated_at: string
}

