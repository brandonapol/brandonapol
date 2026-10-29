import * as THREE from 'three';
import { mat, mesh, box, cyl, rod, at, rng } from '../util.js';
import { wallFrame, WINDOW } from './room.js';
import * as tex from '../textures.js';

function framed(map, w, h, frameColor = 0x15120f) {
  const g = new THREE.Group();
  g.add(at(box(w + 0.04, h + 0.04, 0.02, frameColor), 0, 0, 0.01));
  g.add(at(mesh(new THREE.PlaneGeometry(w, h), mat(0xffffff, { map, roughness: 0.8 })), 0, 0, 0.021));
  return g;
}

export function buildCooler() {
  const g = new THREE.Group();
  const shell = mat(0xe6dfcf, { roughness: 0.55 });
  const L = 0.66;
  const W = 0.42;
  const H = 0.4;
  const body = box(L, H - 0.06, W, shell, {}, { shadow: true });
  body.position.y = (H - 0.06) / 2 + 0.01;
  g.add(body);
  g.add(at(box(L + 0.01, 0.06, W + 0.01, shell), 0, H - 0.02, 0)); // lid
  g.add(at(box(L - 0.1, 0.004, W - 0.1, 0xd8d0be), 0, H + 0.012, 0)); // lid recess
  g.add(at(box(L - 0.04, 0.02, W - 0.02, 0x2a2a2a), 0, 0.01, 0)); // feet
  // Rubber T-latches and rope handles.
  const rubber = mat(0x1c1c1e, { roughness: 0.8 });
  for (const x of [-0.18, 0.18]) g.add(at(box(0.05, 0.08, 0.015, rubber), x, H - 0.07, W / 2 + 0.008));
  const rope = mat(0x2d3e5c, { roughness: 0.9 });
  for (const x of [-1, 1]) {
    const handle = mesh(new THREE.TorusGeometry(0.06, 0.009, 6, 16, Math.PI), rope);
    handle.position.set((x * (L + 0.02)) / 2, H - 0.09, 0);
    handle.rotation.set(Math.PI, x * Math.PI / 2, 0);
    g.add(handle);
  }
  g.add(at(box(0.16, 0.05, 0.003, 0x9a9384), 0, H - 0.17, W / 2 + 0.002)); // plain badge
  return g;
}

// Monstera leaves: heart-shaped outlines with edge slits and a few holes.
function monsteraLeafGeometry() {
  const shape = new THREE.Shape();
  const L = 0.34;
  const Wd = 0.24;
  const pts = 28;
  const side = (s) => {
    const out = [];
    for (let i = 0; i <= pts; i++) {
      const t = i / pts;
      let w = Wd * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** 0.7 * (1 - 0.35 * t);
      // Slits: dip toward the midrib at a few places.
      const slit = [0.34, 0.52, 0.7].some((k) => Math.abs(t - k) < 0.012);
      if (slit) w *= 0.45;
      out.push(new THREE.Vector2(s * w, t * L - 0.04 * Math.sin(Math.PI * t)));
    }
    return out;
  };
  const right = side(1);
  const left = side(-1).reverse();
  shape.moveTo(0, 0);
  // Heart notch at the base.
  shape.lineTo(0.05, -0.04);
  for (const p of right.slice(1)) shape.lineTo(p.x, p.y);
  for (const p of left.slice(1)) shape.lineTo(p.x, p.y);
  shape.lineTo(-0.05, -0.04);
  shape.closePath();
  for (const [x, y, r] of [[0.05, 0.12, 0.012], [-0.055, 0.15, 0.013], [0.045, 0.2, 0.01], [-0.04, 0.23, 0.009]]) {
    const hole = new THREE.Path();
    hole.absellipse(x, y, r, r * 2.2, 0, Math.PI * 2, false, 0.4 * Math.sign(x));
    shape.holes.push(hole);
  }
  return new THREE.ShapeGeometry(shape, 6);
}

export function buildMonstera() {
  const g = new THREE.Group();
  g.add(at(cyl(0.17, 0.13, 0.3, 0x4a73a8, { roughness: 0.5 }, 24, { shadow: true }), 0, 0.15, 0));
  g.add(at(cyl(0.155, 0.155, 0.02, 0x3a2a1c, {}, 24), 0, 0.29, 0));
  const leafGeo = monsteraLeafGeometry();
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f8f38, emissive: 0x0c2a0a, roughness: 0.5, side: THREE.DoubleSide });
  const stemMat = mat(0x4e7a32, { roughness: 0.6 });
  const r = rng(9);
  const leaves = 11;
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * Math.PI * 2 + r() * 0.4;
    const reach = 0.12 + r() * 0.22;
    const height = 0.55 + r() * 0.65;
    const tip = [Math.cos(a) * reach, height, Math.sin(a) * reach];
    g.add(rod([Math.cos(a) * 0.03, 0.3, Math.sin(a) * 0.03], tip, 0.008, stemMat));
    const leaf = new THREE.Mesh(leafGeo, leafMat);
    leaf.castShadow = true;
    leaf.position.set(...tip);
    // Face outward and droop.
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = -a - Math.PI / 2;
    leaf.rotation.x = -1.0 - r() * 0.5;
    leaf.rotation.z = (r() - 0.5) * 0.5;
    const s = 0.75 + r() * 0.45;
    leaf.scale.set(s, s, s);
    g.add(leaf);
  }
  return g;
}

