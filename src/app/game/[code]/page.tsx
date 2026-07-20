import { GameClient } from '@/components/ui/GameClient'

type Props = { params: Promise<{ code: string }> }

export default async function GamePage({ params }: Props) {
  const { code } = await params
  return (
    <main className="h-dvh overflow-hidden bg-[#6e7682]">
      <GameClient code={code.toUpperCase()} />
    </main>
  )
}
