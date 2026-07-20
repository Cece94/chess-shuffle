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
| `npm run party:dev` | Cloudflare Workers realtime (local) |
| `npm run party:deploy` | Deploy realtime Worker to Cloudflare |

## Multiplayer on Vercel (Cloudflare Workers)

In-memory lobbies do **not** survive across Vercel serverless instances. For production realtime:

1. `npx wrangler login` (Cloudflare account, free)
2. `npm run party:deploy` → note the `*.workers.dev` URL
3. Set on Vercel: `NEXT_PUBLIC_PARTYKIT_HOST=chess-shuffle.<account>.workers.dev` (no `https://`)
4. Redeploy the Next.js app

Without that env var, the app uses `/api/room/[code]` polling (fine for local demo).

## Stack

- Next.js (App Router) + TypeScript + Tailwind  
- React Three Fiber / Three.js  
- chess.js + custom Chess960 shuffle (`lib/chess/shuffle.ts`)  
- PartyKit (optional) or local room API  

## Docs

- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)  
- Agent skill: `.cursor/skills/chess-shuffle-expert/`
