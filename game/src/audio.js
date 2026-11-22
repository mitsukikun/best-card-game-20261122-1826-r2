// Ember Pact sound: procedural WebAudio only — no audio files, no network.
// Short oscillator blips: a card snap, a hit thud, a heal chime, a denied
// buzz, and win / loss jingles. M mutes; the context starts on the first
// user gesture, as browsers require.

export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = null) {
    const ac = ensure();
    if (!ac || muted) return;
    const t0 = ac.currentTime + when;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  return {
    resume() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    play(name) {
      if (muted) return;
      if (name === "card") tone(620, 0.09, "triangle", 0.25, 0, 880);
      else if (name === "hit") tone(140, 0.16, "sawtooth", 0.3, 0, 70);
      else if (name === "heal") {
        tone(520, 0.12, "sine", 0.2);
        tone(780, 0.16, "sine", 0.2, 0.09);
      } else if (name === "deny") tone(110, 0.12, "square", 0.15);
      else if (name === "end") tone(330, 0.1, "triangle", 0.2, 0, 220);
      else if (name === "start") {
        tone(392, 0.12, "triangle", 0.22);
        tone(523, 0.12, "triangle", 0.22, 0.1);
        tone(659, 0.18, "triangle", 0.22, 0.2);
      } else if (name === "win") {
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, "triangle", 0.22, i * 0.12));
      } else if (name === "loss") {
        [392, 330, 262, 196].forEach((f, i) => tone(f, 0.22, "sine", 0.2, i * 0.14));
      }
    },
  };
}
