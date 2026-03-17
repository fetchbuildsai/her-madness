'use client'

import { useState } from 'react'

interface Props {
  variant?: 'full' | 'compact'
  userId?: string
}

export default function AddToCalendarButton({ variant = 'full', userId }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const url = userId
        ? undefined // POST for personalized
        : '/api/calendar'

      const res = userId
        ? await fetch('/api/calendar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          })
        : await fetch('/api/calendar')

      const blob = await res.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = userId ? 'my-her-madness-bracket.ics' : 'her-madness-2026-tournament.ics'
      link.click()
      URL.revokeObjectURL(link.href)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch {
      alert('Something went wrong. Try again!')
    } finally {
      setLoading(false)
    }
  }

  if (variant === 'compact') {
    return (
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-white/10 text-[#71717a] rounded-xl hover:border-[#d4a017]/40 hover:text-[#d4a017] transition-all disabled:opacity-50"
      >
        {loading ? '⏳' : done ? '✓ Added!' : '📅'} {done ? 'Added to Calendar' : 'Add to Calendar'}
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold border border-white/10 text-[#a1a1aa] rounded-2xl hover:border-[#d4a017]/30 hover:text-white hover:bg-white/[0.04] transition-all disabled:opacity-50"
    >
      <span className="text-base">{done ? '✅' : '📅'}</span>
      {loading ? 'Generating...' : done ? 'Added to Calendar!' : 'Add All Games to Calendar'}
    </button>
  )
}
