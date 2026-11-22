// Ember Pact — the table: everything the eye sees, drawn on one canvas.
// Cards, hands, health, mana, the log and the end screens, all here.

import { VIEW_W, VIEW_H, ELEMENTS, CARD_BY_ID, TABLE, LAYOUT } from './config.js';

/** Where a hand card sits, by index, before any hover lift. */
export function handCardRect(index, count, y) {
  const total = count * LAYOUT.cardW + (count - 1) * LAYOUT.cardGap;
  const x0 = (VIEW_W - total) / 2;
  return {
    x: x0 + index * (LAYOUT.cardW + LAYOUT.cardGap),
    y,
    w: LAYOUT.cardW,
    h: LAYOUT.cardH,
  };
}

/** The End Turn button's rectangle. */
export function endTurnRect() {
  return { ...LAYOUT.endTurn };
}

/** A point inside a rectangle. */
export function hitRect(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

/** A soft rounded rectangle path, for panels and cards. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The felt table and its wooden rail. */
function drawTable(ctx) {
  ctx.fillStyle = TABLE.feltEdge;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const grad = ctx.createRadialGradient(640, 340, 60, 640, 360, 760);
  grad.addColorStop(0, '#2a4028');
  grad.addColorStop(1, TABLE.felt);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.strokeStyle = TABLE.rail;
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, VIEW_W - 10, VIEW_H - 10);
  ctx.strokeStyle = TABLE.railLight;
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, VIEW_W - 28, VIEW_H - 28);
  // A faint ember glow in the middle of the table.
  const glow = ctx.createRadialGradient(640, 360, 10, 640, 360, 220);
  glow.addColorStop(0, 'rgba(232, 73, 29, 0.16)');
  glow.addColorStop(1, 'rgba(232, 73, 29, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(420, 140, 440, 440);
}

/** One element's shape, drawn in its colour: flame, diamond, leaf, square. */
export function drawElementShape(ctx, element, cx, cy, size, color) {
  const el = ELEMENTS[element];
  ctx.fillStyle = color || el.color;
  ctx.beginPath();
  if (el.shape === 'flame') {
    ctx.moveTo(cx, cy - size);
    ctx.quadraticCurveTo(cx + size * 0.9, cy - size * 0.1, cx + size * 0.55, cy + size * 0.5);
    ctx.quadraticCurveTo(cx + size * 0.3, cy + size * 0.9, cx, cy + size * 0.8);
    ctx.quadraticCurveTo(cx - size * 0.3, cy + size * 0.9, cx - size * 0.55, cy + size * 0.5);
    ctx.quadraticCurveTo(cx - size * 0.9, cy - size * 0.1, cx, cy - size);
  } else if (el.shape === 'diamond') {
    ctx.moveTo(cx, cy - size);
    ctx.lineTo(cx + size * 0.7, cy);
    ctx.lineTo(cx, cy + size);
    ctx.lineTo(cx - size * 0.7, cy);
  } else if (el.shape === 'leaf') {
    ctx.ellipse(cx, cy, size * 0.75, size, -0.6, 0, Math.PI * 2);
  } else {
    ctx.rect(cx - size * 0.7, cy - size * 0.7, size * 1.4, size * 1.4);
  }
  ctx.fill();
}

/** The big number a card leads with: its damage, block or healing. */
function cardBigNumber(card) {
  if (card.damage > 0) return { n: card.hits > 1 ? `${card.damage}x${card.hits}` : `${card.damage}`, label: 'DMG' };
  if (card.block > 0) return { n: `${card.block}`, label: 'BLOCK' };
  if (card.heal > 0) return { n: `${card.heal}`, label: 'HEAL' };
  return { n: '0', label: '' };
}

/**
 * One card, face up. A card a hand cannot afford is dimmed; the selected
 * card is lifted and ringed in gold.
 */
export function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const afford = opts.afford !== false;
  ctx.save();
  if (!afford) ctx.globalAlpha = 0.55;
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#f7f1de';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 2;
  ctx.strokeStyle = opts.selected ? TABLE.gold : '#3a2f1d';
  ctx.stroke();
  // Element band with its shape.
  ctx.fillStyle = el.color;
  roundRect(ctx, x + 6, y + 6, w - 12, 34, 6);
  ctx.fill();
  drawElementShape(ctx, card.element, x + 24, y + 23, 11, '#ffffff');
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name.toUpperCase(), x + 42, y + 24);
  // Cost, in a gold coin at the top right.
  ctx.beginPath();
  ctx.arc(x + w - 22, y + 23, 15, 0, Math.PI * 2);
  ctx.fillStyle = TABLE.gold;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#7a5a12';
  ctx.stroke();
  ctx.fillStyle = '#241a05';
  ctx.font = 'bold 18px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(card.cost), x + w - 22, y + 24);
  // Name.
  ctx.fillStyle = '#241a05';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.fillText(card.name, x + w / 2, y + 62, w - 16);
  // Big number.
  const big = cardBigNumber(card);
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillStyle = el.dark;
  ctx.fillText(big.n, x + w / 2, y + 102);
  ctx.font = 'bold 10px Georgia, serif';
  ctx.fillStyle = '#6b5a35';
  ctx.fillText(big.label, x + w / 2, y + 124);
  // Rules text, wrapped to two lines.
  ctx.font = '12px Georgia, serif';
  ctx.fillStyle = '#3a2f1d';
  const words = card.text.split(' ');
  let line = '';
  let ly = y + 142;
  for (const word of words) {
    if (ctx.measureText(`${line} ${word}`.trim()).width > w - 20 && line !== '') {
      ctx.fillText(line, x + w / 2, ly);
      ly += 14;
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  }
  if (line !== '') ctx.fillText(line, x + w / 2, ly);
  ctx.restore();
}

