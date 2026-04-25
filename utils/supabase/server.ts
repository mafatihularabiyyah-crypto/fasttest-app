import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = cookies();
  
  // KITA HARDCODE LANGSUNG DI SINI! Cloudflare tidak bisa lagi bilang kuncinya kosong.
  const url = "https://cpjaoegcdzvuovwwsnvy.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamFvZWdjZHp2dW92d3dzbnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTE2OTQsImV4cCI6MjA5MTEyNzY5NH0.hh7CONALZJeEoe76YnDZcoCk5Br3SGObxInahUWGeDI";

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try { cookieStore.set({ name, value, ...options }); } catch (error) {}
      },
      remove(name: string, options: any) {
        try { cookieStore.set({ name, value: '', ...options }); } catch (error) {}
      },
    },
  });
}