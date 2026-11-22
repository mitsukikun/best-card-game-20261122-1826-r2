// Ember Pact — Cinder's head, and the autopilot's: a greedy card chooser.
// It reads the table, weighs every affordable card, and plays the best.
// The same chooser drives the staged shots, so they play like a real duel.

import { CARD_BY_ID } from './config.js';
import { legalPlays } from './world.js';

/**
 * What a card is worth to the side playing it, right now.
 * Damage is worth its face value; block and healing count a little less
 * (they only matter while hurt or threatened); a draw is worth a card.
 * Lethal damage is worth everything: the duel ends on it.
 */
export function cardValue(state, side, card) {
  const who = state[side];
  const foe = side === 'player' ? state.enemy : state.player;
  if (card.damage * card.hits >= foe.hp + foe.block) return 1000;
  let value = card.damage * card.hits;
  value += card.block * 0.8;
  if (who.hp < who.maxHp) value += Math.min(card.heal, who.maxHp - who.hp) * 0.9;
  value += card.draw * 1.5;
  if (card.block > 0 && who.hp >= who.maxHp && foe.hp > 10) value -= 0.5;
  return value;
}

/**
 * The best affordable card in a hand, as a hand index — or null when the
 * side should stop: nothing affordable, or nothing worth its mana.
 * Ties break toward the cheaper card, so mana is never wasted.
 */
export function choosePlay(state, side) {
  const plays = legalPlays(state, side);
  if (plays.length === 0) return null;
  const who = state[side];
  let best = null;
  let bestScore = -Infinity;
  for (const i of plays) {
    const card = CARD_BY_ID[who.hand[i]];
    const worth = cardValue(state, side, card);
    const score = worth / card.cost - card.cost * 0.01;
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  if (best === null || bestScore <= 0) return null;
  return best;
}

/**
 * Play a whole turn for a side: keep choosing until the chooser stops.
 * Returns the events, in order, for the table to show.
 * (world.endTurn calls this for Cinder; the autopilot calls it for Asha.)
 */
export function playTurn(state, side, playCardFn) {
  const events = [];
  let guard = 0;
  while (state.phase === 'play' && guard++ < 40) {
    const pick = choosePlay(state, side);
    if (pick === null) break;
    events.push(...playCardFn(state, side, pick));
  }
  return events;
}
