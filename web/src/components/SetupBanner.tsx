import { isSupabaseConfigured } from "@/lib/supabase/config"
import { Database, AlertTriangle } from "lucide-react"

export default function SetupBanner() {
  if (isSupabaseConfigured()) {
    return null
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2.5 text-xs text-amber-900">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Offline Preview Mode:</strong> Supabase database is not connected yet. Real data & auth will activate once you fill in your project credentials in <code className="bg-amber-100/80 px-1.5 py-0.5 rounded font-mono text-amber-950">web/.env.local</code>.
          </span>
        </div>
        <a
          href="https://supabase.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
        >
          <Database className="w-3.5 h-3.5" />
          <span>Supabase Dashboard &rarr;</span>
        </a>
      </div>
    </div>
  )
}

