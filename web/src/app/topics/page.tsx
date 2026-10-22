import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { Lesson } from "@/types/database"
import { Sparkles, Search } from "lucide-react"

export const dynamic = "force-dynamic"

interface TopicsPageProps {
  searchParams: Promise<{ query?: string }>
}

export default async function TopicsPage({ searchParams }: TopicsPageProps) {
  const { query } = await searchParams
  let topics: Lesson[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      let q = supabase
        .from("lessons")
        .select("*")
        .eq("status", "published")
        .eq("lesson_type", "foundational_topic")
        .order("position", { ascending: true })

      if (query) {
        q = q.ilike("title", `%${query}%`)
      }

      const { data } = await q
      if (data && data.length > 0) {
        topics = data
      }
    } catch {
      // Ignore network errors and fall back
    }
  }

  // Fallback to mock data if empty or offline
  if (topics.length === 0) {
    let mockTopics = MOCK_LESSONS.filter((l) => l.lesson_type === "foundational_topic")
    if (query) {
      mockTopics = mockTopics.filter((l) =>
        l.title.toLowerCase().includes(query.toLowerCase())
      )
    }
    topics = mockTopics
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-stone-200 pb-5 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          Foundational Topics
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Core English concepts, grammar foundations, and speaking frameworks arranged by topic.
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
            placeholder="Search topics by title..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
        >
          Search
        </button>
      </form>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topics && topics.length > 0 ? (
          topics.map((topic) => (
            <Link
              key={topic.id}
              href={`/topics/${topic.slug}`}
              className="p-5 rounded-2xl border border-stone-200 bg-white hover:border-emerald-500 hover:shadow-xs transition group flex flex-col justify-between"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  Foundation
                </span>
                <h2 className="text-base font-bold text-stone-900 group-hover:text-emerald-700 transition">
                  {topic.title}
                </h2>
                {topic.introduction && (
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {topic.introduction}
                  </p>
                )}
              </div>
              <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Explore Topic &rarr;</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-xs text-stone-400 bg-stone-50/50 rounded-2xl border border-dashed border-stone-200">
            No foundational topics found matching your criteria.
          </div>
        )}
      </div>
    </div>
  )
}
