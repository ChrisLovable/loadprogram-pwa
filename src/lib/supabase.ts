import { createClient } from '@supabase/supabase-js'

// HARDCODED for testing - using your working project values
const supabaseUrl = 'https://rdzjowqopmdlbkfuafxr.supabase.co';
const supabaseKey = 'sb_publishable_Zfc7tBpl0ho1GuF2HLjKxQ_BlU_A24w';

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

