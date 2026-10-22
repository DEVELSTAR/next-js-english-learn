import { createBrowserClient } from "@supabase/ssr"
import { isSupabaseConfigured, normalizeSupabaseUrl } from "./config"

export { isSupabaseConfigured, normalizeSupabaseUrl }

export function createClient() {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://placeholder.supabase.co"
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "placeholder-key"

  return createBrowserClient(url, key)
}


