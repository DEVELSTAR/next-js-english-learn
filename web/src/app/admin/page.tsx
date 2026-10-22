import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { Plus, BookOpen, Sparkles, Users, FileText } from "lucide-react"
import DeleteLessonButton from "@/components/admin/DeleteLessonButton"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  let lessonsCount = 0
  let topicsCount = 0
  let studentsCount = 0
  let notesCount = 0
  let recentLessons: any[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      // 1. Fetch counts
      const [{ count: lCount }, { count: tCount }, { count: sCount }, { count: nCount }] =
        await Promise.all([
          supabase.from("lessons").select("*", { count: "exact", head: true }).eq("lesson_type", "daily_class"),
          supabase.from("lessons").select("*", { count: "exact", head: true }).eq("lesson_type", "foundational_topic"),
          supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
          supabase.from("notes").select("*", { count: "exact", head: true }),
        ])

      lessonsCount = lCount || 0
      topicsCount = tCount || 0
      studentsCount = sCount || 0
      notesCount = nCount || 0

      // 2. Fetch recent lessons
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8)
      recentLessons = data || []
    } catch {
      // Ignore
    }
  } else {
    lessonsCount = MOCK_LESSONS.filter((l) => l.lesson_type === "daily_class").length
    topicsCount = MOCK_LESSONS.filter((l) => l.lesson_type === "foundational_topic").length
    recentLessons = MOCK_LESSONS
  }

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Classes</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{lessonsCount || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Topics</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{topicsCount || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
            <Users className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{studentsCount || 0}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-stone-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Notes</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900">{notesCount || 0}</div>
        </div>
      </div>

      {/* Action Header */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900">Manage Content</h2>
            <p className="text-xs text-stone-500">Create, edit, or publish lessons and foundational topics.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/lessons/new?type=daily_class"
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Class</span>
            </Link>
            <Link
              href="/admin/lessons/new?type=foundational_topic"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Topic</span>
            </Link>
          </div>
        </div>

        {/* Lessons List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase tracking-wider text-[10px] border-y border-stone-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {recentLessons && recentLessons.length > 0 ? (
                recentLessons.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          l.lesson_type === "foundational_topic"
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-blue-50 text-blue-800"
                        }`}
                      >
                        {l.lesson_type === "foundational_topic" ? "Topic" : "Class"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-stone-900">
                      <Link
                        href={l.lesson_type === "foundational_topic" ? `/topics/${l.slug}` : `/lessons/${l.slug}`}
                        className="hover:underline"
                      >
                        {l.title}
                      </Link>
                    </td>
                    <td className="py-3 px-3 text-stone-500 font-mono text-[11px]">{l.lesson_date}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          l.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/lessons/${l.id}/edit`}
                          className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition"
                        >
                          Edit
                        </Link>
                        <DeleteLessonButton lessonId={l.id} lessonTitle={l.title} />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-stone-400">
                    No lessons created yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
