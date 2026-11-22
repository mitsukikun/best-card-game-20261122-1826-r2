// Ember Pact drawing: every screen on one canvas — title, the duel table,
// win and loss. Cards are legible at thumbnail size: big cost gem, big
// value, element told by colour AND shape. No images, no fonts loaded:
// everything is drawn with canvas paths and the system font stack.

import { CARDS, ELEMENTS, MAX_HP, PALETTE, VIEW_H, VIEW_W } from "./config.js";
import { PHASE_AI, PHASE_LOSS, PHASE_PLAY, PHASE_TITLE, PHASE_WIN } from "./world.js";

export const CARD_W = 120;
export const CARD_H = 168;
export const CARD_GAP = 12;
// Cards are drawn in a 150x208 coordinate space and scaled to CARD_W.
export const CARD_SCALE = CARD_W / 150;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Element mark: Flame = triangle flame, Frost = asterisk flake,
// Leaf = ellipse leaf, Stone = diamond. Drawn at (cx, cy), size s.
export function drawElementMark(ctx, element, cx, cy, s, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.lineJoin = "round";
  if (element === "flame") {
    // A leaning flame with a flicked tip, not a droplet.
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.08, cy - s * 0.55);
    ctx.quadraticCurveTo(cx + s * 0.55, cy - s * 0.05, cx + s * 0.3, cy + s * 0.25);
    ctx.quadraticCurveTo(cx + s * 0.18, cy + s * 0.48, cx - s * 0.02, cy + s * 0.32);
    ctx.quadraticCurveTo(cx - s * 0.18, cy + s * 0.48, cx - s * 0.32, cy + s * 0.22);
    ctx.quadraticCurveTo(cx - s * 0.55, cy - s * 0.12, cx - s * 0.12, cy - s * 0.32);
    ctx.quadraticCurveTo(cx - s * 0.02, cy - s * 0.42, cx + s * 0.08, cy - s * 0.55);
    ctx.fill();
  } else if (element === "frost") {
    for (let i = 0; i < 3; i += 1) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx - Math.cos(a) * s * 0.5, cy - Math.sin(a) * s * 0.5);
      ctx.lineTo(cx + Math.cos(a) * s * 0.5, cy + Math.sin(a) * s * 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (element === "leaf") {
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.42, s * 0.22, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff8e7";
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.3, cy + s * 0.15);
    ctx.lineTo(cx + s * 0.3, cy - s * 0.15);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.5);
    ctx.lineTo(cx + s * 0.4, cy);
    ctx.lineTo(cx, cy + s * 0.5);
    ctx.lineTo(cx - s * 0.4, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// Where the player's hand sits: centred, fanned, the hovered card lifted.
export function playerHandRects(world, hoverIndex = -1) {
  const n = world.player.hand.length;
  const totalW = n * CARD_W + (n - 1) * CARD_GAP;
  const startX = (VIEW_W - totalW) / 2;
  const rects = [];
  for (let i = 0; i < n; i += 1) {
    const lift = i === hoverIndex ? 18 : 0;
    const tilt = (i - (n - 1) / 2) * 0.02;
    rects.push({ x: startX + i * (CARD_W + CARD_GAP), y: VIEW_H - CARD_H - 26 - lift, w: CARD_W, h: CARD_H, tilt });
  }
  return rects;
}

function drawCardFace(ctx, cardId, x, y, opts = {}) {
  const def = CARDS[cardId];
  const el = ELEMENTS[def.element];
  const { dimmed = false, scale = 1 } = opts;
  ctx.save();
  ctx.translate(x + (CARD_W * scale) / 2, y + (CARD_H * scale) / 2);
  ctx.scale(scale, scale);
  ctx.translate(-CARD_W / 2, -CARD_H / 2);
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.fillStyle = PALETTE.cardFace;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = el.dark;
  ctx.stroke();
  // Element band.
  ctx.fillStyle = el.color;
  ctx.fillRect(4, 4, CARD_W - 8, 34);
  drawElementMark(ctx, def.element, CARD_W - 24, 21, 22, "#ffffff");
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(el.name, 10, 22);
  // Cost gem.
  ctx.beginPath();
  ctx.arc(24, 58, 17, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.mana;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(def.cost), 24, 59);
  // Big value: damage, or block / heal.
  const big = def.damage ? `${def.damage * (def.hits || 1)}` : def.block ? `+${def.block}` : def.heal ? `+${def.heal}` : "✦";
  const bigLabel = def.damage ? "DMG" : def.block ? "BLOCK" : def.heal ? "HEAL" : "PACT";
  ctx.fillStyle = PALETTE.cardInk;
  ctx.font = "bold 44px system-ui, sans-serif";
  ctx.fillText(big, CARD_W / 2, 108);
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(bigLabel, CARD_W / 2, 138);
  // Name + rules text.
  ctx.fillStyle = PALETTE.cardInk;
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.fillText(def.name, CARD_W / 2, 162);
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillStyle = "#495057";
  wrapText(ctx, def.text, CARD_W / 2, 182, CARD_W - 20, 15);
  if (dimmed) {
    ctx.fillStyle = "rgba(33, 37, 41, 0.45)";
    roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
    ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  roundRect(ctx, 0, 0, CARD_W, CARD_H, 12);
  ctx.fillStyle = PALETTE.cardBack;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  roundRect(ctx, 10, 10, CARD_W - 20, CARD_H - 20, 8);
  ctx.strokeStyle = "rgba(242, 193, 78, 0.7)";
  ctx.lineWidth = 2;
  ctx.stroke();
  drawElementMark(ctx, "flame", CARD_W / 2, CARD_H / 2 - 8, 64, PALETTE.gold);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("EMBER PACT", CARD_W / 2, CARD_H / 2 + 44);
  ctx.restore();
}

function wrapText(ctx, text, cx, y, maxW, lineH) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  ctx.textAlign = "center";
  lines.forEach((l, i) => ctx.fillText(l, cx, y + i * lineH));
}

function drawHpBar(ctx, x, y, w, hp, maxHp, block, label) {
  ctx.fillStyle = PALETTE.hpBack;
  roundRect(ctx, x, y, w, 22, 11);
  ctx.fill();
  const frac = Math.max(0, hp / maxHp);
  if (frac > 0) {
    ctx.fillStyle = PALETTE.hp;
    roundRect(ctx, x, y, w * frac, 22, 11);
    ctx.fill();
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`${label}  ${hp}/${maxHp}`, x + 8, y + 11);
  if (block > 0) {
    ctx.fillStyle = PALETTE.block;
    ctx.beginPath();
    ctx.arc(x + w - 14, y + 11, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(block), x + w - 14, y + 12);
    ctx.textAlign = "left";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.fillStyle = PALETTE.block;
    ctx.fillText("BLOCK", x + w - 52, y + 11);
  }
}

function drawMana(ctx, x, y, mana, maxMana) {
  for (let i = 0; i < MAX_HP; i += 1) {
    if (i >= 10) break;
    ctx.beginPath();
    ctx.arc(x + i * 24, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = i < mana ? PALETTE.mana : PALETTE.manaEmpty;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = i < maxMana ? "#a5d8ff" : "#495057";
    ctx.stroke();
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`Mana ${mana}/${maxMana}`, x, y + 24);
}

function drawPortrait(ctx, x, y, name, color, element) {
  ctx.beginPath();
  ctx.arc(x, y, 34, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  drawElementMark(ctx, element, x, y, 40, "#ffffff");
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "bold 17px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(name, x + 44, y);
}

function drawButton(ctx, x, y, w, h, label, enabled, hover) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = !enabled ? PALETTE.buttonDisabled : hover ? PALETTE.buttonHover : PALETTE.button;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2 + 1);
}

function drawTable(ctx) {
  ctx.fillStyle = PALETTE.table;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.felt;
  roundRect(ctx, 16, 16, VIEW_W - 32, VIEW_H - 32, 18);
  ctx.fill();
  ctx.strokeStyle = PALETTE.feltLine;
  ctx.lineWidth = 2;
  roundRect(ctx, 16, 16, VIEW_W - 32, VIEW_H - 32, 18);
  ctx.stroke();
  ctx.strokeStyle = "rgba(242, 193, 78, 0.25)";
  ctx.beginPath();
  ctx.moveTo(16, VIEW_H / 2);
  ctx.lineTo(VIEW_W - 16, VIEW_H / 2);
  ctx.stroke();
}

function drawLog(ctx, world) {
  ctx.fillStyle = "rgba(14, 26, 16, 0.85)";
  roundRect(ctx, 28, 250, 250, 170, 10);
  ctx.fill();
  ctx.fillStyle = PALETTE.gold;
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("DUEL LOG", 42, 274);
  ctx.fillStyle = PALETTE.log;
  ctx.font = "13px system-ui, sans-serif";
  world.log.slice(0, 6).forEach((line, i) => {
    ctx.fillText(line.slice(0, 34), 42, 296 + i * 20);
  });
}

function drawPiles(ctx, world) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const piles = [
    { label: "DECK", n: world.player.deck.length, x: 1130 },
    { label: "DISCARD", n: world.player.discard.length, x: 1210 },
  ];
  for (const pile of piles) {
    roundRect(ctx, pile.x - 28, 250, 56, 76, 8);
    ctx.fillStyle = PALETTE.panel;
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "bold 20px system-ui, sans-serif";
    ctx.fillText(String(pile.n), pile.x, 282);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "bold 11px system-ui, sans-serif";
    ctx.fillText(pile.label, pile.x, 310);
  }
}

