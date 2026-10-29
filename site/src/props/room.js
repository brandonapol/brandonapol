import * as THREE from 'three';
import { ROOM, HALF, mat, mesh, box, at, group } from '../util.js';
import * as tex from '../textures.js';

// Wall-local frames. In each, +x runs along the wall (as seen from inside),
// +y is up and +z points into the room.
export const WALLS = {
  north: { position: [0, 0, -HALF], rotY: 0 }, // desk + window; local x = world x
  south: { position: [0, 0, HALF], rotY: Math.PI }, // bookshelf + gear; local x = -world x
  west: { position: [-HALF, 0, 0], rotY: Math.PI / 2 }, // hex panels + lava lamp; local x = -world z
  east: { position: [HALF, 0, 0], rotY: -Math.PI / 2 }, // closet, topo map, door; local x = world z
};

export function wallFrame(name) {
  const g = new THREE.Group();
  g.position.set(...WALLS[name].position);
  g.rotation.y = WALLS[name].rotY;
  return g;
}

// Openings in wall-local coords: { x0, x1, y0, y1 }.
const OPENINGS = {
  north: [{ x0: -0.7, x1: 0.7, y0: 0.95, y1: 2.12 }],
  east: [
    { x0: -1.15, x1: -0.05, y0: 0, y1: 2.03 }, // closet
    { x0: 0.98, x1: 1.76, y0: 0, y1: 2.03 }, // door
  ],
};

const DEPTH = 0.12; // apparent wall thickness at openings
const TRIM = 0x6b4224;

export const WINDOW = OPENINGS.north[0];
export const DOOR = OPENINGS.east[1];
export const CLOSET = OPENINGS.east[0];

function wallMesh(name, material) {
  const shape = new THREE.Shape();
  shape.moveTo(-HALF, 0);
  shape.lineTo(HALF, 0);
  shape.lineTo(HALF, ROOM.h);
  shape.lineTo(-HALF, ROOM.h);
  shape.closePath();
  for (const o of OPENINGS[name] ?? []) {
    const hole = new THREE.Path();
    hole.moveTo(o.x0, o.y0);
    hole.lineTo(o.x0, o.y1);
    hole.lineTo(o.x1, o.y1);
    hole.lineTo(o.x1, o.y0);
    hole.closePath();
    shape.holes.push(hole);
  }
  const m = mesh(new THREE.ShapeGeometry(shape), material);
  const frame = wallFrame(name);
  frame.add(m);
  // Jambs and trim around each opening so the wall reads as thick.
  for (const o of OPENINGS[name] ?? []) {
    const w = o.x1 - o.x0;
    const h = o.y1 - o.y0;
    const jamb = mat(0x8f7461, { roughness: 0.95 });
    frame.add(at(box(0.01, h, DEPTH, jamb), o.x0, o.y0 + h / 2, -DEPTH / 2));
    frame.add(at(box(0.01, h, DEPTH, jamb), o.x1, o.y0 + h / 2, -DEPTH / 2));
    frame.add(at(box(w, 0.01, DEPTH, jamb), (o.x0 + o.x1) / 2, o.y1, -DEPTH / 2));
    if (o.y0 > 0) frame.add(at(box(w, 0.01, DEPTH, jamb), (o.x0 + o.x1) / 2, o.y0, -DEPTH / 2));
    const t = 0.06;
    frame.add(at(box(t, h + t, 0.02, TRIM), o.x0 - t / 2, o.y0 + h / 2, 0.01));
    frame.add(at(box(t, h + t, 0.02, TRIM), o.x1 + t / 2, o.y0 + h / 2, 0.01));
    frame.add(at(box(w + 2 * t, t, 0.02, TRIM), (o.x0 + o.x1) / 2, o.y1 + t / 2, 0.01));
  }
  return frame;
}

