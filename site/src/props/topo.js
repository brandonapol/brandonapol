import * as THREE from 'three';
import { mat, mesh, box, at } from '../util.js';

const W = 1200;
const H = 750;
const MINOR = 50; // meters between contour lines
const INDEX = 250; // every fifth line is bolder

const PINS = 6;

// Elevation is terrarium-encoded: meters = R*256 + G + B/256 - 32768.
async function loadHeights(url) {
  const blob = await (await fetch(url)).blob();
  const bitmap = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
  const c = new OffscreenCanvas(bitmap.width, bitmap.height);
  const g = c.getContext('2d');
  g.drawImage(bitmap, 0, 0);
  const { data } = g.getImageData(0, 0, bitmap.width, bitmap.height);
  const heights = new Float32Array(bitmap.width * bitmap.height);
  for (let i = 0; i < heights.length; i++) heights[i] = data[i * 4] * 256 + data[i * 4 + 1] + data[i * 4 + 2] / 256 - 32768;
  return { heights, w: bitmap.width, h: bitmap.height };
}

function sampler({ heights, w, h }) {
  return (u, v) => {
    const x = Math.min(w - 1.001, Math.max(0, u * (w - 1)));
    const y = Math.min(h - 1.001, Math.max(0, v * (h - 1)));
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;
    const i = y0 * w + x0;
    const a = heights[i] * (1 - fx) + heights[i + 1] * fx;
    const b = heights[i + w] * (1 - fx) + heights[i + w + 1] * fx;
    return a * (1 - fy) + b * fy;
  };
}

// The career route climbs from the water to the high country.
function route(elev, max) {
  const pins = [];
  for (let i = 0; i < PINS; i++) {
    const target = 20 + (i / (PINS - 1)) * max * 0.92;
    const u0 = 0.1 + i * 0.145;
    let best = null;
    for (let u = u0; u < u0 + 0.12; u += 0.004) {
      for (let v = 0.2; v < 0.8; v += 0.004) {
        const e = elev(u, v);
        const prev = pins[i - 1];
        const drift = prev ? Math.abs(v - prev.v) * 400 : Math.abs(v - 0.5) * 200;
        const score = Math.abs(e - target) + drift;
        if (!best || score < best.score) best = { u, v, score };
      }
    }
    pins.push(best);
  }
  return pins;
}

function draw(g, elev) {
  const img = g.createImageData(W, H);
  const field = new Float32Array(W * H);
  let max = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const e = elev(x / (W - 1), y / (H - 1));
      field[y * W + x] = e;
      if (e > max) max = e;
    }
  }
  const light = new THREE.Vector3(-1, -1, 1.6).normalize();
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      const e = field[i];
      const ex = field[y * W + Math.min(W - 1, x + 1)] - field[y * W + Math.max(0, x - 1)];
      const ey = field[Math.min(H - 1, y + 1) * W + x] - field[Math.max(0, y - 1) * W + x];
      // Hillshade, with exaggerated relief (pixels are ~60 m apart).
      const nx = -ex / 60;
      const ny = -ey / 60;
      const shade = Math.max(0, (nx * light.x + ny * light.y + light.z) / Math.hypot(nx, ny, 1));

      let r, gg, b;
      if (e < 3) {
        [r, gg, b] = [170, 198, 214]; // Knik Arm
      } else {
        const t = Math.min(1, e / 2300);
        // Paper, through green lowland and tan slopes, to snow.
        const stops = [
          [0, [214, 222, 186]],
          [0.25, [230, 224, 196]],
          [0.6, [222, 204, 170]],
          [0.78, [236, 232, 226]],
          [1, [250, 250, 252]],
        ];
        let k = 1;
        while (k < stops.length - 1 && stops[k][0] < t) k++;
        const [t0, c0] = stops[k - 1];
        const [t1, c1] = stops[k];
        const f = (t - t0) / (t1 - t0);
        [r, gg, b] = c0.map((c, j) => c + (c1[j] - c) * f);
        const s = 0.72 + shade * 0.38;
        r *= s;
        gg *= s;
        b *= s;
        // Contours: a line wherever this pixel and a neighbor fall in different bands.
        const band = Math.floor(e / MINOR);
        const right = Math.floor(field[y * W + Math.min(W - 1, x + 1)] / MINOR);
        const down = Math.floor(field[Math.min(H - 1, y + 1) * W + x] / MINOR);
        if (band !== right || band !== down) {
          const isIndex = Math.max(band, right, down) % (INDEX / MINOR) === 0;
          const a = isIndex ? 0.7 : 0.35;
          r = r * (1 - a) + 120 * a;
          gg = gg * (1 - a) + 74 * a;
          b = b * (1 - a) + 38 * a;
        }
      }
      img.data[i * 4] = r;
      img.data[i * 4 + 1] = gg;
      img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);

  // Route and numbered pins.
  const pins = route(elev, max);
  g.strokeStyle = '#c0392b';
  g.lineWidth = 5;
  g.setLineDash([14, 10]);
  g.beginPath();
  pins.forEach((p, i) => (i ? g.lineTo(p.u * W, p.v * H) : g.moveTo(p.u * W, p.v * H)));
  g.stroke();
  g.setLineDash([]);
  pins.forEach((p, i) => {
    g.fillStyle = '#c0392b';
    g.beginPath();
    g.arc(p.u * W, p.v * H, 20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.font = 'bold 24px ui-monospace, Menlo, monospace';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(String(i + 1), p.u * W, p.v * H + 1);
  });

  // Cartouche.
  g.fillStyle = 'rgba(245,240,226,0.92)';
  g.fillRect(W - 470, H - 110, 440, 80);
  g.strokeStyle = '#784a26';
  g.lineWidth = 2;
  g.strokeRect(W - 470, H - 110, 440, 80);
  g.fillStyle = '#3d2a18';
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.font = 'bold 30px Georgia, serif';
  g.fillText('CHUGACH MOUNTAINS', W - 450, H - 70);
  g.font = '18px Georgia, serif';
  g.fillText(`Alaska · contours ${MINOR} m · the route so far`, W - 450, H - 44);
}

export function buildTopoMap() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#e9e2cc';
  g.fillRect(0, 0, W, H);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;

  const group = new THREE.Group();
  const width = 0.8;
  const height = width * (H / W);
  group.add(at(box(width + 0.05, height + 0.05, 0.025, 0x3a2716, { roughness: 0.5 }), 0, 0, 0.0125));
  group.add(at(mesh(new THREE.PlaneGeometry(width, height), mat(0xffffff, { map: texture, roughness: 0.85 })), 0, 0, 0.026));

  const ready = loadHeights(`${import.meta.env.BASE_URL}topo/chugach.png`)
    .then((data) => {
      draw(g, sampler(data));
      texture.needsUpdate = true;
    })
    .catch((err) => console.warn('topo map:', err));

  return { group, ready };
}
