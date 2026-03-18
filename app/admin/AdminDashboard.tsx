'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalBrackets: number
  submittedBrackets: number
  beehiivCount: number
  recentSignups: Array<{ username: string; created_at: string }>
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

export default function AdminDashboard({ stats }: { stats: Stats }) {
  const bracketRate = stats.totalUsers > 0
    ? Math.round((stats.submittedBrackets / stats.totalUsers) * 100)
    : 0

  const metrics = [
    {
      label: 'Total Signups',
      value: stats.totalUsers,
      icon: '👥',
      accent: '#d4a017',
      sub: 'accounts created',
    },
    {
      label: 'Brackets Submitted',
      value: stats.submittedBrackets,
      icon: '🏀',
      accent: '#a855f7',
      sub: `${bracketRate}% of users`,
    },
    {
      label: 'Brackets Started',
      value: stats.totalBrackets,
      icon: '✏️',
      accent: '#d4a017',
      sub: 'in progress or done',
    },
    {
      label: 'Newsletter Subs',
      value: stats.beehiivCount,
      icon: '📧',
      accent: '#a855f7',
      sub: 'The Crossover via Beehiiv',
    },
  ]

  return (
    <div className="min-h-screen bg-[#09090b]">

      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-md px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span>🏀</span>
            <span className="font-black text-sm tracking-widest text-[#d4a017]">HER MADNESS</span>
          </Link>
          <span className="text-[#3f3f46]">/</span>
          <span className="text-sm text-[#71717a] font-medium">Admin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-[#52525b]">Live</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-2xl font-black text-white mb-1">Dashboard</h1>
          <p className="text-sm text-[#52525b]">
            Last updated: {new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </motion.div>

        {/* Metric cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
          {metrics.map((m) => (
            <motion.div
              key={m.label}
              variants={fadeUp}
              className="bg-[#111113] border border-white/[0.07] rounded-2xl p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${m.accent}15` }}
                >
                  {m.icon}
                </div>
                <div
                  className="w-2 h-2 rounded-full mt-1"
                  style={{ backgroundColor: m.accent }}
                />
              </div>
              <div className="text-3xl font-black text-white tabular-nums mb-1">
                {m.value.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-[#a1a1aa] mb-0.5">{m.label}</div>
              <div className="text-xs text-[#52525b]">{m.sub}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Conversion bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#111113] border border-white/[0.07] rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Bracket Conversion</h2>
              <p className="text-xs text-[#52525b] mt-0.5">Signups who submitted a bracket</p>
            </div>
            <span className="text-2xl font-black text-[#d4a017]">{bracketRate}%</span>
          </div>
          <div className="w-full h-2 bg-[#27272a] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${bracketRate}%` }}
              transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
              className="h-full rounded-full bg-[#d4a017]"
            />
          </div>
          <div className="flex justify-between text-xs text-[#52525b] mt-2">
            <span>{stats.submittedBrackets} submitted</span>
            <span>{stats.totalUsers} total users</span>
          </div>
        </motion.div>

        {/* Recent signups */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#111113] border border-white/[0.07] rounded-2xl p-6"
        >
          <h2 className="text-sm font-bold text-white mb-4">Recent Signups</h2>
          {stats.recentSignups.length === 0 ? (
            <p className="text-sm text-[#52525b] text-center py-8">
              No signups yet — launch day is coming 🏀
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recentSignups.map((user, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#d4a017]/15 flex items-center justify-center text-xs font-bold text-[#d4a017]">
                      {user.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-[#a1a1aa] font-medium">@{user.username}</span>
                  </div>
                  <span className="text-xs text-[#52525b]">
                    {new Date(user.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Links */}
        <div className="flex gap-3 mt-6 flex-wrap">
          <Link
            href="/admin/scores"
            className="flex-1 py-3 text-center text-xs font-semibold border border-[#d4a017]/30 text-[#d4a017] rounded-xl hover:bg-[#d4a017]/10 transition-all min-w-[160px]"
          >
            ⚡ Enter Results &amp; Scores →
          </Link>
          <a
            href={`https://app.beehiiv.com/publications/${process.env.NEXT_PUBLIC_BEEHIIV_PUB_ID ?? 'd3d7b029-0880-4b74-9d5c-13211181850d'}/subscribers`}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 py-3 text-center text-xs font-semibold border border-white/[0.08] text-[#71717a] rounded-xl hover:border-[#a855f7]/40 hover:text-[#a855f7] transition-all min-w-[160px]"
          >
            View Beehiiv Subscribers →
          </a>
          <a
            href="https://supabase.com/dashboard/project/pwuayyyqonocvuozycek/editor"
            target="_blank" rel="noopener noreferrer"
            className="flex-1 py-3 text-center text-xs font-semibold border border-white/[0.08] text-[#71717a] rounded-xl hover:border-[#d4a017]/40 hover:text-[#d4a017] transition-all min-w-[160px]"
          >
            View Supabase Data →
          </a>
        </div>
      </div>
    </div>
  )
}
