import { Chess, type Square as ChessSquare } from 'chess.js'
import { getLegalMoves, tryMove } from './engine'
import { getMaterialScore, PIECE_VALUE } from './material'
import type { ChessMove, Color, PieceSymbol } from './types'

export type BotLevel = 'easy' | 'intermediate' | 'hard' | 'expert'

const CHECKMATE = 10_000
const STALEMATE = 0
const QSEARCH_MAX = 4
/** Expert only fully searches the top-N root moves after a shallow probe. */
const EXPERT_ROOT_CANDIDATES = 8
/** Soft wall-clock budget so Expert stays playable in the browser. */
const EXPERT_TIME_MS = 1_400

type SearchDeadline = { at: number; aborted: boolean }

function pastDeadline(deadline?: SearchDeadline): boolean {
  if (!deadline) return false
  if (performance.now() >= deadline.at) {
    deadline.aborted = true
    return true
  }
  return false
}

/** Prefer captures / promotions so alpha-beta prunes sooner. */
function orderMoves(fen: string, moves: ChessMove[]): ChessMove[] {
  const chess = new Chess(fen)
  return [...moves].sort((a, b) => moveHint(chess, b) - moveHint(chess, a))
}

function moveHint(chess: Chess, move: ChessMove): number {
  const from = chess.get(move.from as ChessSquare)
  const to = chess.get(move.to as ChessSquare)
  let score = 0
  if (to) {
    score += 10 + pieceWeight(to.type as PieceSymbol) * 10
    if (from) score -= pieceWeight(from.type as PieceSymbol)
  }
  if (from?.type === 'p' && move.to[1] === (from.color === 'w' ? '8' : '1')) {
    score += 80
  }
  return score
}

function pieceWeight(type: PieceSymbol): number {
  return PIECE_VALUE[type]
}

/** Capture / EP moves from one Chess instance (fast path for quiescence). */
function captureMoves(fen: string): ChessMove[] {
  const chess = new Chess(fen)
  const caps: ChessMove[] = []
  for (const m of chess.moves({ verbose: true })) {
    if (!m.captured && !m.flags.includes('e')) continue
    caps.push(
      withQueenPromo({
        from: m.from,
        to: m.to,
        promotion: m.promotion as PieceSymbol | undefined,
      }),
    )
  }
  return [...caps].sort((a, b) => moveHint(chess, b) - moveHint(chess, a))
}

/** Static eval from `perspective` — Chess960-safe (no classical king tables). */
export function evaluateFen(fen: string, perspective: Color): number {
  const chess = new Chess(fen)

  if (chess.isCheckmate()) {
    return chess.turn() === perspective ? -CHECKMATE : CHECKMATE
  }
  if (chess.isDraw() || chess.isStalemate()) return STALEMATE

  const { diff } = getMaterialScore(fen)
  const material = perspective === 'w' ? diff : -diff

  const mobility = chess.moves().length * 0.08
  const mobilitySigned = chess.turn() === perspective ? mobility : -mobility

  const checkBonus = chess.isCheck()
    ? chess.turn() === perspective
      ? -0.5
      : 0.5
    : 0

  let bishopsW = 0
  let bishopsB = 0
  for (const row of chess.board()) {
    for (const cell of row) {
      if (!cell || cell.type !== 'b') continue
      if (cell.color === 'w') bishopsW++
      else bishopsB++
    }
  }
  const bishopPair =
    (bishopsW >= 2 ? 0.35 : 0) - (bishopsB >= 2 ? 0.35 : 0)
  const bishopSigned = perspective === 'w' ? bishopPair : -bishopPair

  return material + mobilitySigned + checkBonus + bishopSigned
}

