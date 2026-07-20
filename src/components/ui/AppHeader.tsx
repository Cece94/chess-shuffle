'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AppHeader() {
  const pathname = usePathname()
  // In-game: leave via "Back to lobby" only — title is not a home link
  const inGame = pathname.startsWith('/game/')

  const titleClass =
    'font-serif text-xl tracking-tight text-[#f3efe6] sm:text-2xl'

  return (
    <header className="relative z-50 shrink-0 border-b border-[#3d342c]/80 bg-[#1a1510]/95 backdrop-blur-sm">
      <div className="flex h-14 items-center px-4 sm:px-6">
        {inGame ? (
          <span className={titleClass}>Chess Shuffle</span>
        ) : (
          <Link
            href="/"
            className={`${titleClass} transition-colors hover:text-[#c4a35a]`}
          >
            Chess Shuffle
          </Link>
        )}
      </div>
    </header>
  )
}
