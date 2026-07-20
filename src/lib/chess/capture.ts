import type { BoardPiece } from './engine'
import type { ChessMove } from './types'

/** Resolve which piece was taken by lastMove (incl. en passant). */
export function findCapturedPiece(
  prev: BoardPiece[],
  next: BoardPiece[],
  move: ChessMove,
): BoardPiece | null {
  const onTo = prev.find((p) => p.square === move.to)
  if (onTo) return onTo

  // En passant: victim sits behind the landing square
  const mover = prev.find((p) => p.square === move.from)
  if (mover?.type !== 'p') return null

  const toRank = Number(move.to[1])
  const victimRank = mover.color === 'w' ? toRank - 1 : toRank + 1
  const epSquare = `${move.to[0]}${victimRank}`
  const victim = prev.find(
    (p) => p.square === epSquare && p.type === 'p' && p.color !== mover.color,
  )
  if (!victim) return null
  if (next.some((p) => p.square === epSquare)) return null
  return victim
}
