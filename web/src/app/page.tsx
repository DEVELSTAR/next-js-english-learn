import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { Lesson } from "@/types/database"
import { ArrowRight, BookOpen, Sparkles, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  let todayClass: Lesson | null = null
  let recentClasses: Lesson[] = []
  let topics: Lesson[] = []
  let completedCount = 0
  let isLoggedIn = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      isLoggedIn = Boolean(user)

      // Fetch queries in parallel for high performance
      const [todayRes, recentRes, topicsRes] = await Promise.all([
        supabase
          .from("lessons")
          .select("*")
          .eq("status", "published")
          .eq("lesson_type", "daily_class")
          .order("lesson_date", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("lessons")
          .select("*")
          .eq("status", "published")
          .eq("lesson_type", "daily_class")
          .order("lesson_date", { ascending: false })
          .limit(6),
        supabase
          .from("lessons")
          .select("*")
          .eq("status", "published")
          .eq("lesson_type", "foundational_topic")
          .order("position", { ascending: true })
          .limit(6),
      ])

      todayClass = todayRes.data
      recentClasses = recentRes.data || []
      topics = topicsRes.data || []

      if (user) {
        const { count } = await supabase
          .from("lesson_completions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("completed", true)
        completedCount = count || 0
      }
    } catch {
      // Ignore network errors and fall through to fallback data
    }
  }

  // Fallback to rich starter data if Supabase isn't configured or has no lessons yet
  if (!todayClass && recentClasses.length === 0 && topics.length === 0) {
    const dailyClasses = MOCK_LESSONS.filter((l) => l.lesson_type === "daily_class")
    todayClass = dailyClasses[0] || null
    recentClasses = dailyClasses
    topics = MOCK_LESSONS.filter((l) => l.lesson_type === "foundational_topic")
  }

  return (
    <div className="space-y-12">
      {/* Hero / Welcome Section */}
      <div className="space-y-3 max-w-2xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          Master English with Daily Hinglish Clarity.
        </h1>
        <p className="text-base text-stone-600 leading-relaxed">
          No confusing grammar jargon. Learn daily conversational vocabulary, practice with your personal AI Tutor, and build lasting fluency.
        </p>

        {isLoggedIn && (
          <div className="pt-2 flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>You have completed <strong>{completedCount}</strong> lessons so far! Keep going.</span>
          </div>
        )}
      </div>

      {/* Featured Today's Class Card */}
      {todayClass ? (
        <section className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-4 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider bg-white/10 px-3 py-1 rounded-full text-emerald-300 font-bold">
                Today&apos;s Class
              </span>
              <span className="text-xs text-stone-400 font-mono">
                {new Date(todayClass.lesson_date).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {todayClass.title}
            </h2>

            {todayClass.introduction && (
              <p className="text-sm text-stone-300 line-clamp-2 leading-relaxed">
                {todayClass.introduction}
              </p>
            )}

            <div className="pt-2">
              <Link
                href={`/lessons/${todayClass.slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-stone-950 font-bold text-xs rounded-xl hover:bg-stone-100 transition shadow-sm"
              >
                <span>Start Today&apos;s Lesson</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {/* Grid: Recent Daily Classes & Foundational Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Recent Daily Classes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-stone-700" />
              <span>Recent Classes</span>
            </h3>
            <Link href="/lessons" className="text-xs font-semibold text-stone-600 hover:text-stone-900">
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentClasses && recentClasses.length > 0 ? (
              recentClasses.map((c) => (
                <Link
                  key={c.id}
                  href={`/lessons/${c.slug}`}
                  className="block p-4 rounded-xl border border-emerald-900/10 bg-white/90 backdrop-blur-xs hover:border-emerald-600/40 hover:shadow-xs transition"
                >
                  <div className="flex items-center justify-between text-xs text-stone-400 font-mono mb-1">
                    <span>{new Date(c.lesson_date).toLocaleDateString()}</span>
                    {c.topic && <span className="text-stone-600 font-sans font-medium">{c.topic}</span>}
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{c.title}</h4>
                </Link>
              ))
            ) : (
              <p className="text-xs text-stone-400 py-6 text-center">No daily classes published yet.</p>
            )}
          </div>
        </div>

        {/* Foundational Topics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 pb-3">
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Foundational Topics</span>
            </h3>
            <Link href="/topics" className="text-xs font-semibold text-stone-600 hover:text-stone-900">
              View all &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {topics && topics.length > 0 ? (
              topics.map((t) => (
                <Link
                  key={t.id}
                  href={`/topics/${t.slug}`}
                  className="block p-4 rounded-xl border border-emerald-900/10 bg-white/90 backdrop-blur-xs hover:border-emerald-600/40 hover:shadow-xs transition"
                >
                  <div className="flex items-center justify-between text-xs text-emerald-700 font-medium mb-1">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded text-[10px] font-bold">Topic</span>
                  </div>
                  <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{t.title}</h4>
                </Link>
              ))
            ) : (
              <p className="text-xs text-stone-400 py-6 text-center">No foundational topics published yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
