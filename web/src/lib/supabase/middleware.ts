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
  // supabase.auth.getUser(). A simple mistake could compromise your auth flow.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Fetch role if user is authenticated
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    userRole = profile?.role || "student"
  }

  const isAdmin = userRole === "admin" || userRole === "super_admin"

  // 1. Dedicated Admin Sign-in Route: /admin/login
  if (pathname === "/admin/login") {
    if (user && isAdmin) {
      // Already logged in as admin, go straight to dashboard
      return NextResponse.redirect(new URL("/admin", request.url))
    }
    return supabaseResponse
  }

  // 2. Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      // Unauthenticated users trying to access admin panel go to /admin/login
      const url = new URL("/admin/login", request.url)
      url.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(url)
    }

    if (!isAdmin) {
      // Students or non-admins are denied access
      return NextResponse.redirect(new URL("/", request.url))
    }

    // Only super_admin can access /admin/admins
    if (pathname.startsWith("/admin/admins") && userRole !== "super_admin") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }

    return supabaseResponse
  }

  // 3. Admin boundary: Admins only have access to the admin panel
  // If an admin visits public student pages, redirect them to /admin
  if (user && isAdmin) {
    // Allow sign-out and API routes
    if (!pathname.startsWith("/api") && pathname !== "/auth/sign-out") {
      return NextResponse.redirect(new URL("/admin", request.url))
    }
  }

  return supabaseResponse
}

