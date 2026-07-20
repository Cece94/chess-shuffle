import type { BackRank, SpId } from './types'

const KNIGHT_COMBOS: [number, number][] = [
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [1, 2],
  [1, 3],
  [1, 4],
  [2, 3],
  [2, 4],
  [3, 4],
]

/** Scharnagl algorithm: SP-ID 0–959 → back-rank piece string (lowercase). */
export function backRankFromSpId(spId: SpId): BackRank {
  if (!Number.isInteger(spId) || spId < 0 || spId > 959) {
    throw new Error(`SP-ID must be an integer 0..959, got ${spId}`)
  }

  const pieces: (string | null)[] = Array(8).fill(null)
  let n = spId

  // Scharnagl: light-square bishop first (b,d,f,h), then dark (a,c,e,g)
  pieces[2 * (n % 4) + 1] = 'b'
  n = Math.floor(n / 4)

  pieces[2 * (n % 4)] = 'b'
  n = Math.floor(n / 4)

  // Queen on the Nth empty square
  placeOnNthEmpty(pieces, n % 6, 'q')
  n = Math.floor(n / 6)

  // Two knights on empty-square combo
  const [i1, i2] = KNIGHT_COMBOS[n]!
  const empty = emptyIndices(pieces)
  pieces[empty[i1]!] = 'n'
  pieces[empty[i2]!] = 'n'

  // Remaining three squares: rook, king, rook
  placeOnNthEmpty(pieces, 0, 'r')
  placeOnNthEmpty(pieces, 0, 'k')
  placeOnNthEmpty(pieces, 0, 'r')

  return pieces.join('')
}

export function fenFromSpId(spId: SpId): string {
  const black = backRankFromSpId(spId)
  const white = black.toUpperCase()
  // KQkq: both sides retain castling rights at start (classical encoding)
  return `${black}/pppppppp/8/8/8/8/PPPPPPPP/${white} w KQkq - 0 1`
}

export function randomSpId(): SpId {
  return Math.floor(Math.random() * 960)
}

function emptyIndices(pieces: (string | null)[]): number[] {
  const out: number[] = []
  for (let i = 0; i < pieces.length; i++) {
    if (pieces[i] === null) out.push(i)
  }
  return out
}

function placeOnNthEmpty(
  pieces: (string | null)[],
  nth: number,
  piece: string,
): void {
  const empty = emptyIndices(pieces)
  const idx = empty[nth]
  if (idx === undefined) throw new Error('No empty square for placement')
  pieces[idx] = piece
}
