import * as THREE from 'three';
import { HALF, mat, mesh, box, cyl, rod, at, group } from '../util.js';
import * as tex from '../textures.js';

export const DESK = { w: 1.5, d: 0.72, top: 0.74, z: -HALF + 0.42 };

const BLACK = 0x141418;
const METAL = 0x2a2a30;

function screenMaterial(map) {
  return new THREE.MeshBasicMaterial({ map, toneMapped: false });
}

function monitor(w, h, map, standH = 0.2) {
  const g = new THREE.Group();
  g.add(at(box(0.05, standH, 0.05, METAL, { metalness: 0.5 }), 0, standH / 2, -0.03));
  g.add(at(box(0.22, 0.012, 0.16, METAL, { metalness: 0.5 }), 0, 0.006, 0));
  const y = standH + h / 2;
  g.add(at(box(w + 0.02, h + 0.02, 0.025, 0x0c0c0f), 0, y, 0));
  const screen = mesh(new THREE.PlaneGeometry(w, h), screenMaterial(map));
  g.add(at(screen, 0, y, 0.0135));
  return { group: g, screen, center: y };
}

function laptop(map, open = 1.85) {
  const g = new THREE.Group();
  const silver = mat(0xb8bcc4, { metalness: 0.6, roughness: 0.35 });
  g.add(at(box(0.32, 0.015, 0.22, silver), 0, 0.0075, 0));
  g.add(at(box(0.27, 0.002, 0.1, 0x2b2d33), 0, 0.016, -0.03));
  const lid = new THREE.Group();
  lid.position.set(0, 0.015, -0.11);
  lid.rotation.x = -(open - Math.PI / 2);
  lid.add(at(box(0.32, 0.21, 0.008, silver), 0, 0.105, -0.004));
  lid.add(at(mesh(new THREE.PlaneGeometry(0.29, 0.18), screenMaterial(map)), 0, 0.108, 0.0005));
  g.add(lid);
  return g;
}

export function buildDesk(scene) {
  const desk = new THREE.Group();
  desk.position.set(0, 0, DESK.z);
  scene.add(desk);

  desk.add(at(box(DESK.w, 0.04, DESK.d, BLACK, { roughness: 0.4 }, { shadow: true }), 0, DESK.top - 0.02, 0));
  for (const x of [-0.62, 0.62]) {
    desk.add(at(box(0.07, DESK.top - 0.04, 0.07, BLACK, { metalness: 0.4 }), x, (DESK.top - 0.04) / 2, 0.05));
    desk.add(at(box(0.08, 0.04, DESK.d - 0.06, BLACK, { metalness: 0.4 }), x, 0.02, 0));
  }
  desk.add(at(box(1.2, 0.05, 0.05, BLACK), 0, 0.5, -0.2)); // crossbar
  desk.add(at(box(0.95, 0.004, 0.42, 0x7a4a2a, { roughness: 0.9 }), 0, DESK.top + 0.002, 0.08)); // desk mat

  // Main monitor: the computer station.
  const main = monitor(0.62, 0.36, tex.mainScreen());
  main.group.position.set(0.08, DESK.top, -0.2);
  desk.add(main.group);

  // Portrait monitor on the left, full of code.
  const side = monitor(0.34, 0.6, tex.codeScreen(), 0.1);
  side.group.position.set(-0.46, DESK.top, -0.18);
  side.group.rotation.y = 0.25;
  desk.add(side.group);

  // Laptops on either side.
  const left = laptop(tex.laptopScreen('map'));
  left.position.set(-0.56, DESK.top, 0.12);
  left.rotation.y = 0.35;
  desk.add(left);
  const right = laptop(tex.laptopScreen('term'), 1.75);
  right.position.set(0.56, DESK.top + 0.12, -0.12);
  right.rotation.y = -0.3;
  desk.add(right);
  desk.add(at(box(0.04, 0.12, 0.12, METAL, { metalness: 0.6 }), 0.56, DESK.top + 0.06, -0.12)); // laptop stand

  // Split keyboard: its own station.
  const keyboard = new THREE.Group();
  keyboard.position.set(0, DESK.top + 0.004, 0.14);
  const keyMat = mat(0x3c3d44, { roughness: 0.5 });
  for (const s of [-1, 1]) {
    const half = new THREE.Group();
    half.position.set(s * 0.13, 0, 0);
    half.rotation.y = -s * 0.2;
    half.add(at(box(0.2, 0.025, 0.15, 0x2a2b31), 0, 0.0125, 0));
    // key rows
    for (let r = 0; r < 4; r++) half.add(at(box(0.17, 0.008, 0.024, keyMat), 0, 0.029, -0.05 + r * 0.032));
    half.add(at(box(0.06, 0.01, 0.04, keyMat), -s * 0.06, 0.03, 0.06)); // thumb cluster
    keyboard.add(half);
  }
  desk.add(keyboard);

  desk.add(at(box(0.24, 0.003, 0.2, 0x1e1e22), 0.42, DESK.top + 0.0015, 0.12)); // mouse pad
  const mouse = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 8), mat(0x1a1a1e, { roughness: 0.4 }));
  mouse.scale.set(0.9, 0.5, 1.4);
  desk.add(at(mouse, 0.42, DESK.top + 0.012, 0.12));

  // The little white bust and the yellow Zero to One.
  desk.add(at(cyl(0.035, 0.04, 0.06, 0xf2efe8), -0.14, DESK.top + 0.03, -0.26));
  desk.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), mat(0xf2efe8)), -0.14, DESK.top + 0.095, -0.26));
  desk.add(at(box(0.14, 0.025, 0.21, 0xf2b632), 0.62, DESK.top + 0.0125, 0.2));
  desk.add(at(cyl(0.045, 0.045, 0.13, 0xdfe6e8, { roughness: 0.1, transparent: true, opacity: 0.4 }), 0.35, DESK.top + 0.065, -0.05)); // mason jar

  // Desk lamp, warm.
  const lampShade = cyl(0.07, 0.1, 0.13, 0xfff1d0, { emissive: 0xffc27a, emissiveIntensity: 0.8 }, 24);
  desk.add(at(lampShade, -0.66, DESK.top + 0.3, -0.24));
  desk.add(at(cyl(0.05, 0.06, 0.24, 0xdedad2, { roughness: 0.3 }), -0.66, DESK.top + 0.12, -0.24));
  const lampLight = new THREE.PointLight(0xffc27a, 0.8, 2.5, 2);
  lampLight.position.set(-0.66, DESK.top + 0.25, DESK.z - 0.24);
  scene.add(lampLight);

  const glow = new THREE.PointLight(0x9fb4ff, 0.9, 2.2, 2);
  glow.position.set(0.08, DESK.top + 0.38, DESK.z + 0.1);
  scene.add(glow);

  buildRingLight(scene);
  buildChair(scene);

  return { computer: main.group, keyboard, lampShade, lampLight, glow, screenCenterY: DESK.top + main.center };
}

