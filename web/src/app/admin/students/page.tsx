import { createClient, getAdminClient, isSupabaseConfigured } from "@/lib/supabase/server"
import StudentManager from "@/components/admin/StudentManager"
import { Profile } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function AdminStudentsPage() {
  let students: Profile[] = []
  let currentUserRole = "admin"

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      // Fetch caller profile
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
        currentUserRole = profile?.role || user.user_metadata?.role || "admin"
      }

      // Fetch only students (admins are managed under /admin/admins)
      const adminClient = getAdminClient()
      const { data } = await adminClient
        .from("profiles")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false })

      students = (data as Profile[]) || []
    } catch {
      // Ignore
    }
  }

  return (
    <StudentManager
      initialStudents={students}
      currentUserRole={currentUserRole}
    />
  )
}
