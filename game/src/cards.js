// Cards and decks: building a fresh 30-card deck, drawing, discarding,
// and reshuffling the discard pile when the deck runs out.

import { CARDS, DECK_LIST, MAX_HAND } from "./config.js";
import { shuffle } from "./random.js";

export function cardDef(id) {
  return CARDS[id];
}

export function buildDeck(rng) {
  const ids = [];
  for (const [id, count] of DECK_LIST) {
    for (let i = 0; i < count; i += 1) ids.push(id);
  }
  return shuffle(ids, rng);
}

// Draw n cards from fighter.deck into fighter.hand (reshuffling the
// discard pile when the deck is empty); the hand caps at MAX_HAND and
// overflow is discarded. Returns how many cards were drawn.
export function drawCards(fighter, n, rng) {
  let drawn = 0;
  for (let i = 0; i < n; i += 1) {
    if (fighter.deck.length === 0) {
      if (fighter.discard.length === 0) break;
      fighter.deck = shuffle(fighter.discard, rng);
      fighter.discard = [];
    }
    const id = fighter.deck.pop();
    if (fighter.hand.length < MAX_HAND) fighter.hand.push(id);
    else fighter.discard.push(id);
    drawn += 1;
  }
  return drawn;
}

export function newFighter(rng) {
  return {
    hp: 30,
    maxHp: 30,
    block: 0,
    mana: 0,
    maxMana: 0,
    deck: buildDeck(rng),
    hand: [],
    discard: [],
  };
}
