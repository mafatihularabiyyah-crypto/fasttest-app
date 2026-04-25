import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // KUNCI SAKTINYA DI SINI: Jika env kosong saat build, pakai data dummy agar tidak crash!
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy";
  
  return createBrowserClient(url, key);
}