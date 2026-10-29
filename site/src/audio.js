// Tiny synthesized sounds, so there are no audio assets to ship.

let ctx = null;
let muted = false;
try {
  muted = localStorage.getItem('office-muted') === '1';
} catch {
  // ignore
}

function context() {
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const sound = {
  get muted() {
    return muted;
  },
  set muted(v) {
    muted = v;
    try {
      localStorage.setItem('office-muted', v ? '1' : '0');
    } catch {
      // ignore
    }
  },
};

// One stick hit on a rubber practice pad: a short filtered noise "tock".
function hit(ac, time, accent) {
  const len = 0.08;
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * len), ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 6;
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const band = ac.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1700;
  band.Q.value = 1.4;
  const gain = ac.createGain();
  gain.gain.value = accent ? 0.9 : 0.4;
  noise.connect(band).connect(gain).connect(ac.destination);
  noise.start(time);

  const thump = ac.createOscillator();
  thump.frequency.setValueAtTime(320, time);
  thump.frequency.exponentialRampToValueAtTime(120, time + 0.04);
  const tg = ac.createGain();
  tg.gain.setValueAtTime(accent ? 0.35 : 0.15, time);
  tg.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
  thump.connect(tg).connect(ac.destination);
  thump.start(time);
  thump.stop(time + 0.06);
}

// Paradiddle: R L R R  L R L L, accent on each group's first note.
export function playParadiddle({ bpm = 96, bars = 2 } = {}) {
  if (muted) return false;
  const ac = context();
  const sixteenth = 60 / bpm / 4;
  const start = ac.currentTime + 0.05;
  for (let i = 0; i < 16 * bars; i++) hit(ac, start + i * sixteenth, i % 4 === 0);
  return true;
}
