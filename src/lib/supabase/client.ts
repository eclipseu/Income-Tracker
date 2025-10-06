import { createBrowserClient } from "@supabase/ssr";

// Module-level constants so Next.js inlines them for the browser bundle
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://jlfedjiwqvujzihwamgk.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZmVkaml3cXZ1anppaHdhbWdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MjU1MzUsImV4cCI6MjA3NTMwMTUzNX0.aIEMItTDI6eiKxSRA4H_QEzHsvRQi6WX3KyYJN3Uwd0";

export function createClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase env vars missing. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local"
    );
  }
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
