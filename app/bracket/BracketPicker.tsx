'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'
import {
  REGIONS, ROUND_POINTS, FIRST_FOUR, getRegionMatchups, getFirstFourGame,
  getMatchupWinProb, pickKey, getTeam, ESPNIDS,
  type Region, type Team, type FirstFourGame
} from '@/lib/tournament/data'

// ── Layout constants ──────────────────────────────────────────────────
const CARD_H     = 60
const CARD_W     = 152
const CONN_W     = 12
const REGION_H   = 608
const REGION_GAP = 16

type Dir = 'ltr' | 'rtl'

function gameTopPx(round: number, gi: number): number {
  const span = REGION_H / (8 >> (round - 1))
  return Math.round(gi * span + (span - CARD_H) / 2)
}

const REGION_LABELS: Record<Region, string> = {
  'UConn':          'Fort Worth',
  'UCLA':           'Sacramento',
  'Texas':          'Fort Worth',
  'South Carolina': 'Sacramento',
}

const ROUND_LABELS: Record<number, string> = {
  1: 'First Round',
  2: 'Round of 32',
  3: 'Sweet 16',
  4: 'Elite Eight',
}

const ROUND_DATES: Record<number, string> = {
  1: 'Mar 20–21',
  2: 'Mar 22–23',
  3: 'Mar 28–29',
  4: 'Mar 30–31',
}

const MOBILE_TABS: Array<{ key: Region | 'ff'; label: string }> = [
  { key: 'UConn',          label: 'UConn' },
  { key: 'UCLA',           label: 'UCLA' },
  { key: 'Texas',          label: 'Texas' },
  { key: 'South Carolina', label: 'S. Car.' },
  { key: 'ff',             label: '🏆 FF' },
]

// ── ESPN logo component ───────────────────────────────────────────────
function TeamLogo({ team }: { team: Team }) {
  const espnId = ESPNIDS[team.id]
  const [err, setErr] = useState(false)

  if (espnId && !err) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
        alt={team.abbreviation}
        width={18}
        height={18}
        className="w-[18px] h-[18px] object-contain shrink-0"
        onError={() => setErr(true)}
      />
    )
  }

  // Fallback: dark circle with initials
  return (
    <div className="w-[18px] h-[18px] rounded-full bg-[#1a1a2e] flex items-center justify-center shrink-0">
      <span className="text-[6px] font-black text-white leading-none">{team.abbreviation.slice(0, 2)}</span>
    </div>
  )
}

// ── Props ─────────────────────────────────────────────────────────────
interface Props {
  userId:        string
  username:      string
  initialPicks:  Record<string, number>
  isLocked:      boolean
  isSubmitted:   boolean
  pickStats:     Record<string, Record<number, number>>
  totalBrackets: number
}

