"use client"

import { useState, useEffect, useRef } from "react"
import { Send } from "lucide-react"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client"
import { LessonComment, Profile } from "@/types/database"

interface ChatRoomProps {
  lessonId: number
  isTopic?: boolean
  initialComments?: LessonComment[]
  currentUserId?: string | null
}

export default function ChatRoom({
  lessonId,
  isTopic = false,
  initialComments = [],
  currentUserId,
}: ChatRoomProps) {
  const [comments, setComments] = useState<LessonComment[]>(initialComments)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [comments])

  // Subscribe to Supabase Realtime for this lesson's comments
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return
    }

    const channel = supabase
      .channel(`lesson_comments:${lessonId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lesson_comments",
          filter: `lesson_id=eq.${lessonId}`,
        },
        async (payload) => {
          const newComment = payload.new as LessonComment
          // Fetch the author's profile name
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, name, email, role")
            .eq("id", newComment.user_id)
            .single()

          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev
            return [...prev, { ...newComment, user: profile }]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lessonId, supabase])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!content.trim() || isSubmitting) return

    const trimmed = content.trim()
    setContent("")
    setIsSubmitting(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = "42px"
    }

    // In offline preview mode, store message locally
    if (!isSupabaseConfigured()) {
      const mockMsg: LessonComment = {
        id: Date.now(),
        lesson_id: lessonId,
        user_id: currentUserId || "preview-user",
        content: trimmed,
        created_at: new Date().toISOString(),
        user: {
          id: currentUserId || "preview-user",
          name: "You (Offline Preview)",
          email: "preview@example.com",
          role: "student",
        },
      }
      setComments((prev) => [...prev, mockMsg])
      setIsSubmitting(false)
      return
    }

    if (!currentUserId) {
      setIsSubmitting(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("lesson_comments")
        .insert({
          lesson_id: lessonId,
          user_id: currentUserId,
          content: trimmed,
        })
        .select("*, user:profiles(id, name, email, role)")
        .single()

      if (data && !error) {
        setComments((prev) => {
          if (prev.some((c) => c.id === data.id)) return prev
          return [...prev, data]
        })
      }
    } catch (err) {
      console.error("Failed to post comment:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
  }

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-stone-900 tracking-tight">
            {isTopic ? "Topic Discussion" : "Class Discussion"}
          </h2>
          <span className="text-xs font-mono font-semibold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[360px] sm:h-[390px] overflow-y-auto p-4 bg-stone-50/30 space-y-3">
        {comments.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-400">
            No messages yet. Be the first to start the discussion!
          </div>
        ) : (
          comments.map((c) => {
            const isMe = c.user_id === currentUserId
            return (
              <div
                key={c.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {!isMe && (
                  <span className="text-[11px] font-semibold text-stone-500 ml-1 mb-0.5">
                    {c.user?.name || "Student"}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-xs"
                      : "bg-white text-stone-900 rounded-bl-xs border border-stone-200 shadow-2xs"
                  }`}
                >
                  {c.content}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-200 bg-white p-3">
        {currentUserId ? (
          <form onSubmit={handleSubmit} className="flex items-end gap-2 m-0">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Shift+Enter for new line)"
              rows={1}
              required
              disabled={isSubmitting}
              className="flex-1 min-h-[42px] max-h-[140px] rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition resize-none leading-relaxed"
            />
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="h-[42px] px-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl flex items-center justify-center transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-3 p-2 bg-stone-50 rounded-lg text-xs text-stone-600">
            <span>Sign in to participate in the classroom discussion.</span>
            <a
              href="/auth/sign-in"
              className="px-3 py-1 bg-stone-900 text-white rounded-md font-semibold hover:bg-stone-800"
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
