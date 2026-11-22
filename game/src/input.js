// Ember Pact input: mouse clicks and keyboard. Clicking a card plays it,
// clicking End Turn (or E / Space) passes the table, Enter starts the
// duel, R restarts from an end screen, M mutes. Hit-testing reuses the
// renderer's own hand layout so a click never lands on a different card
// than the one drawn under it.

import { CARD_H, CARD_W, playerHandRects } from "./render.js";
import { VIEW_H, VIEW_W } from "./config.js";
import { PHASE_AI, PHASE_LOSS, PHASE_PLAY, PHASE_TITLE, PHASE_WIN, endTurn, playCard, startGame } from "./world.js";

export const END_BUTTON = { x: 1060, y: 340, w: 180, h: 52 };

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function handIndexAt(world, x, y) {
  const rects = playerHandRects(world);
  // Topmost card first: later cards overlap earlier ones, so scan back.
  for (let i = rects.length - 1; i >= 0; i -= 1) {
    if (inside(rects[i], x, y)) return i;
  }
  return -1;
}

export function hoverState(world, x, y) {
  return {
    hoverIndex: world.phase === PHASE_PLAY ? handIndexAt(world, x, y) : -1,
    hoverEnd: world.phase === PHASE_PLAY && inside(END_BUTTON, x, y),
  };
}

// Convert a client-space pointer event into canvas space (the canvas is
// scaled to fit the window, so the mapping is not 1:1).
export function toCanvas(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / rect.width) * VIEW_W,
    y: ((clientY - rect.top) / rect.height) * VIEW_H,
  };
}

export function bindInput(canvas, world, ui, audio) {
  function onMove(event) {
    const p = toCanvas(canvas, event.clientX, event.clientY);
    const hover = hoverState(world, p.x, p.y);
    ui.hoverIndex = hover.hoverIndex;
    ui.hoverEnd = hover.hoverEnd;
  }
  function onClick(event) {
    const p = toCanvas(canvas, event.clientX, event.clientY);
    if (world.phase === PHASE_TITLE) {
      audio.resume();
      startGame(world);
      audio.play("start");
      return;
    }
    if (world.phase === PHASE_WIN || world.phase === PHASE_LOSS) {
      audio.resume();
      startGame(world);
      audio.play("start");
      return;
    }
    if (world.phase === PHASE_PLAY) {
      const idx = handIndexAt(world, p.x, p.y);
      if (idx >= 0) {
        if (playCard(world, idx)) audio.play("card");
        else audio.play("deny");
        return;
      }
      if (inside(END_BUTTON, p.x, p.y)) {
        if (endTurn(world)) audio.play("end");
      }
    }
  }
  function onKey(event) {
    const key = event.key;
    if (key === "m" || key === "M") {
      audio.toggleMute();
      return;
    }
    if (world.phase === PHASE_TITLE && (key === "Enter" || key === " ")) {
      event.preventDefault();
      audio.resume();
      startGame(world);
      audio.play("start");
      return;
    }
    if ((world.phase === PHASE_WIN || world.phase === PHASE_LOSS) && (key === "r" || key === "R" || key === "Enter")) {
      audio.resume();
      startGame(world);
      audio.play("start");
      return;
    }
    if (world.phase !== PHASE_PLAY) return;
    if (key >= "1" && key <= "7") {
      const idx = Number(key) - 1;
      if (playCard(world, idx)) audio.play("card");
      else audio.play("deny");
      return;
    }
    if (key === "e" || key === "E" || key === " ") {
      event.preventDefault();
      if (endTurn(world)) audio.play("end");
    }
  }
  canvas.addEventListener("mousemove", onMove);
  canvas.addEventListener("click", onClick);
  window.addEventListener("keydown", onKey);
}

export { CARD_H, CARD_W, VIEW_H, VIEW_W };
