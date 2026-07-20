import { getPieces } from './engine'
import type { Color, PieceSymbol } from './types'

/** Piece values (queen = 8 as requested). Kings ignored. */
export const PIECE_VALUE: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 8,
  k: 0,
}

export type MaterialScore = {
  white: number
  black: number
  /** Positive = white ahead, negative = black ahead. */
  diff: number
}

export function getMaterialScore(fen: string): MaterialScore {
  let white = 0
  let black = 0
  for (const p of getPieces(fen)) {
    const v = PIECE_VALUE[p.type]
    if (p.color === 'w') white += v
    else black += v
  }
  return { white, black, diff: white - black }
}

export function advantageFor(color: Color, score: MaterialScore): number {
  const raw = color === 'w' ? score.diff : -score.diff
  return Math.max(0, raw)
}
