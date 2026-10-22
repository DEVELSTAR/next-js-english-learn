"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          role: "student",
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setIsLoading(false)
      return
    }

    if (data.session) {
      // User is immediately logged in
      router.push("/")
      router.refresh()
    } else {
      // Email confirmation is required by Supabase
      setIsSuccess(true)
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-stone-200 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-extrabold text-stone-900 tracking-tight">Create Account</h1>
        <p className="text-xs text-stone-500">Join Learn English to track progress and ask the AI Tutor.</p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{error}</p>
            {error.toLowerCase().includes("database error") && (
              <p className="text-[11px] text-red-600">
                Make sure you ran <code>supabase/schema.sql</code> in your Supabase SQL editor to create the <code>profiles</code> table.
              </p>
            )}
          </div>
        </div>
      )}

      {isSuccess ? (
        <div className="space-y-5 text-center py-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-stone-900">Account Created!</h2>
            <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
              Please check your email inbox at <strong className="text-stone-900">{email}</strong> to verify your account.
            </p>
          </div>

          <div className="text-xs text-stone-600 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-left space-y-1.5">
            <p className="font-bold text-stone-800">Want to log in immediately without verifying email?</p>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              In your Supabase dashboard &rarr; <strong>Authentication</strong> &rarr; <strong>Providers</strong> &rarr; <strong>Email</strong>, turn off <strong>&quot;Confirm email&quot;</strong>. Then you can log in right away!
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center justify-center w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Go to Sign In &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700">Your Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Mohd Akib"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-900"
            />
          </div>

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
                minLength={6}
                placeholder="At least 6 characters"
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
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
      )}

      <div className="text-center text-xs text-stone-500 pt-2 border-t border-stone-100">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-stone-900 underline">
          Sign in here
        </Link>
      </div>
    </div>
  )
}


