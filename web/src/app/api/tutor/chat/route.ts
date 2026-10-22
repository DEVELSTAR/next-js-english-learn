import { NextRequest, NextResponse } from "next/server"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

export async function POST(req: NextRequest) {
  try {
    const isDbReady = isSupabaseConfigured()
    let user = null
    let studentName = "Student"
    let supabase = null

    if (isDbReady) {
      supabase = await createClient()
      const { data: authData } = await supabase.auth.getUser()
      user = authData.user

      if (!user) {
        return NextResponse.json({ error: "Unauthorized. Please sign in to chat." }, { status: 401 })
      }

      // 1. Get user profile for name
      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single()

      studentName = profile?.name || "Student"
    }

    const body = await req.json()
    const { lessonId, message } = body

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // 2. Fetch lesson context if lessonId is provided
    let lessonInfo = "GENERAL ENGLISH PRACTICE"
    if (lessonId && supabase) {
      const { data: lesson } = await supabase
        .from("lessons")
        .select("title, lesson_date, lesson_type, content, topic")
        .eq("id", lessonId)
        .single()

      if (lesson) {
        const typeLabel = lesson.lesson_type === "foundational_topic" ? "Foundational Topic" : "Daily Class"
        const cleanContent = (lesson.content || "").replace(/<[^>]*>/g, " ").slice(0, 1500)
        lessonInfo = `
CURRENT ${typeLabel.toUpperCase()} CONTEXT:
- Title: "${lesson.title}"
- Type: ${typeLabel}
- Topic: ${lesson.topic || "English"}
- Date: ${lesson.lesson_date}
- Content / Key Concepts:
${cleanContent || "(No lesson text provided)"}
        `.trim()
      }
    }

    // 3. Fetch recent chat history (last 6 messages)
    let history: { role: string; parts: [{ text: string }] }[] = []
    if (lessonId && user && supabase) {
      const { data: pastMessages } = await supabase
        .from("lesson_chat_messages")
        .select("role, content")
        .eq("lesson_id", lessonId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6)

      if (pastMessages && pastMessages.length > 0) {
        history = pastMessages.reverse().map(m => ({
          role: m.role === "model" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      }
    }

    // 4. Save user message to database
    if (lessonId && user && supabase) {
      await supabase.from("lesson_chat_messages").insert({
        lesson_id: lessonId,
        user_id: user.id,
        role: "user",
        content: message.trim()
      })
    }

    // 5. Call Google Gemini API
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.includes("your-google-gemini")) {
      const fallback = `Namaste ${studentName}! 🙏 Main aapka AI English Tutor (Akib Sir) hoon.\n\nAapka question tha: "${message}"\n\n(Note: Set your GEMINI_API_KEY in web/.env.local to enable live Gemini 1.5 Flash responses!)`
      if (lessonId && user && supabase) {
        await supabase.from("lesson_chat_messages").insert({
          lesson_id: lessonId,
          user_id: user.id,
          role: "model",
          content: fallback
        })
      }
      return NextResponse.json({ reply: fallback })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash"
    
    const systemPrompt = `
You are a warm, highly encouraging, and patient personal English Tutor named 'Akib Sir' on the 'Learn English' web app.
You specialize in helping Hindi-speaking students become fluent and confident in everyday, spoken, and professional English.

${lessonInfo}

STUDENT PROFILE:
- Name: ${studentName}
- The student is learning English and prefers simple, natural conversational Hinglish (Hindi written in Roman English script + clear English sentences).

TEACHING & RESPONSE GUIDELINES:
1. Explanations:
   - Keep explanations clear, friendly, and relatable.
   - Mix conversational Hinglish with English (e.g., "Jab aap kisi cheez ki value pehle se maan lete hain...").
   - Use short bullet points and bold formatting for key English vocabulary.
2. Sentence Correction ("Correct me if I'm wrong"):
   - If the student writes a sentence and asks for feedback or tries to practice:
     a. Acknowledge what was good (positive reinforcement).
     b. Gently point out any grammatical or collocation errors.
     c. Provide the natural, native alternative in bold.
     d. Explain the 'why' in simple Hinglish so they remember the concept.
3. Practice Encouragement:
   - Keep answers concise (under 150-200 words) so the student isn't overwhelmed.
   - End with a quick follow-up question or micro-challenge asking them to make a sentence using one of the words.
    `.trim()

    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    })

    // Construct valid alternating history
    const chat = model.startChat({
      history: history.length > 0 && history[0].role === "user" ? history : []
    })

    const result = await chat.sendMessage(message.trim())
    const replyText = result.response.text() || "Main aapka question samajh nahi paaya, kya aap dobara pooch sakte hain?"

    // 6. Save model response to database
    if (lessonId && user && supabase) {
      await supabase.from("lesson_chat_messages").insert({
        lesson_id: lessonId,
        user_id: user.id,
        role: "model",
        content: replyText
      })
    }

    return NextResponse.json({ reply: replyText })
  } catch (error: any) {
    console.error("[Gemini API Error]", error)
    return NextResponse.json(
      { error: error?.message || "Failed to generate AI tutor response" },
      { status: 500 }
    )
  }
}

// Clear chat history endpoint
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const lessonId = searchParams.get("lessonId")

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID is required" }, { status: 400 })
    }

    await supabase
      .from("lesson_chat_messages")
      .delete()
      .eq("lesson_id", lessonId)
      .eq("user_id", user.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

