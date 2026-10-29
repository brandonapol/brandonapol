import * as THREE from 'three';

const HOVER_COLOR = new THREE.Color(0xa78bfa);

// Station registry: each interactive object has meshes to hit-test, a camera
// pose to fly to, and an `open` action that runs on arrival.
//
//   stations.add({
//     id, name, hint,
//     object,                     // Object3D (or array) whose meshes are clickable
//     focus: { position, target } // Vector3s; omit for instant actions
//     open(), close()             // close is optional
//   })
export class Stations extends EventTarget {
  constructor({ scene, camera, controls, canvas, tooltip }) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.canvas = canvas;
    this.tooltip = tooltip;
    this.list = [];
    this.byMesh = new Map();
    this.hovered = null;
    this.active = null;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();

    controls.addEventListener('hover', (e) => {
      if (e.pointerType === 'mouse') this.setHovered(this.pick(e.clientX, e.clientY), e);
    });
    controls.addEventListener('tap', (e) => this.onTap(e));
  }

  add(station) {
    station.materials = [];
    for (const root of [station.object].flat()) root.traverse((o) => {
      if (!o.isMesh) return;
      this.byMesh.set(o, station);
      // Clone so hover tint doesn't leak into shared materials.
      if (o.material.emissive) {
        o.material = o.material.clone();
        station.materials.push({ material: o.material, base: o.material.emissive.clone(), intensity: o.material.emissiveIntensity });
      }
    });
    this.list.push(station);
    return station;
  }

  get(id) {
    return this.list.find((s) => s.id === id);
  }

  pick(x, y) {
    this.ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    // Hit-test the whole scene so walls and furniture occlude stations behind them.
    const hit = this.raycaster.intersectObject(this.scene, true).find((h) => h.object.visible && !h.object.userData.noHit);
    return hit ? (this.byMesh.get(hit.object) ?? null) : null;
  }

  setHovered(station, point) {
    if (this.controls.mode !== 'look' || station === this.active) station = null;
    if (station !== this.hovered) {
      this.tint(this.hovered, false);
      this.tint(station, true);
      this.hovered = station;
      this.canvas.style.cursor = station ? 'pointer' : '';
    }
    if (station) {
      this.tooltip.show(station.name, station.hint, point);
    } else {
      this.tooltip.hide();
    }
  }

  tint(station, on) {
    if (!station) return;
    for (const { material, base, intensity } of station.materials) {
      if (on) {
        material.emissive.copy(base).lerp(HOVER_COLOR, 0.5);
        material.emissiveIntensity = Math.max(intensity, 0.35);
      } else {
        material.emissive.copy(base);
        material.emissiveIntensity = intensity;
      }
    }
  }

  onTap(e) {
    const station = this.pick(e.clientX, e.clientY);
    if (this.controls.mode === 'flying') return;
    if (!station) {
      if (this.active) this.close();
      this.setHovered(null);
      return;
    }
    if (station === this.active) return;
    // On touch, the first tap highlights and names it; the second opens it.
    if (e.pointerType !== 'mouse' && this.hovered !== station && this.controls.mode === 'look') {
      this.setHovered(station, e);
      return;
    }
    this.activate(station);
  }

  async activate(station) {
    this.setHovered(null);
    this.dispatchEvent(Object.assign(new Event('visit'), { station }));
    if (!station.focus) {
      station.open();
      return;
    }
    if (this.active) this.active.close?.();
    this.active = station;
    this.dispatchEvent(new Event('focusstart'));
    await this.controls.focus(station.focus.position, station.focus.target);
    if (this.active === station) station.open();
  }

  async close() {
    const station = this.active;
    if (!station) return;
    this.active = null;
    station.close?.();
    this.dispatchEvent(new Event('focusend'));
    await this.controls.back();
  }
}

// Camera pose `distance` meters from `target`, along `dir` (toward the room).
export function focusFrom(target, dir, distance) {
  const t = new THREE.Vector3(...target);
  const d = new THREE.Vector3(...dir).normalize().multiplyScalar(distance);
  return { target: t, position: t.clone().add(d) };
}
