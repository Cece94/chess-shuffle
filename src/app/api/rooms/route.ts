import { NextResponse } from 'next/server'
import { listLocalLobbies } from '@/lib/realtime/local-rooms'
import type { LobbySummary } from '@/lib/realtime/protocol'

export async function GET() {
  const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST

  if (partyHost) {
    try {
      const res = await fetch(
        `https://${partyHost}/parties/lobby-directory/global`,
        { cache: 'no-store' },
      )
      if (!res.ok) {
        return NextResponse.json(
          { lobbies: [] as LobbySummary[], error: 'Directory unavailable' },
          { status: 502 },
        )
      }
      const data = (await res.json()) as { lobbies?: LobbySummary[] }
      return NextResponse.json({ lobbies: data.lobbies ?? [] })
    } catch {
      return NextResponse.json(
        { lobbies: [] as LobbySummary[], error: 'Directory unreachable' },
        { status: 502 },
      )
    }
  }

  return NextResponse.json({ lobbies: listLocalLobbies() })
}
