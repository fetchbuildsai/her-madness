import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  TEAMS, REGIONS, FIRST_FOUR, REGION_MATCHUPS, ESPNIDS, pickKey, type Region
} from '@/lib/tournament/data'
import { calculateScore } from '@/lib/tournament/scoring'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ESPN_TO_OUR: Record<number, number> = {}
Object.entries(ESPNIDS).forEach(([ourId, espnId]) => {
  if (espnId) ESPN_TO_OUR[espnId] = Number(ourId)
})

const DATES = [
  '20260318','20260319',
  '20260320','20260321',
  '20260322','20260323',
  '20260327','20260328',
  '20260329','20260330',
  '20260403',
  '20260405',
]

function gameKey(a: number, b: number) {
  return `${Math.min(a, b)}_${Math.max(a, b)}`
}

async function fetchCompletedGames(): Promise<Map<string, number>> {
  const winners = new Map<string, number>()
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const dates = DATES.filter(d => d <= today)

  await Promise.all(dates.map(async date => {
    try {
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard?dates=${date}&limit=50`,
        { cache: 'no-store' }
      )
      if (!res.ok) return
      const data = await res.json()
      for (const event of (data.events ?? [])) {
        const comp = event.competitions?.[0]
        if (!comp?.status?.type?.completed) continue
        const [a, b] = comp.competitors ?? []
        if (!a || !b) continue
        const aId = ESPN_TO_OUR[Number(a.id)]
        const bId = ESPN_TO_OUR[Number(b.id)]
        if (!aId || !bId) continue
        winners.set(gameKey(aId, bId), a.winner ? aId : bId)
      }
    } catch { /* skip */ }
  }))

  return winners
}

function buildResults(winners: Map<string, number>): Record<string, number> {
  const results: Record<string, number> = {}

  for (const ff of FIRST_FOUR) {
    const w = winners.get(gameKey(ff.topTeamId, ff.bottomTeamId))
    if (w) results[ff.key] = w
  }

  function slotTeam(region: Region, seed: number): number | null {
    const ff = FIRST_FOUR.find(f => f.region === region && f.seed === seed)
    if (ff) return results[ff.key] ?? null
    return TEAMS.find(t => t.region === region && t.seed === seed && !t.isFirstFour)?.id ?? null
  }

  for (const region of REGIONS) {
    for (let round = 1; round <= 4; round++) {
      const games = 8 >> (round - 1)
      for (let gi = 0; gi < games; gi++) {
        const key = pickKey(region, round, gi)
        let topId: number | null
        let botId: number | null
        if (round === 1) {
          const [ts, bs] = REGION_MATCHUPS[gi]
          topId = slotTeam(region, ts)
          botId = slotTeam(region, bs)
        } else {
          topId = results[pickKey(region, round - 1, gi * 2)] ?? null
          botId = results[pickKey(region, round - 1, gi * 2 + 1)] ?? null
        }
        if (!topId || !botId) continue
        const w = winners.get(gameKey(topId, botId))
        if (w) results[key] = w
      }
    }
  }

  const ffPairs = [[0, 3], [1, 2]]
  for (let i = 0; i < 2; i++) {
    const topId = results[pickKey(REGIONS[ffPairs[i][0]], 4, 0)] ?? null
    const botId = results[pickKey(REGIONS[ffPairs[i][1]], 4, 0)] ?? null
    if (!topId || !botId) continue
    const w = winners.get(gameKey(topId, botId))
    if (w) results[`FF_${i}`] = w
  }

  const cTop = results['FF_0'] ?? null
  const cBot = results['FF_1'] ?? null
  if (cTop && cBot) {
    const w = winners.get(gameKey(cTop, cBot))
    if (w) results['CHAMP'] = w
  }

  return results
}

// POST /api/admin/sync — pull ESPN results and recalculate all scores
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = serviceClient()

  const winners = await fetchCompletedGames()
  const espnPicks = buildResults(winners)

  // Merge with existing manual entries
  const { data: existing } = await svc
    .from('tournament_results')
    .select('picks')
    .eq('id', 1)
    .single()
  const existingPicks: Record<string, number> = existing?.picks ?? {}
  const picks = { ...existingPicks, ...espnPicks }

  await svc.from('tournament_results').upsert({
    id: 1, picks, updated_at: new Date().toISOString()
  })

  const { data: brackets } = await svc.from('brackets').select('user_id, picks')
  let updated = 0
  for (const b of brackets ?? []) {
    const score = calculateScore(b.picks as Record<string, number> ?? {}, picks)
    await svc.from('brackets').update({ score }).eq('user_id', b.user_id)
    updated++
  }

  return NextResponse.json({
    ok: true,
    gamesFound: winners.size,
    resultsRecorded: Object.keys(picks).length,
    bracketsUpdated: updated,
  })
}
