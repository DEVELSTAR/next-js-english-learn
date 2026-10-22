import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/sign-in?redirectTo=/admin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      {/* Top Admin Nav Bar */}
      <div className="bg-[#2c3e50] text-white rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-extrabold text-base tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Admin Control Panel</span>
          </Link>
          <nav className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href="/admin/lessons"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Lessons & Topics
            </Link>
            <Link
              href="/admin/students"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Students
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-stone-300 font-mono">
            {profile.name} ({profile.role.toUpperCase()})
          </span>
          <Link
            href="/"
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-md transition"
          >
            &larr; Public Site
          </Link>
        </div>
      </div>

      <div>{children}</div>
    </div>
  )
}

