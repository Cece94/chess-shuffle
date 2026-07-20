'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { findCapturedPiece } from '@/lib/chess/capture'
import { getLegalMoves, getPieces, snapshotFromFen, type BoardPiece } from '@/lib/chess/engine'
import { isLightSquare } from '@/lib/chess/coords'
import { useGameUiStore } from '@/store/gameUiStore'
import type { ChessMove, Color } from '@/lib/chess/types'
import { CapturedFlyaway2D, type Flyaway2DSpec } from './CapturedFlyaway2D'
import { PieceSvg } from './PieceSvg'

const FILES = 'abcdefgh'

type Props = {
  fen: string
  orientation: Color
  interactive: boolean
  lastMove: ChessMove | null
  onMove: (move: ChessMove) => void
  myColor: Color | null
}

/** File/rank → row/col on screen for the current orientation. */
function squareToGrid(square: string, orientation: Color): { col: number; row: number } {
  const file = FILES.indexOf(square[0]!.toLowerCase())
  const rank = Number(square[1]) - 1
  if (orientation === 'w') {
    return { col: file, row: 7 - rank }
  }
  return { col: 7 - file, row: rank }
}

export function Board2D({ fen, orientation, interactive, lastMove, onMove, myColor }: Props) {
  const pieces = useMemo(() => getPieces(fen), [fen])
  const snap = useMemo(() => snapshotFromFen(fen), [fen])
  const selectedSquare = useGameUiStore((s) => s.selectedSquare)
  const legalTargets = useGameUiStore((s) => s.legalTargets)
  const setSelection = useGameUiStore((s) => s.setSelection)
  const clearSelection = useGameUiStore((s) => s.clearSelection)

  const boardRef = useRef<HTMLDivElement>(null)
  const prevPiecesRef = useRef<BoardPiece[]>(pieces)
  const lastAnimKey = useRef<string | null>(null)
  const [flyaways, setFlyaways] = useState<Flyaway2DSpec[]>([])
  const [boardPx, setBoardPx] = useState(0)

  const checkedKingSquare = useMemo(() => {
    if (!snap.isCheck) return null
    return pieces.find((p) => p.type === 'k' && p.color === snap.turn)?.square ?? null
  }, [snap.isCheck, snap.turn, pieces])

  // Keep board square size in sync for flyaway pixel math
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const update = () => setBoardPx(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const squareCenter = useCallback(
    (square: string) => {
      const { col, row } = squareToGrid(square, orientation)
      const cell = boardPx / 8
      return { x: (col + 0.5) * cell, y: (row + 0.5) * cell }
    },
    [boardPx, orientation],
  )

  useEffect(() => {
    const prev = prevPiecesRef.current
    if (lastMove && boardPx > 0) {
      const key = `${fen}|${lastMove.from}${lastMove.to}${lastMove.promotion ?? ''}`
      if (lastAnimKey.current !== key) {
        lastAnimKey.current = key
        const captured = findCapturedPiece(prev, pieces, lastMove)
        if (captured) {
          const origin = squareCenter(captured.square)
          const from = squareCenter(lastMove.from)
          const to = squareCenter(lastMove.to)
          let kx = to.x - from.x
          let ky = to.y - from.y
          const len = Math.hypot(kx, ky) || 1
          kx /= len
          ky /= len

          setFlyaways((list) => [
            ...list,
            {
              id: key,
              type: captured.type,
              color: captured.color,
              originX: origin.x,
              originY: origin.y,
              kickX: kx,
              kickY: ky,
            },
          ])
        }
      }
    }
    prevPiecesRef.current = pieces
  }, [fen, lastMove, pieces, boardPx, squareCenter])

  const turn = snap.turn
  const cellPx = boardPx / 8

  function handleSquareClick(square: string) {
    if (!interactive) return

    if (selectedSquare && legalTargets.includes(square)) {
      const moves = getLegalMoves(fen, selectedSquare).filter((m) => m.to === square)
      const move = moves.find((m) => m.promotion === 'q') ?? moves[0]
      if (move) {
        onMove(move)
        clearSelection()
      }
      return
    }

    const piece = pieces.find((p) => p.square === square)
    if (!piece) {
      clearSelection()
      return
    }

    if (myColor && piece.color !== myColor) {
      clearSelection()
      return
    }
    if (piece.color !== turn) {
      clearSelection()
      return
    }

    const targets = getLegalMoves(fen, square).map((m) => m.to)
    setSelection(square, [...new Set(targets)])
  }

  const squares = useMemo(() => {
    const list: string[] = []
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const file = orientation === 'w' ? col : 7 - col
        const rank = orientation === 'w' ? 7 - row : row
        list.push(`${FILES[file]}${rank + 1}`)
      }
    }
    return list
  }, [orientation])

  return (
    <div className="flex h-full w-full items-center justify-center p-3 sm:p-6">
      <div
        ref={boardRef}
        className="relative aspect-square w-full max-w-[min(100%,100dvh-8rem)] overflow-hidden rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        style={{
          background: 'linear-gradient(145deg, #8a919c 0%, #6e7682 45%, #5a616c 100%)',
        }}
      >
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {squares.map((square) => {
            const light = isLightSquare(square)
            const selected = selectedSquare === square
            const target = legalTargets.includes(square)
            const inLast = lastMove && (lastMove.from === square || lastMove.to === square)
            const inCheck = checkedKingSquare === square
            const piece = pieces.find((p) => p.square === square)

            let bg = light ? '#d7c4a3' : '#6b4f35'
            if (inLast) bg = light ? '#e0d08a' : '#8a6b2f'
            if (selected) bg = '#c4a35a'
            if (target) bg = light ? '#9cbf7a' : '#5f8a4a'
            if (inCheck) bg = light ? '#e07070' : '#a03030'

            return (
              <button
                key={square}
                type="button"
                aria-label={square}
                onClick={() => handleSquareClick(square)}
                className="relative flex items-center justify-center p-[6%] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c4a35a] focus-visible:ring-inset"
                style={{ backgroundColor: bg }}
              >
                {target && !piece && (
                  <span className="absolute h-[28%] w-[28%] rounded-full bg-[#1a1510]/35" />
                )}
                {piece && (
                  <PieceSvg
                    type={piece.type}
                    color={piece.color}
                    className={`relative z-[1] h-full w-full transition-transform ${
                      selected ? '-translate-y-0.5 scale-105' : ''
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {flyaways.map((spec) => (
          <CapturedFlyaway2D
            key={spec.id}
            spec={spec}
            size={cellPx * 0.88}
            onDone={(id) => setFlyaways((list) => list.filter((f) => f.id !== id))}
          />
        ))}
      </div>
    </div>
  )
}
