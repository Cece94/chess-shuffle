'use client'

import { Canvas } from '@react-three/fiber'
import { Scene } from './Scene'
import type { ChessMove, Color } from '@/lib/chess/types'
import { CameraRig } from './CameraRig'

type BoardCanvasProps = {
  fen: string
  orientation: Color
  interactive: boolean
  lastMove: ChessMove | null
  onMove: (move: ChessMove) => void
  myColor: Color | null
}

export function BoardCanvas({
  fen,
  orientation,
  interactive,
  lastMove,
  onMove,
  myColor,
}: BoardCanvasProps) {
  return (
    <Canvas
      key={orientation}
      className="h-full w-full"
      style={{ width: '100%', height: '100%', display: 'block' }}
      dpr={[1, 1.5]}
      camera={{ position: [0, 9.5, orientation === 'w' ? 8.8 : -8.8], fov: 40, near: 0.1, far: 100 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
    >
      {/* Cool slate — contrasts warm wood without beige or green */}
      <color attach="background" args={['#6e7682']} />
      <fog attach="fog" args={['#6e7682', 14, 32]} />
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 11, 6]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 6, -3]} intensity={0.5} color="#e4e8f0" />
      <hemisphereLight args={['#e8ebf0', '#4a5058', 0.5]} />
      <Scene
        fen={fen}
        interactive={interactive}
        lastMove={lastMove}
        onMove={onMove}
        myColor={myColor}
      />
      <CameraRig orientation={orientation} />
    </Canvas>
  )
}