/** One card, face down: the opponent's hidden hand. */
function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#3a2f4d';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8a7ab8';
  ctx.stroke();
  drawElementShape(ctx, 'flame', x + w / 2, y + h / 2, 22, '#e8491d');
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 6);
  ctx.stroke();
}

/** A duelist's name, health bar, block and mana pips. */
function drawFighter(ctx, state, side, x, y, align) {
  const who = state[side];
  const name = side === 'player' ? state.playerName : state.enemyName;
  const isTurn = state.turn === side && state.phase === 'play';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 22px Georgia, serif';
  ctx.fillStyle = isTurn ? TABLE.gold : TABLE.ink;
  ctx.fillText(name, x, y);
  if (isTurn) {
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = TABLE.gold;
    ctx.fillText('◀ TO PLAY', x + (align === 'left' ? 92 : -92), y);
  }
  // Health bar.
  const bw = 220;
  const bx = align === 'left' ? x : x - bw;
  ctx.fillStyle = '#1a0d0d';
  roundRect(ctx, bx, y + 10, bw, 20, 6);
  ctx.fill();
  const frac = Math.max(0, who.hp / who.maxHp);
  ctx.fillStyle = frac > 0.5 ? '#58b368' : frac > 0.25 ? '#e8b64c' : TABLE.red;
  if (frac > 0) {
    roundRect(ctx, bx + 2, y + 12, (bw - 4) * frac, 16, 4);
    ctx.fill();
  }
  ctx.fillStyle = TABLE.ink;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`${who.hp} / ${who.maxHp}`, bx + bw / 2, y + 25);
  // Block shield.
  if (who.block > 0) {
    ctx.fillStyle = '#7fb3d5';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(`🛡 ${who.block}`, align === 'left' ? bx + bw + 10 : bx - 10, y + 25);
  }
  // Mana pips.
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = '#6fb7ff';
  let pips = '';
  for (let i = 0; i < who.maxMana; i++) pips += i < who.mana ? '●' : '○';
  ctx.fillText(`Mana ${pips}`, x, y + 52);
  // Deck and discard counts.
  ctx.font = '13px Georgia, serif';
  ctx.fillStyle = TABLE.dim;
  ctx.fillText(`Deck ${who.deck.length} · Discard ${who.discard.length}`, x, y + 72);
}

/** The duel log, newest last, five lines at most. */
function drawLog(ctx, state) {
  const box = LAYOUT.log;
  ctx.fillStyle = 'rgba(10, 18, 10, 0.8)';
  roundRect(ctx, box.x, box.y, box.w, box.h, 8);
  ctx.fill();
  ctx.strokeStyle = TABLE.panelEdge;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = '13px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const lines = state.log.slice(-6);
  lines.forEach((line, i) => {
    ctx.fillStyle = i === lines.length - 1 ? TABLE.ink : TABLE.dim;
    ctx.fillText(line.slice(0, 46), box.x + 10, box.y + 22 + i * 20);
  });
}

/** The End Turn button. */
function drawEndTurn(ctx, state) {
  const r = LAYOUT.endTurn;
  const enabled = state.phase === 'play' && state.turn === 'player';
  ctx.fillStyle = enabled ? '#8a5a12' : '#3a332a';
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.strokeStyle = TABLE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = enabled ? '#ffe9b0' : '#8a7a5a';
  ctx.font = 'bold 16px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('End Turn', r.x + r.w / 2, r.y + r.h / 2 + 1);
  ctx.font = '12px Georgia, serif';
  ctx.fillText('(E)', r.x + r.w / 2, r.y + r.h - 12);
}

/** Floating numbers: damage dealt, block gained, healing done. */
function drawFloaters(ctx, ui, now) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ui.floaters = ui.floaters.filter((f) => now - f.born < f.life);
  for (const f of ui.floaters) {
    const age = (now - f.born) / f.life;
    ctx.globalAlpha = 1 - age;
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y - age * 46);
  }
  ctx.globalAlpha = 1;
}

