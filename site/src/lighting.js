import * as THREE from 'three';
import { HALF } from './util.js';

// Two looks from the reference photos: purple LED night, and warm daylight
// through the window. `t` blends between them (0 = night, 1 = day).
const PRESETS = {
  night: {
    hemiSky: 0x8a7cff, hemiGround: 0x2a1a10, hemi: 0.45,
    key: 0x9b5cff, keyIntensity: 0.6,
    led: 5.5, fill: 1.2, view: 0x1a2040, ledStrip: 0xa35cff, exposure: 1.0,
  },
  day: {
    hemiSky: 0xdfe8ff, hemiGround: 0x6a4a30, hemi: 1.3,
    key: 0xfff0d8, keyIntensity: 3.2,
    led: 0.4, fill: 0.5, view: 0xffffff, ledStrip: 0x6a4a8a, exposure: 1.05,
  },
};

export class Lighting {
  constructor(scene, renderer, { windowView, ledStrip }) {
    this.renderer = renderer;
    this.windowView = windowView;
    this.ledStrip = ledStrip;
    this.t = 0;
    this.target = 0;

    this.hemi = new THREE.HemisphereLight();
    scene.add(this.hemi);

    // Key light comes in through the window and casts the only shadows.
    // The scene is static, so shadows only re-render when lighting changes.
    this.key = new THREE.DirectionalLight();
    this.key.position.set(-0.8, 3.6, -4.5);
    this.key.target.position.set(0.2, 0, 0.4);
    this.key.castShadow = true;
    this.key.shadow.mapSize.set(2048, 2048);
    Object.assign(this.key.shadow.camera, { left: -HALF - 0.5, right: HALF + 0.5, top: 3, bottom: -3, near: 1, far: 12 });
    this.key.shadow.bias = -0.0005;
    this.key.shadow.normalBias = 0.02;
    scene.add(this.key, this.key.target);

    this.led = new THREE.PointLight(0x9b5cff, 1, 6, 1.4);
    this.led.position.set(-0.3, 1.0, -1.55);
    scene.add(this.led);

    this.fill = new THREE.PointLight(0xffc48a, 1, 6, 1.5);
    this.fill.position.set(0.6, 2.2, 0.8);
    scene.add(this.fill);

    renderer.shadowMap.autoUpdate = false;
    this.apply();
  }

  toggle() {
    this.target = this.target ? 0 : 1;
  }

  get isDay() {
    return this.target === 1;
  }

  apply() {
    const n = PRESETS.night;
    const d = PRESETS.day;
    const t = this.t;
    const c = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), t);
    const f = (a, b) => a + (b - a) * t;
    this.hemi.color.copy(c(n.hemiSky, d.hemiSky));
    this.hemi.groundColor.copy(c(n.hemiGround, d.hemiGround));
    this.hemi.intensity = f(n.hemi, d.hemi);
    this.key.color.copy(c(n.key, d.key));
    this.key.intensity = f(n.keyIntensity, d.keyIntensity);
    this.led.intensity = f(n.led, d.led);
    this.fill.intensity = f(n.fill, d.fill);
    this.windowView.color.copy(c(n.view, d.view));
    this.ledStrip.color.copy(c(n.ledStrip, d.ledStrip));
    this.renderer.toneMappingExposure = f(n.exposure, d.exposure);
    this.renderer.shadowMap.needsUpdate = true;
  }

  update(dt) {
    if (this.t === this.target) return;
    const step = dt / 1.2;
    this.t = this.target > this.t ? Math.min(this.target, this.t + step) : Math.max(this.target, this.t - step);
    this.apply();
  }
}
