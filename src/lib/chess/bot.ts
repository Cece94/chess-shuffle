import { Chess, type Square as ChessSquare } from 'chess.js'
import { getLegalMoves, tryMove } from './engine'
import { getMaterialScore } from './material'
import type { ChessMove, Color, PieceSymbol } from './types'

export type BotLevel = 'easy' | 'intermediate'

const CHECKMATE = 10_000
const STALEMATE = 0

/** Prefer captures / checks first so alpha-beta prunes sooner. */
function orderMoves(fen: string, moves: ChessMove[]): ChessMove[] {
  const chess = new Chess(fen)
  return [...moves].sort((a, b) => moveHint(chess, b) - moveHint(chess, a))
}

function moveHint(chess: Chess, move: ChessMove): number {
  const from = chess.get(move.from as ChessSquare)
  const to = chess.get(move.to as ChessSquare)
  let score = 0
  if (to) score += 10 + pieceWeight(to.type as PieceSymbol)
  if (from?.type === 'p' && move.to[1] === (from.color === 'w' ? '8' : '1')) {
    score += 8
  }
  return score
}

function pieceWeight(type: PieceSymbol): number {
  switch (type) {
    case 'q':
      return 8
    case 'r':
      return 5
    case 'b':
    case 'n':
      return 3
    case 'p':
      return 1
    default:
      return 0
  }
}

/** Static eval in centipawn-ish units from `perspective`'s point of view. */
export function evaluateFen(fen: string, perspective: Color): number {
  const chess = new Chess(fen)

  if (chess.isCheckmate()) {
    // Side to move is mated → good for the other side
    return chess.turn() === perspective ? -CHECKMATE : CHECKMATE
  }
  if (chess.isDraw() || chess.isStalemate()) return STALEMATE

  const { diff } = getMaterialScore(fen)
  const material = perspective === 'w' ? diff : -diff

  // Light mobility term (own legal moves − opponent's after null-side swap is expensive;
  // approximate with side-to-move mobility only, signed by who moves).
  const mobility = chess.moves().length * 0.05
  const mobilitySigned = chess.turn() === perspective ? mobility : -mobility

  const checkBonus = chess.isCheck()
    ? chess.turn() === perspective
      ? -0.4
      : 0.4
    : 0

  return material + mobilitySigned + checkBonus
}

function minimax(
  fen: string,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  perspective: Color,
): number {
  const chess = new Chess(fen)
  if (depth === 0 || chess.isGameOver()) {
    return evaluateFen(fen, perspective)
  }

  const moves = orderMoves(fen, getLegalMoves(fen))
  if (moves.length === 0) return evaluateFen(fen, perspective)

  if (maximizing) {
    let best = -Infinity
    for (const move of moves) {
      const next = tryMove(fen, withQueenPromo(move))
      if (!next.ok) continue
      const score = minimax(next.fen, depth - 1, alpha, beta, false, perspective)
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return best
  }

  let best = Infinity
  for (const move of moves) {
    const next = tryMove(fen, withQueenPromo(move))
    if (!next.ok) continue
    const score = minimax(next.fen, depth - 1, alpha, beta, true, perspective)
    best = Math.min(best, score)
    beta = Math.min(beta, score)
    if (beta <= alpha) break
  }
  return best
}

/** Collapse underpromotions to queen for search / play. */
function withQueenPromo(move: ChessMove): ChessMove {
  if (!move.promotion) return move
  return { ...move, promotion: 'q' }
}

function uniqueRootMoves(moves: ChessMove[]): ChessMove[] {
  const seen = new Set<string>()
  const out: ChessMove[] = []
  for (const m of moves) {
    const key = `${m.from}${m.to}${m.promotion ? 'q' : ''}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(withQueenPromo(m))
  }
  return out
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!
}

/** Easy: uniform random legal move (queen promotions only). */
export function pickEasyMove(fen: string): ChessMove | null {
  const moves = uniqueRootMoves(getLegalMoves(fen))
  if (moves.length === 0) return null
  return pickRandom(moves)
}

/**
 * Intermediate: depth-2 alpha-beta on material + light mobility.
 * Chess960-safe: no classical king-square tables.
 */
export function pickIntermediateMove(fen: string): ChessMove | null {
  const root = uniqueRootMoves(getLegalMoves(fen))
  if (root.length === 0) return null

  const perspective = new Chess(fen).turn() as Color
  const ordered = orderMoves(fen, root)

  let bestScore = -Infinity
  const bestMoves: ChessMove[] = []

  for (const move of ordered) {
    const next = tryMove(fen, move)
    if (!next.ok) continue
    const score = minimax(next.fen, 1, -Infinity, Infinity, false, perspective)
    if (score > bestScore + 1e-9) {
      bestScore = score
      bestMoves.length = 0
      bestMoves.push(move)
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      bestMoves.push(move)
    }
  }

  return bestMoves.length ? pickRandom(bestMoves) : pickRandom(ordered)
}

export function pickBotMove(fen: string, level: BotLevel): ChessMove | null {
  return level === 'easy' ? pickEasyMove(fen) : pickIntermediateMove(fen)
}

/** Thinking delay so the board can animate / feel less instant. */
export function botThinkMs(level: BotLevel): number {
  if (level === 'easy') return 350 + Math.floor(Math.random() * 350)
  return 550 + Math.floor(Math.random() * 450)
}
