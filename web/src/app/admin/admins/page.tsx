import { createClient, getAdminClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminManager from "@/components/admin/AdminManager"
import { Profile } from "@/types/database"

export const dynamic = "force-dynamic"

export default async function AdminAdminsPage() {
  if (!isSupabaseConfigured()) {
    redirect("/admin")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/admin/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || user.user_metadata?.role

  // STRICT GUARD: Only Super Admin can access Admin Management
  if (userRole !== "super_admin") {
    redirect("/admin")
  }

  // Fetch all admins & super_admin using service client for guaranteed reliability
  const adminClient = getAdminClient()
  const { data } = await adminClient
    .from("profiles")
    .select("*")
    .in("role", ["admin", "super_admin"])
    .order("role", { ascending: false })
    .order("created_at", { ascending: false })

  const admins = (data as Profile[]) || []

  return <AdminManager initialAdmins={admins} currentUserId={user.id} />
}
