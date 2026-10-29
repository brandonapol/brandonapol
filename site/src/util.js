import * as THREE from 'three';

// Real room: about 12 × 12 ft with an 8 ft ceiling. The desk wall is -z.
export const ROOM = { w: 3.66, d: 3.66, h: 2.44 };
export const HALF = ROOM.w / 2;

const materialCache = new Map();

// Shared materials keyed by their params, so a hundred black boxes cost one
// material. Stations clone their own before tinting on hover.
export function mat(color, opts = {}) {
  // Textures and other objects aren't cacheable by value.
  if (Object.values(opts).some((v) => typeof v === 'object')) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts });
  }
  const key = JSON.stringify([color, opts]);
  if (!materialCache.has(key)) {
    materialCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts }));
  }
  return materialCache.get(key);
}

export function mesh(geometry, material, { shadow = false } = {}) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = shadow;
  m.receiveShadow = true;
  return m;
}

export function box(w, h, d, color, opts = {}, meshOpts) {
  return mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'object' ? color : mat(color, opts), meshOpts);
}

export function cyl(rTop, rBottom, h, color, opts = {}, segments = 20, meshOpts) {
  return mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, segments),
    typeof color === 'object' ? color : mat(color, opts),
    meshOpts,
  );
}

// A tube between two points, for bike frames, stands and lamp poles.
export function rod(a, b, radius, color, opts = {}) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const length = start.distanceTo(end);
  const m = cyl(radius, radius, length, color, opts, 8);
  m.position.copy(start).add(end).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
  return m;
}

export function at(object, x, y, z) {
  object.position.set(x, y, z);
  return object;
}

export function group(...children) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

export function canvasTexture(width, height, draw, { repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  draw(c.getContext('2d'), width, height);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(...repeat);
  }
  return tex;
}

// Seeded random so the room (book colors, plank seams) is the same every visit.
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
