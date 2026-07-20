'use client'

import { useMemo } from 'react'
import { advantageFor, getMaterialScore } from '@/lib/chess/material'

type Props = { fen: string }

/** Bottom-right material advantage (+N for the side ahead). */
export function MaterialMeter({ fen }: Props) {
  const score = useMemo(() => getMaterialScore(fen), [fen])
  const whiteAdv = advantageFor('w', score)
  const blackAdv = advantageFor('b', score)

  return (
    <div className="rounded-lg bg-[#1a1510]/75 px-3 py-2 text-sm backdrop-blur-sm">
      <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-[#9a8b78]">Material</p>
      <div className="flex flex-col gap-0.5 text-[#f3efe6]">
        <Row label="White" advantage={whiteAdv} />
        <Row label="Black" advantage={blackAdv} />
      </div>
    </div>
  )
}

function Row({ label, advantage }: { label: string; advantage: number }) {
  return (
    <div className="flex min-w-[7.5rem] items-center justify-between gap-4">
      <span className="text-[#9a8b78]">{label}</span>
      <span className={advantage > 0 ? 'font-semibold text-[#c4a35a]' : 'text-[#6b5e50]'}>
        {advantage > 0 ? `+${advantage}` : '—'}
      </span>
    </div>
  )
}
