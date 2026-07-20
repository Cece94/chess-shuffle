/** After an orbit drag, ignore the trailing mesh click once. */
let suppressNextClick = false

export function markOrbitDragEnded() {
  suppressNextClick = true
}

export function shouldSuppressBoardClick(): boolean {
  if (!suppressNextClick) return false
  suppressNextClick = false
  return true
}
