import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
}

// Use createBrowserClient from @supabase/ssr for cookie-based auth
// This ensures middleware and API routes can read the session
export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)