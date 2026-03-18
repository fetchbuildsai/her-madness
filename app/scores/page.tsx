import { createClient } from '@/lib/supabase/server'
import ScoresClient from './ScoresClient'

export default async function ScoresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('username').eq('id', user.id).single()
    : { data: null }

  return <ScoresClient username={profile?.username ?? undefined} />
}
