# Chess Shuffle — Implementation Plan

Plan d’implémentation pour un projet **Next.js** déployé sur **Vercel**, avec une partie d’échecs en **Three.js (React Three Fiber)**, mode **Chess960** (pièces derrière les pions aléatoires), **lobby** partageable, et démarrage de partie via **Start**.

Références produit / règles : `.cursor/skills/chess-shuffle-expert/`.

---

## 1. Objectif v1

| Capacité | Détail |
|----------|--------|
| Créer un lobby | L’hôte obtient un **code** + **lien** à partager |
| Rejoindre | Un ami entre le code (ou ouvre le lien) |
| Lobby live | Les deux voient qui est connecté / prêt |
| Start | Un clic **Start** (hôte) génère un SP-ID Chess960 et lance la partie |
| Partie 3D | Plateau Three.js / R3F, coups synchronisés |
| Déploiement | Frontend + API sur **Vercel** |

Hors v1 : comptes utilisateurs, ELO, IA Stockfish, spectateurs, chat avancé.

---

## 2. Contrainte Vercel → choix temps réel

Vercel = fonctions **serverless** (pas de serveur WebSocket Node long-lived natif). Pour le lobby + sync des coups, utiliser un **realtime managé** :

| Option | Rôle | Recommandation |
|--------|------|----------------|
| **PartyKit** (ou Cloudflare Durable Objects) | Rooms éphémères (lobby + game) | **Recommandé v1** — simple, rooms = lobbies |
| **Ably / Pusher** | Pub/sub channels | Bon si déjà dans l’écosystème |
| **Supabase Realtime** | Postgres + presence | Bon si on veut persister parties tôt |

**Décision plan :** **PartyKit** pour l’état live du lobby/partie + Next.js sur Vercel pour UI/API. Alternativement **Ably** si on veut zéro infra hors Vercel (tout client SDK).

Le reste du plan est écrit pour **PartyKit** ; les événements restent les mêmes si on swap le transport.

---

## 3. Stack technique

| Couche | Techno |
|--------|--------|
| App | Next.js (App Router) + TypeScript |
| Hosting | Vercel |
| 3D | `three` + `@react-three/fiber` + `@react-three/drei` |
| Règles | `chess.js` + module `lib/chess/shuffle.ts` (Chess960) |
| État client | Zustand (UI locale) + mirror de l’état room |
| Temps réel | PartyKit room `lobby/:code` |
| IDs | `nanoid` (codes lobby 6 chars) |
| Styles | Tailwind (scaffold) |

Séparation stricte : **règles / FEN dans `lib/chess`**, **rendu dans `components/board`**, **sync dans `lib/realtime`**.

---

## 4. Parcours utilisateur

```text
[/] Accueil
  → [Créer un lobby] → /lobby/[code]  (hôte, couleur White par défaut)
  → [Rejoindre] → saisie code → /lobby/[code]  (guest, Black)

[/lobby/[code]]
  → Presence : Host / Guest
  → Bouton Ready (optionnel v1.1) ou simple “2 joueurs connectés”
  → Host clique [Start game]
       → server room tire SP-ID 0–959
       → broadcast game_started { spId, fen, whitePlayerId, blackPlayerId }
       → redirect /game/[code]

[/game/[code]]
  → BoardCanvas 3D
  → Seul le joueur au trait peut jouer ses pièces
  → move → room valide → broadcast position
  → fin de partie → overlay + “Rematch” (nouveau SP-ID) / “Lobby”
```

---

## 5. Modèle d’état (room)

État autoritatif côté **room PartyKit** (pas le client) :

```ts
type RoomPhase = 'lobby' | 'playing' | 'finished'

type RoomState = {
  code: string
  phase: RoomPhase
  hostId: string
  guestId: string | null
  // assigned on Start
  whiteId: string | null
  blackId: string | null
  spId: number | null          // Chess960 0–959
  fen: string | null
  turn: 'w' | 'b' | null
  lastMove: { from: string; to: string; promotion?: string } | null
  winner: 'w' | 'b' | 'draw' | null
  createdAt: number
}
```

**Règle :** le client propose un coup ; la room revalide avec le moteur serveur (même `lib/chess`) avant d’accepter. Anti-triche basique.