// Blonde Epiphone Casino: thinline hollow body, double cutaways, two P-90s.
function casinoBodyShape() {
  const s = new THREE.Shape();
  // Outline, bottom (strap button) at y=0, neck joint at y=0.47. Mirrored halves.
  const half = [
    [0, 0],
    [0.12, 0.012],
    [0.19, 0.08],
    [0.205, 0.17],
    [0.17, 0.26],
    [0.15, 0.3],
    [0.165, 0.37],
    [0.15, 0.43], // horn
    [0.12, 0.45],
    [0.085, 0.4], // cutaway
    [0.04, 0.42],
    [0.025, 0.47],
  ];
  const pts = [...half, ...half.slice().reverse().map(([x, y]) => [-x, y])];
  const curve = new THREE.SplineCurve(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const sampled = curve.getPoints(90);
  s.moveTo(sampled[0].x, sampled[0].y);
  for (const p of sampled.slice(1)) s.lineTo(p.x, p.y);
  s.closePath();
  return s;
}

function fHole(side) {
  const s = new THREE.Shape();
  const x = side * 0.11;
  s.moveTo(x - 0.006, 0.12);
  s.bezierCurveTo(x + side * 0.02, 0.17, x - side * 0.02, 0.24, x + 0.004, 0.29);
  s.lineTo(x + 0.01, 0.288);
  s.bezierCurveTo(x - side * 0.012, 0.24, x + side * 0.028, 0.17, x + 0.004, 0.12);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

export function buildGuitar() {
  const guitar = new THREE.Group();
  const blonde = new THREE.MeshPhysicalMaterial({ color: 0xe8c890, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 });
  const body = mesh(
    new THREE.ExtrudeGeometry(casinoBodyShape(), { depth: 0.04, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2, curveSegments: 6 }),
    blonde,
    { shadow: true },
  );
  guitar.add(body);
  const front = 0.047;
  const dark = mat(0x1a1410);
  for (const s of [-1, 1]) guitar.add(at(mesh(fHole(s), dark), 0, 0, front));
  // P-90 pickups, bridge, trapeze tailpiece.
  guitar.add(at(box(0.085, 0.03, 0.012, 0x16161a), 0, 0.36, front));
  guitar.add(at(box(0.085, 0.03, 0.012, 0x16161a), 0, 0.26, front));
  const chrome = mat(0xd0d3d8, { metalness: 0.9, roughness: 0.2 });
  guitar.add(at(box(0.08, 0.012, 0.012, chrome), 0, 0.2, front + 0.004));
  guitar.add(rod([-0.03, 0.17, front], [0, 0.02, front], 0.004, chrome));
  guitar.add(rod([0.03, 0.17, front], [0, 0.02, front], 0.004, chrome));
  for (const [x, y] of [[0.1, 0.12], [0.14, 0.15], [0.1, 0.07], [0.14, 0.1]]) {
    guitar.add(at(cyl(0.012, 0.012, 0.014, 0xc9a44a, { metalness: 0.6 }, 12), x, y, front).rotateX(Math.PI / 2));
  }
  // Pickguard on the treble side.
  const guard = new THREE.Shape();
  guard.moveTo(0.05, 0.42);
  guard.quadraticCurveTo(0.15, 0.4, 0.13, 0.26);
  guard.lineTo(0.06, 0.28);
  guard.closePath();
  guitar.add(at(mesh(new THREE.ShapeGeometry(guard), mat(0x1c1612, { roughness: 0.3 })), 0, 0, front + 0.002));
  // Neck, fingerboard, headstock, tuners.
  guitar.add(at(box(0.045, 0.46, 0.022, 0xc99a5a), 0, 0.69, 0.03));
  guitar.add(at(box(0.043, 0.44, 0.006, 0x2b1a12), 0, 0.68, 0.044));
  for (let i = 1; i < 14; i++) guitar.add(at(box(0.044, 0.002, 0.002, 0xcfd2d6), 0, 0.47 + i * 0.03 * (1 - i * 0.015), 0.048));
  const head = box(0.08, 0.17, 0.016, 0x16120f);
  head.position.set(0, 1.0, 0.028);
  head.rotation.x = -0.25;
  guitar.add(head);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) guitar.add(at(cyl(0.006, 0.006, 0.03, 0xcfd2d6, { metalness: 0.9 }, 8), s * 0.055, 0.95 + i * 0.045, 0.02).rotateZ(Math.PI / 2));
  for (let i = 0; i < 6; i++) guitar.add(rod([-0.015 + i * 0.006, 0.17, front + 0.008], [-0.015 + i * 0.006, 0.92, 0.05], 0.0007, 0xe0e0e0, { metalness: 1 }));

  // A-frame stand.
  const stand = new THREE.Group();
  const black = mat(0x18181b, { metalness: 0.3 });
  stand.add(rod([-0.15, 0, 0.12], [0, 0.65, -0.12], 0.008, black));
  stand.add(rod([0.15, 0, 0.12], [0, 0.65, -0.12], 0.008, black));
  stand.add(rod([0, 0, -0.3], [0, 0.65, -0.12], 0.008, black));
  stand.add(rod([-0.15, 0.12, 0.12], [0.15, 0.12, 0.12], 0.008, black));
  guitar.position.set(0, 0.08, 0.1);
  guitar.rotation.x = -0.22;

  const g = new THREE.Group();
  g.add(stand, guitar);
  return g;
}

export function buildPracticePad() {
  const g = new THREE.Group();
  const chrome = mat(0xc9ccd2, { metalness: 0.9, roughness: 0.25 });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(rod([0, 0.25, 0], [Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22], 0.008, chrome));
  }
  g.add(rod([0, 0.25, 0], [0, 0.72, 0], 0.01, chrome));
  g.add(at(cyl(0.16, 0.16, 0.03, 0xeeeeee, { roughness: 0.6 }, 32), 0, 0.74, 0));
  g.add(at(cyl(0.12, 0.12, 0.006, 0x2a2a2e, { roughness: 0.9 }, 32), 0, 0.758, 0));
  const stick = (x, rot) => {
    const s = rod([x - 0.18, 0.775, -0.05], [x + 0.18, 0.775, 0.02], 0.007, 0xd8b27a);
    s.rotation.y += rot;
    return s;
  };
  g.add(stick(0, 0.2));
  g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 6), mat(0xc0392b)), 0.18, 0.775, 0.02));
  return g;
}