export function buildRoom(scene) {
  const out = {};

  const floor = mesh(new THREE.PlaneGeometry(ROOM.w + 2, ROOM.d), mat(0xffffff, { map: tex.planks(), roughness: 0.6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.x = 1; // extends under the doorway into the hall
  scene.add(floor);

  const wallMat = mat(0xa58a76, { roughness: 0.95 });
  for (const name of Object.keys(WALLS)) scene.add(wallMesh(name, wallMat));

  const ceiling = mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), mat(0xd8d2c8, { roughness: 1 }));
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = ROOM.h;
  scene.add(ceiling);

  // Baseboard heater along the desk wall, like the real one.
  scene.add(at(box(ROOM.w - 0.1, 0.18, 0.07, 0xd9d4cc, { roughness: 0.5 }), 0, 0.09, -HALF + 0.035));

  out.window = buildWindow(scene);
  out.hall = buildHall(scene);
  buildCloset(scene);

  // Rug in the middle of the floor.
  const rug = mesh(new THREE.PlaneGeometry(1.5, 2.1), mat(0xffffff, { map: tex.rug(), roughness: 1 }));
  rug.rotation.x = -Math.PI / 2;
  rug.rotation.z = Math.PI / 2;
  rug.position.set(-0.1, 0.004, 0.35);
  scene.add(rug);

  // Hexagonal acoustic panels.
  const hexMat = mat(0x18181c, { roughness: 1 });
  // Hung by hand, so none of them quite line up.
  const hex = (frame, u, v, spin = 0) => {
    const h = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 6), hexMat);
    h.rotation.x = Math.PI / 2;
    h.rotation.y = Math.PI / 6 + spin;
    frame.add(at(h, u, v, 0.02));
  };
  // West wall: a cluster on each side of the small bookshelf.
  const west = wallFrame('west');
  [[0.4, 1.52, 0.03], [0.74, 1.73, -0.02], [0.73, 1.33, 0.05]].forEach(([u, v, s]) => hex(west, u, v, s));
  [[-0.8, 1.78, -0.04], [-1.13, 1.57, 0.02]].forEach(([u, v, s]) => hex(west, u, v, s));
  scene.add(west);
  const east = wallFrame('east');
  [[0.36, 0.88, 0.04], [0.71, 0.84, -0.03]].forEach(([u, v, s]) => hex(east, u, v, s));
  scene.add(east);

  // "5261-NY" plate above the door.
  const p = mesh(new THREE.PlaneGeometry(0.3, 0.15), mat(0xffffff, { map: tex.plate(), roughness: 0.4, metalness: 0.3 }));
  east.add(at(p, (DOOR.x0 + DOOR.x1) / 2, 2.22, 0.012));

  // Purple LED strip along the window sill and behind the desk.
  out.led = new THREE.MeshBasicMaterial({ color: 0xa35cff });
  scene.add(at(mesh(new THREE.BoxGeometry(1.5, 0.012, 0.012), out.led), 0, 0.93, -HALF + 0.12));
  scene.add(at(mesh(new THREE.BoxGeometry(1.4, 0.012, 0.012), out.led), 0, 0.68, -HALF + 0.07));

  return out;
}

