'use client'

import type { ReactNode } from 'react'
import { MaterialMeter } from '@/components/ui/MaterialMeter'

type Props = {
  fen: string
  /** Optional column left of the board (e.g. bot matchup). */
  leftSlot?: ReactNode
  children: ReactNode
  /**
   * 3D: full-bleed canvas — HUD pinned to the screen sides.
   * 2D: framed square — HUD flush to the 2D board edges.
   */
  immersive?: boolean
}

/**
 * Board layout + side HUD (names / material).
 */
export function BoardStage({ fen, leftSlot, children, immersive = false }: Props) {
  if (immersive) {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0">{children}</div>

        {/* Completely on the left edge of the screen */}
        {leftSlot ? (
          <div className="pointer-events-none absolute left-3 top-1/2 z-10 w-[5.75rem] -translate-y-1/2 sm:left-5 sm:w-32 md:left-8 lg:left-10 lg:w-36">
            {leftSlot}
          </div>
        ) : null}

        {/* Completely on the right edge of the screen */}
        <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-5 md:right-8 lg:right-10">
          <MaterialMeter fen={fen} />
        </div>
      </div>
    )
  }

  // 2D: HUD at the board box edges
  return (
    <div className="absolute inset-0 flex items-center justify-center px-2 pb-20 pt-16 sm:px-4">
      <div className="flex max-h-full max-w-full items-center gap-1 sm:gap-1.5">
        {leftSlot ? (
          <div className="pointer-events-none w-[5.75rem] shrink-0 sm:w-32 lg:w-36">
            {leftSlot}
          </div>
        ) : null}

        <div
          className="relative aspect-square shrink-0 overflow-hidden rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{
            width: 'min(100dvw - 12rem, 100dvh - 10rem, 42rem)',
            maxWidth: '100%',
          }}
        >
          {children}
        </div>

        <div className="pointer-events-none shrink-0 self-center">
          <MaterialMeter fen={fen} />
        </div>
      </div>
    </div>
  )
}
