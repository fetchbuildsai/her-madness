'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'
import {
  REGIONS, ROUND_POINTS, getRegionMatchups, pickKey, getTeam,
  type Region, type Team
} from '@/lib/tournament/data'

// ── Layout constants ──────────────────────────────────────────────────
const CARD_H     = 56    // height of one matchup card (2 team rows + divider)
const CARD_W     = 144   // width of each round column
const CONN_W     = 12    // SVG connector width between columns
const REGION_H   = 576   // fixed height per region container (8 games × 72px)
const REGION_GAP = 16    // vertical gap between top + bottom regions on each side

type Dir = 'ltr' | 'rtl'

// Y offset of game gi within round r, inside REGION_H container
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

// ── Props ─────────────────────────────────────────────────────────────
interface Props {
  userId: string
  username: string
  initialPicks: Record<string, number>
  isLocked: boolean
  isSubmitted: boolean
}

// ── Main component ────────────────────────────────────────────────────
export default function BracketPicker({ userId, username, initialPicks, isLocked }: Props) {
  const [picks, setPicks]   = useState<Record<string, number>>(initialPicks)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  const totalGames = 63
  const pickCount  = Object.values(picks).filter(Boolean).length

  const makePick = useCallback((key: string, teamId: number) => {
    if (isLocked) return
    setPicks(prev => ({ ...prev, [key]: teamId }))
    setSaved(false)
  }, [isLocked])

  async function saveBracket() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('brackets').upsert(
      { user_id: userId, picks, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    setSaving(false)
    setSaved(true)
  }

  async function submitBracket() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('brackets').upsert({
      user_id: userId,
      picks,
      submitted_at: new Date().toISOString(),
      updated_at:   new Date().toISOString(),
    }, { onConflict: 'user_id' })
    setSaving(false)
    setSaved(true)
    window.location.reload()
  }

  // Build "advanced" map — which team holds each pick slot
  const advanced: Record<string, Team | null> = {}
  REGIONS.forEach(region => {
    getRegionMatchups(region).forEach((_, gi) => {
      const k = pickKey(region, 1, gi)
      advanced[k] = picks[k] ? (getTeam(picks[k]) ?? null) : null
    })
    for (let r = 2; r <= 4; r++) {
      for (let gi = 0; gi < (8 >> (r - 1)); gi++) {
        const k = pickKey(region, r, gi)
        advanced[k] = picks[k] ? (getTeam(picks[k]) ?? null) : null
      }
    }
  })
  for (let gi = 0; gi < 2; gi++) {
    const k = `FF_${gi}`
    advanced[k] = picks[k] ? (getTeam(picks[k]) ?? null) : null
  }
  advanced['CHAMP'] = picks['CHAMP'] ? (getTeam(picks['CHAMP']) ?? null) : null

  // E8 winners in region order: [UConn(0), UCLA(1), Texas(2), SC(3)]
  const e8Winners = REGIONS.map(r => advanced[pickKey(r, 4, 0)])

  // FF matchups: FF_0 = UConn vs UCLA, FF_1 = Texas vs SC
  const ff0Top    = e8Winners[0]  // UConn
  const ff0Bottom = e8Winners[1]  // UCLA
  const ff1Top    = e8Winners[2]  // Texas
  const ff1Bottom = e8Winners[3]  // South Carolina

  const champTop    = picks['FF_0'] ? (getTeam(picks['FF_0']) ?? null) : null
  const champBottom = picks['FF_1'] ? (getTeam(picks['FF_1']) ?? null) : null

  const totalH = REGION_H * 2 + REGION_GAP

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppNav username={username} />

      {/* ── Sub-header ── */}
      <div className="pt-14 border-b border-white/[0.07] px-4 py-3 bg-[#0a0a0a] sticky top-14 z-10">
        <div className="flex items-center justify-between max-w-none">
          <div>
            <h1 className="text-sm font-black text-white">{username}&apos;s Bracket</h1>
            <p className="text-[11px] text-white/30">
              {isLocked
                ? '🔒 Locked — tournament is underway'
                : 'Locks Friday, March 20 at 11:00 AM ET'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1">
              <div className="w-20 h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#d4a017] rounded-full transition-all"
                  style={{ width: `${(pickCount / totalGames) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-white/30 tabular-nums">{pickCount}/{totalGames}</span>
            </div>
            {!isLocked && (
              <button
                onClick={saveBracket}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-semibold border border-white/20 rounded-lg hover:border-[#d4a017]/60 transition-colors disabled:opacity-40"
              >
                {saving ? '…' : saved ? '✓ Saved' : 'Save'}
              </button>
            )}
            {!isLocked && pickCount === totalGames && (
              <button
                onClick={submitBracket}
                disabled={saving}
                className="px-3 py-1.5 text-xs font-bold bg-[#d4a017] text-black rounded-lg hover:bg-[#f0c040] transition-colors disabled:opacity-40"
              >
                Submit
              </button>
            )}
            {isLocked && (
              <span className="px-2 py-1 text-xs font-semibold text-[#a855f7] border border-[#7c3aed]/30 rounded-lg">
                🔒 Locked
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Bracket scroll area ── */}
      <div className="overflow-x-auto pb-12 pt-4">
        <div
          className="flex items-start px-6"
          style={{ minWidth: (CARD_W + CONN_W) * 4 * 2 + 200 + 48 }}
        >

          {/* ── LEFT SIDE: UConn (top) + South Carolina (bottom) ── */}
          <div className="flex flex-col shrink-0" style={{ gap: REGION_GAP }}>
            <RegionBlock
              region="UConn"
              dir="ltr"
              picks={picks}
              advanced={advanced}
              onPick={makePick}
              isLocked={isLocked}
            />
            <RegionBlock
              region="South Carolina"
              dir="ltr"
              picks={picks}
              advanced={advanced}
              onPick={makePick}
              isLocked={isLocked}
            />
          </div>

          {/* ── CENTER: Final Four + Championship ── */}
          <div className="shrink-0 relative" style={{ width: 200, height: totalH + 28 }}>
            {/* Section label row spacer to match region header height */}
            <div style={{ height: 28 }} />

            <div className="relative" style={{ height: totalH }}>
              {/* Vertical center line */}
              <svg
                width={200}
                height={totalH}
                className="absolute inset-0 pointer-events-none"
              >
                {/* FF_0 bracket arms */}
                <line
                  x1={0} y1={REGION_H / 2}
                  x2={16} y2={REGION_H / 2}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />
                <line
                  x1={200} y1={REGION_H / 2}
                  x2={184} y2={REGION_H / 2}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />
                {/* FF_1 bracket arms */}
                <line
                  x1={0} y1={REGION_H + REGION_GAP + REGION_H / 2}
                  x2={16} y2={REGION_H + REGION_GAP + REGION_H / 2}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />
                <line
                  x1={200} y1={REGION_H + REGION_GAP + REGION_H / 2}
                  x2={184} y2={REGION_H + REGION_GAP + REGION_H / 2}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />
                {/* Vertical from FF_0 to championship */}
                <line
                  x1={100} y1={REGION_H / 2}
                  x2={100} y2={totalH / 2 - CARD_H / 2}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />
                {/* Vertical from FF_1 to championship */}
                <line
                  x1={100} y1={REGION_H + REGION_GAP + REGION_H / 2}
                  x2={100} y2={totalH / 2 + CARD_H / 2}
                  stroke="rgba(255,255,255,0.10)" strokeWidth={1}
                />
              </svg>

              {/* FF Semi 1 — UConn vs UCLA */}
              <div
                className="absolute left-0 right-0 px-3"
                style={{ top: REGION_H / 2 - CARD_H / 2 }}
              >
                <p className="text-[8px] text-white/25 uppercase tracking-widest text-center mb-1">
                  Final Four · {ROUND_POINTS[5]}pts
                </p>
                <FFCard
                  top={ff0Top}
                  bottom={ff0Bottom}
                  pickedId={picks['FF_0']}
                  onPick={(id) => makePick('FF_0', id)}
                  disabled={isLocked}
                  label="Semi 1"
                />
              </div>

              {/* Championship */}
              <div
                className="absolute left-0 right-0 px-3"
                style={{ top: totalH / 2 - CARD_H / 2 - 10 }}
              >
                <p className="text-[8px] text-[#d4a017] uppercase tracking-widest text-center mb-1 font-bold">
                  🏆 Championship · {ROUND_POINTS[6]}pts
                </p>
                <FFCard
                  top={champTop}
                  bottom={champBottom}
                  pickedId={picks['CHAMP']}
                  onPick={(id) => makePick('CHAMP', id)}
                  disabled={isLocked}
                  label="Champion"
                  isChamp
                />
              </div>

              {/* FF Semi 2 — Texas vs South Carolina */}
              <div
                className="absolute left-0 right-0 px-3"
                style={{ top: REGION_H + REGION_GAP + REGION_H / 2 - CARD_H / 2 }}
              >
                <p className="text-[8px] text-white/25 uppercase tracking-widest text-center mb-1">
                  Final Four · {ROUND_POINTS[5]}pts
                </p>
                <FFCard
                  top={ff1Top}
                  bottom={ff1Bottom}
                  pickedId={picks['FF_1']}
                  onPick={(id) => makePick('FF_1', id)}
                  disabled={isLocked}
                  label="Semi 2"
                />
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE: UCLA (top) + Texas (bottom), mirrored ── */}
          <div className="flex flex-col shrink-0" style={{ gap: REGION_GAP }}>
            <RegionBlock
              region="UCLA"
              dir="rtl"
              picks={picks}
              advanced={advanced}
              onPick={makePick}
              isLocked={isLocked}
            />
            <RegionBlock
              region="Texas"
              dir="rtl"
              picks={picks}
              advanced={advanced}
              onPick={makePick}
              isLocked={isLocked}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Region block (one region, 4 rounds) ──────────────────────────────
function RegionBlock({
  region, dir, picks, advanced, onPick, isLocked
}: {
  region:   Region
  dir:      Dir
  picks:    Record<string, number>
  advanced: Record<string, Team | null>
  onPick:   (key: string, id: number) => void
  isLocked: boolean
}) {
  const matchups = getRegionMatchups(region)
  // LTR: show rounds 1→4 (R1 on left, E8 on right)
  // RTL: show rounds 4→1 (E8 on left closest to center, R1 on right)
  const roundOrder = dir === 'ltr' ? [1, 2, 3, 4] : [4, 3, 2, 1]

  return (
    <div className="shrink-0">
      {/* Region label */}
      <div className={`flex items-center gap-2 mb-1 h-7 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div className="w-1 h-3.5 rounded-full bg-[#d4a017] shrink-0" />
        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">
          {REGION_LABELS[region]} Region
        </span>
      </div>

      {/* Round columns */}
      <div className="flex items-start">
        {roundOrder.map((round, colIdx) => {
          const isLastCol = colIdx === roundOrder.length - 1
          const gamesInRound = 8 >> (round - 1)

          // Which round has more games for the connector between this col and next?
          // LTR: current round (round) feeds into next (roundOrder[colIdx+1]) — source = current
          // RTL: next round (roundOrder[colIdx+1]) feeds into current — source = next
          const nextRound = roundOrder[colIdx + 1]
          const connSourceRound = dir === 'ltr' ? round : (nextRound ?? round)
          const connDir: Dir = dir

          return (
            <div key={round} className="flex items-start shrink-0">
              {/* Column */}
              <div className="shrink-0" style={{ width: CARD_W }}>
                {/* Round header */}
                <div className="h-5 flex items-center justify-center mb-1">
                  <span className="text-[8px] font-semibold text-white/20 uppercase tracking-wider">
                    {ROUND_LABELS[round]}
                  </span>
                </div>
                {/* Games — absolute within fixed-height container */}
                <div className="relative" style={{ height: REGION_H }}>
                  {Array.from({ length: gamesInRound }, (_, gi) => {
                    const top = gameTopPx(round, gi)
                    const key = pickKey(region, round, gi)

                    if (round === 1) {
                      const m = matchups[gi]
                      return (
                        <div key={gi} className="absolute inset-x-0" style={{ top }}>
                          <GameCard
                            top={m.top}
                            bottom={m.bottom}
                            pickedId={picks[key]}
                            onPick={(id) => onPick(key, id)}
                            disabled={isLocked}
                          />
                        </div>
                      )
                    }

                    // Rounds 2–4: teams come from prior picks
                    const topKey = pickKey(region, round - 1, gi * 2)
                    const botKey = pickKey(region, round - 1, gi * 2 + 1)
                    const topTeam = advanced[topKey] ?? null
                    const botTeam = advanced[botKey] ?? null

                    return (
                      <div key={gi} className="absolute inset-x-0" style={{ top }}>
                        <AdvanceCard
                          top={topTeam}
                          bottom={botTeam}
                          pickedId={picks[key]}
                          onPick={(id) => onPick(key, id)}
                          disabled={isLocked}
                          round={round}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Connector SVG between this column and the next */}
              {!isLastCol && (
                <div className="shrink-0 mt-6" style={{ width: CONN_W, height: REGION_H }}>
                  <BracketConnectors
                    sourceRound={connSourceRound}
                    dir={connDir}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Bracket connector SVG ─────────────────────────────────────────────
function BracketConnectors({ sourceRound, dir }: { sourceRound: number; dir: Dir }) {
  const gamesInRound = 8 >> (sourceRound - 1)
  const stroke = 'rgba(255,255,255,0.09)'
  const lines: React.ReactNode[] = []

  const srcX  = dir === 'ltr' ? 0       : CONN_W     // side where source games exit
  const destX = dir === 'ltr' ? CONN_W  : 0           // side where destination game enters
  const pivX  = CONN_W / 2

  for (let gi = 0; gi < gamesInRound; gi += 2) {
    const topCenterY = gameTopPx(sourceRound, gi)     + CARD_H / 2
    const botCenterY = gameTopPx(sourceRound, gi + 1) + CARD_H / 2
    const midY       = (topCenterY + botCenterY) / 2

    lines.push(
      <g key={gi}>
        {/* Horizontal from top source game to pivot */}
        <line x1={srcX} y1={topCenterY} x2={pivX} y2={topCenterY} stroke={stroke} strokeWidth={1} />
        {/* Horizontal from bottom source game to pivot */}
        <line x1={srcX} y1={botCenterY} x2={pivX} y2={botCenterY} stroke={stroke} strokeWidth={1} />
        {/* Vertical joining them */}
        <line x1={pivX} y1={topCenterY} x2={pivX} y2={botCenterY} stroke={stroke} strokeWidth={1} />
        {/* Horizontal to destination */}
        <line x1={pivX} y1={midY} x2={destX} y2={midY} stroke={stroke} strokeWidth={1} />
      </g>
    )
  }

  return (
    <svg width={CONN_W} height={REGION_H} className="overflow-visible">
      {lines}
    </svg>
  )
}

// ── R1 game card (both teams known) ──────────────────────────────────
function GameCard({
  top, bottom, pickedId, onPick, disabled
}: {
  top:      Team
  bottom:   Team
  pickedId?: number
  onPick:   (id: number) => void
  disabled: boolean
}) {
  return (
    <div className="border border-white/[0.09] rounded-lg overflow-hidden bg-[#111113]">
      <TeamRow team={top}    picked={pickedId === top?.id}    onPick={onPick} disabled={disabled} />
      <div className="h-px bg-white/[0.07]" />
      <TeamRow team={bottom} picked={pickedId === bottom?.id} onPick={onPick} disabled={disabled} />
    </div>
  )
}

// ── Advance card (R2+ — teams from prior picks) ───────────────────────
function AdvanceCard({
  top, bottom, pickedId, onPick, disabled, round
}: {
  top:      Team | null
  bottom:   Team | null
  pickedId?: number
  onPick:   (id: number) => void
  disabled: boolean
  round:    number
}) {
  if (!top && !bottom) {
    return (
      <div
        className="border border-white/[0.05] rounded-lg bg-[#0d0d0f] flex items-center justify-center opacity-40"
        style={{ height: CARD_H }}
      >
        <span className="text-[8px] text-white/20 uppercase tracking-wider">
          R{round - 1} picks needed
        </span>
      </div>
    )
  }
  return (
    <div className="border border-white/[0.09] rounded-lg overflow-hidden bg-[#111113]">
      {top    ? <TeamRow team={top}    picked={pickedId === top.id}    onPick={onPick} disabled={disabled} /> : <EmptyRow />}
      <div className="h-px bg-white/[0.07]" />
      {bottom ? <TeamRow team={bottom} picked={pickedId === bottom.id} onPick={onPick} disabled={disabled} /> : <EmptyRow />}
    </div>
  )
}

// ── Final Four / Championship card ────────────────────────────────────
function FFCard({
  top, bottom, pickedId, onPick, disabled, label, isChamp
}: {
  top:      Team | null
  bottom:   Team | null
  pickedId?: number
  onPick:   (id: number) => void
  disabled: boolean
  label:    string
  isChamp?: boolean
}) {
  const borderColor = isChamp ? 'border-[#d4a017]/30' : 'border-white/[0.09]'
  const bg = isChamp ? 'bg-[#d4a017]/5' : 'bg-[#111113]'

  if (!top && !bottom) {
    return (
      <div
        className={`border ${borderColor} rounded-lg flex items-center justify-center ${bg}`}
        style={{ height: CARD_H }}
      >
        {isChamp
          ? <span className="text-xl">🏆</span>
          : <span className="text-[9px] text-white/20 text-center px-2">Complete regions first</span>
        }
      </div>
    )
  }
  return (
    <div className={`border ${borderColor} rounded-lg overflow-hidden ${bg}`}>
      {top
        ? <TeamRow team={top}    picked={pickedId === top.id}    onPick={onPick} disabled={disabled} compact />
        : <EmptyRow />
      }
      <div className="h-px bg-white/[0.07]" />
      {bottom
        ? <TeamRow team={bottom} picked={pickedId === bottom.id} onPick={onPick} disabled={disabled} compact />
        : <EmptyRow />
      }
    </div>
  )
}

// ── Single team row ───────────────────────────────────────────────────
function TeamRow({
  team, picked, onPick, disabled, compact
}: {
  team:     Team
  picked:   boolean
  onPick:   (id: number) => void
  disabled: boolean
  compact?: boolean
}) {
  const rowH = (CARD_H - 1) / 2  // ~27px

  return (
    <button
      onClick={() => !disabled && onPick(team.id)}
      disabled={disabled}
      className={`w-full flex items-center gap-1.5 px-2 transition-all text-left
        ${picked    ? 'bg-[#d4a017]/15' : 'hover:bg-white/[0.04]'}
        ${disabled  ? 'cursor-default'  : 'cursor-pointer'}`}
      style={{ height: rowH }}
    >
      <span className={`text-[9px] font-bold w-4 shrink-0 text-right
        ${team.seed <= 3 ? 'text-[#d4a017]' : 'text-white/25'}`}>
        {team.seed}
      </span>
      <span className={`text-[10px] truncate flex-1 leading-none
        ${picked ? 'text-white font-bold' : 'text-white/55'}
        ${compact ? 'text-[9px]' : ''}`}>
        {team.abbreviation}
        {team.isFirstFour && <span className="text-white/20 text-[7px] ml-0.5">FF</span>}
      </span>
      {picked && <span className="text-[#d4a017] text-[9px] shrink-0">✓</span>}
    </button>
  )
}

function EmptyRow() {
  const rowH = (CARD_H - 1) / 2
  return (
    <div className="flex items-center px-2" style={{ height: rowH }}>
      <span className="text-[9px] text-white/15">TBD</span>
    </div>
  )
}