function buildWindow(scene) {
  const o = WINDOW;
  const w = o.x1 - o.x0;
  const h = o.y1 - o.y0;
  const frame = wallFrame('north');
  scene.add(frame);

  // What's outside, set back from the wall so it parallaxes a little.
  const view = new THREE.MeshBasicMaterial({ map: tex.outdoors(), color: 0x1a2040 });
  frame.add(at(mesh(new THREE.PlaneGeometry(w * 2.2, h * 2), view), 0, (o.y0 + o.y1) / 2, -1.2));

  const white = mat(0xf1eee8, { roughness: 0.5 });
  frame.add(at(box(w, 0.04, 0.04, white), 0, (o.y0 + o.y1) / 2, -0.06)); // meeting rail
  frame.add(at(box(0.04, h, 0.04, white), 0, (o.y0 + o.y1) / 2, -0.07)); // mullion
  frame.add(at(box(w + 0.16, 0.04, 0.2, white), 0, o.y0 - 0.02, -0.02)); // sill
  // Blinds, mostly raised.
  const slat = mat(0xf4f1ea, { roughness: 0.6 });
  for (let i = 0; i < 9; i++) frame.add(at(box(w - 0.02, 0.008, 0.035, slat), 0, o.y1 - 0.03 - i * 0.022, -0.03));
  frame.add(at(box(w, 0.03, 0.05, white), 0, o.y1 - 0.015, -0.03));

  // A few bottles on the sill.
  frame.add(at(box(0.07, 0.2, 0.07, 0x6b3a12, { roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 }), 0.42, o.y0 + 0.1, -0.05));
  frame.add(at(box(0.08, 0.18, 0.08, 0xdfe7ea, { roughness: 0.1, transparent: true, opacity: 0.45 }), 0.6, o.y0 + 0.09, -0.05));
  return { view };
}

function buildHall(scene) {
  // A short hallway past the open door, lit warm.
  const o = DOOR;
  const z0 = o.x0 - 0.3;
  const z1 = o.x1 + 0.3;
  const len = 1.8;
  const hallMat = new THREE.MeshStandardMaterial({ color: 0xc9a982, roughness: 1, side: THREE.BackSide });
  const hall = mesh(new THREE.BoxGeometry(len, ROOM.h, z1 - z0), hallMat);
  hall.position.set(HALF + len / 2 + 0.005, ROOM.h / 2 - 0.01, (z0 + z1) / 2);
  scene.add(hall);
  // The box sits 1 cm low so the shared floor plane shows through.
  const runner = mesh(new THREE.PlaneGeometry(1.4, 0.5), mat(0x8c8f86, { roughness: 1 }));
  runner.rotation.x = -Math.PI / 2;
  runner.position.set(HALF + 0.9, 0.005, (z0 + z1) / 2);
  scene.add(runner);

  // The door, swung open into the hall.
  const door = box(o.x1 - o.x0 - 0.02, 2.0, 0.04, 0x9a5f2e, { roughness: 0.6 });
  door.position.set(HALF + (o.x1 - o.x0) / 2, 1.0, o.x1 - 0.02);
  scene.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 8), mat(0xc9a44a, { metalness: 0.8, roughness: 0.3 }));
  knob.position.set(HALF + o.x1 - o.x0 - 0.1, 0.95, o.x1 - 0.06);
  scene.add(knob);

  const light = new THREE.PointLight(0xffc98a, 1.4, 3, 1.6);
  light.position.set(HALF + 1.0, 2.1, (z0 + z1) / 2);
  scene.add(light);
  return { light };
}

function buildCloset(scene) {
  const o = CLOSET;
  const w = o.x1 - o.x0;
  const depth = 0.6;
  const inside = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1, side: THREE.BackSide });
  const box3 = mesh(new THREE.BoxGeometry(depth, o.y1, w), inside);
  box3.position.set(HALF + depth / 2 + 0.005, o.y1 / 2 - 0.01, (o.x0 + o.x1) / 2);
  scene.add(box3);

  // Sliding doors, closed: the back panel on the left, the front one on the right.
  const door = mat(0xa8682f, { roughness: 0.55 });
  const pull = mat(0x3a2414);
  const half = w / 2;
  scene.add(at(box(0.03, o.y1 - 0.02, half + 0.03, door), HALF - 0.02, o.y1 / 2, o.x0 + half / 2));
  scene.add(at(box(0.03, o.y1 - 0.02, half + 0.03, door), HALF - 0.05, o.y1 / 2, o.x1 - half / 2));
  scene.add(at(box(0.005, 0.12, 0.03, pull), HALF - 0.036, 1.0, o.x0 + 0.06));
  scene.add(at(box(0.005, 0.12, 0.03, pull), HALF - 0.066, 1.0, o.x1 - 0.06));
}

export { group };
