'use client'

import type { HostColorChoice } from '@/lib/realtime/protocol'

type Props = {
  value: HostColorChoice
  onChange: (value: HostColorChoice) => void
}

const OPTIONS: { value: HostColorChoice; label: string }[] = [
  { value: 'w', label: 'White' },
  { value: 'b', label: 'Black' },
  { value: 'random', label: 'Random' },
]

/** Flat color picker with icons (shared lobby + bot setup). */
export function ColorChoicePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {OPTIONS.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm transition ${
              active
                ? 'border-[#c4a35a] bg-[#c4a35a]/15 text-[#f3efe6]'
                : 'border-[#3d342c] text-[#9a8b78] hover:border-[#6a5c4c]'
            }`}
          >
            <ColorIcon choice={opt.value} active={active} />
            <span className="font-medium">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function ColorIcon({ choice, active }: { choice: HostColorChoice; active: boolean }) {
  const ring = active ? '#c4a35a' : '#6b5e50'

  if (choice === 'w') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="12" fill="#f3efe6" stroke={ring} strokeWidth="2" />
      </svg>
    )
  }

  if (choice === 'b') {
    return (
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <circle cx="16" cy="16" r="12" fill="#1a1510" stroke={ring} strokeWidth="2" />
      </svg>
    )
  }

  // Random — half white / half black
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
      <path d="M16 4 A12 12 0 0 1 16 28 Z" fill="#f3efe6" />
      <path d="M16 4 A12 12 0 0 0 16 28 Z" fill="#1a1510" />
      <circle cx="16" cy="16" r="12" fill="none" stroke={ring} strokeWidth="2" />
      <circle cx="16" cy="16" r="2.5" fill="#c4a35a" />
    </svg>
  )
}
