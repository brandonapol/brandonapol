import * as THREE from 'three';
import './style.css';
import { HALF } from './util.js';
import { stations as copy, finale } from './content.js';
import { LookControls } from './controls.js';
import { Stations, focusFrom } from './stations.js';
import { Tooltip, Card, Quest, el } from './ui.js';
import { Terminal } from './terminal.js';
import { Lighting } from './lighting.js';
import { sound, playParadiddle } from './audio.js';
import { buildRoom, wallFrame, DOOR } from './props/room.js';
import { buildDesk, DESK } from './props/desk.js';
import { buildShelves } from './props/shelves.js';
import { buildGear, pack } from './props/gear.js';
import { buildCooler, buildFloorLamp, buildMonstera, buildGuitar, buildPracticePad, buildPosters, buildLightSwitch } from './props/decor.js';
import { buildLavaLamp } from './props/lavalamp.js';
import { buildTopoMap } from './props/topo.js';

const canvas = document.querySelector('#scene');

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
} catch {
  document.querySelector('#nowebgl').hidden = false;
  throw new Error('WebGL unavailable');
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0714);

const camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.03, 30);
const controls = new LookControls(camera, canvas, { center: [0, 1.55, 0.3], yaw: 0, pitch: -0.18 });

// --- Build the room.

const room = buildRoom(scene);
const desk = buildDesk(scene);
const shelves = buildShelves(scene);
const gear = buildGear(scene);
const posters = buildPosters(scene);

const cooler = buildCooler();
// Big pack in the corner, the cooler next to it along the west wall.
const cornerPack = pack(0x26302a, 0.4, 0.72, 0.3);
cornerPack.position.set(-1.6, 0, -1.6);
cornerPack.rotation.set(-0.06, 0.6, 0);
scene.add(cornerPack);
cooler.position.set(-1.58, 0, -0.98);
cooler.rotation.y = Math.PI / 2 + 0.05;
scene.add(cooler);


const floorLamp = buildFloorLamp();
floorLamp.position.set(HALF - 0.24, 0, 0.14);
scene.add(floorLamp);

const monstera = buildMonstera();
monstera.position.set(1.42, 0, -1.42);
scene.add(monstera);

const guitar = buildGuitar();
guitar.position.set(-1.5, 0, 1.48);
guitar.rotation.y = Math.atan2(1.5, -1.2);
scene.add(guitar);

const pad = buildPracticePad();
pad.position.set(-1.36, 0, 0.98);
scene.add(pad);

const lava = buildLavaLamp();
lava.group.position.set(shelves.lavaAnchor.u, shelves.lavaAnchor.y, shelves.lavaAnchor.z);
shelves.lavaAnchor.frame.add(lava.group);

const topo = buildTopoMap();
const east = wallFrame('east');
topo.group.position.set(0.47, 1.62, 0);
east.add(topo.group);
const lightSwitch = buildLightSwitch();
lightSwitch.group.position.set(0.85, 1.15, 0);
east.add(lightSwitch.group);
scene.add(east);

// The doorway itself is a station: an invisible panel filling the opening.
const doorway = new THREE.Mesh(
  new THREE.PlaneGeometry(DOOR.x1 - DOOR.x0, DOOR.y1 - DOOR.y0),
  new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
);
doorway.position.set((DOOR.x0 + DOOR.x1) / 2, (DOOR.y0 + DOOR.y1) / 2, -0.06);
east.add(doorway);

const lighting = new Lighting(scene, renderer, { windowView: room.window.view, ledStrip: room.led });

// --- UI.

const tooltip = new Tooltip(document.querySelector('#tooltip'));
const stations = new Stations({ scene, camera, controls, canvas, tooltip });
const card = new Card(document.querySelector('#card'), { onBack: () => back() });
const terminal = new Terminal(document.querySelector('#computer'), { onExit: () => back() });

let finaleQueued = false;
function back() {
  if (stations.active) stations.close();
  else card.close();
}

function cardStation(id, object, focus, { extra, onOpen, onClose } = {}) {
  return stations.add({
    id,
    name: copy[id].name,
    hint: copy[id].hint,
    object,
    focus,
    open() {
      card.open(copy[id], extra?.());
      onOpen?.();
    },
    close() {
      card.close();
      onClose?.();
    },
  });
}

// --- Stations.

stations.add({
  id: 'computer',
  name: copy.computer.name,
  hint: copy.computer.hint,
  object: desk.computer,
  focus: focusFrom([0.08, desk.screenCenterY, DESK.z - 0.19], [0, 0, 1], 0.6),
  open: () => terminal.open(),
  close: () => terminal.close(),
});

cardStation('keyboard', desk.keyboard, focusFrom([0, DESK.top + 0.03, DESK.z + 0.14], [0, 1.1, 1], 0.6));
cardStation('cooler', cooler, focusFrom([-1.58, 0.3, -0.98], [1, 0.9, 0.25], 1.0));
cardStation('guitar', guitar, focusFrom([-1.5, 0.6, 1.45], [1.5, 0.4, -1.2], 1.05));

