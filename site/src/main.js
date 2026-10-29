import * as THREE from 'three';
import './style.css';

// Room is roughly the size of the real office, in meters. The desk wall
// (with the window, in the real room) is at -z; the camera looks in from +z.
const ROOM = { w: 4.2, d: 3.6, h: 2.5 };
const PLAYER_RADIUS = 0.22;
const PLAYER_SPEED = 1.8;
const INTERACT_DISTANCE = 0.75;

const canvas = document.querySelector('#scene');
const promptEl = document.querySelector('#prompt');
const computerEl = document.querySelector('#computer');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0714);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.05, 50);

// --- Lighting: purple LED wash like the night photo, plus the monitor glow.

scene.add(new THREE.HemisphereLight(0x8a7cff, 0x2a1a10, 0.6));

const ledLight = new THREE.PointLight(0x9b5cff, 6, 7, 1.5);
ledLight.position.set(-1.4, 2.1, -1.0);
ledLight.castShadow = true;
ledLight.shadow.mapSize.set(1024, 1024);
scene.add(ledLight);

const fillLight = new THREE.PointLight(0xffc48a, 1.6, 6, 1.5);
fillLight.position.set(0.9, 2.0, 1.0);
scene.add(fillLight);

// --- Room shell. Planes face inward, so walls between the camera and the
// player are back-face culled and the room reads as a dollhouse cutaway.

function plankTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const g = c.getContext('2d');
  const rows = 8;
  for (let i = 0; i < rows; i++) {
    const shade = 120 + Math.random() * 30;
    g.fillStyle = `rgb(${shade}, ${shade * 0.62}, ${shade * 0.36})`;
    g.fillRect(0, (i * c.height) / rows, c.width, c.height / rows);
    g.fillStyle = 'rgba(0,0,0,0.35)';
    g.fillRect(0, (i * c.height) / rows, c.width, 2);
    const seam = Math.random() * c.width;
    g.fillRect(seam, (i * c.height) / rows, 2, c.height / rows);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM.w, ROOM.d),
  new THREE.MeshStandardMaterial({ map: plankTexture(), roughness: 0.7 }),
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8c7464, roughness: 0.95 });
const walls = [
  { pos: [0, ROOM.h / 2, -ROOM.d / 2], rotY: 0, width: ROOM.w },
  { pos: [0, ROOM.h / 2, ROOM.d / 2], rotY: Math.PI, width: ROOM.w },
  { pos: [-ROOM.w / 2, ROOM.h / 2, 0], rotY: Math.PI / 2, width: ROOM.d },
  { pos: [ROOM.w / 2, ROOM.h / 2, 0], rotY: -Math.PI / 2, width: ROOM.d },
];
for (const { pos, rotY, width } of walls) {
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(width, ROOM.h), wallMaterial);
  wall.position.set(...pos);
  wall.rotation.y = rotY;
  wall.receiveShadow = true;
  scene.add(wall);
}

const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), wallMaterial);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.h;
scene.add(ceiling);

// --- Desk: black standing desk with a brown mat, split keyboard, one monitor.

function box(w, h, d, color, opts = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts }),
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

const DESK = { w: 1.5, d: 0.72, top: 0.74 };
const deskZ = -ROOM.d / 2 + DESK.d / 2 + 0.04;
const desk = new THREE.Group();
desk.position.set(0, 0, deskZ);
scene.add(desk);

const deskTop = box(DESK.w, 0.04, DESK.d, 0x141418);
deskTop.position.y = DESK.top - 0.02;
desk.add(deskTop);

for (const x of [-0.6, 0.6]) {
  const column = box(0.07, DESK.top - 0.04, 0.07, 0x111114, { metalness: 0.4 });
  column.position.set(x, (DESK.top - 0.04) / 2, 0);
  desk.add(column);
  const foot = box(0.08, 0.04, DESK.d - 0.06, 0x111114, { metalness: 0.4 });
  foot.position.set(x, 0.02, 0);
  desk.add(foot);
}

