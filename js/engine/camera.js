// Third-person over-shoulder camera with pitch/yaw, collision push-in, FOV bump.

import { game } from '../state.js';
import {
  CAMERA_FOV_BASE, CAMERA_FOV_SPRINT,
  CAMERA_DISTANCE, CAMERA_HEIGHT, CAMERA_SHOULDER
} from '../config.js';
import { clamp, damp } from '../util/math.js';

export const CameraRig = {
  lookSensitivity: 0.0025,
  touchLookSens: 0.0055,
  pitchMin: -0.85,
  pitchMax: 0.45
};

const CAMERA_ZOOM_MIN = 2.5;
const CAMERA_ZOOM_MAX = 18;
const CAMERA_ZOOM_WHEEL_SENS = 0.0035;
const CAMERA_ZOOM_PINCH_SENS = 0.015;
const CAMERA_ZOOM_DAMP = 8;

const _tmpIdealPos = { x: 0, y: 0, z: 0 };

export function initCameraRig() {
  game.camRig.yaw = 0;
  game.camRig.pitch = -0.22;
  game.camRig.distance = CAMERA_DISTANCE;
  game.camRig.targetDistance = CAMERA_DISTANCE;
  game.camRig.fov = CAMERA_FOV_BASE;
  game.camRig.targetFov = CAMERA_FOV_BASE;
  game.camRig.shakeAmp = 0;
  game.camRig.shakeUntil = 0;
}

export function applyLookInput(dx, dy, fromTouch) {
  const s = fromTouch ? CameraRig.touchLookSens : CameraRig.lookSensitivity;
  game.camRig.yaw -= dx * s;
  game.camRig.pitch = clamp(
    game.camRig.pitch - dy * s,
    CameraRig.pitchMin,
    CameraRig.pitchMax
  );
}

export function applyZoomInput(wheelDeltaY, fromTouch) {
  const rig = game.camRig;
  if (rig.targetDistance == null) rig.targetDistance = rig.distance;
  const sens = fromTouch ? CAMERA_ZOOM_PINCH_SENS : CAMERA_ZOOM_WHEEL_SENS;
  rig.targetDistance = clamp(
    rig.targetDistance + wheelDeltaY * sens,
    CAMERA_ZOOM_MIN,
    CAMERA_ZOOM_MAX
  );
}

export function setTargetFov(sprinting) {
  game.camRig.targetFov = sprinting ? CAMERA_FOV_SPRINT : CAMERA_FOV_BASE;
}

export function cameraShake(amp, ms) {
  game.camRig.shakeAmp = amp;
  game.camRig.shakeUntil = performance.now() + ms;
}

export function updateCamera(dt) {
  const p = game.player;
  const rig = game.camRig;
  const cam = game.camera;
  if (!p || !p.position || !cam) return;

  const dtS = Math.min(0.05, dt / 1000);

  // FOV ease
  rig.fov = damp(rig.fov, rig.targetFov, 6, dtS);
  if (Math.abs(cam.fov - rig.fov) > 0.01) {
    cam.fov = rig.fov;
    cam.updateProjectionMatrix();
  }

  // Zoom ease - mouse wheel / pinch feed rig.targetDistance.
  if (rig.targetDistance != null && rig.targetDistance !== rig.distance) {
    rig.distance = damp(rig.distance, rig.targetDistance, CAMERA_ZOOM_DAMP, dtS);
  }

  const cy = Math.cos(rig.yaw);
  const sy = Math.sin(rig.yaw);
  const cp = Math.cos(rig.pitch);
  const sp = Math.sin(rig.pitch);

  // Target pivot is head height on the player with a shoulder offset.
  const pivotY = p.position.y + CAMERA_HEIGHT;
  const shoulderX = CAMERA_SHOULDER * cy;
  const shoulderZ = -CAMERA_SHOULDER * sy;
  const pivotX = p.position.x + shoulderX;
  const pivotZ = p.position.z + shoulderZ;

  // Ideal camera position behind player using spherical coords.
  const dist = rig.distance;
  _tmpIdealPos.x = pivotX + dist * sy * cp;
  _tmpIdealPos.y = pivotY - dist * sp;
  _tmpIdealPos.z = pivotZ + dist * cy * cp;

  // Collision push-in: sweep a few test points from pivot outward; pull in if terrain/building blocks.
  // Simple heuristic: clamp above terrain height + 0.6m.
  if (game.terrainMesh) {
    const minY = sampleTerrainHeight(_tmpIdealPos.x, _tmpIdealPos.z) + 0.6;
    if (_tmpIdealPos.y < minY) _tmpIdealPos.y = minY;
  }

  // Lerp camera to ideal.
  cam.position.x = damp(cam.position.x, _tmpIdealPos.x, 14, dtS);
  cam.position.y = damp(cam.position.y, _tmpIdealPos.y, 14, dtS);
  cam.position.z = damp(cam.position.z, _tmpIdealPos.z, 14, dtS);

  // Shake offset
  const now = performance.now();
  if (now < rig.shakeUntil) {
    const t = (rig.shakeUntil - now) / 1000;
    const amp = rig.shakeAmp * Math.min(1, t);
    cam.position.x += (Math.random() - 0.5) * amp;
    cam.position.y += (Math.random() - 0.5) * amp;
  }

  cam.lookAt(pivotX, pivotY - 0.25, pivotZ);
}

export function getCameraYaw() { return game.camRig.yaw; }

// Sample terrain height at (x, z). Returns 0 if no terrain yet.
export function sampleTerrainHeight(x, z) {
  if (game.terrainMesh && game.terrainMesh.userData.sampleHeight) {
    return game.terrainMesh.userData.sampleHeight(x, z);
  }
  return 0;
}
