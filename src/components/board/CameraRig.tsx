'use client'

import { useLayoutEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import type { Color } from '@/lib/chess/types'
import { useGameUiStore } from '@/store/gameUiStore'
import { markOrbitDragEnded } from './orbitClickGuard'

const BASE_HEIGHT = 9.5
const BASE_BACK = 8.8
const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.4
const DRAG_THRESHOLD_PX = 4
// Limit pitch so the board never flips or goes edge-on
const MIN_POLAR = 0.35
const MAX_POLAR = 1.35
const DEFAULT_POLAR = Math.atan2(BASE_BACK, BASE_HEIGHT)

function resetView(
  zoom: { current: number },
  yaw: { current: number },
  polar: { current: number },
) {
  zoom.current = 1
  yaw.current = 0
  polar.current = DEFAULT_POLAR
}

/** Angled view + wheel zoom + left-drag orbit. */
export function CameraRig({ orientation }: { orientation: Color }) {
  const { camera, gl, size } = useThree()
  const viewResetNonce = useGameUiStore((s) => s.viewResetNonce)
  const zoom = useRef(1)
  const yaw = useRef(0)
  const polar = useRef(DEFAULT_POLAR)
  const dragging = useRef(false)
  const moved = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)

  // Reset orbit when flipping white/black orientation or UI reset
  useLayoutEffect(() => {
    resetView(zoom, yaw, polar)
  }, [orientation, viewResetNonce])

  useLayoutEffect(() => {
    const el = gl.domElement

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoom.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.current + e.deltaY * 0.0012))
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      dragging.current = true
      moved.current = false
      lastX.current = e.clientX
      lastY.current = e.clientY
    }

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      const dy = e.clientY - lastY.current
      if (!moved.current && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      moved.current = true
      lastX.current = e.clientX
      lastY.current = e.clientY
      // Horizontal drag spins around the board; vertical tilts the view
      yaw.current -= dx * 0.005
      polar.current = Math.min(MAX_POLAR, Math.max(MIN_POLAR, polar.current + dy * 0.004))
    }

    const onPointerUp = () => {
      if (dragging.current && moved.current) markOrbitDragEnded()
      dragging.current = false
      moved.current = false
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
    }
  }, [gl])

  useFrame(() => {
    const cam = camera as PerspectiveCamera
    const zSign = orientation === 'w' ? 1 : -1
    const r = Math.hypot(BASE_HEIGHT, BASE_BACK) * zoom.current
    const y = r * Math.cos(polar.current)
    const flat = r * Math.sin(polar.current)
    // Base view is along ±Z; yaw rotates around Y
    const x = flat * Math.sin(yaw.current)
    const z = zSign * flat * Math.cos(yaw.current)
    cam.position.set(x, y, z)
    cam.up.set(0, 1, 0)
    cam.lookAt(0, 0, 0)
    const aspect = size.width / Math.max(size.height, 1)
    cam.fov = aspect < 1 ? 44 : 40
    cam.updateProjectionMatrix()
  })

  return null
}
