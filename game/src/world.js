// Ember Pact rules: the duel state machine. Pure logic, no DOM, no canvas:
// main.js drives it and render.js draws it, so Node can import this file
// and test every rule headlessly.
//
// Phases: title -> play (your turn) -> ai (Cinder plays, one card per
// beat) -> play ... -> win | loss. Block absorbs damage and clears at the
// start of its owner's next turn. Mana refills to the turn number (cap 10)
// at the start of your turn; Cinder gets the same. Score is damage dealt,
// plus a win bonus; the best score is kept in localStorage by main.js.

import { CARDS, DRAW_PER_TURN, MAX_HP, MAX_MANA, START_HAND, WIN_BONUS } from "./config.js";
import { drawCards, newFighter } from "./cards.js";
import { mulberry32 } from "./random.js";
import { chooseAiPlays } from "./ai.js";

export const PHASE_TITLE = "title";
export const PHASE_PLAY = "play";
export const PHASE_AI = "ai";
export const PHASE_WIN = "win";
export const PHASE_LOSS = "loss";

export function createWorld(seed = 7) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    phase: PHASE_TITLE,
    turn: 0,
    player: newFighter(rng),
    enemy: newFighter(rng),
    log: [],
    score: 0,
    damageDealt: 0,
    wins: 0,
    aiQueue: [],
    aiTimer: 0,
    banner: "",
    bannerTimer: 0,
    floats: [],
    shake: 0,
    over: false,
  };
}

export function addLog(world, text) {
  world.log.unshift(text);
  if (world.log.length > 6) world.log.length = 6;
}

export function addFloat(world, x, y, text, color) {
  world.floats.push({ x, y, text, color, t: 0 });
}

// Damage first eats block, then HP. Returns the HP damage actually dealt.
export function dealDamage(world, target, amount, source) {
  let left = amount;
  if (target.block > 0) {
    const absorbed = Math.min(target.block, left);
    target.block -= absorbed;
    left -= absorbed;
  }
  const hpDamage = left;
  target.hp = Math.max(0, target.hp - hpDamage);
  if (source === "player") world.damageDealt += hpDamage;
  return hpDamage;
}

function applyCard(world, owner, foe, cardId) {
  const def = CARDS[cardId];
  if (!def) return;
  const who = owner === world.player ? "You" : "Cinder";
  if (def.damage) {
    for (let hit = 0; hit < (def.hits || 1); hit += 1) {
      const dealt = dealDamage(world, foe, def.damage, owner === world.player ? "player" : "enemy");
      addFloat(world, foe === world.enemy ? 640 : 640, foe === world.enemy ? 170 : 480, `-${dealt}`, "#ff6b6b");
      if (foe.hp <= 0) break;
    }
    addLog(world, `${who}: ${def.name}, ${def.damage * (def.hits || 1)} dmg.`);
  }
  if (def.block) {
    owner.block += def.block;
    addLog(world, `${who}: +${def.block} block.`);
  }
  if (def.heal) {
    const healed = Math.min(def.heal, owner.maxHp - owner.hp);
    owner.hp += healed;
    addFloat(world, 640, owner === world.player ? 480 : 170, `+${healed}`, "#69db7c");
    addLog(world, `${who}: +${healed} health.`);
  }
  if (def.draw) drawCards(owner, def.draw, world.rng);
}

// Play the card at handIndex from the player's hand. Returns false when
// the play is not legal (wrong phase, not enough mana); true otherwise.
export function playCard(world, handIndex) {
  if (world.phase !== PHASE_PLAY) return false;
  const hand = world.player.hand;
  if (handIndex < 0 || handIndex >= hand.length) return false;
  const cardId = hand[handIndex];
  const def = CARDS[cardId];
  if (world.player.mana < def.cost) return false;
  world.player.mana -= def.cost;
  hand.splice(handIndex, 1);
  world.player.discard.push(cardId);
  applyCard(world, world.player, world.enemy, cardId);
  world.score = world.damageDealt;
  if (world.enemy.hp <= 0) {
    endDuel(world, true);
    return true;
  }
  return true;
}

export function startGame(world) {
  world.player = newFighter(world.rng);
  world.enemy = newFighter(world.rng);
  world.turn = 1;
  world.log = [];
  world.score = 0;
  world.damageDealt = 0;
  world.aiQueue = [];
  world.floats = [];
  world.over = false;
  drawCards(world.player, START_HAND, world.rng);
  drawCards(world.enemy, START_HAND, world.rng);
  world.player.maxMana = 1;
  world.player.mana = 1;
  // Cinder holds one mana more than you — the ember was hers first.
  world.enemy.maxMana = 2;
  world.enemy.mana = 2;
  world.phase = PHASE_PLAY;
  world.banner = "Your turn — play a card";
  world.bannerTimer = 1.6;
  addLog(world, "The duel begins. You hold the first ember.");
}

function endDuel(world, won) {
  world.phase = won ? PHASE_WIN : PHASE_LOSS;
  world.over = true;
  if (won) {
    world.wins += 1;
    world.score = world.damageDealt + WIN_BONUS;
    addLog(world, `Cinder falls. You win the ember! (+${WIN_BONUS})`);
  } else {
    addLog(world, "Your ember gutters out. Cinder wins.");
  }
}

// End your turn: Cinder's block clears, her queued plays are chosen, and
// the AI phase steps through them one per beat (see update).
export function endTurn(world) {
  if (world.phase !== PHASE_PLAY) return false;
  world.enemy.block = 0;
  world.aiQueue = chooseAiPlays(world);
  world.aiTimer = 0.55;
  world.phase = PHASE_AI;
  world.banner = "Cinder's turn";
  world.bannerTimer = 1.2;
  addLog(world, "You end your turn.");
  return true;
}

// Step the AI phase: one queued play per beat, then Cinder draws and the
// turn passes back to you with refilled mana and fresh cards.
export function update(world, dt) {
  if (world.bannerTimer > 0) world.bannerTimer -= dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 3);
  for (const f of world.floats) f.t += dt;
  world.floats = world.floats.filter((f) => f.t < 1.1);
  if (world.phase !== PHASE_AI) return;
  world.aiTimer -= dt;
  if (world.aiTimer > 0) return;
  world.aiTimer = 0.7;
  const next = world.aiQueue.shift();
  if (next) {
    const idx = world.enemy.hand.indexOf(next);
    if (idx >= 0 && world.enemy.mana >= CARDS[next].cost) {
      world.enemy.mana -= CARDS[next].cost;
      world.enemy.hand.splice(idx, 1);
      world.enemy.discard.push(next);
      applyCard(world, world.enemy, world.player, next);
      if (world.player.hp <= 0) {
        endDuel(world, false);
        return;
      }
    }
    return;
  }
  // Cinder's turn is spent: draw, refill, hand the turn back.
  drawCards(world.enemy, DRAW_PER_TURN, world.rng);
  world.turn += 1;
  world.player.block = 0;
  world.player.maxMana = Math.min(MAX_MANA, world.turn);
  world.player.mana = world.player.maxMana;
  world.enemy.maxMana = Math.min(MAX_MANA, world.turn + 1);
  world.enemy.mana = world.enemy.maxMana;
  drawCards(world.player, DRAW_PER_TURN, world.rng);
  world.phase = PHASE_PLAY;
  world.banner = `Turn ${world.turn} — your move`;
  world.bannerTimer = 1.4;
  addLog(world, `Turn ${world.turn}: you draw ${DRAW_PER_TURN} cards.`);
}

export function bestScoreKey() {
  return "ember-pact-best";
}

export { MAX_HP };
