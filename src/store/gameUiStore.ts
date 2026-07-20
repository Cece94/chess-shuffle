'use client'

import { create } from 'zustand'

type GameUiState = {
  selectedSquare: string | null
  legalTargets: string[]
  setSelection: (square: string | null, targets?: string[]) => void
  clearSelection: () => void
}

export const useGameUiStore = create<GameUiState>((set) => ({
  selectedSquare: null,
  legalTargets: [],
  setSelection: (square, targets = []) =>
    set({ selectedSquare: square, legalTargets: targets }),
  clearSelection: () => set({ selectedSquare: null, legalTargets: [] }),
}))
