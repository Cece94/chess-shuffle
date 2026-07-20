'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { BoardShell } from '@/components/board/BoardShell'
import { MaterialMeter } from '@/components/ui/MaterialMeter'
import { playCaptureSound, playMoveSound } from '@/lib/audio/move-sound'
import { wasCapture } from '@/lib/chess/engine'
import { useRoom } from '@/lib/realtime/use-room'
import { useGameUiStore } from '@/store/gameUiStore'
import type { Color } from '@/lib/chess/types'

type Props = { code: string }

export function GameClient({ code }: Props) {
  const router = useRouter()
  const { state, youId, error, send } = useRoom(code)
  const clearSelection = useGameUiStore((s) => s.clearSelection)
  const resetViewCamera = useGameUiStore((s) => s.resetViewCamera)
  const skipMoveSound = useRef(true)
  const prevFenRef = useRef<string | null>(null)
  const lastSoundKey = useRef<string | null>(null)

  useEffect(() => {
    if (state?.phase === 'lobby' && !state.fen) {
      router.replace(`/lobby/${code}`)
    }
  }, [state?.phase, state?.fen, code, router])

  useEffect(() => {
    clearSelection()
  }, [state?.fen, clearSelection])

  const moveKey = state?.lastMove
    ? `${state.lastMove.from}${state.lastMove.to}${state.lastMove.promotion ?? ''}`
    : null

  // Play once per confirmed move (poll/heartbeat must not retrigger)
  useEffect(() => {
    if (!state?.fen) return

    if (!moveKey || !state.lastMove) {
      skipMoveSound.current = false
      lastSoundKey.current = null
      prevFenRef.current = state.fen
      return
    }

    const soundKey = `${moveKey}|${state.fen}`
    if (lastSoundKey.current === soundKey) return

    if (skipMoveSound.current) {
      skipMoveSound.current = false
      lastSoundKey.current = soundKey
      prevFenRef.current = state.fen
      return
    }

    const before = prevFenRef.current
    if (before && wasCapture(before, state.lastMove)) {
      playCaptureSound()
    } else {
      playMoveSound()
    }
    lastSoundKey.current = soundKey
    prevFenRef.current = state.fen
  }, [state?.fen, state?.lastMove, moveKey])

  const myColor: Color | null = useMemo(() => {
    if (!state) return null
    if (state.whiteId === youId) return 'w'
    if (state.blackId === youId) return 'b'
    return null
  }, [state, youId])

  const interactive =
    state?.phase === 'playing' && myColor !== null && state.turn === myColor

  if (!state?.fen) {
    return (
      <div className="flex h-dvh items-center justify-center bg-[#6e7682] text-[#d8dde4]">
        Loading game…
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-[#6e7682]">
      {/* Full-viewport Three.js canvas */}
      <div className="absolute inset-0">
        <BoardShell
          fen={state.fen}
          orientation={myColor ?? 'w'}
          interactive={interactive}
          lastMove={state.lastMove}
          myColor={myColor}
          onMove={(move) => void send({ type: 'move', move })}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="rounded-lg bg-[#1a1510]/75 px-3 py-2 backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a8b78]">Chess Shuffle</p>
          <h1 className="font-serif text-lg text-[#f3efe6] sm:text-xl">
            Position #{state.spId ?? '—'}
          </h1>
        </div>
        <div className="rounded-lg bg-[#1a1510]/75 px-3 py-2 text-right text-sm text-[#9a8b78] backdrop-blur-sm">
          <p>
            Turn:{' '}
            <span className="text-[#f3efe6]">
              {state.turn === 'w' ? 'White' : 'Black'}
              {state.isCheck ? ' · Check' : ''}
            </span>
          </p>
          <p>
            You:{' '}
            <span className="text-[#f3efe6]">
              {myColor === 'w' ? 'White' : myColor === 'b' ? 'Black' : 'Spectator'}
            </span>
          </p>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetViewCamera}
            aria-label="Reset view"
            title="Reset view"
            className="inline-flex items-center gap-2 rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-3 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-[#c4a35a]/50 hover:text-[#f3efe6]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset view
          </button>
          {state.phase === 'playing' && (
            <button
              type="button"
              onClick={() => void send({ type: 'resign' })}
              className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-4 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-red-400 hover:text-red-300"
            >
              Resign
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push(`/lobby/${code}`)}
            className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-4 py-2 text-sm text-[#9a8b78] backdrop-blur-sm"
          >
            Back to lobby
          </button>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          {error && <p className="rounded-lg bg-[#1a1510]/80 px-3 py-2 text-sm text-red-400">{error}</p>}
          <MaterialMeter fen={state.fen} />
        </div>
      </div>

      {state.phase === 'finished' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl border border-[#c4a35a]/40 bg-[#241e18] p-6 text-center">
            <p className="font-serif text-xl text-[#f3efe6]">
              {state.winner === 'draw'
                ? 'Draw'
                : state.winner === 'w'
                  ? 'White wins'
                  : 'Black wins'}
            </p>
            {state.hostId === youId && (
              <button
                type="button"
                onClick={() => void send({ type: 'rematch' })}
                className="mt-3 rounded-lg bg-[#c4a35a] px-5 py-2 font-semibold text-[#1a1510]"
              >
                Rematch (new shuffle)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
