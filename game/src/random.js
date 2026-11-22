// Ember Pact — the duel's only source of chance: a seeded RNG.
// No Math.random anywhere in the game: the same seed plays the same duel.

/**
 * mulberry32: a small, fast seeded generator. Returns a function that
 * yields a float in [0, 1) on every call, deterministically for its seed.
 */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number in [0, n): the duel's die roll. */
export function rollInt(rng, n) {
  return Math.floor(rng() * n);
}

/**
 * Fisher-Yates shuffle, in place, driven by the seeded RNG.
 * Returns the same array, so callers can chain it.
 */
export function shuffle(rng, list) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = rollInt(rng, i + 1);
    const tmp = list[i];
    list[i] = list[j];
    list[j] = tmp;
  }
  return list;
}

/** Pick one element of a list, uniformly, from the seeded RNG. */
export function pick(rng, list) {
  return list[rollInt(rng, list.length)];
}
