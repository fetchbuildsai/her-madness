import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from './LeaderboardClient'

export const revalidate = 60

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: entries, count }, { data: profile }] = await Promise.all([
    supabase
      .from('brackets')
      .select('user_id, score, submitted_at, picks, profile:profiles(username, display_name, favorite_team)', { count: 'exact' })
      .not('submitted_at', 'is', null)
      .order('score', { ascending: false })
      .order('submitted_at', { ascending: true })
      .limit(200),
    user
      ? supabase.from('profiles').select('username').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <LeaderboardClient
      initialEntries={(entries ?? []) as any}
      currentUserId={user?.id}
      username={profile?.username}
      totalSubmitted={count ?? 0}
    />
  )
}
