import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { Lesson } from "@/types/database"
import { Calendar, Search } from "lucide-react"

export const dynamic = "force-dynamic"

interface LessonsPageProps {
  searchParams: Promise<{ query?: string; topic?: string }>
}

export default async function LessonsPage({ searchParams }: LessonsPageProps) {
  const { query, topic } = await searchParams
  let lessons: Lesson[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      let q = supabase
        .from("lessons")
        .select("*")
        .eq("status", "published")
        .eq("lesson_type", "daily_class")
        .order("lesson_date", { ascending: false })

      if (query) {
        q = q.ilike("title", `%${query}%`)
      }

      if (topic) {
        q = q.eq("topic", topic)
      }

      const { data } = await q
      if (data && data.length > 0) {
        lessons = data
      }
    } catch {
      // Ignore network errors and fall back
    }
  }

  // Fallback to mock data if empty or offline
  if (lessons.length === 0) {
    let mockDaily = MOCK_LESSONS.filter((l) => l.lesson_type === "daily_class")
    if (query) {
      mockDaily = mockDaily.filter((l) =>
        l.title.toLowerCase().includes(query.toLowerCase())
      )
    }
    if (topic) {
      mockDaily = mockDaily.filter((l) => l.topic === topic)
    }
    lessons = mockDaily
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Daily English Classes
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Day-by-day practical vocabulary, Hinglish sentence breakdowns, and concept-first explanations.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <form method="get" className="flex items-center gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search classes by title..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition cursor-pointer shadow-xs"
        >
          Search
        </button>
      </form>

      {/* Lessons List */}
      <div className="space-y-3">
        {lessons && lessons.length > 0 ? (
          lessons.map((lesson) => (
            <Link
              key={lesson.id}
              href={`/lessons/${lesson.slug}`}
              className="block p-4 sm:p-5 rounded-2xl border border-emerald-900/10 bg-white/90 backdrop-blur-xs hover:border-emerald-600/40 hover:shadow-xs transition group"
            >
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(lesson.lesson_date).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                {lesson.topic && (
                  <span className="text-stone-600 font-sans font-semibold bg-stone-100 px-2.5 py-0.5 rounded-full text-[11px]">
                    {lesson.topic}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-stone-900 group-hover:text-emerald-700 transition">
                {lesson.title}
              </h2>
              {lesson.introduction && (
                <p className="text-xs text-stone-500 line-clamp-2 mt-1">
                  {lesson.introduction}
                </p>
              )}
            </Link>
          ))
        ) : (
          <div className="py-12 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            No daily classes found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
