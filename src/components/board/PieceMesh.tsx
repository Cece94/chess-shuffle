'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { DoubleSide, type Mesh, type MeshBasicMaterial } from 'three'
import { squareToWorld } from '@/lib/chess/coords'
import type { Color, PieceSymbol } from '@/lib/chess/types'
import {
  getBishopCleft,
  getBishopCollar,
  getBishopFinial,
  getCrownBand,
  getKingCross,
  getKnightBodyGeometry,
  getKnightEarGeometry,
  getQueenCoronetBall,
  getQueenFleuron,
  getRookBattlementRing,
  getRookMerlon,
  getRookParapet,
  getStauntonGeometry,
} from './stauntonGeometries'
import { getWoodTexture } from './woodTextures'

type PieceMeshProps = {
  type: PieceSymbol
  color: Color
  square: string
  selected: boolean
  inCheck?: boolean
  onSelect: () => void
}

/** Pulsing red ring under a checked king. */
function CheckHalo() {
  const ringRef = useRef<Mesh>(null)
  const discRef = useRef<Mesh>(null)

  useFrame(({ clock }) => {
    const t = 0.4 + Math.sin(clock.elapsedTime * 3.2) * 0.18
    const ring = ringRef.current?.material as MeshBasicMaterial | undefined
    const disc = discRef.current?.material as MeshBasicMaterial | undefined
    if (ring) ring.opacity = t
    if (disc) disc.opacity = t * 0.45
  })

  return (
    <group>
      <mesh ref={discRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.48, 48]} />
        <meshBasicMaterial
          color="#ff2a2a"
          transparent
          opacity={0.2}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.52, 48]} />
        <meshBasicMaterial
          color="#ff1a1a"
          transparent
          opacity={0.55}
          depthWrite={false}
          side={DoubleSide}
        />
      </mesh>
    </group>
  )
}

/** Piece body only — used on the board and for capture flyaways. */
export function PieceVisual({ type, color }: { type: PieceSymbol; color: Color }) {
  const isWhite = color === 'w'
  const wood = useMemo(() => {
    const map = getWoodTexture(isWhite ? 'light' : 'dark')
    return {
      map,
      // Mid gray stained wood — bump brings the grain back
      color: isWhite ? '#f5efe4' : '#a8a49e',
      roughness: isWhite ? 0.42 : 0.46,
      metalness: 0.02,
      bumpScale: isWhite ? 0.04 : 0.055,
      envMapIntensity: isWhite ? 0.35 : 0.4,
    }
  }, [isWhite])

  return (
    <group rotation={[0, color === 'w' ? 0 : Math.PI, 0]}>
      {type === 'p' && <PawnMat {...wood} />}
      {type === 'r' && <RookMat {...wood} />}
      {type === 'n' && <KnightMat {...wood} />}
      {type === 'b' && <BishopMat {...wood} />}
      {type === 'q' && <QueenMat {...wood} />}
      {type === 'k' && <KingMat {...wood} />}
    </group>
  )
}

export function PieceMesh({
  type,
  color,
  square,
  selected,
  inCheck = false,
  onSelect,
}: PieceMeshProps) {
  const [x, , z] = squareToWorld(square)
  const lift = selected ? 0.18 : 0

  return (
    <group
      position={[x, lift, z]}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      {inCheck && <CheckHalo />}
      <PieceVisual type={type} color={color} />
    </group>
  )
}

type MatProps = {
  map: ReturnType<typeof getWoodTexture>
  color: string
  roughness: number
  metalness: number
  bumpScale: number
  envMapIntensity?: number
}

function Mat({ map, color, roughness, metalness, bumpScale, envMapIntensity = 0.35 }: MatProps) {
  return (
    <meshStandardMaterial
      map={map}
      bumpMap={map}
      bumpScale={bumpScale}
      color={color}
      roughness={roughness}
      metalness={metalness}
      envMapIntensity={envMapIntensity}
      // Lathe shells are single-sided — DoubleSide keeps bottoms/backs solid in flight
      side={DoubleSide}
    />
  )
}

function PawnMat(props: MatProps) {
  return (
    <group scale={0.78}>
      <mesh castShadow geometry={getStauntonGeometry('p')} dispose={null}>
        <Mat {...props} />
      </mesh>
    </group>
  )
}

