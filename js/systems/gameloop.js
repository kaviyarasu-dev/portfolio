// Main rAF loop. Runs controller + systems, renders scene via composer.

import { game } from '../state.js';
import { renderFrame, setPerfMode, resizeRenderer } from '../engine/renderer.js';
import { updateCamera } from '../engine/camera.js';
import { updateController } from './controller.js';
import { updateInteraction } from './interaction.js';
import { updateClock } from './clock.js';
import { updateWater } from '../world/water.js';
import { updateBuildings } from '../world/buildings.js';
import { animatePlayer } from '../entity/player.js';
import { advanceTyping, updateToast } from '../ui/hud.js';
import { updateMinimap } from '../ui/minimap.js';

let loopRunning = false;

export function startLoop() {
  if (loopRunning) return;
  loopRunning = true;
  game.lastTime = performance.now();
  window.addEventListener('resize', resizeRenderer);
  window.addEventListener('orientationchange', resizeRenderer);
  requestAnimationFrame(frame);
}

function frame(time) {
  const dt = Math.min(50, time - game.lastTime);
  game.lastTime = time;

  update(dt, time);
  render(time);
  perfWatch(dt);

  requestAnimationFrame(frame);
}

function update(dt, time) {
  updateController(dt, time);
  updateCamera(dt);
  updateInteraction(dt);
  updateClock(time);
  updateWater(dt, time);
  updateBuildings(dt, time);
  animatePlayer(dt);
  advanceTyping(dt);
  updateToast(dt);
  updateMinimap();
}

function render(time) {
  renderFrame();
}

function perfWatch(dt) {
  game.frameSamples.push(dt);
  if (game.frameSamples.length > 180) game.frameSamples.shift();
  if (game.frameSamples.length < 180) return;
  const avg = game.frameSamples.reduce((a, b) => a + b, 0) / game.frameSamples.length;
  if (avg > 30 && game.perfMode === 'normal') {
    setPerfMode('low');
    console.info('Perf: avg ' + avg.toFixed(1) + 'ms → low mode');
  } else if (avg > 42 && game.perfMode === 'low') {
    setPerfMode('ultralow');
    console.info('Perf: avg ' + avg.toFixed(1) + 'ms → ultralow mode');
  }
}
