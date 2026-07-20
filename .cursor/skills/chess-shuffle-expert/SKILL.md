---
name: chess-shuffle-expert
description: >-
  Expert for Chess Shuffle: Chess960-style mode where back-rank pieces behind
  the pawns are placed randomly (Fischer Random), built with Next.js App Router,
  React Three Fiber / Three.js, and chess.js. Use when working in this repo on
  shuffle generation, castling-960, FEN, 3D board/pieces, game rules, or any
  Chess Shuffle / Next.js / Three.js / R3F task.
---

# Chess Shuffle Expert

You are the specialist for **Chess Shuffle**: a greenfield 3D chess product whose core mode shuffles the **pieces behind the pawns** (back ranks), like **Chess960 / Fischer Random**. Stack: **Next.js + React Three Fiber**. Follow [product.md](product.md) as product truth and [chess960.md](chess960.md) for shuffle/castling rules.

## Core mode (locked)

- **Pawns**: always on ranks 2 (white) and 7 (black) — never shuffled.
- **Back ranks**: white pieces on rank 1 and black on rank 8 are placed **randomly**, with Chess960 constraints.
- **Mirror**: black’s back rank mirrors white’s piece types on the same files (same arrangement, opposite color).
- **Play**: after setup, normal chess moves apply, with **Chess960 castling** (king ends on c/g, rook on d/f — see chess960.md).
- **Rules ≠ rendering**: legality and FEN live in `lib/chess/`; meshes only visualize state.

## Default stack

| Layer | Choice |
|-------|--------|
| App | Next.js App Router, TypeScript, strict |
| UI | RSC by default; client only where needed |
| 3D | `@react-three/fiber` + `@react-three/drei` + `three` |
| Chess | `chess.js` (verify Chess960 / castling support; extend if needed) |
| State | Zustand (or chosen store); keep R3F state minimal |
| Styles | Match whatever gets scaffolded |

YAGNI: no extra libs without a clear need.

## Architecture

1. **Domains**
   - `lib/chess/` — engine, FEN, **shuffle960**, coords, castling helpers
   - `components/board/` — R3F scene, pieces, board, controls
   - `components/ui/` — HUD, shuffle / new game
   - `app/` — thin routes

2. **Client boundary**: one `'use client'` canvas shell; dynamic `ssr: false` if WebGL breaks SSR.

3. **Source of truth**: store holds FEN / position; 3D derives from it.

4. **Coords**: one square ↔ world mapping in `lib/chess/coords.ts`.

## Shuffle implementation checklist

When generating or applying a shuffle:

- [ ] Only back-rank pieces change; pawns unchanged
- [ ] Bishops on opposite colors
- [ ] King between the two rooks
- [ ] Black mirrors white on the same files
- [ ] Valid starting FEN + correct castling rights for 960
- [ ] Optional: reproducible seed for share / rematch
- [ ] 3D pieces reset cleanly (no leftover tweens)

Full rules: [chess960.md](chess960.md).

## Three.js / R3F

- Declarative R3F; `drei` when it cuts boilerplate.
- Load piece GLTF once; clone/instance; dispose on unmount.
- Simple lighting; no bloom by default.
- Highlights from the rules engine, not ad-hoc mesh logic.
- Cap DPR; don’t recreate geometries every render.

## Next.js

- Thin `app/` pages; models in `public/models/pieces/`.
- Stockfish / WASM only in a Worker if added later.
- Short English comments on non-obvious methods only.

## Feature workflow

1. Pure logic in `lib/chess` (shuffle + moves) — testable without WebGL  
2. Store actions (new shuffle, select, move)  
3. R3F reflects FEN  
4. DOM HUD last  
5. Smoke-test desktop + mobile  

## Code quality

DRY, YAGNI, single responsibility. Match repo style once files exist.

## Additional resources

- [product.md](product.md) — product decisions  
- [chess960.md](chess960.md) — shuffle & castling rules  
- [architecture.md](architecture.md) — folder map  
- [docs/IMPLEMENTATION_PLAN.md](../../../docs/IMPLEMENTATION_PLAN.md) — lobby, Start, Vercel, realtime build plan  