const mat = box(0.9, 0.004, 0.4, 0x6b4428, { roughness: 0.9 });
mat.position.set(0, DESK.top + 0.002, 0.1);
desk.add(mat);

for (const side of [-1, 1]) {
  const half = box(0.2, 0.025, 0.14, 0x3a3a40);
  half.position.set(side * 0.13, DESK.top + 0.016, 0.14);
  half.rotation.y = -side * 0.18;
  desk.add(half);
}

// Monitor screen is a canvas texture on an unlit material so it glows.
function screenTexture() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 576;
  const g = c.getContext('2d');
  g.fillStyle = '#12101c';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#2a2540';
  g.fillRect(0, 0, c.width, 40);
  g.font = '28px monospace';
  const lines = [
    ['#a78bfa', '$ whoami'],
    ['#e9e4f5', 'Brandon Apol'],
    ['#9d93b8', 'Fullstack / Site Reliability Engineer'],
    ['#e9e4f5', ''],
    ['#a78bfa', '$ ls ~/links'],
    ['#e9e4f5', 'resume  autobutler.org  quark  birchwood.lol'],
    ['#e9e4f5', ''],
    ['#a78bfa', '$ walk up and press E to log in_'],
  ];
  lines.forEach(([color, text], i) => {
    g.fillStyle = color;
    g.fillText(text, 40, 100 + i * 52);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const MONITOR = { w: 0.62, h: 0.36 };
const monitor = new THREE.Group();
monitor.position.set(0, DESK.top, -0.16);
desk.add(monitor);

const stand = box(0.05, 0.2, 0.05, 0x2a2a30, { metalness: 0.5 });
stand.position.y = 0.1;
monitor.add(stand);
const standBase = box(0.22, 0.012, 0.16, 0x2a2a30, { metalness: 0.5 });
standBase.position.y = 0.006;
monitor.add(standBase);

const bezel = box(MONITOR.w + 0.02, MONITOR.h + 0.02, 0.025, 0x0c0c0f);
bezel.position.y = 0.2 + MONITOR.h / 2;
monitor.add(bezel);

const screen = new THREE.Mesh(
  new THREE.PlaneGeometry(MONITOR.w, MONITOR.h),
  new THREE.MeshBasicMaterial({ map: screenTexture(), toneMapped: false }),
);
screen.position.set(0, bezel.position.y, 0.0135);
monitor.add(screen);

const screenGlow = new THREE.PointLight(0x9fb4ff, 1.2, 2.2, 2);
screenGlow.position.set(0, bezel.position.y, 0.3);
monitor.add(screenGlow);

// --- Player: a simple capsule figure.

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.17, 0.55, 6, 16),
  new THREE.MeshStandardMaterial({ color: 0x3b4a6b, roughness: 0.7 }),
);
body.position.y = 0.17 + 0.55 / 2;
body.castShadow = true;
player.add(body);
const head = new THREE.Mesh(
  new THREE.SphereGeometry(0.13, 24, 16),
  new THREE.MeshStandardMaterial({ color: 0xe0b48f, roughness: 0.8 }),
);
head.position.y = 1.03;
head.castShadow = true;
player.add(head);
// A small nose so facing direction is readable.
const nose = new THREE.Mesh(
  new THREE.BoxGeometry(0.04, 0.04, 0.06),
  head.material,
);
nose.position.set(0, 1.03, -0.13);
player.add(nose);
player.position.set(0, 0, 0.8);
scene.add(player);

// --- Collision: clamp to the room, push out of axis-aligned furniture.

const colliders = [
  { minX: -DESK.w / 2, maxX: DESK.w / 2, minZ: -ROOM.d / 2, maxZ: deskZ + DESK.d / 2 },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function resolveCollisions(p) {
  const r = PLAYER_RADIUS;
  p.x = clamp(p.x, -ROOM.w / 2 + r, ROOM.w / 2 - r);
  p.z = clamp(p.z, -ROOM.d / 2 + r, ROOM.d / 2 - r);
  for (const b of colliders) {
    const cx = clamp(p.x, b.minX, b.maxX);
    const cz = clamp(p.z, b.minZ, b.maxZ);
    const dx = p.x - cx;
    const dz = p.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      p.x = cx + (dx / d) * r;
      p.z = cz + (dz / d) * r;
    } else {
      p.z = b.maxZ + r;
    }
  }
}

