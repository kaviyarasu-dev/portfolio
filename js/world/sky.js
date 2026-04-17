// Sky dome - large inward-facing sphere with a vertical gradient shader.
// Also spawns a sun billboard (always facing camera) for visual anchor.
// Scatters low-poly drifting clouds below the dome (see buildClouds).

import { game } from '../state.js';
import {
  SKY_TOP_DAY, SKY_MID_DAY, SKY_BOTTOM_DAY,
  SKY_TOP_DUSK, SKY_MID_DUSK, SKY_BOTTOM_DUSK,
  SKY_TOP_NIGHT, SKY_MID_NIGHT, SKY_BOTTOM_NIGHT
} from '../config.js';
import { mergeGeometries } from '../util/three.js';

const SKY_VS = `
varying vec3 vWorldPos;
void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FS = `
varying vec3 vWorldPos;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uBot;
void main() {
  float h = normalize(vWorldPos).y;
  vec3 col;
  if (h > 0.0) {
    col = mix(uMid, uTop, smoothstep(0.0, 0.7, h));
  } else {
    col = mix(uMid, uBot, smoothstep(0.0, 0.35, -h));
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

export const Sky = {
  mesh: null,
  sunBillboard: null,
  uniforms: null,
  clouds: null,
  cloudMat: null,
  cloudWind: null
};

const CLOUD_BATCH_COUNT = 3;
const CLOUD_INSTANCES_PER_BATCH = 8;
const CLOUD_SCATTER_RADIUS = 240;
const CLOUD_ALTITUDE_MIN = 85;
const CLOUD_ALTITUDE_MAX = 120;
const CLOUD_WIND_SPEED = 0.35;
const CLOUD_WRAP_RADIUS = 260;
const CLOUD_EMISSIVE_DAY = 0.08;
const CLOUD_EMISSIVE_DUSK = 0.05;
const CLOUD_EMISSIVE_NIGHT = 0.02;
const CLOUD_TINT_DAY = 0xffffff;
const CLOUD_TINT_DUSK = 0xffb58c;
const CLOUD_TINT_NIGHT = 0x5c6780;

let cloudLastTime = 0;

function seedRngClouds(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    if (s <= 0) s += 2147483646;
    return s / 2147483647;
  };
}

function buildCloudPrototype(rng) {
  // 8-12 puffs per prototype: inner cluster (larger, central) + feather puffs
  // (smaller, outer) that give wispy silhouette edges. Puff colors use a
  // stepped 3-tone gradient (shadow / mid / top) so flatShading keeps facets.
  const puffs = [];
  const puffCount = 8 + Math.floor(rng() * 5);
  for (let p = 0; p < puffCount; p++) {
    const isFeather = p >= 6;
    const r = isFeather ? (1.0 + rng() * 0.6) : (1.8 + rng() * 1.4);
    const geo = new THREE.IcosahedronGeometry(r, 0);
    const xSpread = isFeather ? 5.5 : 4.2;
    const ySpread = isFeather ? 0.8 : 1.2;
    const zSpread = isFeather ? 5.5 : 4.2;
    geo.translate((rng() - 0.5) * xSpread, (rng() - 0.5) * ySpread, (rng() - 0.5) * zSpread);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let v = 0; v < pos.count; v++) {
      const yLocal = pos.getY(v);
      const yNorm = Math.min(1, Math.max(0, (yLocal / Math.max(0.001, r) + 1.0) * 0.5));
      let tone;
      let rMul = 1, gMul = 1, bMul = 1;
      if (yNorm < 0.35) {
        tone = 0.72;           // shadow underside
        rMul = 0.96; bMul = 1.04; // cool shadow
      } else if (yNorm < 0.7) {
        tone = 0.86;           // mid band
      } else {
        tone = 1.0;            // sunlit top
      }
      colors[v * 3]     = Math.min(1, tone * rMul);
      colors[v * 3 + 1] = Math.min(1, tone * gMul);
      colors[v * 3 + 2] = Math.min(1, tone * bMul);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    puffs.push(geo);
  }
  return mergeGeometries(puffs);
}

function lerpScalar(a, b, t) { return a + (b - a) * t; }

export function buildClouds() {
  const rng = seedRngClouds(49211);
  const clouds = [];
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: CLOUD_EMISSIVE_DAY,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    fog: true,
    vertexColors: true
  });
  const dummy = new THREE.Object3D();
  const cloudTint = new THREE.Color();
  for (let b = 0; b < CLOUD_BATCH_COUNT; b++) {
    const proto = buildCloudPrototype(rng);
    const inst = new THREE.InstancedMesh(proto, mat, CLOUD_INSTANCES_PER_BATCH);
    inst.name = 'clouds-' + b;
    inst.castShadow = false;
    inst.receiveShadow = false;
    inst.frustumCulled = false;
    for (let i = 0; i < CLOUD_INSTANCES_PER_BATCH; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = rng() * CLOUD_SCATTER_RADIUS;
      dummy.position.set(
        Math.cos(ang) * rad,
        CLOUD_ALTITUDE_MIN + rng() * (CLOUD_ALTITUDE_MAX - CLOUD_ALTITUDE_MIN),
        Math.sin(ang) * rad
      );
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      const s = 0.75 + rng() * 0.9;
      dummy.scale.set(s, s * (0.55 + rng() * 0.3), s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      // Per-instance warm/cool tint: half the clouds lean warm (R up, B down),
      // half lean cool. Shift capped at ±4% so day/dusk/night material tint
      // pipeline still dominates the overall color.
      const warmBias = (rng() - 0.5) * 0.08;
      cloudTint.setRGB(1.0 + warmBias, 1.0, 1.0 - warmBias);
      inst.setColorAt(i, cloudTint);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    clouds.push(inst);
    game.scene.add(inst);
  }
  Sky.clouds = clouds;
  Sky.cloudMat = mat;
  Sky.cloudWind = new THREE.Vector3(1, 0, 0.3).normalize();
  cloudLastTime = performance.now();
  return clouds;
}

function driftClouds(phase) {
  if (!Sky.clouds) return;
  const now = performance.now();
  const dt = cloudLastTime ? Math.min(100, now - cloudLastTime) : 16;
  cloudLastTime = now;
  const step = CLOUD_WIND_SPEED * (dt / 1000);
  const dx = Sky.cloudWind.x * step;
  const dz = Sky.cloudWind.z * step;
  const wrap = CLOUD_WRAP_RADIUS;

  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (const inst of Sky.clouds) {
    for (let i = 0; i < inst.count; i++) {
      inst.getMatrixAt(i, m);
      m.decompose(pos, quat, scl);
      pos.x += dx;
      pos.z += dz;
      if (pos.x > wrap)       pos.x -= wrap * 2;
      else if (pos.x < -wrap) pos.x += wrap * 2;
      if (pos.z > wrap)       pos.z -= wrap * 2;
      else if (pos.z < -wrap) pos.z += wrap * 2;
      m.compose(pos, quat, scl);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  if (Sky.cloudMat) {
    let targetIntensity = CLOUD_EMISSIVE_DAY;
    let targetColorHex = CLOUD_TINT_DAY;
    if (phase === 'dusk')       { targetIntensity = CLOUD_EMISSIVE_DUSK;  targetColorHex = CLOUD_TINT_DUSK; }
    else if (phase === 'night') { targetIntensity = CLOUD_EMISSIVE_NIGHT; targetColorHex = CLOUD_TINT_NIGHT; }
    Sky.cloudMat.emissiveIntensity = lerpScalar(Sky.cloudMat.emissiveIntensity, targetIntensity, 0.04);
    const targetColor = new THREE.Color(targetColorHex);
    Sky.cloudMat.color.lerp(targetColor, 0.04);
  }
}

export function buildSky() {
  const uniforms = {
    uTop: { value: new THREE.Color(SKY_TOP_DAY) },
    uMid: { value: new THREE.Color(SKY_MID_DAY) },
    uBot: { value: new THREE.Color(SKY_BOTTOM_DAY) }
  };
  Sky.uniforms = uniforms;

  const geo = new THREE.SphereGeometry(480, 32, 16);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SKY_VS,
    fragmentShader: SKY_FS,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  game.skyMesh = mesh;
  Sky.mesh = mesh;
  game.scene.add(mesh);

  // Sun disc
  const sunGeo = new THREE.SphereGeometry(3.2, 24, 16);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c4,
    fog: false,
    transparent: true,
    opacity: 0.95
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.name = 'sunDisc';
  Sky.sunBillboard = sun;
  game.scene.add(sun);

  buildClouds();

  return mesh;
}

// Update sky colors + sun position based on sun direction (normalized).
export function updateSky(sunDir, phase) {
  if (!Sky.uniforms) return;
  const topA = new THREE.Color(), midA = new THREE.Color(), botA = new THREE.Color();
  if (phase === 'day') {
    topA.setHex(SKY_TOP_DAY); midA.setHex(SKY_MID_DAY); botA.setHex(SKY_BOTTOM_DAY);
  } else if (phase === 'dusk') {
    topA.setHex(SKY_TOP_DUSK); midA.setHex(SKY_MID_DUSK); botA.setHex(SKY_BOTTOM_DUSK);
  } else {
    topA.setHex(SKY_TOP_NIGHT); midA.setHex(SKY_MID_NIGHT); botA.setHex(SKY_BOTTOM_NIGHT);
  }
  Sky.uniforms.uTop.value.copy(topA);
  Sky.uniforms.uMid.value.copy(midA);
  Sky.uniforms.uBot.value.copy(botA);

  if (Sky.sunBillboard && sunDir) {
    const dist = 380;
    Sky.sunBillboard.position.set(sunDir.x * dist, sunDir.y * dist, sunDir.z * dist);
    // Color shift through the day
    const col = Sky.sunBillboard.material.color;
    if (phase === 'dusk')      col.setHex(0xff9a4a);
    else if (phase === 'night') col.setHex(0xd9dcff);
    else                        col.setHex(0xfff0c4);
  }

  driftClouds(phase);
}
