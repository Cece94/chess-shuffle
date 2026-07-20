'use client'

import { useEffect, useState } from 'react'
import type { BotLevel } from '@/lib/chess/bot'

export type BotFaceMood =
  | 'idle'
  | 'annoyed'
  | 'angry'
  | 'furious'
  | 'thinking'
  | 'worried'

type Props = {
  name: string
  accent: string
  level: BotLevel
  thinking: boolean
  mood?: BotFaceMood
}

const DEFAULT_MOOD: Record<BotLevel, BotFaceMood> = {
  easy: 'idle',
  intermediate: 'annoyed',
  hard: 'angry',
  expert: 'furious',
}

/** Flat bot portrait — denser + angrier as difficulty rises. */
export function BotFace({ name, accent, level, thinking, mood: moodProp }: Props) {
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!thinking) {
      setCycle(0)
      return
    }
    const id = setInterval(() => setCycle((c) => c + 1), 600)
    return () => clearInterval(id)
  }, [thinking])

  const mood: BotFaceMood =
    moodProp ??
    (thinking
      ? cycle % 2 === 0
        ? 'thinking'
        : level === 'easy'
          ? 'worried'
          : DEFAULT_MOOD[level]
      : DEFAULT_MOOD[level])

  return (
    <div className="pointer-events-none relative flex flex-col items-center gap-2">
      <div className="relative">
        {thinking && <ThinkingBubble accent={accent} />}
        <svg
          viewBox="0 -10 100 130"
          className={`h-[6.75rem] w-[5.5rem] transition-transform duration-300 sm:h-[7.75rem] sm:w-[6.4rem] ${
            thinking ? 'scale-105' : 'scale-100'
          }`}
          aria-hidden
        >
          <ellipse cx="50" cy="114" rx="28" ry="4" fill="#1a1510" opacity="0.25" />

          {/* Unique top gear per difficulty — not the same cables every time */}
          <HeadGear accent={accent} thinking={thinking} level={level} />

          {level !== 'easy' && <SideArmor accent={accent} level={level} />}

          {/* Ears — grow with anger */}
          <EarPods accent={accent} level={level} />

          {/* Head shell */}
          <rect x="18" y="26" width="64" height="72" rx="28" fill="#241e18" />
          <rect
            x="18"
            y="26"
            width="64"
            height="72"
            rx="28"
            fill="none"
            stroke={accent}
            strokeWidth={level === 'expert' ? 4 : 3}
          />

          {level === 'hard' && (
            <path
              d="M30 34 H70 L66 42 H34 Z"
              fill="#1a1510"
              stroke={accent}
              strokeWidth="1.5"
            />
          )}
          {level === 'expert' && (
            <path
              d="M28 32 H72 L68 44 H32 Z"
              fill="#1a1510"
              stroke={accent}
              strokeWidth="2"
            />
          )}

          {/* Face panel */}
          <rect
            x="28"
            y="48"
            width="44"
            height={level === 'easy' ? 32 : 36}
            rx="14"
            fill="#1a1510"
          />

          <FaceByLevel mood={mood} accent={accent} cycle={cycle} level={level} />

          <ChinGear accent={accent} thinking={thinking} level={level} />
        </svg>
      </div>
      <p className="max-w-[7.5rem] truncate text-center font-serif text-sm text-[#f3efe6] sm:text-base">
        {name}
      </p>
    </div>
  )
}

function SideArmor({ accent, level }: { accent: string; level: BotLevel }) {
  const thick = level === 'expert' ? 10 : level === 'hard' ? 8 : 6
  return (
    <g>
      <rect x={4} y="58" width={thick} height="28" rx="3" fill="#1a1510" stroke={accent} strokeWidth="1.5" />
      <rect x={96 - thick} y="58" width={thick} height="28" rx="3" fill="#1a1510" stroke={accent} strokeWidth="1.5" />
      {(level === 'hard' || level === 'expert') && (
        <>
          <rect x="2" y="64" width="4" height="4" fill={accent} />
          <rect x="94" y="64" width="4" height="4" fill={accent} />
          <rect x="2" y="74" width="4" height="4" fill={accent} opacity="0.6" />
          <rect x="94" y="74" width="4" height="4" fill={accent} opacity="0.6" />
        </>
      )}
    </g>
  )
}

