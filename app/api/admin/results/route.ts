import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function assertAdmin() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) return null
  return user
}

// GET /api/admin/results — return current tournament results
export async function GET() {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('tournament_results')
    .select('picks, updated_at')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ picks: {}, updated_at: null })
  return NextResponse.json(data)
}

// POST /api/admin/results — save tournament results
export async function POST(req: Request) {
  const user = await assertAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { picks } = await req.json()
  if (!picks || typeof picks !== 'object') {
    return NextResponse.json({ error: 'Invalid picks' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase
    .from('tournament_results')
    .upsert({ id: 1, picks, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
