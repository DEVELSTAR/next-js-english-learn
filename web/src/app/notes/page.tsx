import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import Link from "next/link"
import { FileText } from "lucide-react"

export const dynamic = "force-dynamic"

interface NotesPageProps {
  searchParams: Promise<{ lesson_id?: string }>
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const { lesson_id } = await searchParams
  let notes: any[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      let q = supabase
        .from("notes")
        .select("*, user:profiles(name, email), lesson:lessons(id, title, slug, lesson_type)")
        .order("created_at", { ascending: false })

      if (lesson_id) {
        q = q.eq("lesson_id", lesson_id)
      }

      const { data } = await q
      notes = data || []
    } catch {
      // Ignore network errors and fall back
    }
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="border-b border-stone-200 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Class & Topic Notes
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Community and personal study notes to help remember core vocabulary and patterns.
          </p>
        </div>
      </div>

      {/* Notes Feed */}
      <div className="space-y-4">
        {notes && notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-5 rounded-2xl border border-stone-200 bg-white shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-stone-400">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-800">{note.user?.name || "Student"}</span>
                  {note.lesson && (
                    <Link
                      href={note.lesson.lesson_type === "foundational_topic" ? `/topics/${note.lesson.slug}` : `/lessons/${note.lesson.slug}`}
                      className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition"
                    >
                      {note.lesson.title}
                    </Link>
                  )}
                </div>
                <span className="font-mono text-[11px]">
                  {new Date(note.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="text-stone-800 text-sm whitespace-pre-wrap leading-relaxed">
                {note.content}
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200 space-y-2">
            <FileText className="w-8 h-8 text-stone-300 mx-auto" />
            <p>No notes written yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