function ChinGear({
  accent,
  thinking,
  level,
}: {
  accent: string
  thinking: boolean
  level: BotLevel
}) {
  if (level === 'easy') {
    return (
      <>
        <rect x="40" y="86" width="20" height="3" rx="1.5" fill={accent} opacity="0.7" />
      </>
    )
  }
  if (level === 'intermediate') {
    return (
      <>
        <rect x="38" y="88" width="24" height="4" rx="2" fill="#1a1510" />
        <rect
          x="40"
          y="89"
          width={thinking ? 20 : 12}
          height="2"
          rx="1"
          fill={accent}
          className={thinking ? 'animate-pulse' : undefined}
        />
      </>
    )
  }
  // hard / expert — jaw plate + bolts
  return (
    <g>
      <path
        d="M34 86 H66 L62 96 H38 Z"
        fill="#1a1510"
        stroke={accent}
        strokeWidth="1.5"
      />
      <rect x="42" y="89" width="16" height="3" rx="1" fill={accent} opacity={thinking ? 1 : 0.7} />
      <circle cx="38" cy="90" r="2" fill={accent} />
      <circle cx="62" cy="90" r="2" fill={accent} />
      {level === 'expert' && (
        <>
          <rect x="46" y="94" width="2" height="4" fill={accent} />
          <rect x="52" y="94" width="2" height="4" fill={accent} />
        </>
      )}
    </g>
  )
}

function EarPods({ accent, level }: { accent: string; level: BotLevel }) {
  if (level === 'easy') {
    return (
      <g>
        <rect x="6" y="52" width="12" height="22" rx="6" fill="#241e18" />
        <rect x="82" y="52" width="12" height="22" rx="6" fill="#241e18" />
        <circle cx="12" cy="63" r="3" fill={accent} />
        <circle cx="88" cy="63" r="3" fill={accent} />
      </g>
    )
  }
  if (level === 'intermediate') {
    return (
      <g>
        <rect x="4" y="50" width="14" height="26" rx="7" fill="#241e18" stroke={accent} strokeWidth="1.5" />
        <rect x="82" y="50" width="14" height="26" rx="7" fill="#241e18" stroke={accent} strokeWidth="1.5" />
        <circle cx="11" cy="60" r="3" fill={accent} />
        <circle cx="89" cy="60" r="3" fill={accent} />
        <rect x="9" y="66" width="4" height="6" rx="1" fill={accent} opacity="0.5" />
        <rect x="87" y="66" width="4" height="6" rx="1" fill={accent} opacity="0.5" />
      </g>
    )
  }
  // hard / expert — chunky combat cans
  return (
    <g>
      <rect x="2" y="48" width="16" height="30" rx="4" fill="#1a1510" stroke={accent} strokeWidth="2" />
      <rect x="82" y="48" width="16" height="30" rx="4" fill="#1a1510" stroke={accent} strokeWidth="2" />
      <circle cx="10" cy="58" r="3.5" fill={accent} />
      <circle cx="90" cy="58" r="3.5" fill={accent} />
      <rect x="7" y="66" width="6" height="3" fill={accent} />
      <rect x="87" y="66" width="6" height="3" fill={accent} />
      {level === 'expert' && (
        <>
          <path d="M4 46 L10 40 L16 46" fill={accent} />
          <path d="M84 46 L90 40 L96 46" fill={accent} />
        </>
      )}
    </g>
  )
}

/**
 * Head-top silhouette changes with difficulty:
 * easy → single rod · intermediate → dish/headphones · hard → lightning · expert → spike crown
 */