function drawTitle(ctx, world, best) {
  drawTable(ctx);
  // Ember glow behind the title.
  const glow = ctx.createRadialGradient(640, 260, 20, 640, 260, 340);
  glow.addColorStop(0, "rgba(232, 89, 12, 0.35)");
  glow.addColorStop(1, "rgba(232, 89, 12, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawElementMark(ctx, "flame", 640, 170, 120, PALETTE.player);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = "bold 84px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("EMBER PACT", 640, 290);
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "24px system-ui, sans-serif";
  ctx.fillText("A duel of cards against Cinder, the Ash Scribe", 640, 348);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "17px system-ui, sans-serif";
  ctx.fillText("Outwit her hand. Spend your mana. Take the last ember.", 640, 382);
  // How to play.
  ctx.fillStyle = "rgba(14, 26, 16, 0.9)";
  roundRect(ctx, 330, 420, 620, 150, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "16px system-ui, sans-serif";
  const lines = [
    "Click a card (or press 1–7) to play it — it costs mana.",
    "End Turn (E) hands the table to Cinder. First to 0 health loses.",
    "Block shields you until your next turn. Mana refills each turn.",
    "Cinder holds one mana more than you — the ember was hers first.",
  ];
  lines.forEach((line, i) => ctx.fillText(line, 640, 448 + i * 26));
  ctx.fillStyle = PALETTE.gold;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("Click or press Enter to duel", 640, 610);
  if (best > 0) {
    ctx.fillStyle = PALETTE.muted;
    ctx.font = "16px system-ui, sans-serif";
    ctx.fillText(`Best score: ${best}`, 640, 644);
  }
  void world;
}

function drawEnd(ctx, world, best, won) {
  drawTable(ctx);
  ctx.fillStyle = "rgba(14, 26, 16, 0.75)";
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (won) {
    drawElementMark(ctx, "flame", 640, 180, 110, PALETTE.gold);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText("THE EMBER IS YOURS", 640, 300);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("Cinder bows, and the last ember answers to you.", 640, 356);
  } else {
    ctx.fillStyle = "#868e96";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText("THE EMBER GUTTERS OUT", 640, 300);
    ctx.fillStyle = PALETTE.ink;
    ctx.font = "24px system-ui, sans-serif";
    ctx.fillText("Cinder keeps the ember — this time. Duel again?", 640, 356);
  }
  ctx.fillStyle = PALETTE.ink;
  ctx.font = "bold 26px system-ui, sans-serif";
  ctx.fillText(`Score ${world.score}   •   Damage dealt ${world.damageDealt}   •   Turns ${world.turn}`, 640, 420);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "18px system-ui, sans-serif";
  ctx.fillText(`Best score: ${Math.max(best, world.score)}`, 640, 456);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("Press R or click to duel again", 640, 516);
}

export function render(ctx, world, ui) {
  const { hoverIndex = -1, hoverEnd = false, best = 0 } = ui || {};
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.textBaseline = "alphabetic";
  if (world.phase === PHASE_TITLE) {
    drawTitle(ctx, world, best);
    return;
  }
  if (world.phase === PHASE_WIN) {
    drawEnd(ctx, world, best, true);
    return;
  }
  if (world.phase === PHASE_LOSS) {
    drawEnd(ctx, world, best, false);
    return;
  }
  drawTable(ctx);
  const shakeX = world.shake > 0 ? (Math.random() - 0.5) * world.shake * 10 : 0;
  ctx.save();
  ctx.translate(shakeX, 0);
  // Enemy row.
  drawPortrait(ctx, 80, 64, "Cinder, the Ash Scribe", PALETTE.enemy, "flame");
  drawHpBar(ctx, 360, 52, 360, world.enemy.hp, world.enemy.maxHp, world.enemy.block, "CINDER");
  drawMana(ctx, 760, 62, world.enemy.mana, world.enemy.maxMana);
  // Enemy hand: card backs, fanned.
  const enemyN = world.enemy.hand.length;
  const backW = 74;
  const backTotal = enemyN * backW + (enemyN - 1) * 8;
  const backX = (VIEW_W - backTotal) / 2;
  for (let i = 0; i < enemyN; i += 1) {
    drawCardBack(ctx, backX + i * (backW + 8), 96, 0.5);
  }
  // Turn + score strip.
  ctx.fillStyle = PALETTE.muted;
  ctx.font = "bold 15px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`Turn ${world.turn}`, 28, 232);
  ctx.fillText(`Score ${world.score}`, 1100, 232);
  drawLog(ctx, world);
  drawPiles(ctx, world);
  // End Turn button.
  drawButton(ctx, 1060, 340, 180, 52, "End Turn  (E)", world.phase === PHASE_PLAY, hoverEnd);
  // Player row — above the hand, clear of it.
  drawPortrait(ctx, 70, 492, "Asha, the Ember Scribe", PALETTE.player, "flame");
  drawHpBar(ctx, 360, 481, 360, world.player.hp, world.player.maxHp, world.player.block, "YOU");
  drawMana(ctx, 760, 492, world.player.mana, world.player.maxMana);
  // Player hand.
  const rects = playerHandRects(world, hoverIndex);
  world.player.hand.forEach((cardId, i) => {
    const r = rects[i];
    const affordable = world.player.mana >= CARDS[cardId].cost && world.phase === PHASE_PLAY;
    ctx.save();
    ctx.translate(r.x + CARD_W / 2, r.y + CARD_H / 2);
    ctx.rotate(r.tilt);
    ctx.translate(-CARD_W / 2, -CARD_H / 2);
    drawCardFace(ctx, cardId, 0, 0, { dimmed: !affordable, scale: CARD_SCALE });
    ctx.restore();
  });
  // Banner.
  if (world.bannerTimer > 0) {
    const alpha = Math.min(1, world.bannerTimer);
    ctx.fillStyle = `rgba(14, 26, 16, ${0.75 * alpha})`;
    roundRect(ctx, 440, 318, 400, 56, 12);
    ctx.fill();
    ctx.fillStyle = `rgba(242, 193, 78, ${alpha})`;
    ctx.font = "bold 22px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(world.banner, 640, 347);
  }
  // Floating combat text.
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of world.floats) {
    const alpha = 1 - f.t / 1.1;
    ctx.fillStyle = f.color;
    ctx.globalAlpha = alpha;
    ctx.font = "bold 34px system-ui, sans-serif";
    ctx.fillText(f.text, f.x, f.y - f.t * 60);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
