let moveAudio: HTMLAudioElement | null = null
let captureAudio: HTMLAudioElement | null = null

function getAudio(path: string, cached: HTMLAudioElement | null): HTMLAudioElement {
  if (cached) return cached
  const audio = new Audio(path)
  audio.preload = 'auto'
  audio.loop = false
  return audio
}

function play(audio: HTMLAudioElement) {
  audio.pause()
  audio.currentTime = 0
  void audio.play().catch(() => {
    // Autoplay may be blocked until a user gesture — ignore
  })
}

/** Play the piece-move click; reuses one Audio element for rapid moves. */
export function playMoveSound() {
  if (typeof window === 'undefined') return
  moveAudio = getAudio('/sounds/move-self.mp3', moveAudio)
  play(moveAudio)
}

/** Play the capture sound when a piece is taken. */
export function playCaptureSound() {
  if (typeof window === 'undefined') return
  captureAudio = getAudio('/sounds/capture.mp3', captureAudio)
  play(captureAudio)
}
