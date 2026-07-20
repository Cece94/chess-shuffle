import { routePartykitRequest } from 'partyserver'
import type { ChessRoom } from './chess-room'
import type { LobbyDirectory } from './lobby-directory'

export { ChessRoom } from './chess-room'
export { LobbyDirectory } from './lobby-directory'

type Env = {
  ChessRoom: DurableObjectNamespace<ChessRoom>
  LobbyDirectory: DurableObjectNamespace<LobbyDirectory>
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response('Chess Shuffle realtime', { status: 200 })
    )
  },
} satisfies ExportedHandler<Env>
