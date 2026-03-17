import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 2026 NCAA Women's Tournament — confirmed round dates (ET)
interface CalEvent { name: string; start: string; end: string; location: string; description?: string }

const ROUND_SCHEDULE: CalEvent[] = [
  { name: 'First Four — Game 1 (Nebraska vs Richmond)', start: '20260318T190000', end: '20260318T210000', location: 'TBD' },
  { name: 'First Four — Game 2 (Missouri State vs SFA)', start: '20260318T210000', end: '20260318T230000', location: 'TBD' },
  { name: 'First Four — Game 3 (Southern vs Samford)',   start: '20260319T190000', end: '20260319T210000', location: 'TBD' },
  { name: 'First Four — Game 4 (Virginia vs Arizona St)',start: '20260319T210000', end: '20260319T230000', location: 'TBD' },
  { name: '🏀 First Round — Day 1 (Women\'s March Madness)', start: '20260320T120000', end: '20260320T235900', location: 'Multiple sites' },
  { name: '🏀 First Round — Day 2 (Women\'s March Madness)', start: '20260321T120000', end: '20260321T235900', location: 'Multiple sites' },
  { name: '🏀 Second Round — Day 1 (Women\'s March Madness)', start: '20260322T120000', end: '20260322T235900', location: 'Multiple sites' },
  { name: '🏀 Second Round — Day 2 (Women\'s March Madness)', start: '20260323T120000', end: '20260323T235900', location: 'Multiple sites' },
  { name: '🏀 Sweet Sixteen — Day 1', start: '20260327T120000', end: '20260327T235900', location: 'Fort Worth, TX & Sacramento, CA' },
  { name: '🏀 Sweet Sixteen — Day 2', start: '20260328T120000', end: '20260328T235900', location: 'Fort Worth, TX & Sacramento, CA' },
  { name: '🏀 Elite Eight — Day 1', start: '20260329T120000', end: '20260329T235900', location: 'Fort Worth, TX & Sacramento, CA' },
  { name: '🏀 Elite Eight — Day 2', start: '20260330T120000', end: '20260330T235900', location: 'Fort Worth, TX & Sacramento, CA' },
  { name: '🏀 Final Four — Game 1', start: '20260403T180000', end: '20260403T210000', location: 'Phoenix, AZ — Mortgage Matchup Center' },
  { name: '🏀 Final Four — Game 2', start: '20260405T180000', end: '20260405T210000', location: 'Phoenix, AZ — Mortgage Matchup Center' },
  { name: '🏆 National Championship — Women\'s March Madness', start: '20260407T200000', end: '20260407T230000', location: 'Phoenix, AZ — Mortgage Matchup Center' },
]

function formatICSDate(dt: string) {
  return dt // already in ICS format: YYYYMMDDTHHMMSS
}

function escapeICS(str: string) {
  return str.replace(/,/g, '\\,').replace(/;/g, '\\;').replace(/\n/g, '\\n')
}

function buildICS(events: Array<{ name: string; start: string; end: string; location: string; description?: string }>) {
  const now = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Her Madness//WBB Tournament 2026//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:HER MADNESS — 2026 Women\'s Tournament',
    'X-WR-CALDESC:2026 NCAA Women\'s Basketball Tournament schedule',
    'X-WR-TIMEZONE:America/New_York',
  ]

  events.forEach((evt, i) => {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:hermadness-2026-${i}@hermadness.com`)
    lines.push(`DTSTAMP:${now}`)
    lines.push(`DTSTART;TZID=America/New_York:${formatICSDate(evt.start)}`)
    lines.push(`DTEND;TZID=America/New_York:${formatICSDate(evt.end)}`)
    lines.push(`SUMMARY:${escapeICS(evt.name)}`)
    lines.push(`LOCATION:${escapeICS(evt.location)}`)
    lines.push(`DESCRIPTION:${escapeICS(evt.description ?? 'hermadness.com — 2026 NCAA Women\'s Tournament')}`)
    lines.push('STATUS:CONFIRMED')
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

// GET /api/calendar — download full tournament schedule
export async function GET() {
  const ics = buildICS(ROUND_SCHEDULE)

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="her-madness-2026-tournament.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

// POST /api/calendar — generate personalized calendar for a user's bracket picks
export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    const supabase = await createClient()

    // Get user's bracket + profile
    const [{ data: bracket }, { data: profile }] = await Promise.all([
      supabase.from('brackets').select('picks').eq('user_id', userId).single(),
      supabase.from('profiles').select('username').eq('id', userId).single(),
    ])

    // Get games with tip-off times (once populated)
    const { data: games } = await supabase
      .from('games')
      .select('*, team1:teams!games_team1_id_fkey(name), team2:teams!games_team2_id_fkey(name)')
      .not('tip_off', 'is', null)
      .order('tip_off')

    const events: CalEvent[] = [...ROUND_SCHEDULE]

    // Add specific game events where we have tip-off times
    if (games && games.length > 0) {
      games.forEach((game) => {
        if (!game.tip_off) return
        const start = new Date(game.tip_off)
        const end = new Date(start.getTime() + 2 * 60 * 60 * 1000) // +2 hours

        const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15)

        events.push({
          name: `${game.team1?.name ?? 'TBD'} vs ${game.team2?.name ?? 'TBD'}`,
          start: fmt(start),
          end: fmt(end),
          location: game.region ?? 'TBD',
          description: `Round ${game.round} · hermadness.com`,
        })
      })
    }

    const username = profile?.username ?? 'Your'
    const ics = buildICS(events)

    return new NextResponse(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${username}-her-madness-bracket.ics"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 })
  }
}
