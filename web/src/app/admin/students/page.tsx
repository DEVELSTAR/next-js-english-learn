import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { Users, Mail } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminStudentsPage() {
  let students: any[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
      students = data || []
    } catch {
      // Ignore
    }
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Registered Users & Students</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            View student accounts, roles, and registration dates.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 px-3 py-1 rounded-full">
          {students?.length || 0} Total
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-y border-stone-200 font-semibold">
            <tr>
              <th className="py-2.5 px-3">Name</th>
              <th className="py-2.5 px-3">Email Address</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3 text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-medium">
            {students && students.length > 0 ? (
              students.map((s) => (
                <tr key={s.id} className="hover:bg-stone-50/60 transition">
                  <td className="py-3 px-3 font-bold text-stone-900">{s.name}</td>
                  <td className="py-3 px-3 text-stone-600 flex items-center gap-1.5 font-mono text-[11px]">
                    <Mail className="w-3.5 h-3.5 text-stone-400" />
                    <span>{s.email}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        s.role === "super_admin"
                          ? "bg-red-100 text-red-800"
                          : s.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-stone-100 text-stone-700"
                      }`}
                    >
                      {s.role}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-stone-400 font-mono text-[11px]">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-stone-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
