'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PartySocket from 'partysocket'
import type { ClientMessage, RoomState } from '@/lib/realtime/protocol'

/** Per-tab id so two tabs can be host + guest while testing. */
function getPlayerId(): string {
  const key = 'chess-shuffle-tab-id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    sessionStorage.setItem(key, id)
  }
  return id
}

// Pending leaves cancelled if the same tab remounts (React Strict Mode)
const pendingLeaves = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleLeave(code: string, playerId: string) {
  const key = `${code}:${playerId}`
  const existing = pendingLeaves.get(key)
  if (existing) clearTimeout(existing)

  pendingLeaves.set(
    key,
    setTimeout(() => {
      pendingLeaves.delete(key)
      void fetch(`/api/room/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'leave' }),
        keepalive: true,
      })
    }, 500),
  )
}

function cancelLeave(code: string, playerId: string) {
  const key = `${code}:${playerId}`
  const existing = pendingLeaves.get(key)
  if (existing) {
    clearTimeout(existing)
    pendingLeaves.delete(key)
  }
}

export function useRoom(code: string) {
  const [state, setState] = useState<RoomState | null>(null)
  const [youId, setYouId] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const partyHost = process.env.NEXT_PUBLIC_PARTYKIT_HOST
  const socketRef = useRef<PartySocket | null>(null)
  const playerIdRef = useRef('')

  const send = useCallback(
    async (message: ClientMessage) => {
      if (partyHost && socketRef.current) {
        socketRef.current.send(JSON.stringify(message))
        return
      }

      const res = await fetch(`/api/room/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: playerIdRef.current,
          action: 'message',
          message,
        }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      if (data.state) setState(data.state)
    },
    [code, partyHost],
  )

  useEffect(() => {
    const playerId = getPlayerId()
    playerIdRef.current = playerId
    setYouId(playerId)
    let cancelled = false

    if (partyHost) {
      // Stable id so reconnect after lobby→game reclaims the same seat
      const socket = new PartySocket({
        host: partyHost,
        party: 'chess-room',
        room: code.toUpperCase(),
        id: playerId,
      })
      socketRef.current = socket

      socket.addEventListener('open', () => {
        if (!cancelled) setConnected(true)
        socket.send(JSON.stringify({ type: 'join' } satisfies ClientMessage))
      })

      socket.addEventListener('message', (event) => {
        const msg = JSON.parse(String(event.data))
        if (msg.type === 'state') {
          setState(msg.state)
          setYouId(msg.youId)
          setError(null)
        } else if (msg.type === 'error') {
          setError(msg.message)
        }
      })

      socket.addEventListener('close', () => {
        if (!cancelled) setConnected(false)
      })

      return () => {
        cancelled = true
        socket.close()
      }
    }

    cancelLeave(code, playerId)

    async function join() {
      const res = await fetch(`/api/room/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'join' }),
      })
      const data = await res.json()
      if (cancelled) return
      if (data.error) setError(data.error)
      if (data.state) {
        setState(data.state)
        setConnected(true)
      }
    }

    void join()

    const heartbeat = setInterval(() => {
      void fetch(`/api/room/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, action: 'join' }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && data.state) {
            setState(data.state)
            setConnected(true)
          }
        })
    }, 2000)

    const poll = setInterval(async () => {
      const res = await fetch(`/api/room/${code}`)
      const data = await res.json()
      if (!cancelled && data.state) setState(data.state)
    }, 500)

    return () => {
      cancelled = true
      clearInterval(heartbeat)
      clearInterval(poll)
      scheduleLeave(code, playerId)
    }
  }, [code, partyHost])

  return { state, youId, error, connected, send }
}
