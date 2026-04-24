import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  
  // GUNAKAN FALLBACK: Jika tidak ada env, gunakan nilai palsu sementara HANYA saat build time
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Tangani kemungkinan error saat dipanggil dari Server Component
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Tangani kemungkinan error saat dipanggil dari Server Component
        }
      },
    },
  });
}