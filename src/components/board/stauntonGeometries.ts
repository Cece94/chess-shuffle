import * as THREE from 'three'
import type { PieceSymbol } from '@/lib/chess/types'

/** Build a turned (lathe) mesh from [radius, height] profile points. */
function lathe(points: [number, number][], segments = 36): THREE.LatheGeometry {
  const curve = points.map(([r, y]) => new THREE.Vector2(r, y))
  const geo = new THREE.LatheGeometry(curve, segments)
  geo.computeVertexNormals()
  return geo
}

// Shared geometries — created once for all pieces on the board
const cache: Partial<Record<string, THREE.BufferGeometry>> = {}

function get(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  if (!cache[key]) cache[key] = factory()
  return cache[key]!
}

/** Classic Staunton-ish turned profiles (units ≈ board square = 1). */
export function getStauntonGeometry(type: PieceSymbol): THREE.BufferGeometry {
  switch (type) {
    case 'p':
      return get('pawn-v3', () =>
        lathe([
          [0.0, 0],
          [0.28, 0],
          [0.3, 0.04],
          [0.26, 0.08],
          [0.18, 0.12],
          [0.14, 0.22],
          [0.12, 0.34],
          [0.16, 0.38],
          [0.14, 0.42],
          [0.1, 0.46],
          // Rounder Staunton head (sphere-like lathe)
          [0.12, 0.5],
          [0.16, 0.54],
          [0.18, 0.6],
          [0.17, 0.66],
          [0.13, 0.7],
          [0.07, 0.72],
          [0.0, 0.73],
        ]),
      )
    case 'r':
      return get('rook-body-v2', () =>
        lathe([
          [0.0, 0],
          [0.3, 0],
          [0.32, 0.035],
          [0.28, 0.07],
          [0.2, 0.1],
          // Double pedestal rings
          [0.24, 0.13],
          [0.26, 0.16],
          [0.2, 0.19],
          [0.16, 0.22],
          // Straight tower shaft
          [0.15, 0.3],
          [0.14, 0.48],
          // Collar under battlements
          [0.17, 0.52],
          [0.2, 0.55],
          [0.21, 0.58],
          [0.22, 0.62],
          [0.22, 0.66],
          [0.0, 0.66],
        ], 48),
      )
    case 'b':
      return get('bishop-v3', () =>
        lathe([
          [0.0, 0],
          [0.28, 0],
          [0.3, 0.035],
          [0.26, 0.07],
          [0.18, 0.1],
          // Pedestal rings
          [0.22, 0.13],
          [0.24, 0.16],
          [0.18, 0.19],
          [0.13, 0.22],
          // Slim stem
          [0.11, 0.32],
          [0.1, 0.48],
          // Collar below mitre
          [0.14, 0.54],
          [0.16, 0.58],
          [0.13, 0.62],
          // Mitre: wide mid, then sharp conical tip
          [0.15, 0.66],
          [0.175, 0.72],
          [0.17, 0.78],
          [0.13, 0.84],
          [0.085, 0.89],
          [0.045, 0.93],
          [0.02, 0.96],
          [0.0, 0.98],
        ], 48),
      )
    case 'q':
      return get('queen-v3', () =>
        lathe([
          [0.0, 0],
          [0.28, 0],
          [0.3, 0.035],
          [0.26, 0.07],
          [0.18, 0.1],
          [0.22, 0.13],
          [0.24, 0.16],
          [0.18, 0.19],
          [0.13, 0.22],
          // Slimmer stem
          [0.1, 0.32],
          [0.09, 0.52],
          [0.1, 0.64],
          [0.15, 0.7],
          [0.16, 0.74],
          [0.13, 0.78],
          [0.12, 0.82],
          [0.17, 0.86],
          [0.18, 0.92],
          [0.15, 0.96],
          [0.09, 0.98],
          [0.0, 0.98],
        ], 48),
      )
    case 'k':
      return get('king-v3', () =>
        lathe([
          [0.0, 0],
          [0.28, 0],
          [0.3, 0.035],
          [0.26, 0.07],
          [0.18, 0.1],
          [0.22, 0.13],
          [0.24, 0.16],
          [0.18, 0.19],
          [0.13, 0.22],
          [0.1, 0.34],
          [0.09, 0.56],
          [0.1, 0.7],
          [0.16, 0.76],
          [0.17, 0.8],
          [0.14, 0.84],
          [0.13, 0.88],
          [0.18, 0.92],
          [0.2, 0.98],
          [0.16, 1.02],
          [0.1, 1.04],
          [0.0, 1.04],
        ], 48),
      )
    case 'n':
      return get('knight-base-v2', () =>
        // Double-ring Staunton pedestal (matches reference)
        lathe([
          [0.0, 0],
          [0.3, 0],
          [0.32, 0.03],
          [0.3, 0.07],
          [0.24, 0.09],
          [0.26, 0.12],
          [0.28, 0.16],
          [0.24, 0.2],
          [0.18, 0.22],
          [0.16, 0.28],
          [0.14, 0.32],
          [0.0, 0.32],
        ]),
      )

    default:
      return get('pawn', () => lathe([[0.2, 0], [0.0, 0.5]]))
  }
}

