'use client'

import Link from "next/link"
import { motion, type Variants } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AddToCalendarButton from "@/components/AddToCalendarButton"
import { createClient } from "@/lib/supabase/client"

// Animated counter hook
function useCounter(target: number, duration = 1500) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setCount(target); clearInterval(timer) }
      else setCount(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return count
}

const features = [
  {
    icon: "🏀",
    title: "Your Bracket",
    desc: "68 real teams. Every seed. Every region. Pick your winners all the way to the championship.",
    accent: "#d4a017",
    border: "hover:border-[#d4a017]/50",
    glow: "rgba(212,160,23,0.15)",
    href: "/bracket",
  },
  {
    icon: "📊",
    title: "Live Scores",
    desc: "Real-time updates every game. No refresh needed. Know the moment something goes crazy.",
    accent: "#a855f7",
    border: "hover:border-[#a855f7]/50",
    glow: "rgba(168,85,247,0.15)",
    href: "/scores",
  },
  {
    icon: "💬",
    title: "Game Chat",
    desc: "Every game has its own room. Talk through the action with fans who actually know WBB.",
    accent: "#d4a017",
    border: "hover:border-[#d4a017]/50",
    glow: "rgba(212,160,23,0.15)",
    href: "/community",
  },
  {
    icon: "🏆",
    title: "Leaderboard",
    desc: "See where your bracket stands vs. everyone else. Rankings update live after every game.",
    accent: "#a855f7",
    border: "hover:border-[#a855f7]/50",
    glow: "rgba(168,85,247,0.15)",
    href: "/leaderboard",
  },
]

const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } }
const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }

