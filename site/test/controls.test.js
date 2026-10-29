import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { LookControls } from '../src/controls.js';
import { Stations, focusFrom } from '../src/stations.js';

let dom;
let camera;
let controls;

const pointer = (type, x, y, id = 1) =>
  dom.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'mouse', bubbles: true }));

// Run the loop until any flight lands.
const settle = (frames = 200) => {
  for (let i = 0; i < frames; i++) controls.update(1 / 60);
};

beforeEach(() => {
  dom = document.createElement('canvas');
  dom.setPointerCapture = () => {};
  document.body.replaceChildren(dom);
  camera = new THREE.PerspectiveCamera(60, 1, 0.1, 50);
  controls = new LookControls(camera, dom, { center: [0, 1.5, 0] });
});

describe('LookControls', () => {
  it('turns the view when dragged and keeps the camera in place', () => {
    pointer('pointerdown', 100, 100);
    pointer('pointermove', 160, 100);
    pointer('pointerup', 160, 100);
    expect(controls.yaw).toBeGreaterThan(0.2);
    expect(camera.position.toArray()).toEqual([0, 1.5, 0]);
  });

  it('clamps pitch', () => {
    pointer('pointerdown', 0, 0);
    pointer('pointermove', 0, 5000);
    settle();
    expect(controls.pitch).toBeLessThanOrEqual(THREE.MathUtils.degToRad(60) + 1e-9);
  });

  it('treats a still press as a tap, not a drag', () => {
    const tap = vi.fn();
    controls.addEventListener('tap', tap);
    pointer('pointerdown', 50, 50);
    pointer('pointermove', 52, 51);
    pointer('pointerup', 52, 51);
    expect(tap).toHaveBeenCalledTimes(1);
    expect(controls.yaw).toBe(0);
  });

  it('flies to a focus pose and back to center', async () => {
    const target = new THREE.Vector3(1, 1, -2);
    const position = new THREE.Vector3(1, 1, -1);
    const arrived = controls.focus(position, target);
    settle();
    await arrived;
    expect(controls.mode).toBe('focused');
    expect(camera.position.distanceTo(position)).toBeLessThan(1e-6);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    expect(forward.dot(target.clone().sub(position).normalize())).toBeGreaterThan(0.999);

    const back = controls.back();
    settle();
    await back;
    expect(controls.mode).toBe('look');
    expect(camera.position.toArray()).toEqual([0, 1.5, 0]);
  });
});

describe('Stations', () => {
  it('opens a station when its mesh is tapped, and closes on an empty tap', async () => {
    window.innerWidth = 800;
    window.innerHeight = 800;
    const scene = new THREE.Scene();
    const target = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshStandardMaterial());
    target.position.set(0, 1.5, -2);
    scene.add(target);
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();

    const tooltip = { show: vi.fn(), hide: vi.fn() };
    const stations = new Stations({ scene, camera, controls, canvas: dom, tooltip });
    const open = vi.fn();
    const close = vi.fn();
    stations.add({ id: 'box', name: 'Box', hint: 'h', object: target, focus: focusFrom([0, 1.5, -2], [0, 0, 1], 0.8), open, close });
    const visited = vi.fn();
    stations.addEventListener('visit', visited);

    pointer('pointerdown', 400, 400);
    pointer('pointerup', 400, 400);
    expect(visited).toHaveBeenCalled();
    settle();
    await Promise.resolve();
    await Promise.resolve();
    expect(open).toHaveBeenCalled();
    expect(stations.active?.id).toBe('box');

    camera.updateMatrixWorld();
    pointer('pointerdown', 5, 5);
    pointer('pointerup', 5, 5);
    expect(close).toHaveBeenCalled();
    expect(stations.active).toBeNull();
  });

  it('places focus poses along a direction from the target', () => {
    const { position, target } = focusFrom([1, 2, 3], [0, 0, 2], 0.5);
    expect(target.toArray()).toEqual([1, 2, 3]);
    expect(position.toArray()).toEqual([1, 2, 3.5]);
  });
});
