import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { isSupabaseConfigured, normalizeSupabaseUrl } from "./config"

export { isSupabaseConfigured, normalizeSupabaseUrl }

// Enforces a 3.5s timeout on Supabase requests so a stalled network never blocks the server
const resilientFetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 3500)

  if (init?.signal) {
    init.signal.addEventListener("abort", () => controller.abort())
  }

  return fetch(input, {
    ...init,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId))
}

export async function createClient() {
  const cookieStore = await cookies()
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://placeholder.supabase.co"
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "placeholder-key"

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
    global: {
      fetch: resilientFetch,
    },
  })
}

// Raw Supabase Admin client with Auth Admin API (create/delete users)
export function getAdminClient() {
  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) || "https://placeholder.supabase.co"
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "placeholder-key"

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}



