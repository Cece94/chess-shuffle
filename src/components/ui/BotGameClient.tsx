'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Board2D } from '@/components/board/Board2D'
import { BoardShell } from '@/components/board/BoardShell'
import { BoardStage } from '@/components/ui/BoardStage'
import { playCaptureSound, playCheckSound, playMoveSound } from '@/lib/audio/move-sound'
import { wasCapture } from '@/lib/chess/engine'
import type { BotLevel } from '@/lib/chess/bot'
import { botLevelLabel } from '@/lib/chess/bot'
import type { HostColorChoice } from '@/hooks/useBotGame'
import { useBotGame } from '@/hooks/useBotGame'
import { useIsMobile } from '@/hooks/useIsMobile'
import { BotFace } from '@/components/ui/BotFace'
import { ColorChoicePicker } from '@/components/ui/ColorChoicePicker'
import { ResignConfirmDialog } from '@/components/ui/ResignConfirmDialog'
import { useGameUiStore } from '@/store/gameUiStore'
import type { ChessMove, Color } from '@/lib/chess/types'

const LEVELS: { value: BotLevel; label: string; blurb: string }[] = [
  { value: 'easy', label: 'Easy', blurb: 'Random legal moves' },
  {
    value: 'intermediate',
    label: 'Intermediate',
    blurb: 'Looks 1–2 moves ahead',
  },
  {
    value: 'hard',
    label: 'Hard',
    blurb: 'Deeper search + capture tactics',
  },
  {
    value: 'expert',
    label: 'Expert',
    blurb: 'Looks further — last step before Extreme',
  },
]

