# Ember Pact

Entry for `best-card-game-20261122-1826` ($50, closes 23 Nov 2026 13:26 WIB).

## The game

A complete, original turn-based duel card game. You are Asha, the Ember
Scribe, duelling Cinder, the Ash Scribe, for the last ember. 30 health
each, mana that refills every turn, a 30-card deck of 8 card kinds across
4 elements — Flame, Frost, Leaf, Stone — told apart by colour *and*
shape. Damage, block, healing and card draw combine: a Thorn Lash hits
twice, a Wild Spark hits and draws, a Deep Freeze hits and shields.
Cinder plays greedily and readably — she finishes you when she can,
patches herself up when she is hurting — and she holds one mana more
than you, because the ember was hers first.

- Title screen, duel table (your hand below, Cinder's hand above as card
  backs), readable card values and costs, health and mana for both sides,
  a duel log, deck/discard counts, and win and loss screens.
- Mouse and keyboard: click a card (or 1–7) to play it, End Turn or E
  to pass the table, Enter to start, R to duel again, M to mute.
- Procedural WebAudio sounds only — no audio files, no network, no
  library. Pure static files under `game/`, no build step.

## Files

| File | Job |
|---|---|
| `main.ts` | Hand-in: copies `game/` + `screenshots/` to `/output`, writes `dossier.json` |
| `serve.ts` | Dev static server for `game/` on :8080 |
| `shots.json` | Screenshot list (`?shot=start/play/win/loss`, seed=7/11) |
| `LICENSE` | MIT (SPDX MIT, OSI-approved) |
| `vendor/makefun-game.ts` | Kit's copy, byte-identical |
| `game/index.html` | Canvas + module entry (data: favicon, no 404) |
| `game/src/config.js` | Tuning numbers, palette, card definitions, deck list |
| `game/src/random.js` | Seeded RNG (mulberry32) + shuffle |
| `game/src/cards.js` | Deck building, drawing, discard reshuffle |
| `game/src/ai.js` | Cinder's greedy play chooser |
| `game/src/world.js` | Duel rules: phases, damage/block/heal, turns, score |
| `game/src/render.js` | All canvas drawing: title, table, cards, end screens |
| `game/src/input.js` | Mouse + keyboard, hit-testing from the renderer's layout |
| `game/src/audio.js` | Procedural WebAudio effects (M mutes) |
| `game/src/shots.js` | Staged screenshot scenes + greedy autopilot |
| `game/src/main.js` | Boot, fixed-step loop, best score, `?shot=` staging |
| `screenshots/1-start.jpg` | Title screen (cover) |
| `screenshots/2-play.jpg` | Mid-duel: turn 4, you 12/30, Cinder 20/30 |
| `screenshots/3-win.jpg` | "The ember is yours" — won turn 10, score 146 |
| `screenshots/4-loss.jpg` | "The ember gutters out" — lost turn 5, score 14 |

## Verification (all done this session)

- **Logic tests (Node, the game's own modules, `/tmp/ember-tests.mjs`):
  40/40 PASS** — deck composition, draws and reshuffle, legal/illegal
  plays, block absorbing damage, heal capping, turn flow (mana refill,
  draw 2, block clearing), lethal win (+100 bonus), AI lethal loss,
  determinism across runs, autopilot sweeps (seed 7 wins, seed 11 loses
  from a hurt start), and all three staged shots reaching their scenes.
  Balance: the greedy autopilot wins 23/40 seeds — a contested duel.
- **Playtest (headless Chromium via CDP):** title → Enter starts the
  duel; key 1 plays a card (mana spent); E ends the turn; Cinder plays
  her cards and the turn passes back (turn 2); no page errors.
- **Screenshots:** taken with the Playwright-cached Chromium at
  1280×720 via CDP `Page.captureScreenshot` (JPEG q82, no image
  library). Each is a real render of the game's own code via
  `?shot=start|play|win|loss&seed=…`; viewed and confirmed readable —
  title, both hands, readable card values/costs/elements, health and
  mana bars, log, End Turn, and both end screens are all legible.
- **`makefun check` (kit CLI, --worktree):** see the build note;
  transcripts are bundled by the parent run.
- **Local gate-row stand-in (`/tmp/gate-check-ember.mjs`):** game_files,
  references, screenshots, dossier determinism, dossier size,
  js_parses, vendor byte-identical, LICENSE MIT — all pass.

## Known gaps

- The sealed scorer is not in the kit, so the gate rows were verified
  with the local stand-in, not with `grade-local` itself; the server's
  dev grade is the real check.
- The loss screenshot stages Asha starting hurt (12 HP), so the duel
  genuinely ends in defeat on turn 5 — a real end screen, not a mock.
- Cosmetic: at thumbnail size the cards' rules text is small; values,
  names, costs and elements stay legible.

## License

MIT — see LICENSE.
