import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Tambahkan fallback "dummy" agar proses Build (npm run build) tidak pernah crash!
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co'
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key'

  return createBrowserClient(supabaseUrl, supabaseKey)
}