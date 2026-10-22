"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error("Unable to authenticate admin credentials.")
      }

      // Check role in profiles
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role, name")
        .eq("id", data.user.id)
        .single()

      if (profileErr || !profile || !["admin", "super_admin"].includes(profile.role)) {
        // Not an admin: sign out immediately!
        await supabase.auth.signOut()
        throw new Error(
          "Access denied. This portal is strictly for administrators. Students must sign in through the student portal."
        )
      }

      // Admin verified -> Redirect to /admin
      router.push("/admin")
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err?.message || "Invalid administrative credentials.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 text-white rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6">
        {/* Header Badge & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Admin Control Center</h1>
          <p className="text-xs text-stone-400">
            Restricted authentication portal for authorized personnel.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-start gap-2.5 leading-relaxed">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleAdminSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">Admin Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-700 bg-stone-800/80 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">Admin Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-700 bg-stone-800/80 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 transition cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-md flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? "Verifying Credentials..." : "Authenticate as Admin"}
          </button>
        </form>

        {/* Security Warning Notice */}
        <div className="pt-2 text-center border-t border-stone-800/80">
          <p className="text-[11px] text-stone-500">
            Unauthorized access attempts are monitored and recorded.
          </p>
        </div>
      </div>
    </div>
  )
}

