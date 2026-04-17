// Async bootstrap. Runs on DOMContentLoaded from the bundled IIFE.

import { game, initDomRefs } from './state.js';
import { initAssets } from './engine/assets.js';
import { initRenderer, initComposer, resizeRenderer } from './engine/renderer.js';
import { buildScene } from './engine/scene.js';
import { initCameraRig } from './engine/camera.js';
import { runPreload, hideLoader, showFatalError } from './engine/loader.js';
import { buildTerrain } from './world/terrain.js';
import { buildWater } from './world/water.js';
import { buildSky } from './world/sky.js';
import { clearColliders } from './world/collision.js';
import { placeBuildings } from './world/buildings.js';
import { scatterProps } from './world/props.js';
import { buildPlayer } from './entity/player.js';
import { wireInput } from './systems/input.js';
import { initInteraction } from './systems/interaction.js';
import { initClock } from './systems/clock.js';
import { initAudio } from './systems/audio.js';
import { startLoop } from './systems/gameloop.js';
import { initMinimap } from './ui/minimap.js';

async function boot() {
  if (!window.WebGLRenderingContext) {
    throw new Error('WebGL not supported in this browser.');
  }
  if (!window.THREE) {
    throw new Error('Three.js did not load.');
  }

  initDomRefs();

  await runPreload([
    { hint: 'Loading renderer',     run: () => { initRenderer(); } },
    { hint: 'Generating textures',  run: () => { initAssets(); } },
    { hint: 'Building scene',       run: () => { buildScene(); } },
    { hint: 'Shaping island',       run: () => { buildTerrain(); } },
    { hint: 'Pouring water',        run: () => { buildWater(); } },
    { hint: 'Raising sky',          run: () => { buildSky(); } },
    { hint: 'Erecting landmarks',   run: () => { clearColliders(); placeBuildings(); } },
    { hint: 'Scattering props',     run: () => { scatterProps(); } },
    { hint: 'Summoning traveler',   run: () => { buildPlayer(); } },
    { hint: 'Attaching camera',     run: () => { initCameraRig(); } },
    { hint: 'Post-processing',      run: () => { initComposer(game.scene, game.camera); } },
    { hint: 'Wiring controls',      run: () => { wireInput(); } },
    { hint: 'Opening interactions', run: () => { initInteraction(); } },
    { hint: 'Tuning audio',         run: () => { initAudio(); } },
    { hint: 'Synchronising time',   run: () => { initClock(); } },
    { hint: 'Priming minimap',      run: () => { initMinimap(); resizeRenderer(); } }
  ]);

  startLoop();
  // Slight delay so first render completes before fade-out
  setTimeout(hideLoader, 160);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot().catch(showFatalError);
  });
} else {
  boot().catch(showFatalError);
}
