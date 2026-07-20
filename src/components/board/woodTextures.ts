import * as THREE from 'three'

type WoodKind = 'light' | 'dark'

const cache: Partial<Record<string, THREE.CanvasTexture>> = {}

/** Procedural wood grain — shared across all pieces of that color. */
export function getWoodTexture(kind: WoodKind): THREE.CanvasTexture {
  // Versioned key so material tweaks invalidate the in-memory cache
  const key = kind === 'light' ? 'light-v2' : 'gray-v5'
  if (cache[key]) return cache[key]!

  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // Light = warm maple; dark = stained gray wood (still reads as timber)
  const base = kind === 'light' ? '#e8dcc8' : '#9c9892'
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // Vertical grain bands — stronger contrast on gray so wood stays visible
  const bands = kind === 'light' ? 48 : 56
  for (let i = 0; i < bands; i++) {
    const x = (i / bands) * size + Math.sin(i * 1.7) * 6
    const alpha =
      kind === 'light' ? 0.08 + (i % 5) * 0.02 : 0.12 + (i % 5) * 0.035
    const tone =
      kind === 'light'
        ? `rgba(120, 85, 45, ${alpha})`
        : i % 2 === 0
          ? `rgba(45, 42, 38, ${alpha})`
          : `rgba(130, 124, 116, ${alpha * 0.7})`
    ctx.strokeStyle = tone
    ctx.lineWidth = kind === 'light' ? 1.5 + (i % 3) : 1.8 + (i % 4)
    ctx.beginPath()
    for (let y = 0; y <= size; y += 4) {
      const wobble = Math.sin(y * 0.04 + i * 0.6) * 3 + Math.sin(y * 0.01 + i) * 8
      const px = x + wobble
      if (y === 0) ctx.moveTo(px, y)
      else ctx.lineTo(px, y)
    }
    ctx.stroke()
  }

  // Pore / knot noise
  const pores = kind === 'light' ? 900 : 1100
  for (let i = 0; i < pores; i++) {
    const px = Math.random() * size
    const py = Math.random() * size
    const r = Math.random() * 1.6
    ctx.fillStyle =
      kind === 'light'
        ? `rgba(90, 60, 30, ${0.04 + Math.random() * 0.08})`
        : Math.random() > 0.5
          ? `rgba(35, 32, 28, ${0.06 + Math.random() * 0.1})`
          : `rgba(145, 140, 132, ${0.05 + Math.random() * 0.08})`
    ctx.beginPath()
    ctx.ellipse(px, py, r, r * (1.5 + Math.random()), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Growth-ring arcs
  const rings = kind === 'light' ? 5 : 7
  for (let i = 0; i < rings; i++) {
    const cx = size * (0.2 + Math.random() * 0.6)
    const cy = size * (0.15 + Math.random() * 0.7)
    ctx.strokeStyle =
      kind === 'light' ? 'rgba(140, 100, 55, 0.07)' : 'rgba(40, 38, 34, 0.14)'
    ctx.lineWidth = kind === 'light' ? 2 : 2.5
    ctx.beginPath()
    ctx.ellipse(cx, cy, 40 + i * 18, 90 + i * 25, Math.random() * 0.4, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Vertical-only varnish (top→bottom) — never left/right (avoids lathe seam)
  const grad = ctx.createLinearGradient(0, 0, 0, size)
  if (kind === 'light') {
    grad.addColorStop(0, 'rgba(255,255,255,0.05)')
    grad.addColorStop(0.5, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(180,140,90,0.05)')
  } else {
    grad.addColorStop(0, 'rgba(255,255,255,0.06)')
    grad.addColorStop(0.45, 'rgba(255,255,255,0)')
    grad.addColorStop(1, 'rgba(30,28,26,0.05)')
  }
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  // Same scale as light wood so grain reads clearly
  tex.repeat.set(2, 2)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  tex.needsUpdate = true
  cache[key] = tex
  return tex
}
