import * as THREE from 'three';
import { mat, mesh, box, cyl, rod, at, rng, canvasTexture } from '../util.js';
import { wallFrame, WINDOW } from './room.js';
import * as tex from '../textures.js';
import { stations as copy } from '../content.js';

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

// Blonde Epiphone Casino: thin hollow body, rounded double cutaways, two
// dog-ear P-90s, trapeze tailpiece, cream binding, natural blonde top.
const BODY_L = 0.48;
const BODY_HALF = [
  [0, 0],
  [0.09, 0.01],
  [0.16, 0.045],
  [0.196, 0.11],
  [0.198, 0.165],
  [0.175, 0.225],
  [0.148, 0.268],
  [0.142, 0.3],
  [0.152, 0.345],
  [0.156, 0.385],
  [0.142, 0.428],
  [0.116, 0.452], // horn tip
  [0.094, 0.444],
  [0.072, 0.418], // into the cutaway
  [0.048, 0.414],
  [0.03, 0.44],
  [0.026, BODY_L],
];

function casinoShape(scale = 1) {
  const pts = [...BODY_HALF, ...BODY_HALF.slice().reverse().map(([x, y]) => [-x, y])].map(
    ([x, y]) => new THREE.Vector2(x * scale, (y - BODY_L / 2) * scale + BODY_L / 2),
  );
  const outline = new THREE.SplineCurve(pts).getPoints(140);
  const s = new THREE.Shape();
  s.moveTo(outline[0].x, outline[0].y);
  for (const p of outline.slice(1)) s.lineTo(p.x, p.y);
  s.closePath();
  return s;
}

// Natural blonde top: pale center, warmer amber toward the edges, faint grain.
function blondeTop() {
  return canvasTexture(256, 320, (g, w, h) => {
    const grad = g.createRadialGradient(w / 2, h * 0.42, 20, w / 2, h * 0.45, w * 0.75);
    grad.addColorStop(0, '#f6e4b8');
    grad.addColorStop(0.65, '#ecca8a');
    grad.addColorStop(1, '#c9934e');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(150, 100, 40, 0.10)';
    for (let x = 0; x < w; x += 5 + Math.random() * 6) {
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(x + 4, h * 0.3, x - 4, h * 0.7, x + 2, h);
      g.stroke();
    }
  });
}

function fHole(side) {
  const s = new THREE.Shape();
  const x = side * 0.105;
  s.moveTo(x, 0.135);
  s.bezierCurveTo(x + side * 0.016, 0.18, x - side * 0.016, 0.24, x + side * 0.004, 0.285);
  s.lineTo(x + side * 0.009, 0.283);
  s.bezierCurveTo(x - side * 0.008, 0.24, x + side * 0.024, 0.18, x + side * 0.007, 0.133);
  s.closePath();
  const geo = new THREE.ShapeGeometry(s);
  return geo;
}

