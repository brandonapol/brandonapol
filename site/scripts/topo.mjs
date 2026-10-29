// Builds public/topo/chugach.png: an elevation grid of the Chugach Mountains
// east of Anchorage, from the public AWS Terrain Tiles (Mapzen terrarium
// encoding, derived from USGS 3DEP/SRTM and others).
//
// Output keeps terrarium encoding (meters = R*256 + G + B/256 - 32768) so the
// browser can draw contours and shading at runtime from a small file.
//
//   node scripts/topo.mjs
import { PNG } from 'pngjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const Z = 10;
// Chugach State Park: Knik Arm on the west edge, Eagle River valley, the front range.
const BOUNDS = { west: -149.95, east: -148.55, north: 61.5, south: 61.08 };
const OUT_W = 800;

const lon2x = (lon) => ((lon + 180) / 360) * 2 ** Z;
const lat2y = (lat) => {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** Z;
};

const x0 = lon2x(BOUNDS.west);
const x1 = lon2x(BOUNDS.east);
const y0 = lat2y(BOUNDS.north);
const y1 = lat2y(BOUNDS.south);
const OUT_H = Math.round((OUT_W * (y1 - y0)) / (x1 - x0));

const tiles = new Map();
async function tile(tx, ty) {
  const key = `${tx}/${ty}`;
  if (!tiles.has(key)) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${tx}/${ty}.png`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    tiles.set(key, PNG.sync.read(Buffer.from(await res.arrayBuffer())));
  }
  return tiles.get(key);
}

for (let ty = Math.floor(y0); ty <= Math.floor(y1); ty++) {
  for (let tx = Math.floor(x0); tx <= Math.floor(x1); tx++) await tile(tx, ty);
}

function elevationAt(gx, gy) {
  const tx = Math.floor(gx);
  const ty = Math.floor(gy);
  const t = tiles.get(`${tx}/${ty}`);
  const px = Math.min(255, Math.floor((gx - tx) * 256));
  const py = Math.min(255, Math.floor((gy - ty) * 256));
  const i = (py * 256 + px) * 4;
  return t.data[i] * 256 + t.data[i + 1] + t.data[i + 2] / 256 - 32768;
}

const out = new PNG({ width: OUT_W, height: OUT_H, colorType: 2 });
let min = Infinity;
let max = -Infinity;
for (let y = 0; y < OUT_H; y++) {
  for (let x = 0; x < OUT_W; x++) {
    const gx = x0 + ((x + 0.5) / OUT_W) * (x1 - x0);
    const gy = y0 + ((y + 0.5) / OUT_H) * (y1 - y0);
    const e = elevationAt(gx, gy);
    min = Math.min(min, e);
    max = Math.max(max, e);
    const v = Math.round(e) + 32768;
    const i = (y * OUT_W + x) * 4;
    out.data[i] = Math.floor(v / 256);
    out.data[i + 1] = Math.floor(v) % 256;
    out.data[i + 2] = 0; // whole meters compress far better than the fractional byte
    out.data[i + 3] = 255;
  }
}

mkdirSync('public/topo', { recursive: true });
const buf = PNG.sync.write(out, { colorType: 2 });
writeFileSync('public/topo/chugach.png', buf);
console.log(`chugach.png ${OUT_W}x${OUT_H}, ${(buf.length / 1024).toFixed(0)} KB, elevation ${min.toFixed(0)}–${max.toFixed(0)} m`);
