'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LobbySummary } from '@/lib/realtime/protocol'

const MAX_PLAYERS = 2
const POLL_MS = 2000

export function LobbyList() {
  const router = useRouter()
  const [lobbies, setLobbies] = useState<LobbySummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/rooms', { cache: 'no-store' })
        const data = (await res.json()) as {
          lobbies?: LobbySummary[]
          error?: string
        }
        if (cancelled) return
        setLobbies(data.lobbies ?? [])
        setError(data.error ?? null)
      } catch {
        if (!cancelled) {
          setLobbies([])
          setError('Could not load lobbies')
        }
      }
    }

    void load()
    const id = setInterval(() => void load(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-[#9a8b78]">
          Open lobbies
        </p>
        {lobbies !== null && (
          <span className="text-xs text-[#6b5e50]">{lobbies.length}</span>
        )}
      </div>

      {lobbies === null ? (
        <p className="text-sm text-[#6b5e50]">Loading…</p>
      ) : lobbies.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#3d342c] px-3 py-4 text-center text-sm text-[#6b5e50]">
          No open lobbies — create one above.
        </p>
      ) : (
        <ul className="space-y-2">
          {lobbies.map((lobby) => {
            const full = lobby.playerCount >= MAX_PLAYERS
            return (
              <li
                key={lobby.code}
                className="flex items-center gap-3 rounded-lg border border-[#3d342c] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono tracking-widest text-[#f3efe6]">
                    {lobby.code}
                  </p>
                  <p className="truncate text-xs text-[#9a8b78]">
                    {lobby.hostName ?? 'Host'}
                    <span className="text-[#6b5e50]">
                      {' '}
                      · {lobby.playerCount}/{MAX_PLAYERS}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={full}
                  onClick={() => router.push(`/lobby/${lobby.code}`)}
                  className="shrink-0 rounded-lg border border-[#c4a35a] px-3 py-1.5 text-sm font-semibold text-[#c4a35a] transition enabled:hover:bg-[#c4a35a]/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {full ? 'Full' : 'Join'}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {error && <p className="text-xs text-amber-200/80">{error}</p>}
    </div>
  )
}