/**
 * Staunton merlon: extruded tooth with slight top flare and soft bevels
 * (local: +Y up, extrusion along Z — rotate Y to face outward).
 */
export function getRookMerlon(): THREE.BufferGeometry {
  return get('rook-merlon-v3', () => {
    const shape = new THREE.Shape()
    const w = 0.052
    const h = 0.135
    shape.moveTo(-w, 0)
    shape.lineTo(w, 0)
    shape.lineTo(w * 0.92, h * 0.72)
    // Small corbelled cap
    shape.lineTo(w * 1.2, h)
    shape.lineTo(-w * 1.2, h)
    shape.lineTo(-w * 0.92, h * 0.72)
    shape.closePath()

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.085,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.012,
      bevelSegments: 3,
      curveSegments: 4,
    })
    geo.translate(0, 0, -0.0425)
    geo.computeVertexNormals()
    return geo
  })
}

/** Continuous low parapet between the four merlons. */
export function getRookParapet(): THREE.CylinderGeometry {
  return get(
    'rook-parapet',
    () => new THREE.CylinderGeometry(0.215, 0.215, 0.045, 32, 1, false),
  ) as THREE.CylinderGeometry
}

/** Rim ring sitting under the battlements. */
export function getRookBattlementRing(): THREE.TorusGeometry {
  return get('rook-rim-v2', () => new THREE.TorusGeometry(0.2, 0.016, 8, 32)) as THREE.TorusGeometry
}

/** Thin collar band under the bishop mitre. */
export function getBishopCollar(): THREE.TorusGeometry {
  return get('bishop-collar', () => new THREE.TorusGeometry(0.145, 0.018, 8, 28)) as THREE.TorusGeometry
}

export function getKingCross(): {
  upright: THREE.BoxGeometry
  bar: THREE.BoxGeometry
  cap: THREE.BoxGeometry
} {
  return {
    upright: get('king-cross-v2', () => new THREE.BoxGeometry(0.07, 0.28, 0.07)) as THREE.BoxGeometry,
    bar: get('king-cross-h2', () => new THREE.BoxGeometry(0.2, 0.065, 0.07)) as THREE.BoxGeometry,
    cap: get('king-cross-cap', () => new THREE.BoxGeometry(0.09, 0.05, 0.09)) as THREE.BoxGeometry,
  }
}

export function getBishopFinial(): THREE.SphereGeometry {
  return get('bishop-ball-v2', () => new THREE.SphereGeometry(0.04, 16, 12)) as THREE.SphereGeometry
}