---

## 6. Protocole d’événements

### Client → Room

| Event | Payload | Qui |
|-------|---------|-----|
| `join` | `{ name? }` | tout joueur à la connexion |
| `start` | `{}` | **host only**, phase `lobby`, guest présent |
| `move` | `{ from, to, promotion? }` | joueur dont c’est le tour |
| `resign` | `{}` | joueur en partie |
| `rematch` | `{}` | host (ou les deux ready) → nouveau SP-ID |

### Room → Clients

| Event | Payload |
|-------|---------|
| `state` | `RoomState` (snapshot complet ou patch) |
| `error` | `{ code, message }` (ex. illegal move, not host) |

À la connexion : envoyer immédiatement `state`.

---

## 7. Architecture dossiers (cible)

```text
chess-shuffle/
├── app/
│   ├── page.tsx                 # Créer / Rejoindre
│   ├── lobby/[code]/page.tsx
│   ├── game/[code]/page.tsx
│   ├── layout.tsx
│   └── api/health/route.ts      # optional
├── components/
│   ├── lobby/
│   │   ├── CreateLobbyButton.tsx
│   │   ├── JoinLobbyForm.tsx
│   │   └── LobbyPanel.tsx       # players + Start
│   ├── board/
│   │   ├── BoardCanvas.tsx      # dynamic ssr:false
│   │   ├── Scene.tsx
│   │   ├── ChessBoard.tsx
│   │   ├── Piece.tsx
│   │   └── highlights/
│   └── ui/
│       ├── GameHud.tsx
│       └── GameOverOverlay.tsx
├── lib/
│   ├── chess/
│   │   ├── engine.ts
│   │   ├── shuffle.ts           # fromSpId / randomSpId / fenFromSpId
│   │   ├── coords.ts
│   │   └── types.ts
│   └── realtime/
│       ├── client.ts            # PartySocket hook
│       └── protocol.ts          # event types shared
├── party/
│   └── chess-room.ts            # PartyKit server (autorité)
├── store/
│   └── gameUiStore.ts           # sélection locale, highlights
├── public/models/pieces/
└── docs/IMPLEMENTATION_PLAN.md
```

PartyKit peut vivre dans le même repo (`party/`) et se déployer à part (PartyKit cloud) ; Next.js reste sur Vercel.

---

## 8. Phases d’implémentation

### Phase 0 — Scaffold (0.5 j)

- [ ] `create-next-app` (TS, App Router, Tailwind, ESLint)
- [ ] Dépendances : `three`, `@react-three/fiber`, `@react-three/drei`, `chess.js`, `zustand`, PartyKit client/server
- [ ] Déployer un hello world sur Vercel
- [ ] CI minimale (lint)

**Critère de sortie :** URL Vercel verte.

---

### Phase 1 — Moteur Chess960 pur (1 j)

- [ ] `lib/chess/shuffle.ts` : `fromSpId`, `randomSpId`, `fenFromSpId`
- [ ] Contraintes : fous couleurs opposées, roi entre tours, miroir noir
- [ ] `lib/chess/engine.ts` : load FEN, `moves`, `applyMove`, détection fin
- [ ] Tests unitaires (SP-ID connus, position 518 = classique, coups illégaux)

**Critère de sortie :** tests verts sans WebGL.

---

### Phase 2 — Board 3D offline (1.5–2 j)

- [ ] `BoardCanvas` client-only (`dynamic(..., { ssr: false })`)
- [ ] Plateau + pièces (primitives ou GLB simples)
- [ ] Mapping `coords.ts` (a1 ↔ world)
- [ ] Sélection + highlights des coups légaux (moteur local)
- [ ] Animation déplacement basique
- [ ] HUD : trait, SP-ID, échec / mat

**Critère de sortie :** une partie solo jouable en local (hotseat) avec un shuffle au load.

---

### Phase 3 — Lobby + Start (1–1.5 j)

- [ ] Génération code lobby (6 chars) à la création
- [ ] Routes `/lobby/[code]`, deep link
- [ ] Room PartyKit : join host/guest, présence
- [ ] UI Lobby : “En attente d’un ami…” / “Prêt”
- [ ] Host **Start** → `randomSpId()` **côté room** → `phase: playing` + FEN
- [ ] Redirect sync vers `/game/[code]`

