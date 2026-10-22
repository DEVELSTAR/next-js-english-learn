import LessonForm from "@/components/admin/LessonForm"

interface NewLessonPageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function NewLessonPage({ searchParams }: NewLessonPageProps) {
  const { type } = await searchParams
  const lessonType = type === "foundational_topic" ? "foundational_topic" : "daily_class"

  return <LessonForm initialLesson={{ lesson_type: lessonType }} isEditing={false} />
}

