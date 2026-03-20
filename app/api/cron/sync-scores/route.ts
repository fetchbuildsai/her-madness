import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  TEAMS, REGIONS, FIRST_FOUR, REGION_MATCHUPS, ESPNIDS, pickKey, type Region
} from '@/lib/tournament/data'
import { calculateScore } from '@/lib/tournament/scoring'

// Reverse map: ESPN school ID → our internal team ID
const ESPN_TO_OUR: Record<number, number> = {}
Object.entries(ESPNIDS).forEach(([ourId, espnId]) => {
  if (espnId) ESPN_TO_OUR[espnId] = Number(ourId)
})

// All tournament dates to check
const DATES = [
  '20260318','20260319', // First Four
  '20260320','20260321', // Round 1
  '20260322','20260323', // Round 2
  '20260328','20260329', // Sweet 16
  '20260330','20260331', // Elite Eight
  '20260404',            // Final Four
  '20260406',            // Championship
]

function gameKey(a: number, b: number) {
  return `${Math.min(a, b)}_${Math.max(a, b)}`
}

// Fetch all completed Women's Tournament games from ESPN
async function fetchCompletedGames(): Promise<Map<string, number>> {
  // Map: "smallId_bigId" → winnerId (our team ID)
  const winners = new Map<string, number>()

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')

  // Only fetch dates up through today
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

        const winnerId = a.winner ? aId : bId
        winners.set(gameKey(aId, bId), winnerId)
      }
    } catch { /* skip failed dates */ }
  }))

  return winners
}

function buildResults(winners: Map<string, number>): Record<string, number> {
  const results: Record<string, number> = {}

  // First Four
  for (const ff of FIRST_FOUR) {
    const w = winners.get(gameKey(ff.topTeamId, ff.bottomTeamId))
    if (w) results[ff.key] = w
  }

  // Helper: get the real team ID for a seed slot (accounts for First Four winners)
  function slotTeam(region: Region, seed: number): number | null {
    const ff = FIRST_FOUR.find(f => f.region === region && f.seed === seed)
    if (ff) return results[ff.key] ?? null
    return TEAMS.find(t => t.region === region && t.seed === seed && !t.isFirstFour)?.id ?? null
  }

  // Rounds 1–4
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

  // Final Four semis
  // FF_0: UConn (R[0]) vs Texas (R[2]) — both Fort Worth
  // FF_1: UCLA (R[1]) vs South Carolina (R[3]) — both Sacramento
  const ffPairs = [[0, 2], [1, 3]]
  for (let i = 0; i < 2; i++) {
    const topId = results[pickKey(REGIONS[ffPairs[i][0]], 4, 0)] ?? null
    const botId = results[pickKey(REGIONS[ffPairs[i][1]], 4, 0)] ?? null
    if (!topId || !botId) continue
    const w = winners.get(gameKey(topId, botId))
    if (w) results[`FF_${i}`] = w
  }

  // Championship
  const cTop = results['FF_0'] ?? null
  const cBot = results['FF_1'] ?? null
  if (cTop && cBot) {
    const w = winners.get(gameKey(cTop, cBot))
    if (w) results['CHAMP'] = w
  }

  return results
}

export async function GET(req: Request) {
  // Protect with a secret so random people can't trigger it
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Pull live results from ESPN
  const winners = await fetchCompletedGames()
  const picks   = buildResults(winners)

  // 2. Save to tournament_results
  await svc.from('tournament_results').upsert({
    id: 1, picks, updated_at: new Date().toISOString()
  })

  // 3. Recalculate every bracket score
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
