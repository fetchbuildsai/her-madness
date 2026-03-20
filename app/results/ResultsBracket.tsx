'use client'

import Link from 'next/link'
import AppNav from '@/components/AppNav'
import {
  REGIONS, FIRST_FOUR, getRegionMatchups, getFirstFourGame, pickKey, getTeam, ESPNIDS,
  type Region, type Team
} from '@/lib/tournament/data'

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

const ROUND_LABELS: Record<number, string> = {
  1: 'First Round', 2: 'Round of 32', 3: 'Sweet 16', 4: 'Elite Eight'
}

const MOBILE_TABS: Array<{ key: Region | 'ff'; label: string }> = [
  { key: 'UConn',          label: 'UConn' },
  { key: 'South Carolina', label: 'S. Car.' },
  { key: 'UCLA',           label: 'UCLA' },
  { key: 'Texas',          label: 'Texas' },
  { key: 'ff',             label: '🏆 FF' },
]

function TeamLogo({ team }: { team: Team }) {
  const espnId = ESPNIDS[team.id]
  if (espnId) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={`https://a.espncdn.com/i/teamlogos/ncaa/500/${espnId}.png`}
        alt={team.abbreviation} width={18} height={18}
        className="w-[18px] h-[18px] object-contain shrink-0" />
    )
  }
  return (
    <div className="w-[18px] h-[18px] rounded-full bg-[#1a1a2e] flex items-center justify-center shrink-0">
      <span className="text-[6px] font-black text-white">{team.abbreviation.slice(0, 2)}</span>
    </div>
  )
}

