// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// KITA HARDCODE LANGSUNG DI SINI agar kebal saat proses Build Cloudflare!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cpjaoegcdzvuovwwsnvy.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamFvZWdjZHp2dW92d3dzbnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTE2OTQsImV4cCI6MjA5MTEyNzY5NH0.hh7CONALZJeEoe76YnDZcoCk5Br3SGObxInahUWGeDI";

// Membuat "jembatan" yang bisa dipanggil dari file manapun
export const supabase = createClient(supabaseUrl, supabaseAnonKey);