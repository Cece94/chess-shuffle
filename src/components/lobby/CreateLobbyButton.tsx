'use client'

import { useRouter } from 'next/navigation'
import { customAlphabet } from 'nanoid'

const nanoid = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

export function CreateLobbyButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.push(`/lobby/${nanoid()}`)}
      className="w-full rounded-lg bg-[#c4a35a] px-5 py-3 text-base font-semibold text-[#1a1510] transition hover:bg-[#d4b56a]"
    >
      Create lobby
    </button>
  )
}
