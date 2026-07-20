'use client'

import { create } from 'zustand'

export type ViewMode = '3d' | '2d'

type GameUiState = {
  selectedSquare: string | null
  legalTargets: string[]
  viewMode: ViewMode
  /** Bumped to ask CameraRig to restore default zoom / orbit. */
  viewResetNonce: number
  setSelection: (square: string | null, targets?: string[]) => void
  clearSelection: () => void
  setViewMode: (mode: ViewMode) => void
  resetViewCamera: () => void
}

export const useGameUiStore = create<GameUiState>((set) => ({
  selectedSquare: null,
  legalTargets: [],
  viewMode: '3d',
  viewResetNonce: 0,
  setSelection: (square, targets = []) =>
    set({ selectedSquare: square, legalTargets: targets }),
  clearSelection: () => set({ selectedSquare: null, legalTargets: [] }),
  setViewMode: (mode) => set({ viewMode: mode }),
  resetViewCamera: () => set((s) => ({ viewResetNonce: s.viewResetNonce + 1 })),
}))
