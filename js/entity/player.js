// Procedural third-person character. Smooth humanoid built from capsule limbs
// and a flattened capsule torso; trailing cape simulated as a 4-segment verlet
// chain. Animation operates on limb-group rotations so the anatomy swap leaves
// the walk/sprint cycle untouched.

import { game } from '../state.js';
import { PALETTE } from '../config.js';
import { makeBox } from '../util/three.js';

export const PlayerRig = {
  root: null,
  body: null,
  torso: null,
  head: null,
  larm: null,
  rarm: null,
  lleg: null,
  rleg: null,
  satchel: null,
  capeSegs: []
};

function buildFabricRoughnessTexture() {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const weave = 0.5 + 0.5 * Math.sin(x * 0.8 + Math.sin(y * 0.6) * 1.5);
      const rnd = Math.abs(Math.sin(x * 12.9898 + y * 78.233) * 43758.5) % 1;
      const value = Math.max(0, Math.min(1, weave * 0.55 + rnd * 0.45));
      const grey = 110 + Math.round(value * 110);
      const idx = (y * size + x) * 4;
      img.data[idx]     = grey;
      img.data[idx + 1] = grey;
      img.data[idx + 2] = grey;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  return tex;
}

function buildFaceTexture() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);
  // Eyes — dark almond dots
  ctx.fillStyle = '#1c120c';
  ctx.beginPath();
  ctx.arc(22, 28, 3.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(42, 28, 3.6, 0, Math.PI * 2);
  ctx.fill();
  // Eyebrow hints — short strokes
  ctx.fillStyle = '#3a2820';
  ctx.fillRect(17, 21, 10, 2);
  ctx.fillRect(37, 21, 10, 2);
  // Mouth — gentle arc
  ctx.strokeStyle = '#6a2e1e';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(32, 42, 6.5, 0.18 * Math.PI, 0.82 * Math.PI);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

function buildHairTuft(colorHex) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.88,
    flatShading: true
  });
  // First 5 puffs form the crown/back; last 2 are front fringe pieces sitting
  // ABOVE the face plane (y >= 0.16) so they never overlap the eyes/mouth.
  const puffs = [
    { r: 0.19, x:  0.00, y: 0.10, z:  0.00 },
    { r: 0.14, x: -0.10, y: 0.07, z:  0.05 },
    { r: 0.14, x:  0.10, y: 0.07, z:  0.05 },
    { r: 0.12, x:  0.00, y: 0.14, z: -0.08 },
    { r: 0.10, x:  0.08, y: 0.17, z: -0.02 },
    { r: 0.09, x:  0.04, y: 0.19, z:  0.14 },
    { r: 0.07, x: -0.08, y: 0.21, z:  0.12 }
  ];
  for (const p of puffs) {
    const geo = new THREE.IcosahedronGeometry(p.r, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setX(i, pos.getX(i) + Math.sin(i * 1.7) * 0.02);
      pos.setY(i, pos.getY(i) + Math.sin(i * 2.3) * 0.02);
      pos.setZ(i, pos.getZ(i) + Math.sin(i * 3.1) * 0.02);
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.position.set(p.x, p.y, p.z);
    group.add(mesh);
  }
  return group;
}

