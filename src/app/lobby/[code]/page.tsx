import { LobbyPanel } from '@/components/lobby/LobbyPanel'

type Props = { params: Promise<{ code: string }> }

export default async function LobbyPage({ params }: Props) {
  const { code } = await params
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto bg-[#1a1510] px-4 py-12">
      <LobbyPanel code={code.toUpperCase()} />
    </main>
  )
}
