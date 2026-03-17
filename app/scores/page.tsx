import { createClient } from '@/lib/supabase/server'
import ScoresClient from './ScoresClient'

export const revalidate = 30 // revalidate every 30s (real-time handles the rest)

export default async function ScoresPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: games }, { data: profile }] = await Promise.all([
    supabase
      .from('games')
      .select(`
        id, round, region, game_slot,
        team1:teams!games_team1_id_fkey(id, name, seed),
        team2:teams!games_team2_id_fkey(id, name, seed),
        team1_score, team2_score, winner_id, tip_off, status
      `)
      .order('round', { ascending: true })
      .order('tip_off', { ascending: true }),
    user
      ? supabase.from('profiles').select('username').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ])

  return (
    <ScoresClient
      initialGames={(games ?? []) as any}
      username={profile?.username}
    />
  )
}
