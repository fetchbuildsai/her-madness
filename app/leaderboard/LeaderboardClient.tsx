'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'

interface BracketEntry {
  user_id: string
  score: number
  submitted_at: string | null
  picks: Record<string, number>
  profile: {
    username: string
    display_name: string | null
    favorite_team: string | null
  } | null
}

const MEDALS = ['🥇', '🥈', '🥉']

function pickCount(picks: Record<string, number>) {
  return Object.values(picks).filter(v => v > 0).length
}

export default function LeaderboardClient({
  initialEntries,
  currentUserId,
  username,
  totalSubmitted,
}: {
  initialEntries: BracketEntry[]
  currentUserId?: string
  username?: string
  totalSubmitted: number
}) {
  const [entries, setEntries] = useState<BracketEntry[]>(initialEntries)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('leaderboard-live')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'brackets' },
        async (payload) => {
          // Refresh leaderboard on any bracket score update
          const { data } = await supabase
            .from('brackets')
            .select('user_id, score, submitted_at, picks, profile:profiles(username, display_name, favorite_team)')
            .not('submitted_at', 'is', null)
            .order('score', { ascending: false })
            .order('submitted_at', { ascending: true })
          if (data) setEntries(data as unknown as BracketEntry[])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const tournamentStarted = entries.some(e => e.score > 0)
  const myRank = currentUserId
    ? entries.findIndex(e => e.user_id === currentUserId) + 1
    : 0

  return (
    <div className="min-h-screen bg-[#09090b]">
      <AppNav username={username} />

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-16 sm:pt-24">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-1">Leaderboard</h1>
          <p className="text-sm text-[#52525b]">
            {totalSubmitted} bracket{totalSubmitted !== 1 ? 's' : ''} submitted ·{' '}
            {tournamentStarted ? 'Scoring live' : 'Scoring begins March 20'}
          </p>
        </div>

        {/* Your rank banner (if logged in + submitted) */}
        {currentUserId && myRank > 0 && (
          <div className="bg-[#d4a017]/[0.06] border border-[#d4a017]/20 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#d4a017]/70 font-semibold uppercase tracking-wider mb-0.5">Your Rank</p>
              <p className="text-2xl font-black text-[#d4a017]">
                #{myRank} <span className="text-base font-semibold text-white">of {entries.length}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#52525b] font-medium mb-0.5">Points</p>
              <p className="text-2xl font-black text-white">
                {entries.find(e => e.user_id === currentUserId)?.score ?? 0}
              </p>
            </div>
          </div>
        )}

        {/* Pre-tournament state */}
        {!tournamentStarted && entries.length > 0 && (
          <div className="bg-[#111113] border border-white/[0.07] rounded-2xl px-5 py-4 mb-6">
            <p className="text-sm text-[#71717a] text-center">
              🏀 Scores update automatically once games start March 20
            </p>
          </div>
        )}

        {/* No brackets yet */}
        {entries.length === 0 && (
          <div className="bg-[#111113] border border-white/[0.07] rounded-2xl p-12 text-center">
            <p className="text-4xl mb-4">🏆</p>
            <p className="text-sm font-semibold text-[#a1a1aa] mb-1">No brackets submitted yet</p>
            <p className="text-xs text-[#52525b]">Be the first — brackets lock Thursday night</p>
          </div>
        )}

        {/* Leaderboard table */}
        {entries.length > 0 && (
          <div className="bg-[#111113] border border-white/[0.07] rounded-2xl overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[40px_1fr_80px_80px] gap-2 px-4 py-3 border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest text-center">#</span>
              <span className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest">Player</span>
              <span className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest text-right">Picks</span>
              <span className="text-[10px] font-semibold text-[#3f3f46] uppercase tracking-widest text-right">Points</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-white/[0.04]">
              {entries.map((entry, i) => {
                const rank = i + 1
                const isMe = entry.user_id === currentUserId
                const medal = MEDALS[i] ?? null
                const picks = pickCount(entry.picks)
                const isTop3 = rank <= 3 && tournamentStarted

                return (
                  <div
                    key={entry.user_id}
                    className={`grid grid-cols-[40px_1fr_80px_80px] gap-2 px-4 py-3.5 items-center transition-colors ${
                      isMe ? 'bg-[#d4a017]/[0.04]' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Rank */}
                    <div className="text-center">
                      {isTop3 && medal ? (
                        <span className="text-base">{medal}</span>
                      ) : (
                        <span className={`text-sm font-bold tabular-nums ${
                          isMe ? 'text-[#d4a017]' : 'text-[#52525b]'
                        }`}>
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Player */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-[#d4a017]/10 flex items-center justify-center text-xs font-black text-[#d4a017] shrink-0">
                        {(entry.profile?.username?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm font-semibold truncate ${
                            isMe ? 'text-[#d4a017]' : 'text-[#e4e4e7]'
                          }`}>
                            @{entry.profile?.username ?? 'Unknown'}
                          </span>
                          {isMe && (
                            <span className="text-[9px] font-bold text-[#d4a017]/60 uppercase tracking-widest shrink-0">You</span>
                          )}
                        </div>
                        {entry.profile?.favorite_team && (
                          <span className="text-[10px] text-[#3f3f46]">{entry.profile.favorite_team}</span>
                        )}
                      </div>
                    </div>

                    {/* Picks */}
                    <div className="text-right">
                      <span className="text-xs text-[#52525b] tabular-nums">{picks}/63</span>
                    </div>

                    {/* Score */}
                    <div className="text-right">
                      <span className={`text-sm font-black tabular-nums ${
                        isTop3 && tournamentStarted ? 'text-[#d4a017]' :
                        isMe ? 'text-white' : 'text-[#71717a]'
                      }`}>
                        {entry.score}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Scoring legend */}
        <div className="mt-8 bg-[#111113] border border-white/[0.07] rounded-2xl p-5">
          <h3 className="text-xs font-bold text-[#a1a1aa] mb-3 uppercase tracking-wider">Scoring</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[
              ['R1', '10'], ['R2', '20'], ['S16', '40'],
              ['E8', '80'], ['FF', '160'], ['Champ', '320'],
            ].map(([round, pts]) => (
              <div key={round} className="text-center">
                <div className="text-xs text-[#52525b] mb-0.5">{round}</div>
                <div className="text-sm font-black text-[#d4a017]">{pts}pts</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
