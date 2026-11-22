// Ember Pact — tuning numbers and palette. One file, one job: every number
// the game balances on lives here so a balance pass touches nothing else.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const MAX_HP = 30;
export const START_HAND = 5;
export const MAX_HAND = 7;
export const DRAW_PER_TURN = 2;
export const MAX_MANA = 10;
export const WIN_BONUS = 100;

// A card's element is told by colour AND shape, never by text alone:
// Flame is a red-orange triangle flame, Frost a blue asterisk flake,
// Leaf a green ellipse leaf, Stone a grey diamond.
export const ELEMENTS = {
  flame: { name: "Flame", color: "#e8590c", dark: "#7a2e06", light: "#ffd8a8" },
  frost: { name: "Frost", color: "#1971c2", dark: "#0b3d6e", light: "#a5d8ff" },
  leaf: { name: "Leaf", color: "#2b8a3e", dark: "#134d1f", light: "#b2f2bb" },
  stone: { name: "Stone", color: "#868e96", dark: "#495057", light: "#dee2e6" },
};

// id, name, element, cost, text, and the effect the rules apply.
// damage: hits the foe (block absorbs first). block: shields you until
// your next turn. heal: restores your HP. draw: draws that many cards.
// hits: how many separate hits the damage comes in (Thorn Lash: 2 x 2).
export const CARDS = {
  ember_strike: { id: "ember_strike", name: "Ember Strike", element: "flame", cost: 1, damage: 3, hits: 1, text: "Deal 3 damage." },
  frost_shard: { id: "frost_shard", name: "Frost Shard", element: "frost", cost: 1, damage: 2, hits: 1, block: 2, text: "Deal 2 damage. Gain 2 block." },
  stone_guard: { id: "stone_guard", name: "Stone Guard", element: "stone", cost: 1, block: 6, text: "Gain 6 block." },
  thorn_lash: { id: "thorn_lash", name: "Thorn Lash", element: "leaf", cost: 2, damage: 2, hits: 2, text: "Deal 2 damage, twice." },
  mend: { id: "mend", name: "Mend", element: "leaf", cost: 2, heal: 6, text: "Restore 6 health." },
  wild_spark: { id: "wild_spark", name: "Wild Spark", element: "flame", cost: 2, damage: 3, hits: 1, draw: 1, text: "Deal 3 damage. Draw a card." },
  cinder_blast: { id: "cinder_blast", name: "Cinder Blast", element: "flame", cost: 3, damage: 7, hits: 1, text: "Deal 7 damage." },
  deep_freeze: { id: "deep_freeze", name: "Deep Freeze", element: "frost", cost: 3, damage: 5, hits: 1, block: 4, text: "Deal 5 damage. Gain 4 block." },
};

// The deck every duellist shuffles: 30 cards, 8 kinds.
export const DECK_LIST = [
  ["ember_strike", 5],
  ["frost_shard", 4],
  ["stone_guard", 4],
  ["thorn_lash", 4],
  ["mend", 3],
  ["wild_spark", 4],
  ["cinder_blast", 3],
  ["deep_freeze", 3],
];

export const PALETTE = {
  table: "#1d2b1f",
  tableEdge: "#0e1a10",
  felt: "#24402a",
  feltLine: "#33573a",
  gold: "#f2c14e",
  goldDark: "#8a6d1f",
  ink: "#f8f9fa",
  muted: "#adb5bd",
  panel: "#212529",
  panelEdge: "#495057",
  player: "#e8590c",
  enemy: "#7048e8",
  hp: "#e03131",
  hpBack: "#3a1515",
  block: "#1971c2",
  mana: "#1971c2",
  manaEmpty: "#343a40",
  cardBack: "#862e9c",
  cardFace: "#fff8e7",
  cardInk: "#212529",
  button: "#2b8a3e",
  buttonHover: "#37b24d",
  buttonDisabled: "#495057",
  log: "#ced4da",
};
