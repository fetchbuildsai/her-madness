'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import AppNav from '@/components/AppNav'

// ─── Types ───────────────────────────────────────────────────────
interface ESPNTeam {
  id: string
  name: string
  shortName: string
  abbreviation: string
  logo: string | null
  seed: number | null
  score: number
  winner: boolean
}

interface ESPNGame {
  id: string
  name: string
  shortName: string
  date: string
  status: 'upcoming' | 'live' | 'final'
  round: number
  region: string
  clock: string
  period: number
  note: string
  broadcast: string | null
  venue: string | null
  home: ESPNTeam
  away: ESPNTeam
}

// ─── Constants ───────────────────────────────────────────────────
const ROUND_LABELS: Record<number, string> = {
  0: 'First Four',
  1: 'First Round',
  2: 'Second Round',
  3: 'Sweet Sixteen',
  4: 'Elite Eight',
  5: 'Final Four',
  6: 'National Championship',
}

const ROUND_DATES: Record<number, string> = {
  0: 'March 18',
  1: 'March 20–21',
  2: 'March 22–23',
  3: 'March 27–28',
  4: 'March 29–30',
  5: 'April 3 & 5',
  6: 'April 7',
}

function formatGameTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
  })
}

// ─── Team logo ───────────────────────────────────────────────────
function TeamLogo({ logo, name, size = 26 }: { logo: string | null; name: string; size?: number }) {
  const [errored, setErrored] = useState(false)

  if (!logo || errored) {
    return (
      <div
        className="rounded-full bg-white/10 flex items-center justify-center shrink-0 text-[8px] font-bold text-white/40"
        style={{ width: size, height: size }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt={name}
      width={size}
      height={size}
      className="object-contain shrink-0"
      onError={() => setErrored(true)}
    />
  )
}

// ─── Game card ───────────────────────────────────────────────────
function GameCard({ game }: { game: ESPNGame }) {
  const showChat = game.round >= 2
  const isLive  = game.status === 'live'
  const isFinal = game.status === 'final'
  // ESPN: away = top team in bracket display, home = bottom
  const top    = game.away
  const bottom = game.home

  return (
    <div className={`rounded-xl border bg-[#111113] overflow-hidden transition-all ${
      isLive
        ? 'border-[#d4a017]/50 shadow-[0_0_16px_rgba(212,160,23,0.1)]'
        : 'border-white/[0.07]'
    }`}>

      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5">
        <div className="flex flex-col min-w-0">
          {game.region && (
            <span className="text-[9px] font-semibold text-white/25 uppercase tracking-wider leading-tight truncate">
              {game.region}
            </span>
          )}
          {!isLive && !isFinal && (
            <span className="text-[10px] text-white/35 leading-tight truncate">
              {formatGameTime(game.date)}
            </span>
          )}
          {isFinal && (
            <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Final</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {game.broadcast && (
            <span className="text-[9px] font-bold text-white/30 border border-white/10 rounded px-1.5 py-0.5">
              {game.broadcast}
            </span>
          )}
          {isLive && (
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
              <span className="text-[10px] font-bold text-[#d4a017] uppercase tracking-wider">
                {game.period > 0 ? `Q${game.period} ${game.clock}` : 'Live'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-white/[0.05] mx-3" />

      {/* Teams */}
      <div className="px-3 py-2 space-y-1">
        {[top, bottom].map((team, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 py-1 px-1 rounded-lg transition-colors ${
              isFinal && team.winner ? 'bg-[#d4a017]/8' : ''
            }`}
          >
            <TeamLogo logo={team.logo} name={team.name} size={24} />
            <span className={`text-[10px] font-bold w-4 text-right shrink-0 ${
              team.seed && team.seed <= 3 ? 'text-[#d4a017]' : 'text-white/25'
            }`}>
              {team.seed ?? ''}
            </span>
            <span className={`text-sm font-semibold truncate flex-1 ${
              isFinal && team.winner  ? 'text-white'
              : isFinal              ? 'text-white/30'
                                     : 'text-white/70'
            }`}>
              {team.shortName || team.abbreviation}
            </span>
            {(isLive || isFinal) && (
              <span className={`text-base font-black tabular-nums shrink-0 ${
                isFinal && team.winner ? 'text-[#d4a017]'
                : isFinal             ? 'text-white/25'
                                      : 'text-white'
              }`}>
                {team.score}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Game chat link — Round 2+ only */}
      {showChat && (
        <div className="px-3 pb-2.5 pt-1 border-t border-white/[0.05] mt-1">
          <Link
            href={`/community/game/${game.id}?name=${encodeURIComponent(game.shortName)}&round=${game.round}`}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-white/30 hover:text-[#d4a017] transition-colors"
          >
            <span>💬</span>
            <span>Game Chat</span>
            {isLive && <span className="ml-auto text-[9px] text-[#d4a017] font-bold uppercase tracking-wide animate-pulse">Live</span>}
          </Link>
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────
export default function ScoresClient({ username }: { username?: string }) {
  const [games, setGames]         = useState<ESPNGame[]>([])
  const [loading, setLoading]     = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchScores = useCallback(async () => {
    try {
      const res  = await fetch('/api/espn', { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data.games)) {
        setGames(data.games)
        setLastFetch(new Date())
      }
    } catch (err) {
      console.error('Scores fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScores()
    const interval = setInterval(fetchScores, 30_000)
    return () => clearInterval(interval)
  }, [fetchScores])

  const byRound     = games.reduce<Record<number, ESPNGame[]>>((acc, g) => {
    if (!acc[g.round]) acc[g.round] = []
    acc[g.round].push(g)
    return acc
  }, {})
  const sortedRounds = Object.keys(byRound).map(Number).sort((a, b) => a - b)
  const liveGames   = games.filter(g => g.status === 'live')
  const hasLive     = liveGames.length > 0

  return (
    <div className="min-h-screen bg-[#09090b]">
      <AppNav username={username} />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 sm:pt-24">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-2xl font-black text-white">Live Scores</h1>
            {hasLive && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#d4a017]/10 border border-[#d4a017]/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
                <span className="text-[10px] font-bold text-[#d4a017] uppercase tracking-wider">
                  {liveGames.length} Live Now
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-white/30">
            2026 NCAA Women's Basketball Tournament · Updates every 30s
          </p>
          {lastFetch && (
            <p className="text-[10px] text-white/20 mt-1">
              Last updated {lastFetch.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>

        {/* Live games pinned to top */}
        {hasLive && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#d4a017] animate-pulse" />
              <h2 className="text-sm font-bold text-[#d4a017] uppercase tracking-wider">Happening Now</h2>
            </div>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {liveGames.map(g => <GameCard key={g.id} game={g} />)}
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 bg-white/[0.03] border border-white/[0.04] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {/* All rounds */}
        {!loading && (
          <div className="space-y-10">
            {sortedRounds.map(round => {
              const roundGames = byRound[round]
              const liveCount  = roundGames.filter(g => g.status === 'live').length
              const cols = round >= 5
                ? 'grid-cols-1 sm:grid-cols-2 max-w-lg'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

              return (
                <div key={round}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-white">{ROUND_LABELS[round]}</h2>
                      <p className="text-xs text-white/25 mt-0.5">{ROUND_DATES[round]}</p>
                    </div>
                    {liveCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
                        <span className="text-xs font-semibold text-[#d4a017]">{liveCount} live</span>
                      </div>
                    )}
                  </div>
                  <div className={`grid gap-3 ${cols}`}>
                    {roundGames.map(g => <GameCard key={g.id} game={g} />)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && games.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏀</p>
            <p className="text-white/40 font-semibold">First Four starts tomorrow!</p>
            <p className="text-white/20 text-sm mt-1">Check back March 18 — Nebraska vs Richmond, 7pm ET on ESPN2</p>
          </div>
        )}

        <p className="text-center text-xs text-white/10 mt-12">
          Scores via ESPN · All times Eastern
        </p>
      </div>
    </div>
  )
}
