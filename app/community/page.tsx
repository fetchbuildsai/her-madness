import { createClient } from '@/lib/supabase/server'
import CommunityClient from './CommunityClient'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('id, username, display_name, avatar_url, instagram, threads, twitter').eq('id', user.id).single()
    : { data: null }

  // Load last 50 global messages with poster's profile
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id, content, created_at,
      profiles:user_id (id, username, display_name, avatar_url, instagram, threads, twitter)
    `)
    .is('game_id', null)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <CommunityClient
      currentUser={profile}
      initialMessages={(messages ?? []) as any}
    />
  )
}