**Critère de sortie :** 2 onglets / 2 machines, Start lance la même position (#SP-ID).

---

### Phase 4 — Sync des coups (1–1.5 j)

- [ ] Client envoie `move` ; room valide avec `engine`
- [ ] Broadcast nouveau FEN + `lastMove`
- [ ] Caméra / orientation : blancs bas pour White, flip pour Black
- [ ] Bloquer l’input si ce n’est pas mon tour / pas ma couleur
- [ ] Resign + game over overlay
- [ ] Rematch (optionnel mais rapide) : nouveau SP-ID

**Critère de sortie :** partie complète host vs guest jusqu’au mat / abandon.

---

### Phase 5 — Polish + Vercel prod (0.5–1 j)

- [ ] Gestion déconnexion (guest leave → retour lobby ou forfeit)
- [ ] Messages d’erreur clairs (code invalide, room pleine)
- [ ] Perf 3D : `dpr={[1,2]}`, assets légers
- [ ] Env vars Vercel (`NEXT_PUBLIC_PARTYKIT_HOST`, etc.)
- [ ] README : créer lobby, rejoindre, jouer

**Critère de sortie :** déploiement prod stable, 2 joueurs réels OK.

---

## 9. Détail : Start → génération Chess960

```text
Host clicks Start
  → room checks: phase===lobby && guestId
  → spId = randomSpId()          // 0..959
  → fen = fenFromSpId(spId)
  → assign whiteId=hostId, blackId=guestId  (v1 simple)
  → phase = playing
  → broadcast state
  → clients navigate to /game/[code] and load fen
```

Le SP-ID est **unique à la room** pour la partie ; les deux clients ne “tirent” pas chacun de leur côté.

---

## 10. Détail : coup synchronisé

```text
Player clicks piece → legal squares (from local fen mirror)
Player clicks target
  → emit move { from, to, promotion? }
  → room: if sender !== sideToMove → error
  → room: engine.applyMove(fen, move) → ok?
  → update fen, turn, lastMove, maybe winner
  → broadcast state
  → both boards animate to lastMove
```

Promotion : UI DOM (Q/R/B/N) avant l’envoi du `move`.

---

## 11. Déploiement

### Vercel (Next.js)

1. Repo GitHub → Import Vercel  
2. Framework preset Next.js  
3. Env :
   - `NEXT_PUBLIC_PARTYKIT_HOST=xxx.partykit.dev`  
4. Deploy preview + production  

### PartyKit

1. `npx partykit deploy` (ou CI)  
2. Corréler le host avec la var Next  

### Checklist prod

- [ ] HTTPS OK, WebSocket OK depuis le navigateur  
- [ ] CORS / origins PartyKit autorisés  
- [ ] Pas de secrets dans `NEXT_PUBLIC_*`  
- [ ] Smoke test : create → join → start → 3 moves → resign  

---

## 12. Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| `chess.js` sans vrai Chess960 castling | Valider tôt ; sinon castling custom dans `lib/chess` |
| WebGL + SSR | Canvas `ssr: false` uniquement |
| Désync clients | Room = source de vérité ; clients rehydratent sur `state` |
| Room orpheline | TTL / GC PartyKit ; codes réutilisables après expire |
| Mobile perf | Géométries simples v1 ; baisser DPR |

---

## 13. Estimation globale

| Phase | Effort |
|-------|--------|
| 0 Scaffold | 0.5 j |
| 1 Chess960 | 1 j |
| 2 Board 3D | 1.5–2 j |
| 3 Lobby + Start | 1–1.5 j |
| 4 Sync coups | 1–1.5 j |
| 5 Polish + deploy | 0.5–1 j |
| **Total** | **~6–8 j** |

---

## 14. Ordre de build recommandé (résumé)

1. Scaffold Next + Vercel  
2. Moteur + shuffle (tests)  
3. Plateau 3D offline  
4. PartyKit lobby + Start  
5. Sync moves + fin de partie  
6. Polish déploiement  

Ne pas commencer le multijoueur avant d’avoir un plateau offline jouable et un shuffle testé.
