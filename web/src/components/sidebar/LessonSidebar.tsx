"use client"

import { useState, useEffect } from "react"
import { Sparkles, MessageCircle, FileText } from "lucide-react"
import AiTutor from "./AiTutor"
import ChatRoom from "./ChatRoom"
import LessonNotes from "./LessonNotes"
import { Lesson, Profile, LessonChatMessage, LessonComment, Note } from "@/types/database"

interface LessonSidebarProps {
  lesson: Lesson
  currentUser?: Profile | null
  initialAiMessages?: LessonChatMessage[]
  initialComments?: LessonComment[]
  initialNotes?: Note[]
}

type TabType = "ai_tutor" | "chatroom" | "notes"

export default function LessonSidebar({
  lesson,
  currentUser,
  initialAiMessages = [],
  initialComments = [],
  initialNotes = [],
}: LessonSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ai_tutor")
  const [commentsCount, setCommentsCount] = useState(initialComments.length)
  const [notesCount, setNotesCount] = useState(initialNotes.length)

  useEffect(() => {
    const savedTab = localStorage.getItem("lesson_sidebar_tab") as TabType | null
    if (savedTab && ["ai_tutor", "chatroom", "notes"].includes(savedTab)) {
      setActiveTab(savedTab)
    }
  }, [])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    localStorage.setItem("lesson_sidebar_tab", tab)
  }

  return (
    <aside className="w-full rounded-2xl border border-emerald-900/15 bg-white/95 backdrop-blur-xs shadow-sm overflow-hidden flex flex-col h-full lg:max-h-[calc(100vh-6.5rem)]">
      {/* Tab Navigation Header - ALWAYS OPEN, NEVER MINIMIZED */}
      <div className="p-2 sm:p-2.5 bg-stone-50/90 border-b border-stone-200/80 shrink-0">
        <div className="grid grid-cols-3 gap-1.5 w-full">
          {/* Tab 1: AI Tutor */}
          <button
            type="button"
            onClick={() => handleTabChange("ai_tutor")}
            className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none ${
              activeTab === "ai_tutor"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-white text-stone-700 border border-stone-200/90 hover:border-emerald-600/40 hover:bg-stone-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">AI Tutor</span>
          </button>

          {/* Tab 2: Discussion */}
          <button
            type="button"
            onClick={() => handleTabChange("chatroom")}
            className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none ${
              activeTab === "chatroom"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-white text-stone-700 border border-stone-200/90 hover:border-blue-600/40 hover:bg-stone-50"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Discussion</span>
            {commentsCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                  activeTab === "chatroom"
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {commentsCount}
              </span>
            )}
          </button>

          {/* Tab 3: Notes */}
          <button
            type="button"
            onClick={() => handleTabChange("notes")}
            className={`px-2 sm:px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer select-none ${
              activeTab === "notes"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-white text-stone-700 border border-stone-200/90 hover:border-amber-600/40 hover:bg-stone-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Notes</span>
            {notesCount > 0 && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full shrink-0 ${
                  activeTab === "notes"
                    ? "bg-white/20 text-white"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {notesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Active Tool Panel - ALWAYS OPEN */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scrollbar-thin">
        {activeTab === "ai_tutor" && (
          <AiTutor
            lessonId={lesson.id}
            lessonTitle={lesson.title}
            initialMessages={initialAiMessages}
            isAuthenticated={!!currentUser}
          />
        )}

        {activeTab === "chatroom" && (
          <ChatRoom
            lessonId={lesson.id}
            isTopic={lesson.lesson_type === "foundational_topic"}
            initialComments={initialComments}
            currentUserId={currentUser?.id}
          />
        )}

        {activeTab === "notes" && (
          <LessonNotes
            lessonId={lesson.id}
            isTopic={lesson.lesson_type === "foundational_topic"}
            initialNotes={initialNotes}
            currentUserId={currentUser?.id}
          />
        )}
      </div>
    </aside>
  )
}
