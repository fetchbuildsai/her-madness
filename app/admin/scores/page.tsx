'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getRegionMatchups, getTeam, REGIONS, FIRST_FOUR, pickKey, type Region } from '@/lib/tournament/data'

const REGION_LABELS: Record<Region, string> = {
  'UConn': 'Fort Worth', 'UCLA': 'Sacramento', 'Texas': 'Fort Worth', 'South Carolina': 'Sacramento',
}
const ROUND_NAMES: Record<number, string> = {
  1: 'First Round', 2: 'Round of 32', 3: 'Sweet 16', 4: 'Elite Eight',
}

export default function AdminScoresPage() {
  const [results,    setResults]   = useState<Record<string, number>>({})
  const [saving,     setSaving]    = useState(false)
  const [recalcing,  setRecalc]    = useState(false)
  const [status,     setStatus]    = useState<string | null>(null)
  const [updatedAt,  setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/results')
      .then(r => r.json())
      .then(d => { setResults(d.picks ?? {}); setUpdatedAt(d.updated_at) })
      .catch(() => {})
  }, [])

  const pickWinner = useCallback((key: string, id: number) => {
    setResults(prev => ({ ...prev, [key]: id }))
  }, [])

  async function saveResults() {
    setSaving(true); setStatus(null)
    const res = await fetch('/api/admin/results', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ picks: results }),
    })
    setSaving(false)
    flash(res.ok ? '✓ Saved' : '✗ Save failed')
  }

  async function recalculate() {
    setRecalc(true); setStatus(null)
    const res = await fetch('/api/admin/recalculate', { method: 'POST' })
    const d   = await res.json()
    setRecalc(false)
    flash(res.ok ? `✓ Scores updated for ${d.updated} brackets` : `✗ ${d.error}`)
  }

  function flash(msg: string) {
    setStatus(msg); setTimeout(() => setStatus(null), 4000)
  }

  const resultCount = Object.values(results).filter(Boolean).length

  return (
    <div className="min-h-screen bg-[#09090b]">
      <nav className="border-b border-white/[0.06] bg-[#09090b]/80 backdrop-blur-md px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/" className="font-black tracking-widest text-[#d4a017]">🏀 HER MADNESS</Link>
          <span className="text-[#3f3f46]">/</span>
          <Link href="/admin" className="text-[#71717a] hover:text-white transition-colors">Admin</Link>
          <span className="text-[#3f3f46]">/</span>
          <span className="text-[#a1a1aa]">Score Results</span>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-xs font-semibold ${status.startsWith('✓') ? 'text-[#22c55e]' : 'text-red-400'}`}>
              {status}
            </span>
          )}
          <button onClick={saveResults} disabled={saving}
            className="px-4 py-1.5 text-xs font-bold border border-[#d4a017]/40 text-[#d4a017] rounded-lg hover:bg-[#d4a017]/10 transition-colors disabled:opacity-40">
            {saving ? 'Saving…' : `Save (${resultCount} results)`}
          </button>
          <button onClick={recalculate} disabled={recalcing || resultCount === 0}
            className="px-4 py-1.5 text-xs font-bold bg-[#d4a017] text-black rounded-lg hover:bg-[#f0c040] transition-colors disabled:opacity-40">
            {recalcing ? 'Recalculating…' : '⚡ Recalculate Scores'}
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-black text-white mb-1">Enter Tournament Results</h1>
          <p className="text-sm text-white/40">
            Click the winner for each completed game → Save → Recalculate Scores.
            {updatedAt && <span className="ml-2 text-white/20">Last saved: {new Date(updatedAt).toLocaleString()}</span>}
          </p>
        </div>

        {/* First Four */}
        <Section title="First Four (Play-In)">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FIRST_FOUR.map(ff => (
              <GamePicker key={ff.key}
                label={`${REGION_LABELS[ff.region]} · seed ${ff.seed}`}
                topTeam={getTeam(ff.topTeamId) ?? null}
                botTeam={getTeam(ff.bottomTeamId) ?? null}
                winnerId={results[ff.key]}
                onPick={(id) => pickWinner(ff.key, id)} />
            ))}
          </div>
        </Section>

        {/* Rounds 1–4 */}
        {([1, 2, 3, 4] as const).map(round => (
          <Section key={round} title={ROUND_NAMES[round]}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {REGIONS.flatMap(region => {
                const gamesInRound = 8 >> (round - 1)
                return Array.from({ length: gamesInRound }, (_, gi) => {
                  const key = pickKey(region, round, gi)
                  let topTeam = null, botTeam = null

                  if (round === 1) {
                    const m = getRegionMatchups(region)
                    topTeam = m[gi]?.top ?? null
                    botTeam = m[gi]?.bottom ?? null
                  } else {
                    const tid = results[pickKey(region, round - 1, gi * 2)]
                    const bid = results[pickKey(region, round - 1, gi * 2 + 1)]
                    topTeam = tid ? (getTeam(tid) ?? null) : null
                    botTeam = bid ? (getTeam(bid) ?? null) : null
                  }

                  if (!topTeam && !botTeam) return null
                  return (
                    <GamePicker key={key}
                      label={`${REGION_LABELS[region]} G${gi + 1}`}
                      topTeam={topTeam} botTeam={botTeam}
                      winnerId={results[key]}
                      onPick={(id) => pickWinner(key, id)} />
                  )
                }).filter(Boolean)
              })}
            </div>
          </Section>
        ))}

        {/* Final Four */}
        <Section title="Final Four">
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            {(['FF_0', 'FF_1'] as const).map((ffKey, i) => (
              <GamePicker key={ffKey} label={`Semi ${i + 1}`}
                topTeam={results[pickKey(REGIONS[i * 2], 4, 0)] ? (getTeam(results[pickKey(REGIONS[i * 2], 4, 0)]) ?? null) : null}
                botTeam={results[pickKey(REGIONS[i * 2 + 1], 4, 0)] ? (getTeam(results[pickKey(REGIONS[i * 2 + 1], 4, 0)]) ?? null) : null}
                winnerId={results[ffKey]}
                onPick={(id) => pickWinner(ffKey, id)} />
            ))}
          </div>
        </Section>

        {/* Championship */}
        <Section title="Championship 🏆">
          <div className="max-w-[148px]">
            <GamePicker label="National Champion"
              topTeam={results['FF_0'] ? (getTeam(results['FF_0']) ?? null) : null}
              botTeam={results['FF_1'] ? (getTeam(results['FF_1']) ?? null) : null}
              winnerId={results['CHAMP']}
              onPick={(id) => pickWinner('CHAMP', id)} />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1 h-4 rounded-full bg-[#d4a017]" />
        <h2 className="text-sm font-black text-white/70 uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </div>
  )
}

type SimpleTeam = { id: number; seed: number; abbreviation: string } | null

function GamePicker({ label, topTeam, botTeam, winnerId, onPick }: {
  label: string; topTeam: SimpleTeam; botTeam: SimpleTeam
  winnerId?: number; onPick: (id: number) => void
}) {
  return (
    <div>
      <p className="text-[9px] text-white/25 uppercase tracking-wider mb-1 truncate">{label}</p>
      <div className="border border-white/[0.09] rounded-lg overflow-hidden bg-[#111113]">
        {topTeam ? (
          <button onClick={() => onPick(topTeam.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all
              ${winnerId === topTeam.id ? 'bg-[#22c55e]/15 text-white font-bold' : 'text-white/60 hover:bg-white/[0.04]'}`}>
            <span className="text-[9px] text-white/30 w-4 text-right shrink-0">{topTeam.seed}</span>
            <span className="text-[11px] truncate">{topTeam.abbreviation}</span>
            {winnerId === topTeam.id && <span className="ml-auto text-[#22c55e] text-xs shrink-0">✓</span>}
          </button>
        ) : <div className="px-3 py-2.5 text-[10px] text-white/20 italic">TBD</div>}
        <div className="h-px bg-white/[0.06]" />
        {botTeam ? (
          <button onClick={() => onPick(botTeam.id)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all
              ${winnerId === botTeam.id ? 'bg-[#22c55e]/15 text-white font-bold' : 'text-white/60 hover:bg-white/[0.04]'}`}>
            <span className="text-[9px] text-white/30 w-4 text-right shrink-0">{botTeam.seed}</span>
            <span className="text-[11px] truncate">{botTeam.abbreviation}</span>
            {winnerId === botTeam.id && <span className="ml-auto text-[#22c55e] text-xs shrink-0">✓</span>}
          </button>
        ) : <div className="px-3 py-2.5 text-[10px] text-white/20 italic">TBD</div>}
      </div>
    </div>
  )
}
