// Ember Pact — tuning, palette, card definitions and the deck list.
// Every number the duel runs on lives here, so balance is one edit away.

/** The canvas the game draws on (fixed internal resolution). */
export const VIEW_W = 1280;
export const VIEW_H = 720;

/** Both duelists start here. */
export const START_HP = 30;
/** Cards drawn when a duel opens. */
export const OPENING_HAND = 4;
/** Cards drawn at the start of each of your turns. */
export const DRAW_PER_TURN = 2;
/** The most cards a hand holds; a draw past it is discarded. */
export const MAX_HAND = 7;
/** Mana on turn one; +1 each turn, capped. */
export const START_MANA = 1;
export const MAX_MANA = 10;

/** The four elements, told apart by colour AND by shape. */
export const ELEMENTS = {
  flame: { name: 'Flame', color: '#e8491d', dark: '#8f1f05', light: '#ffb199', shape: 'flame' },
  frost: { name: 'Frost', color: '#2f9be8', dark: '#0d4d80', light: '#bfe4ff', shape: 'diamond' },
  leaf: { name: 'Leaf', color: '#3fae5a', dark: '#145c26', light: '#b9ecc6', shape: 'leaf' },
  stone: { name: 'Stone', color: '#9a8f7a', dark: '#4d4436', light: '#e3dcc9', shape: 'square' },
};

/**
 * One card kind. An effect is a bundle of numbers the duel applies in
 * order: hits of damage, then block, then healing, then a draw.
 *   id, name, element, cost, damage, hits, block, heal, draw, text
 */
export const CARDS = [
  { id: 'ember-bolt', name: 'Ember Bolt', element: 'flame', cost: 2, damage: 4, hits: 1, block: 0, heal: 0, draw: 0, text: 'Deal 4 damage.' },
  { id: 'wild-spark', name: 'Wild Spark', element: 'flame', cost: 3, damage: 3, hits: 1, block: 0, heal: 0, draw: 1, text: 'Deal 3 damage. Draw a card.' },
  { id: 'frost-shard', name: 'Frost Shard', element: 'frost', cost: 1, damage: 2, hits: 1, block: 0, heal: 0, draw: 0, text: 'Deal 2 damage.' },
  { id: 'deep-freeze', name: 'Deep Freeze', element: 'frost', cost: 3, damage: 3, hits: 1, block: 4, heal: 0, draw: 0, text: 'Deal 3 damage. Gain 4 block.' },
  { id: 'thorn-lash', name: 'Thorn Lash', element: 'leaf', cost: 2, damage: 2, hits: 2, block: 0, heal: 0, draw: 0, text: 'Deal 2 damage twice.' },
  { id: 'mend', name: 'Mend', element: 'leaf', cost: 2, damage: 0, hits: 1, block: 0, heal: 5, draw: 0, text: 'Restore 5 health.' },
  { id: 'stone-wall', name: 'Stone Wall', element: 'stone', cost: 1, damage: 0, hits: 1, block: 6, heal: 0, draw: 0, text: 'Gain 6 block.' },
  { id: 'quake', name: 'Quake', element: 'stone', cost: 4, damage: 6, hits: 1, block: 0, heal: 0, draw: 0, text: 'Deal 6 damage.' },
];

/** A card kind by id. */
export const CARD_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

/** The 30-card deck both duelists play, as kind ids. */
export const DECK_LIST = [
  'ember-bolt', 'ember-bolt', 'ember-bolt', 'ember-bolt', 'ember-bolt',
  'wild-spark', 'wild-spark', 'wild-spark',
  'frost-shard', 'frost-shard', 'frost-shard', 'frost-shard',
  'deep-freeze', 'deep-freeze', 'deep-freeze',
  'thorn-lash', 'thorn-lash', 'thorn-lash', 'thorn-lash', 'thorn-lash',
  'mend', 'mend', 'mend',
  'stone-wall', 'stone-wall', 'stone-wall', 'stone-wall',
  'quake', 'quake', 'quake',
];

/** The table's colours. */
export const TABLE = {
  felt: '#20301f',
  feltEdge: '#141f14',
  rail: '#6b4a1f',
  railLight: '#8a6132',
  panel: '#101a10',
  panelEdge: '#2c442c',
  ink: '#f2ead8',
  dim: '#b9ac8f',
  gold: '#e8b64c',
  red: '#e8491d',
};

/** Where the two hands sit, in view coordinates. */
export const LAYOUT = {
  enemyHandY: 96,
  playerHandY: 548,
  cardW: 132,
  cardH: 168,
  cardGap: 12,
  endTurn: { x: 1130, y: 330, w: 120, h: 52 },
  log: { x: 24, y: 330, w: 300, h: 150 },
};