function buildRingLight(scene) {
  const g = new THREE.Group();
  g.position.set(-0.92, 0, -1.6);
  g.add(rod([0, 0, 0], [0, 1.35, 0], 0.012, 0x111114, { metalness: 0.5 }));
  for (const a of [0, 2.1, 4.2]) g.add(rod([0, 0.45, 0], [Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22], 0.01, 0x111114));
  const ring = mesh(new THREE.TorusGeometry(0.2, 0.025, 12, 48), new THREE.MeshBasicMaterial({ color: 0x4a6bff }));
  ring.position.y = 1.55;
  ring.rotation.y = 0.5;
  g.add(ring);
  scene.add(g);
}

function buildChair(scene) {
  const g = new THREE.Group();
  // Swiveled out toward the room, off to the right, so it doesn't hide the screens.
  g.position.set(0.78, 0, -0.78);
  g.rotation.y = Math.PI - 0.7;
  g.scale.setScalar(0.92);
  const leather = mat(0x2e2e36, { roughness: 0.35, metalness: 0.1 });
  const chrome = mat(0xb9bcc2, { metalness: 0.9, roughness: 0.25 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(rod([0, 0.08, 0], [Math.cos(a) * 0.32, 0.05, Math.sin(a) * 0.32], 0.015, chrome));
    g.add(at(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat(0x111111)), Math.cos(a) * 0.32, 0.03, Math.sin(a) * 0.32));
  }
  g.add(rod([0, 0.08, 0], [0, 0.45, 0], 0.025, chrome));
  g.add(at(box(0.5, 0.09, 0.5, leather, {}, { shadow: true }), 0, 0.5, 0));
  const back = box(0.48, 0.72, 0.08, leather, {}, { shadow: true });
  back.position.set(0, 0.95, 0.24);
  back.rotation.x = -0.12;
  g.add(back);
  for (let i = 0; i < 5; i++) g.add(at(box(0.49, 0.008, 0.085, 0x0c0c10), 0, 0.68 + i * 0.13, 0.24 + i * 0.016)); // stitching
  for (const s of [-1, 1]) {
    g.add(rod([s * 0.26, 0.5, 0.15], [s * 0.26, 0.68, 0.05], 0.012, chrome));
    g.add(at(box(0.05, 0.03, 0.3, leather), s * 0.26, 0.69, -0.02));
  }
  scene.add(g);
}

export { group };
