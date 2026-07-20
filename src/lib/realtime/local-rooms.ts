import { fenFromSpId, randomSpId } from '@/lib/chess/shuffle'
import { snapshotFromFen, tryMove } from '@/lib/chess/engine'
import {
  assignSeatColors,
  emptyRoomState,
  type ClientMessage,
  type HostColorChoice,
  type RoomState,
} from '@/lib/realtime/protocol'

type Player = { id: string; name: string }

type LocalRoom = {
  state: RoomState
  players: Map<string, Player>
}

declare global {
  // eslint-disable-next-line no-var
  var __chessShuffleRooms: Map<string, LocalRoom> | undefined
}

function rooms(): Map<string, LocalRoom> {
  if (!globalThis.__chessShuffleRooms) {
    globalThis.__chessShuffleRooms = new Map()
  }
  return globalThis.__chessShuffleRooms
}

export function getOrCreateLocalRoom(code: string): LocalRoom {
  const key = code.toUpperCase()
  const map = rooms()
  let room = map.get(key)
  if (!room) {
    room = { state: emptyRoomState(key), players: new Map() }
    map.set(key, room)
  }
  return room
}

export function joinLocalRoom(
  code: string,
  playerId: string,
  name?: string,
): { state: RoomState; error?: string } {
  const room = getOrCreateLocalRoom(code)
  const { state } = room

  if (room.players.has(playerId)) {
    return { state }
  }

  // Reclaim seat after brief navigation disconnect
  if (state.hostId === playerId) {
    state.hostName = name ?? state.hostName ?? 'Host'
    room.players.set(playerId, { id: playerId, name: state.hostName })
    return { state }
  }
  if (state.guestId === playerId) {
    state.guestName = name ?? state.guestName ?? 'Guest'
    room.players.set(playerId, { id: playerId, name: state.guestName })
    return { state }
  }

  if (!state.hostId) {
    state.hostId = playerId
    state.hostName = name ?? 'Host'
    room.players.set(playerId, { id: playerId, name: state.hostName })
  } else if (!state.guestId) {
    state.guestId = playerId
    state.guestName = name ?? 'Guest'
    room.players.set(playerId, { id: playerId, name: state.guestName })
  } else {
    return { state, error: 'ROOM_FULL' }
  }

  return { state }
}

/** Soft leave: do not wipe an in-progress game (avoids lobby↔game redirect loops). */
export function leaveLocalRoom(code: string, playerId: string): RoomState {
  const room = getOrCreateLocalRoom(code)
  const { state } = room
  room.players.delete(playerId)

  if (state.phase === 'lobby') {
    if (state.hostId === playerId) {
      state.hostId = state.guestId
      state.hostName = state.guestName
      state.guestId = null
      state.guestName = null
    } else if (state.guestId === playerId) {
      state.guestId = null
      state.guestName = null
    }
  }

  return state
}

function beginGame(state: RoomState, hostColor?: HostColorChoice) {
  const spId = randomSpId()
  const fen = fenFromSpId(spId)
  const snap = snapshotFromFen(fen)
  state.phase = 'playing'
  state.spId = spId
  state.fen = fen
  state.turn = snap.turn
  state.isCheck = snap.isCheck
  state.lastMove = null
  state.winner = null

  if (state.hostId && state.guestId && hostColor !== undefined) {
    const seats = assignSeatColors(state.hostId, state.guestId, hostColor)
    state.whiteId = seats.whiteId
    state.blackId = seats.blackId
  }
}

export function applyLocalMessage(
  code: string,
  playerId: string,
  msg: ClientMessage,
): { state: RoomState; error?: string } {
  const room = getOrCreateLocalRoom(code)
  const { state } = room

  switch (msg.type) {
    case 'join': {
      if (msg.name) {
        if (playerId === state.hostId) state.hostName = msg.name
        if (playerId === state.guestId) state.guestName = msg.name
      }
      return { state }
    }
    case 'start': {
      if (playerId !== state.hostId) {
        return { state, error: 'Only the host can start the game.' }
      }
      if (!state.guestId) {
        return { state, error: 'Wait for a friend to join.' }
      }
      beginGame(state, msg.hostColor ?? 'random')
      return { state }
    }
    case 'rematch': {
      if (playerId !== state.hostId) {
        return { state, error: 'Only the host can start the game.' }
      }
      if (!state.guestId) {
        return { state, error: 'Wait for a friend to join.' }
      }
      // Keep seat colors; only reshuffle the position
      beginGame(state)
      return { state }
    }
    case 'move': {
      if (state.phase !== 'playing' || !state.fen) {
        return { state, error: 'No active game.' }
      }
      const side =
        playerId === state.whiteId
          ? 'w'
          : playerId === state.blackId
            ? 'b'
            : null
      if (!side || side !== state.turn) {
        return { state, error: 'It is not your turn.' }
      }
      const result = tryMove(state.fen, msg.move)
      if (!result.ok) return { state, error: result.error }
      state.fen = result.fen
      state.turn = result.snapshot.turn
      state.isCheck = result.snapshot.isCheck
      state.lastMove = msg.move
      if (result.snapshot.isGameOver) {
        state.phase = 'finished'
        state.winner = result.snapshot.winner
      }
      return { state }
    }
    case 'resign': {
      if (state.phase !== 'playing') return { state }
      if (playerId === state.whiteId) state.winner = 'b'
      else if (playerId === state.blackId) state.winner = 'w'
      else return { state }
      state.phase = 'finished'
      return { state }
    }
    default:
      return { state, error: 'Unknown message' }
  }
}
