import { Server, type Connection } from 'partyserver'
import type { LobbySummary } from '../src/lib/realtime/protocol'

type Env = {
  LobbyDirectory: DurableObjectNamespace<LobbyDirectory>
}

type DirectoryMessage =
  | { type: 'upsert'; lobby: LobbySummary }
  | { type: 'remove'; code: string }

/**
 * Singleton registry of open lobbies (room name "global").
 * ChessRoom posts upsert/remove; home page GETs the list.
 */
export class LobbyDirectory extends Server<Env> {
  lobbies = new Map<string, LobbySummary>()

  onConnect(conn: Connection) {
    conn.send(JSON.stringify({ type: 'lobbies', lobbies: this.list() }))
  }

  async onRequest(request: Request): Promise<Response> {
    if (request.method === 'GET') {
      return Response.json({ lobbies: this.list() })
    }

    if (request.method === 'POST') {
      let msg: DirectoryMessage
      try {
        msg = (await request.json()) as DirectoryMessage
      } catch {
        return Response.json({ error: 'Invalid JSON' }, { status: 400 })
      }

      if (msg.type === 'upsert') {
        this.lobbies.set(msg.lobby.code.toUpperCase(), {
          ...msg.lobby,
          code: msg.lobby.code.toUpperCase(),
        })
      } else if (msg.type === 'remove') {
        this.lobbies.delete(msg.code.toUpperCase())
      } else {
        return Response.json({ error: 'Unknown action' }, { status: 400 })
      }

      this.broadcastList()
      return Response.json({ ok: true, lobbies: this.list() })
    }

    return new Response('Method not allowed', { status: 405 })
  }

  private list(): LobbySummary[] {
    return [...this.lobbies.values()].sort((a, b) => b.createdAt - a.createdAt)
  }

  private broadcastList() {
    const payload = JSON.stringify({ type: 'lobbies', lobbies: this.list() })
    for (const conn of this.getConnections()) {
      conn.send(payload)
    }
  }
}
