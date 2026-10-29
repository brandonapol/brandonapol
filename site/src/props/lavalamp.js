import * as THREE from 'three';
import { mat, mesh, at } from '../util.js';

const BLOBS = 6;

// A teal lava lamp: a translucent glass lathe with wax blobs drifting inside.
export function buildLavaLamp() {
  const group = new THREE.Group();
  const metal = mat(0x9aa0a8, { metalness: 0.85, roughness: 0.3 });

  const base = mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.07, 0),
    new THREE.Vector2(0.075, 0.01),
    new THREE.Vector2(0.045, 0.11),
    new THREE.Vector2(0.04, 0.12),
  ], 32), metal);
  group.add(base);

  const glassProfile = [
    new THREE.Vector2(0.04, 0.12),
    new THREE.Vector2(0.058, 0.2),
    new THREE.Vector2(0.05, 0.32),
    new THREE.Vector2(0.028, 0.4),
  ];
  const glass = mesh(
    new THREE.LatheGeometry(glassProfile, 32),
    new THREE.MeshStandardMaterial({
      color: 0x4fd6e8,
      emissive: 0x1aa8c0,
      emissiveIntensity: 0.9,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  group.add(glass);

  const cap = mesh(new THREE.LatheGeometry([new THREE.Vector2(0.028, 0.4), new THREE.Vector2(0.018, 0.45), new THREE.Vector2(0, 0.452)], 24), metal);
  group.add(cap);

  const wax = new THREE.MeshStandardMaterial({ color: 0x9ff7ff, emissive: 0x38e0f0, emissiveIntensity: 1.2, roughness: 0.4 });
  const blobs = [];
  for (let i = 0; i < BLOBS; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), wax);
    b.userData = { phase: i * 1.7, speed: 0.12 + (i % 3) * 0.05, size: 0.012 + (i % 4) * 0.004, wobble: i * 0.9 };
    group.add(b);
    blobs.push(b);
  }
  // Wax pooled at the bottom.
  group.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), wax), 0, 0.125, 0));

  const light = new THREE.PointLight(0x3fd8f0, 0.7, 1.6, 2);
  light.position.y = 0.28;
  group.add(light);

  // The glass radius at height y, so blobs stay inside.
  const radiusAt = (y) => {
    for (let i = 1; i < glassProfile.length; i++) {
      const a = glassProfile[i - 1];
      const b = glassProfile[i];
      if (y <= b.y) return THREE.MathUtils.lerp(a.x, b.x, (y - a.y) / (b.y - a.y));
    }
    return 0.028;
  };

  function update(t) {
    for (const b of blobs) {
      const { phase, speed, size, wobble } = b.userData;
      const s = Math.sin(t * speed + phase);
      const y = 0.15 + (s * 0.5 + 0.5) * 0.21;
      const vy = Math.cos(t * speed + phase);
      const r = Math.max(0.001, radiusAt(y) - size * 1.2) * 0.6;
      b.position.set(Math.sin(t * 0.3 + wobble) * r, y, Math.cos(t * 0.23 + wobble) * r);
      // Stretch while moving, squash while turning around.
      const stretch = 1 + Math.abs(vy) * 0.6;
      b.scale.set(size / Math.sqrt(stretch), size * stretch, size / Math.sqrt(stretch));
    }
  }

  // A SHA-256 of the blob positions right now: LavaRand, at home.
  async function entropy() {
    const data = new Float32Array(BLOBS * 3 + 1);
    blobs.forEach((b, i) => data.set([b.position.x, b.position.y, b.position.z], i * 3));
    data[BLOBS * 3] = performance.now();
    const digest = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }

  return { group, update, entropy, light };
}