export function BotGameClient() {
  const { state, start, playMove, resign, rematch, backToSetup } = useBotGame()
  const clearSelection = useGameUiStore((s) => s.clearSelection)
  const resetViewCamera = useGameUiStore((s) => s.resetViewCamera)
  const viewMode = useGameUiStore((s) => s.viewMode)
  const setViewMode = useGameUiStore((s) => s.setViewMode)
  const isMobile = useIsMobile()
  // Mobile: 2D only
  const effectiveView = isMobile ? '2d' : viewMode
  const [confirmResign, setConfirmResign] = useState(false)
  const skipMoveSound = useRef(true)
  const prevFenRef = useRef<string | null>(null)
  const lastSoundKey = useRef<string | null>(null)

  useEffect(() => {
    if (isMobile && viewMode === '3d') setViewMode('2d')
  }, [isMobile, viewMode, setViewMode])

  useEffect(() => {
    clearSelection()
  }, [state.fen, clearSelection])

  useEffect(() => {
    if (state.playerColor) resetViewCamera()
  }, [state.playerColor, resetViewCamera])

  const moveKey = state.lastMove
    ? `${state.lastMove.from}${state.lastMove.to}${state.lastMove.promotion ?? ''}`
    : null

  useEffect(() => {
    if (!state.fen) return

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
    if (state.isCheck) {
      playCheckSound()
    } else if (before && wasCapture(before, state.lastMove)) {
      playCaptureSound()
    } else {
      playMoveSound()
    }
    lastSoundKey.current = soundKey
    prevFenRef.current = state.fen
  }, [state.fen, state.lastMove, state.isCheck, moveKey])

  if (state.phase === 'setup') {
    return <BotSetup onStart={start} />
  }

  if (!state.fen || !state.playerColor || !state.bot) {
    return (
      <div className="flex h-full items-center justify-center bg-[#6e7682] text-[#d8dde4]">
        Loading game…
      </div>
    )
  }

  const myColor = state.playerColor
  const interactive =
    state.phase === 'playing' && state.turn === myColor && !state.botThinking

  const boardProps = {
    fen: state.fen,
    orientation: myColor as Color,
    interactive,
    lastMove: state.lastMove,
    myColor,
    onMove: (move: ChessMove) => playMove(move),
  }

  const boardKey = `${state.spId}-${myColor}`

  return (
    <div className="absolute inset-0 bg-[#6e7682]">
      <BoardStage
        fen={state.fen}
        immersive={effectiveView === '3d'}
        leftSlot={
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <BotFace
                name={state.bot.name}
                accent={state.bot.accent}
                level={state.level}
                thinking={state.botThinking}
              />
              <p className="text-[10px] uppercase tracking-wider text-[#9a8b78]">
                {botLevelLabel(state.level)}
              </p>
            </div>

            <p className="font-serif text-sm tracking-[0.2em] text-[#c4a35a] sm:text-base">
              VS
            </p>

            <div className="rounded-xl border border-[#3d342c]/80 bg-[#1a1510]/80 px-3 py-2 text-center backdrop-blur-sm">
              <p className="truncate font-serif text-sm text-[#f3efe6] sm:text-base">
                {state.playerName}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#9a8b78]">
                {myColor === 'w' ? 'White' : 'Black'}
              </p>
            </div>
          </div>
        }
      >
        <div className="h-full w-full" key={boardKey}>
          {effectiveView === '3d' ? <BoardShell {...boardProps} /> : <Board2D {...boardProps} />}
        </div>
      </BoardStage>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <div className="rounded-lg bg-[#1a1510]/75 px-3 py-2 backdrop-blur-sm">
          <h1 className="font-serif text-lg text-[#f3efe6] sm:text-xl">
            Position #{state.spId ?? '—'}
          </h1>
        </div>

        {!isMobile && (
          <div
            className="pointer-events-auto flex rounded-lg border border-[#3d342c] bg-[#1a1510]/80 p-0.5 backdrop-blur-sm"
            role="group"
            aria-label="Board view"
          >
            {(['2d', '3d'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`rounded-md px-3 py-1.5 text-sm uppercase tracking-wide transition-colors ${
                  viewMode === mode
                    ? 'bg-[#c4a35a] font-semibold text-[#1a1510]'
                    : 'text-[#9a8b78] hover:text-[#f3efe6]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-lg bg-[#1a1510]/75 px-3 py-2 text-right text-sm text-[#9a8b78] backdrop-blur-sm">
          <p>
            Turn:{' '}
            <span className="text-[#f3efe6]">
              {state.turn === 'w' ? 'White' : 'Black'}
              {state.isCheck ? ' · Check' : ''}
            </span>
          </p>
        </div>
      </header>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex flex-wrap gap-2">
          {effectiveView === '3d' && (
            <button
              type="button"
              onClick={resetViewCamera}
              aria-label="Reset view"
              title="Reset view"
              className="inline-flex items-center gap-2 rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-3 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-[#c4a35a]/50 hover:text-[#f3efe6]"
            >
              Reset view
            </button>
          )}
          {state.phase === 'playing' && (
            <button
              type="button"
              onClick={() => setConfirmResign(true)}
              className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-4 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-red-400 hover:text-red-300"
            >
              Resign
            </button>
          )}
          <button
            type="button"
            onClick={backToSetup}
            className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-4 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-[#c4a35a]/50 hover:text-[#f3efe6]"
          >
            Change bot
          </button>
          <Link
            href="/"
            className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-4 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-[#c4a35a]/50 hover:text-[#f3efe6]"
          >
            Home
          </Link>
        </div>
      </div>

      {state.phase === 'finished' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="rounded-xl border border-[#c4a35a]/40 bg-[#241e18] p-6 text-center">
            <p className="font-serif text-xl text-[#f3efe6]">
              {state.winner === 'draw'
                ? 'Draw'
                : state.winner === myColor
                  ? 'You win'
                  : `${state.bot.name} wins`}
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={rematch}
                className="rounded-lg bg-[#c4a35a] px-5 py-2 font-semibold text-[#1a1510] transition-colors hover:bg-[#d4b56a]"
              >
                Rematch (new shuffle)
              </button>
              <button
                type="button"
                onClick={backToSetup}
                className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-5 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-[#c4a35a]/50 hover:text-[#f3efe6]"
              >
                Change bot
              </button>
            </div>
          </div>
        </div>
      )}

      <ResignConfirmDialog
        open={confirmResign}
        onCancel={() => setConfirmResign(false)}
        onConfirm={() => {
          setConfirmResign(false)
          resign()
        }}
      />
    </div>
  )
}

function BotSetup({
  onStart,
}: {
  onStart: (level: BotLevel, color: HostColorChoice) => void
}) {
  const [level, setLevel] = useState<BotLevel>('easy')
  const [color, setColor] = useState<HostColorChoice>('random')

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-[#3d342c] bg-[#241e18]/90 p-6 shadow-xl">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#9a8b78]">Solo</p>
          <h1 className="mt-1 font-serif text-3xl text-[#f3efe6]">Play vs bot</h1>
          <p className="mt-2 text-sm text-[#9a8b78]">
            Same Chess960 shuffle — pick a level and your color.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#9a8b78]">
            Difficulty
          </p>
          <div className="grid gap-2">
            {LEVELS.map((opt) => {
              const active = level === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    active
                      ? 'border-[#c4a35a] bg-[#c4a35a]/15'
                      : 'border-[#3d342c] hover:border-[#6a5c4c]'
                  }`}
                >
                  <span className="block font-semibold text-[#f3efe6]">{opt.label}</span>
                  <span className="text-sm text-[#9a8b78]">{opt.blurb}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#9a8b78]">
            Your color
          </p>
          <ColorChoicePicker value={color} onChange={setColor} />
        </div>

        <button
          type="button"
          onClick={() => onStart(level, color)}
          className="w-full rounded-lg bg-[#c4a35a] px-5 py-3 font-semibold text-[#1a1510] transition hover:bg-[#d4b56a]"
        >
          Start game
        </button>

        <Link
          href="/"
          className="block text-center text-sm text-[#9a8b78] transition hover:text-[#f3efe6]"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
