'use client'

import { useLayoutEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import type { PerspectiveCamera } from 'three'
import type { Color } from '@/lib/chess/types'

const BASE_HEIGHT = 9.5
const BASE_BACK = 8.8
const MIN_ZOOM = 0.7
const MAX_ZOOM = 1.4

/** Fixed angled view + limited mouse-wheel zoom. */
export function CameraRig({ orientation }: { orientation: Color }) {
  const { camera, gl, size } = useThree()
  const zoom = useRef(1)

  useLayoutEffect(() => {
    const el = gl.domElement
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      zoom.current = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom.current + e.deltaY * 0.0012))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [gl])

  useFrame(() => {
    const cam = camera as PerspectiveCamera
    const zSign = orientation === 'w' ? 1 : -1
    cam.position.set(0, BASE_HEIGHT * zoom.current, zSign * BASE_BACK * zoom.current)
    cam.up.set(0, 1, 0)
    cam.lookAt(0, 0, 0)
    const aspect = size.width / Math.max(size.height, 1)
    cam.fov = aspect < 1 ? 44 : 40
    cam.updateProjectionMatrix()
  })

  return null
}
