'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'

interface Team { id: number; name: string; seed: number }
interface Game {
  id: number
  round: number
  region: string | null
  game_slot: string | null
  team1: Team | null
  team2: Team | null
  team1_score: number | null
  team2_score: number | null
  winner_id: number | null
  tip_off: string | null
  status: 'upcoming' | 'live' | 'final'
}

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
  0: 'Mar 18–19',
  1: 'Mar 20–21',
  2: 'Mar 22–23',
  3: 'Mar 27–28',
  4: 'Mar 29–30',
  5: 'Apr 3–5',
  6: 'Apr 7',
}

function formatTipOff(tip: string | null): string {
  if (!tip) return 'TBD'
  const d = new Date(tip)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
  })
}

function GameCard({ game, username }: { game: Game; username?: string }) {
  const isLive = game.status === 'live'
  const isFinal = game.status === 'final'
  const team1Wins = isFinal && game.winner_id === game.team1?.id
  const team2Wins = isFinal && game.winner_id === game.team2?.id

  return (
    <div className={`bg-[#111113] border rounded-xl p-4 transition-all ${
      isLive ? 'border-[#d4a017]/40 shadow-[0_0_12px_rgba(212,160,23,0.08)]' : 'border-white/[0.07]'
    }`}>
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-[#52525b] uppercase tracking-widest">
          {game.region ?? 'National'}
        </span>
        {isLive && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
            <span className="text-[10px] font-bold text-[#d4a017] uppercase tracking-wider">Live</span>
          </div>
        )}
        {isFinal && (
          <span className="text-[10px] font-semibold text-[#52525b] uppercase tracking-wider">Final</span>
        )}
        {!isLive && !isFinal && (
          <span className="text-[10px] text-[#3f3f46]">{formatTipOff(game.tip_off)}</span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {[
          { team: game.team1, score: game.team1_score, wins: team1Wins },
          { team: game.team2, score: game.team2_score, wins: team2Wins },
        ].map(({ team, score, wins }, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-1.5 rounded-lg px-2 transition-colors ${
              wins ? 'bg-[#d4a017]/[0.06]' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`text-xs font-bold w-4 text-center shrink-0 ${
                wins ? 'text-[#d4a017]' : 'text-[#52525b]'
              }`}>
                {team?.seed ?? '?'}
              </span>
              <span className={`text-sm font-semibold truncate ${
                wins ? 'text-white' : isFinal && !wins ? 'text-[#52525b]' : 'text-[#a1a1aa]'
              }`}>
                {team?.name ?? 'TBD'}
              </span>
            </div>
            {(isLive || isFinal) && (
              <span className={`text-lg font-black tabular-nums ml-2 shrink-0 ${
                wins ? 'text-[#d4a017]' : isFinal ? 'text-[#52525b]' : 'text-white'
              }`}>
                {score ?? 0}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyRound({ round }: { round: number }) {
  // Show placeholder cards for rounds that haven't been populated yet
  const placeholders = round === 6 ? 1 : round === 5 ? 2 : round === 4 ? 4 : round === 3 ? 8 : 16
  return (
    <div className={`grid gap-3 ${
      round === 6 ? 'grid-cols-1 max-w-xs mx-auto' :
      round === 5 ? 'grid-cols-1 sm:grid-cols-2 max-w-md mx-auto' :
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }`}>
      {Array.from({ length: placeholders }).map((_, i) => (
        <div key={i} className="bg-[#111113] border border-white/[0.04] rounded-xl p-4 opacity-40">
          <div className="h-2 w-16 bg-[#27272a] rounded mb-4" />
          <div className="space-y-3">
            <div className="h-4 w-32 bg-[#27272a] rounded" />
            <div className="h-4 w-28 bg-[#27272a] rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ScoresClient({
  initialGames,
  username,
}: {
  initialGames: Game[]
  username?: string
}) {
  const [games, setGames] = useState<Game[]>(initialGames)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('games-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games' },
        (payload) => {
          setGames(prev => {
            if (payload.eventType === 'UPDATE') {
              return prev.map(g => g.id === (payload.new as Game).id ? payload.new as Game : g)
            }
            if (payload.eventType === 'INSERT') {
              return [...prev, payload.new as Game]
            }
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Group by round
  const byRound = games.reduce<Record<number, Game[]>>((acc, g) => {
    const r = g.round
    if (!acc[r]) acc[r] = []
    acc[r].push(g)
    return acc
  }, {})

  const hasAnyGames = games.length > 0

  return (
    <div className="min-h-screen bg-[#09090b]">
      <AppNav username={username} />

      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16 sm:pt-24">

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-2xl font-black text-white">Live Scores</h1>
            {games.some(g => g.status === 'live') && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#d4a017]/10 border border-[#d4a017]/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
                <span className="text-[10px] font-bold text-[#d4a017] uppercase tracking-wider">Live Now</span>
              </div>
            )}
          </div>
          <p className="text-sm text-[#52525b]">
            2026 NCAA Women's Basketball Tournament · Updates automatically
          </p>
        </div>

        {!hasAnyGames ? (
          /* Pre-tournament state */
          <div className="space-y-12">
            {[1, 2, 3, 4, 5, 6].map(round => (
              <div key={round}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-white">{ROUND_LABELS[round]}</h2>
                    <p className="text-xs text-[#52525b] mt-0.5">{ROUND_DATES[round]}</p>
                  </div>
                  <span className="text-xs text-[#3f3f46] font-medium">Upcoming</span>
                </div>
                <EmptyRound round={round} />
              </div>
            ))}
          </div>
        ) : (
          /* Games populated */
          <div className="space-y-12">
            {[6, 5, 4, 3, 2, 1, 0].map(round => {
              const roundGames = byRound[round]
              if (!roundGames?.length) return null
              const liveCount = roundGames.filter(g => g.status === 'live').length
              return (
                <div key={round}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-bold text-white">{ROUND_LABELS[round]}</h2>
                      <p className="text-xs text-[#52525b] mt-0.5">{ROUND_DATES[round]}</p>
                    </div>
                    {liveCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a017] animate-pulse" />
                        <span className="text-xs font-semibold text-[#d4a017]">{liveCount} live</span>
                      </div>
                    )}
                  </div>
                  <div className={`grid gap-3 ${
                    round === 6 ? 'grid-cols-1 max-w-xs mx-auto' :
                    round === 5 ? 'grid-cols-1 sm:grid-cols-2 max-w-md mx-auto' :
                    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  }`}>
                    {roundGames.map(game => (
                      <GameCard key={game.id} game={game} username={username} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-[#3f3f46] mt-12">
          Scores update in real time · Tournament begins March 20
        </p>
      </div>
    </div>
  )
}
