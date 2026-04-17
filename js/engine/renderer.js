// WebGLRenderer + EffectComposer setup. Relies on globals:
//   THREE, THREE.EffectComposer, THREE.RenderPass, THREE.UnrealBloomPass,
//   THREE.ShaderPass, THREE.FXAAShader  (loaded in index.html)

import { game } from '../state.js';
import { SHADOW_MAP_SIZE_DESKTOP, SHADOW_MAP_SIZE_MOBILE } from '../config.js';

export const Renderer = {
  bloomPass: null,
  fxaaPass: null,
  composerEnabled: true
};

export function initRenderer() {
  const renderer = new THREE.WebGLRenderer({
    canvas: game.canvas,
    antialias: false,
    powerPreference: 'high-performance',
    alpha: false,
    stencil: false
  });

  renderer.setClearColor(0x0a1020, 1);
  if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.physicallyCorrectLights = false;

  const maxPR = game.touchMode ? 1.5 : 2;
  const pr = Math.min(window.devicePixelRatio || 1, maxPR);
  renderer.setPixelRatio(pr);
  game.pixelRatio = pr;

  game.renderer = renderer;
  game.shadowMapSize = game.touchMode ? SHADOW_MAP_SIZE_MOBILE : SHADOW_MAP_SIZE_DESKTOP;

  resizeRenderer();
  return renderer;
}

export function initComposer(scene, camera) {
  if (!THREE.EffectComposer || !THREE.UnrealBloomPass) {
    console.warn('Post-processing unavailable; rendering direct.');
    Renderer.composerEnabled = false;
    return null;
  }
  const composer = new THREE.EffectComposer(game.renderer);
  composer.setPixelRatio(game.pixelRatio);
  composer.setSize(game.viewWidth, game.viewHeight);

  const renderPass = new THREE.RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloom = new THREE.UnrealBloomPass(
    new THREE.Vector2(game.viewWidth, game.viewHeight),
    0.55,   // strength
    0.7,    // radius
    0.85    // threshold
  );
  composer.addPass(bloom);
  Renderer.bloomPass = bloom;

  if (THREE.FXAAShader) {
    const fxaa = new THREE.ShaderPass(THREE.FXAAShader);
    const pr = game.pixelRatio;
    fxaa.material.uniforms.resolution.value.set(
      1 / (game.viewWidth * pr),
      1 / (game.viewHeight * pr)
    );
    composer.addPass(fxaa);
    Renderer.fxaaPass = fxaa;
  }

  game.composer = composer;
  return composer;
}

export function resizeRenderer() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  game.viewWidth = w;
  game.viewHeight = h;
  if (game.renderer) game.renderer.setSize(w, h, false);
  if (game.camera) {
    game.camera.aspect = w / h;
    game.camera.updateProjectionMatrix();
  }
  if (game.composer) {
    game.composer.setSize(w, h);
    if (Renderer.fxaaPass) {
      const pr = game.pixelRatio;
      Renderer.fxaaPass.material.uniforms.resolution.value.set(
        1 / (w * pr),
        1 / (h * pr)
      );
    }
  }
}

export function renderFrame() {
  if (Renderer.composerEnabled && game.composer) {
    game.composer.render();
  } else {
    game.renderer.render(game.scene, game.camera);
  }
}

export function setPerfMode(mode) {
  if (mode === game.perfMode) return;
  game.perfMode = mode;
  if (mode === 'low') {
    if (Renderer.bloomPass) Renderer.bloomPass.strength = 0.3;
    game.renderer.setPixelRatio(Math.min(1.25, game.pixelRatio));
  } else if (mode === 'ultralow') {
    if (Renderer.bloomPass) Renderer.bloomPass.enabled = false;
    game.renderer.setPixelRatio(1);
    game.renderer.shadowMap.enabled = false;
  }
}
