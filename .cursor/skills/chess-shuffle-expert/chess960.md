# Chess960 / back-rank shuffle — rules reference

Domain expertise for Chess Shuffle’s core mode: **pieces behind the pawns are placed randomly**.

## What is shuffled

| Rank | Content | Shuffled? |
|------|---------|-----------|
| 1 | White R,N,B,Q,K,B,N,R (order varies) | **Yes** |
| 2 | White pawns a2–h2 | No |
| 7 | Black pawns a7–h7 | No |
| 8 | Black pieces (mirror of white) | **Yes** (derived) |

Empty ranks 3–6. Same piece set as classical chess: K, Q, 2×B, 2×N, 2×R per side.

## Hard constraints (must always hold)

1. **Bishops on opposite colors** — one on a light square, one on a dark square (among the 8 back-rank squares).
2. **King between the two rooks** — on the back rank, exactly one rook left of the king and one rook right of the king (files: `rook < king < rook`).
3. **Queen and knights** fill the remaining three squares (no further color constraint).
4. **Black mirrors white** — same piece *types* on files a–h as white (e.g. if white has `RNBQKBNR` style order on rank 1, black has the same letters on rank 8).
5. **960 positions** — there are exactly **960** legal starting arrays (hence Chess960). Standard chess is position **518** in the usual numbering.

## Generation algorithm (canonical)

Use a deterministic method so seeds / SP-IDs are reproducible:

1. Place **bishops**: choose a dark-square file and a light-square file independently among the 4+4 back-rank squares of those colors.
2. Place **queen**: choose one of the 6 remaining squares.
3. Place **knights**: choose 2 of the 5 remaining squares (C(5,2)=10).
4. Place **rooks and king** on the last 3 squares in order **R, K, R** (only one way left — satisfies king-between-rooks).

Map the choices to an integer **0–959** (Scharnagl / Fischer Random ID) when exposing “position number” in the UI.

Prefer a well-tested mapping (or `chess.js` / library helper) over inventing a new ID scheme. If implementing manually, document the exact ID formula in code comments.

## Starting FEN

Build FEN from the back-rank string, e.g. white back rank `bqnnrkrb`:

```text
bqnnrkrb/pppppppp/8/8/8/8/PPPPPPPP/BQNNRKRB w KQkq - 0 1
```

- Active color: `w`
- En passant: `-`
- Halfmove / fullmove: `0 1`
- **Castling rights**: for Chess960, encode which rooks can castle (see below). Do not assume classical `KQkq` means “corner rooks” only — in 960, rooks may not start in corners.

## Castling (Chess960)

After castling, **destinations match classical chess**:

| Side | King ends on | Rook ends on |
|------|--------------|--------------|
| White O-O | g1 | f1 |
| White O-O-O | c1 | d1 |
| Black O-O | g8 | f8 |
| Black O-O-O | c8 | d8 |

Additional rules:

- King and that rook must not have moved.
- All squares the **king passes through**, the **king ends on**, and the **rook ends on** must be empty or vacated by the castling pair as needed (standard 960 emptiness rules).
- King may not castle out of, through, or into check.
- Castling is still “king moves two toward the rook” in spirit, but implementation should use **destination-based** logic (not “always from e1”).

When using `chess.js`, confirm the version supports Chess960 / crazyhouse-style castling; if not, implement castling validation in `lib/chess/` and keep the board FEN consistent.

## What is NOT this mode

- Do **not** shuffle pawns.
- Do **not** place pieces on ranks 2–7 at start.
- Do **not** use unconstrained random permutations (violates bishops / king-between-rooks).
- Do **not** give white and black different back-rank type orders.

## Implementation hooks

```text
lib/chess/shuffle.ts   → generateBackRank() / fromSpId(0..959) / randomSpId()
lib/chess/engine.ts    → load FEN, moves, castling-960
lib/chess/types.ts     → SpId, BackRank, SideCastlingRights
```

UI may show: **“Position #NNN”** + Shuffle button that picks a new SP-ID and resets the 3D board.
