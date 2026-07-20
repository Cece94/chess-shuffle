export type Color = 'w' | 'b'
export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k'
export type Square = `${'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h'}${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8}`

export type SpId = number // 0..959

export type BackRank = string // 8 lowercase piece letters, e.g. "rnbqkbnr"

export type ChessMove = {
  from: string
  to: string
  promotion?: PieceSymbol
}

export type GameOverReason = 'checkmate' | 'stalemate' | 'draw' | 'resign'
