'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  TEAMS, REGIONS, ROUND_NAMES, ROUND_POINTS,
  getRegionMatchups, pickKey, getTeam,
  type Region, type Team
} from '@/lib/tournament/data'

interface Props {
  userId: string
  username: string
  initialPicks: Record<string, number>
  isLocked: boolean
  isSubmitted: boolean
}

const REGION_COLORS: Record<Region, { primary: string; glow: string; badge: string }> = {
  'UConn':          { primary: '#0e4c96', glow: 'rgba(14,76,150,0.3)',   badge: 'bg-[#0e4c96]' },
  'UCLA':           { primary: '#2d68c4', glow: 'rgba(45,104,196,0.3)',  badge: 'bg-[#2d68c4]' },
  'Texas':          { primary: '#cc5500', glow: 'rgba(204,85,0,0.3)',    badge: 'bg-[#cc5500]' },
  'South Carolina': { primary: '#73000a', glow: 'rgba(115,0,10,0.3)',    badge: 'bg-[#73000a]' },
}

// Given picks, advance winners through rounds for display
function computeAdvancedTeams(picks: Record<string, number>): Record<string, Team | null> {
  const advanced: Record<string, Team | null> = {}

  REGIONS.forEach((region, ri) => {
    const matchups = getRegionMatchups(region)

    // Round 1 — 8 games
    matchups.forEach((_, gi) => {
      const key = pickKey(region, 1, gi)
      advanced[key] = picks[key] ? (getTeam(picks[key]) ?? null) : null
    })

    // Rounds 2-4 — per region
    for (let round = 2; round <= 4; round++) {
      const gamesInRound = 8 / Math.pow(2, round - 1)
      for (let gi = 0; gi < gamesInRound; gi++) {
        const key = pickKey(region, round, gi)
        advanced[key] = picks[key] ? (getTeam(picks[key]) ?? null) : null
      }
    }
  })

  // Final Four — 2 games
  for (let gi = 0; gi < 2; gi++) {
    const key = `FF_${gi}`
    advanced[key] = picks[key] ? (getTeam(picks[key]) ?? null) : null
  }

  // Championship
  const champKey = 'CHAMP'
  advanced[champKey] = picks[champKey] ? (getTeam(picks[champKey]) ?? null) : null

  return advanced
}

// Count how many picks are made
function countPicks(picks: Record<string, number>): number {
  return Object.keys(picks).filter(k => picks[k] > 0).length
}

