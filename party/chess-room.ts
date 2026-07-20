import { Server, type Connection } from 'partyserver'
import { fenFromSpId, randomSpId } from '../src/lib/chess/shuffle'
import { snapshotFromFen, tryMove } from '../src/lib/chess/engine'
import {
  assignSeatColors,
  emptyRoomState,
  type ClientMessage,
  type HostColorChoice,
  type RoomState,
  type ServerMessage,
} from '../src/lib/realtime/protocol'

type Conn = Connection<{ role?: 'host' | 'guest' }>

type Env = {
  ChessRoom: DurableObjectNamespace<ChessRoom>
}

export class ChessRoom extends Server<Env> {
  state: RoomState

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.state = emptyRoomState(this.name.toUpperCase())
  }

  onConnect(conn: Conn) {
    // Reclaim seat after lobby→game navigation (same stable client id)
    if (this.state.hostId === conn.id) {
      conn.setState({ role: 'host' })
      this.broadcastState()
      return
    }
    if (this.state.guestId === conn.id) {
      conn.setState({ role: 'guest' })
      this.broadcastState()
      return
    }

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

  // Soft leave: keep in-progress games (socket closes on every lobby→game route change)
  onClose(conn: Conn) {
    if (this.state.phase === 'lobby') {
      if (this.state.hostId === conn.id) {
        this.state.hostId = this.state.guestId
        this.state.hostName = this.state.guestName
        this.state.guestId = null
        this.state.guestName = null
      } else if (this.state.guestId === conn.id) {
        this.state.guestId = null
        this.state.guestName = null
      }
    }

    this.broadcastState()
  }

  onMessage(sender: Conn, message: string | ArrayBuffer) {
    let msg: ClientMessage
    try {
      msg = JSON.parse(String(message)) as ClientMessage
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
        this.handleStart(sender, msg.hostColor)
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

  private handleStart(sender: Conn, hostColor: HostColorChoice = 'random') {
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

    const seats = assignSeatColors(this.state.hostId, this.state.guestId, hostColor)
    this.state.whiteId = seats.whiteId
    this.state.blackId = seats.blackId
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

    // Swap sides vs previous game, then reshuffle
    const prevWhite = this.state.whiteId
    const prevBlack = this.state.blackId

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
    this.state.whiteId = prevBlack
    this.state.blackId = prevWhite
    this.broadcastState()
  }

  private send(conn: Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg))
  }

  private broadcastState() {
    for (const conn of this.getConnections()) {
      const payload: ServerMessage = {
        type: 'state',
        state: this.state,
        youId: conn.id,
      }
      conn.send(JSON.stringify(payload))
    }
  }
}
