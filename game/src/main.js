// Ember Pact — the table's keeper: boots the game, runs the loop, and
// wires every move to the rules, the renderer and the sounds.
// ?shot=start|play|win|loss stages a scene instead of a fresh duel.

import { VIEW_W, VIEW_H, CARD_BY_ID, LAYOUT } from './config.js';
import { newGame, startDuel, playCard, endTurn, computeScore } from './world.js';
import { choosePlay } from './ai.js';
import { drawScene, handCardRect } from './render.js';
import { wireInput, addFloater } from './input.js';
import { makeSoundBoard } from './audio.js';
import { buildShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const sounds = makeSoundBoard();

/** The seed of a fresh duel: the clock, so no two duels open alike. */
function freshSeed() {
  return (Date.now() % 2147483647) >>> 0;
}

let state = newGame(freshSeed());
let ui = null;

/** Read the staged scene out of the address bar, if one is asked for. */
function shotFromUrl() {
  const shot = new URLSearchParams(window.location.search).get('shot');
  return shot || '';
}

/** The table coordinates of a duelist's portrait, for floating numbers. */
function fighterPoint(side) {
  return side === 'player' ? { x: 1140, y: 640 } : { x: 140, y: 60 };
}

/** Show and hear what a played card did. */
function showEvents(events, handIndex) {
  const now = performance.now();
  for (const e of events) {
    const p = fighterPoint(e.target);
    if (e.type === 'hit') {
      addFloater(ui, p.x, p.y, `-${e.amount}`, '#ff6b4a', now);
      sounds.play('hit');
    } else if (e.type === 'block') {
      addFloater(ui, p.x, p.y, `+${e.amount} block`, '#7fb3d5', now);
      sounds.play('block');
    } else if (e.type === 'heal') {
      addFloater(ui, p.x, p.y, `+${e.amount}`, '#58b368', now);
      sounds.play('heal');
    } else if (e.type === 'draw') {
      sounds.play('play');
    }
  }
  if (state.phase === 'win') sounds.play('win');
  if (state.phase === 'loss') sounds.play('loss');
}

/** Asha plays a card from her hand. */
function onPlay(handIndex) {
  if (state.phase !== 'play' || state.turn !== 'player') return;
  const cardId = state.player.hand[handIndex];
  if (!cardId) return;
  const card = CARD_BY_ID[cardId];
  // Where the card sat, so the renderer can fly it to the table.
  const rect = handCardRect(handIndex, state.player.hand.length, LAYOUT.playerHandY);
  const events = playCard(state, 'player', handIndex);
  if (events.length === 0) return;
  ui.played = { card, born: performance.now(), fromX: rect.x + rect.w / 2, fromY: rect.y + rect.h / 2 };
  showEvents(events);
  ui.selected = -1;
  state.score = computeScore(state);
}

/** Asha ends her turn; Cinder answers at once, then the next turn opens. */
function onEndTurn() {
  if (state.phase !== 'play' || state.turn !== 'player') return;
  const events = endTurn(state, choosePlay);
  showEvents(events);
  state.score = computeScore(state);
}

/** A fresh duel from the title screen. */
function onStart() {
  sounds.unlock();
  state = newGame(freshSeed());
  startDuel(state);
}

/** Another duel from an end screen, same seed family, new shuffle. */
function onAgain() {
  sounds.unlock();
  state = newGame(freshSeed());
  startDuel(state);
}

ui = wireInput(canvas, {
  state: () => state,
  onPlay,
  onEndTurn,
  onStart,
  onAgain,
  onMute(muted) {
    sounds.setMuted(muted);
  },
});

/** Stage a scene for a screenshot, or leave a fresh title screen. */
const shot = shotFromUrl();
if (shot) {
  const staged = buildShot(shot, 11);
  state = staged.state;
  document.title = `Ember Pact — ${shot}`;
}

// The loop: draw the table, sixty times a second, forever.
function frame(now) {
  drawScene(ctx, state, ui, now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// The game is ready for the harness: no errors, canvas sized.
window.__emberPact = {
  state: () => state,
  version: 'r2-fresh',
};
