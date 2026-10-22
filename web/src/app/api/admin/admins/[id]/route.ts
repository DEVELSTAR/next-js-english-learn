import { NextResponse } from "next/server"
import { createClient, getAdminClient } from "@/lib/supabase/server"

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

// PUT: Update an Administrator
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateSuperAdmin()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const body = await req.json()
    const { name, password } = body

    const adminClient = getAdminClient()

    // 1. Fetch target admin profile
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "Administrator not found" }, { status: 404 })
    }

    // CRITICAL SECURITY RULE: Super Admin can NEVER be edited or downgraded
    if (targetProfile.role === "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin account is permanently protected and cannot be edited or downgraded." },
        { status: 403 }
      )
    }

    // 2. Update password in Supabase Auth if provided
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

      return NextResponse.json({ success: true, admin: updatedProfile })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}

// DELETE: Delete an Administrator
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateSuperAdmin()
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const adminClient = getAdminClient()

    // 1. Fetch target profile
    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: "Administrator not found" }, { status: 404 })
    }

    // CRITICAL SECURITY RULE: Super Admin can NEVER be deleted
    if (targetProfile.role === "super_admin") {
      return NextResponse.json(
        { error: "Forbidden: Super Admin account is permanently protected and can never be deleted." },
        { status: 403 }
      )
    }

    // 2. Delete user from Supabase Auth (cascades to profile)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(id)
    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 })
  }
}

