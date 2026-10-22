import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function handleSignOut(req: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const reqUrl = new URL(req.url)
  const redirectTo = reqUrl.searchParams.get("redirectTo") || "/"
  const url = new URL(redirectTo, req.url)
  return NextResponse.redirect(url, { status: 303 })
}

export async function POST(req: Request) {
  return handleSignOut(req)
}

export async function GET(req: Request) {
  return handleSignOut(req)
}


