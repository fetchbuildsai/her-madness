'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import AppNav from '@/components/AppNav'

interface Profile {
  id: string
  username: string
  display_name: string | null
  bio: string | null
  favorite_team: string | null
  avatar_url: string | null
  instagram: string | null
  tiktok: string | null
  twitter: string | null
  threads: string | null
  linkedin: string | null
}

interface Props {
  profile: Profile | null
  email: string
  bracketScore: number
  bracketSubmitted: boolean
  pickCount: number
}

const SOCIAL_FIELDS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@username', prefix: 'instagram.com/' },
  { key: 'threads',   label: 'Threads',   placeholder: '@username', prefix: 'threads.net/@' },
  { key: 'twitter',   label: 'X / Twitter', placeholder: '@username', prefix: 'x.com/' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: '@username', prefix: 'tiktok.com/@' },
] as const

export default function ProfileClient({ profile, email, bracketScore, bracketSubmitted, pickCount }: Props) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [form, setForm]       = useState({
    display_name: profile?.display_name ?? '',
    bio:          profile?.bio ?? '',
    instagram:    profile?.instagram ?? '',
    threads:      profile?.threads ?? '',
    twitter:      profile?.twitter ?? '',
    tiktok:       profile?.tiktok ?? '',
  })

  const username = profile?.username ?? email.split('@')[0]
  const fullName = profile?.display_name ?? username
  const parts    = fullName.trim().split(/\s+/)
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase()

  async function save() {
    setSaving(true)
    const supabase = createClient()
    await supabase.from('profiles').update({
      display_name: form.display_name || null,
      bio:          form.bio || null,
      instagram:    form.instagram || null,
      threads:      form.threads || null,
      twitter:      form.twitter || null,
      tiktok:       form.tiktok || null,
      updated_at:   new Date().toISOString(),
    }).eq('id', profile!.id)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#09090b]">
      <AppNav username={username} />

      <div className="max-w-lg mx-auto px-4 pt-20 pb-16 sm:pt-24">

        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#d4a017]/20 border-2 border-[#d4a017]/30 flex items-center justify-center shrink-0">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={username} className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-black text-[#d4a017]">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white truncate">
              {profile?.display_name || username}
            </h1>
            <p className="text-sm text-white/40">@{username}</p>
            {profile?.favorite_team && (
              <p className="text-xs text-[#d4a017] mt-0.5">🏀 {profile.favorite_team}</p>
            )}
          </div>
        </div>

        {/* Bio */}
        {profile?.bio && !editing && (
          <p className="text-sm text-white/60 mb-6 leading-relaxed">{profile.bio}</p>
        )}

        {/* Bracket stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Bracket Score', value: bracketScore },
            { label: 'Picks Made',    value: `${pickCount}/63` },
            { label: 'Status',        value: bracketSubmitted ? 'Submitted' : 'In Progress' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#111113] border border-white/[0.07] rounded-xl p-3 text-center">
              <p className="text-lg font-black text-[#d4a017]">{value}</p>
              <p className="text-[10px] text-white/30 mt-0.5 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Social links */}
        {!editing && (
          <div className="mb-6 space-y-2">
            {SOCIAL_FIELDS.map(({ key, label, prefix }) => {
              const val = profile?.[key as keyof Profile] as string | null
              if (!val) return null
              const handle = val.startsWith('@') ? val.slice(1) : val
              return (
                <a
                  key={key}
                  href={`https://${prefix}${handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 bg-[#111113] border border-white/[0.07] rounded-xl hover:border-white/20 transition-colors"
                >
                  <span className="text-xs font-semibold text-white/40 w-20 shrink-0">{label}</span>
                  <span className="text-sm text-white/70 truncate">@{handle}</span>
                </a>
              )
            })}
          </div>
        )}

        {/* Edit form */}
        {editing && (
          <div className="mb-6 space-y-4 bg-[#111113] border border-white/[0.07] rounded-xl p-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Display Name</label>
              <input
                type="text"
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder={username}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#d4a017]/40"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell the Her Madness community about yourself..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#d4a017]/40 resize-none"
              />
            </div>
            {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">{label}</label>
                <input
                  type="text"
                  value={form[key as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#d4a017]/40"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 text-sm font-bold bg-[#d4a017] text-black rounded-lg hover:bg-[#f0c040] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-4 py-2 text-sm font-semibold border border-white/15 text-white/50 rounded-lg hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="w-full py-2.5 text-sm font-semibold border border-white/15 text-white/70 rounded-xl hover:border-white/30 hover:text-white transition-colors"
            >
              Edit Profile
            </button>
          )}
          <Link
            href="/bracket"
            className="block w-full py-2.5 text-sm font-semibold border border-[#d4a017]/30 text-[#d4a017] rounded-xl hover:bg-[#d4a017]/10 transition-colors text-center"
          >
            View My Bracket
          </Link>
          <button
            onClick={signOut}
            className="w-full py-2.5 text-sm font-semibold text-white/25 hover:text-white/50 transition-colors"
          >
            Sign Out
          </button>
        </div>

        {saved && (
          <p className="text-center text-xs text-[#d4a017] mt-4">Profile updated ✓</p>
        )}
      </div>
    </div>
  )
}
