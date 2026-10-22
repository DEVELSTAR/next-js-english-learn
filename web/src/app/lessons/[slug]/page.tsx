import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MOCK_LESSONS } from "@/lib/mock-data"
import { Lesson, LessonCompletion } from "@/types/database"
import LessonSidebar from "@/components/sidebar/LessonSidebar"
import StudentActions from "@/components/lessons/StudentActions"
import { ArrowLeft, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

interface LessonPageProps {
  params: Promise<{ slug: string }>
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params
  let lesson: Lesson | null = null
  let previousLesson: Pick<Lesson, "title" | "slug" | "lesson_date" | "lesson_type"> | null = null
  let nextLesson: Pick<Lesson, "title" | "slug" | "lesson_date" | "lesson_type"> | null = null
  let completion: LessonCompletion | null = null
  let user = null
  let profile: any = null
  let isAdmin = false

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()

      // 1. Get current user & profile
      const { data: authData } = await supabase.auth.getUser()
      user = authData.user
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        profile = data
      }
      isAdmin = profile?.role === "admin" || profile?.role === "super_admin"

      // 2. Fetch the lesson
      const { data: lessonData } = await supabase
        .from("lessons")
        .select("*")
        .eq("slug", slug)
        .single()

      lesson = lessonData

      if (lesson) {
        // Fetch previous and next lessons
        const [prevRes, nextRes, compRes] = await Promise.all([
          supabase
            .from("lessons")
            .select("title, slug, lesson_date, lesson_type")
            .eq("status", "published")
            .eq("lesson_type", lesson.lesson_type)
            .lt("lesson_date", lesson.lesson_date)
            .order("lesson_date", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("lessons")
            .select("title, slug, lesson_date, lesson_type")
            .eq("status", "published")
            .eq("lesson_type", lesson.lesson_type)
            .gt("lesson_date", lesson.lesson_date)
            .order("lesson_date", { ascending: true })
            .limit(1)
            .maybeSingle(),
          user
            ? supabase
                .from("lesson_completions")
                .select("*")
                .eq("user_id", user.id)
                .eq("lesson_id", lesson.id)
                .maybeSingle()
            : Promise.resolve({ data: null }),
        ])

        previousLesson = prevRes.data
        nextLesson = nextRes.data
        completion = compRes.data
      }
    } catch {
      // Ignore network errors and fall back
    }
  }

  // Fallback to mock lessons if not found or offline
  if (!lesson) {
    const foundMock = MOCK_LESSONS.find((l) => l.slug === slug)
    if (foundMock) {
      lesson = foundMock
      const sameType = MOCK_LESSONS.filter((l) => l.lesson_type === lesson!.lesson_type)
      const currentIndex = sameType.findIndex((l) => l.slug === slug)
      if (currentIndex > 0) {
        previousLesson = sameType[currentIndex - 1]
      }
      if (currentIndex < sameType.length - 1) {
        nextLesson = sameType[currentIndex + 1]
      }
    }
  }

  if (!lesson) {
    notFound()
  }

  // If draft and not admin, return 404
  if (lesson.status === "draft" && !isAdmin) {
    notFound()
  }

  // 5. Fetch initial chat history, comments, and notes
  let initialAiMessages: any[] = []
  let comments: any[] = []
  let notes: any[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const [aiRes, commRes, noteRes] = await Promise.all([
        user
          ? supabase
              .from("lesson_chat_messages")
              .select("*")
              .eq("lesson_id", lesson.id)
              .eq("user_id", user.id)
              .order("created_at", { ascending: true })
          : Promise.resolve({ data: [] }),
        supabase
          .from("lesson_comments")
          .select("*, user:profiles(id, name, email, role)")
          .eq("lesson_id", lesson.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("notes")
          .select("*, user:profiles(id, name, email)")
          .eq("lesson_id", lesson.id)
          .order("created_at", { ascending: false }),
      ])
      initialAiMessages = aiRes.data || []
      comments = commRes.data || []
      notes = noteRes.data || []
    } catch {
      // Ignore network errors and fall back
    }
  }

  const isTopic = lesson.lesson_type === "foundational_topic"

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Section 1: Lesson Header, Details & Content */}
        <div className="lg:col-span-7 space-y-6 min-w-0 order-1">
          {isAdmin && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider text-[11px] bg-amber-200/80 px-2 py-0.5 rounded">
                  Admin Preview
                </span>
                <span>Viewing published content in read-only mode.</span>
              </div>
              <Link href="/admin" className="font-semibold underline hover:text-amber-950 shrink-0 ml-3">
                &larr; Back to Admin Panel
              </Link>
            </div>
          )}

          {/* Back navigation */}
          <div className="flex items-center justify-between text-xs text-stone-500">
            <Link
              href={isTopic ? "/topics" : "/lessons"}
              className="hover:text-stone-900 transition flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isTopic ? "Back to topics" : "Back to all classes"}</span>
            </Link>
          </div>

          {/* Lesson Header Banner */}
          <div className="border-b border-stone-200 pb-5">
            <div className="flex items-center gap-2 mb-3">
              {isTopic ? (
                <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded">
                  Foundational Topic
                </span>
              ) : (
                <span className="text-xs font-mono font-semibold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded">
                  {new Date(lesson.lesson_date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight mb-4">
              {lesson.title}
            </h1>

            {user && !isAdmin && (
              <StudentActions
                lessonId={lesson.id}
                userId={user.id}
                initialCompleted={completion?.completed ?? false}
                initialRevision={completion?.needs_revision ?? false}
              />
            )}
          </div>

          {/* Article Content */}
          <article className="bg-white/95 backdrop-blur-xs border border-emerald-900/10 rounded-2xl p-5 sm:p-8 shadow-xs">
            {lesson.content ? (
              <div
                className="prose prose-stone max-w-none text-[1.02rem] leading-[1.8] text-[#292524]"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            ) : (
              <p className="text-stone-400 italic text-sm py-8 text-center">
                No content written for this lesson yet.
              </p>
            )}
          </article>
        </div>

        {/* Section 2: Interactive Tools (Right on laptop, Bottom on mobile) */}
        {!isAdmin && (
          <div className="lg:col-span-5 lg:row-span-2 lg:sticky lg:top-20 order-2 w-full relative z-20">
            <LessonSidebar
              lesson={lesson}
              currentUser={profile}
              initialAiMessages={initialAiMessages}
              initialComments={comments || []}
              initialNotes={notes || []}
            />
          </div>
        )}

        {/* Section 3: Previous & Next Navigation */}
        <div className="lg:col-span-7 pt-6 border-t border-stone-200 order-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {previousLesson && (
                <Link
                  href={previousLesson.lesson_type === "foundational_topic" ? `/topics/${previousLesson.slug}` : `/lessons/${previousLesson.slug}`}
                  className="block p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-400 transition"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                    &larr; {isTopic ? "Previous Topic" : "Previous Class"}
                  </span>
                  <span className="text-sm font-bold text-stone-900 line-clamp-1">
                    {previousLesson.title}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    {new Date(previousLesson.lesson_date).toLocaleDateString()}
                  </span>
                </Link>
              )}
            </div>

            <div>
              {nextLesson && (
                <Link
                  href={nextLesson.lesson_type === "foundational_topic" ? `/topics/${nextLesson.slug}` : `/lessons/${nextLesson.slug}`}
                  className="block p-4 rounded-xl border border-stone-200 bg-white hover:border-stone-400 transition text-right"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-1">
                    {isTopic ? "Next Topic" : "Next Class"} &rarr;
                  </span>
                  <span className="text-sm font-bold text-stone-900 line-clamp-1">
                    {nextLesson.title}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    {new Date(nextLesson.lesson_date).toLocaleDateString()}
                  </span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