export default function Home() {
  const teams = useCounter(68)
  const games = useCounter(63)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/leaderboard')
    })
  }, [router])

  return (
    <div className="min-h-screen bg-[#09090b] overflow-x-hidden">

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#09090b]/70 backdrop-blur-xl"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🏀</span>
            <span className="font-black text-base tracking-[0.2em] text-[#d4a017]">HER MADNESS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login"
              className="px-4 py-2 text-sm text-[#71717a] hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/auth/signup"
              className="px-5 py-2 text-sm font-bold bg-[#d4a017] text-black rounded-xl hover:bg-[#f0c040] transition-all hover:-translate-y-px active:translate-y-0">
              Join Free
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ——— HERO ——— */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-16 overflow-hidden">

        {/* Ambient glow orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none">
          <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-[#7c3aed] opacity-[0.12] blur-[100px]" />
          <div className="absolute top-12 right-1/4 w-56 h-56 rounded-full bg-[#d4a017] opacity-[0.10] blur-[100px]" />
        </div>

        {/* Animated court lines */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <motion.svg
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            viewBox="0 0 900 900"
            className="w-[800px] h-[800px] opacity-[0.035]"
            fill="none"
          >
            <circle cx="450" cy="450" r="220" stroke="#d4a017" strokeWidth="2.5"/>
            <circle cx="450" cy="450" r="70" stroke="#d4a017" strokeWidth="2"/>
            <circle cx="450" cy="450" r="10" fill="#d4a017"/>
            <path d="M 170 450 A 280 280 0 0 1 730 450" stroke="#7c3aed" strokeWidth="2"/>
            <rect x="340" y="590" width="220" height="160" stroke="#d4a017" strokeWidth="1.5" fill="none"/>
            <rect x="340" y="150" width="220" height="160" stroke="#d4a017" strokeWidth="1.5" fill="none"/>
            <path d="M 340 750 A 110 110 0 0 0 560 750" stroke="#7c3aed" strokeWidth="1.5"/>
            <path d="M 340 310 A 110 110 0 0 1 560 310" stroke="#7c3aed" strokeWidth="1.5"/>
            <line x1="100" y1="450" x2="800" y2="450" stroke="#d4a017" strokeWidth="1" strokeDasharray="10 10"/>
          </motion.svg>
        </div>

        <div className="relative z-10 text-center max-w-5xl mx-auto">

          {/* Live badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7c3aed]/25 bg-[#7c3aed]/10 text-xs text-[#a855f7] mb-8 font-semibold tracking-wide"
          >
            <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
            2026 NCAA Women&apos;s Tournament — Brackets open
          </motion.div>

          {/* Main headline */}
          <div className="overflow-hidden mb-2">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[clamp(2.5rem,18vw,10rem)] font-black tracking-tight leading-none"
                style={{
                  background: 'linear-gradient(135deg, #f0c040 0%, #d4a017 45%, #a07810 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>
                HER
              </h1>
            </motion.div>
          </div>
          <div className="overflow-hidden mb-8">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 className="text-[clamp(2.5rem,18vw,10rem)] font-black tracking-tight leading-none text-white">
                MADNESS
              </h1>
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-lg sm:text-xl text-[#a1a1aa] max-w-xl mx-auto mb-3 leading-relaxed"
          >
            The Women&apos;s March Madness experience built for fans who actually know the game.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="text-sm text-[#52525b] max-w-md mx-auto mb-10"
          >
            Brackets. Live scores. Real-time chat. A leaderboard you&apos;ll actually care about.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-16"
          >
            <Link
              href="/auth/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold bg-[#d4a017] text-black rounded-2xl transition-all duration-200 hover:-translate-y-1 hover:bg-[#f0c040]"
              style={{ boxShadow: '0 0 0 0 rgba(212,160,23,0)' }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,160,23,0.45)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 0 0 rgba(212,160,23,0)')}
            >
              🏀 Fill Your Bracket
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold border border-white/10 text-white rounded-2xl hover:bg-white/[0.06] hover:border-white/20 transition-all duration-200"
            >
              Sign In →
            </Link>
          </motion.div>

          {/* Calendar CTA */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.85 }}
            className="flex justify-center mb-6"
          >
            <AddToCalendarButton />
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="inline-flex items-center gap-6 sm:gap-10 px-8 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] backdrop-blur-sm"
          >
            {[
              { value: teams, label: "Teams" },
              { value: games, label: "Games" },
              { value: 1, label: "Champion", prefix: "" },
            ].map((stat, i) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-black text-white tabular-nums">
                  {stat.value}{i < 2 ? "" : ""}
                </div>
                <div className="text-xs text-[#52525b] font-medium mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
        >
          <span className="text-xs text-[#3f3f46] tracking-widest uppercase">scroll</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-px h-8 bg-gradient-to-b from-[#3f3f46] to-transparent"
          />
        </motion.div>
      </section>

      {/* ——— FEATURES ——— */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold text-[#7c3aed] tracking-[0.2em] uppercase mb-3">Everything in one place</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Built different.<br className="sm:hidden" /> Built for WBB fans.
            </h2>
            <p className="text-[#71717a] max-w-md mx-auto text-sm leading-relaxed">
              Not an afterthought. An app built from scratch, specifically for women&apos;s basketball fans who are tired of being treated like one.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
              >
                <Link
                  href={f.href}
                  className={`group relative bg-[#111113] border border-white/[0.07] rounded-3xl p-6 ${f.border} transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full hover:-translate-y-1.5`}
                >
                  {/* Card glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${f.glow}, transparent 70%)` }} />

                  <div className="relative z-10 flex-1">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                      style={{ backgroundColor: `${f.accent}15`, boxShadow: `0 0 24px ${f.accent}20` }}
                    >
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-[#71717a] leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="relative z-10 mt-4 flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: f.accent }}>
                    <span>Go →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ——— WHY THIS EXISTS ——— */}
      <section className="py-16 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden border border-white/[0.07]"
            style={{ background: 'linear-gradient(135deg, #111113 0%, #0f0a1a 100%)' }}
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#7c3aed] opacity-[0.07] blur-[80px]" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#d4a017] opacity-[0.06] blur-[80px]" />
            <div className="relative z-10 text-center">
              <p className="text-4xl mb-6">🏀</p>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                Women&apos;s March Madness<br />deserves its own thing.
              </h2>
              <p className="text-[#71717a] text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
                Not a pink reskin. Not buried under the men&apos;s bracket. An actual platform — built in 4 days, from scratch, by a women&apos;s basketball fan who got tired of waiting.
              </p>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-2 px-8 py-4 text-base font-bold bg-[#d4a017] text-black rounded-2xl hover:bg-[#f0c040] transition-all hover:-translate-y-0.5"
                style={{ boxShadow: '0 4px 24px rgba(212,160,23,0.35)' }}
              >
                Create Your Free Account →
              </Link>
              <p className="text-xs text-[#3f3f46] mt-4">Brackets lock Thursday night — first game tips Friday</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ——— FOOTER ——— */}
      <footer className="border-t border-white/[0.06] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#3f3f46]">
          <div className="flex items-center gap-2">
            <span>🏀</span>
            <span className="font-black text-[#d4a017] tracking-[0.15em]">HER MADNESS</span>
          </div>
          <p>
            Built by{" "}
            <a href="https://instagram.com/nicole.fetchko" target="_blank" rel="noopener noreferrer"
              className="text-[#d4a017] hover:underline">
              Nicole Fetchko
            </a>
            {" "}· Women&apos;s basketball deserves this.
          </p>
        </div>
      </footer>

    </div>
  )
}
