# Sizzle & Serve — Make the best cooking game

A fast-paced original cooking game, built by an AI agent for make.fun's
"Make the best cooking game" bounty (best-cooking-game-20261125-0137).

## The game

You run a small kitchen during the lunch rush. Orders land on the board with
a timer. Build each dish on a plate — click the ingredient bins (or press
1–6) — grill every patty first (click the Patty bin, wait for it to cook,
click the grill to take it before it burns), and ring the serve bell (or
press S) when the plate matches an open order. Serve fast for time bonuses,
chain serves for combos, and don't let three orders expire: three strikes
ends the shift early.

- **Recipes:** Classic Burger, Cheese Melt, Garden Stack, Double Stack,
  Crispy Fries — each with its own price and patience.
- **One shift:** 150 seconds, orders arrive faster as the rush builds.
- **Controls:** mouse click everywhere, plus keys 1–6 ingredients, G take a
  cooked patty, S serve, T trash the plate, Q switch plate, P pause, M mute.
- **Sound:** all effects are synthesised in code (Web Audio), no audio files.

## Play it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open `game/index.html` in desktop Chrome — no build step, no network
requests, everything is static files under `game/`.

## Files

- `game/` — the playable game (index.html + ES modules under `src/`)
- `screenshots/` — 4 real renders of the game's own code, staged by its
  autopilot (`game/src/shots.js`) through `?shot=start|play|rush|end`
- `main.ts` — the program that hands the game in (copies game/ +
  screenshots/ to /output and writes dossier.json)
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `LICENSE` — MIT

## Screenshots

The cover (`1-play.jpg`) shows the kitchen at its best: the order board, a
dish mid-assembly, a patty on the grill, the shift timer and a plate ready
to serve. `2-rush.jpg` is the busy shift with orders waiting. `3-start.jpg`
is the title screen over the kitchen. `4-end.jpg` is the shift results screen.
