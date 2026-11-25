// Tiny synthesised sound effects: no audio files, everything is an oscillator
// or a short burst of filtered noise through the Web Audio API. The context is
// created on the first user gesture, so browsers never autoplay anything.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      return null;
    }
    return context;
  }

  function tone(freq, duration, type = 'sine', volume = 0.12, when = 0) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const start = ctx.currentTime + when;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration + 0.05);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  function noise(duration, volume = 0.08) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    try {
      const length = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = volume;
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  const sounds = {
    click() { tone(660, 0.06, 'triangle', 0.08); },
    add() { tone(520, 0.07, 'triangle', 0.1); tone(780, 0.08, 'triangle', 0.08, 0.05); },
    sizzle() { noise(0.35, 0.1); tone(180, 0.2, 'sawtooth', 0.03); },
    pop() { tone(880, 0.09, 'square', 0.08); },
    ding() { tone(1046, 0.12, 'sine', 0.12); tone(1318, 0.18, 'sine', 0.1, 0.08); },
    serve() { tone(523, 0.1, 'triangle', 0.12); tone(659, 0.1, 'triangle', 0.12, 0.09); tone(784, 0.16, 'triangle', 0.12, 0.18); },
    buzz() { tone(140, 0.22, 'sawtooth', 0.1); },
    expire() { tone(330, 0.15, 'square', 0.08); tone(220, 0.25, 'square', 0.08, 0.12); },
    over() { tone(392, 0.16, 'triangle', 0.12); tone(330, 0.16, 'triangle', 0.12, 0.15); tone(262, 0.3, 'triangle', 0.12, 0.3); },
  };

  function play(name) {
    if (muted) return;
    const fn = sounds[name];
    if (fn) fn();
  }

  return {
    play,
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
  };
}
