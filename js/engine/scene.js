// Root scene construction: fog, sun, hemisphere fill, root groups, env map.

import { game } from '../state.js';
import {
  FOG_COLOR_DAY, FOG_DENSITY,
  CAMERA_FOV_BASE, CAMERA_NEAR, CAMERA_FAR,
  SHADOW_FRUSTUM_SIZE
} from '../config.js';
import { buildEnvMap } from './assets.js';

export function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(FOG_COLOR_DAY);
  scene.fog = new THREE.FogExp2(FOG_COLOR_DAY, FOG_DENSITY);

  const env = buildEnvMap(game.renderer);
  scene.environment = env;
  game.envTexture = env;

  // Sun (directional)
  const sun = new THREE.DirectionalLight(0xfff2d6, 2.2);
  sun.position.set(45, 70, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.width = game.shadowMapSize;
  sun.shadow.mapSize.height = game.shadowMapSize;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 200;
  const S = SHADOW_FRUSTUM_SIZE;
  sun.shadow.camera.left   = -S;
  sun.shadow.camera.right  =  S;
  sun.shadow.camera.top    =  S;
  sun.shadow.camera.bottom = -S;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  const sunTarget = new THREE.Object3D();
  scene.add(sunTarget);
  sun.target = sunTarget;
  game.sun = sun;
  game.sunTarget = sunTarget;

  // Hemisphere fill
  const hemi = new THREE.HemisphereLight(0xbcd4ea, 0x3a2a1f, 0.55);
  scene.add(hemi);
  game.hemi = hemi;

  // Root groups for gameplay entities
  const worldRoot     = new THREE.Group(); worldRoot.name = 'world';
  const propsRoot     = new THREE.Group(); propsRoot.name = 'props';
  const buildingsRoot = new THREE.Group(); buildingsRoot.name = 'buildings';
  scene.add(worldRoot, propsRoot, buildingsRoot);
  game.worldRoot = worldRoot;
  game.propsRoot = propsRoot;
  game.buildingsRoot = buildingsRoot;

  // Camera
  const aspect = game.viewWidth / game.viewHeight;
  const cam = new THREE.PerspectiveCamera(CAMERA_FOV_BASE, aspect, CAMERA_NEAR, CAMERA_FAR);
  cam.position.set(0, 6, 10);
  scene.add(cam);

  game.scene = scene;
  game.camera = cam;

  return scene;
}

export function updateSunFromDirection(dir) {
  if (!game.sun) return;
  const dist = 80;
  game.sun.position.set(dir.x * dist, dir.y * dist, dir.z * dist);
  // Keep sunTarget at the player for shadow frustum following
  if (game.player && game.player.position) {
    game.sunTarget.position.copy(game.player.position);
  }
}