// --- Input.

const keys = new Set();
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (mode === 'computer') {
    if (k === 'escape') closeComputer();
    return;
  }
  keys.add(k);
  if (k === 'e' && nearDesk) openComputer();
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

document.querySelector('#close').addEventListener('click', closeComputer);

// Clicking or tapping the monitor also opens it, which covers touch devices.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
canvas.addEventListener('pointerdown', (e) => {
  if (mode !== 'walk') return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(screen).length) openComputer();
});

// --- Modes: walking around, or zoomed into the computer.

let mode = 'walk';
let nearDesk = false;

function openComputer() {
  mode = 'computer';
  keys.clear();
  promptEl.hidden = true;
}

function closeComputer() {
  mode = 'walk';
  computerEl.hidden = true;
}

const interactPoint = new THREE.Vector3(0, 0, deskZ + DESK.d / 2 + 0.35);
const screenWorld = new THREE.Vector3();
const camPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();
const roomCenter = new THREE.Vector3(0, 0.9, 0);
const FOLLOW_OFFSET = new THREE.Vector3(0, 2.3, 3.6);

function updateCamera(dt) {
  if (mode === 'computer') {
    screen.getWorldPosition(screenWorld);
    desiredTarget.copy(screenWorld);
    desiredPos.copy(screenWorld).add(new THREE.Vector3(0, 0, 0.62));
  } else {
    desiredTarget.copy(player.position).setY(0.9).lerp(roomCenter, 0.35);
    desiredPos.copy(desiredTarget).add(FOLLOW_OFFSET);
  }
  const t = 1 - Math.exp(-6 * dt);
  camPos.lerp(desiredPos, t);
  camTarget.lerp(desiredTarget, t);
  camera.position.copy(camPos);
  camera.lookAt(camTarget);

  if (mode === 'computer' && computerEl.hidden && camPos.distanceTo(desiredPos) < 0.03) {
    computerEl.hidden = false;
  }
}

// --- Main loop.

const move = new THREE.Vector3();
let walkPhase = 0;

function updatePlayer(dt) {
  move.set(0, 0, 0);
  if (keys.has('w') || keys.has('arrowup')) move.z -= 1;
  if (keys.has('s') || keys.has('arrowdown')) move.z += 1;
  if (keys.has('a') || keys.has('arrowleft')) move.x -= 1;
  if (keys.has('d') || keys.has('arrowright')) move.x += 1;

  const moving = mode === 'walk' && move.lengthSq() > 0;
  if (moving) {
    move.normalize().multiplyScalar(PLAYER_SPEED * dt);
    player.position.add(move);
    resolveCollisions(player.position);

    const targetYaw = Math.atan2(-move.x, -move.z);
    let delta = targetYaw - player.rotation.y;
    delta = Math.atan2(Math.sin(delta), Math.cos(delta));
    player.rotation.y += delta * (1 - Math.exp(-14 * dt));

    walkPhase += dt * 12;
  } else {
    walkPhase = 0;
  }
  const bob = Math.abs(Math.sin(walkPhase)) * 0.04;
  body.position.y = 0.17 + 0.55 / 2 + bob;
  head.position.y = nose.position.y = 1.03 + bob;

  nearDesk = mode === 'walk' && player.position.distanceTo(interactPoint) < INTERACT_DISTANCE;
  promptEl.hidden = !nearDesk;
}

// Start the camera at its resting spot so the first frame doesn't swoop.
desiredTarget.copy(player.position).setY(0.9).lerp(roomCenter, 0.35);
camTarget.copy(desiredTarget);
camPos.copy(desiredTarget).add(FOLLOW_OFFSET);

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  updatePlayer(dt);
  updateCamera(dt);
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
