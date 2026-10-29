import * as THREE from 'three';

const DRAG_SPEED = 0.0042; // radians per pixel
const PITCH_LIMIT = THREE.MathUtils.degToRad(60);
const CLICK_SLOP = 6; // pixels a pointer can move and still count as a click
const FLY_SECONDS = 0.9;

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// The camera stands at a fixed point and looks around it, like
// felixrieseberg.com. Dragging rotates the view; focus() flies to a pose
// next to an object and back() returns to the center.
export class LookControls extends EventTarget {
  constructor(camera, dom, { center, yaw = 0, pitch = 0 }) {
    super();
    this.camera = camera;
    this.dom = dom;
    this.center = new THREE.Vector3(...center);
    this.yaw = yaw;
    this.pitch = pitch;
    this.velocity = new THREE.Vector2();
    this.mode = 'look'; // 'look' | 'flying' | 'focused'
    this.flight = null;
    this.keys = new Set();

    camera.position.copy(this.center);
    this.applyLook();

    this.pointers = new Map();
    dom.addEventListener('pointerdown', (e) => this.onDown(e));
    dom.addEventListener('pointermove', (e) => this.onMove(e));
    dom.addEventListener('pointerup', (e) => this.onUp(e));
    dom.addEventListener('pointercancel', (e) => this.pointers.delete(e.pointerId));
    dom.addEventListener('wheel', (e) => this.onWheel(e), { passive: true });
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement) return;
      this.keys.add(e.key);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key));
    window.addEventListener('blur', () => this.keys.clear());
  }

  onDown(e) {
    this.dom.setPointerCapture(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, moved: false });
    this.velocity.set(0, 0);
  }

  onMove(e) {
    const p = this.pointers.get(e.pointerId);
    if (!p) {
      this.dispatchEvent(Object.assign(new Event('hover'), { clientX: e.clientX, clientY: e.clientY, pointerType: e.pointerType }));
      return;
    }
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (Math.hypot(e.clientX - p.startX, e.clientY - p.startY) > CLICK_SLOP) p.moved = true;
    if (p.moved && this.mode === 'look' && this.pointers.size === 1) {
      this.yaw += dx * DRAG_SPEED;
      this.pitch += dy * DRAG_SPEED;
      this.velocity.set(dx * DRAG_SPEED, dy * DRAG_SPEED);
      this.dom.classList.add('dragging');
    }
  }

  onUp(e) {
    const p = this.pointers.get(e.pointerId);
    this.pointers.delete(e.pointerId);
    this.dom.classList.remove('dragging');
    if (p && !p.moved) {
      this.dispatchEvent(Object.assign(new Event('tap'), { clientX: e.clientX, clientY: e.clientY, pointerType: e.pointerType }));
    }
  }

  onWheel(e) {
    if (this.mode !== 'look') return;
    this.camera.fov = THREE.MathUtils.clamp(this.camera.fov + e.deltaY * 0.02, 45, 75);
    this.camera.updateProjectionMatrix();
  }

  lookQuaternion(target = new THREE.Quaternion()) {
    return target.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }

  applyLook() {
    this.camera.quaternion.copy(this.lookQuaternion());
  }

  // Fly to `position`, looking at `target`. Resolves on arrival.
  focus(position, target) {
    const toQuat = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().lookAt(position, target, new THREE.Vector3(0, 1, 0)),
    );
    return this.fly(position, toQuat, 'focused');
  }

  back() {
    if (this.mode === 'look') return Promise.resolve();
    return this.fly(this.center, this.lookQuaternion(), 'look');
  }

  fly(toPos, toQuat, endMode) {
    this.flight?.resolve();
    this.mode = 'flying';
    this.velocity.set(0, 0);
    return new Promise((resolve) => {
      this.flight = {
        fromPos: this.camera.position.clone(),
        fromQuat: this.camera.quaternion.clone(),
        toPos: toPos.clone(),
        toQuat,
        t: 0,
        endMode,
        resolve,
      };
    });
  }

  update(dt) {
    if (this.flight) {
      const f = this.flight;
      f.t = Math.min(1, f.t + dt / FLY_SECONDS);
      const k = ease(f.t);
      this.camera.position.lerpVectors(f.fromPos, f.toPos, k);
      this.camera.quaternion.slerpQuaternions(f.fromQuat, f.toQuat, k);
      if (f.t >= 1) {
        this.flight = null;
        this.mode = f.endMode;
        f.resolve();
      }
      return;
    }
    if (this.mode !== 'look') return;

    // Arrow keys and A/D look around too, for keyboard users.
    const turn = dt * 1.6;
    if (this.keys.has('ArrowLeft') || this.keys.has('a')) this.yaw += turn;
    if (this.keys.has('ArrowRight') || this.keys.has('d')) this.yaw -= turn;
    if (this.keys.has('ArrowUp') || this.keys.has('w')) this.pitch += turn;
    if (this.keys.has('ArrowDown') || this.keys.has('s')) this.pitch -= turn;

    if (this.pointers.size === 0 && this.velocity.lengthSq() > 1e-8) {
      this.yaw += this.velocity.x;
      this.pitch += this.velocity.y;
      this.velocity.multiplyScalar(Math.exp(-8 * dt));
    }
    this.pitch = THREE.MathUtils.clamp(this.pitch, -PITCH_LIMIT, PITCH_LIMIT);
    this.applyLook();
  }
}
