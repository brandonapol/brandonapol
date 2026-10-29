import * as THREE from 'three';
import { mat, mesh, box, cyl, rod, at, rng } from '../util.js';
import { wallFrame } from './room.js';
import * as tex from '../textures.js';

const WOOD = 0x2a1d16;

function shelfUnit(width, height, depth, shelfYs) {
  const g = new THREE.Group();
  const m = mat(WOOD, { roughness: 0.7 });
  const t = 0.02;
  g.add(at(box(t, height, depth, m, {}, { shadow: true }), -width / 2 + t / 2, height / 2, depth / 2));
  g.add(at(box(t, height, depth, m, {}, { shadow: true }), width / 2 - t / 2, height / 2, depth / 2));
  g.add(at(box(width, height, 0.01, m), 0, height / 2, 0.005));
  for (const y of [...shelfYs, height - t / 2]) g.add(at(box(width - 2 * t, t, depth, m), 0, y, depth / 2));
  return g;
}

// Books as one instanced mesh per shelf unit.
function books(slots, seed) {
  const r = rng(seed);
  const items = [];
  for (const { x0, x1, y, depth, max = 0.3 } of slots) {
    let x = x0;
    while (x < x1 - 0.02) {
      const t = 0.018 + r() * 0.035;
      if (x + t > x1) break;
      const h = Math.min(max, 0.17 + r() * 0.12);
      const lean = r() < 0.06 ? 0.15 : 0;
      items.push({ x: x + t / 2, y: y + h / 2, z: depth / 2 + 0.01, w: t, h, d: Math.min(depth - 0.04, 0.15 + r() * 0.08), lean });
      x += t + (r() < 0.08 ? 0.04 : 0.002);
    }
  }
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat(0xffffff, { roughness: 0.8 }), items.length);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const color = new THREE.Color();
  const palette = [0x7a1f1f, 0x1f3a5f, 0x2f4f2f, 0xd9c9a3, 0x5a3a22, 0x8a6d1f, 0x222222, 0xb5482e, 0x40507a, 0xe8e2d0];
  items.forEach((b, i) => {
    q.setFromEuler(new THREE.Euler(0, 0, b.lean));
    m4.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.w, b.h, b.d));
    im.setMatrixAt(i, m4);
    im.setColorAt(i, color.setHex(palette[Math.floor(r() * palette.length)]));
  });
  im.receiveShadow = true;
  return im;
}

function turntable() {
  const g = new THREE.Group();
  g.add(at(box(0.42, 0.08, 0.32, 0x6b4a2e, { roughness: 0.5 }), 0, 0.04, 0));
  g.add(at(box(0.42, 0.006, 0.32, 0x1a1a1e, { roughness: 0.3 }), 0, 0.083, 0));
  const platter = new THREE.Group();
  platter.position.set(-0.04, 0.09, 0);
  platter.add(cyl(0.145, 0.145, 0.012, 0x8d9095, { metalness: 0.8, roughness: 0.3 }, 40));
  platter.add(at(cyl(0.14, 0.14, 0.004, 0x0b0b0d, { roughness: 0.25 }, 40), 0, 0.008, 0));
  const label = cyl(0.045, 0.045, 0.005, 0xa78bfa, { roughness: 0.6 }, 24);
  platter.add(at(label, 0, 0.009, 0));
  platter.add(at(box(0.02, 0.006, 0.006, 0xffffff), 0.025, 0.012, 0)); // so you can see it spin
  g.add(platter);
  // Tonearm on a pivot.
  const pivot = new THREE.Group();
  pivot.position.set(0.15, 0.09, -0.1);
  pivot.add(cyl(0.018, 0.018, 0.03, 0xb9bcc2, { metalness: 0.8 }, 12));
  const arm = rod([0, 0.025, 0], [-0.04, 0.025, 0.2], 0.004, 0xd6d8dc, { metalness: 0.8 });
  pivot.add(arm);
  pivot.add(at(box(0.015, 0.012, 0.03, 0x111111), -0.04, 0.02, 0.2));
  pivot.rotation.y = 0.35;
  g.add(pivot);
  return { group: g, platter, pivot };
}

export function buildShelves(scene) {
  const out = {};

  // Tall bookshelf on the south wall. Wall-local x is -world x.
  const south = wallFrame('south');
  scene.add(south);
  const tall = shelfUnit(0.8, 1.85, 0.3, [0.03, 0.42, 0.79, 1.16, 1.5]);
  tall.position.x = 0.85;
  south.add(tall);
  out.books = [];
  tall.add(
    books(
      [
        { x0: 0.07, x1: 0.38, y: 0.8, depth: 0.3 },
        { x0: -0.38, x1: 0.38, y: 1.17, depth: 0.3 },
        { x0: -0.38, x1: 0.2, y: 1.51, depth: 0.3 },
      ],
      41,
    ),
  );
  out.books.push(tall.children.at(-1));
  // A modest number of books: the rest of the shelf is music.
  const sleeves = box(0.62, 0.32, 0.28, mat(0xffffff, { map: tex.recordSleeves(), roughness: 0.8 }));
  tall.add(at(sleeves, -0.05, 0.04 + 0.16, 0.15));
  const tt = turntable();
  tt.group.position.set(-0.15, 0.8, 0.16);
  tall.add(tt.group);
  out.records = { objects: [sleeves, tt.group], platter: tt.platter, arm: tt.pivot };

  // Starry Night print leaning on top.
  const starry = mesh(new THREE.PlaneGeometry(0.5, 0.39), mat(0xffffff, { map: tex.starryNight(), roughness: 0.8 }));
  const starryFrame = box(0.54, 0.43, 0.02, 0x15120f);
  const lean = new THREE.Group();
  lean.add(starryFrame, at(starry, 0, 0, 0.011));
  lean.position.set(0.85, 1.85 + 0.2, 0.08);
  lean.rotation.x = -0.12;
  south.add(lean);

  // Small bookshelf on the west wall, with the lava lamp and globe on top.
  const west = wallFrame('west');
  scene.add(west);
  const small = shelfUnit(0.6, 1.1, 0.28, [0.03, 0.38, 0.73]);
  small.position.x = -0.55;
  west.add(small);
  small.add(
    books(
      [
        { x0: -0.27, x1: 0.27, y: 0.04, depth: 0.28, max: 0.32 },
        { x0: -0.27, x1: 0.1, y: 0.39, depth: 0.28 },
        { x0: -0.1, x1: 0.27, y: 0.74, depth: 0.28 },
      ],
      43,
    ),
  );
  out.books.push(small.children.at(-1));
  const globe = new THREE.Group();
  globe.add(cyl(0.05, 0.06, 0.02, 0x3a2a1a));
  globe.add(rod([0, 0.01, 0], [0, 0.12, 0], 0.006, 0x8a6d3a, { metalness: 0.6 }));
  globe.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.1, 24, 16), mat(0x6f8fa8, { roughness: 0.5 })), 0, 0.2, 0));
  globe.position.set(0.18, 0.4, 0.14);
  small.add(globe);
  // Hats, because the real shelf has them.
  const hat = new THREE.Group();
  hat.add(cyl(0.16, 0.16, 0.01, 0x8a3b3b, {}, 24));
  hat.add(at(cyl(0.08, 0.095, 0.1, 0x8a3b3b, {}, 24), 0, 0.05, 0));
  hat.position.set(-0.05, 1.111, 0.14);
  hat.rotation.z = 0.05;
  small.add(hat);

  out.lavaAnchor = { frame: west, u: -0.55 + 0.2, y: 1.11, z: 0.14 };
  return out;
}
