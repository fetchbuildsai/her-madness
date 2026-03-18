import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { calculateScore } from '@/lib/tournament/scoring'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/admin/recalculate — recalculate scores for all brackets
export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const svc = serviceClient()

  // Fetch actual results
  const { data: resultsRow } = await svc
    .from('tournament_results')
    .select('picks')
    .eq('id', 1)
    .single()

  const results: Record<string, number> = resultsRow?.picks ?? {}
  if (Object.keys(results).length === 0) {
    return NextResponse.json({ error: 'No results entered yet' }, { status: 400 })
  }

  // Fetch all brackets
  const { data: brackets, error } = await svc
    .from('brackets')
    .select('user_id, picks')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Recalculate each score and batch update
  let updated = 0
  for (const bracket of (brackets ?? [])) {
    const score = calculateScore(
      bracket.picks as Record<string, number> ?? {},
      results
    )
    await svc
      .from('brackets')
      .update({ score, updated_at: new Date().toISOString() })
      .eq('user_id', bracket.user_id)
    updated++
  }

  return NextResponse.json({ ok: true, updated, resultsCount: Object.keys(results).length })
}
