# Ember Pact

[![make.fun · best-card-game-20261122-1826](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/mitsukikun/best-card-game-20261122-1826-r2/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/mitsukikun/best-card-game-20261122-1826-r2/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826?utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826)

A turn-based card duel for the [best-card-game-20261122-1826 bounty](https://make.fun/bounty/best-card-game-20261122-1826). Asha, the Ember Scribe, duels Cinder, the Ash Scribe, for the last ember: 30 health each, mana that grows by one every turn, and a 30-card deck of 8 kinds across 4 elements — Flame, Frost, Leaf and Stone, told apart by colour *and* shape.

## How a duel plays

- **Turns:** play as many cards as your mana allows, then end the turn. Cinder answers at once with a greedy hand, then your next turn opens with +1 max mana, a refill, and two fresh cards.
- **Cards:** Ember Bolt and Wild Spark (Flame), Frost Shard and Deep Freeze (Frost), Thorn Lash and Mend (Leaf), Stone Wall and Quake (Stone). Damage, block, healing and card draw, in one deck.
- **Block** soaks damage and falls at the start of your next turn. **Healing** never passes full health. Win by dropping Cinder to 0; lose the same way. Score is damage dealt, plus 100 and twice your remaining health on a win.
- **Controls:** click a card once to select it, again to play it; keys 1–7 play a card, E ends the turn, M mutes, R duels again, Enter begins. The opponent's hand stays face down.
- **Sound:** procedural WebAudio only — a blip for a card, a thud for a hit, a shimmer for a heal. No audio files.
- **Determinism:** one seeded RNG drives every shuffle and draw; the same seed plays the same duel.

## Files

| Path | What it is |
| --- | --- |
| `main.ts` | The make.fun entrypoint: copies `game/` + `screenshots/` to the output directory and writes `dossier.json`. |
| `serve.ts` | A tiny static server for local playtesting (`node serve.ts`, then http://localhost:8080/). |
| `shots.json` | The manifest of the four screenshots. |
| `game/index.html` | The page: a 1280×720 canvas, no network, system fonts only. |
| `game/src/config.js` | Tuning, the element palette, the 8 card kinds and the 30-card deck list. |
| `game/src/random.js` | The seeded RNG (mulberry32) and shuffle. |
| `game/src/cards.js` | Deck building, drawing, and reshuffling the discard pile. |
| `game/src/world.js` | The duel: state, turns, what a card does, and when the duel ends. |
| `game/src/ai.js` | Cinder's greedy chooser, and the autopilot behind the staged shots. |
| `game/src/render.js` | Everything drawn: the table, cards, health, mana, log and end screens. |
| `game/src/input.js` | Mouse and keyboard, and the floating damage numbers. |
| `game/src/audio.js` | Procedural WebAudio sounds. |
| `game/src/shots.js` | Staged scenes for `?shot=start|play|win|loss`, built by playing real duels. |
| `game/src/main.js` | Boot, the animation loop, and the wiring between the rest. |
| `screenshots/` | Four real 1280×720 renders of this code: title, mid-duel, win, loss. |
| `vendor/makefun-game.ts` | The kit's dossier builder, unchanged. |

## Running it

```sh
node serve.ts
# open http://localhost:8080/ — or ?shot=start|play|win|loss for a staged scene
```

## Verification

- Logic tests (deck size and composition, draws, legal and illegal plays, block soaking, heal capping, turn flow, lethal, AI choice, determinism) all pass; see the test run in the submission notes.
- Playtested in headless Chromium via CDP: title → start → play a card → end turn, with no page errors.
- The four screenshots are real renders of this code at 1280×720, each under 256 KiB.
