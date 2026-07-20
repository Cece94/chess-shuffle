# Chess Shuffle — product

## Elevator pitch

3D browser chess where the **pieces behind the pawns** start in a **random legal back-rank arrangement** (Chess960 / Fischer Random style). Pawns stay standard.

## Modes

| Mode | Status | Notes |
|------|--------|-------|
| **Shuffle (core)** | locked | Back ranks randomized; pawns fixed; black mirrors white |
| **Online lobby** | v1 | Host creates lobby → friend joins → Start launches shared Chess960 game |
| Standard chess | optional | Classic starting position as a secondary mode |
| Local hotseat | useful for Phase 2 | Same device / offline board testing |
| vs AI | later | Stockfish in Worker if needed |

Full build plan: [docs/IMPLEMENTATION_PLAN.md](../../../docs/IMPLEMENTATION_PLAN.md).

## Shuffle rules (locked)

See [chess960.md](chess960.md). Summary:

- Shuffle **only** non-pawn pieces on ranks 1 and 8.
- Pawns stay on ranks 2 and 7.
- Chess960 constraints (bishops opposite colors, king between rooks).
- Black mirrors white’s piece order on the same files.
- Castling follows Chess960 destination squares.

## UX principles

- 3D board is the hero; HUD minimal.
- Primary CTA: shuffle / new game.
- Show position id (0–959) when useful.
- Clear turn, check, and game-over in DOM.
- Mobile: usable camera and piece selection.

## Non-goals (v1)

- Native apps
- Full opening book / cloud analysis
- Heavy post-processing VFX
- Shuffling pawns or mixing ranks mid-game
