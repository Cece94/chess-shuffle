import { describe, expect, it } from 'vitest'
import {
  evaluateFen,
  pickBotMove,
  pickEasyMove,
  pickExpertMove,
  pickHardMove,
  pickIntermediateMove,
} from './bot'
import { getLegalMoves, tryMove } from './engine'
import { fenFromSpId } from './shuffle'

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

describe('pickEasyMove', () => {
  it('returns a legal move', () => {
    const move = pickEasyMove(START)
    expect(move).not.toBeNull()
    const legal = getLegalMoves(START)
    expect(legal.some((m) => m.from === move!.from && m.to === move!.to)).toBe(true)
  })

  it('works on a Chess960 start', () => {
    const fen = fenFromSpId(518)
    const move = pickEasyMove(fen)
    expect(move).not.toBeNull()
    expect(tryMove(fen, move!).ok).toBe(true)
  })
})

describe('pickIntermediateMove', () => {
  it('takes a free hanging queen when obvious', () => {
    const fen = '4k3/8/8/8/3q4/8/4N3/4K3 w - - 0 1'
    const move = pickIntermediateMove(fen)
    expect(move).not.toBeNull()
    expect(move!.from).toBe('e2')
    expect(move!.to).toBe('d4')
  })

  it('returns a legal move on shuffled starts', () => {
    const fen = fenFromSpId(0)
    const move = pickBotMove(fen, 'intermediate')
    expect(move).not.toBeNull()
    expect(tryMove(fen, move!).ok).toBe(true)
  })
})

describe('pickHardMove', () => {
  it('takes a free hanging queen', () => {
    const fen = '4k3/8/8/8/3q4/8/4N3/4K3 w - - 0 1'
    const move = pickHardMove(fen)
    expect(move).not.toBeNull()
    expect(move!.from).toBe('e2')
    expect(move!.to).toBe('d4')
  })

  it('prefers capturing a hanging rook', () => {
    const fen = 'r3k3/8/8/8/8/8/8/Q3K3 w - - 0 1'
    const move = pickHardMove(fen)
    expect(move).not.toBeNull()
    expect(move!.to).toBe('a8')
  })
})

describe('pickExpertMove', () => {
  it('takes a free hanging queen', () => {
    const fen = '4k3/8/8/8/3q4/8/4N3/4K3 w - - 0 1'
    const move = pickExpertMove(fen)
    expect(move).not.toBeNull()
    expect(move!.from).toBe('e2')
    expect(move!.to).toBe('d4')
  })

  it('returns a legal move on shuffled starts', () => {
    const fen = fenFromSpId(42)
    const move = pickBotMove(fen, 'expert')
    expect(move).not.toBeNull()
    expect(tryMove(fen, move!).ok).toBe(true)
  }, 15_000)
})

describe('evaluateFen', () => {
  it('is roughly equal at the start', () => {
    const score = evaluateFen(START, 'w')
    expect(Math.abs(score)).toBeLessThan(2)
  })

  it('favors the side that is ahead in material', () => {
    const fen = 'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(evaluateFen(fen, 'w')).toBeGreaterThan(0)
    expect(evaluateFen(fen, 'b')).toBeLessThan(0)
  })
})
