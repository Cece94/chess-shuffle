import { routePartykitRequest } from 'partyserver'
import type { ChessRoom } from './chess-room'

export { ChessRoom } from './chess-room'

type Env = {
  ChessRoom: DurableObjectNamespace<ChessRoom>
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return (
      (await routePartykitRequest(request, env)) ||
      new Response('Chess Shuffle realtime', { status: 200 })
    )
  },
} satisfies ExportedHandler<Env>
