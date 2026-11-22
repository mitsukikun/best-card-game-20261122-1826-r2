// Cinder's brain: a greedy, readable opponent. She looks at the table and
// picks the play a human would telegraph — finish you when she can, patch
// herself up when she is hurting, otherwise spend her mana on the hardest
// hit she can afford. Ties break on the seeded rng, so a seed replays.

import { CARDS } from "./config.js";

// Value of one card on this table, from Cinder's side. Damage is worth
// more when it can end the duel; healing and block are worth more when
// she is low; a card that also draws is worth a little extra.
function cardValue(world, cardId) {
  const def = CARDS[cardId];
  const me = world.enemy;
  const you = world.player;
  let value = 0;
  const damage = (def.damage || 0) * (def.hits || 1);
  if (damage) {
    value += damage * 10;
    if (you.hp - Math.max(0, damage - you.block) <= 0) value += 1000;
    if (you.hp <= 6) value += damage * 4;
  }
  if (def.block) {
    value += def.block * (me.hp <= 12 ? 9 : 2);
    if (you.hp <= 0) value += 0;
  }
  if (def.heal) {
    const missing = me.maxHp - me.hp;
    value += Math.min(def.heal, missing) * (me.hp <= 10 ? 9 : 1);
  }
  if (def.draw) value += 6;
  return value / def.cost;
}

// Choose Cinder's plays for this turn: repeatedly take the best-value
// affordable card until her mana runs out or nothing is worth playing.
export function chooseAiPlays(world) {
  const plays = [];
  let mana = world.enemy.mana;
  const hand = world.enemy.hand.slice();
  for (;;) {
    let best = -1;
    let bestValue = 0;
    for (let i = 0; i < hand.length; i += 1) {
      const def = CARDS[hand[i]];
      if (!def || def.cost > mana) continue;
      const jitter = world.rng() * 2;
      const value = cardValue(world, hand[i]) + jitter;
      if (value > bestValue) {
        bestValue = value;
        best = i;
      }
    }
    if (best < 0) break;
    mana -= CARDS[hand[best]].cost;
    plays.push(hand[best]);
    hand.splice(best, 1);
  }
  return plays;
}
