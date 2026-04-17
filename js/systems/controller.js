// Player movement controller. Translates (camera-relative) move intent to
// world-space velocity, applies collision, updates facing.

import { game } from '../state.js';
import { WALK_SPEED, SPRINT_SPEED, MOVE_ACCEL, MOVE_DECEL, TURN_LERP } from '../config.js';
import { getMoveIntent } from './input.js';
import { resolveCollision } from '../world/collision.js';
import { getCameraYaw, sampleTerrainHeight, setTargetFov } from '../engine/camera.js';
import { angleDamp, damp } from '../util/math.js';
import { onFootstep } from './audio.js';

const PLAYER_RADIUS = 0.45;

export function updateController(dt, time) {
  const p = game.player;
  const dtS = Math.min(0.05, dt / 1000);
  const intent = getMoveIntent();
  const moving = intent.dx !== 0 || intent.dy !== 0;

  const yaw = getCameraYaw();
  // Convert camera-relative intent into world-space direction:
  //   forward (dy = +1) = -Z in world rotated by yaw
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const forwardX = -sy, forwardZ = -cy;
  const rightX   =  cy, rightZ   = -sy;

  const wx = forwardX * intent.dy + rightX * intent.dx;
  const wz = forwardZ * intent.dy + rightZ * intent.dx;
  const intentLen = Math.hypot(wx, wz);

  const targetSpeed = p.sprinting && moving ? SPRINT_SPEED : (moving ? WALK_SPEED : 0);

  // Accelerate / decelerate (damp takes dt in seconds)
  if (moving) {
    p.speed = damp(p.speed, targetSpeed, MOVE_ACCEL, dtS);
    p.targetFacing = Math.atan2(wx, wz);
  } else {
    p.speed = damp(p.speed, 0, MOVE_DECEL, dtS);
  }

  setTargetFov(p.sprinting && moving);

  // Apply facing lerp
  p.facing = angleDamp(p.facing, p.targetFacing, TURN_LERP, dtS);

  // Translate
  if (intentLen > 0 && p.speed > 0.001) {
    const nx = wx / intentLen;
    const nz = wz / intentLen;
    let ppx = p.position.x + nx * p.speed * dtS;
    let ppz = p.position.z + nz * p.speed * dtS;
    const fixed = resolveCollision(ppx, ppz, PLAYER_RADIUS);
    ppx = fixed.x; ppz = fixed.z;

    // Keep on island — clamp to max radius ~170m
    const rad = Math.hypot(ppx, ppz);
    const MAX = 168;
    if (rad > MAX) {
      ppx = (ppx / rad) * MAX;
      ppz = (ppz / rad) * MAX;
    }

    p.position.x = ppx;
    p.position.z = ppz;
  }

  // Glue to terrain height
  const h = sampleTerrainHeight(p.position.x, p.position.z);
  p.position.y = Math.max(h, -0.5);

  p.moving = moving && p.speed > 0.05;

  // Footsteps
  if (p.moving) {
    const stepInterval = p.sprinting ? 280 : 410;
    if (!p._lastStep || time - p._lastStep > stepInterval) {
      p._lastStep = time;
      onFootstep(h < 0.9 ? 'sand' : 'grass', p.sprinting);
    }
  }
}
