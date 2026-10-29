import * as THREE from 'three';
import { mat, mesh, box, cyl, rod, at } from '../util.js';
import { wallFrame } from './room.js';

function crate(w, h, d) {
  const g = new THREE.Group();
  const wood = mat(0x9a7a52, { roughness: 0.9 });
  const dark = mat(0x6e5536, { roughness: 0.9 });
  const slats = 3;
  for (let i = 0; i < slats; i++) {
    const sh = h / slats - 0.015;
    g.add(at(box(w, sh, 0.02, i % 2 ? dark : wood), 0, i * (h / slats) + sh / 2, d / 2));
  }
  g.add(at(box(w - 0.04, h, d - 0.04, dark), 0, h / 2, 0));
  return g;
}

function iceAxe(color) {
  const g = new THREE.Group();
  g.add(rod([0, 0, 0], [0.05, 0.55, 0], 0.013, 0x2b2b30, { metalness: 0.4 }));
  g.add(at(box(0.035, 0.12, 0.03, color, { roughness: 0.4 }), 0.006, 0.08, 0)); // grip
  // Curved pick and adze.
  const pick = mesh(new THREE.TorusGeometry(0.16, 0.009, 6, 16, 1.2), mat(0x9ea3aa, { metalness: 0.9, roughness: 0.3 }));
  pick.position.set(0.21, 0.5, 0);
  pick.rotation.z = Math.PI * 0.58;
  g.add(pick);
  g.add(at(box(0.07, 0.025, 0.02, 0x9ea3aa, { metalness: 0.9, roughness: 0.3 }), 0.0, 0.57, 0));
  g.add(at(box(0.03, 0.03, 0.025, color), 0.05, 0.56, 0)); // head accent
  return g;
}

function pack(color, w = 0.32, h = 0.5) {
  const g = new THREE.Group();
  const body = box(w, h, 0.2, color, { roughness: 0.85 });
  body.position.y = h / 2;
  g.add(body);
  g.add(at(box(w * 0.8, h * 0.35, 0.06, color, { roughness: 0.85 }), 0, h * 0.35, 0.12));
  g.add(at(box(w * 0.9, 0.08, 0.2, 0x1a1a1a), 0, h + 0.03, 0));
  return g;
}

function bike(frameColor) {
  const g = new THREE.Group();
  const tire = mat(0x111114, { roughness: 0.9 });
  const rim = mat(0x3a3a40, { metalness: 0.6 });
  const R = 0.34;
  for (const x of [-0.53, 0.55]) {
    const wheel = mesh(new THREE.TorusGeometry(R, 0.035, 8, 32), tire);
    wheel.position.set(x, R + 0.035, 0);
    g.add(wheel);
    const inner = mesh(new THREE.TorusGeometry(R - 0.04, 0.008, 6, 32), rim);
    inner.position.copy(wheel.position);
    g.add(inner);
    g.add(at(cyl(0.025, 0.025, 0.1, 0x2a2a30, {}, 10), x, R + 0.035, 0).rotateX(Math.PI / 2));
  }
  const y = R + 0.035;
  const pts = {
    rear: [-0.53, y, 0],
    front: [0.55, y, 0],
    bb: [-0.05, y - 0.05, 0],
    seat: [-0.2, y + 0.45, 0],
    headTop: [0.36, y + 0.48, 0],
    headBot: [0.4, y + 0.34, 0],
  };
  const tubes = [
    ['bb', 'seat'],
    ['bb', 'headBot'],
    ['seat', 'headTop'],
    ['headTop', 'headBot'],
    ['rear', 'bb'],
    ['rear', 'seat'],
    ['headBot', 'front'],
  ];
  for (const [a, b] of tubes) g.add(rod(pts[a], pts[b], 0.02, frameColor, { metalness: 0.3, roughness: 0.4 }));
  g.add(rod(pts.seat, [-0.24, y + 0.58, 0], 0.012, 0x222222));
  g.add(at(box(0.22, 0.04, 0.08, 0x111111), -0.25, y + 0.6, 0));
  g.add(rod([0.35, y + 0.55, -0.32], [0.35, y + 0.55, 0.32], 0.012, 0x222222));
  g.add(rod(pts.headTop, [0.35, y + 0.55, 0], 0.016, 0x222222));
  const ring = mesh(new THREE.TorusGeometry(0.08, 0.008, 6, 24), mat(0x2a2a2e, { metalness: 0.7 }));
  ring.position.set(...pts.bb);
  ring.position.z = 0.04;
  g.add(ring);
  // Frame bag, bikepacking style.
  const bag = box(0.3, 0.18, 0.06, 0x1d1d22, { roughness: 0.9 });
  bag.position.set(0.12, y + 0.26, 0);
  bag.rotation.z = 0.12;
  g.add(bag);
  return g;
}

function skis() {
  const g = new THREE.Group();
  const top = mat(0xe8eef2, { roughness: 0.5 });
  const base = mat(0x2d5ca8, { roughness: 0.5 });
  for (const dx of [-0.06, 0.06]) {
    const ski = new THREE.Group();
    ski.add(at(box(0.07, 1.75, 0.012, top), 0, 0.875, 0));
    ski.add(at(box(0.07, 0.4, 0.013, base), 0, 1.2, 0.001));
    ski.add(at(box(0.06, 0.05, 0.05, 0x111111), 0, 0.85, 0.03)); // binding
    ski.position.x = dx;
    g.add(ski);
  }
  g.rotation.x = -0.12;
  return g;
}

// The gear corner on the south wall (wall-local x is -world x).
export function buildGear(scene) {
  const south = wallFrame('south');
  scene.add(south);
  const gear = new THREE.Group();
  south.add(gear);

  // Crates stacked two high along the wall.
  for (const [u, y] of [[-0.75, 0], [-1.2, 0], [-0.98, 0.42], [-1.42, 0.42]]) {
    const c = crate(0.42, 0.4, 0.38);
    c.position.set(u, y, 0.2);
    gear.add(c);
  }
  // Boots, packs and a hydration vest on top.
  for (const [u, color] of [[-0.75, 0x2a2a2e], [-0.82, 0x2a2a2e]]) gear.add(at(box(0.08, 0.2, 0.25, color), u, 0.5, 0.25));
  const big = pack(0x2b2f2a, 0.34, 0.55);
  big.position.set(-1.05, 0.84, 0.18);
  gear.add(big);
  const vest = pack(0x3e5a3a, 0.24, 0.36);
  vest.position.set(-1.45, 0.84, 0.2);
  gear.add(vest);

  // Ice axes on the wall, picks facing each other.
  const left = iceAxe(0xd9782b);
  left.position.set(-0.75, 1.35, 0.04);
  left.rotation.z = 0.2;
  gear.add(left);
  const right = iceAxe(0xc9462e);
  right.position.set(-1.35, 1.35, 0.04);
  right.scale.x = -1;
  right.rotation.z = -0.2;
  gear.add(right);

  const b1 = bike(0x23272e);
  b1.position.set(-1.0, 0, 0.55);
  gear.add(b1);
  const b2 = bike(0x8a8f98);
  b2.position.set(-0.85, 0, 0.75);
  b2.rotation.y = Math.PI + 0.06;
  gear.add(b2);

  const s = skis();
  s.position.set(0.28, 0, 0.12);
  south.add(s);

  return { gear, frame: south };
}
