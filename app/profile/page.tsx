import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login?redirectTo=/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: bracket } = await supabase
    .from('brackets')
    .select('score, submitted_at, picks')
    .eq('user_id', user.id)
    .single()

  return (
    <ProfileClient
      profile={profile}
      email={user.email ?? ''}
      bracketScore={bracket?.score ?? 0}
      bracketSubmitted={!!bracket?.submitted_at}
      pickCount={bracket?.picks ? Object.values(bracket.picks as Record<string, number>).filter(Boolean).length : 0}
    />
  )
}
