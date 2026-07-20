import type { ChessMove, Color } from '@/lib/chess/types'

export type RoomPhase = 'lobby' | 'playing' | 'finished'

/** Host picks their side; guest gets the other. */
export type HostColorChoice = 'w' | 'b' | 'random'

export type RoomState = {
  code: string
  phase: RoomPhase
  hostId: string | null
  guestId: string | null
  hostName: string | null
  guestName: string | null
  whiteId: string | null
  blackId: string | null
  spId: number | null
  fen: string | null
  turn: Color | null
  lastMove: ChessMove | null
  winner: Color | 'draw' | null
  isCheck: boolean
  createdAt: number
}

/** Public lobby card for the home directory. */
export type LobbySummary = {
  code: string
  playerCount: number
  hostName: string | null
  createdAt: number
}

export function roomPlayerCount(state: RoomState): number {
  return (state.hostId ? 1 : 0) + (state.guestId ? 1 : 0)
}

export function toLobbySummary(state: RoomState): LobbySummary | null {
  const playerCount = roomPlayerCount(state)
  if (state.phase !== 'lobby' || playerCount === 0) return null
  return {
    code: state.code,
    playerCount,
    hostName: state.hostName,
    createdAt: state.createdAt,
  }
}

export type ClientMessage =
  | { type: 'join'; name?: string }
  | { type: 'start'; hostColor?: HostColorChoice }
  | { type: 'move'; move: ChessMove }
  | { type: 'resign' }
  | { type: 'rematch' }

export type ServerMessage =
  | { type: 'state'; state: RoomState; youId: string }
  | { type: 'error'; code: string; message: string }

export function emptyRoomState(code: string): RoomState {
  return {
    code,
    phase: 'lobby',
    hostId: null,
    guestId: null,
    hostName: null,
    guestName: null,
    whiteId: null,
    blackId: null,
    spId: null,
    fen: null,
    turn: null,
    lastMove: null,
    winner: null,
    isCheck: false,
    createdAt: Date.now(),
  }
}

/** Assign white/black from the host's color choice. */
export function assignSeatColors(
  hostId: string,
  guestId: string,
  hostColor: HostColorChoice = 'random',
): { whiteId: string; blackId: string } {
  const hostIsWhite =
    hostColor === 'w' ? true : hostColor === 'b' ? false : Math.random() < 0.5

  return hostIsWhite
    ? { whiteId: hostId, blackId: guestId }
    : { whiteId: guestId, blackId: hostId }
}
