import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BracketPicker from './BracketPicker'

export default async function BracketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/bracket')

  // User's bracket + profile in parallel
  const [
    { data: bracket },
    { data: profile },
    { data: allBrackets },
  ] = await Promise.all([
    supabase.from('brackets').select('picks, submitted_at, locked_at').eq('user_id', user.id).single(),
    supabase.from('profiles').select('username').eq('id', user.id).single(),
    supabase.from('brackets').select('picks'),
  ])

  // Auto-lock at March 20, 2026 12:00 PM EDT (16:00 UTC)
  const LOCK_TIME = new Date('2026-03-20T16:00:00Z')
  const isLocked  = !!bracket?.locked_at || new Date() >= LOCK_TIME

  // Compute pick statistics — how many users picked each team per slot
  // Only include brackets with at least some picks
  const pickStats: Record<string, Record<number, number>> = {}
  const totalBrackets = allBrackets?.filter(b => b.picks && Object.keys(b.picks).length > 0).length ?? 0

  allBrackets?.forEach(b => {
    if (!b.picks) return
    Object.entries(b.picks as Record<string, number>).forEach(([key, teamId]) => {
      if (!teamId) return
      if (!pickStats[key]) pickStats[key] = {}
      pickStats[key][teamId] = (pickStats[key][teamId] ?? 0) + 1
    })
  })

  return (
    <BracketPicker
      userId={user.id}
      username={profile?.username ?? 'You'}
      initialPicks={bracket?.picks ?? {}}
      isLocked={isLocked}
      isSubmitted={!!bracket?.submitted_at}
      pickStats={pickStats}
      totalBrackets={totalBrackets}
    />
  )
}
