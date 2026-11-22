// Ember Pact — the duel itself: state, turns, and what a card does.
// Pure rules: given a state and a move, the next state. No drawing here.

import {
  START_HP, OPENING_HAND, DRAW_PER_TURN, START_MANA, MAX_MANA, CARD_BY_ID,
} from './config.js';
import { makeRng } from './random.js';
import { buildDeck, drawCards } from './cards.js';

/** A duelist's side of the table. */
function makeSide() {
  return {
    hp: START_HP, maxHp: START_HP, block: 0,
    deck: [], hand: [], discard: [],
    mana: 0, maxMana: 0, damageDealt: 0, healed: 0,
  };
}

/**
 * A fresh duel, on the title screen, decks shuffled from the seed.
 * Nothing is drawn yet: startDuel deals the opening hands.
 */
export function newGame(seed) {
  const rng = makeRng(seed);
  const state = {
    seed,
    rng,
    phase: 'title',
    turn: 'player',
    turnCount: 0,
    playerName: 'Asha',
    enemyName: 'Cinder',
    player: makeSide(),
    enemy: makeSide(),
    log: ['Asha and Cinder meet for the last ember.'],
    score: 0,
    message: '',
  };
  state.player.deck = buildDeck(rng);
  state.enemy.deck = buildDeck(rng);
  return state;
}

/** Open a turn for a side: block falls, mana grows and refills, cards drawn. */
function beginTurn(state, side, first) {
  const who = state[side];
  who.block = 0;
  if (!first) who.maxMana = Math.min(MAX_MANA, who.maxMana + 1);
  who.mana = who.maxMana;
  drawCards(state, side, first ? OPENING_HAND : DRAW_PER_TURN);
}

/** The duel opens: turn one, Asha to play. */
export function startDuel(state) {
  if (state.phase !== 'title') return;
  state.phase = 'play';
  state.turnCount = 1;
  state.player.maxMana = START_MANA;
  state.enemy.maxMana = START_MANA;
  beginTurn(state, 'player', true);
  beginTurn(state, 'enemy', true);
  state.log.push('The duel begins. Asha to play.');
}

/** The card kinds a side can afford right now, as hand indexes. */
export function legalPlays(state, side) {
  if (state.phase !== 'play' || state.turn !== side) return [];
  const who = state[side];
  const out = [];
  who.hand.forEach((id, i) => {
    if (CARD_BY_ID[id].cost <= who.mana) out.push(i);
  });
  return out;
}

/** Whether a hand index is a legal play right now. */
export function canPlay(state, side, handIndex) {
  return legalPlays(state, side).includes(handIndex);
}

/**
 * Damage through block: block soaks what it can, the rest hits health.
 * Returns the health actually lost.
 */
function dealDamage(state, target, amount) {
  const who = state[target];
  const soaked = Math.min(who.block, amount);
  who.block -= soaked;
  const hurt = amount - soaked;
  who.hp = Math.max(0, who.hp - hurt);
  return hurt;
}

/** The score: damage Asha dealt, plus a win bonus and her health kept. */
export function computeScore(state) {
  const bonus = state.phase === 'win' ? 100 + state.player.hp * 2 : 0;
  return state.player.damageDealt + bonus;
}

/** Settle the duel when a duelist falls, and fix the score. */
function settle(state) {
  if (state.enemy.hp <= 0 && state.phase === 'play') {
    state.phase = 'win';
    state.score = computeScore(state);
    state.log.push('Cinder falls. The ember is yours.');
  } else if (state.player.hp <= 0 && state.phase === 'play') {
    state.phase = 'loss';
    state.score = computeScore(state);
    state.log.push('Asha falls. The ember gutters out.');
  }
}

/**
 * Play a card from a hand. Applies its effect in order — hits of damage,
 * then block, then healing, then a draw — and returns the events the
 * table should show and hear, one per effect that happened.
 */
export function playCard(state, side, handIndex) {
  const events = [];
  if (!canPlay(state, side, handIndex)) return events;
  const who = state[side];
  const foe = side === 'player' ? 'enemy' : 'player';
  const card = CARD_BY_ID[who.hand[handIndex]];
  who.hand.splice(handIndex, 1);
  who.discard.push(card.id);
  who.mana -= card.cost;

  for (let hit = 0; hit < card.hits; hit++) {
    if (card.damage > 0) {
      const hurt = dealDamage(state, foe, card.damage);
      who.damageDealt += hurt;
      events.push({ type: 'hit', target: foe, amount: card.damage, soaked: card.damage - hurt });
    }
  }
  if (card.block > 0) {
    who.block += card.block;
    events.push({ type: 'block', target: side, amount: card.block });
  }
  if (card.heal > 0) {
    const gained = Math.min(card.heal, who.maxHp - who.hp);
    who.hp += gained;
    who.healed += gained;
    events.push({ type: 'heal', target: side, amount: gained });
  }
  if (card.draw > 0) {
    const drawn = drawCards(state, side, card.draw);
    events.push({ type: 'draw', target: side, amount: drawn });
  }
  state.log.push(`${side === 'player' ? 'Asha' : 'Cinder'} plays ${card.name}.`);
  settle(state);
  return events;
}

/**
 * End the player's turn: Cinder takes hers at once (her plays are
 * listed in the log), then Asha's next turn opens. Returns Cinder's
 * events, so the table can show them.
 */
export function endTurn(state, choosePlay) {
  if (state.phase !== 'play' || state.turn !== 'player') return [];
  state.turn = 'enemy';
  beginTurn(state, 'enemy', false);
  const events = [];
  let guard = 0;
  while (state.phase === 'play' && guard++ < 40) {
    const pick = choosePlay(state, 'enemy');
    if (pick === null || pick === undefined) break;
    events.push(...playCard(state, 'enemy', pick));
  }
  if (state.phase !== 'play') return events;
  state.turn = 'player';
  state.turnCount += 1;
  beginTurn(state, 'player', false);
  state.log.push(`Turn ${state.turnCount}. Asha to play.`);
  return events;
}

/** A duel summary for the end screens and the tests. */
export function summary(state) {
  return {
    phase: state.phase,
    turn: state.turnCount,
    playerHp: state.player.hp,
    enemyHp: state.enemy.hp,
    playerHand: state.player.hand.length,
    enemyHand: state.enemy.hand.length,
    score: state.score,
  };
}