export function buildPlayer() {
  const root = new THREE.Group(); root.name = 'player';
  const body = new THREE.Group(); body.name = 'body';
  root.add(body);

  const skinCol = 0xf1c27d;
  const shirtCol = 0x2b6fc7;
  const pantsCol = 0x2a3045;
  const hairCol = 0x3a2820;
  const capeCol = PALETTE.accentViolet;

  const fabricRough = buildFabricRoughnessTexture();

  // Torso — capsule widened at shoulders, flattened front-to-back
  const torsoGeo = new THREE.CapsuleGeometry(0.24, 0.42, 6, 14);
  const torsoMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shirtCol),
    roughness: 0.92,
    roughnessMap: fabricRough,
    metalness: 0
  });
  const torso = new THREE.Mesh(torsoGeo, torsoMat);
  // Slimmer, slightly taller torso — shoulders wider than waist for adult proportions.
  // Width ratio < 1.25 means shoulder balls actually read as "broader" than chest.
  torso.scale.set(1.08, 1.05, 0.7);
  torso.position.y = 1.05;
  torso.castShadow = true;
  torso.receiveShadow = true;
  body.add(torso);
  PlayerRig.torso = torso;

  // Upper-chest pad — attached to BODY (not scaled torso) so it reads as a
  // pectoral bulge rather than a squished capsule. Gives the character a less
  // egg-shaped silhouette from the front.
  const chestGeo = new THREE.SphereGeometry(0.22, 16, 12);
  const chest = new THREE.Mesh(chestGeo, torsoMat);
  chest.scale.set(1.15, 0.6, 0.7);
  chest.position.set(0, 1.32, 0.02);
  chest.castShadow = true;
  body.add(chest);

  // Shoulder caps — spheres attached to BODY (not the scaled torso), matching
  // the arm-group origins so the shoulder joint reads as one continuous shape.
  const shoulderGeo = new THREE.SphereGeometry(0.12, 14, 10);
  const leftShoulder = new THREE.Mesh(shoulderGeo, torsoMat);
  leftShoulder.position.set(-0.34, 1.42, 0);
  leftShoulder.castShadow = true;
  body.add(leftShoulder);
  const rightShoulder = new THREE.Mesh(shoulderGeo, torsoMat);
  rightShoulder.position.set(0.34, 1.42, 0);
  rightShoulder.castShadow = true;
  body.add(rightShoulder);

  // Neck
  const skinMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(skinCol),
    roughness: 0.55
  });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.13, 14), skinMat);
  neck.position.y = 1.52;
  neck.castShadow = true;
  body.add(neck);

  // Head — elongated sphere + layered tuft + thin face plane (eyes/brow/mouth)
  const head = new THREE.Group();
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.23, 24, 18), skinMat);
  skull.scale.y = 1.05;
  skull.castShadow = true;
  head.add(skull);

  // Face plane — sits just outside the skull surface (r=0.23, plane at z=0.236)
  // with polygonOffset as z-fight insurance. Smaller than head width so fringe
  // puffs above y=+0.09 never intersect its bbox.
  const faceTex = buildFaceTexture();
  const faceMat = new THREE.MeshStandardMaterial({
    map: faceTex,
    transparent: true,
    alphaTest: 0.5,
    roughness: 0.7,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.2), faceMat);
  facePlane.position.set(0, -0.04, 0.236);
  facePlane.castShadow = false;
  facePlane.receiveShadow = false;
  head.add(facePlane);

  head.add(buildHairTuft(hairCol));
  head.position.y = 1.66;
  body.add(head);
  PlayerRig.head = head;

  const sleeveMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(shirtCol),
    roughness: 0.9,
    roughnessMap: fabricRough
  });
  const pantsMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(pantsCol),
    roughness: 0.94,
    roughnessMap: fabricRough
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.woodDark),
    roughness: 0.62,
    metalness: 0.15
  });

  function buildArm(side) {
    const group = new THREE.Group();
    // Longer sleeve so hand reaches upper-thigh when arm hangs — more adult proportions.
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.48, 4, 10), sleeveMat);
    arm.position.y = -0.33;
    arm.castShadow = true;
    group.add(arm);
    // Elbow joint bulge — slightly thicker than sleeve so it pokes through visually.
    const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 10), sleeveMat);
    elbow.position.y = -0.33;
    elbow.castShadow = true;
    group.add(elbow);
    // Hand — horizontal capsule reads as a closed fist (visible at default zoom).
    const handGeo = new THREE.CapsuleGeometry(0.062, 0.05, 4, 10);
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.rotation.x = Math.PI / 2;
    hand.position.set(0, -0.64, 0.015);
    hand.castShadow = true;
    group.add(hand);
    group.position.set(side * 0.34, 1.42, 0);
    return group;
  }
  const larm = buildArm(-1); body.add(larm); PlayerRig.larm = larm;
  const rarm = buildArm( 1); body.add(rarm); PlayerRig.rarm = rarm;

  function buildLeg(side) {
    const group = new THREE.Group();
    // Longer leg capsule — lowers foot closer to ground, reduces the "floating" look.
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.56, 4, 10), pantsMat);
    leg.position.y = -0.35;
    leg.castShadow = true;
    group.add(leg);
    // Knee joint bulge — fabric-colored sphere at mid-leg.
    const knee = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), pantsMat);
    knee.position.y = -0.32;
    knee.castShadow = true;
    group.add(knee);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.15, 0.3), bootMat);
    boot.position.set(0, -0.73, 0.05);
    boot.castShadow = true;
    group.add(boot);
    group.position.set(side * 0.14, 0.85, 0);
    return group;
  }
  const lleg = buildLeg(-1); body.add(lleg); PlayerRig.lleg = lleg;
  const rleg = buildLeg( 1); body.add(rleg); PlayerRig.rleg = rleg;

  // Belt — attached to BODY group (not scaled torso) so it doesn't distort.
  // Slightly wider/deeper than the torso cross-section at waist height so it
  // reads as a thin leather band around the outside.
  const beltMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.woodDark),
    roughness: 0.72,
    metalness: 0.1
  });
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.42), beltMat);
  belt.position.set(0, 0.96, 0);
  belt.castShadow = true;
  belt.receiveShadow = true;
  body.add(belt);

  // Satchel — slung over right shoulder
  const satchel = makeBox(0.22, 0.3, 0.12, PALETTE.woodDark, { roughness: 0.85 });
  satchel.position.set(-0.2, 0.95, 0.12);
  satchel.rotation.z = 0.15;
  body.add(satchel);
  PlayerRig.satchel = satchel;

  // Cape — 4 segmented planes (3x2 subdiv for subtle bend), verlet-animated
  const capeMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(capeCol),
    roughness: 0.78,
    roughnessMap: fabricRough,
    side: THREE.DoubleSide,
    emissive: new THREE.Color(capeCol),
    emissiveIntensity: 0.12
  });
  PlayerRig.capeSegs = [];
  for (let i = 0; i < 4; i++) {
    const seg = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.28, 3, 2), capeMat);
    seg.castShadow = true;
    body.add(seg);
    PlayerRig.capeSegs.push({
      mesh: seg,
      x: 0, y: 1.4 - i * 0.3, z: -0.2,
      px: 0, py: 1.4 - i * 0.3, pz: -0.2
    });
  }

  // Spawn
  root.position.set(0, 0, 10);
  game.scene.add(root);

  game.player.root = root;
  game.player.body = body;
  game.player.position = root.position;
  game.player.velocity = new THREE.Vector3();
  game.player.facing = 0;
  game.player.targetFacing = 0;
  game.player.walkPhase = 0;
  game.player.speed = 0;
  game.player.moving = false;
  game.player.sprinting = false;

  PlayerRig.root = root;
  PlayerRig.body = body;
  return root;
}

