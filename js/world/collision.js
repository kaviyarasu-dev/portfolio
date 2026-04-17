// Sphere vs. bounding sphere list collision. Buildings + big props register a
// collider; the player controller calls resolveCollision() each frame.

import { game } from '../state.js';

export function addCollider(x, z, radius) {
  game.colliders.push({ x, z, r: radius });
}

export function clearColliders() {
  game.colliders.length = 0;
}

// Push (x, z) out of every overlapping collider circle. Returns the adjusted point.
export function resolveCollision(x, z, selfR) {
  let px = x, pz = z;
  for (let i = 0; i < game.colliders.length; i++) {
    const c = game.colliders[i];
    const dx = px - c.x;
    const dz = pz - c.z;
    const minD = c.r + selfR;
    const dSq = dx * dx + dz * dz;
    if (dSq < minD * minD && dSq > 0.00001) {
      const d = Math.sqrt(dSq);
      const push = (minD - d) / d;
      px += dx * push;
      pz += dz * push;
    }
  }
  return { x: px, z: pz };
}

// Check if a world point is inside any collider (for spawn safety).
export function pointInsideCollider(x, z, pad) {
  for (let i = 0; i < game.colliders.length; i++) {
    const c = game.colliders[i];
    const dx = x - c.x, dz = z - c.z;
    const r = c.r + (pad || 0);
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}