export default function BracketPicker({ userId, username, initialPicks, isLocked, isSubmitted }: Props) {
  const [picks, setPicks] = useState<Record<string, number>>(initialPicks)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeRegion, setActiveRegion] = useState<Region>('UConn')

  const totalGames = 63 // 32 + 16 + 8 + 4 + 2 + 1

  const makePick = useCallback((key: string, teamId: number) => {
    if (isLocked) return
    setPicks(prev => {
      const next = { ...prev, [key]: teamId }
      // Clear downstream picks that depended on this slot
      // (simplified — advanced bracket logic would cascade here)
      return next
    })
    setSaved(false)
  }, [isLocked])

  async function saveBracket() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('brackets')
      .upsert({ user_id: userId, picks, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
  }

  async function submitBracket() {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('brackets')
      .upsert({
        user_id: userId,
        picks,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    window.location.reload()
  }

  const advanced = computeAdvancedTeams(picks)
  const pickCount = countPicks(picks)
  const matchups = getRegionMatchups(activeRegion)
  const regionIdx = REGIONS.indexOf(activeRegion)

  return (
    <div className="min-h-screen bg-[#09090b]">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span>🏀</span>
              <span className="font-black text-sm tracking-widest text-[#d4a017]">HER MADNESS</span>
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              <Link href="/scores" className="px-3 py-1.5 text-xs font-semibold text-[#71717a] rounded-lg hover:text-[#a1a1aa] transition-colors">Scores</Link>
              <Link href="/leaderboard" className="px-3 py-1.5 text-xs font-semibold text-[#71717a] rounded-lg hover:text-[#a1a1aa] transition-colors">Leaderboard</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#71717a]">
              {pickCount}/{totalGames} picks
            </span>
            {!isLocked && (
              <button
                onClick={saveBracket}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold border border-[#3f3f46] text-[#a1a1aa] rounded-lg hover:border-[#d4a017]/40 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save'}
              </button>
            )}
            {!isLocked && pickCount === totalGames && (
              <button
                onClick={submitBracket}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-bold bg-[#d4a017] text-[#09090b] rounded-lg hover:bg-[#f0c040] transition-colors disabled:opacity-50"
              >
                Submit Bracket
              </button>
            )}
            {isLocked && (
              <span className="px-3 py-1.5 text-xs font-semibold bg-[#7c3aed]/20 text-[#a855f7] rounded-lg border border-[#7c3aed]/20">
                🔒 Locked
              </span>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-14">

        {/* Header */}
        <div className="border-b border-[#27272a] bg-[#09090b] px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-black text-[#fafafa]">{username}&apos;s Bracket</h1>
                <p className="text-xs text-[#71717a] mt-0.5">
                  {isLocked ? 'Bracket locked — tournament has started' : 'Brackets lock Saturday, March 21'}
                </p>
              </div>
              {/* Progress bar */}
              <div className="text-right">
                <p className="text-xs text-[#71717a] mb-1">{Math.round((pickCount / totalGames) * 100)}% complete</p>
                <div className="w-32 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#d4a017] rounded-full transition-all duration-300"
                    style={{ width: `${(pickCount / totalGames) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Region tabs */}
            <div className="flex gap-1">
              {REGIONS.map((region) => (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeRegion === region
                      ? 'bg-[#d4a017] text-[#09090b]'
                      : 'text-[#71717a] hover:text-[#a1a1aa] border border-[#27272a] hover:border-[#3f3f46]'
                  }`}
                >
                  {region}
                </button>
              ))}
              <button
                onClick={() => setActiveRegion('UConn' as Region)}
                className="ml-auto px-3 py-1.5 text-xs font-semibold text-[#a855f7] border border-[#7c3aed]/30 rounded-lg hover:bg-[#7c3aed]/10 transition-all"
                style={{ display: 'none' }} // Show Final Four tab later
              >
                Final Four
              </button>
            </div>
          </div>
        </div>

        {/* Bracket content */}
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Region header */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-2 h-8 rounded-full"
              style={{ backgroundColor: REGION_COLORS[activeRegion].primary }}
            />
            <div>
              <h2 className="text-lg font-black text-[#fafafa]">{activeRegion} Region</h2>
              <p className="text-xs text-[#71717a]">Click a team to pick the winner</p>
            </div>
          </div>

          {/* Round 1 matchups */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-semibold text-[#71717a] uppercase tracking-widest">First Round</span>
              <span className="text-xs text-[#52525b]">· {ROUND_POINTS[1]} pts each</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {matchups.map(({ top, bottom, matchupIndex }) => {
                const key = pickKey(activeRegion, 1, matchupIndex)
                const pickedId = picks[key]
                return (
                  <MatchupCard
                    key={key}
                    top={top}
                    bottom={bottom}
                    pickedId={pickedId}
                    onPick={(teamId) => makePick(key, teamId)}
                    disabled={isLocked}
                    regionColor={REGION_COLORS[activeRegion].primary}
                  />
                )
              })}
            </div>
          </div>

          {/* Round 2 */}
          <RoundSection
            region={activeRegion}
            regionIdx={regionIdx}
            round={2}
            picks={picks}
            advanced={advanced}
            onPick={makePick}
            isLocked={isLocked}
            regionColor={REGION_COLORS[activeRegion].primary}
          />

          {/* Round 3 — Sweet 16 */}
          <RoundSection
            region={activeRegion}
            regionIdx={regionIdx}
            round={3}
            picks={picks}
            advanced={advanced}
            onPick={makePick}
            isLocked={isLocked}
            regionColor={REGION_COLORS[activeRegion].primary}
          />

          {/* Round 4 — Elite 8 */}
          <RoundSection
            region={activeRegion}
            regionIdx={regionIdx}
            round={4}
            picks={picks}
            advanced={advanced}
            onPick={makePick}
            isLocked={isLocked}
            regionColor={REGION_COLORS[activeRegion].primary}
          />
        </div>

        {/* Final Four section */}
        <FinalFourSection
          picks={picks}
          advanced={advanced}
          onPick={makePick}
          isLocked={isLocked}
        />
      </div>
    </div>
  )
}

// ——— Sub-components ———

function MatchupCard({
  top, bottom, pickedId, onPick, disabled, regionColor
}: {
  top: Team
  bottom: Team
  pickedId?: number
  onPick: (id: number) => void
  disabled: boolean
  regionColor: string
}) {
  if (!top || !bottom) return null

  return (
    <div className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden">
      {[top, bottom].map((team, i) => {
        const isPicked = pickedId === team.id
        return (
          <button
            key={team.id}
            onClick={() => !disabled && onPick(team.id)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left ${
              isPicked
                ? 'bg-[#1a1a0a]'
                : 'hover:bg-[#1e1e1e]'
            } ${i === 0 ? 'border-b border-[#27272a]' : ''} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            style={isPicked ? { borderLeft: `3px solid ${regionColor}` } : {}}
          >
            <span className={`text-xs font-bold w-5 text-center shrink-0 ${
              team.seed <= 4 ? 'text-[#d4a017]' : 'text-[#52525b]'
            }`}>
              {team.seed}
            </span>
            <span className={`text-sm font-medium truncate ${
              isPicked ? 'text-[#fafafa]' : 'text-[#a1a1aa]'
            }`}>
              {team.name}
              {team.isFirstFour && <span className="text-[#52525b] text-xs ml-1">(FF)</span>}
            </span>
            {isPicked && (
              <span className="ml-auto text-xs" style={{ color: regionColor }}>✓</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function RoundSection({
  region, regionIdx, round, picks, advanced, onPick, isLocked, regionColor
}: {
  region: Region
  regionIdx: number
  round: number
  picks: Record<string, number>
  advanced: Record<string, Team | null>
  onPick: (key: string, id: number) => void
  isLocked: boolean
  regionColor: string
}) {
  const prevRound = round - 1
  const gamesInRound = 8 / Math.pow(2, round - 1)
  const games: Array<{ key: string; top: Team | null; bottom: Team | null }> = []

  for (let gi = 0; gi < gamesInRound; gi++) {
    const topPrevGame = gi * 2
    const bottomPrevGame = gi * 2 + 1
    const topKey = pickKey(region, prevRound, topPrevGame)
    const bottomKey = pickKey(region, prevRound, bottomPrevGame)
    const key = pickKey(region, round, gi)

    games.push({
      key,
      top: advanced[topKey] ?? null,
      bottom: advanced[bottomKey] ?? null,
    })
  }

  const hasAnyTeams = games.some(g => g.top || g.bottom)
  if (!hasAnyTeams) return null

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-[#71717a] uppercase tracking-widest">{ROUND_NAMES[round]}</span>
        <span className="text-xs text-[#52525b]">· {ROUND_POINTS[round]} pts each</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {games.map(({ key, top, bottom }) => {
          const pickedId = picks[key]
          if (!top && !bottom) {
            return (
              <div key={key} className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 opacity-30">
                <p className="text-xs text-[#52525b] text-center">Make Round {prevRound} picks first</p>
              </div>
            )
          }
          if (!top || !bottom) {
            const only = top ?? bottom!
            return (
              <div key={key} className="bg-[#18181b] border border-[#27272a] rounded-xl overflow-hidden opacity-60">
                <div className="px-3 py-2.5 flex items-center gap-3">
                  <span className="text-xs font-bold w-5 text-center text-[#52525b]">{only.seed}</span>
                  <span className="text-sm text-[#71717a]">{only.name}</span>
                  <span className="ml-auto text-xs text-[#52525b]">TBD</span>
                </div>
              </div>
            )
          }
          return (
            <MatchupCard
              key={key}
              top={top}
              bottom={bottom}
              pickedId={pickedId}
              onPick={(teamId) => onPick(key, teamId)}
              disabled={isLocked}
              regionColor={regionColor}
            />
          )
        })}
      </div>
    </div>
  )
}

function FinalFourSection({
  picks, advanced, onPick, isLocked
}: {
  picks: Record<string, number>
  advanced: Record<string, Team | null>
  onPick: (key: string, id: number) => void
  isLocked: boolean
}) {
  // Elite Eight winners from each region
  const eliteEightWinners = REGIONS.map((region, ri) => {
    const key = pickKey(region, 4, 0)
    return advanced[key] ?? null
  })

  const hasFinalFourTeams = eliteEightWinners.some(t => t !== null)
  if (!hasFinalFourTeams) return null

  // Final Four matchups: Region 0 vs Region 3, Region 1 vs Region 2
  const ff0Top = eliteEightWinners[0]
  const ff0Bottom = eliteEightWinners[3]
  const ff1Top = eliteEightWinners[1]
  const ff1Bottom = eliteEightWinners[2]

  const ff0Key = 'FF_0'
  const ff1Key = 'FF_1'
  const champKey = 'CHAMP'

  const champTop = picks[ff0Key] ? getTeam(picks[ff0Key]) : null
  const champBottom = picks[ff1Key] ? getTeam(picks[ff1Key]) : null

  return (
    <div className="border-t border-[#27272a] bg-[#18181b]/50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-2 h-8 rounded-full bg-[#a855f7]" />
          <div>
            <h2 className="text-lg font-black text-[#fafafa]">Final Four + Championship</h2>
            <p className="text-xs text-[#71717a]">Phoenix · Mortgage Matchup Center</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Final Four Game 1 */}
          <div>
            <p className="text-xs text-[#71717a] uppercase tracking-widest mb-3">Semi 1 · {ROUND_POINTS[5]} pts</p>
            {ff0Top && ff0Bottom ? (
              <MatchupCard
                top={ff0Top}
                bottom={ff0Bottom}
                pickedId={picks[ff0Key]}
                onPick={(id) => onPick(ff0Key, id)}
                disabled={isLocked}
                regionColor="#a855f7"
              />
            ) : (
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 opacity-40">
                <p className="text-xs text-[#52525b] text-center">Complete regions first</p>
              </div>
            )}
          </div>

          {/* Championship */}
          <div>
            <p className="text-xs text-[#d4a017] uppercase tracking-widest mb-3 font-bold">🏆 Champion · {ROUND_POINTS[6]} pts</p>
            {champTop && champBottom ? (
              <MatchupCard
                top={champTop}
                bottom={champBottom}
                pickedId={picks[champKey]}
                onPick={(id) => onPick(champKey, id)}
                disabled={isLocked}
                regionColor="#d4a017"
              />
            ) : (
              <div className="bg-[#18181b] border border-[#7c3aed]/20 rounded-xl p-6 text-center"
                style={{ boxShadow: '0 0 30px rgba(212,160,23,0.05)' }}
              >
                <p className="text-2xl mb-2">🏆</p>
                <p className="text-xs text-[#52525b]">Your champion will appear here</p>
              </div>
            )}
          </div>

          {/* Final Four Game 2 */}
          <div>
            <p className="text-xs text-[#71717a] uppercase tracking-widest mb-3">Semi 2 · {ROUND_POINTS[5]} pts</p>
            {ff1Top && ff1Bottom ? (
              <MatchupCard
                top={ff1Top}
                bottom={ff1Bottom}
                pickedId={picks[ff1Key]}
                onPick={(id) => onPick(ff1Key, id)}
                disabled={isLocked}
                regionColor="#a855f7"
              />
            ) : (
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 opacity-40">
                <p className="text-xs text-[#52525b] text-center">Complete regions first</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
