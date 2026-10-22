export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return ""
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "")
}

export function isSupabaseConfigured(): boolean {
  const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) return false
  if (
    url.includes("your-project-ref") ||
    url.includes("placeholder") ||
    key.includes("your-anon-key") ||
    key.length < 20
  ) {
    return false
  }
  return true
}



