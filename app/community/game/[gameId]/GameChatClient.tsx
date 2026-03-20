'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'

interface MsgProfile {
  id: string
  username: string
  display_name: string | null
  avatar_url: string | null
  instagram: string | null
  threads: string | null
  twitter: string | null
}

interface Message {
  id: string
  content: string
  created_at: string
  profiles: MsgProfile
  reply_to_id?: string | null
  reply_to_content?: string | null
  reply_to_username?: string | null
}

interface Reaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
}

interface Props {
  gameId: string
  gameName: string
  roundLabel: string
  currentUser: MsgProfile | null
  initialMessages: Message[]
}

const REACTION_EMOJIS = ['🏀', '❤️', '🔥', '😂']

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function Avatar({ profile, size = 32 }: { profile: MsgProfile; size?: number }) {
  const fullName = profile.display_name ?? profile.username
  const parts    = fullName.trim().split(/\s+/)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase()
  if (profile.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={profile.avatar_url} alt={profile.username} width={size} height={size}
        className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
    )
  }
  return (
    <div className="rounded-full bg-[#d4a017]/20 border border-[#d4a017]/20 flex items-center justify-center shrink-0 text-[10px] font-black text-[#d4a017]"
      style={{ width: size, height: size }}>
      {initials}
    </div>
  )
}