export function animatePlayer(dt) {
  const p = game.player;
  if (!p.body) return;

  const dtS = dt / 1000;
  const speedNorm = Math.min(1.2, p.speed / 4.0);

  // Smooth walkPhase advance. Idle still bobs gently.
  const freq = 1.8 + speedNorm * 3.6;
  if (p.moving) p.walkPhase += dtS * freq;

  const sw = Math.sin(p.walkPhase);
  const swR = Math.cos(p.walkPhase);

  // Legs
  if (p.moving) {
    PlayerRig.lleg.rotation.x = sw * 0.9;
    PlayerRig.rleg.rotation.x = -sw * 0.9;
  } else {
    PlayerRig.lleg.rotation.x *= 0.85;
    PlayerRig.rleg.rotation.x *= 0.85;
  }

  // Arms (counter-swing)
  const armAmp = p.moving ? 0.7 : 0.05;
  PlayerRig.larm.rotation.x = -sw * armAmp;
  PlayerRig.rarm.rotation.x = sw * armAmp;
  PlayerRig.larm.rotation.z = 0.05 + (p.sprinting ? 0.08 : 0);
  PlayerRig.rarm.rotation.z = -0.05 - (p.sprinting ? 0.08 : 0);

  // Slight body lean forward when sprinting
  const leanTarget = p.sprinting && p.moving ? 0.12 : 0;
  p.body.rotation.x += (leanTarget - p.body.rotation.x) * Math.min(1, dtS * 6);

  // Head bob
  if (PlayerRig.head) {
    PlayerRig.head.position.y = 1.66 + (p.moving ? Math.abs(sw) * 0.03 : 0);
  }

  // Vertical bob of whole body
  p.body.position.y = p.moving ? Math.abs(sw) * 0.07 : 0;

  // Cape simulation (verlet)
  updateCape(dtS);

  // Face player body toward facing angle (with smoothing from controller).
  p.body.rotation.y = p.facing;
}

function updateCape(dtS) {
  // Anchor at player center-back, segments fall behind.
  const root = PlayerRig.root;
  if (!root) return;
  const anchorX = 0;
  const anchorY = 1.35;
  const anchorZ = -0.15;

  const segs = PlayerRig.capeSegs;
  const gravity = -9.8;
  const wind = Math.sin(performance.now() * 0.001) * 0.8;
  // Player motion creates drag; simulate drag backward in local space.
  const back = -Math.min(1, game.player.speed / 3) * 1.4;

  // Integrate each segment (verlet) in local body-space.
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const vx = (s.x - s.px);
    const vy = (s.y - s.py);
    const vz = (s.z - s.pz);
    s.px = s.x;
    s.py = s.y;
    s.pz = s.z;
    s.x += vx * 0.92 + wind * 0.002;
    s.y += vy * 0.92 + gravity * dtS * dtS * 0.25;
    s.z += vz * 0.92 + back * dtS * 0.35;
  }

  // Constraint: anchor the first seg near attachment, chain with fixed length.
  const linkLen = 0.3;
  // Anchor
  segs[0].x = (segs[0].x + anchorX) * 0.5;
  segs[0].y = (segs[0].y + anchorY) * 0.5;
  segs[0].z = (segs[0].z + anchorZ) * 0.5;

  for (let iter = 0; iter < 2; iter++) {
    for (let i = 0; i < segs.length - 1; i++) {
      const a = segs[i], b = segs[i + 1];
      const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
      const d = Math.max(0.0001, Math.sqrt(dx * dx + dy * dy + dz * dz));
      const diff = (d - linkLen) / d;
      const half = diff * 0.5;
      if (i > 0) { a.x += dx * half; a.y += dy * half; a.z += dz * half; }
      b.x -= dx * half; b.y -= dy * half; b.z -= dz * half;
    }
  }

  // Apply positions + orientation to meshes
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    s.mesh.position.set(s.x, s.y, s.z);
    // Tilt so the plane faces outward from body center
    const dx = s.x - 0;
    const dz = s.z - 0;
    s.mesh.rotation.y = Math.atan2(dx, dz) + Math.PI;
    // Tilt forward based on drop
    s.mesh.rotation.x = -0.3;
  }
}
