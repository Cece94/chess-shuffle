import { describe, expect, it } from 'vitest'
import { backRankFromSpId, fenFromSpId } from './shuffle'
import { getLegalMoves, tryMove } from './engine'

describe('Chess960 shuffle', () => {
  it('maps SP-ID 518 to the classical starting rank', () => {
    expect(backRankFromSpId(518)).toBe('rnbqkbnr')
  })

  it('generates 960 unique back ranks', () => {
    const set = new Set<string>()
    for (let i = 0; i < 960; i++) set.add(backRankFromSpId(i))
    expect(set.size).toBe(960)
  })

  it('keeps king between rooks and bishops on opposite colors', () => {
    for (let i = 0; i < 960; i++) {
      const rank = backRankFromSpId(i)
      const rookIdx = [...rank].map((c, idx) => (c === 'r' ? idx : -1)).filter((x) => x >= 0)
      const kingIdx = rank.indexOf('k')
      expect(rookIdx).toHaveLength(2)
      expect(kingIdx).toBeGreaterThan(rookIdx[0]!)
      expect(kingIdx).toBeLessThan(rookIdx[1]!)

      const bishops = [...rank]
        .map((c, idx) => (c === 'b' ? idx : -1))
        .filter((x) => x >= 0)
      expect((bishops[0]! + bishops[1]!) % 2).toBe(1)
    }
  })

  it('builds a loadable FEN with fixed pawns', () => {
    const fen = fenFromSpId(0)
    expect(fen).toMatch(/\/pppppppp\/8\/8\/8\/8\/PPPPPPPP\//)
    expect(getLegalMoves(fen).length).toBeGreaterThan(0)
  })
})

describe('engine', () => {
  it('applies a legal pawn move on classical start', () => {
    const fen = fenFromSpId(518)
    const result = tryMove(fen, { from: 'e2', to: 'e4' })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.snapshot.turn).toBe('b')
    }
  })

  it('rejects an illegal move', () => {
    const fen = fenFromSpId(518)
    const result = tryMove(fen, { from: 'e2', to: 'e5' })
    expect(result.ok).toBe(false)
  })
})
