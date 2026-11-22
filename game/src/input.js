// Ember Pact — hands on the table: mouse and keyboard, nothing else.
// It turns clicks and keys into moves and tells the game what happened.

import { handCardRect, endTurnRect, hitRect } from './render.js';
import { LAYOUT } from './config.js';

/**
 * Wire the canvas and the keyboard to a game. `hooks` is what the game
 * does with each move: onPlay(index), onEndTurn(), onStart(), onAgain(),
 * onMute(). Returns a state object the renderer reads (hover, selected).
 */
export function wireInput(canvas, hooks) {
  const ui = {
    hover: -1,
    selected: -1,
    floaters: [],
    played: null,
    muted: false,
  };

  /** The canvas point of a pointer event, in view coordinates. */
  function toView(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  /** Which hand card, if any, sits under a view point. */
  function cardAt(state, x, y) {
    const hand = state.player.hand;
    // The topmost card wins: check from the last card backwards, so a
    // lifted card is the one the pointer finds.
    for (let i = hand.length - 1; i >= 0; i--) {
      const r = handCardRect(i, hand.length, LAYOUT.playerHandY);
      const lift = ui.hover === i || ui.selected === i ? -20 : 0;
      if (hitRect({ ...r, y: r.y + lift }, x, y)) return i;
    }
    return -1;
  }

  canvas.addEventListener('mousemove', (event) => {
    const p = toView(event);
    const state = hooks.state();
    if (state && state.phase === 'play') ui.hover = cardAt(state, p.x, p.y);
    else ui.hover = -1;
  });

  canvas.addEventListener('click', (event) => {
    const p = toView(event);
    const state = hooks.state();
    if (!state) return;
    if (state.phase === 'title') {
      hooks.onStart();
      return;
    }
    if (state.phase === 'win' || state.phase === 'loss') return;
    if (hitRect(endTurnRect(), p.x, p.y)) {
      hooks.onEndTurn();
      return;
    }
    const i = cardAt(state, p.x, p.y);
    if (i < 0) {
      ui.selected = -1;
      return;
    }
    if (ui.selected === i) {
      ui.selected = -1;
      hooks.onPlay(i);
    } else {
      ui.selected = i;
    }
  });

  document.addEventListener('keydown', (event) => {
    const state = hooks.state();
    if (!state) return;
    const key = event.key.toLowerCase();
    if (key === 'm') {
      ui.muted = !ui.muted;
      hooks.onMute(ui.muted);
      return;
    }
    if (state.phase === 'title' && (key === 'enter' || key === ' ')) {
      hooks.onStart();
      return;
    }
    if ((state.phase === 'win' || state.phase === 'loss') && key === 'r') {
      hooks.onAgain();
      return;
    }
    if (state.phase !== 'play') return;
    if (key === 'e') {
      hooks.onEndTurn();
      return;
    }
    if (key >= '1' && key <= '7') {
      const i = Number(key) - 1;
      if (i < state.player.hand.length) hooks.onPlay(i);
    }
  });

  return ui;
}

/** A floating number over the table: damage, block or healing. */
export function addFloater(ui, x, y, text, color, now) {
  ui.floaters.push({ x, y, text, color, born: now, life: 1100 });
}
