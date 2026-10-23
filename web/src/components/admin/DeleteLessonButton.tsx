"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"

interface DeleteLessonButtonProps {
  lessonId: number
  lessonTitle: string
}

export default function DeleteLessonButton({ lessonId, lessonTitle }: DeleteLessonButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to permanently delete "${lessonTitle}"?`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/lessons/${lessonId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete lesson")
      }

      // Hard reload page to reflect deletion immediately in table
      window.location.reload()
    } catch (err: any) {
      alert(err.message || "Failed to delete lesson")
      setIsDeleting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-stone-400 hover:text-red-600 transition p-1.5 rounded-md hover:bg-red-50 cursor-pointer disabled:opacity-40"
      title={`Delete ${lessonTitle}`}
      aria-label={`Delete ${lessonTitle}`}
    >
      {isDeleting ? (
        <Loader2 className="w-4 h-4 animate-spin text-red-500" />
      ) : (
        <Trash2 className="w-4 h-4" />
      )}
    </button>
  )
}
