import { NextResponse } from "next/server"
import { createClient, getAdminClient } from "@/lib/supabase/server"

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

// PUT: Update student
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
    const body = await req.json()
    const { name, password } = body

    const adminClient = getAdminClient()

    // 1. Fetch target user profile
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // CRITICAL SECURITY RULE: super admin cannot be edited or deleted
    if (targetProfile.role === "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin account cannot be modified or edited." },
        { status: 403 }
      )
    }

    // If target is admin, only super_admin can edit
    if (targetProfile.role === "admin" && auth.caller?.role !== "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admin can modify administrator accounts." },
        { status: 403 }
      )
    }

    // 2. Update Auth password if provided
    if (password && password.trim().length >= 6) {
      const { error: pwdError } = await adminClient.auth.admin.updateUserById(id, {
        password: password.trim(),
        user_metadata: name?.trim() ? { name: name.trim() } : undefined,
      })
      if (pwdError) {
        return NextResponse.json({ error: pwdError.message }, { status: 400 })
      }
    }

    // 3. Update profile name
    if (name?.trim()) {
      const { data: updatedProfile, error: profileUpdateError } = await adminClient
        .from("profiles")
        .update({
          name: name.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (profileUpdateError) {
        return NextResponse.json({ error: profileUpdateError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, profile: updatedProfile })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}

// DELETE: Delete student
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
    const adminClient = getAdminClient()

    // 1. Fetch target user profile
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // CRITICAL SECURITY RULE: super admin cannot be deleted or edited
    if (targetProfile.role === "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin account is protected and can never be deleted." },
        { status: 403 }
      )
    }

    // Admins must be deleted via /api/admin/admins, not students API
    if (targetProfile.role === "admin") {
      return NextResponse.json(
        { error: "Administrator accounts can only be managed by Super Admin in the Admins section." },
        { status: 403 }
      )
    }

    // 2. Delete user from Supabase Auth (cascades to profiles & completions)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}