// ── Main component ────────────────────────────────────────────────────
export default function BracketPicker({
  userId, username, initialPicks, isLocked, isSubmitted, pickStats, totalBrackets
}: Props) {
  const [picks, setPicks]           = useState<Record<string, number>>(initialPicks)
  const [saveState, setSaveState]   = useState<'idle' | 'saving' | 'saved'>('idle')
  const [confirmSubmit, setConfirm] = useState(false)
  const [confirmReset, setReset]    = useState(false)
  const [mobileTab, setMobileTab]   = useState<Region | 'ff'>('UConn')
  const saveTimer   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const mountedRef  = useRef(false)

  const readOnly          = isLocked || isSubmitted
  const bracketPickCount  = Object.entries(picks).filter(([k, v]) => v && !k.startsWith('FF')).length
  const totalGames        = 63
  const showStats         = totalBrackets >= 3

  // ── Auto-save (1.5 s debounce) ───────────────────────────────────────
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    if (readOnly) return
    clearTimeout(saveTimer.current)
    setSaveState('saving')
    saveTimer.current = setTimeout(async () => {
      try {
        const supabase = createClient()
        await supabase.from('brackets').upsert(
          { user_id: userId, picks, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' }
        )
        setSaveState('saved')
        setTimeout(() => setSaveState('idle'), 2000)
      } catch { setSaveState('idle') }
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [picks]) // eslint-disable-line react-hooks/exhaustive-deps

  const makePick = useCallback((key: string, teamId: number) => {
    if (readOnly) return
    setPicks(prev => {
      const next = { ...prev, [key]: teamId }
      const ff4 = FIRST_FOUR.find(f => f.key === key)
      if (ff4) {
        const ri = REGIONS.indexOf(ff4.region)
        const SEEDS = [[1,16],[8,9],[5,12],[4,13],[6,11],[3,14],[7,10],[2,15]]
        const gi = SEEDS.findIndex(([t, b]) => t === ff4.seed || b === ff4.seed)
        if (gi !== -1) {
          const r1key = `R${ri}_1_${gi}`
          if (next[r1key] === ff4.topTeamId || next[r1key] === ff4.bottomTeamId) delete next[r1key]
        }
      }
      return next
    })
  }, [readOnly])

  async function submitBracket() {
    setConfirm(false)
    setSaveState('saving')
    const supabase = createClient()
    await supabase.from('brackets').upsert({
      user_id: userId, picks,
      submitted_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaveState('idle')
    window.location.reload()
  }

  async function resetBracket() {
    setReset(false)
    setPicks({})
    setSaveState('saving')
    const supabase = createClient()
    await supabase.from('brackets').upsert(
      { user_id: userId, picks: {}, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setSaveState('saved')
    setTimeout(() => setSaveState('idle'), 1500)
  }

  // ── Build advanced + ff4 winner maps ─────────────────────────────────
  const advanced: Record<string, Team | null> = {}
  REGIONS.forEach(region => {
    for (let r = 1; r <= 4; r++) {
      for (let gi = 0; gi < (8 >> (r - 1)); gi++) {
        const k = pickKey(region, r, gi)
        advanced[k] = picks[k] ? (getTeam(picks[k]) ?? null) : null
      }
    }
  })
  advanced['FF_0']  = picks['FF_0']  ? (getTeam(picks['FF_0'])  ?? null) : null
  advanced['FF_1']  = picks['FF_1']  ? (getTeam(picks['FF_1'])  ?? null) : null
  advanced['CHAMP'] = picks['CHAMP'] ? (getTeam(picks['CHAMP']) ?? null) : null

  const ff4Winners: Record<string, Team | null> = {}
  FIRST_FOUR.forEach(({ key }) => { ff4Winners[key] = picks[key] ? (getTeam(picks[key]) ?? null) : null })

  const e8Winners   = REGIONS.map(r => advanced[pickKey(r, 4, 0)])
  const champTop    = advanced['FF_0']
  const champBottom = advanced['FF_1']
  const totalH      = REGION_H * 2 + REGION_GAP

  const sharedRegionProps = { picks, advanced, ff4Winners, onPick: makePick, readOnly, pickStats, showStats }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppNav username={username} />

      {/* ── Confirm submit modal ── */}
      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <p className="text-base font-black text-white mb-1">Submit your bracket?</p>
            <p className="text-sm text-white/50 mb-5">
              This is final — you only get one submission. No changes after this.
            </p>
            <div className="flex gap-2">
              <button onClick={submitBracket}
                className="flex-1 py-2.5 text-sm font-bold bg-[#d4a017] text-black rounded-xl hover:bg-[#f0c040] transition-colors">
                Yes, Submit
              </button>
              <button onClick={() => setConfirm(false)}
                className="px-5 py-2.5 text-sm font-semibold border border-white/15 text-white/60 rounded-xl hover:border-white/30 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm reset modal ── */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="bg-[#111113] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <p className="text-base font-black text-white mb-1">Reset your bracket?</p>
            <p className="text-sm text-white/50 mb-5">
              This clears all your picks. You can start over before the Friday lock.
            </p>
            <div className="flex gap-2">
              <button onClick={resetBracket}
                className="flex-1 py-2.5 text-sm font-bold bg-red-500/80 text-white rounded-xl hover:bg-red-500 transition-colors">
                Yes, Reset
              </button>
              <button onClick={() => setReset(false)}
                className="px-5 py-2.5 text-sm font-semibold border border-white/15 text-white/60 rounded-xl hover:border-white/30 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky sub-header ── */}
      <div className="pt-14 border-b border-white/[0.07] px-4 py-3 bg-[#0a0a0a] sticky top-14 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-black text-white">{username}&apos;s Bracket</h1>
            <p className="text-[11px] text-white/30">
              {isLocked ? '🔒 Locked — tournament underway'
                : isSubmitted ? '✓ Submitted — good luck!'
                : 'Locks Friday, March 20 at 11:00 AM ET'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <span className={`text-[10px] transition-colors ${
                saveState === 'saving' ? 'text-white/30' :
                saveState === 'saved'  ? 'text-[#22c55e]' : 'text-transparent'
              }`}>
                {saveState === 'saving' ? 'Saving…' : '✓ Saved'}
              </span>
            )}
            {!isSubmitted && (
              <div className="flex items-center gap-1.5">
                <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-[#d4a017] rounded-full transition-all"
                    style={{ width: `${(bracketPickCount / totalGames) * 100}%` }} />
                </div>
                <span className="text-[10px] text-white/30 tabular-nums">{bracketPickCount}/{totalGames}</span>
              </div>
            )}
            {isSubmitted && (
              <span className="px-2 py-1 text-xs font-bold text-[#22c55e] border border-[#22c55e]/30 rounded-lg">✓ Submitted</span>
            )}
            {isLocked && !isSubmitted && (
              <span className="px-2 py-1 text-xs font-semibold text-[#a855f7] border border-[#7c3aed]/30 rounded-lg">🔒 Locked</span>
            )}
            {!readOnly && bracketPickCount > 0 && (
              <button onClick={() => setReset(true)}
                className="px-3 py-1.5 text-xs text-white/25 hover:text-white/50 transition-colors">
                Reset
              </button>
            )}
            {!isSubmitted && !isLocked && bracketPickCount === totalGames && (
              <button onClick={() => setConfirm(true)}
                className="px-3 py-1.5 text-xs font-bold bg-[#d4a017] text-black rounded-lg hover:bg-[#f0c040] transition-colors">
                Submit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── First Four strip ── */}
      <div className="border-b border-white/[0.05] px-4 py-3">
        <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mb-2">
          First Four · Play-In · March 18–19 · Winners advance to Round 1
        </p>
        <div className="flex flex-wrap gap-2">
          {FIRST_FOUR.map(ff => (
            <FirstFourCard key={ff.key} game={ff}
              pickedId={picks[ff.key]}
              onPick={(id) => makePick(ff.key, id)}
              disabled={readOnly}
              pickStats={pickStats[ff.key]}
              totalBrackets={totalBrackets}
              showStats={showStats}
            />
          ))}
        </div>
      </div>

      {/* ── Mobile region tabs (hidden on sm+) ── */}
      <div className="flex sm:hidden border-b border-white/[0.07] bg-[#0a0a0a] sticky top-[calc(3.5rem+4.5rem)] z-10 px-2 gap-1 pt-1">
        {MOBILE_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 pb-2 pt-1 text-[10px] font-bold transition-colors border-b-2 ${
              mobileTab === tab.key
                ? 'text-[#d4a017] border-[#d4a017]'
                : 'text-white/30 border-transparent hover:text-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main bracket scroll ── */}
      <div className="overflow-x-auto pb-12 pt-4">
        <div className="flex items-start px-6"
          style={{ minWidth: (CARD_W + CONN_W) * 4 * 2 + 200 + 48 }}>

          {/* Left side: UConn + South Carolina */}
          <div className="flex flex-col shrink-0" style={{ gap: REGION_GAP }}>
            {(['UConn', 'South Carolina'] as Region[]).map(r => (
              <div key={r} className={mobileTab !== r ? 'hidden sm:block' : ''}>
                <RegionBlock region={r} dir="ltr" {...sharedRegionProps} />
              </div>
            ))}
          </div>

          {/* Center: Final Four + Championship */}
          <div
            className={`shrink-0 relative ${mobileTab !== 'ff' ? 'hidden sm:block' : ''}`}
            style={{ width: 200, height: totalH + 32 }}
          >
            <div style={{ height: 32 }} />
            <div className="relative" style={{ height: totalH }}>
              <svg width={200} height={totalH} className="absolute inset-0 pointer-events-none">
                {[REGION_H / 2, REGION_H + REGION_GAP + REGION_H / 2].map((y, i) => (
                  <g key={i}>
                    <line x1={0}   y1={y} x2={16}  y2={y} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
                    <line x1={200} y1={y} x2={184} y2={y} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
                    <line x1={100} y1={y} x2={100} y2={totalH / 2 + (i === 0 ? -CARD_H / 2 : CARD_H / 2)}
                      stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
                  </g>
                ))}
              </svg>

              <CenterCard y={REGION_H / 2} label={`Final Four · ${ROUND_POINTS[5]}pts`}
                date="Apr 4"
                top={e8Winners[0]} bottom={e8Winners[1]}
                pickedId={picks['FF_0']} onPick={(id) => makePick('FF_0', id)} disabled={readOnly}
                pickStats={pickStats['FF_0']} showStats={showStats} />

              <CenterCard y={totalH / 2 - 10} label={`🏆 Championship · ${ROUND_POINTS[6]}pts`} isChamp
                date="Apr 6"
                top={champTop} bottom={champBottom}
                pickedId={picks['CHAMP']} onPick={(id) => makePick('CHAMP', id)} disabled={readOnly}
                pickStats={pickStats['CHAMP']} showStats={showStats} />

              <CenterCard y={REGION_H + REGION_GAP + REGION_H / 2} label={`Final Four · ${ROUND_POINTS[5]}pts`}
                date="Apr 4"
                top={e8Winners[2]} bottom={e8Winners[3]}
                pickedId={picks['FF_1']} onPick={(id) => makePick('FF_1', id)} disabled={readOnly}
                pickStats={pickStats['FF_1']} showStats={showStats} />
            </div>
          </div>

          {/* Right side: UCLA + Texas (mirrored) */}
          <div className="flex flex-col shrink-0" style={{ gap: REGION_GAP }}>
            {(['UCLA', 'Texas'] as Region[]).map(r => (
              <div key={r} className={mobileTab !== r ? 'hidden sm:block' : ''}>
                <RegionBlock region={r} dir="rtl" {...sharedRegionProps} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Center card (Final Four / Championship) ───────────────────────────
function CenterCard({ y, label, date, top, bottom, pickedId, onPick, disabled, isChamp, pickStats, showStats }: {
  y: number; label: string; date: string; top: Team | null; bottom: Team | null
  pickedId?: number; onPick: (id: number) => void; disabled: boolean
  isChamp?: boolean; pickStats?: Record<number, number>; showStats: boolean
}) {
  const slotTotal = Object.values(pickStats ?? {}).reduce((a, b) => a + b, 0)

  return (
    <div className="absolute left-0 right-0 px-3" style={{ top: y - CARD_H / 2 }}>
      <div className={`text-center mb-1 ${isChamp ? 'text-[#d4a017] font-bold' : 'text-white/25'}`}>
        <p className="text-[8px] uppercase tracking-widest leading-none">{label}</p>
        <p className="text-[7px] mt-0.5 opacity-60">{date}</p>
      </div>
      {(!top && !bottom) ? (
        <div
          className={`rounded-xl flex items-center justify-center border ${isChamp ? 'border-[#d4a017]/20 bg-[#d4a017]/5' : 'border-white/[0.07] bg-[#111113]'}`}
          style={{ height: CARD_H }}
        >
          {isChamp ? <span className="text-xl">🏆</span> : <span className="text-[9px] text-white/20 px-2 text-center">Complete regions first</span>}
        </div>
      ) : (
        <div className={`rounded-xl overflow-hidden border shadow-lg ${isChamp ? 'border-[#d4a017]/40' : 'border-gray-200'} bg-white`}>
          {top    ? <TeamRow team={top}    picked={pickedId === top.id}    onPick={onPick} disabled={disabled}
            pickPct={showStats && slotTotal > 0 ? Math.round((pickStats?.[top.id] ?? 0) / slotTotal * 100) : undefined} /> : <EmptyRow />}
          <div className="h-px bg-gray-100" />
          {bottom ? <TeamRow team={bottom} picked={pickedId === bottom.id} onPick={onPick} disabled={disabled}
            pickPct={showStats && slotTotal > 0 ? Math.round((pickStats?.[bottom.id] ?? 0) / slotTotal * 100) : undefined} /> : <EmptyRow />}
        </div>
      )}
    </div>
  )
}

// ── First Four card ───────────────────────────────────────────────────
function FirstFourCard({ game, pickedId, onPick, disabled, pickStats, totalBrackets, showStats }: {
  game: FirstFourGame; pickedId?: number; onPick: (id: number) => void; disabled: boolean
  pickStats?: Record<number, number>; totalBrackets: number; showStats: boolean
}) {
  const top = getTeam(game.topTeamId)!
  const bot = getTeam(game.bottomTeamId)!
  const slotTotal = Object.values(pickStats ?? {}).reduce((a, b) => a + b, 0)
  const winProb = getMatchupWinProb(top.seed, bot.seed)

  return (
    <div style={{ width: CARD_W }}>
      <p className="text-[8px] text-white/20 text-center mb-0.5 truncate">
        {top.abbreviation} vs {bot.abbreviation}
      </p>
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <TeamRow team={top} picked={pickedId === top.id} onPick={onPick} disabled={disabled}
          winProb={winProb}
          pickPct={showStats && slotTotal > 0 ? Math.round((pickStats?.[top.id] ?? 0) / slotTotal * 100) : undefined} />
        <div className="h-px bg-gray-100" />
        <TeamRow team={bot} picked={pickedId === bot.id} onPick={onPick} disabled={disabled}
          winProb={100 - winProb}
          pickPct={showStats && slotTotal > 0 ? Math.round((pickStats?.[bot.id] ?? 0) / slotTotal * 100) : undefined} />
      </div>
    </div>
  )
}

// ── Region block ──────────────────────────────────────────────────────
function RegionBlock({ region, dir, picks, advanced, ff4Winners, onPick, readOnly, pickStats, showStats }: {
  region: Region; dir: Dir; picks: Record<string, number>
  advanced: Record<string, Team | null>; ff4Winners: Record<string, Team | null>
  onPick: (key: string, id: number) => void; readOnly: boolean
  pickStats: Record<string, Record<number, number>>; showStats: boolean
}) {
  const matchups   = getRegionMatchups(region)
  const roundOrder = dir === 'ltr' ? [1, 2, 3, 4] : [4, 3, 2, 1]

  return (
    <div className="shrink-0">
      <div className={`flex items-center gap-2 mb-1 h-7 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div className="w-1 h-3.5 rounded-full bg-[#d4a017] shrink-0" />
        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
          {region} Region · {REGION_LABELS[region]}
        </span>
      </div>
      <div className="flex items-start">
        {roundOrder.map((round, colIdx) => {
          const isLastCol    = colIdx === roundOrder.length - 1
          const nextRound    = roundOrder[colIdx + 1]
          const connSource   = dir === 'ltr' ? round : (nextRound ?? round)
          const gamesInRound = 8 >> (round - 1)

          return (
            <div key={round} className="flex items-start shrink-0">
              <div className="shrink-0" style={{ width: CARD_W }}>
                {/* Column header with round name + date */}
                <div className="h-8 flex flex-col items-center justify-center mb-1">
                  <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wider leading-none">
                    {ROUND_LABELS[round]}
                  </span>
                  <span className="text-[7px] text-white/15 mt-0.5">{ROUND_DATES[round]}</span>
                </div>
                <div className="relative" style={{ height: REGION_H }}>
                  {Array.from({ length: gamesInRound }, (_, gi) => {
                    const top = gameTopPx(round, gi)
                    const key = pickKey(region, round, gi)
                    const slotStats = pickStats[key] ?? {}
                    const slotTotal = Object.values(slotStats).reduce((a, b) => a + b, 0)

                    if (round === 1) {
                      const m = matchups[gi]
                      const ff4T = m.top.isFirstFour    ? getFirstFourGame(region, m.top.seed)    : null
                      const ff4B = m.bottom.isFirstFour ? getFirstFourGame(region, m.bottom.seed) : null
                      const topTeam = ff4T ? (ff4Winners[ff4T.key] ?? null) : m.top
                      const botTeam = ff4B ? (ff4Winners[ff4B.key] ?? null) : m.bottom
                      const winProb = topTeam && botTeam ? getMatchupWinProb(topTeam.seed, botTeam.seed) : null

                      return (
                        <div key={gi} className="absolute inset-x-0" style={{ top }}>
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            {topTeam
                              ? <TeamRow team={topTeam} picked={picks[key] === topTeam.id} onPick={(id) => onPick(key, id)} disabled={readOnly}
                                  winProb={winProb ?? undefined}
                                  pickPct={showStats && slotTotal > 0 ? Math.round((slotStats[topTeam.id] ?? 0) / slotTotal * 100) : undefined} />
                              : <FFPendingRow label="Pick First Four ↑" />}
                            <div className="h-px bg-gray-100" />
                            {botTeam
                              ? <TeamRow team={botTeam} picked={picks[key] === botTeam.id} onPick={(id) => onPick(key, id)} disabled={readOnly}
                                  winProb={winProb != null ? 100 - winProb : undefined}
                                  pickPct={showStats && slotTotal > 0 ? Math.round((slotStats[botTeam.id] ?? 0) / slotTotal * 100) : undefined} />
                              : <FFPendingRow label={ff4B ? 'Pick First Four ↑' : 'TBD'} />}
                          </div>
                          {showStats && slotTotal > 0 && topTeam && botTeam && (
                            <PickBar topId={topTeam.id} slotStats={slotStats} slotTotal={slotTotal} />
                          )}
                        </div>
                      )
                    }

                    // Rounds 2–4
                    const topKey  = pickKey(region, round - 1, gi * 2)
                    const botKey  = pickKey(region, round - 1, gi * 2 + 1)
                    const topTeam = advanced[topKey] ?? null
                    const botTeam = advanced[botKey] ?? null
                    const winProb = topTeam && botTeam ? getMatchupWinProb(topTeam.seed, botTeam.seed) : null

                    return (
                      <div key={gi} className="absolute inset-x-0" style={{ top }}>
                        {!topTeam && !botTeam ? (
                          <div className="border border-white/[0.06] rounded-xl flex items-center justify-center opacity-30"
                            style={{ height: CARD_H, background: '#111113' }}>
                            <span className="text-[8px] text-white/30 uppercase tracking-wider">R{round - 1} picks</span>
                          </div>
                        ) : (
                          <>
                            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                              {topTeam
                                ? <TeamRow team={topTeam} picked={picks[key] === topTeam.id} onPick={(id) => onPick(key, id)} disabled={readOnly}
                                    winProb={winProb ?? undefined}
                                    pickPct={showStats && slotTotal > 0 ? Math.round((slotStats[topTeam.id] ?? 0) / slotTotal * 100) : undefined} />
                                : <EmptyRow />}
                              <div className="h-px bg-gray-100" />
                              {botTeam
                                ? <TeamRow team={botTeam} picked={picks[key] === botTeam.id} onPick={(id) => onPick(key, id)} disabled={readOnly}
                                    winProb={winProb != null ? 100 - winProb : undefined}
                                    pickPct={showStats && slotTotal > 0 ? Math.round((slotStats[botTeam.id] ?? 0) / slotTotal * 100) : undefined} />
                                : <EmptyRow />}
                            </div>
                            {showStats && slotTotal > 0 && topTeam && botTeam && (
                              <PickBar topId={topTeam.id} slotStats={slotStats} slotTotal={slotTotal} />
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
              {!isLastCol && (
                <div className="shrink-0 mt-9" style={{ width: CONN_W, height: REGION_H }}>
                  <BracketConnectors sourceRound={connSource} dir={dir} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Pick split bar ────────────────────────────────────────────────────
function PickBar({ topId, slotStats, slotTotal }: {
  topId: number; slotStats: Record<number, number>; slotTotal: number
}) {
  const topPct = Math.round((slotStats[topId] ?? 0) / slotTotal * 100)
  return (
    <div className="flex mt-1 h-0.5 rounded-full overflow-hidden mx-0.5">
      <div className="bg-[#d4a017]/50 transition-all" style={{ width: `${topPct}%` }} />
      <div className="bg-white/10 flex-1" />
    </div>
  )
}

// ── SVG bracket connectors ────────────────────────────────────────────
function BracketConnectors({ sourceRound, dir }: { sourceRound: number; dir: Dir }) {
  const n     = 8 >> (sourceRound - 1)
  const srcX  = dir === 'ltr' ? 0      : CONN_W
  const destX = dir === 'ltr' ? CONN_W : 0
  const pivX  = CONN_W / 2
  const s     = 'rgba(255,255,255,0.45)'

  return (
    <svg width={CONN_W} height={REGION_H} className="overflow-visible">
      {Array.from({ length: n }, (_, i) => i).filter((_, i) => i % 2 === 0).map(gi => {
        const t = gameTopPx(sourceRound, gi)     + CARD_H / 2
        const b = gameTopPx(sourceRound, gi + 1) + CARD_H / 2
        const m = (t + b) / 2
        return (
          <g key={gi}>
            <line x1={srcX} y1={t} x2={pivX} y2={t} stroke={s} strokeWidth={1.5} />
            <line x1={srcX} y1={b} x2={pivX} y2={b} stroke={s} strokeWidth={1.5} />
            <line x1={pivX} y1={t} x2={pivX} y2={b} stroke={s} strokeWidth={1.5} />
            <line x1={pivX} y1={m} x2={destX} y2={m} stroke={s} strokeWidth={1.5} />
          </g>
        )
      })}
    </svg>
  )
}

// ── Team row (white card) ─────────────────────────────────────────────
function TeamRow({ team, picked, onPick, disabled, winProb, pickPct }: {
  team: Team; picked: boolean; onPick: (id: number) => void; disabled: boolean
  winProb?: number; pickPct?: number
}) {
  const rowH = (CARD_H - 1) / 2

  return (
    <button
      onClick={() => !disabled && onPick(team.id)}
      disabled={disabled}
      className={`relative w-full flex items-center gap-1.5 px-2 overflow-hidden transition-all text-left
        ${picked ? 'bg-[#fef3c7]' : 'bg-white hover:bg-gray-50'}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      style={{ height: rowH }}
    >
      {/* Win probability background fill */}
      {winProb != null && !picked && (
        <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-50 to-transparent pointer-events-none"
          style={{ width: `${winProb}%` }} />
      )}

      {/* Logo */}
      <div className="z-10 shrink-0">
        <TeamLogo team={team} />
      </div>

      {/* Seed */}
      <span className={`text-[9px] font-bold w-4 shrink-0 text-right z-10
        ${picked ? 'text-amber-700' : team.seed <= 3 ? 'text-[#d4a017]' : 'text-gray-400'}`}>
        {team.seed}
      </span>

      {/* Name */}
      <span className={`text-[10px] truncate flex-1 z-10 leading-none font-medium
        ${picked ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
        {team.abbreviation}
        {team.isFirstFour && <span className="text-gray-400 text-[7px] ml-0.5">FF</span>}
      </span>

      {/* Stats */}
      <span className="flex items-center gap-1 z-10 shrink-0">
        {winProb != null && (
          <span className="text-[8px] text-gray-400 tabular-nums">{winProb}%</span>
        )}
        {pickPct != null && (
          <span className="text-[8px] text-gray-400 tabular-nums">{pickPct}%↑</span>
        )}
        {picked && <span className="text-[#d4a017] text-[10px]">✓</span>}
      </span>
    </button>
  )
}

function EmptyRow() {
  return (
    <div className="flex items-center px-2 bg-white" style={{ height: (CARD_H - 1) / 2 }}>
      <span className="text-[9px] text-gray-300">TBD</span>
    </div>
  )
}

function FFPendingRow({ label }: { label: string }) {
  return (
    <div className="flex items-center px-2 bg-white" style={{ height: (CARD_H - 1) / 2 }}>
      <span className="text-[8px] text-amber-400/70 italic truncate">{label}</span>
    </div>
  )
}
