'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function JoinLobbyForm() {
  const router = useRouter()
  const [code, setCode] = useState('')

  return (
    <form
      className="flex w-full gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        const cleaned = code.trim().toUpperCase()
        if (cleaned.length >= 4) router.push(`/lobby/${cleaned}`)
      }}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="LOBBY CODE"
        maxLength={8}
        className="flex-1 rounded-lg border border-[#3d342c] bg-[#241e18] px-4 py-3 tracking-widest text-[#f3efe6] outline-none focus:border-[#c4a35a]"
      />
      <button
        type="submit"
        className="rounded-lg border border-[#c4a35a] px-4 py-3 font-semibold text-[#c4a35a] transition hover:bg-[#c4a35a]/10"
      >
        Join
      </button>
    </form>
  )
}
