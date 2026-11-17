[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Orochim25/best-game-01-entry-acct1/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/Orochim25/best-game-01-entry-acct1/reward.svg)](https://make.fun/bounty/best-game-01)

# LUMENFALL — Defend the Last Lighthouse

A 2D canvas tower-defence game, built for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01).

The night is full of shadows, and only one lighthouse still burns. Build a wall
of five tower kinds on the stone pads, upgrade them through three tiers, and
hold all 21 waves — the last of them led by the Umbral King himself. Spend gold
wisely, and call on three blessings when the road is about to break: Frost Nova,
Sunburst, and Beacon Surge.

- **5 towers, 3 tiers each** — Ember Spire, Frost Obelisk, Storm Coil, Thorn
  Mortar, Sun Lantern (blesses its neighbours).
- **9 enemy kinds** — shades, wisps, husks, batwings, menders, splitters,
  hexers, golems, and the Umbral King.
- **21 waves** with a growing siege, gold economy, lives, score, and a victory
  screen with full run stats.
- **Juice** — particles, screen shake, floating gold text, synthesized WebAudio
  sound effects and a looping music lullaby, all generated in code.
- **Original** — every name, shape, sound and tune was made for this game.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `game/` is plain static files. Screenshots are
deterministic scenes: `?shot=title|play|boss|victory&seed=<n>`.

## Entry

`main.ts` (Node 22, stdlib only) copies `game/` and `screenshots/` to
`/output` and writes `dossier.json` with the vendored make.fun library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
