// Animated water - single plane at WATER_LEVEL with a custom shader that
// samples a scrolling normal map and fakes fresnel-tinted reflection using
// the scene envMap.

import { game } from '../state.js';
import { TERRAIN_SIZE, WATER_LEVEL, PALETTE } from '../config.js';
import { Assets } from '../engine/assets.js';

export function buildWater() {
  const geo = new THREE.PlaneGeometry(TERRAIN_SIZE * 1.6, TERRAIN_SIZE * 1.6, 1, 1);
  geo.rotateX(-Math.PI / 2);

  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.water),
    roughness: 0.22,
    metalness: 0.12,
    transparent: true,
    opacity: 0.92,
    normalMap: Assets.waterNormalTex,
    normalScale: new THREE.Vector2(0.55, 0.55),
    envMapIntensity: 1.15
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = WATER_LEVEL;
  mesh.receiveShadow = false;
  mesh.name = 'water';
  game.waterMesh = mesh;
  game.worldRoot.add(mesh);

  mesh.userData.update = (dt, time) => {
    if (Assets.waterNormalTex) {
      Assets.waterNormalTex.offset.x = (time * 0.00003) % 1;
      Assets.waterNormalTex.offset.y = (time * 0.000045) % 1;
    }
  };

  return mesh;
}

export function updateWater(dt, time) {
  if (game.waterMesh && game.waterMesh.userData.update) {
    game.waterMesh.userData.update(dt, time);
  }
}
