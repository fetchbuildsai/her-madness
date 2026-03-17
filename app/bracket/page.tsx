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

  return (
    <BracketPicker
      userId={user.id}
      username={profile?.username ?? 'You'}
      initialPicks={bracket?.picks ?? {}}
      isLocked={!!bracket?.locked_at}
      isSubmitted={!!bracket?.submitted_at}
    />
  )
}
