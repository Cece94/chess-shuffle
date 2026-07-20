import { describe, expect, it } from 'vitest'
import { getMaterialScore } from './material'

describe('getMaterialScore', () => {
  it('is equal at the start', () => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const s = getMaterialScore(fen)
    expect(s.diff).toBe(0)
    expect(s.white).toBe(s.black)
  })

  it('counts a missing black pawn as +1 white', () => {
    // Black missing a7 pawn
    const fen = 'rnbqkbnr/1ppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const s = getMaterialScore(fen)
    expect(s.diff).toBe(1)
  })

  it('uses queen = 8', () => {
    // White has queen, black does not (and equal otherwise minus queen)
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1'
    const s = getMaterialScore(fen)
    expect(s.diff).toBe(-8)
  })
})