function RookMat(props: MatProps) {
  const merlon = getRookMerlon()
  // Four outward-facing merlons on the parapet
  const slots = [
    { x: 0, z: 0.175, ry: 0 },
    { x: 0, z: -0.175, ry: Math.PI },
    { x: 0.175, z: 0, ry: Math.PI / 2 },
    { x: -0.175, z: 0, ry: -Math.PI / 2 },
  ]

  return (
    <group>
      <mesh castShadow geometry={getStauntonGeometry('r')} dispose={null}>
        <Mat {...props} />
      </mesh>
      <mesh
        castShadow
        geometry={getRookBattlementRing()}
        position={[0, 0.66, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>
      {/* Low continuous wall between teeth */}
      <mesh castShadow geometry={getRookParapet()} position={[0, 0.682, 0]} dispose={null}>
        <Mat {...props} />
      </mesh>
      {slots.map((s, i) => (
        <mesh
          key={i}
          castShadow
          geometry={merlon}
          position={[s.x, 0.7, s.z]}
          rotation={[0, s.ry, 0]}
          dispose={null}
        >
          <Mat {...props} />
        </mesh>
      ))}
    </group>
  )
}

function BishopMat(props: MatProps) {
  return (
    <group>
      <mesh castShadow geometry={getStauntonGeometry('b')} dispose={null}>
        <Mat {...props} />
      </mesh>
      {/* Collar ring below the mitre */}
      <mesh
        castShadow
        geometry={getBishopCollar()}
        position={[0, 0.7, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>
      {/* Classic diagonal mitre cleft — high contrast so it reads vs pawn */}
      <mesh
        geometry={getBishopCleft()}
        position={[0.018, 1.0, 0]}
        rotation={[0, 0, 0.52]}
        dispose={null}
      >
        <meshStandardMaterial color="#0a0806" roughness={0.9} transparent opacity={0.55} />
      </mesh>
      <mesh
        geometry={getBishopCleft()}
        position={[-0.008, 1.02, 0]}
        rotation={[0, 0, 0.52]}
        scale={[0.5, 0.9, 0.72]}
        dispose={null}
      >
        <meshStandardMaterial color="#0a0806" roughness={0.95} transparent opacity={0.28} />
      </mesh>
      <mesh castShadow geometry={getBishopFinial()} position={[0, 1.31, 0]} scale={0.85} dispose={null}>
        <Mat {...props} />
      </mesh>
    </group>
  )
}

function QueenMat(props: MatProps) {
  const pearl = getQueenCoronetBall()
  const fleuron = getQueenFleuron()
  // Alternating pointed fleurons + teardrop pearls around the coronet
  const points = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2
    return {
      x: Math.cos(a) * 0.158,
      z: Math.sin(a) * 0.158,
      spike: i % 2 === 0,
    }
  })

  return (
    <group scale={1.18}>
      <mesh castShadow geometry={getStauntonGeometry('q')} dispose={null}>
        <Mat {...props} />
      </mesh>
      <mesh
        castShadow
        geometry={getCrownBand()}
        position={[0, 0.94, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>
      {points.map((p, i) =>
        p.spike ? (
          <mesh
            key={i}
            castShadow
            geometry={fleuron}
            position={[p.x, 0.95, p.z]}
            dispose={null}
          >
            <Mat {...props} />
          </mesh>
        ) : (
          <mesh
            key={i}
            castShadow
            geometry={pearl}
            position={[p.x, 0.955, p.z]}
            dispose={null}
          >
            <Mat {...props} />
          </mesh>
        ),
      )}
      {/* Central finial pearl */}
      <mesh castShadow geometry={pearl} position={[0, 1.08, 0]} scale={1.45} dispose={null}>
        <Mat {...props} />
      </mesh>
    </group>
  )
}

function KingMat(props: MatProps) {
  const { upright, bar, cap } = getKingCross()
  const jewels = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2
    return [Math.cos(a) * 0.17, 1.0, Math.sin(a) * 0.17] as const
  })

  return (
    <group scale={1.22}>
      <mesh castShadow geometry={getStauntonGeometry('k')} dispose={null}>
        <Mat {...props} />
      </mesh>
      <mesh
        castShadow
        geometry={getCrownBand()}
        position={[0, 1.0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={1.05}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>
      {jewels.map((pos, i) => (
        <mesh
          key={i}
          castShadow
          geometry={getQueenCoronetBall()}
          position={pos}
          scale={0.8}
          dispose={null}
        >
          <Mat {...props} />
        </mesh>
      ))}
      <mesh castShadow geometry={cap} position={[0, 1.1, 0]} dispose={null}>
        <Mat {...props} />
      </mesh>
      <mesh castShadow geometry={upright} position={[0, 1.24, 0]} dispose={null}>
        <Mat {...props} />
      </mesh>
      <mesh castShadow geometry={bar} position={[0, 1.26, 0]} dispose={null}>
        <Mat {...props} />
      </mesh>
      <mesh castShadow geometry={cap} position={[0, 1.38, 0]} scale={0.7} dispose={null}>
        <Mat {...props} />
      </mesh>
    </group>
  )
}

function KnightMat(props: MatProps) {
  return (
    <group scale={0.82}>
      {/* Double-ring pedestal */}
      <mesh castShadow geometry={getStauntonGeometry('n')} dispose={null}>
        <Mat {...props} />
      </mesh>

      {/* Extruded Staunton silhouette (+X snout → rotate to face +Z) */}
      <mesh
        castShadow
        geometry={getKnightBodyGeometry()}
        position={[0, 0.32, 0]}
        rotation={[0, Math.PI / 2, 0]}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>

      {/* Ears */}
      <mesh
        castShadow
        geometry={getKnightEarGeometry()}
        position={[-0.04, 1.12, 0.08]}
        rotation={[0.15, 0.4, -0.35]}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>
      <mesh
        castShadow
        geometry={getKnightEarGeometry()}
        position={[0.04, 1.12, 0.08]}
        rotation={[0.15, -0.15, 0.25]}
        dispose={null}
      >
        <Mat {...props} />
      </mesh>

      {/* Eye hollows */}
      <mesh position={[0.07, 0.98, 0.22]} rotation={[0, 0.3, 0]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshStandardMaterial color="#0a0806" roughness={0.9} transparent opacity={0.45} />
      </mesh>
      <mesh position={[-0.07, 0.98, 0.22]} rotation={[0, -0.3, 0]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshStandardMaterial color="#0a0806" roughness={0.9} transparent opacity={0.45} />
      </mesh>
    </group>
  )
}