export default function GameChatClient({ gameId, gameName, roundLabel, currentUser, initialMessages }: Props) {
  const [messages, setMessages]     = useState<Message[]>(initialMessages)
  const [reactions, setReactions]   = useState<Record<string, Reaction[]>>({})
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [replyTo, setReplyTo]       = useState<Message | null>(null)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Load initial reactions
  useEffect(() => {
    if (!initialMessages.length) return
    const supabase = createClient()
    const ids = initialMessages.map(m => m.id)
    supabase.from('message_reactions').select('*').in('message_id', ids).then(({ data }) => {
      if (!data) return
      const map: Record<string, Reaction[]> = {}
      data.forEach(r => {
        if (!map[r.message_id]) map[r.message_id] = []
        map[r.message_id].push(r)
      })
      setReactions(map)
    })
  }, [initialMessages])

  // Scroll to bottom on new messages
  const prevLenRef = useRef(initialMessages.length)
  useEffect(() => {
    if (messages.length > prevLenRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLenRef.current = messages.length
  }, [messages])

  // Real-time
  useEffect(() => {
    const supabase = createClient()

    const msgChannel = supabase
      .channel(`game-chat-${gameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        if (payload.new.game_id !== gameId) return
        const { data } = await supabase
          .from('messages')
          .select(`id, content, created_at, reply_to_id, reply_to_content, reply_to_username, profiles:user_id (id, username, display_name, avatar_url, instagram, threads, twitter)`)
          .eq('id', payload.new.id)
          .single()
        if (data) setMessages(prev => [...prev, data as unknown as Message])
      })
      .subscribe()

    const rxChannel = supabase
      .channel(`game-reactions-${gameId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'message_reactions' }, (payload) => {
        const r = payload.new as Reaction
        setReactions(prev => ({ ...prev, [r.message_id]: [...(prev[r.message_id] ?? []), r] }))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'message_reactions' }, (payload) => {
        const r = payload.old as Reaction
        setReactions(prev => ({ ...prev, [r.message_id]: (prev[r.message_id] ?? []).filter(x => x.id !== r.id) }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(rxChannel)
    }
  }, [gameId])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !currentUser || sending) return
    setSending(true)
    const content = input.trim()
    const replyContext = replyTo ? {
      reply_to_id: replyTo.id,
      reply_to_content: replyTo.content,
      reply_to_username: replyTo.profiles?.display_name ?? replyTo.profiles?.username ?? 'someone',
    } : {}
    setInput('')
    setReplyTo(null)
    setMessages(prev => [...prev, {
      id: `optimistic-${Date.now()}`, content,
      created_at: new Date().toISOString(), profiles: currentUser, ...replyContext,
    }])
    const supabase = createClient()
    await supabase.from('messages').insert({ user_id: currentUser.id, game_id: gameId, content, ...replyContext })
    setSending(false)
  }

  async function toggleReaction(messageId: string, emoji: string) {
    if (!currentUser) return
    const supabase = createClient()
    const existing = (reactions[messageId] ?? []).find(r => r.user_id === currentUser.id && r.emoji === emoji)
    if (existing) {
      setReactions(prev => ({ ...prev, [messageId]: (prev[messageId] ?? []).filter(r => r.id !== existing.id) }))
      await supabase.from('message_reactions').delete().eq('id', existing.id)
    } else {
      const opt: Reaction = { id: `opt-${Date.now()}`, message_id: messageId, user_id: currentUser.id, emoji }
      setReactions(prev => ({ ...prev, [messageId]: [...(prev[messageId] ?? []), opt] }))
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: currentUser.id, emoji })
    }
    setShowReactions(null)
  }

  return (
    <div className="h-[100dvh] bg-[#09090b] flex flex-col overflow-hidden">
      <AppNav username={currentUser?.username} />

      {/* Header */}
      <div className="pt-24 sm:pt-14 border-b border-white/[0.07] px-4 py-3 bg-[#09090b] sticky top-24 sm:top-14 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-0.5">
            <Link href="/community" className="text-white/30 hover:text-white/60 text-xs transition-colors">← Community</Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-black text-white truncate">{gameName}</h1>
              <p className="text-xs text-white/30">{roundLabel} · Game Chat 🏀</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
              <span className="text-[10px] text-white/30">{messages.length} messages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4" onClick={() => setShowReactions(null)}>
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🏀</p>
              <p className="text-white/40 font-semibold">No messages yet — be the first!</p>
              <p className="text-white/20 text-sm mt-1">Game chat opens for Round 2+</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.profiles?.id === currentUser?.id
            const showAvatar = i === 0 || messages[i - 1]?.profiles?.id !== msg.profiles?.id
            const msgReactions = reactions[msg.id] ?? []
            const reactionGroups: Record<string, { count: number; iMine: boolean }> = {}
            msgReactions.forEach(r => {
              if (!reactionGroups[r.emoji]) reactionGroups[r.emoji] = { count: 0, iMine: false }
              reactionGroups[r.emoji].count++
              if (r.user_id === currentUser?.id) reactionGroups[r.emoji].iMine = true
            })

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className="shrink-0 w-8">
                  {showAvatar && msg.profiles && <Avatar profile={msg.profiles} size={32} />}
                </div>
                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && msg.profiles && (
                    <div className={`flex items-center gap-1 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-white/60">{msg.profiles.display_name ?? msg.profiles.username}</span>
                      <span className="text-[9px] text-white/20">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  {msg.reply_to_id && msg.reply_to_content && (
                    <div className="mb-1 px-2 py-1 rounded-lg border-l-2 border-[#d4a017]/50 bg-white/[0.04] max-w-full">
                      <p className="text-[10px] text-[#d4a017]/70 font-semibold mb-0.5">↩ {msg.reply_to_username}</p>
                      <p className="text-[11px] text-white/40 truncate">{msg.reply_to_content}</p>
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe ? 'bg-[#d4a017] text-black font-medium rounded-br-sm'
                           : 'bg-[#1c1c1f] text-white/85 rounded-bl-sm border border-white/[0.06]'
                    }`}>
                      {msg.content}
                    </div>
                    {currentUser && !msg.id.startsWith('optimistic') && (
                      <div className="relative">
                        <button
                          onClick={e => { e.stopPropagation(); setShowReactions(showReactions === msg.id ? null : msg.id) }}
                          className="text-white/20 hover:text-white/50 transition-colors text-base leading-none px-1"
                        >···</button>
                        {showReactions === msg.id && (
                          <div onClick={e => e.stopPropagation()}
                            className={`absolute bottom-8 z-20 bg-[#1c1c1f] border border-white/10 rounded-2xl p-2 shadow-xl flex flex-col gap-1.5 ${isMe ? 'right-0' : 'left-0'}`}>
                            <div className="flex gap-1">
                              {REACTION_EMOJIS.map(emoji => (
                                <button key={emoji} onClick={() => toggleReaction(msg.id, emoji)}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition-all hover:scale-110 ${
                                    reactionGroups[emoji]?.iMine ? 'bg-[#d4a017]/20 border border-[#d4a017]/40' : 'hover:bg-white/10'
                                  }`}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                            <button onClick={() => { setReplyTo(msg); setShowReactions(null); inputRef.current?.focus() }}
                              className="flex items-center gap-2 px-2 py-1.5 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors">
                              ↩ Reply
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {Object.keys(reactionGroups).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                      {Object.entries(reactionGroups).map(([emoji, { count, iMine }]) => (
                        <button key={emoji} onClick={() => currentUser && toggleReaction(msg.id, emoji)}
                          className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs transition-all ${
                            iMine ? 'bg-[#d4a017]/20 border border-[#d4a017]/40 text-[#d4a017]'
                                  : 'bg-white/[0.06] border border-white/10 text-white/50 hover:border-white/20'
                          }`}>
                          <span>{emoji}</span><span className="font-semibold">{count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.07] px-4 py-3 pb-safe bg-[#09090b]">
        <div className="max-w-2xl mx-auto">
          {currentUser ? (
            <div className="flex flex-col gap-2">
              {replyTo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-white/[0.04] border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[#d4a017] text-xs shrink-0">↩ {replyTo.profiles?.display_name ?? replyTo.profiles?.username}</span>
                    <span className="text-white/30 text-xs truncate">{replyTo.content}</span>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="text-white/30 hover:text-white/60 ml-2 shrink-0 text-lg leading-none">×</button>
                </div>
              )}
              <form onSubmit={sendMessage} className="flex gap-2">
                <Avatar profile={currentUser} size={32} />
                <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                  placeholder={replyTo ? `Reply to ${replyTo.profiles?.username}...` : 'Talk about this game...'}
                  maxLength={500}
                  className="flex-1 bg-[#1c1c1f] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#d4a017]/40"
                />
                <button type="submit" disabled={!input.trim() || sending}
                  className="px-4 py-2 text-sm font-bold bg-[#d4a017] text-black rounded-full hover:bg-[#f0c040] transition-colors disabled:opacity-40">
                  Send
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-2">
              <Link href={`/auth/login?redirectTo=/community/game/${gameId}`}
                className="text-sm font-semibold text-[#d4a017] hover:text-[#f0c040] transition-colors">
                Sign in to join the chat →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
