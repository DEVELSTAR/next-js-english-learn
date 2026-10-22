import { NextResponse } from "next/server"
import { createClient, getAdminClient } from "@/lib/supabase/server"

// Strict check: Only Super Admin can access admin CRUD
async function authenticateSuperAdmin() {
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

  if (!profile || profile.role !== "super_admin") {
    return { error: "Forbidden: Super Admin privileges strictly required.", status: 403 }
  }

  return { caller: profile }
}

// POST: Create a new Administrator
export async function POST(req: Request) {
  try {
    const auth = await authenticateSuperAdmin()
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

    // Create admin user in auth.users with email confirmed
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: { name: name.trim(), role: "admin" },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const userId = userData.user.id

    // Create admin profile with role: 'admin'
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: userId,
        email: email.trim().toLowerCase(),
        name: name.trim(),
        role: "admin",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, admin: profile })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to create administrator" }, { status: 500 })
  }
}

