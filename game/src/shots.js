// Staged screenshot scenes (?shot=start|play|win|loss&seed=N). Each scene is
// a real duel state produced by the game's own rules: the play scene runs
// a greedy autopilot for a few turns and freezes mid-turn; win and loss
// run the same autopilot to the end (the loss scene starts Asha hurt, so
// the duel genuinely ends in defeat). Nothing here draws a fake screen —
// the end screens are the ones a player reaches by playing.

import { CARDS } from "./config.js";
import { PHASE_LOSS, PHASE_PLAY, PHASE_WIN, endTurn, playCard, startGame, update } from "./world.js";

// Greedy autopilot: heal when hurt, otherwise play the hardest hit per
// mana; then end the turn. Returns true while the duel is still going.
export function autopilotTurn(world) {
  if (world.phase !== PHASE_PLAY) return false;
  for (;;) {
    let best = -1;
    let bestScore = -1;
    world.player.hand.forEach((cardId, i) => {
      const def = CARDS[cardId];
      if (!def || def.cost > world.player.mana) return;
      let score = ((def.damage || 0) * (def.hits || 1)) * 10 + (def.block || 0) * 3 + (def.draw || 0) * 5;
      if (def.heal && world.player.hp <= 18) score += def.heal * 12;
      score /= def.cost;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    });
    if (best < 0) break;
    playCard(world, best);
    if (world.phase !== PHASE_PLAY) return false;
  }
  endTurn(world);
  let guard = 0;
  while (world.phase === "ai" && guard < 200) {
    update(world, 1.0);
    guard += 1;
  }
  return world.phase === PHASE_PLAY;
}

export function runAutopilot(world, maxTurns = 40) {
  let turns = 0;
  while (turns < maxTurns && autopilotTurn(world)) turns += 1;
  return world.phase;
}

// Seeds found by the headless sweep in /tmp/ember-tests.mjs: seed 7's
// autopilot wins the duel, seed 11's loses it from a hurt start.
export const WIN_SEED = 7;
export const LOSS_SEED = 11;

export function stageShot(world, shot) {
  if (shot === "play") {
    startGame(world);
    runAutopilot(world, 3);
    world.bannerTimer = 0;
    world.banner = "";
    return world.phase === PHASE_PLAY;
  }
  if (shot === "win") {
    startGame(world);
    runAutopilot(world, 40);
    world.bannerTimer = 0;
    world.banner = "";
    return world.phase === PHASE_WIN;
  }
  if (shot === "loss") {
    startGame(world);
    world.player.hp = 12;
    runAutopilot(world, 40);
    world.bannerTimer = 0;
    world.banner = "";
    return world.phase === PHASE_LOSS;
  }
  return true; // start: the title screen as-is.
}
