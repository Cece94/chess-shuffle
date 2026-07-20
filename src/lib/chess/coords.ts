/** Map chess squares to Three.js board coordinates (a1 = bottom-left for white). */

const FILES = 'abcdefgh'

export function squareToWorld(
  square: string,
  squareSize = 1,
): [number, number, number] {
  const file = FILES.indexOf(square[0]!.toLowerCase())
  const rank = Number(square[1]) - 1
  const x = (file - 3.5) * squareSize
  const z = (3.5 - rank) * squareSize
  return [x, 0, z]
}

export function worldToSquare(
  x: number,
  z: number,
  squareSize = 1,
): string | null {
  const file = Math.round(x / squareSize + 3.5)
  const rank = Math.round(3.5 - z / squareSize)
  if (file < 0 || file > 7 || rank < 0 || rank > 7) return null
  return `${FILES[file]}${rank + 1}`
}

export function isLightSquare(square: string): boolean {
  const file = FILES.indexOf(square[0]!.toLowerCase())
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}
