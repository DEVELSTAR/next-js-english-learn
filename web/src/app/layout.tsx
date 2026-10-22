import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SetupBanner from "@/components/SetupBanner"

export const metadata: Metadata = {
  title: "Learn English — Daily Hinglish Vocabulary & Concepts",
  description: "Learn English through clear, conversational Hinglish explanations and daily bite-sized classes.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="h-full text-stone-900 antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans text-stone-900 selection:bg-emerald-200" suppressHydrationWarning>
        <SetupBanner />
        <Suspense fallback={<header className="h-16 bg-white/90 border-b border-stone-200" />}>
          <Navbar />
        </Suspense>
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
