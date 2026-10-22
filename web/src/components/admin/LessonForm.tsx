"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Lesson } from "@/types/database"

interface LessonFormProps {
  initialLesson?: Partial<Lesson>
  isEditing?: boolean
}

export default function LessonForm({
  initialLesson = {},
  isEditing = false,
}: LessonFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [title, setTitle] = useState(initialLesson.title || "")
  const [slug, setSlug] = useState(initialLesson.slug || "")
  const [lessonDate, setLessonDate] = useState(
    initialLesson.lesson_date || new Date().toISOString().split("T")[0]
  )
  const [lessonType, setLessonType] = useState<"daily_class" | "foundational_topic">(
    initialLesson.lesson_type || "daily_class"
  )
  const [topic, setTopic] = useState(initialLesson.topic || "")
  const [status, setStatus] = useState<"draft" | "published">(
    initialLesson.status || "draft"
  )
  const [introduction, setIntroduction] = useState(initialLesson.introduction || "")
  const [content, setContent] = useState(initialLesson.content || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from title if new
  const handleTitleChange = (val: string) => {
    setTitle(val)
    if (!isEditing && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "")
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      lesson_date: lessonDate,
      lesson_type: lessonType,
      topic: topic.trim() || null,
      status,
      introduction: introduction.trim() || null,
      content: content.trim() || null,
      updated_at: new Date().toISOString(),
    }

    try {
      if (isEditing && initialLesson.id) {
        const { error: updateError } = await supabase
          .from("lessons")
          .update(payload)
          .eq("id", initialLesson.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from("lessons")
          .insert(payload)

        if (insertError) throw insertError
      }

      router.push("/admin")
      router.refresh()
    } catch (err: any) {
      setError(err?.message || "Failed to save lesson")
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <h1 className="text-xl font-bold text-stone-900">
          {isEditing ? "Edit Lesson / Topic" : "Create New Lesson / Topic"}
        </h1>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs font-bold uppercase focus:outline-none focus:border-stone-900"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-stone-700">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            placeholder="e.g. Everyday Hinglish to Fluent English"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
          />
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">URL Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            placeholder="everyday-hinglish-to-fluent-english"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-900"
          />
        </div>

        {/* Lesson Date */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Lesson Date</label>
          <input
            type="date"
            value={lessonDate}
            onChange={(e) => setLessonDate(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-900"
          />
        </div>

        {/* Lesson Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Category Type</label>
          <select
            value={lessonType}
            onChange={(e) => setLessonType(e.target.value as any)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
          >
            <option value="daily_class">Daily Class</option>
            <option value="foundational_topic">Foundational Topic</option>
          </select>
        </div>

        {/* Topic Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Topic / Tag</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Grammar Foundations"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
          />
        </div>

        {/* Introduction */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-stone-700">Introduction Summary</label>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            rows={2}
            placeholder="Short 1-2 sentence preview for the lesson card..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:border-stone-900 resize-none"
          />
        </div>

        {/* Content */}
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-xs font-semibold text-stone-700">Lesson Content (HTML / Rich Text)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            placeholder="<h2>Core Concept</h2><p>Explanation in Hinglish...</p>"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs text-stone-900 font-mono focus:outline-none focus:border-stone-900 leading-relaxed"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isLoading ? "Saving..." : isEditing ? "Update Lesson" : "Create Lesson"}
        </button>
      </div>
    </form>
  )
}

