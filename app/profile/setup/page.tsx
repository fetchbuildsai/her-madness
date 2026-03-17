'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const WBB_TEAMS = [
  'South Carolina', 'UCLA', 'UConn', 'Notre Dame', 'Texas', 'LSU',
  'Iowa', 'Tennessee', 'NC State', 'Kansas State', 'Duke', 'Ohio State',
  'Indiana', 'Baylor', 'Georgia', 'Maryland', 'Oregon', 'Michigan',
  'Arizona', 'Ole Miss', 'Other / No favorite yet'
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favoriteTeam, setFavoriteTeam] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    const formData = new FormData(e.currentTarget)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        display_name: formData.get('display_name') as string || null,
        bio: formData.get('bio') as string || null,
        favorite_team: favoriteTeam || null,
        instagram: formData.get('instagram') as string || null,
        tiktok: formData.get('tiktok') as string || null,
        twitter: formData.get('twitter') as string || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/bracket')
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <span className="text-2xl">🏀</span>
            <span className="font-black text-xl tracking-widest text-[#d4a017]">HER MADNESS</span>
          </Link>
          <h1 className="text-2xl font-black text-[#fafafa] mb-2">Set up your profile</h1>
          <p className="text-sm text-[#71717a]">Tell the community who you are. You can always update this later.</p>
        </div>

        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6">

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                Display name <span className="text-[#52525b] font-normal">(optional)</span>
              </label>
              <input
                name="display_name"
                type="text"
                placeholder="Nicole Fetchko"
                maxLength={50}
                className="w-full px-4 py-3 bg-[#09090b] border border-[#3f3f46] rounded-xl text-[#fafafa] placeholder-[#52525b] text-sm focus:outline-none focus:border-[#d4a017] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-1.5">
                Bio <span className="text-[#52525b] font-normal">(optional)</span>
              </label>
              <textarea
                name="bio"
                placeholder="WBB fan since forever. Don't @ me about your bracket."
                maxLength={160}
                rows={3}
                className="w-full px-4 py-3 bg-[#09090b] border border-[#3f3f46] rounded-xl text-[#fafafa] placeholder-[#52525b] text-sm focus:outline-none focus:border-[#d4a017] transition-colors resize-none"
              />
            </div>

            {/* Favorite team */}
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                Favorite team <span className="text-[#52525b] font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {WBB_TEAMS.map((team) => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setFavoriteTeam(favoriteTeam === team ? '' : team)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      favoriteTeam === team
                        ? 'bg-[#d4a017] text-[#09090b]'
                        : 'bg-[#09090b] border border-[#3f3f46] text-[#71717a] hover:border-[#d4a017]/40 hover:text-[#a1a1aa]'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>

            {/* Social links */}
            <div>
              <label className="block text-sm font-medium text-[#a1a1aa] mb-3">
                Social links <span className="text-[#52525b] font-normal">(optional — handles only)</span>
              </label>
              <div className="space-y-2.5">
                {[
                  { name: 'instagram', label: 'Instagram', placeholder: 'nicole.fetchko' },
                  { name: 'tiktok', label: 'TikTok', placeholder: 'nicole.fetchko' },
                  { name: 'twitter', label: 'X / Twitter', placeholder: 'nicolefetchko' },
                ].map((social) => (
                  <div key={social.name} className="flex items-center gap-3">
                    <span className="text-xs text-[#52525b] w-20 shrink-0">{social.label}</span>
                    <input
                      name={social.name}
                      type="text"
                      placeholder={social.placeholder}
                      className="flex-1 px-3 py-2.5 bg-[#09090b] border border-[#3f3f46] rounded-xl text-[#fafafa] placeholder-[#52525b] text-sm focus:outline-none focus:border-[#d4a017] transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#d4a017] text-[#09090b] font-bold rounded-xl hover:bg-[#f0c040] transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Profile → Fill My Bracket'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-[#52525b] mt-4">
          <button
            onClick={() => router.push('/bracket')}
            className="hover:text-[#71717a] transition-colors"
          >
            Skip for now — fill my bracket first
          </button>
        </p>
      </div>
    </div>
  )
}
