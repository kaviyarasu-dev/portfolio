// Rigged GLTF character (Soldier.glb) with skeletal animation.
// Uses AnimationMixer with crossfading between idle/walk/run.

import { game } from '../state.js';

export const PlayerRig = {
  root: null,
  body: null,
  mixer: null,
  headBone: null,
  baseActions: {},
  currentBase: 'idle',
  allActions: []
};

function setActionWeight(action, weight) {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}

function crossFadeBase(toName, duration) {
  if (toName === PlayerRig.currentBase) return;
  const fromAction = PlayerRig.baseActions[PlayerRig.currentBase];
  const toAction = PlayerRig.baseActions[toName];
  if (!toAction) return;

  setActionWeight(toAction, 1);
  toAction.time = 0;

  if (fromAction) {
    fromAction.crossFadeTo(toAction, duration, true);
  } else {
    toAction.fadeIn(duration);
  }

  PlayerRig.currentBase = toName;
}

export function triggerGesture() {}

export async function buildPlayer() {
  const root = new THREE.Group();
  root.name = 'player';

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  const gltf = await new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    const binary = Uint8Array.from(atob(XBOT_MODEL_DATA), c => c.charCodeAt(0));
    loader.parse(binary.buffer, '', resolve, reject);
  });

  const model = gltf.scene;
  model.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
    if (obj.isBone && obj.name.toLowerCase().includes('head') && !obj.name.toLowerCase().includes('top')) {
      PlayerRig.headBone = obj;
    }
  });
  body.add(model);

  const mixer = new THREE.AnimationMixer(model);
  PlayerRig.mixer = mixer;
  PlayerRig.allActions = [];

  // Soldier.glb animations are index-based: [0]=Idle, [1]=Run, [3]=Walk
  // Map them by scanning clip names (case-insensitive) with index fallback
  const animations = gltf.animations;
  const clipMap = { idle: null, walk: null, run: null };

  for (const clip of animations) {
    const lower = clip.name.toLowerCase();
    if (lower.includes('idle')) clipMap.idle = clip;
    else if (lower.includes('walk')) clipMap.walk = clip;
    else if (lower.includes('run')) clipMap.run = clip;
  }
  // Index fallback if name matching failed
  if (!clipMap.idle && animations[0]) clipMap.idle = animations[0];
  if (!clipMap.run && animations[1]) clipMap.run = animations[1];
  if (!clipMap.walk && animations[3]) clipMap.walk = animations[3];

  const baseWeights = { idle: 1, walk: 0, run: 0 };
  for (const [name, clip] of Object.entries(clipMap)) {
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    setActionWeight(action, baseWeights[name]);
    action.play();
    PlayerRig.baseActions[name] = action;
    PlayerRig.allActions.push(action);
  }

  PlayerRig.currentBase = 'idle';

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

  let targetBase = 'idle';
  if (p.moving && p.sprinting) {
    targetBase = 'run';
  } else if (p.moving) {
    targetBase = 'walk';
  }
  crossFadeBase(targetBase, 0.35);

  if (PlayerRig.mixer) {
    PlayerRig.mixer.update(dtS);
  }

  // Head look-at via skeleton bone
  if (PlayerRig.headBone && game.perfMode !== 'ultralow') {
    if (game.nearestZone) {
      const dx = game.nearestZone.x - game.player.position.x;
      const dz = game.nearestZone.z - game.player.position.z;
      const worldYaw = Math.atan2(dx, dz);
      let localYaw = worldYaw - p.facing;
      while (localYaw > Math.PI) localYaw -= Math.PI * 2;
      while (localYaw < -Math.PI) localYaw += Math.PI * 2;
      localYaw = Math.max(-1.05, Math.min(1.05, localYaw));
      PlayerRig.headBone.rotation.y += (localYaw - PlayerRig.headBone.rotation.y) * Math.min(1, dtS * 3);
    } else {
      PlayerRig.headBone.rotation.y += (0 - PlayerRig.headBone.rotation.y) * Math.min(1, dtS * 3);
    }
  }

  p.body.rotation.y = p.facing;
}
