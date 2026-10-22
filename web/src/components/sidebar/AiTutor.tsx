"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Trash2, Sparkles } from "lucide-react"

interface Message {
  id?: number
  role: "user" | "model"
  content: string
}

interface AiTutorProps {
  lessonId: number
  lessonTitle: string
  initialMessages?: Message[]
  isAuthenticated: boolean
}

export default function AiTutor({
  lessonId,
  lessonTitle,
  initialMessages = [],
  isAuthenticated,
}: AiTutorProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input
    if (!text.trim() || isLoading || !isAuthenticated) return

    const userMsg: Message = { role: "user", content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "42px"
    }

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, message: text.trim() }),
      })

      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: "model", content: data.reply }])
      } else {
        setMessages(prev => [
          ...prev,
          { role: "model", content: data.error || "Sorry, I couldn't process that. Please try again!" },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "model", content: "Connection error. Please check your network and try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto resize
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`
  }

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear your AI Tutor chat history for this class?")) return
    try {
      await fetch(`/api/tutor/chat?lessonId=${lessonId}`, { method: "DELETE" })
      setMessages([])
    } catch (err) {
      console.error(err)
    }
  }

  const quickPrompts = [
    { label: "✍️ Correct my sentence", text: "Please correct this sentence if I'm wrong: " },
    { label: "💡 Simpler Hinglish", text: "Can you explain this concept in very simple daily Hinglish?" },
    { label: "🗣️ Real life examples", text: "Give me 3 practical examples of how to use this in a daily conversation." },
    { label: "🎯 Quiz me", text: "Can you quiz me with a quick question to test my understanding?" },
  ]

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
            ✨
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-stone-900 tracking-tight">Ask Akib Sir</h2>
            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full">
              Gemini 1.5 Flash
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClearChat}
            className="text-stone-400 hover:text-red-600 transition p-1.5 rounded-lg hover:bg-stone-50 cursor-pointer"
            title="Clear AI Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-[280px] max-h-[380px] lg:max-h-[calc(100vh-17rem)] overflow-y-auto px-1 space-y-3 mb-3 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-stone-500 space-y-2">
            <div className="text-3xl">👋</div>
            <h3 className="text-sm font-bold text-stone-800">Koi doubt hai ya practice check karwana hai?</h3>
            <p className="text-xs text-stone-400 max-w-xs mx-auto">
              Ask doubts about <em>{lessonTitle}</em> in Hinglish, or write sentences and say <em>&quot;correct me&quot;</em>!
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-emerald-700 text-white rounded-br-xs"
                    : "bg-white text-stone-800 rounded-bl-xs border border-stone-200/90 shadow-2xs"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-stone-400 italic py-2">
            <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span>Akib Sir is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div className="pt-2 border-t border-stone-100 mb-2 overflow-x-auto scrollbar-none flex gap-1.5 pb-1">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q.text)}
            disabled={isLoading || !isAuthenticated}
            className="px-2.5 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium whitespace-nowrap transition cursor-pointer shrink-0 disabled:opacity-50"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      {isAuthenticated ? (
        <div className="flex items-end gap-2 pt-1">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask a doubt or write a sentence... (Shift+Enter for new line)"
            rows={1}
            disabled={isLoading}
            className="flex-1 min-h-[42px] max-h-[140px] rounded-xl border border-stone-300 bg-stone-50 px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-stone-900 focus:outline-none transition resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="h-[42px] px-3.5 bg-emerald-700 text-white rounded-xl flex items-center justify-center hover:bg-emerald-800 transition disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 flex items-center justify-between gap-3">
          <span>Sign in to chat with Akib Sir.</span>
          <a
            href="/auth/sign-in"
            className="px-3 py-1 bg-emerald-700 text-white rounded-lg font-semibold hover:bg-emerald-800 transition"
          >
            Sign In
          </a>
        </div>
      )}
    </div>
  )
}

