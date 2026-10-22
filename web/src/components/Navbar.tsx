import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"

export default async function Navbar() {
  let user = null
  let profile = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      user = data.user
      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        profile = profileData
      }
    } catch {
      // ignore offline errors
    }
  }

  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-emerald-900/10 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 text-stone-900 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white font-semibold text-sm shadow-xs group-hover:bg-emerald-700 transition">
                LE
              </div>
              <div>
                <span className="font-bold text-base tracking-tight block leading-tight">Learn English</span>
                <span className="text-[10px] text-stone-500 font-medium tracking-wide uppercase block -mt-0.5">Daily Hinglish</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-stone-200">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#2c3e50] text-white hover:bg-[#1a252f] transition flex items-center gap-1.5 shadow-2xs mr-2"
                >
                  Admin Panel
                </Link>
              )}
              <Link href="/" className="px-3 py-1.5 rounded-md text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition">
                Home
              </Link>
              <Link href="/topics" className="px-3 py-1.5 rounded-md text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition">
                Topics
              </Link>
              <Link href="/lessons" className="px-3 py-1.5 rounded-md text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition">
                Daily Classes
              </Link>
              <Link href="/notes" className="px-3 py-1.5 rounded-md text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition">
                Notes
              </Link>
            </nav>
          </div>

          {/* User controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-stone-600 font-medium hidden sm:inline">
                  {profile?.name || user.email}
                </span>
                <form action="/auth/sign-out" method="post">
                  <button
                    type="submit"
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 transition cursor-pointer"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/sign-in"
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-stone-700 hover:bg-stone-100 transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/sign-up"
                  className="text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

