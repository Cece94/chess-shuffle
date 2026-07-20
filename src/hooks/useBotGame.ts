'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  botThinkMs,
  pickBotMove,
  type BotLevel,
} from '@/lib/chess/bot'
import {
  createBotPersona,
  readPlayerDisplayName,
  type BotPersona,
} from '@/lib/chess/botPersona'
import { snapshotFromFen, tryMove } from '@/lib/chess/engine'
import { fenFromSpId, randomSpId } from '@/lib/chess/shuffle'
import type { ChessMove, Color } from '@/lib/chess/types'

export type BotGamePhase = 'setup' | 'playing' | 'finished'
export type HostColorChoice = 'w' | 'b' | 'random'

export type BotGameSnapshot = {
  phase: BotGamePhase
  level: BotLevel
  spId: number | null
  fen: string | null
  turn: Color | null
  playerColor: Color | null
  playerName: string
  bot: BotPersona | null
  lastMove: ChessMove | null
  winner: Color | 'draw' | null
  isCheck: boolean
  botThinking: boolean
}

const INITIAL: BotGameSnapshot = {
  phase: 'setup',
  level: 'easy',
  spId: null,
  fen: null,
  turn: null,
  playerColor: null,
  playerName: 'You',
  bot: null,
  lastMove: null,
  winner: null,
  isCheck: false,
  botThinking: false,
}

function resolvePlayerColor(choice: HostColorChoice): Color {
  if (choice === 'w') return 'w'
  if (choice === 'b') return 'b'
  return Math.random() < 0.5 ? 'w' : 'b'
}

function freshPosition(
  level: BotLevel,
  playerColor: Color,
  keepBot?: BotPersona | null,
): BotGameSnapshot {
  const spId = randomSpId()
  const fen = fenFromSpId(spId)
  const snap = snapshotFromFen(fen)
  return {
    phase: 'playing',
    level,
    spId,
    fen,
    turn: snap.turn,
    playerColor,
    playerName: readPlayerDisplayName(),
    bot: keepBot ?? createBotPersona(level),
    lastMove: null,
    winner: null,
    isCheck: snap.isCheck,
    botThinking: false,
  }
}

export function useBotGame() {
  const [state, setState] = useState<BotGameSnapshot>(INITIAL)
  const botTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const genRef = useRef(0)

  const clearBotTimer = useCallback(() => {
    if (botTimer.current) {
      clearTimeout(botTimer.current)
      botTimer.current = null
    }
  }, [])

  useEffect(() => () => clearBotTimer(), [clearBotTimer])

  const start = useCallback(
    (level: BotLevel, colorChoice: HostColorChoice = 'random') => {
      clearBotTimer()
      genRef.current += 1
      setState(freshPosition(level, resolvePlayerColor(colorChoice)))
    },
    [clearBotTimer],
  )

  const rematch = useCallback(() => {
    if (!state.playerColor) return
    clearBotTimer()
    genRef.current += 1
    // Swap colors; keep same bot persona for the rematch
    const nextColor: Color = state.playerColor === 'w' ? 'b' : 'w'
    setState(freshPosition(state.level, nextColor, state.bot))
  }, [clearBotTimer, state.bot, state.level, state.playerColor])

  const resign = useCallback(() => {
    if (state.phase !== 'playing' || !state.playerColor) return
    clearBotTimer()
    genRef.current += 1
    setState((s) => ({
      ...s,
      phase: 'finished',
      winner: s.playerColor === 'w' ? 'b' : 'w',
      botThinking: false,
    }))
  }, [clearBotTimer, state.phase, state.playerColor])

  const backToSetup = useCallback(() => {
    clearBotTimer()
    genRef.current += 1
    setState(INITIAL)
  }, [clearBotTimer])

  const playMove = useCallback((move: ChessMove) => {
    setState((s) => {
      if (s.phase !== 'playing' || !s.fen || !s.playerColor) return s
      if (s.turn !== s.playerColor || s.botThinking) return s

      const result = tryMove(s.fen, move)
      if (!result.ok) return s

      return {
        ...s,
        fen: result.fen,
        turn: result.snapshot.turn,
        isCheck: result.snapshot.isCheck,
        lastMove: move,
        phase: result.snapshot.isGameOver ? 'finished' : 'playing',
        winner: result.snapshot.isGameOver ? result.snapshot.winner : null,
      }
    })
  }, [])

  // When it is the bot's turn, think then play (do not depend on botThinking —
  // that flag is only for UI and would cancel the timer if listed in deps).
  useEffect(() => {
    if (state.phase !== 'playing' || !state.fen || !state.playerColor) return
    if (state.turn === state.playerColor) return

    const gen = genRef.current
    const fen = state.fen
    const level = state.level

    setState((s) => (s.botThinking ? s : { ...s, botThinking: true }))

    // Search first (hard/expert can be slow), then wait out remaining think delay (≥1s)
    botTimer.current = setTimeout(() => {
      if (genRef.current !== gen) return

      const started = performance.now()
      const move = pickBotMove(fen, level)
      const elapsed = performance.now() - started
      const wait = Math.max(0, botThinkMs(level) - elapsed)

      const apply = () => {
        if (genRef.current !== gen) return
        if (!move) {
          setState((s) => ({ ...s, botThinking: false }))
          return
        }
        const result = tryMove(fen, move)
        if (!result.ok) {
          setState((s) => ({ ...s, botThinking: false }))
          return
        }
        setState((s) => ({
          ...s,
          fen: result.fen,
          turn: result.snapshot.turn,
          isCheck: result.snapshot.isCheck,
          lastMove: move,
          botThinking: false,
          phase: result.snapshot.isGameOver ? 'finished' : 'playing',
          winner: result.snapshot.isGameOver ? result.snapshot.winner : null,
        }))
      }

      if (wait === 0) apply()
      else botTimer.current = setTimeout(apply, wait)
    }, 0)

    return () => clearBotTimer()
  }, [
    state.phase,
    state.fen,
    state.turn,
    state.playerColor,
    state.level,
    clearBotTimer,
  ])

  return { state, start, playMove, resign, rematch, backToSetup }
}