let spinning = false;
cardStation('records', shelves.records.objects, focusFrom([-0.72, 0.85, HALF - 0.2], [0, 0.55, -1], 0.95), {
  extra: () => {
    const allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    return el(
      'div',
      { class: 'embeds' },
      el('iframe', { src: copy.records.featuredEmbed, height: '152', loading: 'lazy', title: 'Now spinning on Spotify', allow }),
      el('iframe', { src: copy.records.spotifyEmbed, height: '352', loading: 'lazy', title: 'Brandon’s Record Collection on Spotify', allow }),
    );
  },
  onOpen: () => (spinning = true),
  onClose: () => (spinning = false),
});

cardStation('library', shelves.books, focusFrom([-0.85, 1.3, HALF - 0.15], [0.1, 0.1, -1], 1.25));
cardStation('climbs', gear.gear, focusFrom([0.72, 1.05, HALF - 0.25], [-0.2, 0.25, -1], 1.6));
cardStation('topo', topo.group, focusFrom([HALF - 0.03, 1.62, 0.47], [-1, 0, 0], 0.85));
cardStation('photos', posters.frames, focusFrom([1.27, 1.78, -HALF + 0.02], [-0.15, 0, 1], 1.15));
cardStation('poster', posters.poster, focusFrom([-1.4, 1.55, -HALF + 0.02], [0.25, 0, 1], 1.05));

cardStation('pad', pad, focusFrom([-1.36, 0.76, 0.98], [1, 1.1, -0.4], 0.85), {
  extra: () =>
    el('div', { class: 'links' }, el('button', { type: 'button', class: 'button', onclick: () => drum() }, '▶ play it again')),
  onOpen: () => drum(),
});
function drum() {
  if (playParadiddle()) return;
  // Muted: point at the sound toggle instead.
  soundButton.classList.remove('flash');
  void soundButton.offsetWidth;
  soundButton.classList.add('flash');
}

cardStation('lavalamp', lava.group, focusFrom([-HALF + 0.15, 1.84, 0.04], [1, -0.25, 0], 0.75), {
  extra: () => {
    const code = el('code', { class: 'hash' }, '…');
    lava.entropy().then((h) => (code.textContent = h)).catch(() => (code.textContent = 'crypto.subtle unavailable here'));
    return code;
  },
});

cardStation('doorway', doorway, focusFrom([HALF + 0.4, 1.15, (DOOR.x0 + DOOR.x1) / 2], [-1, 0.1, -0.35], 1.9));

stations.add({
  id: 'lights',
  name: copy.lights.name,
  hint: copy.lights.hint,
  object: lightSwitch.group,
  open() {
    lighting.toggle();
    lightSwitch.toggle.position.y = lighting.isDay ? -0.008 : 0.008;
  },
});

const quest = new Quest(document.querySelector('#quest'), {
  stations: stations.list.map((s) => ({ id: s.id, name: s.name })),
  onComplete: () => (finaleQueued = true),
});
stations.addEventListener('visit', (e) => {
  quest.mark(e.station.id);
  // The light switch has no card to close, so show the finale right away.
  if (finaleQueued && !e.station.focus) showFinale();
});
stations.addEventListener('focusend', () => {
  if (finaleQueued) setTimeout(showFinale, 900);
});
function showFinale() {
  if (!finaleQueued) return;
  finaleQueued = false;
  card.open(finale);
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && (stations.active || card.isOpen)) back();
});

const soundButton = document.querySelector('#sound');
const renderSound = () => {
  soundButton.textContent = sound.muted ? 'sound: off' : 'sound: on';
  soundButton.setAttribute('aria-pressed', String(!sound.muted));
};
soundButton.addEventListener('click', () => {
  sound.muted = !sound.muted;
  renderSound();
});
renderSound();

// --- Loop.

topo.ready.then(() => (renderer.shadowMap.needsUpdate = true));

const timer = new THREE.Timer();
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const raw = timer.getDelta();
  const dt = Math.min(raw, 0.05);
  const t = timer.getElapsed();
  // Flights keep their real duration even when frames are slow.
  controls.update(Math.min(raw, 0.25));
  lighting.update(dt);
  lava.update(t);
  if (spinning) shelves.records.platter.rotation.y -= dt * 3.49; // 33⅓ rpm
  shelves.records.arm.rotation.y += ((spinning ? 0.62 : 0.35) - shelves.records.arm.rotation.y) * Math.min(1, dt * 4);
  renderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Handles for the e2e tests (and curious people in devtools).
window.__office = { THREE, camera, controls, stations, lighting, quest };

// For quick manual testing: ?open=<station id>, ?look=<yaw>,<pitch> (radians)
const params = new URLSearchParams(location.search);
const look = params.get('look')?.split(',').map(Number);
if (look?.length === 2) [controls.yaw, controls.pitch] = look;
if (params.get('day')) lighting.target = lighting.t = 1;
const open = params.get('open');
if (open && stations.get(open)) setTimeout(() => stations.activate(stations.get(open)), 300);
