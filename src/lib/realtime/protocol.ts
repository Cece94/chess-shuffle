import type { ChessMove, Color } from '@/lib/chess/types'

export type RoomPhase = 'lobby' | 'playing' | 'finished'

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

export type ClientMessage =
  | { type: 'join'; name?: string }
  | { type: 'start' }
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
