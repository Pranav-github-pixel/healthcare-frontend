import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iaxhpngxsbukrkjwynpe.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_x17U_-i_MtJnS4vTsy6Cyg_rY3ufLsw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