function HeadGear({
  accent,
  thinking,
  level,
}: {
  accent: string
  thinking: boolean
  level: BotLevel
}) {
  if (level === 'easy') {
    return (
      <g>
        <rect x="47" y="10" width="6" height="18" rx="3" fill="#241e18" />
        <circle
          cx="50"
          cy="8"
          r="5"
          fill={accent}
          className={thinking ? 'animate-pulse' : undefined}
        />
      </g>
    )
  }

  if (level === 'intermediate') {
    // Radar dish + twin stub poles — “getting serious”
    return (
      <g>
        <rect x="28" y="22" width="44" height="6" rx="3" fill="#1a1510" stroke={accent} strokeWidth="1.5" />
        <path
          d="M36 22 C36 8 64 8 64 22"
          fill="none"
          stroke={accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="10"
          r="4"
          fill={accent}
          className={thinking ? 'animate-pulse' : undefined}
        />
        <rect x="34" y="14" width="4" height="10" rx="1" fill="#241e18" />
        <rect x="62" y="14" width="4" height="10" rx="1" fill="#241e18" />
      </g>
    )
  }

  if (level === 'hard') {
    // Lightning bolts + smoke vents — angry
    return (
      <g>
        <path
          d="M30 28 L26 8 L34 14 L30 0 L42 18 L36 14 L40 28 Z"
          fill={accent}
        />
        <path
          d="M70 28 L74 8 L66 14 L70 0 L58 18 L64 14 L60 28 Z"
          fill={accent}
        />
        {/* Steam vents */}
        <rect x="46" y="18" width="3" height="10" rx="1" fill="#1a1510" stroke={accent} strokeWidth="1" />
        <rect x="51" y="18" width="3" height="10" rx="1" fill="#1a1510" stroke={accent} strokeWidth="1" />
        {thinking && (
          <>
            <circle cx="47.5" cy="12" r="2" fill={accent} opacity="0.5" className="animate-pulse" />
            <circle cx="52.5" cy="10" r="2.5" fill={accent} opacity="0.35" className="animate-pulse" />
          </>
        )}
      </g>
    )
  }

  // expert — spike crown + rage fins
  return (
    <g>
      {[
        [22, 28, 16, 4],
        [34, 26, 24, -2],
        [50, 24, 50, -8],
        [66, 26, 76, -2],
        [78, 28, 84, 4],
      ].map(([baseX, baseY, tipX, tipY], i) => (
        <path
          key={i}
          d={`M${baseX} ${baseY} L${tipX} ${tipY} L${(baseX as number) + 8} ${baseY} Z`}
          fill={accent}
          opacity={0.75 + i * 0.05}
        />
      ))}
      {/* Center rage gem */}
      <rect
        x="44"
        y="14"
        width="12"
        height="12"
        rx="2"
        fill="#1a1510"
        stroke={accent}
        strokeWidth="2"
        transform="rotate(45 50 20)"
      />
      <circle
        cx="50"
        cy="20"
        r="3"
        fill={accent}
        className={thinking ? 'animate-pulse' : undefined}
      />
      {/* Side rage fins */}
      <path d="M18 40 L8 28 L20 36 Z" fill={accent} />
      <path d="M82 40 L92 28 L80 36 Z" fill={accent} />
    </g>
  )
}

function FaceByLevel({
  mood,
  accent,
  cycle,
  level,
}: {
  mood: BotFaceMood
  accent: string
  cycle: number
  level: BotLevel
}) {
  const look =
    mood === 'thinking' ? (cycle % 3 === 0 ? -3 : cycle % 3 === 1 ? 3 : 0) : 0

  // Anger intensity from mood (and level pushes default higher)
  const anger =
    mood === 'furious' ? 3 : mood === 'angry' ? 2 : mood === 'annoyed' ? 1 : mood === 'worried' ? 1 : 0

  return (
    <g transform="translate(0, 8)">
      {/* Brows — flatter → angrier slash */}
      {anger >= 3 ? (
        <>
          <path d="M32 44 L46 52" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M68 44 L54 52" stroke={accent} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M34 42 L46 50" stroke="#1a1510" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M66 42 L54 50" stroke="#1a1510" strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : anger === 2 ? (
        <>
          <path d="M34 45 L46 51" stroke={accent} strokeWidth="3" strokeLinecap="round" />
          <path d="M66 45 L54 51" stroke={accent} strokeWidth="3" strokeLinecap="round" />
        </>
      ) : anger === 1 ? (
        <>
          <path d="M34 46 L44 49" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M66 46 L56 49" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : mood === 'thinking' ? (
        <>
          <path d="M34 48 L44 45" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M56 45 L66 48" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <line x1="34" y1="47" x2="44" y2="47" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="56" y1="47" x2="66" y2="47" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      {anger >= 2 ? (
        <>
          {/* Narrow angry slits */}
          <path
            d={`M${34 + look} 56 L${44 + look} 58 L${34 + look} 60 Z`}
            fill={accent}
          />
          <path
            d={`M${66 + look} 56 L${56 + look} 58 L${66 + look} 60 Z`}
            fill={accent}
          />
          {anger >= 3 && (
            <>
              <circle cx={38 + look} cy="58" r="2" fill="#1a1510" />
              <circle cx={62 + look} cy="58" r="2" fill="#1a1510" />
            </>
          )}
        </>
      ) : (
        <>
          <circle cx={39 + look} cy="57" r={level === 'easy' ? 5.5 : 5} fill={accent} />
          <circle cx={61 + look} cy="57" r={level === 'easy' ? 5.5 : 5} fill={accent} />
          <rect x={37 + look} y="54.5" width="2" height="2" rx="0.5" fill="#f3efe6" opacity="0.9" />
          <rect x={59 + look} y="54.5" width="2" height="2" rx="0.5" fill="#f3efe6" opacity="0.9" />
        </>
      )}

      {/* Mouth */}
      <Mouth mood={mood} accent={accent} level={level} anger={anger} />
    </g>
  )
}

function Mouth({
  mood,
  accent,
  level,
  anger,
}: {
  mood: BotFaceMood
  accent: string
  level: BotLevel
  anger: number
}) {
  if (mood === 'thinking') {
    return (
      <g>
        <rect x="42" y="66" width="16" height="6" rx="3" fill="#0f0c09" />
        <circle cx="46" cy="69" r="1.4" fill={accent} className="animate-pulse" />
        <circle cx="50" cy="69" r="1.4" fill={accent} opacity="0.65" />
        <circle cx="54" cy="69" r="1.4" fill={accent} opacity="0.35" />
      </g>
    )
  }

  if (anger >= 3 || (anger >= 2 && level === 'expert')) {
    // Gritted teeth
    return (
      <g>
        <rect x="40" y="66" width="20" height="8" rx="2" fill="#0f0c09" stroke={accent} strokeWidth="1.5" />
        {[43, 47, 51, 55].map((x) => (
          <rect key={x} x={x} y="67" width="2.5" height="6" fill="#f3efe6" opacity="0.85" />
        ))}
      </g>
    )
  }

  if (anger === 2) {
    return (
      <path
        d="M40 70 L50 66 L60 70"
        fill="none"
        stroke={accent}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
  }

  if (anger === 1) {
    return (
      <path
        d="M42 69 Q50 66 58 69"
        fill="none"
        stroke={accent}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    )
  }

  // Friendly idle (easy)
  return <rect x="42" y="67" width="16" height="3" rx="1.5" fill={accent} opacity="0.85" />
}

function ThinkingBubble({ accent }: { accent: string }) {
  return (
    <div className="absolute -right-1 top-0 sm:-right-2 sm:top-1" aria-label="Thinking">
      <div
        className="flex items-center gap-1 rounded-full border-2 px-2.5 py-1.5"
        style={{ borderColor: accent, background: '#1a1510' }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full animate-bounce"
            style={{ background: accent, animationDelay: `${i * 130}ms` }}
          />
        ))}
      </div>
      <span
        className="ml-3 mt-[-3px] block h-2 w-2 rotate-45 border-b-2 border-r-2"
        style={{ borderColor: accent, background: '#1a1510' }}
      />
    </div>
  )
}