function TeamRow({ team, won }: { team: Team; won: boolean }) {
  const rowH = (CARD_H - 1) / 2
  return (
    <div className={`relative w-full flex items-center gap-1.5 px-2 overflow-hidden text-left
      ${won ? 'bg-[#fef3c7]' : 'bg-white opacity-50'}`}
      style={{ height: rowH }}>
      <div className="shrink-0"><TeamLogo team={team} /></div>
      <span className={`text-[9px] font-bold w-4 shrink-0 text-right
        ${won ? 'text-amber-700' : 'text-gray-400'}`}>{team.seed}</span>
      <span className={`text-[10px] truncate flex-1 leading-none font-medium
        ${won ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{team.abbreviation}</span>
      {won && <span className="text-[#d4a017] text-[10px] shrink-0">✓</span>}
    </div>
  )
}

function EmptyRow({ label }: { label?: string }) {
  return (
    <div className="flex items-center px-2 bg-white opacity-40" style={{ height: (CARD_H - 1) / 2 }}>
      <span className="text-[9px] text-gray-300">{label ?? 'TBD'}</span>
    </div>
  )
}

function ResultsRegionBlock({ region, dir, results }: {
  region: Region; dir: Dir; results: Record<string, number>
}) {
  const matchups = getRegionMatchups(region)
  const roundOrder = dir === 'ltr' ? [1, 2, 3, 4] : [4, 3, 2, 1]

  // Build ff4 winners from results
  const ff4Winners: Record<string, Team | null> = {}
  FIRST_FOUR.forEach(({ key }) => {
    ff4Winners[key] = results[key] ? (getTeam(results[key]) ?? null) : null
  })

  // Build advanced map
  const advanced: Record<string, Team | null> = {}
  REGIONS.forEach(r => {
    for (let round = 1; round <= 4; round++) {
      for (let gi = 0; gi < (8 >> (round - 1)); gi++) {
        const k = pickKey(r, round, gi)
        advanced[k] = results[k] ? (getTeam(results[k]) ?? null) : null
      }
    }
  })

  return (
    <div className="shrink-0">
      <div className={`flex items-center gap-2 mb-1 h-7 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
        <div className="w-1 h-3.5 rounded-full bg-[#d4a017] shrink-0" />
        <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">{region} Region</span>
      </div>
      <div className="flex items-start">
        {roundOrder.map((round, colIdx) => {
          const isLastCol = colIdx === roundOrder.length - 1
          const nextRound = roundOrder[colIdx + 1]
          const connSource = dir === 'ltr' ? round : (nextRound ?? round)
          const gamesInRound = 8 >> (round - 1)

          return (
            <div key={round} className="flex items-start shrink-0">
              <div className="shrink-0" style={{ width: CARD_W }}>
                <div className="h-8 flex flex-col items-center justify-center mb-1">
                  <span className="text-[8px] font-semibold text-white/25 uppercase tracking-wider">
                    {ROUND_LABELS[round]}
                  </span>
                </div>
                <div className="relative" style={{ height: REGION_H }}>
                  {Array.from({ length: gamesInRound }, (_, gi) => {
                    const top = gameTopPx(round, gi)
                    const key = pickKey(region, round, gi)
                    const winner = results[key] ? getTeam(results[key]) : null

                    let topTeam: Team | null = null
                    let botTeam: Team | null = null

                    if (round === 1) {
                      const m = matchups[gi]
                      const ff4T = m.top.isFirstFour ? getFirstFourGame(region, m.top.seed) : null
                      const ff4B = m.bottom.isFirstFour ? getFirstFourGame(region, m.bottom.seed) : null
                      topTeam = ff4T ? (ff4Winners[ff4T.key] ?? null) : m.top
                      botTeam = ff4B ? (ff4Winners[ff4B.key] ?? null) : m.bottom
                    } else {
                      topTeam = advanced[pickKey(region, round - 1, gi * 2)] ?? null
                      botTeam = advanced[pickKey(region, round - 1, gi * 2 + 1)] ?? null
                    }

                    return (
                      <div key={gi} className="absolute inset-x-0" style={{ top }}>
                        {!topTeam && !botTeam ? (
                          <div className="border border-white/[0.06] rounded-xl flex items-center justify-center opacity-20"
                            style={{ height: CARD_H, background: '#111113' }}>
                            <span className="text-[8px] text-white/30">TBD</span>
                          </div>
                        ) : (
                          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                            {topTeam ? <TeamRow team={topTeam} won={winner?.id === topTeam.id} /> : <EmptyRow />}
                            <div className="h-px bg-gray-100" />
                            {botTeam ? <TeamRow team={botTeam} won={winner?.id === botTeam.id} /> : <EmptyRow />}
                          </div>
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

function BracketConnectors({ sourceRound, dir }: { sourceRound: number; dir: Dir }) {
  const n    = 8 >> (sourceRound - 1)
  const srcX = dir === 'ltr' ? 0 : CONN_W
  const destX = dir === 'ltr' ? CONN_W : 0
  const pivX = CONN_W / 2
  const s    = 'rgba(255,255,255,0.45)'
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

function CenterResultCard({ y, label, date, top, bottom, winner }: {
  y: number; label: string; date: string
  top: Team | null; bottom: Team | null; winner: Team | null
}) {
  return (
    <div className="absolute left-0 right-0 px-3" style={{ top: y - CARD_H / 2 }}>
      <div className="text-center mb-1 text-white/25">
        <p className="text-[8px] uppercase tracking-widest leading-none">{label}</p>
        <p className="text-[7px] mt-0.5 opacity-60">{date}</p>
      </div>
      {!top && !bottom ? (
        <div className="border border-white/[0.07] bg-[#111113] rounded-xl flex items-center justify-center"
          style={{ height: CARD_H }}>
          <span className="text-[9px] text-white/20 px-2 text-center">Complete regions first</span>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-gray-200 bg-white shadow-lg">
          {top    ? <TeamRow team={top}    won={winner?.id === top.id} />    : <EmptyRow label="TBD" />}
          <div className="h-px bg-gray-100" />
          {bottom ? <TeamRow team={bottom} won={winner?.id === bottom.id} /> : <EmptyRow label="TBD" />}
        </div>
      )}
    </div>
  )
}

export default function ResultsBracket({
  results, updatedAt
}: {
  results: Record<string, number>
  updatedAt: string | null
}) {
  const totalH = REGION_H * 2 + REGION_GAP

  // REGIONS = ['UConn', 'UCLA', 'Texas', 'South Carolina']
  // FF_0: UConn (R0) vs South Carolina (R3)
  // FF_1: UCLA (R1) vs Texas (R2)
  const e8 = REGIONS.map(r => results[pickKey(r, 4, 0)] ? (getTeam(results[pickKey(r, 4, 0)]) ?? null) : null)
  const ff0top = e8[0] // UConn E8 winner
  const ff0bot = e8[3] // South Carolina E8 winner
  const ff1top = e8[1] // UCLA E8 winner
  const ff1bot = e8[2] // Texas E8 winner

  const ff0winner = results['FF_0'] ? (getTeam(results['FF_0']) ?? null) : null
  const ff1winner = results['FF_1'] ? (getTeam(results['FF_1']) ?? null) : null
  const champWinner = results['CHAMP'] ? (getTeam(results['CHAMP']) ?? null) : null

  const [mobileTab, setMobileTab] = React.useState<Region | 'ff'>('UConn')

  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <AppNav />

      {/* Header */}
      <div className="pt-14 border-b border-white/[0.07] px-4 py-3 bg-[#0a0a0a] sticky top-14 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-sm font-black text-white">Live Results Bracket</h1>
            <p className="text-[11px] text-white/30">
              {lastUpdated ? `Updated ${lastUpdated}` : 'Updates as games finish'}
            </p>
          </div>
          <Link href="/bracket"
            className="px-3 py-1.5 text-xs font-semibold border border-white/15 text-white/50 rounded-lg hover:border-white/30 transition-colors">
            My Bracket
          </Link>
        </div>
      </div>

      {/* Mobile tabs */}
      <div className="flex sm:hidden border-b border-white/[0.07] bg-[#0a0a0a] sticky top-[calc(3.5rem+4.5rem)] z-10 px-2 gap-1 pt-1">
        {MOBILE_TABS.map(tab => (
          <button key={tab.key} onClick={() => setMobileTab(tab.key)}
            className={`flex-1 pb-2 pt-1 text-[10px] font-bold transition-colors border-b-2 ${
              mobileTab === tab.key
                ? 'text-[#d4a017] border-[#d4a017]'
                : 'text-white/30 border-transparent'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bracket */}
      <div className="overflow-x-auto pb-12 pt-4">
        <div className="flex items-start px-6"
          style={{ minWidth: (CARD_W + CONN_W) * 4 * 2 + 200 + 48 }}>

          {/* Left: UConn + South Carolina */}
          <div className="flex flex-col shrink-0" style={{ gap: REGION_GAP }}>
            {(['UConn', 'South Carolina'] as Region[]).map(r => (
              <div key={r} className={mobileTab !== r ? 'hidden sm:block' : ''}>
                <ResultsRegionBlock region={r} dir="ltr" results={results} />
              </div>
            ))}
          </div>

          {/* Center: Final Four + Championship */}
          <div className={`shrink-0 relative ${mobileTab !== 'ff' ? 'hidden sm:block' : ''}`}
            style={{ width: 200, height: totalH + 32 }}>
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

              <CenterResultCard y={REGION_H / 2} label={`Final Four · Apr 4`} date="Phoenix, AZ"
                top={ff0top} bottom={ff0bot} winner={ff0winner} />

              {/* Championship */}
              <div className="absolute left-0 right-0 px-3" style={{ top: totalH / 2 - CARD_H / 2 - 10 }}>
                <div className="text-center mb-1">
                  <p className="text-[8px] uppercase tracking-widest leading-none font-bold text-[#d4a017]">🏆 Championship · Apr 6</p>
                  <p className="text-[7px] mt-0.5 text-white/30">Phoenix, AZ</p>
                </div>
                {!ff0winner && !ff1winner ? (
                  <div className="border border-[#d4a017]/20 bg-[#d4a017]/5 rounded-xl flex items-center justify-center"
                    style={{ height: CARD_H }}>
                    <span className="text-xl">🏆</span>
                  </div>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-[#d4a017]/40 bg-white shadow-lg">
                    {ff0winner ? <TeamRow team={ff0winner} won={champWinner?.id === ff0winner.id} /> : <EmptyRow label="TBD" />}
                    <div className="h-px bg-gray-100" />
                    {ff1winner ? <TeamRow team={ff1winner} won={champWinner?.id === ff1winner.id} /> : <EmptyRow label="TBD" />}
                  </div>
                )}
              </div>

              <CenterResultCard y={REGION_H + REGION_GAP + REGION_H / 2} label={`Final Four · Apr 4`} date="Phoenix, AZ"
                top={ff1top} bottom={ff1bot} winner={ff1winner} />
            </div>
          </div>

          {/* Right: UCLA + Texas */}
          <div className="flex flex-col shrink-0" style={{ gap: REGION_GAP }}>
            {(['UCLA', 'Texas'] as Region[]).map(r => (
              <div key={r} className={mobileTab !== r ? 'hidden sm:block' : ''}>
                <ResultsRegionBlock region={r} dir="rtl" results={results} />
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

import React from 'react'
