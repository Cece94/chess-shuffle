# Chess Shuffle

3D Chess960 (Fischer Random) online: create a lobby, invite a friend, hit **Start**, play on a Three.js board.

Back-rank pieces are shuffled; pawns stay on ranks 2 and 7.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

1. **Create lobby** → copy the code  
2. Open a second browser / incognito → **Join** with the code  
3. Host clicks **Start game** → shared Chess960 position in 3D  

Local multiplayer uses an in-memory room API (works in `next dev` on one machine).

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js app |
| `npm test` | Chess960 / engine unit tests |
| `npm run build` | Production build |
| `npm run party:dev` | PartyKit realtime server (optional) |
| `npm run party:deploy` | Deploy PartyKit |

## PartyKit (Vercel multiplayer)

In-memory lobbies do **not** survive across Vercel serverless instances. For production realtime:

1. Deploy PartyKit: `npm run party:deploy`
2. Set on Vercel: `NEXT_PUBLIC_PARTYKIT_HOST=your-project.username.partykit.dev`
3. Redeploy the Next.js app

Without that env var, the app uses `/api/room/[code]` polling (fine for local demo).

## Stack

- Next.js (App Router) + TypeScript + Tailwind  
- React Three Fiber / Three.js  
- chess.js + custom Chess960 shuffle (`lib/chess/shuffle.ts`)  
- PartyKit (optional) or local room API  

## Docs

- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)  
- Agent skill: `.cursor/skills/chess-shuffle-expert/`
