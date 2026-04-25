import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  // HARDCODE LANGSUNG
  const url = "https://cpjaoegcdzvuovwwsnvy.supabase.co";
  const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamFvZWdjZHp2dW92d3dzbnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTE2OTQsImV4cCI6MjA5MTEyNzY5NH0.hh7CONALZJeEoe76YnDZcoCk5Br3SGObxInahUWGeDI";
  
  return createBrowserClient(url, key);
}