export function buildGuitar() {
  const guitar = new THREE.Group();
  const DEPTH = 0.032;
  const top = blondeTop();
  top.wrapS = top.wrapT = THREE.ClampToEdgeWrapping;
  // Extrude cap UVs are raw shape coordinates; map them onto the texture.
  top.repeat.set(1 / 0.42, 1 / BODY_L);
  top.offset.set(0.5, 0);
  const finish = { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 };
  const body = mesh(
    new THREE.ExtrudeGeometry(casinoShape(), { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2 }),
    new THREE.MeshPhysicalMaterial({ map: top, color: 0xffffff, ...finish }),
    { shadow: true },
  );
  guitar.add(body);
  // Cream binding peeking out around the edge.
  const binding = mesh(
    new THREE.ExtrudeGeometry(casinoShape(1.012), { depth: DEPTH - 0.004, bevelEnabled: false }),
    new THREE.MeshPhysicalMaterial({ color: 0xf3ead2, ...finish }),
  );
  binding.position.z = 0.002;
  guitar.add(binding);

  const front = DEPTH + 0.0035;
  const dark = mat(0x140f0b);
  for (const s of [-1, 1]) guitar.add(at(mesh(fHole(s), dark), 0, 0, front + 0.0005));

  // No environment map in the room, so keep metals only half-metallic or they render black.
  const chrome = mat(0xe6e8ec, { metalness: 0.45, roughness: 0.22 });
  const black = mat(0x111114, { roughness: 0.35 });
  // Dog-ear P-90s.
  for (const y of [0.355, 0.255]) {
    guitar.add(at(box(0.07, 0.03, 0.008, black), 0, y, front + 0.004));
    for (const x of [-0.042, 0.042]) guitar.add(at(cyl(0.006, 0.007, 0.005, 0x111114, {}, 12), x, y, front + 0.002).rotateX(Math.PI / 2));
  }
  // Tune-o-matic bridge and trapeze tailpiece.
  guitar.add(at(box(0.075, 0.009, 0.012, chrome), 0, 0.205, front + 0.006));
  const trapeze = new THREE.Shape();
  trapeze.moveTo(-0.024, 0.17);
  trapeze.lineTo(0.024, 0.17);
  trapeze.lineTo(0.007, 0.015);
  trapeze.lineTo(-0.007, 0.015);
  trapeze.closePath();
  // Open frame: cut out the middle so it reads as a trapeze, not a plate.
  const gap = new THREE.Path();
  gap.moveTo(-0.017, 0.16);
  gap.lineTo(0.017, 0.16);
  gap.lineTo(0.003, 0.03);
  gap.lineTo(-0.003, 0.03);
  gap.closePath();
  trapeze.holes.push(gap);
  guitar.add(at(mesh(new THREE.ExtrudeGeometry(trapeze, { depth: 0.003, bevelEnabled: false }), chrome), 0, 0, front + 0.002));
  // Small black teardrop pickguard on the treble side.
  const guard = new THREE.Shape();
  guard.moveTo(0.05, 0.395);
  guard.bezierCurveTo(0.085, 0.39, 0.105, 0.34, 0.098, 0.3);
  guard.bezierCurveTo(0.094, 0.285, 0.075, 0.3, 0.062, 0.33);
  guard.closePath();
  guitar.add(at(mesh(new THREE.ShapeGeometry(guard), mat(0x0d0b0a, { roughness: 0.25 })), 0, 0, front + 0.012));
  // Gold bell knobs and the toggle switch.
  for (const [x, y] of [[0.085, 0.13], [0.13, 0.15], [0.09, 0.08], [0.135, 0.1]]) {
    guitar.add(at(cyl(0.008, 0.011, 0.014, 0xe0bd62, { metalness: 0.35, roughness: 0.3 }, 14), x, y, front + 0.007).rotateX(Math.PI / 2));
  }
  guitar.add(at(cyl(0.004, 0.004, 0.025, chrome, {}, 8), -0.11, 0.38, front + 0.012).rotateX(Math.PI / 2));

  // Slim neck: maple back, rosewood board, dot-and-block inlays, frets.
  const neckLen = 0.44;
  const neckY = BODY_L - 0.06 + neckLen / 2;
  const neck = new THREE.Group();
  neck.add(at(box(0.046, neckLen, 0.02, 0xd8b07a, { roughness: 0.4 }), 0, 0, 0.018));
  neck.add(at(box(0.044, neckLen, 0.005, 0x2a1810, { roughness: 0.6 }), 0, 0, 0.0305));
  for (let i = 1; i <= 15; i++) {
    const y = neckLen / 2 - neckLen * (1 - 2 ** (-i / 12)) * 1.62;
    if (y < -neckLen / 2 + 0.01) break;
    neck.add(at(box(0.044, 0.0015, 0.0015, 0xd6d8dc, { metalness: 0.9 }), 0, y, 0.0335));
    if ([3, 5, 7, 9, 12, 15].includes(i)) {
      const prev = neckLen / 2 - neckLen * (1 - 2 ** (-(i - 1) / 12)) * 1.62;
      neck.add(at(box(0.026, Math.min(0.012, (prev - y) * 0.5), 0.001, 0xf1ead8), 0, (prev + y) / 2, 0.0334));
    }
  }
  neck.position.y = neckY;
  guitar.add(neck);
  // Tapered headstock, slightly angled back, with tuners.
  const headShape = new THREE.Shape();
  headShape.moveTo(-0.024, 0);
  headShape.lineTo(-0.042, 0.17);
  headShape.quadraticCurveTo(0, 0.19, 0.042, 0.17);
  headShape.lineTo(0.024, 0);
  headShape.closePath();
  const head = mesh(new THREE.ExtrudeGeometry(headShape, { depth: 0.014, bevelEnabled: false }), mat(0x120e0b, { roughness: 0.25 }));
  const headY = neckY + neckLen / 2;
  head.position.set(0, headY, 0.012);
  head.rotation.x = -0.22;
  guitar.add(head);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = headY + 0.04 + i * 0.045;
      guitar.add(at(cyl(0.0045, 0.0045, 0.035, chrome, {}, 8), s * 0.048, y, 0.0).rotateZ(Math.PI / 2));
      guitar.add(at(box(0.012, 0.016, 0.006, 0xf1ead8), s * 0.068, y, 0.0));
    }
  }
  // Strings.
  for (let i = 0; i < 6; i++) {
    const x = (i - 2.5) * 0.0065;
    guitar.add(rod([x * 1.3, 0.18, front + 0.012], [x, headY, 0.034], 0.0005, 0xe8e8e8, { metalness: 1 }));
  }

  // A-frame stand.
  const stand = new THREE.Group();
  const standMat = mat(0x18181b, { metalness: 0.3 });
  stand.add(rod([-0.15, 0, 0.12], [0, 0.7, -0.13], 0.008, standMat));
  stand.add(rod([0.15, 0, 0.12], [0, 0.7, -0.13], 0.008, standMat));
  stand.add(rod([0, 0, -0.3], [0, 0.7, -0.13], 0.008, standMat));
  stand.add(rod([-0.15, 0.12, 0.12], [0.15, 0.12, 0.12], 0.008, standMat));
  stand.add(at(box(0.32, 0.025, 0.06, 0x18181b), 0, 0.12, 0.13));
  guitar.position.set(0, 0.13, 0.11);
  guitar.rotation.x = -0.2;

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
  poster.rotation.z = 0.015;
  north.add(poster);

  // Photo wall, right of the window.
  const frames = new THREE.Group();
  const loader = new THREE.TextureLoader();
  copy.photos.gallery.forEach((photo, i) => {
    const [u, v, w] = photo.at;
    const placeholder = tex.photoPlaceholder(i);
    const f = framed(placeholder, w, w * (photo.h / photo.w), i % 2 ? 0xe8e4dc : 0x1a1612);
    loader.load(`${import.meta.env.BASE_URL}${photo.src}`, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      // Read the material at load time: stations clone materials for hover tint.
      const picture = f.children[1].material;
      picture.map = t;
      picture.needsUpdate = true;
    });
    f.position.set(u, v, 0);
    f.rotation.z = ((i * 7) % 5 - 2) * 0.012; // hung by eye
    frames.add(f);
  });
  north.add(frames);

  // Great Wave on the west wall, landscape on the south wall.
  const west = wallFrame('west');
  scene.add(west);
  const wave = framed(tex.greatWave(), 0.6, 0.42, 0xeeeae0);
  wave.position.set(1.36, 1.5, 0);
  wave.rotation.z = -0.025;
  west.add(wave);
  const south = wallFrame('south');
  scene.add(south);
  const land = framed(tex.landscape(), 0.3, 0.38, 0x2a1d12);
  land.position.set(-0.74, 1.74, 0);
  land.rotation.z = 0.02;
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
