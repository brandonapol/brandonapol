import * as THREE from 'three';
import { mat, mesh, box, cyl, rod, at } from '../util.js';
import { wallFrame } from './room.js';

// A wooden pallet stood up flat against the wall, planks running across.
function pallet(w, h) {
  const g = new THREE.Group();
  const boards = [mat(0xa58560, { roughness: 0.9 }), mat(0x8d6d48, { roughness: 0.9 }), mat(0x9a7a52, { roughness: 0.9 })];
  for (const x of [-w / 2 + 0.05, 0, w / 2 - 0.05]) g.add(at(box(0.08, h, 0.07, 0x6e5536, { roughness: 0.9 }), x, h / 2, 0.035));
  const planks = 7;
  const ph = h / planks - 0.035;
  for (let i = 0; i < planks; i++) {
    const plank = box(w, ph, 0.02, boards[i % 3]);
    plank.position.set((i % 2 ? 0.01 : -0.008), i * (h / planks) + ph / 2 + 0.02, 0.08);
    plank.rotation.z = (i % 3 - 1) * 0.004;
    g.add(plank);
  }
  return g;
}

// A modern technical ice tool, profiled in the wall plane: bent shaft, rubber
// grip with a pinky rest, and a drooping toothed pick with a small hammer.
function iceTool(shaftColor) {
  const g = new THREE.Group();
  const steel = mat(0xa7acb3, { metalness: 0.9, roughness: 0.3 });
  const rubber = mat(0x18181b, { roughness: 0.8 });
  const shaftMat = mat(shaftColor, { metalness: 0.5, roughness: 0.35 });

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.035, 0.07, 0),
    new THREE.Vector3(0.05, 0.16, 0),
    new THREE.Vector3(0.03, 0.3, 0),
    new THREE.Vector3(0.0, 0.44, 0),
    new THREE.Vector3(-0.005, 0.52, 0),
  ]);
  g.add(mesh(new THREE.TubeGeometry(curve, 40, 0.011, 8), shaftMat));
  // Grip and pinky rest.
  const grip = new THREE.CatmullRomCurve3(curve.getPoints(40).slice(0, 12));
  g.add(mesh(new THREE.TubeGeometry(grip, 12, 0.016, 8), rubber));
  const rest = box(0.05, 0.018, 0.026, rubber);
  rest.position.set(0.02, -0.005, 0);
  rest.rotation.z = 0.25;
  g.add(rest);
  g.add(at(box(0.012, 0.03, 0.02, steel), -0.004, -0.02, 0)); // spike

  // Head.
  g.add(at(box(0.035, 0.07, 0.024, steel), -0.005, 0.53, 0));
  // Pick: arched top edge, teeth along the bottom.
  const s = new THREE.Shape();
  s.moveTo(0.012, 0.56);
  s.quadraticCurveTo(0.12, 0.56, 0.21, 0.46);
  s.lineTo(0.2, 0.445);
  const teeth = 9;
  for (let i = 0; i <= teeth; i++) {
    const t = i / teeth;
    const x = 0.2 - t * 0.19;
    const y = 0.445 + Math.sin(t * Math.PI * 0.5) * 0.065 - 0.008 * (1 - t);
    s.lineTo(x, y - (i % 2 ? 0.012 : 0));
  }
  s.lineTo(0.012, 0.52);
  s.closePath();
  const pick = mesh(new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false }), steel);
  pick.position.z = -0.003;
  g.add(pick);
  // Hammer on the back.
  g.add(at(box(0.05, 0.03, 0.022, steel), -0.045, 0.545, 0));
  return g;
}

export function pack(color, w = 0.32, h = 0.5, d = 0.2) {
  const g = new THREE.Group();
  const body = box(w, h, d, color, { roughness: 0.85 });
  body.position.y = h / 2;
  g.add(body);
  g.add(at(box(w * 0.8, h * 0.35, 0.06, color, { roughness: 0.85 }), 0, h * 0.35, d / 2 + 0.02));
  g.add(at(box(w * 0.9, 0.08, d, 0x1a1a1a), 0, h + 0.03, 0));
  for (const x of [-w / 3, w / 3]) g.add(at(box(0.03, h * 0.8, 0.01, 0x111111), x, h * 0.5, -d / 2 - 0.005)); // straps
  return g;
}

export function bike(frameColor) {
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
  // Bikepacking bags: frame bag, seat roll, bar roll.
  const bag = box(0.3, 0.18, 0.06, 0x1d1d22, { roughness: 0.9 });
  bag.position.set(0.12, y + 0.26, 0);
  bag.rotation.z = 0.12;
  g.add(bag);
  g.add(at(cyl(0.06, 0.06, 0.28, 0x1d1d22, { roughness: 0.9 }, 12), -0.38, y + 0.6, 0).rotateZ(1.3));
  g.add(at(cyl(0.07, 0.07, 0.4, 0x23262a, { roughness: 0.9 }, 12), 0.42, y + 0.5, 0).rotateX(Math.PI / 2));
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
  g.rotation.z = 0.04;
  return g;
}

// The gear corner on the south wall (wall-local x is -world x): a pallet
// against the wall with packs hung on it, ice tools above, a bike in front.
export function buildGear(scene) {
  const south = wallFrame('south');
  scene.add(south);
  const gear = new THREE.Group();
  south.add(gear);

  const p = pallet(0.95, 1.15);
  p.position.set(-0.72, 0, 0.005);
  p.rotation.z = 0.012;
  gear.add(p);

  // Packs hung off the pallet, boots on the floor below.
  const big = pack(0x2b2f2a, 0.32, 0.52, 0.16);
  big.position.set(-0.98, 0.55, 0.19);
  big.rotation.z = -0.04;
  gear.add(big);
  const vest = pack(0x3e5a3a, 0.24, 0.34, 0.12);
  vest.position.set(-0.5, 0.68, 0.17);
  vest.rotation.z = 0.06;
  gear.add(vest);
  for (const [u, r] of [[-0.62, 0.1], [-0.72, -0.15]]) {
    const boot = box(0.1, 0.24, 0.28, 0x2a2a2e);
    boot.position.set(u, 0.12, 0.3);
    boot.rotation.y = r;
    gear.add(boot);
  }

  // Ice tools hung by their picks, leaning out, picks facing each other.
  const left = iceTool(0xd9782b);
  left.position.set(-0.36, 1.38, 0.03);
  left.scale.x = -1;
  left.rotation.z = -0.1;
  gear.add(left);
  const right = iceTool(0x8a8f98);
  right.position.set(-1.12, 1.36, 0.03);
  right.rotation.z = 0.13;
  gear.add(right);

  const b = bike(0x23272e);
  b.position.set(-0.62, 0, 0.5);
  b.rotation.y = 0.04;
  b.rotation.x = -0.05;
  gear.add(b);

  const s = skis();
  s.position.set(0.28, 0, 0.12);
  south.add(s);

  return { gear, frame: south };
}
