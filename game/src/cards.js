// Ember Pact — the deck: building it, drawing from it, reshuffling it.
// A pile is a plain array of card ids; the duel's state holds the piles.

import { DECK_LIST, MAX_HAND } from './config.js';
import { shuffle } from './random.js';

/** A fresh, shuffled 30-card deck for one duelist. */
export function buildDeck(rng) {
  return shuffle(rng, [...DECK_LIST]);
}

/**
 * Move cards from a pile into a hand, reshuffling the discard pile into
 * the deck when the deck runs dry. Returns how many cards were drawn.
 * A draw past MAX_HAND is discarded instead of held.
 */
export function drawCards(state, side, count) {
  const who = state[side];
  let drawn = 0;
  for (let i = 0; i < count; i++) {
    if (who.deck.length === 0) {
      if (who.discard.length === 0) break;
      who.deck = shuffle(state.rng, [...who.discard]);
      who.discard.length = 0;
      state.log.push(`${nameOf(state, side)} reshuffles the discard pile.`);
    }
    const card = who.deck.pop();
    if (who.hand.length < MAX_HAND) who.hand.push(card);
    else who.discard.push(card);
    drawn++;
  }
  return drawn;
}

/** The name a side is called in the log. */
export function nameOf(state, side) {
  return side === 'player' ? state.playerName : state.enemyName;
}

/** How many cards of each kind a deck holds (for tests and the log). */
export function countKinds(deck) {
  const out = {};
  for (const id of deck) out[id] = (out[id] ?? 0) + 1;
  return out;
}

/**
 * A hand as card kinds, in order, for the renderer and the AI:
 * the hand holds ids; this resolves them to their definitions.
 */
export function handKinds(state, side, cardById) {
  return state[side].hand.map((id) => cardById[id]);
}
