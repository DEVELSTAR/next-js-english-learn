"use client"

import { useState } from "react"
import { Check, Bookmark } from "lucide-react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"

interface StudentActionsProps {
  lessonId: number
  userId: string
  initialCompleted: boolean
  initialRevision: boolean
}

export default function StudentActions({
  lessonId,
  userId,
  initialCompleted,
  initialRevision,
}: StudentActionsProps) {
  const [completed, setCompleted] = useState(initialCompleted)
  const [needsRevision, setNeedsRevision] = useState(initialRevision)
  const [isUpdating, setIsUpdating] = useState(false)
  const supabase = createClient()

  const toggleCompletion = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    const nextVal = !completed
    setCompleted(nextVal)

    if (!isSupabaseConfigured()) {
      setIsUpdating(false)
      return
    }

    try {
      await supabase.from("lesson_completions").upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed: nextVal,
          completed_at: nextVal ? new Date().toISOString() : null,
          needs_revision: needsRevision,
        },
        { onConflict: "user_id,lesson_id" }
      )
    } catch (err) {
      console.error(err)
      setCompleted(!nextVal)
    } finally {
      setIsUpdating(false)
    }
  }

  const toggleRevision = async () => {
    if (isUpdating) return
    setIsUpdating(true)
    const nextVal = !needsRevision
    setNeedsRevision(nextVal)

    if (!isSupabaseConfigured()) {
      setIsUpdating(false)
      return
    }

    try {
      await supabase.from("lesson_completions").upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          completed: completed,
          needs_revision: nextVal,
        },
        { onConflict: "user_id,lesson_id" }
      )
    } catch (err) {
      console.error(err)
      setNeedsRevision(!nextVal)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <button
        type="button"
        onClick={toggleCompletion}
        disabled={isUpdating}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
          completed
            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
        }`}
      >
        <Check className={`w-3.5 h-3.5 ${completed ? "text-emerald-600" : "text-stone-400"}`} />
        <span>{completed ? "Completed" : "Mark as Completed"}</span>
      </button>

      <button
        type="button"
        onClick={toggleRevision}
        disabled={isUpdating}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
          needsRevision
            ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
            : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
        }`}
      >
        <Bookmark className={`w-3.5 h-3.5 ${needsRevision ? "text-amber-600 fill-amber-500" : "text-stone-400"}`} />
        <span>{needsRevision ? "Marked for Revision" : "Need Revision"}</span>
      </button>
    </div>
  )
}

