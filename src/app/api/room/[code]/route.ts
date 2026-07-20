import { NextResponse } from 'next/server'
import {
  applyLocalMessage,
  getOrCreateLocalRoom,
  joinLocalRoom,
  leaveLocalRoom,
} from '@/lib/realtime/local-rooms'
import type { ClientMessage } from '@/lib/realtime/protocol'

type Ctx = { params: Promise<{ code: string }> }

export async function GET(_req: Request, ctx: Ctx) {
  const { code } = await ctx.params
  const room = getOrCreateLocalRoom(code)
  return NextResponse.json({ state: room.state })
}

export async function POST(req: Request, ctx: Ctx) {
  const { code } = await ctx.params
  const body = (await req.json()) as {
    playerId: string
    action: 'join' | 'leave' | 'message'
    name?: string
    message?: ClientMessage
  }

  if (!body.playerId) {
    return NextResponse.json({ error: 'playerId required' }, { status: 400 })
  }

  if (body.action === 'join') {
    const result = joinLocalRoom(code, body.playerId, body.name)
    if (result.error) {
      return NextResponse.json({ error: result.error, state: result.state }, { status: 409 })
    }
    return NextResponse.json({ state: result.state })
  }

  if (body.action === 'leave') {
    const state = leaveLocalRoom(code, body.playerId)
    return NextResponse.json({ state })
  }

  if (body.action === 'message' && body.message) {
    const result = applyLocalMessage(code, body.playerId, body.message)
    if (result.error) {
      return NextResponse.json({ error: result.error, state: result.state }, { status: 400 })
    }
    return NextResponse.json({ state: result.state })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
