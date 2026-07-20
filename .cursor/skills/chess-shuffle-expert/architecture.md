# Chess Shuffle — architecture map

Target layout for a greenfield Next.js + R3F app. Adjust only with a clear reason.

```text
chess-shuffle/
├── app/
│   ├── page.tsx                 # create / join lobby
│   ├── lobby/[code]/page.tsx
│   ├── game/[code]/page.tsx
│   └── layout.tsx
├── components/
│   ├── lobby/                   # Create, Join, LobbyPanel + Start
│   ├── board/                   # R3F canvas, scene, pieces
│   └── ui/                      # GameHud, GameOverOverlay
├── lib/
│   ├── chess/                   # engine, shuffle960, coords
│   └── realtime/                # PartyKit client + protocol
├── party/
│   └── chess-room.ts            # authoritative room state
├── store/
│   └── gameUiStore.ts
├── public/models/pieces/
└── docs/IMPLEMENTATION_PLAN.md
```

## Data flow

```text
Lobby: join/start → PartyKit room (authority) → broadcast state → UI

Game move:
  pointer → local legal hints
  → emit move → room validates (lib/chess)
  → broadcast fen/lastMove
  → R3F both clients animate
```

Full plan: [docs/IMPLEMENTATION_PLAN.md](../../../docs/IMPLEMENTATION_PLAN.md).

## SSR note

`BoardCanvas` should be client-only. Example pattern:

```tsx
import dynamic from 'next/dynamic'

const BoardCanvas = dynamic(() => import('@/components/board/BoardCanvas'), {
  ssr: false,
  loading: () => null,
})
```

## Testing priority

1. Pure `lib/chess` unit tests (moves, shuffle legality)
2. Store transitions
3. Manual WebGL smoke test (select → move → capture → shuffle)
