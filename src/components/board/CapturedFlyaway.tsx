'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Color, PieceSymbol } from '@/lib/chess/types'
import { PieceVisual } from './PieceMesh'

export type FlyawaySpec = {
  id: string
  type: PieceSymbol
  color: Color
  origin: [number, number, number]
  /** Horizontal kick direction (normalized-ish). */
  kickX: number
  kickZ: number
}

type Props = {
  spec: FlyawaySpec
  onDone: (id: string) => void
}

/** Captured piece: shot off the board with spin + gravity. */
export function CapturedFlyaway({ spec, onDone }: Props) {
  const ref = useRef<Group>(null)
  const done = useRef(false)

  // Randomized once per mount — kick impulse + tumble rates
  const motion = useRef({
    vx: spec.kickX * (5.5 + Math.random() * 3.5) + (Math.random() - 0.5) * 1.5,
    vy: 6.5 + Math.random() * 3.5,
    vz: spec.kickZ * (5.5 + Math.random() * 3.5) + (Math.random() - 0.5) * 1.5,
    rx: (Math.random() - 0.5) * 18,
    ry: (Math.random() - 0.5) * 22,
    rz: (Math.random() - 0.5) * 18,
    t: 0,
  })

  useFrame((_, dt) => {
    const g = ref.current
    if (!g || done.current) return

    const m = motion.current
    const clamped = Math.min(dt, 0.05)
    m.t += clamped
    m.vy -= 14 * clamped

    g.position.x += m.vx * clamped
    g.position.y += m.vy * clamped
    g.position.z += m.vz * clamped
    g.rotation.x += m.rx * clamped
    g.rotation.y += m.ry * clamped
    g.rotation.z += m.rz * clamped

    if (m.t > 1.4 || g.position.y < -3) {
      done.current = true
      onDone(spec.id)
    }
  })

  return (
    <group ref={ref} position={spec.origin}>
      <PieceVisual type={spec.type} color={spec.color} />
    </group>
  )
}
