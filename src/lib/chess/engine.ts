import { Chess, type Square as ChessSquare } from 'chess.js'
import type { ChessMove, Color, GameOverReason, PieceSymbol } from './types'

export type BoardPiece = {
  square: string
  type: PieceSymbol
  color: Color
}

export type EngineSnapshot = {
  fen: string
  turn: Color
  isCheck: boolean
  isGameOver: boolean
  winner: Color | 'draw' | null
  reason: GameOverReason | null
}

export function createEngine(fen: string): Chess {
  return new Chess(fen)
}

export function getPieces(fen: string): BoardPiece[] {
  const chess = new Chess(fen)
  const board = chess.board()
  const pieces: BoardPiece[] = []

  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue
      pieces.push({
        square: cell.square,
        type: cell.type as PieceSymbol,
        color: cell.color as Color,
      })
    }
  }
  return pieces
}

export function getLegalMoves(fen: string, from?: string): ChessMove[] {
  const chess = new Chess(fen)
  const verbose = from
    ? chess.moves({ square: from as ChessSquare, verbose: true })
    : chess.moves({ verbose: true })

  return verbose.map((m) => ({
    from: m.from,
    to: m.to,
    promotion: m.promotion as PieceSymbol | undefined,
  }))
}

export function tryMove(
  fen: string,
  move: ChessMove,
): { ok: true; fen: string; snapshot: EngineSnapshot } | { ok: false; error: string } {
  try {
    const chess = new Chess(fen)
    const result = chess.move({
      from: move.from as ChessSquare,
      to: move.to as ChessSquare,
      promotion: move.promotion,
    })
    if (!result) return { ok: false, error: 'Illegal move' }
    return { ok: true, fen: chess.fen(), snapshot: snapshotFromChess(chess) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Illegal move' }
  }
}

export function snapshotFromFen(fen: string): EngineSnapshot {
  return snapshotFromChess(new Chess(fen))
}

function snapshotFromChess(chess: Chess): EngineSnapshot {
  const turn = chess.turn() as Color
  const isCheck = chess.isCheck()
  let winner: Color | 'draw' | null = null
  let reason: GameOverReason | null = null
  let isGameOver = false

  if (chess.isCheckmate()) {
    isGameOver = true
    winner = turn === 'w' ? 'b' : 'w'
    reason = 'checkmate'
  } else if (chess.isStalemate()) {
    isGameOver = true
    winner = 'draw'
    reason = 'stalemate'
  } else if (chess.isDraw()) {
    isGameOver = true
    winner = 'draw'
    reason = 'draw'
  }

  return {
    fen: chess.fen(),
    turn,
    isCheck,
    isGameOver,
    winner,
    reason,
  }
}
