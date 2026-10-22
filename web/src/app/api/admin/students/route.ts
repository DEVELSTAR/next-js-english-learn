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
    .select("id, role, name, email")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { error: "Forbidden: Admin credentials required", status: 403 }
  }

  return { caller: profile }
}

// POST: Create a new student
export async function POST(req: Request) {
  try {
    const auth = await authenticateAdmin()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await req.json()
    const { name, email, password } = body

    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Name, valid email, and a password of at least 6 characters are required." },
        { status: 400 }
      )
    }

    const adminClient = getAdminClient()

    // Create student user with confirmed email
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), role: "student" },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const userId = userData.user.id

    // Ensure student profile exists with role: 'student'
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: "student",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, student: profile })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create student" }, { status: 500 })
  }
}

