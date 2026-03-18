import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BracketPicker from './BracketPicker'

export default async function BracketPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirectTo=/bracket')
  }

  // Load existing bracket picks if any
  const { data: bracket } = await supabase
    .from('brackets')
    .select('picks, submitted_at, locked_at')
    .eq('user_id', user.id)
    .single()

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  // Auto-lock at March 20, 2026 11:00 AM EDT (15:00 UTC)
  const LOCK_TIME = new Date('2026-03-20T15:00:00Z')
  const isLocked = !!bracket?.locked_at || new Date() >= LOCK_TIME

  return (
    <BracketPicker
      userId={user.id}
      username={profile?.username ?? 'You'}
      initialPicks={bracket?.picks ?? {}}
      isLocked={isLocked}
      isSubmitted={!!bracket?.submitted_at}
    />
  )
}
