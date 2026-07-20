'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useRoom } from '@/lib/realtime/use-room'
import type { HostColorChoice } from '@/lib/realtime/protocol'

type Props = { code: string }

const GUEST_NAME_KEY = 'chess-shuffle-guest-name'
const MAX_NAME_LEN = 20

const COLOR_OPTIONS: { value: HostColorChoice; label: string }[] = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'random', label: 'Random' },
]

function sanitizeName(raw: string) {
  return raw.trim().slice(0, MAX_NAME_LEN)
}

export function LobbyPanel({ code }: Props) {
  const router = useRouter()
  const { state, youId, error, connected, send } = useRoom(code)
  const [copied, setCopied] = useState(false)
  const [hostColor, setHostColor] = useState<HostColorChoice>('random')
  const [pseudo, setPseudo] = useState('')
  const restoredName = useRef(false)

  const isHost = state?.hostId === youId
  const isGuest = state?.guestId === youId
  const guestReady = Boolean(state?.guestId)
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/lobby/${code}`
      : `/lobby/${code}`

  useEffect(() => {
    if (state?.phase === 'playing') {
      router.push(`/game/${code}`)
    }
  }, [state?.phase, code, router])

  // Restore saved guest name once connected as guest
  useEffect(() => {
    if (!isGuest || !connected || restoredName.current) return
    restoredName.current = true
    const saved = sanitizeName(sessionStorage.getItem(GUEST_NAME_KEY) ?? '')
    if (!saved) return
    setPseudo(saved)
    void send({ type: 'join', name: saved })
  }, [isGuest, connected, send])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  function savePseudo(e: FormEvent) {
    e.preventDefault()
    const name = sanitizeName(pseudo)
    if (!name) return
    sessionStorage.setItem(GUEST_NAME_KEY, name)
    setPseudo(name)
    void send({ type: 'join', name })
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-[#3d342c] bg-[#241e18]/90 p-6 shadow-xl">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[#9a8b78]">Lobby</p>
        <h1 className="mt-1 font-serif text-3xl text-[#f3efe6]">{code}</h1>
        <p className="mt-2 text-sm text-[#9a8b78]">
          Open a <strong className="text-[#f3efe6]">second tab</strong> (or another browser),
          join with this code, then the host clicks Start.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void copyLink()}
          className="flex-1 rounded-lg border border-[#3d342c] px-3 py-2 text-sm text-[#f3efe6] hover:border-[#c4a35a]"
        >
          {copied ? 'Link copied' : 'Copy lobby link'}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <PlayerRow
          label="Host"
          name={state?.hostName}
          you={state?.hostId === youId}
          present={Boolean(state?.hostId)}
        />
        <PlayerRow
          label="Guest"
          name={state?.guestName}
          you={state?.guestId === youId}
          present={Boolean(state?.guestId)}
        />
      </div>

      {isGuest && (
        <form onSubmit={savePseudo} className="flex gap-2">
          <input
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.slice(0, MAX_NAME_LEN))}
            placeholder="Your nickname"
            maxLength={MAX_NAME_LEN}
            className="flex-1 rounded-lg border border-[#3d342c] bg-[#1a1510] px-3 py-2 text-sm text-[#f3efe6] outline-none placeholder:text-[#6b5e50] focus:border-[#c4a35a]"
          />
          <button
            type="submit"
            disabled={!sanitizeName(pseudo)}
            className="rounded-lg border border-[#c4a35a] px-3 py-2 text-sm font-semibold text-[#c4a35a] transition enabled:hover:bg-[#c4a35a]/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Set
          </button>
        </form>
      )}

      {isHost && (
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.15em] text-[#9a8b78]">
            Your color
          </p>
          <div className="grid grid-cols-3 gap-2">
            {COLOR_OPTIONS.map((opt) => {
              const active = hostColor === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setHostColor(opt.value)}
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    active
                      ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-[#f3efe6]'
                      : 'border-[#3d342c] text-[#9a8b78] hover:border-[#6a5c4c]'
                  }`}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-[#9a8b78]">
        {connected ? 'Connected' : 'Connecting…'}
        {!process.env.NEXT_PUBLIC_PARTYKIT_HOST && ' · local room sync'}
      </p>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {isHost ? (
        <button
          type="button"
          disabled={!guestReady}
          onClick={() => void send({ type: 'start', hostColor })}
          className="rounded-lg bg-[#c4a35a] px-5 py-3 font-semibold text-[#1a1510] transition enabled:hover:bg-[#d4b56a] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {guestReady ? 'Start game' : 'Waiting for guest…'}
        </button>
      ) : state?.hostId ? (
        <p className="rounded-lg border border-[#3d342c] px-4 py-3 text-center text-sm text-[#9a8b78]">
          Waiting for host to start…
        </p>
      ) : (
        <p className="rounded-lg border border-[#3d342c] px-4 py-3 text-center text-sm text-[#9a8b78]">
          Connecting to lobby…
        </p>
      )}
    </div>
  )
}

function PlayerRow({
  label,
  name,
  you,
  present,
}: {
  label: string
  name: string | null | undefined
  you: boolean
  present: boolean
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#3d342c] px-3 py-2">
      <span className="text-[#9a8b78]">{label}</span>
      <span className="text-[#f3efe6]">
        {present ? `${name ?? 'Player'}${you ? ' (you)' : ''}` : 'Waiting…'}
      </span>
    </div>
  )
}
