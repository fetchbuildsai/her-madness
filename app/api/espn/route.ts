import { NextResponse } from 'next/server'

// ESPN unofficial API — Women's College Basketball scoreboard
// groups=100 filters to NCAA Tournament games only
const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard'

// Tournament date ranges to fetch (YYYYMMDD format)
// Covers First Four through Championship
const TOURNAMENT_DATES = [
  '20260318', '20260319', '20260320', '20260321', // First Four + Round 1
  '20260322', '20260323',                          // Round 2
  '20260327', '20260328',                          // Sweet 16
  '20260329', '20260330',                          // Elite Eight
  '20260403', '20260404', '20260405',              // Final Four
  '20260407',                                      // Championship
]

function parseStatus(espnStatus: string): 'upcoming' | 'live' | 'final' {
  if (espnStatus === 'STATUS_IN_PROGRESS') return 'live'
  if (espnStatus === 'STATUS_FINAL' || espnStatus === 'STATUS_FINAL_OT') return 'final'
  return 'upcoming'
}

function parseRound(notes: string): number {
  const n = notes.toLowerCase()
  // ESPN uses "1st Round", "2nd Round" etc. — check specific formats first
  if (n.includes('first four'))                    return 0
  if (n.includes('1st round') || n.includes('first round')) return 1
  if (n.includes('2nd round') || n.includes('second round')) return 2
  if (n.includes('sweet'))                         return 3
  if (n.includes('elite'))                         return 4
  if (n.includes('final four'))                    return 5
  // Only the actual title game — ESPN note is just "NCAA Women's Basketball Championship"
  // (no "regional" or "round" qualifier) for the championship game itself
  if (n.includes('championship') && !n.includes('regional') && !n.includes('round')) return 6
  return 1 // default: First Round
}

function parseRegion(notes: string): string {
  const n = notes.toLowerCase()
  if (n.includes('fort worth')) {
    if (n.includes('regional 1') || n.includes('1 in fort worth')) return 'Fort Worth 1'
    if (n.includes('regional 3') || n.includes('3 in fort worth')) return 'Fort Worth 3'
    return 'Fort Worth'
  }
  if (n.includes('sacramento')) {
    if (n.includes('regional 2') || n.includes('2 in sacramento')) return 'Sacramento 2'
    if (n.includes('regional 4') || n.includes('4 in sacramento')) return 'Sacramento 4'
    return 'Sacramento'
  }
  if (n.includes('phoenix')) return 'Phoenix'
  return ''
}

export async function GET() {
  try {
    // Fetch all tournament dates in parallel
    const responses = await Promise.all(
      TOURNAMENT_DATES.map(date =>
        fetch(`${ESPN_BASE}?groups=100&dates=${date}`, {
          next: { revalidate: 30 }, // cache 30s
        }).then(r => r.json()).catch(() => ({ events: [] }))
      )
    )

    // Flatten all events, deduplicate by event ID
    const seen = new Set<string>()
    const allGames: object[] = []

    for (const data of responses) {
      for (const event of (data.events ?? [])) {
        if (seen.has(event.id)) continue
        seen.add(event.id)

        const comp       = event.competitions[0]
        const home       = comp.competitors.find((c: any) => c.homeAway === 'home')
        const away       = comp.competitors.find((c: any) => c.homeAway === 'away')
        const statusType = event.status?.type?.name ?? 'STATUS_SCHEDULED'
        const noteText   = comp.notes?.[0]?.headline ?? ''

        allGames.push({
          id:        event.id,
          name:      event.name,
          shortName: event.shortName,
          date:      comp.date,
          status:    parseStatus(statusType),
          round:     parseRound(noteText),
          region:    parseRegion(noteText),
          clock:     event.status?.displayClock ?? '',
          period:    event.status?.period ?? 0,
          note:      noteText,
          broadcast: comp.broadcasts?.[0]?.names?.[0] ?? null,
          venue:     comp.venue?.fullName ?? null,
          home: {
            id:           home?.team?.id,
            name:         home?.team?.displayName,
            shortName:    home?.team?.shortDisplayName,
            abbreviation: home?.team?.abbreviation,
            logo:         home?.team?.logo ?? null,
            seed:         home?.curatedRank?.current ?? null,
            score:        parseInt(home?.score ?? '0'),
            winner:       home?.winner ?? false,
          },
          away: {
            id:           away?.team?.id,
            name:         away?.team?.displayName,
            shortName:    away?.team?.shortDisplayName,
            abbreviation: away?.team?.abbreviation,
            logo:         away?.team?.logo ?? null,
            seed:         away?.curatedRank?.current ?? null,
            score:        parseInt(away?.score ?? '0'),
            winner:       away?.winner ?? false,
          },
        })
      }
    }

    // Sort: live first, then upcoming by date, then final
    allGames.sort((a: any, b: any) => {
      const order = { live: 0, upcoming: 1, final: 2 }
      if (order[a.status as keyof typeof order] !== order[b.status as keyof typeof order]) {
        return order[a.status as keyof typeof order] - order[b.status as keyof typeof order]
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return NextResponse.json({ games: allGames, count: allGames.length })

  } catch (err) {
    console.error('ESPN API error:', err)
    return NextResponse.json({ games: [], error: 'Failed to fetch scores' }, { status: 500 })
  }
}
