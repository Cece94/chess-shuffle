'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { findCapturedPiece } from '@/lib/chess/capture'
import { getLegalMoves, getPieces, snapshotFromFen, type BoardPiece } from '@/lib/chess/engine'
import { squareToWorld, isLightSquare } from '@/lib/chess/coords'
import { useGameUiStore } from '@/store/gameUiStore'
import { PieceMesh } from './PieceMesh'
import { CapturedFlyaway, type FlyawaySpec } from './CapturedFlyaway'
import type { ChessMove, Color } from '@/lib/chess/types'
import { shouldSuppressBoardClick } from './orbitClickGuard'

type SceneProps = {
  fen: string
  interactive: boolean
  lastMove: ChessMove | null
  onMove: (move: ChessMove) => void
  myColor: Color | null
}

const FILES = 'abcdefgh'

export function Scene({ fen, interactive, lastMove, onMove, myColor }: SceneProps) {
  const pieces = useMemo(() => getPieces(fen), [fen])
  const snap = useMemo(() => snapshotFromFen(fen), [fen])
  const selectedSquare = useGameUiStore((s) => s.selectedSquare)
  const legalTargets = useGameUiStore((s) => s.legalTargets)
  const setSelection = useGameUiStore((s) => s.setSelection)
  const clearSelection = useGameUiStore((s) => s.clearSelection)

  const prevPiecesRef = useRef<BoardPiece[]>(pieces)
  const lastAnimKey = useRef<string | null>(null)
  const [flyaways, setFlyaways] = useState<FlyawaySpec[]>([])

  // King to move is the one under check
  const checkedKingSquare = useMemo(() => {
    if (!snap.isCheck) return null
    return pieces.find((p) => p.type === 'k' && p.color === snap.turn)?.square ?? null
  }, [snap.isCheck, snap.turn, pieces])

  // Spawn a kick flyaway whenever a capture appears in lastMove
  useEffect(() => {
    const prev = prevPiecesRef.current
    if (lastMove) {
      const key = `${fen}|${lastMove.from}${lastMove.to}${lastMove.promotion ?? ''}`
      if (lastAnimKey.current !== key) {
        lastAnimKey.current = key
        const captured = findCapturedPiece(prev, pieces, lastMove)
        if (captured) {
          const [ox, , oz] = squareToWorld(captured.square)
          const [fx, , fz] = squareToWorld(lastMove.from)
          const [tx, , tz] = squareToWorld(lastMove.to)
          let kx = tx - fx
          let kz = tz - fz
          const len = Math.hypot(kx, kz) || 1
          kx /= len
          kz /= len

          setFlyaways((list) => [
            ...list,
            {
              id: key,
              type: captured.type,
              color: captured.color,
              origin: [ox, 0.15, oz],
              kickX: kx,
              kickZ: kz,
            },
          ])
        }
      }
    }
    prevPiecesRef.current = pieces
  }, [fen, lastMove, pieces])

  const turn = snap.turn

  function handleSquareClick(square: string) {
    if (!interactive) return
    // Ignore click that ends an orbit drag
    if (shouldSuppressBoardClick()) return

    // Move to a highlighted target
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

    // Only select own pieces on your turn
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

  return (
    <group>
      {/* Board tiles */}
      {Array.from({ length: 8 }, (_, rank) =>
        Array.from({ length: 8 }, (_, file) => {
          const square = `${FILES[file]}${rank + 1}`
          const [x, , z] = squareToWorld(square)
          const light = isLightSquare(square)
          const selected = selectedSquare === square
          const target = legalTargets.includes(square)
          const inLast =
            lastMove && (lastMove.from === square || lastMove.to === square)
          const inCheck = checkedKingSquare === square

          let color = light ? '#d7c4a3' : '#6b4f35'
          if (inLast) color = light ? '#e0d08a' : '#8a6b2f'
          if (selected) color = '#c4a35a'
          if (target) color = light ? '#9cbf7a' : '#5f8a4a'
          if (inCheck) color = light ? '#e07070' : '#a03030'

          return (
            <mesh
              key={square}
              position={[x, 0, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation()
                handleSquareClick(square)
              }}
              receiveShadow
            >
              <planeGeometry args={[0.98, 0.98]} />
              <meshStandardMaterial color={color} />
            </mesh>
          )
        }),
      )}

      {/* Pieces */}
      {pieces.map((p) => (
        <PieceMesh
          key={`${p.color}${p.type}${p.square}`}
          type={p.type}
          color={p.color}
          square={p.square}
          selected={selectedSquare === p.square}
          inCheck={checkedKingSquare === p.square}
          onSelect={() => handleSquareClick(p.square)}
        />
      ))}

      {flyaways.map((spec) => (
        <CapturedFlyaway
          key={spec.id}
          spec={spec}
          onDone={(id) => setFlyaways((list) => list.filter((f) => f.id !== id))}
        />
      ))}
    </group>
  )
}
