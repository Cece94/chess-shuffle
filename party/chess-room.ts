import type * as Party from 'partykit/server'
import { fenFromSpId, randomSpId } from '../src/lib/chess/shuffle'
import { snapshotFromFen, tryMove } from '../src/lib/chess/engine'
import {
  emptyRoomState,
  type ClientMessage,
  type RoomState,
  type ServerMessage,
} from '../src/lib/realtime/protocol'

type Conn = Party.Connection<{ role?: 'host' | 'guest' }>

export default class ChessRoom implements Party.Server {
  state: RoomState

  constructor(readonly room: Party.Room) {
    this.state = emptyRoomState(room.id.toUpperCase())
  }

  onConnect(conn: Conn) {
    // First connection is host; second is guest; extras rejected
    if (!this.state.hostId) {
      this.state.hostId = conn.id
      this.state.hostName = 'Host'
      conn.setState({ role: 'host' })
    } else if (!this.state.guestId) {
      this.state.guestId = conn.id
      this.state.guestName = 'Guest'
      conn.setState({ role: 'guest' })
    } else {
      this.send(conn, {
        type: 'error',
        code: 'ROOM_FULL',
        message: 'This lobby already has two players.',
      })
      conn.close()
      return
    }

    this.broadcastState()
  }

  onClose(conn: Conn) {
    if (this.state.hostId === conn.id) {
      this.state.hostId = this.state.guestId
      this.state.hostName = this.state.guestName
      this.state.guestId = null
      this.state.guestName = null
      if (this.state.phase === 'playing') {
        this.state.phase = 'finished'
        this.state.winner =
          this.state.whiteId === conn.id
            ? 'b'
            : this.state.blackId === conn.id
              ? 'w'
              : this.state.winner
      }
    } else if (this.state.guestId === conn.id) {
      this.state.guestId = null
      this.state.guestName = null
      if (this.state.phase === 'playing') {
        this.state.phase = 'finished'
        this.state.winner =
          this.state.whiteId === conn.id
            ? 'b'
            : this.state.blackId === conn.id
              ? 'w'
              : this.state.winner
      }
    }

    if (this.state.phase !== 'playing') {
      this.state.phase = 'lobby'
      this.state.spId = null
      this.state.fen = null
      this.state.turn = null
      this.state.lastMove = null
      this.state.whiteId = null
      this.state.blackId = null
      this.state.winner = null
      this.state.isCheck = false
    }

    this.broadcastState()
  }

  onMessage(message: string, sender: Conn) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(message) as ClientMessage
    } catch {
      this.send(sender, {
        type: 'error',
        code: 'BAD_JSON',
        message: 'Invalid message',
      })
      return
    }

    switch (msg.type) {
      case 'join':
        if (msg.name) {
          if (sender.id === this.state.hostId) this.state.hostName = msg.name
          if (sender.id === this.state.guestId) this.state.guestName = msg.name
        }
        this.broadcastState()
        break
      case 'start':
        this.handleStart(sender)
        break
      case 'move':
        this.handleMove(sender, msg)
        break
      case 'resign':
        this.handleResign(sender)
        break
      case 'rematch':
        this.handleRematch(sender)
        break
      default:
        this.send(sender, {
          type: 'error',
          code: 'UNKNOWN',
          message: 'Unknown message type',
        })
    }
  }

  private handleStart(sender: Conn) {
    if (sender.id !== this.state.hostId) {
      this.send(sender, {
        type: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can start the game.',
      })
      return
    }
    if (!this.state.guestId) {
      this.send(sender, {
        type: 'error',
        code: 'NO_GUEST',
        message: 'Wait for a friend to join.',
      })
      return
    }
    if (this.state.phase !== 'lobby' && this.state.phase !== 'finished') {
      this.send(sender, {
        type: 'error',
        code: 'BAD_PHASE',
        message: 'Game already in progress.',
      })
      return
    }

    const spId = randomSpId()
    const fen = fenFromSpId(spId)
    const snap = snapshotFromFen(fen)

    this.state.phase = 'playing'
    this.state.spId = spId
    this.state.fen = fen
    this.state.turn = snap.turn
    this.state.isCheck = snap.isCheck
    this.state.lastMove = null
    this.state.winner = null
    this.state.whiteId = this.state.hostId
    this.state.blackId = this.state.guestId
    this.broadcastState()
  }

  private handleMove(sender: Conn, msg: Extract<ClientMessage, { type: 'move' }>) {
    if (this.state.phase !== 'playing' || !this.state.fen) {
      this.send(sender, {
        type: 'error',
        code: 'NOT_PLAYING',
        message: 'No active game.',
      })
      return
    }

    const side =
      sender.id === this.state.whiteId
        ? 'w'
        : sender.id === this.state.blackId
          ? 'b'
          : null
    if (!side || side !== this.state.turn) {
      this.send(sender, {
        type: 'error',
        code: 'NOT_YOUR_TURN',
        message: 'It is not your turn.',
      })
      return
    }

    const result = tryMove(this.state.fen, msg.move)
    if (!result.ok) {
      this.send(sender, {
        type: 'error',
        code: 'ILLEGAL',
        message: result.error,
      })
      return
    }

    this.state.fen = result.fen
    this.state.turn = result.snapshot.turn
    this.state.isCheck = result.snapshot.isCheck
    this.state.lastMove = msg.move
    if (result.snapshot.isGameOver) {
      this.state.phase = 'finished'
      this.state.winner = result.snapshot.winner
    }
    this.broadcastState()
  }

  private handleResign(sender: Conn) {
    if (this.state.phase !== 'playing') return
    if (sender.id === this.state.whiteId) {
      this.state.winner = 'b'
    } else if (sender.id === this.state.blackId) {
      this.state.winner = 'w'
    } else return
    this.state.phase = 'finished'
    this.broadcastState()
  }

  private handleRematch(sender: Conn) {
    if (sender.id !== this.state.hostId) {
      this.send(sender, {
        type: 'error',
        code: 'NOT_HOST',
        message: 'Only the host can start a rematch.',
      })
      return
    }
    if (!this.state.guestId) {
      this.send(sender, {
        type: 'error',
        code: 'NO_GUEST',
        message: 'Guest left the lobby.',
      })
      return
    }
    this.state.phase = 'lobby'
    this.handleStart(sender)
  }

  private send(conn: Party.Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  private broadcastState() {
    for (const conn of this.room.getConnections()) {
      const payload: ServerMessage = {
        type: 'state',
        state: this.state,
        youId: conn.id,
      }
      conn.send(JSON.stringify(payload))
    }
  }
}

ChessRoom satisfies Party.Worker
