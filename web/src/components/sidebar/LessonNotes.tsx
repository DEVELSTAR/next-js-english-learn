"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { Note, Profile } from "@/types/database"

interface LessonNotesProps {
  lessonId: number
  isTopic?: boolean
  initialNotes?: Note[]
  currentUserId?: string | null
}

export default function LessonNotes({
  lessonId,
  isTopic = false,
  initialNotes = [],
  currentUserId,
}: LessonNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    const trimmed = content.trim()
    setIsSubmitting(true)

    // Offline preview mode support
    if (!isSupabaseConfigured()) {
      const mockNote: Note = {
        id: Date.now(),
        lesson_id: lessonId,
        user_id: currentUserId || "preview-user",
        content: trimmed,
        is_global: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: currentUserId || "preview-user",
          name: "You (Offline Preview)",
          email: "preview@example.com",
        },
      }
      setNotes((prev) => [mockNote, ...prev])
      setContent("")
      setIsSubmitting(false)
      return
    }

    if (!currentUserId) {
      setIsSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          lesson_id: lessonId,
          user_id: currentUserId,
          content: trimmed,
          is_global: true,
        })
        .select("*, user:profiles(id, name, email)")
        .single()

      if (data && !error) {
        setNotes((prev) => [data, ...prev])
        setContent("")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-stone-900 tracking-tight">
            {isTopic ? "Topic Notes" : "Class Notes"}
          </h2>
          <span className="text-xs font-mono font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full">
            {notes.length}
          </span>
        </div>
        <Link
          href={`/notes?lesson_id=${lessonId}`}
          className="text-xs font-medium text-stone-600 hover:text-stone-900"
        >
          View all notes &rarr;
        </Link>
      </div>

      {/* Note Creation Form */}
      {currentUserId ? (
        <form onSubmit={handleCreate} className="space-y-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a helpful note or summary for this class..."
            rows={2}
            required
            disabled={isSubmitting}
            className="w-full rounded-xl border border-stone-300 bg-stone-50 p-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition resize-y leading-relaxed"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              Shared with classmates by default
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition disabled:opacity-40 cursor-pointer shadow-xs"
            >
              Add Note
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between gap-3">
          <span>Sign in to write and share notes for this class.</span>
          <a
            href="/auth/sign-in"
            className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800 shrink-0 transition"
          >
            Sign In
          </a>
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3 pt-2">
        {notes.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
            No notes added for this class yet.
          </div>
        ) : (
          notes.map((n) => (
            <div
              key={n.id}
              className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between text-stone-500">
                <span className="font-semibold text-stone-800">{n.user?.name || "Student"}</span>
                <span className="text-[10px] font-mono text-stone-400">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{n.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
