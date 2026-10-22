import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ShieldCheck, LogOut, BookOpen, Users, UserCheck } from "lucide-react"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // For unauthenticated users (e.g. /admin/login), render children without admin chrome
  if (!user) {
    return <>{children}</>
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // If not admin, let page/middleware handle redirect
  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return <>{children}</>
  }

  const isSuperAdmin = profile.role === "super_admin"

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Admin Nav Bar */}
      <header className="bg-stone-900 border border-stone-800 text-white rounded-2xl px-5 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <Link
            href="/admin"
            className="font-extrabold text-sm sm:text-base tracking-wide flex items-center gap-2.5 text-white hover:text-emerald-400 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Admin Control Panel</span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 text-xs font-semibold">
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5 text-stone-200"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Lessons & Topics</span>
            </Link>

            <Link
              href="/admin/students"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition flex items-center gap-1.5 text-stone-200"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Students</span>
            </Link>

            {/* Only Super Admin can CRUD Admins */}
            {isSuperAdmin && (
              <Link
                href="/admin/admins"
                className="px-3 py-1.5 rounded-lg bg-emerald-600/30 border border-emerald-500/40 hover:bg-emerald-600/40 transition flex items-center gap-1.5 text-emerald-300 font-bold"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Management</span>
              </Link>
            )}
          </nav>
        </div>

        {/* Right: Profile Info & Sign Out */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-300 font-medium">{profile.name}</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                isSuperAdmin
                  ? "bg-amber-400 text-stone-950 shadow-xs"
                  : "bg-emerald-500/30 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              {isSuperAdmin ? "Super Admin" : "Admin"}
            </span>
          </div>

          <Link
            href="/auth/sign-out?redirectTo=/admin/login"
            className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 hover:text-white rounded-lg transition flex items-center gap-1.5 font-semibold cursor-pointer"
            title="Sign out of Admin Portal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </Link>
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
