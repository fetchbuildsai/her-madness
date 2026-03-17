'use client'

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { signIn, signInWithGoogle } from "../actions"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await signInWithGoogle()
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] pointer-events-none">
        <div className="absolute top-0 left-1/3 w-64 h-64 rounded-full bg-[#7c3aed] opacity-[0.08] blur-[100px]" />
        <div className="absolute top-8 right-1/3 w-48 h-48 rounded-full bg-[#d4a017] opacity-[0.07] blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🏀</span>
            <span className="font-black text-xl tracking-[0.18em] text-[#d4a017]">HER MADNESS</span>
          </Link>
          <p className="text-[#71717a] text-sm">Welcome back</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
          onClick={handleGoogle} disabled={googleLoading}
          className="w-full py-3.5 border border-white/10 bg-white/[0.04] text-white rounded-2xl hover:bg-white/[0.08] hover:border-white/20 transition-all text-sm font-semibold flex items-center justify-center gap-3 mb-4 disabled:opacity-50"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </motion.button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-xs text-[#52525b]">or with email</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <div className="bg-[#111113] border border-white/[0.08] rounded-3xl p-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >{error}</motion.div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase tracking-wide">Email</label>
              <input name="email" type="email" placeholder="you@example.com" required
                className="w-full px-4 py-3 bg-[#09090b] border border-white/[0.08] rounded-xl text-white placeholder-[#3f3f46] text-sm focus:outline-none focus:border-[#d4a017]/60 focus:ring-1 focus:ring-[#d4a017]/20 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#71717a] mb-1.5 uppercase tracking-wide">Password</label>
              <input name="password" type="password" placeholder="••••••••" required
                className="w-full px-4 py-3 bg-[#09090b] border border-white/[0.08] rounded-xl text-white placeholder-[#3f3f46] text-sm focus:outline-none focus:border-[#d4a017]/60 focus:ring-1 focus:ring-[#d4a017]/20 transition-all" />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#d4a017] text-black font-bold rounded-xl hover:bg-[#f0c040] transition-colors text-sm disabled:opacity-60"
              style={{ boxShadow: '0 4px 20px rgba(212,160,23,0.25)' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>
        </div>

        <p className="text-center text-sm text-[#52525b] mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-[#d4a017] hover:underline font-medium">Sign up free</Link>
        </p>
      </motion.div>
    </div>
  )
}
