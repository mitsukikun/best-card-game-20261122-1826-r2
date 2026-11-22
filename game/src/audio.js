// Ember Pact — the table's voice: procedural WebAudio, no sound files.
// A short blip for a card, a thud for a hit, a shimmer for a heal.

/** The four sounds the duel makes, as tiny oscillator recipes. */
const SOUNDS = {
  play: { freq: 660, slide: 880, dur: 0.12, type: 'triangle', gain: 0.12 },
  hit: { freq: 160, slide: 70, dur: 0.18, type: 'square', gain: 0.16 },
  block: { freq: 420, slide: 320, dur: 0.1, type: 'sine', gain: 0.1 },
  heal: { freq: 520, slide: 780, dur: 0.25, type: 'sine', gain: 0.1 },
  win: { freq: 523, slide: 784, dur: 0.5, type: 'triangle', gain: 0.14 },
  loss: { freq: 330, slide: 110, dur: 0.6, type: 'sawtooth', gain: 0.12 },
};

/**
 * A sound board that starts silent: browsers only let audio begin after
 * the player has pressed something, so the context is built lazily on
 * the first user gesture.
 */
export function makeSoundBoard() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  }

  /** Play one named sound, now. A no-op until the first gesture. */
  function play(name) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const s = SOUNDS[name];
    if (!s) return;
    const osc = ac.createOscillator();
    const amp = ac.createGain();
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.freq, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, s.slide), ac.currentTime + s.dur);
    amp.gain.setValueAtTime(s.gain, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + s.dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + s.dur + 0.02);
  }

  return {
    play,
    unlock() {
      ensure();
    },
    setMuted(m) {
      muted = m;
    },
    get muted() {
      return muted;
    },
  };
}
