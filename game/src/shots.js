// Ember Pact — staged scenes for the screenshots: ?shot=start|play|win|loss
// Each scene is a real duel state, built by playing the game's own rules:
// the win and loss scenes are full autopilot duels from a searched seed.

import { newGame, startDuel, playCard, endTurn } from './world.js';
import { choosePlay, playTurn } from './ai.js';

export const SHOTS = ['start', 'play', 'win', 'loss'];

/**
 * Play a whole duel with both sides greedy, from a seed, until someone
 * falls or the turn cap is hit. Returns the finished state.
 */
export function autopilotGame(seed, maxTurns = 100) {
  const state = newGame(seed);
  startDuel(state);
  let guard = 0;
  while (state.phase === 'play' && state.turnCount <= maxTurns && guard++ < 500) {
    const pick = choosePlay(state, 'player');
    if (pick === null) endTurn(state, choosePlay);
    else playCard(state, 'player', pick);
  }
  return state;
}

/**
 * The first seed at or after `from` whose autopilot duel ends as asked.
 * Seeds are tried in order, so the same request always finds the same
 * duel — the screenshots are reproducible.
 */
export function findSeedFor(outcome, from, maxTries = 400) {
  for (let seed = from; seed < from + maxTries; seed++) {
    const state = autopilotGame(seed);
    if (state.phase === outcome) return { seed, state };
  }
  return null;
}

/**
 * Build one staged scene. Returns { state, seed, note }.
 *   start — the title screen, a fresh duel.
 *   play  — mid-duel: Asha played twice, Cinder answered, turn two opens.
 *   win   — a real autopilot duel Asha won, at its final state.
 *   loss  — a real autopilot duel Cinder won, at its final state.
 */
export function buildShot(name, seedHint = 11) {
  if (name === 'start') {
    const state = newGame(seedHint);
    return { state, seed: seedHint, note: 'Title screen, fresh duel.' };
  }
  if (name === 'play') {
    const state = newGame(seedHint);
    startDuel(state);
    playTurn(state, 'player', playCard);
    if (state.phase === 'play') endTurn(state, choosePlay);
    return { state, seed: seedHint, note: 'Mid-duel, turn two, after Cinder answered.' };
  }
  const found = findSeedFor(name, seedHint);
  if (!found) {
    const state = newGame(seedHint);
    startDuel(state);
    return { state, seed: seedHint, note: `No ${name} duel found from seed ${seedHint}; showing an open duel.` };
  }
  return { state: found.state, seed: found.seed, note: `Autopilot duel, seed ${found.seed}, ended ${name} on turn ${found.state.turnCount}.` };
}
