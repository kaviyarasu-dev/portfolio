// Day/night clock. Sun orbits around the player, sky + fog + exposure tween
// with the phase. T key bumps time forward; ?time=0..1 URL param seeds the clock.

import { game } from '../state.js';
import { updateSky } from '../world/sky.js';
import { updateSunFromDirection } from '../engine/scene.js';
import {
  FOG_COLOR_DAY, FOG_COLOR_DUSK, FOG_COLOR_NIGHT
} from '../config.js';
import { lerp } from '../util/math.js';

const DAY_LENGTH_MS = 10 * 60 * 1000; // 10-minute full cycle
let clockOffset = 0;
let advanceOnT = 0;

export function initClock() {
  const params = new URLSearchParams(window.location.search);
  const qp = parseFloat(params.get('time'));
  if (!Number.isNaN(qp) && qp >= 0 && qp <= 1) {
    game.clock.dayFraction = qp;
  }
  clockOffset = performance.now() - game.clock.dayFraction * DAY_LENGTH_MS;
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 't') {
      advanceOnT += 0.07;
    }
  });
  game.clock.sunDir = new THREE.Vector3();
}

function phaseFor(t) {
  if (t < 0.08)  return 'night';
  if (t < 0.20)  return 'dusk';    // dawn (sun rising)
  if (t < 0.58)  return 'day';
  if (t < 0.68)  return 'day';
  if (t < 0.80)  return 'dusk';    // sunset
  return 'night';
}

export function updateClock(time) {
  const elapsed = (time + advanceOnT * DAY_LENGTH_MS - clockOffset) % DAY_LENGTH_MS;
  const t = (elapsed + DAY_LENGTH_MS) % DAY_LENGTH_MS / DAY_LENGTH_MS;
  game.clock.dayFraction = t;

  // Sun angle: 0..1 → -90°..+270° so the sun is below the horizon at t=0 and 1.
  const ang = (t * Math.PI * 2) - Math.PI * 0.5;
  const sunDir = game.clock.sunDir;
  sunDir.set(Math.cos(ang), Math.sin(ang), 0.3);
  sunDir.normalize();

  updateSunFromDirection(sunDir);

  const phase = phaseFor(t);
  updateSky(sunDir, phase);

  // Fog color tween + exposure
  const fog = game.scene.fog;
  if (fog) {
    let target;
    if (phase === 'day')       target = new THREE.Color(FOG_COLOR_DAY);
    else if (phase === 'dusk') target = new THREE.Color(FOG_COLOR_DUSK);
    else                        target = new THREE.Color(FOG_COLOR_NIGHT);
    fog.color.lerp(target, 0.05);
    game.scene.background.copy(fog.color);
  }

  // Exposure
  const renderer = game.renderer;
  if (renderer) {
    let targetExp = 1.05;
    if (phase === 'day')  targetExp = 1.05;
    if (phase === 'dusk') targetExp = 1.15;
    if (phase === 'night') targetExp = 0.55;
    renderer.toneMappingExposure = lerp(renderer.toneMappingExposure, targetExp, 0.04);
  }

  // Sun intensity
  if (game.sun) {
    let i = 2.2;
    if (phase === 'day')  i = 2.4;
    if (phase === 'dusk') i = 1.5;
    if (phase === 'night') i = 0.25;
    game.sun.intensity = lerp(game.sun.intensity, i, 0.05);
  }
  if (game.hemi) {
    let hi = 0.55;
    if (phase === 'night') hi = 0.2;
    game.hemi.intensity = lerp(game.hemi.intensity, hi, 0.05);
  }
}