/** Chase captures at leaf so hanging pieces are not missed. */
function quiesce(
  fen: string,
  alpha: number,
  beta: number,
  maximizing: boolean,
  perspective: Color,
  qDepth: number,
  deadline?: SearchDeadline,
): number {
  if (pastDeadline(deadline)) return evaluateFen(fen, perspective)

  const standPat = evaluateFen(fen, perspective)
  if (qDepth >= QSEARCH_MAX) return standPat

  if (maximizing) {
    if (standPat >= beta) return standPat
    alpha = Math.max(alpha, standPat)
  } else {
    if (standPat <= alpha) return standPat
    beta = Math.min(beta, standPat)
  }

  const captures = captureMoves(fen)
  if (captures.length === 0) return standPat

  if (maximizing) {
    let best = standPat
    for (const move of captures) {
      if (pastDeadline(deadline)) break
      const next = tryMove(fen, move)
      if (!next.ok) continue
      const score = quiesce(
        next.fen,
        alpha,
        beta,
        false,
        perspective,
        qDepth + 1,
        deadline,
      )
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return best
  }

  let best = standPat
  for (const move of captures) {
    if (pastDeadline(deadline)) break
    const next = tryMove(fen, move)
    if (!next.ok) continue
    const score = quiesce(
      next.fen,
      alpha,
      beta,
      true,
      perspective,
      qDepth + 1,
      deadline,
    )
    best = Math.min(best, score)
    beta = Math.min(beta, score)
    if (beta <= alpha) break
  }
  return best
}

function minimax(
  fen: string,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  perspective: Color,
  useQuiescence: boolean,
  deadline?: SearchDeadline,
): number {
  if (pastDeadline(deadline)) return evaluateFen(fen, perspective)

  const chess = new Chess(fen)
  if (chess.isGameOver()) return evaluateFen(fen, perspective)

  if (depth === 0) {
    return useQuiescence
      ? quiesce(fen, alpha, beta, maximizing, perspective, 0, deadline)
      : evaluateFen(fen, perspective)
  }

  const moves = orderMoves(fen, uniqueRootMoves(getLegalMoves(fen)))
  if (moves.length === 0) return evaluateFen(fen, perspective)

  if (maximizing) {
    let best = -Infinity
    for (const move of moves) {
      if (pastDeadline(deadline)) break
      const next = tryMove(fen, move)
      if (!next.ok) continue
      const score = minimax(
        next.fen,
        depth - 1,
        alpha,
        beta,
        false,
        perspective,
        useQuiescence,
        deadline,
      )
      best = Math.max(best, score)
      alpha = Math.max(alpha, score)
      if (beta <= alpha) break
    }
    return best === -Infinity ? evaluateFen(fen, perspective) : best
  }

  let best = Infinity
  for (const move of moves) {
    if (pastDeadline(deadline)) break
    const next = tryMove(fen, move)
    if (!next.ok) continue
    const score = minimax(
      next.fen,
      depth - 1,
      alpha,
      beta,
      true,
      perspective,
      useQuiescence,
      deadline,
    )
    best = Math.min(best, score)
    beta = Math.min(beta, score)
    if (beta <= alpha) break
  }
  return best === Infinity ? evaluateFen(fen, perspective) : best
}

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

function scoreRootMoves(
  fen: string,
  moves: ChessMove[],
  plyAfterRoot: number,
  useQuiescence: boolean,
  perspective: Color,
  deadline?: SearchDeadline,
): { move: ChessMove; score: number }[] {
  const scored: { move: ChessMove; score: number }[] = []
  for (const move of moves) {
    if (pastDeadline(deadline)) break
    const next = tryMove(fen, move)
    if (!next.ok) continue
    const score = minimax(
      next.fen,
      plyAfterRoot,
      -Infinity,
      Infinity,
      false,
      perspective,
      useQuiescence,
      deadline,
    )
    // Ignore incomplete root scores if the search was aborted mid-move
    if (deadline?.aborted) break
    scored.push({ move, score })
  }
  return scored
}

function bestFromScored(
  scored: { move: ChessMove; score: number }[],
  fallback: ChessMove[],
): ChessMove | null {
  if (scored.length === 0) return fallback.length ? pickRandom(fallback) : null
  let bestScore = -Infinity
  const bestMoves: ChessMove[] = []
  for (const { move, score } of scored) {
    if (score > bestScore + 1e-9) {
      bestScore = score
      bestMoves.length = 0
      bestMoves.push(move)
    } else if (Math.abs(score - bestScore) <= 1e-9) {
      bestMoves.push(move)
    }
  }
  return pickRandom(bestMoves)
}

/** Easy: uniform random legal move (queen promotions only). */
export function pickEasyMove(fen: string): ChessMove | null {
  const moves = uniqueRootMoves(getLegalMoves(fen))
  if (moves.length === 0) return null
  return pickRandom(moves)
}

/**
 * Search root for best move.
 * `plyAfterRoot` = half-moves after the played root move.
 */
function pickSearchMove(
  fen: string,
  plyAfterRoot: number,
  useQuiescence: boolean,
  opts?: { rootLimit?: number; deadline?: SearchDeadline },
): ChessMove | null {
  const root = uniqueRootMoves(getLegalMoves(fen))
  if (root.length === 0) return null

  const perspective = new Chess(fen).turn() as Color
  let candidates = orderMoves(fen, root)
  const deadline = opts?.deadline

  if (opts?.rootLimit !== undefined && candidates.length > opts.rootLimit) {
    const probe = scoreRootMoves(fen, candidates, 1, useQuiescence, perspective, deadline)
    if (probe.length === 0) return pickRandom(candidates)
    probe.sort((a, b) => b.score - a.score)
    candidates = probe.slice(0, opts.rootLimit).map((p) => p.move)
    if (deadline) deadline.aborted = false
  }

  const scored = scoreRootMoves(
    fen,
    candidates,
    plyAfterRoot,
    useQuiescence,
    perspective,
    deadline,
  )
  return bestFromScored(scored, candidates)
}

/** Intermediate: 2-ply, no quiescence. */
export function pickIntermediateMove(fen: string): ChessMove | null {
  return pickSearchMove(fen, 1, false)
}

/** Hard: 3-ply + capture quiescence. */
export function pickHardMove(fen: string): ChessMove | null {
  return pickSearchMove(fen, 2, true)
}

/**
 * Expert: iterative deepening up to 4-ply on top candidates, time-capped.
 * Last step before Extreme (Stockfish WASM).
 */
export function pickExpertMove(fen: string): ChessMove | null {
  const deadline: SearchDeadline = {
    at: performance.now() + EXPERT_TIME_MS,
    aborted: false,
  }

  let best = pickSearchMove(fen, 1, true)
  if (!best || pastDeadline(deadline)) return best

  deadline.aborted = false
  const hard = pickSearchMove(fen, 2, true, { deadline })
  if (hard && !deadline.aborted) best = hard
  if (pastDeadline(deadline)) return best

  deadline.aborted = false
  const deep = pickSearchMove(fen, 3, true, {
    rootLimit: EXPERT_ROOT_CANDIDATES,
    deadline,
  })
  // Only accept a completed deep iteration
  if (deep && !deadline.aborted) best = deep

  return best
}

export function pickBotMove(fen: string, level: BotLevel): ChessMove | null {
  switch (level) {
    case 'easy':
      return pickEasyMove(fen)
    case 'intermediate':
      return pickIntermediateMove(fen)
    case 'hard':
      return pickHardMove(fen)
    case 'expert':
      return pickExpertMove(fen)
  }
}

/** Minimum think time (ms) so moves never feel instant — all levels. */
const BOT_MIN_THINK_MS = 1_000

/** Soft floor delay; hard/expert search time often exceeds this. */
export function botThinkMs(level: BotLevel): number {
  let base: number
  switch (level) {
    case 'easy':
      base = 1_000 + Math.floor(Math.random() * 400)
      break
    case 'intermediate':
      base = 1_050 + Math.floor(Math.random() * 450)
      break
    case 'hard':
      base = 1_100 + Math.floor(Math.random() * 500)
      break
    case 'expert':
      base = 1_200 + Math.floor(Math.random() * 600)
      break
  }
  return Math.max(BOT_MIN_THINK_MS, base)
}

export function botLevelLabel(level: BotLevel): string {
  switch (level) {
    case 'easy':
      return 'Easy'
    case 'intermediate':
      return 'Intermediate'
    case 'hard':
      return 'Hard'
    case 'expert':
      return 'Expert'
  }
}
