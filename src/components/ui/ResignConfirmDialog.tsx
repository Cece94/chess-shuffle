'use client'

type Props = {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Warn before resigning a game. */
export function ResignConfirmDialog({ open, onConfirm, onCancel }: Props) {
  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resign-title"
    >
      <div className="w-full max-w-sm rounded-xl border border-[#c4a35a]/40 bg-[#241e18] p-6 text-center shadow-xl">
        <p id="resign-title" className="font-serif text-xl text-[#f3efe6]">
          Resign?
        </p>
        <p className="mt-2 text-sm text-[#9a8b78]">
          You will lose this game. This cannot be undone.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#3d342c] bg-[#1a1510]/80 px-5 py-2 text-sm text-[#9a8b78] backdrop-blur-sm hover:border-[#c4a35a]/50 hover:text-[#f3efe6]"
          >
            Keep playing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-red-400/50 bg-red-950/40 px-5 py-2 text-sm text-red-300 hover:border-red-400 hover:bg-red-900/50 hover:text-red-200"
          >
            Resign
          </button>
        </div>
      </div>
    </div>
  )
}
