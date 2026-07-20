import { CreateLobbyButton } from '@/components/lobby/CreateLobbyButton'
import { JoinLobbyForm } from '@/components/lobby/JoinLobbyForm'
import { LobbyList } from '@/components/lobby/LobbyList'

export default function HomePage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, #3d2e1e 0%, transparent 55%), linear-gradient(180deg, #1a1510 0%, #0f0c09 100%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #c4a35a 0 1px, transparent 1px 48px), repeating-linear-gradient(90deg, #c4a35a 0 1px, transparent 1px 48px)',
        }}
      />

      <div className="relative z-10 w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="font-serif text-5xl tracking-tight text-[#f3efe6] sm:text-6xl">
            Chess Shuffle
          </h1>
          <p className="mt-3 text-[#9a8b78]">
            Chess960 online — pieces behind the pawns are shuffled. Invite a friend,
            hit Start, play in 3D.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#3d342c] bg-[#241e18]/80 p-5 text-left backdrop-blur">
          <CreateLobbyButton />
          <div className="relative py-2 text-center text-xs uppercase tracking-widest text-[#6b5e50]">
            or join
          </div>
          <JoinLobbyForm />
        </div>

        <div className="rounded-2xl border border-[#3d342c] bg-[#241e18]/80 p-5 text-left backdrop-blur">
          <LobbyList />
        </div>
      </div>
    </main>
  )
}
