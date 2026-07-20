'use client'

import { useMemo } from 'react'
import { advantageFor, getMaterialScore } from '@/lib/chess/material'

type Props = { fen: string }

/**
 * Flat modern material strip — glued to the board’s right side via BoardStage.
 * Disc = side; gold +N = who is ahead.
 */
export function MaterialMeter({ fen }: Props) {
  const score = useMemo(() => getMaterialScore(fen), [fen])
  const whiteAdv = advantageFor('w', score)
  const blackAdv = advantageFor('b', score)

  return (
    <div className="flex flex-col gap-1.5" aria-label="Material advantage">
      <SidePill side="w" advantage={whiteAdv} />
      <SidePill side="b" advantage={blackAdv} />
    </div>
  )
}

function SidePill({ side, advantage }: { side: 'w' | 'b'; advantage: number }) {
  const ahead = advantage > 0
  const isWhite = side === 'w'

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 transition-opacity ${
        ahead
          ? 'bg-[#1a1510] ring-1 ring-[#c4a35a]/70'
          : 'bg-[#1a1510]/40 opacity-40'
      }`}
      aria-label={
        ahead
          ? `${isWhite ? 'White' : 'Black'} ahead by ${advantage}`
          : `${isWhite ? 'White' : 'Black'}`
      }
    >
      <span
        className={`h-3 w-3 shrink-0 rounded-full ${
          isWhite ? 'bg-[#f3efe6]' : 'border border-[#9a8b78] bg-[#12100e]'
        }`}
      />
      <span
        className={`min-w-[1.75rem] text-right font-serif text-lg leading-none tabular-nums ${
          ahead ? 'text-[#c4a35a]' : 'text-transparent'
        }`}
      >
        {ahead ? `+${advantage}` : '0'}
      </span>
    </div>
  )
}
