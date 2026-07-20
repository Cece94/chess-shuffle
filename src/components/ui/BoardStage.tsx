'use client'

import type { ReactNode } from 'react'
import { MaterialMeter } from '@/components/ui/MaterialMeter'
import { useIsMobile } from '@/hooks/useIsMobile'

type Props = {
  fen: string
  /** Optional column left of the board (desktop side matchup). */
  leftSlot?: ReactNode
  /** Mobile bars above / below the board (names + inline score). */
  mobileTop?: ReactNode
  mobileBottom?: ReactNode
  children: ReactNode
  /**
   * 3D: full-bleed canvas — HUD pinned to the screen sides.
   * 2D: framed square — HUD flush to the 2D board edges.
   */
  immersive?: boolean
}

/**
 * Board layout + side HUD (names / material).
 * Mobile 2D: board nearly full-width; chrome lives in top/bottom bars.
 */
export function BoardStage({
  fen,
  leftSlot,
  mobileTop,
  mobileBottom,
  children,
  immersive = false,
}: Props) {
  const isMobile = useIsMobile()

  if (immersive) {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0">{children}</div>

        {leftSlot ? (
          <div className="pointer-events-none absolute left-3 top-1/2 z-10 w-[5.75rem] -translate-y-1/2 sm:left-5 sm:w-32 md:left-8 lg:left-10 lg:w-36">
            {leftSlot}
          </div>
        ) : null}

        <div className="pointer-events-none absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-5 md:right-8 lg:right-10">
          <MaterialMeter fen={fen} />
        </div>
      </div>
    )
  }

  // Mobile 2D: board eats the viewport; matchup bars sit above/below
  if (isMobile) {
    // Reserve header + footer + thin matchup bars; board takes the rest
    const boardSize = 'min(100dvw - 0.5rem, 100dvh - 12rem)'

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-1 pb-14 pt-12">
        {mobileTop ? (
          <div
            className="pointer-events-none shrink-0"
            style={{ width: boardSize, maxWidth: '100%' }}
          >
            {mobileTop}
          </div>
        ) : null}

        <div
          className="relative aspect-square max-w-full shrink-0 overflow-hidden rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{ width: boardSize }}
        >
          {children}
          {/* No matchup bars → keep a tiny score overlay (online games) */}
          {!mobileTop && !mobileBottom ? (
            <div className="pointer-events-none absolute right-1.5 top-1.5 z-10 scale-75 origin-top-right">
              <MaterialMeter fen={fen} />
            </div>
          ) : null}
        </div>

        {mobileBottom ? (
          <div
            className="pointer-events-none shrink-0"
            style={{ width: boardSize, maxWidth: '100%' }}
          >
            {mobileBottom}
          </div>
        ) : null}
      </div>
    )
  }

  // Desktop 2D: board fills available viewport; side HUD stays flush to edges
  return (
    <div className="absolute inset-0 flex items-center justify-center px-3 pb-16 pt-14">
      <div className="flex max-h-full max-w-full items-center gap-2">
        {leftSlot ? (
          <div className="pointer-events-none w-32 shrink-0 lg:w-36">{leftSlot}</div>
        ) : null}

        <div
          className="relative aspect-square max-h-full max-w-full shrink-0 overflow-hidden rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
          style={{
            // No fixed rem cap — grow with the window (side chrome ~13rem, header/footer ~8rem)
            width: leftSlot
              ? 'min(100dvw - 13rem, 100dvh - 8rem)'
              : 'min(100dvw - 6rem, 100dvh - 8rem)',
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
