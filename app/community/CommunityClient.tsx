'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'

// ─── Types ───────────────────────────────────────────────────────
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
}

interface Props {
  currentUser: MsgProfile | null
  initialMessages: Message[]
}

// ─── Helpers ─────────────────────────────────────────────────────
function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  })
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
      <img src={profile.avatar_url} alt={profile.username}
        width={size} height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div className="rounded-full bg-[#d4a017]/20 border border-[#d4a017]/20 flex items-center justify-center shrink-0 text-[10px] font-black text-[#d4a017]"
      style={{ width: size, height: size }}>
      {initials}
    </div>
  )
}

function SocialBadge({ profile }: { profile: MsgProfile }) {
  const links = [
    profile.threads   && { label: 'Threads', href: `https://threads.net/@${profile.threads.replace('@','')}` },
    profile.instagram && { label: 'IG',      href: `https://instagram.com/${profile.instagram.replace('@','')}` },
    profile.twitter   && { label: 'X',       href: `https://x.com/${profile.twitter.replace('@','')}` },
  ].filter(Boolean) as { label: string; href: string }[]

  if (!links.length) return null
  return (
    <span className="flex items-center gap-1.5 ml-1">
      {links.map(l => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer"
          className="text-[9px] font-semibold text-white/25 hover:text-[#d4a017] transition-colors">
          {l.label}
        </a>
      ))}
    </span>
  )
}

// ─── Main component ──────────────────────────────────────────────
export default function CommunityClient({ currentUser, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('community-chat')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: 'game_id=is.null' },
        async (payload) => {
          // Fetch the full message with profile
          const { data } = await supabase
            .from('messages')
            .select(`id, content, created_at, profiles:user_id (id, username, display_name, avatar_url, instagram, threads, twitter)`)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setMessages(prev => [...prev, data as unknown as Message])
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !currentUser || sending) return

    setSending(true)
    const content = input.trim()
    setInput('')

    // Optimistic update — show message immediately
    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      profiles: currentUser,
    }
    setMessages(prev => [...prev, optimistic])

    const supabase = createClient()
    await supabase.from('messages').insert({
      user_id: currentUser.id,
      game_id: null,
      content,
    })
    setSending(false)
  }

  return (
    <div className="h-[100dvh] bg-[#09090b] flex flex-col overflow-hidden">
      <AppNav username={currentUser?.username} />

      {/* Header */}
      <div className="pt-24 sm:pt-14 border-b border-white/[0.07] px-4 py-3 bg-[#09090b] sticky top-24 sm:top-14 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-base font-black text-white">Community</h1>
            <p className="text-xs text-white/30">Her Madness · Everyone's invited 🏀</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
            <span className="text-[10px] text-white/30">{messages.length} messages</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-4">

          {messages.length === 0 && (
            <div className="text-center py-16">
              <p className="text-3xl mb-3">🏀</p>
              <p className="text-white/40 font-semibold">Be the first to post!</p>
              <p className="text-white/20 text-sm mt-1">The Her Madness community starts here.</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.profiles?.id === currentUser?.id
            const showAvatar = i === 0 || messages[i - 1]?.profiles?.id !== msg.profiles?.id

            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>

                {/* Avatar */}
                <div className="shrink-0 w-8">
                  {showAvatar && msg.profiles && <Avatar profile={msg.profiles} size={32} />}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {showAvatar && msg.profiles && (
                    <div className={`flex items-center gap-1 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-bold text-white/60">
                        {msg.profiles.display_name ?? msg.profiles.username}
                      </span>
                      {!isMe && <SocialBadge profile={msg.profiles} />}
                      <span className="text-[9px] text-white/20">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-[#d4a017] text-black font-medium rounded-br-sm'
                      : 'bg-[#1c1c1f] text-white/85 rounded-bl-sm border border-white/[0.06]'
                  }`}>
                    {msg.content}
                  </div>
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
            <form onSubmit={sendMessage} className="flex gap-2">
              <Avatar profile={currentUser} size={32} />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Say something..."
                maxLength={500}
                className="flex-1 bg-[#1c1c1f] border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#d4a017]/40"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="px-4 py-2 text-sm font-bold bg-[#d4a017] text-black rounded-full hover:bg-[#f0c040] transition-colors disabled:opacity-40"
              >
                Send
              </button>
            </form>
          ) : (
            <div className="text-center py-2">
              <Link href="/auth/login?redirectTo=/community"
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
