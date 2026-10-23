import { NextResponse } from "next/server"
import { createClient, getAdminClient } from "@/lib/supabase/server"

// Helper to authenticate caller as admin or super_admin
async function authenticateAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Unauthorized", status: 401 }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const userRole = profile?.role || user.user_metadata?.role

  if (!userRole || !["admin", "super_admin"].includes(userRole)) {
    return { error: "Forbidden: Admin credentials required.", status: 403 }
  }

  return { caller: user }
}

// PUT: Update an existing lesson
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateAdmin()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const lessonId = parseInt(id, 10)

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

    const body = await req.json()
    const { title, slug, lesson_date, lesson_type, topic, status, introduction, content } = body

    if (!title?.trim() || !slug?.trim() || !lesson_date) {
      return NextResponse.json(
        { error: "Title, slug, and lesson date are required." },
        { status: 400 }
      )
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      lesson_date,
      lesson_type: lesson_type || "daily_class",
      topic: topic?.trim() || null,
      status: status || "draft",
      introduction: introduction?.trim() || null,
      content: content?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const adminClient = getAdminClient()
    const { data: updated, error } = await adminClient
      .from("lessons")
      .update(payload)
      .eq("id", lessonId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lesson: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}

// DELETE: Delete a lesson
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateAdmin()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const lessonId = parseInt(id, 10)

    if (isNaN(lessonId)) {
      return NextResponse.json({ error: "Invalid lesson ID" }, { status: 400 })
    }

    const adminClient = getAdminClient()
    const { error } = await adminClient.from("lessons").delete().eq("id", lessonId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}
