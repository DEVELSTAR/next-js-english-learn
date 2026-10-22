"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff } from "lucide-react"

function SignInForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") || "/"

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
      return
    }

    if (authData?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authData.user.id)
        .single()

      if (profile && ["admin", "super_admin"].includes(profile.role)) {
        router.push("/admin")
        router.refresh()
        return
      }
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-stone-200 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Sign In</h1>
        <p className="text-xs text-stone-500">Welcome back! Sign in to continue learning.</p>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1.5">
          <p className="font-semibold">{error}</p>
          {error.toLowerCase().includes("email not confirmed") && (
            <p className="text-[11px] text-red-600 leading-relaxed">
              Your email hasn&apos;t been confirmed yet. Please click the link sent to your email, or in your{" "}
              <a
                href="https://supabase.com/dashboard/project/oaeyxtkobqevhwrdylgf/auth/providers"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-bold text-red-800"
              >
                Supabase Auth Settings
              </a>
              , turn off <strong>&quot;Confirm email&quot;</strong> to allow instant logins without verification.
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-stone-700">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
        Don&apos;t have an account?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-stone-900 underline">
          Register here
        </Link>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto my-12 p-8 text-center text-xs text-stone-400">Loading sign in...</div>}>
      <SignInForm />
    </Suspense>
  )
}

