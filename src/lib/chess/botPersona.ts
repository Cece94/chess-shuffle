import type { BotLevel } from './bot'

const BOT_NAMES: Record<BotLevel, string[]> = {
  easy: ['Clunky', 'Pawnlet', 'Shuffle Jr', 'Woodpusher', 'BlunderBot'],
  intermediate: ['Castle-X', 'Tempo Ted', 'Knightmare', 'Forksy', 'Pinbot'],
  hard: ['QueenByte', 'Zugzwang', 'RookSolid', 'MateNet', 'SharpLine'],
  expert: ['Endgame.exe', '960 Oracle', 'DeepShuffle', 'AlphaRank', 'Fischer-AI'],
}

/** Accent metal color per level (avatar body trim). */
export const BOT_ACCENT: Record<BotLevel, string> = {
  easy: '#7a9e6a',
  intermediate: '#c4a35a',
  hard: '#c07050',
  expert: '#6a8cbf',
}

export type BotPersona = {
  name: string
  accent: string
  level: BotLevel
}

export function createBotPersona(level: BotLevel): BotPersona {
  const names = BOT_NAMES[level]
  const name = names[Math.floor(Math.random() * names.length)]!
  return { name, accent: BOT_ACCENT[level], level }
}

const PLAYER_NAME_KEY = 'chess-shuffle-player-name'

export function readPlayerDisplayName(): string {
  if (typeof sessionStorage === 'undefined') return 'You'
  const raw = sessionStorage.getItem(PLAYER_NAME_KEY)?.trim()
  return raw && raw.length > 0 ? raw.slice(0, 20) : 'You'
}
