import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GameChatClient from './GameChatClient'

interface Props {
  params: Promise<{ gameId: string }>
  searchParams: Promise<{ name?: string; round?: string }>
}

export default async function GameChatPage({ params, searchParams }: Props) {
  const { gameId }   = await params
  const { name, round } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/auth/login?redirectTo=/community/game/${gameId}`)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url, instagram, threads, twitter')
    .eq('id', user.id)
    .single()

  const { data: messages } = await supabase
    .from('messages')
    .select(`
      id, content, created_at, reply_to_id, reply_to_content, reply_to_username,
      profiles:user_id (id, username, display_name, avatar_url, instagram, threads, twitter)
    `)
    .eq('game_id', gameId)
    .order('created_at', { ascending: true })
    .limit(100)

  return (
    <GameChatClient
      gameId={gameId}
      gameName={name ?? 'Game Chat'}
      roundLabel={round ? getRoundLabel(Number(round)) : ''}
      currentUser={profile}
      initialMessages={(messages ?? []) as any}
    />
  )
}

function getRoundLabel(round: number): string {
  const labels: Record<number, string> = {
    2: 'Second Round', 3: 'Sweet Sixteen',
    4: 'Elite Eight', 5: 'Final Four', 6: 'Championship',
  }
  return labels[round] ?? ''
}
