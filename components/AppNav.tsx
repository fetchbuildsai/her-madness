'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Props {
  username?: string
}

const NAV_LINKS = [
  { href: '/bracket',     label: 'Bracket' },
  { href: '/scores',      label: 'Scores' },
  { href: '/leaderboard', label: 'Leaderboard' },
]

export default function AppNav({ username }: Props) {
  const pathname = usePathname()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span>🏀</span>
            <span className="font-black text-sm tracking-widest text-[#d4a017]">HER MADNESS</span>
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  pathname === href
                    ? 'text-white bg-white/[0.06]'
                    : 'text-[#71717a] hover:text-[#a1a1aa]'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/community" className={`text-xs font-semibold transition-colors ${
            pathname === '/community' ? 'text-white' : 'text-[#71717a] hover:text-[#a1a1aa]'
          }`}>Chat</Link>
          {username && (
            <Link href="/profile" className="text-xs font-semibold text-[#71717a] hover:text-[#d4a017] transition-colors">
              @{username}
            </Link>
          )}
        </div>
      </div>
      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-[#1c1c1f] px-2 pb-1 pt-1 gap-1">
        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              pathname === href
                ? 'text-white bg-white/[0.06]'
                : 'text-[#71717a] hover:text-[#a1a1aa]'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
