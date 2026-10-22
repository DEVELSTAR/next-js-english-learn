"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, X, Sparkles, MessageCircle, FileText } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("ai_tutor")
  const [isMobile, setIsMobile] = useState(false)
  const [commentsCount, setCommentsCount] = useState(initialComments.length)
  const [notesCount, setNotesCount] = useState(initialNotes.length)

  // Floating button drag state on mobile
  const fabRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const hasMovedRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0, initialLeft: 0, initialTop: 0 })

  // 1. Initial responsive setup
  useEffect(() => {
    const checkViewport = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)

      const savedOpen = localStorage.getItem("lesson_sidebar_open")
      const savedTab = localStorage.getItem("lesson_sidebar_tab") as TabType | null

      if (savedTab && ["ai_tutor", "chatroom", "notes"].includes(savedTab)) {
        setActiveTab(savedTab)
      }

      if (mobile) {
        // Mobile starts collapsed with only movable floating button
        setIsOpen(false)
      } else {
        // Laptop / desktop starts MAXIMIZED by default!
        setIsOpen(savedOpen !== "false")
      }
    }

    checkViewport()
    window.addEventListener("resize", checkViewport)
    return () => window.removeEventListener("resize", checkViewport)
  }, [])

  // 2. Persist tab choice
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    localStorage.setItem("lesson_sidebar_tab", tab)
  }

  // 3. Open specific tab & expand drawer
  const handleOpenTab = (tab: TabType) => {
    handleTabChange(tab)
    setIsOpen(true)
    if (!isMobile) {
      localStorage.setItem("lesson_sidebar_open", "true")
    }
  }

  // 4. Toggle drawer
  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev
      if (!isMobile) {
        localStorage.setItem("lesson_sidebar_open", String(next))
      }
      return next
    })
  }

  // 5. Close drawer
  const handleClose = () => {
    setIsOpen(false)
    if (!isMobile) {
      localStorage.setItem("lesson_sidebar_open", "false")
    }
  }

  // 6. Mobile Draggable FAB implementation
  useEffect(() => {
    const fab = fabRef.current
    if (!fab) return

    // Restore saved position
    const savedTop = sessionStorage.getItem("mobile_fab_top")
    const savedLeft = sessionStorage.getItem("mobile_fab_left")
    if (savedTop && savedLeft) {
      const topNum = parseFloat(savedTop)
      const leftNum = parseFloat(savedLeft)
      if (topNum >= 60 && topNum <= window.innerHeight - 60 && leftNum >= 10 && leftNum <= window.innerWidth - 60) {
        fab.style.top = `${topNum}px`
        fab.style.left = `${leftNum}px`
        fab.style.bottom = "auto"
        fab.style.right = "auto"
      }
    }

    const onStart = (e: TouchEvent | MouseEvent) => {
      const touch = "touches" in e ? e.touches[0] : e
      dragStartRef.current.x = touch.clientX
      dragStartRef.current.y = touch.clientY

      const rect = fab.getBoundingClientRect()
      dragStartRef.current.initialLeft = rect.left
      dragStartRef.current.initialTop = rect.top
      hasMovedRef.current = false
      setIsDragging(true)
    }

    const onMove = (e: TouchEvent | MouseEvent) => {
      if (!hasMovedRef.current) {
        const touch = "touches" in e ? e.touches[0] : e
        const dx = touch.clientX - dragStartRef.current.x
        const dy = touch.clientY - dragStartRef.current.y
        if (Math.hypot(dx, dy) > 8) {
          hasMovedRef.current = true
        }
      }

      if (hasMovedRef.current) {
        if ("cancelable" in e && e.cancelable) e.preventDefault()
        const touch = "touches" in e ? e.touches[0] : e
        const dx = touch.clientX - dragStartRef.current.x
        const dy = touch.clientY - dragStartRef.current.y

        let newLeft = dragStartRef.current.initialLeft + dx
        let newTop = dragStartRef.current.initialTop + dy

        const maxLeft = window.innerWidth - fab.offsetWidth - 12
        const maxTop = window.innerHeight - fab.offsetHeight - 16
        newLeft = Math.max(12, Math.min(maxLeft, newLeft))
        newTop = Math.max(70, Math.min(maxTop, newTop))

        fab.style.left = `${newLeft}px`
        fab.style.top = `${newTop}px`
        fab.style.bottom = "auto"
        fab.style.right = "auto"
      }
    }

    const onEnd = () => {
      if (hasMovedRef.current) {
        const rect = fab.getBoundingClientRect()
        sessionStorage.setItem("mobile_fab_top", String(rect.top))
        sessionStorage.setItem("mobile_fab_left", String(rect.left))
      }
      setIsDragging(false)
    }

    fab.addEventListener("touchstart", onStart, { passive: true })
    window.addEventListener("touchmove", onMove, { passive: false })
    window.addEventListener("touchend", onEnd)

    fab.addEventListener("mousedown", onStart)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onEnd)

    return () => {
      fab.removeEventListener("touchstart", onStart)
      window.removeEventListener("touchmove", onMove)
      window.removeEventListener("touchend", onEnd)
      fab.removeEventListener("mousedown", onStart)
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onEnd)
    }
  }, [isMobile])

  return (
    <aside className="relative select-none">
      {/* ======================================================== */}
      {/* 0. MOBILE MOVABLE FLOATING MENU (FAB)                     */}
      {/* Visible only on mobile (< md:), draggable anywhere        */}
      {/* ======================================================== */}
      <div
        ref={fabRef}
        className={`md:hidden fixed bottom-6 right-5 z-40 select-none touch-none ${
          isOpen ? "hidden" : "block"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            if (!hasMovedRef.current) {
              handleToggle()
            }
            hasMovedRef.current = false
          }}
          className="w-13 h-13 rounded-full bg-white border border-stone-200/90 shadow-xl flex items-center justify-center text-stone-700 active:scale-90 transition-transform cursor-grab active:cursor-grabbing hover:shadow-2xl ring-4 ring-black/5"
          title="Open English Tools (Drag to move)"
          aria-label="Open English Tools"
        >
          {/* 4-color diamond logo in center */}
          <div className="grid grid-cols-2 gap-0.5 w-6 h-6 rotate-45 rounded-sm p-0.5 pointer-events-none">
            <div className="bg-blue-500 rounded-tl-xs"></div>
            <div className="bg-red-500 rounded-tr-xs"></div>
            <div className="bg-amber-400 rounded-bl-xs"></div>
            <div className="bg-emerald-500 rounded-br-xs"></div>
          </div>

          {/* Badge indicator */}
          {(commentsCount > 0 || notesCount > 0) && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-blue-600 ring-2 ring-white text-[9px] font-bold text-white flex items-center justify-center pointer-events-none">
              {commentsCount + notesCount}
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. DESKTOP SLIM RAIL (Collapsed state dock on right)      */}
      {/* Visible only on md: screens and above                      */}
      {/* ======================================================== */}
      <div className="hidden md:flex fixed right-0 top-24 z-30 flex-col items-center bg-white border border-r-0 border-stone-200/90 shadow-md rounded-l-2xl py-3 px-1.5 w-14 transition-all duration-300">
        {/* Top: 4-color diamond logo & Expand toggle button */}
        <div className="relative w-8 h-8 mb-4 flex items-center justify-center">
          <button
            type="button"
            onClick={handleToggle}
            className="grid grid-cols-2 gap-0.5 w-6 h-6 rotate-45 rounded-sm p-0.5 hover:scale-110 transition cursor-pointer"
            title="Open English Tools"
            aria-label="Open English Tools"
          >
            <div className="bg-blue-500 rounded-tl-xs"></div>
            <div className="bg-red-500 rounded-tr-xs"></div>
            <div className="bg-amber-400 rounded-bl-xs"></div>
            <div className="bg-emerald-500 rounded-br-xs"></div>
          </button>

          {/* Chevron expand button (<) attached to rail */}
          <button
            type="button"
            onClick={handleToggle}
            className="absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border border-stone-300 shadow-xs flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer"
            title="Expand tools sidebar"
            aria-label="Expand tools sidebar"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </div>

        {/* 3 Option Icons */}
        <div className="flex flex-col items-center gap-2 w-full">
          {/* 1. AI Tutor Icon */}
          <button
            type="button"
            onClick={() => handleOpenTab("ai_tutor")}
            className={`relative w-10 h-10 rounded-xl transition flex items-center justify-center cursor-pointer group ${
              isOpen && activeTab === "ai_tutor"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100 hover:text-emerald-700"
            }`}
            title="AI Tutor (Ask doubts in Hinglish)"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* 2. Chatroom Icon */}
          <button
            type="button"
            onClick={() => handleOpenTab("chatroom")}
            className={`relative w-10 h-10 rounded-xl transition flex items-center justify-center cursor-pointer group ${
              isOpen && activeTab === "chatroom"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100 hover:text-blue-700"
            }`}
            title="Classroom Chatroom"
          >
            <MessageCircle className="w-5 h-5" />
            {commentsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white"></span>
            )}
          </button>

          {/* 3. Notes Icon */}
          <button
            type="button"
            onClick={() => handleOpenTab("notes")}
            className={`relative w-10 h-10 rounded-xl transition flex items-center justify-center cursor-pointer group ${
              isOpen && activeTab === "notes"
                ? "bg-emerald-800 text-white shadow-xs"
                : "text-stone-600 hover:bg-stone-100 hover:text-amber-700"
            }`}
            title="Class & Topic Notes"
          >
            <FileText className="w-5 h-5" />
            {notesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-600 ring-2 ring-white"></span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobile && isOpen && (
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-45 md:hidden transition-opacity"
        />
      )}

      {/* ======================================================== */}
      {/* 2. EXPANDED SIDEBAR DRAWER (Full interactive tools panel) */}
      {/* ======================================================== */}
      <div
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          pointerEvents: isOpen ? "auto" : "none",
        }}
        className="fixed right-0 top-16 bottom-0 z-50 w-full sm:max-w-[460px] bg-white border-l border-stone-200 shadow-2xl flex flex-col transition-transform duration-300 ease-out"
      >
        {/* Top Drawer Navigation: 3 Option Tabs & Collapse Button */}
        <div className="px-3.5 py-2.5 border-b border-stone-200 bg-stone-50/90 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {/* Tab 1: AI Tutor */}
            <button
              type="button"
              onClick={() => handleTabChange("ai_tutor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === "ai_tutor"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>AI Tutor</span>
            </button>

            {/* Tab 2: Chatroom */}
            <button
              type="button"
              onClick={() => handleTabChange("chatroom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === "chatroom"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-blue-300" />
              <span>Chatroom</span>
              {commentsCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                  {commentsCount}
                </span>
              )}
            </button>

            {/* Tab 3: Notes */}
            <button
              type="button"
              onClick={() => handleTabChange("notes")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                activeTab === "notes"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Notes</span>
              {notesCount > 0 && (
                <span className="text-[10px] font-mono font-bold bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                  {notesCount}
                </span>
              )}
            </button>
          </div>

          {/* Collapse button: ✕ on mobile, > on desktop */}
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-200/60 transition flex items-center justify-center cursor-pointer shrink-0"
            title="Close sidebar"
            aria-label="Close sidebar"
          >
            {isMobile ? <X className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Drawer Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
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
      </div>
    </aside>
  )
}