export function buildPosters(scene) {
  const north = wallFrame('north');
  scene.add(north);
  // Code Cop, left of the window.
  const poster = framed(tex.codeCop(), 0.45, 0.63, 0x0b0b0e);
  poster.position.set(WINDOW.x0 - 0.7, 1.55, 0);
  north.add(poster);

  // Photo wall, right of the window (placeholders until the photos arrive).
  const frames = new THREE.Group();
  const spots = [
    [1.0, 1.85, 0.24, 0.3],
    [1.4, 1.95, 0.3, 0.22],
    [1.42, 1.62, 0.22, 0.28],
    [1.05, 1.47, 0.26, 0.2],
    [1.7, 1.42, 0.12, 0.16],
  ];
  spots.forEach(([u, v, w, h], i) => {
    const f = framed(tex.photoPlaceholder(i), w, h, i % 2 ? 0xe8e4dc : 0x1a1612);
    f.position.set(u, v, 0);
    frames.add(f);
  });
  north.add(frames);

  // Great Wave on the west wall, landscape on the south wall.
  const west = wallFrame('west');
  scene.add(west);
  const wave = framed(tex.greatWave(), 0.6, 0.42, 0xeeeae0);
  wave.position.set(1.15, 1.45, 0);
  west.add(wave);
  const south = wallFrame('south');
  scene.add(south);
  const land = framed(tex.landscape(), 0.3, 0.38, 0x2a1d12);
  land.position.set(-0.05, 1.6, 0);
  south.add(land);

  return { poster, frames };
}

export function buildLightSwitch() {
  const g = new THREE.Group();
  g.add(at(box(0.075, 0.12, 0.008, 0xf2efe8, { roughness: 0.4 }), 0, 0, 0.004));
  const toggle = box(0.014, 0.03, 0.012, 0xf8f6f0, { roughness: 0.3 });
  toggle.position.set(0, 0.008, 0.012);
  g.add(toggle);
  return { group: g, toggle };
}

// Torchiere floor lamp with a reading arm, like the one by the closet.
export function buildFloorLamp() {
  const g = new THREE.Group();
  const black = mat(0x1d1d22, { metalness: 0.4, roughness: 0.4 });
  g.add(at(cyl(0.13, 0.15, 0.03, black, {}, 24), 0, 0.015, 0));
  g.add(rod([0, 0, 0], [0, 1.72, 0], 0.012, black));
  const glass = { emissive: 0xffd9a0, emissiveIntensity: 0.9, roughness: 0.4 };
  const bowl = mesh(new THREE.SphereGeometry(0.15, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(0xf4efe6, { ...glass, side: THREE.DoubleSide }));
  bowl.rotation.x = Math.PI;
  bowl.position.y = 1.72;
  g.add(bowl);
  g.add(rod([0, 1.1, 0], [-0.2, 1.25, 0.05], 0.008, black));
  const shade = cyl(0.03, 0.07, 0.1, mat(0xf4efe6, glass), {}, 16);
  shade.position.set(-0.24, 1.22, 0.06);
  shade.rotation.z = 0.8;
  g.add(shade);
  const light = new THREE.PointLight(0xffc98a, 2.2, 5, 1.4);
  light.position.y = 1.85;
  g.add(light);
  return g;
}
