import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isSupabaseConfigured, normalizeSupabaseUrl } from "./config"

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-pathname", request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  if (!isSupabaseConfigured()) {
    return supabaseResponse
  }

  const supabaseUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)!
  const supabaseAnonKey =
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Helper to create redirect response while preserving all Supabase session cookies
  function createRedirect(destination: string | URL) {
    const targetUrl = typeof destination === "string" ? new URL(destination, request.url) : destination
    const redirectResponse = NextResponse.redirect(targetUrl)
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectResponse
  }

  // Fetch role if user is authenticated
  let userRole: string | null = null
  if (user) {
    // 1. Check user_metadata first as fast & infallible cache
    const metaRole = user.user_metadata?.role
    if (metaRole === "admin" || metaRole === "super_admin") {
      userRole = metaRole
    }

    // 2. Query profiles table
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      if (profile?.role) {
        userRole = profile.role
      }
    } catch {
      // Keep metaRole if profile query fails or times out
    }

    if (!userRole) {
      userRole = "student"
    }
  }

  const isAdmin = userRole === "admin" || userRole === "super_admin"

  // 1. Dedicated Admin Sign-in Route: /admin/login
  if (pathname === "/admin/login") {
    if (user && isAdmin) {
      // Already logged in as admin, go straight to dashboard
      return createRedirect("/admin")
    }
    return supabaseResponse
  }

  // 2. Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Unauthenticated users trying to access admin panel go to /admin/login
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("redirectTo", pathname)
      return createRedirect(url)
    }

    if (!isAdmin) {
      // Students or non-admins are denied access
      return createRedirect("/")
    }

    // Only super_admin can access /admin/admins
    if (pathname.startsWith("/admin/admins") && userRole !== "super_admin") {
      return createRedirect("/admin")
    }

    return supabaseResponse
  }

  // 3. Admin boundary: Admins only access admin portal & lesson preview pages
  // If an admin visits public student pages (student sign-in, sign-up, student dashboard),
  // redirect them to /admin so they stay within their control panel.
  if (user && isAdmin) {
    const isAllowedForAdmin =
      pathname.startsWith("/admin") ||
      pathname.startsWith("/lessons") ||
      pathname.startsWith("/topics") ||
      pathname.startsWith("/api") ||
      pathname === "/auth/sign-out"

    if (!isAllowedForAdmin) {
      return createRedirect("/admin")
    }
  }

  return supabaseResponse
}