/** Soft oval for the mitre cleft shadow (not wood). */
export function getBishopCleft(): THREE.BoxGeometry {
  return get('bishop-cleft', () => new THREE.BoxGeometry(0.028, 0.22, 0.16)) as THREE.BoxGeometry
}

/** Coronet pearl: small turned teardrop (not a bare sphere). */
export function getQueenCoronetBall(): THREE.BufferGeometry {
  return get('queen-pearl-v3', () =>
    lathe(
      [
        [0.0, 0],
        [0.012, 0.01],
        [0.028, 0.035],
        [0.034, 0.055],
        [0.03, 0.075],
        [0.018, 0.09],
        [0.0, 0.1],
      ],
      20,
    ),
  )
}

/** Pointed fleuron leaf for the coronet rim. */
export function getQueenFleuron(): THREE.BufferGeometry {
  return get('queen-fleuron-v3', () =>
    lathe(
      [
        [0.0, 0],
        [0.032, 0],
        [0.038, 0.02],
        [0.03, 0.05],
        [0.018, 0.09],
        [0.008, 0.13],
        [0.0, 0.155],
      ],
      16,
    ),
  )
}

export function getCrownBand(): THREE.TorusGeometry {
  return get('crown-band-v3', () => new THREE.TorusGeometry(0.158, 0.02, 10, 36)) as THREE.TorusGeometry
}

/**
 * Staunton knight: side silhouette extruded with bevel (mane notches in profile).
 * Local space: +X = snout, +Y = up; mesh is rotated to face along board +Z.
 */
export function getKnightBodyGeometry(): THREE.BufferGeometry {
  return get('knight-body-v2', () => {
    const shape = new THREE.Shape()

    // Bottom of neck sitting on the pedestal
    shape.moveTo(-0.06, 0.0)
    shape.lineTo(0.1, 0.0)

    // Chest bulge (forward)
    shape.bezierCurveTo(0.18, 0.05, 0.24, 0.14, 0.22, 0.28)
    shape.bezierCurveTo(0.2, 0.38, 0.2, 0.44, 0.24, 0.48)

    // Jaw → snout tip (slightly downward)
    shape.lineTo(0.34, 0.5)
    shape.lineTo(0.4, 0.54)
    // Mouth notch
    shape.lineTo(0.38, 0.56)
    shape.lineTo(0.4, 0.58)
    // Top of snout / nose bridge
    shape.lineTo(0.36, 0.66)
    shape.bezierCurveTo(0.3, 0.72, 0.22, 0.76, 0.14, 0.78)

    // Forehead / ear ledge
    shape.lineTo(0.1, 0.82)
    shape.lineTo(0.04, 0.8)

    // Mane: stepped notches along the outer neck curve
    const mane = [
      [-0.02, 0.74],
      [-0.0, 0.7],
      [-0.06, 0.68],
      [-0.04, 0.64],
      [-0.1, 0.6],
      [-0.08, 0.55],
      [-0.14, 0.5],
      [-0.11, 0.44],
      [-0.16, 0.38],
      [-0.13, 0.32],
      [-0.17, 0.26],
      [-0.14, 0.2],
      [-0.16, 0.14],
      [-0.12, 0.08],
      [-0.1, 0.04],
    ] as [number, number][]
    for (const [mx, my] of mane) shape.lineTo(mx, my)
    shape.lineTo(-0.06, 0.0)

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.22,
      bevelEnabled: true,
      bevelThickness: 0.035,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 12,
    })

    // Center on X depth and lift so y=0 sits on pedestal top
    geo.translate(0, 0, -0.11)
    geo.computeVertexNormals()
    return geo
  })
}

export function getKnightEarGeometry(): THREE.BufferGeometry {
  return get('knight-ear', () => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(0.035, 0.02)
    shape.lineTo(0.01, 0.11)
    shape.lineTo(-0.02, 0.02)
    shape.lineTo(0, 0)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.008,
      bevelSegments: 2,
    })
    geo.translate(0, 0, -0.02)
    geo.computeVertexNormals()
    return geo
  })
}
