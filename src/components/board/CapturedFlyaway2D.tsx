'use client'

import { useEffect, useRef } from 'react'
import type { Color, PieceSymbol } from '@/lib/chess/types'
import { PieceSvg } from './PieceSvg'

export type Flyaway2DSpec = {
  id: string
  type: PieceSymbol
  color: Color
  /** Board-local px center of the captured square. */
  originX: number
  originY: number
  /** Kick direction in board space (normalized). */
  kickX: number
  kickY: number
}

type Props = {
  spec: Flyaway2DSpec
  size: number
  onDone: (id: string) => void
}

/** Captured piece flies off the 2D board with spin + gravity. */
export function CapturedFlyaway2D({ spec, size, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const done = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const motion = useRef({
    x: spec.originX,
    y: spec.originY,
    vx: spec.kickX * (220 + Math.random() * 160) + (Math.random() - 0.5) * 60,
    vy: -(320 + Math.random() * 180),
    rot: 0,
    vr: (Math.random() - 0.5) * 720,
    t: 0,
  })

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      if (done.current) return
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      const m = motion.current
      m.t += dt
      m.vy += 980 * dt
      m.x += m.vx * dt
      m.y += m.vy * dt
      m.rot += m.vr * dt

      const el = ref.current
      if (el) {
        const fade = Math.max(0, 1 - m.t / 1.35)
        el.style.transform = `translate(${m.x - size / 2}px, ${m.y - size / 2}px) rotate(${m.rot}deg)`
        el.style.opacity = String(fade)
      }

      if (m.t > 1.35 || m.y > window.innerHeight + 80) {
        done.current = true
        onDoneRef.current(spec.id)
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [size, spec.id])

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{
        width: size,
        height: size,
        transform: `translate(${spec.originX - size / 2}px, ${spec.originY - size / 2}px)`,
      }}
    >
      <PieceSvg type={spec.type} color={spec.color} className="h-full w-full" />
    </div>
  )
}