/** The duel table: both fighters, both hands, the log and the button. */
function drawPlay(ctx, state, ui, now) {
  drawTable(ctx);
  drawFighter(ctx, state, 'enemy', 24, 52, 'left');
  // Asha's panel sits top-right: the bottom of the table belongs to her
  // hand, so her health and mana were clipped off the canvas there.
  drawFighter(ctx, state, 'player', 1256, 52, 'right');
  // Cinder's hand, face down.
  const enemy = state.enemy.hand;
  enemy.forEach((_, i) => {
    const r = handCardRect(i, enemy.length, LAYOUT.enemyHandY);
    drawCardBack(ctx, r.x, r.y, 84, 108);
  });
  // Asha's hand, face up, hovered and selected cards lifted.
  const hand = state.player.hand;
  hand.forEach((id, i) => {
    const card = CARD_BY_ID[id];
    const r = handCardRect(i, hand.length, LAYOUT.playerHandY);
    const lift = ui.hover === i || ui.selected === i ? -20 : 0;
    drawCard(ctx, card, r.x, r.y + lift, r.w, r.h, {
      afford: state.player.mana >= card.cost,
      selected: ui.selected === i,
    });
  });
  // The card just played, flying to the middle of the table.
  if (ui.played && now - ui.played.born < 500) {
    const age = (now - ui.played.born) / 500;
    const x = ui.played.fromX + (640 - ui.played.fromX) * age;
    const y = ui.played.fromY + (330 - ui.played.fromY) * age;
    ctx.globalAlpha = 1 - age * 0.6;
    drawCard(ctx, ui.played.card, x - 66, y - 84, 132, 168, {});
    ctx.globalAlpha = 1;
  }
  drawLog(ctx, state);
  drawEndTurn(ctx, state);
  // Turn banner, only while the duel is live: on an end screen the big
  // title sits here, and the two lines would print over each other.
  if (state.phase === 'play') {
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = TABLE.dim;
    ctx.textAlign = 'center';
    ctx.fillText(`Turn ${state.turnCount}  ·  Score ${state.score}`, 640, 300);
  }
  drawFloaters(ctx, ui, now);
}

/** The title screen: the game's name, the duelists, and how to begin. */
function drawTitle(ctx, state, ui, now) {
  drawTable(ctx);
  const bob = Math.sin(now / 500) * 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 84px Georgia, serif';
  ctx.fillText('EMBER PACT', 640, 218 + bob * 0.3);
  drawElementShape(ctx, 'flame', 640, 268 + bob, 30, '#e8491d');
  ctx.fillStyle = TABLE.ink;
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText('Asha, the Ember Scribe, duels Cinder, the Ash Scribe,', 640, 330);
  ctx.fillText('for the last ember.', 640, 362);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = TABLE.dim;
  ctx.fillText('30 health each · mana that grows every turn · 30 cards, 8 kinds, 4 elements', 640, 420);
  // The four elements, each with its colour and shape.
  const names = Object.keys(ELEMENTS);
  names.forEach((key, i) => {
    const el = ELEMENTS[key];
    const x = 640 + (i - 1.5) * 150;
    drawElementShape(ctx, key, x, 470, 16, el.color);
    ctx.fillStyle = TABLE.ink;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(el.name, x, 502);
  });
  ctx.fillStyle = TABLE.gold;
  ctx.font = 'bold 22px Georgia, serif';
  const pulse = 0.65 + Math.sin(now / 300) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillText('Press Enter or click to begin', 640, 580);
  ctx.globalAlpha = 1;
  ctx.font = '15px Georgia, serif';
  ctx.fillStyle = TABLE.dim;
  ctx.fillText('Click a card or press 1–7 to play it · E ends the turn · M mutes · R duels again', 640, 616);
}

/** A win or a loss, full screen, with the score and a way back. */
function drawEnd(ctx, state, ui, now) {
  drawPlay(ctx, state, ui, now);
  ctx.fillStyle = 'rgba(8, 10, 8, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const won = state.phase === 'win';
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? TABLE.gold : TABLE.red;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText(won ? 'The ember is yours' : 'The ember gutters out', 640, 300);
  drawElementShape(ctx, 'flame', 640, 350, won ? 26 : 18, won ? '#e8491d' : '#5a5a5a');
  ctx.fillStyle = TABLE.ink;
  ctx.font = '22px Georgia, serif';
  ctx.fillText(
    won
      ? `Cinder falls on turn ${state.turnCount}. Asha keeps ${state.player.hp} health.`
      : `Asha falls on turn ${state.turnCount}. Cinder keeps ${state.enemy.hp} health.`,
    640, 420,
  );
  ctx.font = 'bold 30px Georgia, serif';
  ctx.fillStyle = TABLE.gold;
  ctx.fillText(`Score ${state.score}`, 640, 478);
  ctx.font = '18px Georgia, serif';
  ctx.fillStyle = TABLE.dim;
  const pulse = 0.65 + Math.sin(now / 300) * 0.35;
  ctx.globalAlpha = pulse;
  ctx.fillText('Press R to duel again', 640, 540);
  ctx.globalAlpha = 1;
}

/** The whole scene, by phase. */
export function drawScene(ctx, state, ui, now) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.phase === 'title') drawTitle(ctx, state, ui, now);
  else if (state.phase === 'win' || state.phase === 'loss') drawEnd(ctx, state, ui, now);
  else drawPlay(ctx, state, ui, now);
}
