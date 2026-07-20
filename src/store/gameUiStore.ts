'use client'

import { create } from 'zustand'

type GameUiState = {
  selectedSquare: string | null
  legalTargets: string[]
  /** Bumped to ask CameraRig to restore default zoom / orbit. */
  viewResetNonce: number
  setSelection: (square: string | null, targets?: string[]) => void
  clearSelection: () => void
  resetViewCamera: () => void
}

export const useGameUiStore = create<GameUiState>((set) => ({
  selectedSquare: null,
  legalTargets: [],
  viewResetNonce: 0,
  setSelection: (square, targets = []) =>
    set({ selectedSquare: square, legalTargets: targets }),
  clearSelection: () => set({ selectedSquare: null, legalTargets: [] }),
  resetViewCamera: () => set((s) => ({ viewResetNonce: s.viewResetNonce + 1 })),
}))
