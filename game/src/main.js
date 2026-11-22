// Ember Pact boot: canvas setup, fixed-step loop, best score, and the
// ?shot= staging hook the screenshots use. The game scales to fit the
// window while keeping its 1280x720 table.

import { VIEW_H, VIEW_W } from "./config.js";
import { createAudio } from "./audio.js";
import { bindInput } from "./input.js";
import { render } from "./render.js";
import { stageShot } from "./shots.js";
import { PHASE_LOSS, PHASE_WIN, bestScoreKey, createWorld, update } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed") || "7") || 7;
const shot = params.get("shot") || "";
const world = createWorld(seed);
window.__emberWorld = world; // Debug hook for headless playtests only.
const audio = createAudio();
const ui = { hoverIndex: -1, hoverEnd: false, best: 0 };

try {
  ui.best = Number(localStorage.getItem(bestScoreKey()) || "0") || 0;
} catch {
  ui.best = 0;
}

function saveBest() {
  if (world.score > ui.best) {
    ui.best = world.score;
    try {
      localStorage.setItem(bestScoreKey(), String(ui.best));
    } catch {
      // Private mode or no storage: the best score is session-only.
    }
  }
}

bindInput(canvas, world, ui, audio);

if (shot) {
  const ok = stageShot(world, shot);
  if (!ok) document.title = `Ember Pact — shot ${shot} did not reach its scene`;
  if (world.phase === PHASE_WIN || world.phase === PHASE_LOSS) saveBest();
} else {
  document.title = "Ember Pact — a duel of cards";
}

function fit() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.style.width = `${Math.floor(VIEW_W * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW_H * scale)}px`;
}
window.addEventListener("resize", fit);
fit();

let last = performance.now();
let prevPhase = world.phase;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(world, dt);
  if (world.phase !== prevPhase) {
    if (world.phase === PHASE_WIN) {
      saveBest();
      audio.play("win");
    } else if (world.phase === PHASE_LOSS) {
      saveBest();
      audio.play("loss");
    }
    prevPhase = world.phase;
  }
  render(ctx, world, ui);
  const status = document.getElementById("status");
  if (status) {
    status.textContent =
      world.phase === "title"
        ? "Ember Pact. Press Enter to duel Cinder."
        : `Turn ${world.turn}. You have ${world.player.hp} health, Cinder has ${world.enemy.hp}.`;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
