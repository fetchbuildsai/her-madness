import { NextResponse } from 'next/server'

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY
const PUBLICATION_ID = 'd3d7b029-0880-4b74-9d5c-13211181850d'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    if (!BEEHIIV_API_KEY) {
      console.error('BEEHIIV_API_KEY not set')
      return NextResponse.json({ error: 'Newsletter not configured' }, { status: 500 })
    }

    const res = await fetch(
      `https://api.beehiiv.com/v2/publications/${PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: true,
          utm_source: 'her-madness',
          utm_medium: 'signup',
          utm_campaign: 'march-madness-2026',
          tags: ['her-madness', 'wbb-fan', 'march-madness-2026'],
        }),
      }
    )

    if (!res.ok) {
      const err = await res.text()
      console.error('Beehiiv error:', err)
      // Don't fail the user signup over this — just log it
      return NextResponse.json({ success: false, error: 'Beehiiv error' }, { status: 200 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Newsletter route error:', err)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}
