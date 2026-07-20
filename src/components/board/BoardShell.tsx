'use client'

import dynamic from 'next/dynamic'
import type { ChessMove, Color } from '@/lib/chess/types'

function BoardLoading() {
  return <div className="h-full w-full animate-pulse bg-[#6e7682]" />
}

const BoardCanvas = dynamic(
  () => import('./BoardCanvas').then((m) => m.BoardCanvas),
  { ssr: false, loading: BoardLoading },
)

type Props = {
  fen: string
  orientation: Color
  interactive: boolean
  lastMove: ChessMove | null
  onMove: (move: ChessMove) => void
  myColor: Color | null
}

export function BoardShell(props: Props) {
  return (
    <div className="h-full w-full">
      <BoardCanvas {...props} />
    </div>
  )
}
