import { notFound } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { MOCK_LESSONS } from "@/lib/mock-data"
import LessonForm from "@/components/admin/LessonForm"

export const dynamic = "force-dynamic"

interface EditLessonPageProps {
  params: Promise<{ id: string }>
}

export default async function EditLessonPage({ params }: EditLessonPageProps) {
  const { id } = await params
  let lesson = null

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .eq("id", id)
        .single()
      lesson = data
    } catch {
      // Ignore
    }
  } else {
    lesson = MOCK_LESSONS.find((l) => String(l.id) === id) || null
  }

  if (!lesson) {
    notFound()
  }

  return <LessonForm initialLesson={lesson} isEditing={true} />
}

