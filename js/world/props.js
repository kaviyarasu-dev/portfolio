// Instanced trees, rocks, grass tufts. One draw call per prop type.
// Scatter respects zone radii (no props inside plaza/building trigger zones)
// and the island's walkable area.

import { game } from '../state.js';
import { WORLD_RADIUS, PALETTE } from '../config.js';
import { ZONE_LAYOUT } from './zones.js';
import { addCollider } from './collision.js';
import { mergeGeometries } from '../util/three.js';

function seedRng(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    if (s <= 0) s += 2147483646;
    return s / 2147483647;
  };
}

function insideZone(x, z, pad) {
  for (let i = 0; i < ZONE_LAYOUT.length; i++) {
    const zn = ZONE_LAYOUT[i];
    const dx = x - zn.x, dz = z - zn.z;
    const r = zn.r * 2.0 + (pad || 0);
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

function sampleTerrainH(x, z) {
  if (game.terrainMesh && game.terrainMesh.userData.sampleHeight) {
    return game.terrainMesh.userData.sampleHeight(x, z);
  }
  return 0;
}

// Trees render as two InstancedMeshes per species (trunk + canopy) sharing
// per-instance transforms. Pines use an asymmetric organic cone; broadleaf uses
// a squashed warped icosahedron. Both carry a tip->base vertex-color gradient.
function buildPineTrunkGeo() {
  const t = new THREE.CylinderGeometry(0.15, 0.28, 1.9, 8, 3);
  t.translate(0, 0.95, 0);
  const pos = t.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    const bulge = 1 + Math.sin(y * 5.2) * 0.04;
    pos.setX(i, x * bulge);
    pos.setZ(i, z * bulge);
  }
  t.computeVertexNormals();
  return t;
}

function buildBroadleafTrunkGeo() {
  const t = new THREE.CylinderGeometry(0.18, 0.34, 2.4, 8, 3);
  t.translate(0, 1.2, 0);
  const pos = t.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i);
    const bulge = 1 + Math.sin(y * 4.0) * 0.05;
    pos.setX(i, x * bulge);
    pos.setZ(i, z * bulge);
  }
  t.computeVertexNormals();
  return t;
}

function bakeCanopyVertexColors(geo) {
  const pos = geo.attributes.position;
  let minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const span = Math.max(0.001, maxY - minY);
  const light = new THREE.Color(PALETTE.leafLight);
  const dark  = new THREE.Color(PALETTE.leafDark);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const base = (y - minY) / span;
    const highlightNoise = 0.5 + 0.5 * Math.sin(pos.getX(i) * 3.1 + pos.getZ(i) * 2.4 + y * 1.5);
    const mix = Math.min(1, Math.max(0, base * 0.85 + highlightNoise * 0.2));
    const c = dark.clone().lerp(light, mix);
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function buildPineTierGeo(radius, height, segments, centerY, jitterFreqX, jitterFreqZ, jitterAmp) {
  const cone = new THREE.ConeGeometry(radius, height, segments, 4);
  cone.translate(0, centerY, 0);
  const pos = cone.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    if (r > 0.02) {
      const jitter = 1 + Math.sin(x * jitterFreqX + z * jitterFreqZ) * jitterAmp;
      pos.setX(i, x * jitter);
      pos.setZ(i, z * jitter);
    }
  }
  cone.computeVertexNormals();
  return cone;
}

function buildPineCanopyGeo() {
  // Three skirted tiers - classic conifer silhouette. Each upper tier's base
  // peeks below the next tier's apex, creating visible branch layers.
  const bottom = buildPineTierGeo(1.45, 1.6, 10, 2.0, 4.2, 3.1, 0.22);
  const middle = buildPineTierGeo(1.15, 1.4, 9,  2.8, 4.8, 3.6, 0.2);
  const top    = buildPineTierGeo(0.8,  1.2, 8,  3.6, 5.4, 4.2, 0.18);
  const merged = mergeGeometries([bottom, middle, top]);
  bakeCanopyVertexColors(merged);
  return merged;
}

function buildBroadleafPuffGeo(radius, centerX, centerY, centerZ) {
  const geo = new THREE.IcosahedronGeometry(radius, 2);
  geo.scale(1.0, 0.9, 1.0);
  geo.translate(centerX, centerY, centerZ);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const jx = Math.sin(x * 2.2 + z * 1.4) * 0.16;
    const jy = Math.sin(y * 2.6) * 0.12;
    const jz = Math.sin(z * 2.5 + x * 1.8) * 0.14;
    pos.setX(i, x + jx);
    pos.setY(i, y + jy);
    pos.setZ(i, z + jz);
  }
  return geo;
}

function buildBroadleafCanopyGeo() {
  // Four asymmetric puffs merged into a lobed crown - breaks the old lollipop
  // silhouette. Subdiv 2 icosphere gives smoother edges; jitter stays per-puff
  // so each lobe feels independently wind-blown.
  const puffs = [
    buildBroadleafPuffGeo(1.2,  0.0, 3.15,  0.0),
    buildBroadleafPuffGeo(0.9,  0.8, 3.00,  0.3),
    buildBroadleafPuffGeo(0.85,-0.7, 3.30, -0.2),
    buildBroadleafPuffGeo(0.75, 0.1, 3.70,  0.5)
  ];
  const merged = mergeGeometries(puffs);
  merged.computeVertexNormals();
  bakeCanopyVertexColors(merged);
  return merged;
}

// Three distinct rock silhouettes. Each is a subdivided icosahedron (42 verts)
// warped with a deterministic multi-octave offset, then carries vertex-color
// "moss" on verts whose local normal faces upward.
function buildRockVariantGeo(seed, baseRadius) {
  const g = new THREE.IcosahedronGeometry(baseRadius, 1);
  const rng = seedRng(seed);
  const pos = g.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const low = (rng() - 0.5) * 0.28;
    const mid = Math.sin(x * 1.8 + y * 1.4 + seed) * 0.12;
    const hi  = Math.sin(z * 2.4 - y * 1.9 + seed * 0.5) * 0.08;
    pos.setX(i, x + low + mid);
    pos.setY(i, y + low * 0.7 + hi);
    pos.setZ(i, z + low + mid);
  }
  g.computeVertexNormals();

  const nrm = g.attributes.normal;
  const colors = new Float32Array(pos.count * 3);
  const stoneCol = new THREE.Color(PALETTE.stone);
  const mossCol  = new THREE.Color(PALETTE.leafDark);
  for (let i = 0; i < pos.count; i++) {
    const normalY = nrm.getY(i);
    const mossMix = Math.max(0, Math.min(1, (normalY - 0.35) / 0.45)) * 0.55;
    const blended = stoneCol.clone().lerp(mossCol, mossMix);
    colors[i * 3]     = blended.r;
    colors[i * 3 + 1] = blended.g;
    colors[i * 3 + 2] = blended.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return g;
}

export function scatterProps() {
  scatterTrees(140);
  scatterRocks(60);
  scatterGrass(400);
}

function scatterTrees(count) {
  const pineCount = Math.round(count * (100 / 140));
  const broadleafCount = count - pineCount;

  // `instanceColor` works independent of vertexColors; canopies already bake
  // vertex colors, so Three r147 multiplies instanceColor × vertexColor × material.color.
  const trunkMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.wood),
    roughness: 0.92
  });
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.82,
    vertexColors: true
  });

  const pineTrunks   = new THREE.InstancedMesh(buildPineTrunkGeo(),     trunkMat,  pineCount);
  const pineCanopies = new THREE.InstancedMesh(buildPineCanopyGeo(),    canopyMat, pineCount);
  const leafTrunks   = new THREE.InstancedMesh(buildBroadleafTrunkGeo(), trunkMat, broadleafCount);
  const leafCanopies = new THREE.InstancedMesh(buildBroadleafCanopyGeo(), canopyMat, broadleafCount);

  for (const m of [pineTrunks, pineCanopies, leafTrunks, leafCanopies]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  pineTrunks.name = 'pine-trunks';
  pineCanopies.name = 'pine-canopies';
  leafTrunks.name = 'broadleaf-trunks';
  leafCanopies.name = 'broadleaf-canopies';

  const rng = seedRng(77301);
  const dummy = new THREE.Object3D();
  const trunkTint = new THREE.Color();
  const canopyTint = new THREE.Color();
  let pinesPlaced = 0, leavesPlaced = 0;
  let attempts = 0;
  const total = pineCount + broadleafCount;
  while ((pinesPlaced + leavesPlaced) < total && attempts < total * 25) {
    attempts++;
    const ang = rng() * Math.PI * 2;
    const rad = rng() * (WORLD_RADIUS * 0.9) + 6;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    if (insideZone(x, z, 2)) continue;
    const h = sampleTerrainH(x, z);
    if (h < 0.5 || h > 3.8) continue;

    const isBroadleaf = (rng() < broadleafCount / total) && leavesPlaced < broadleafCount;
    if (!isBroadleaf && pinesPlaced >= pineCount) continue;

    const s = (isBroadleaf ? 0.7 : 0.75) + rng() * 0.85;
    dummy.position.set(x, h - 0.05, z);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    dummy.scale.set(s, s * (0.9 + rng() * 0.25), s);
    dummy.updateMatrix();

    // Per-instance tints: small multiplicative drift so forest doesn't look cloned.
    // Kept ≤5% so baked canopy vertex gradient (dark tips → light base) survives intact.
    const trunkR = 0.92 + rng() * 0.16;
    const trunkG = 0.94 + rng() * 0.12;
    const trunkB = 0.92 + rng() * 0.14;
    trunkTint.setRGB(trunkR, trunkG, trunkB);
    const canopyR = 0.95 + rng() * 0.08;
    const canopyG = 0.96 + rng() * 0.08;
    const canopyB = 0.93 + rng() * 0.08;
    canopyTint.setRGB(canopyR, canopyG, canopyB);

    if (isBroadleaf) {
      leafTrunks.setMatrixAt(leavesPlaced, dummy.matrix);
      leafCanopies.setMatrixAt(leavesPlaced, dummy.matrix);
      leafTrunks.setColorAt(leavesPlaced, trunkTint);
      leafCanopies.setColorAt(leavesPlaced, canopyTint);
      leavesPlaced++;
    } else {
      pineTrunks.setMatrixAt(pinesPlaced, dummy.matrix);
      pineCanopies.setMatrixAt(pinesPlaced, dummy.matrix);
      pineTrunks.setColorAt(pinesPlaced, trunkTint);
      pineCanopies.setColorAt(pinesPlaced, canopyTint);
      pinesPlaced++;
    }
    addCollider(x, z, 0.6 * s);
  }
  pineTrunks.count = pinesPlaced;
  pineCanopies.count = pinesPlaced;
  leafTrunks.count = leavesPlaced;
  leafCanopies.count = leavesPlaced;
  for (const m of [pineTrunks, pineCanopies, leafTrunks, leafCanopies]) {
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    game.propsRoot.add(m);
  }
}

function scatterRocks(count) {
  const perVariant = Math.ceil(count / 3);
  const sharedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, // multiplied with vertex colors (stone <-> moss)
    roughness: 0.96,
    metalness: 0,
    vertexColors: true
  });
  const meshes = [
    new THREE.InstancedMesh(buildRockVariantGeo(10111, 0.95), sharedMat, perVariant),
    new THREE.InstancedMesh(buildRockVariantGeo(20222, 1.05), sharedMat, perVariant),
    new THREE.InstancedMesh(buildRockVariantGeo(30333, 0.78), sharedMat, perVariant)
  ];
  for (let i = 0; i < meshes.length; i++) {
    meshes[i].castShadow = true;
    meshes[i].receiveShadow = true;
    meshes[i].name = 'rocks-' + i;
  }
  const placedPerVariant = [0, 0, 0];

  const rng = seedRng(20110);
  const dummy = new THREE.Object3D();
  let placed = 0, attempts = 0;
  while (placed < count && attempts < count * 30) {
    attempts++;
    const ang = rng() * Math.PI * 2;
    const rad = rng() * (WORLD_RADIUS * 0.95) + 4;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    if (insideZone(x, z, 1)) continue;
    const h = sampleTerrainH(x, z);
    if (h < -0.4 || h > 4.5) continue;
    const s = 0.5 + rng() * 1.1;
    dummy.position.set(x, h - 0.1, z);
    dummy.rotation.set(rng() * 0.5, rng() * Math.PI * 2, rng() * 0.4);
    dummy.scale.set(s, s * (0.6 + rng() * 0.4), s);
    dummy.updateMatrix();
    let variantIdx = (rng() * 3) | 0;
    if (placedPerVariant[variantIdx] >= perVariant) {
      variantIdx = placedPerVariant.findIndex(n => n < perVariant);
      if (variantIdx < 0) break;
    }
    meshes[variantIdx].setMatrixAt(placedPerVariant[variantIdx], dummy.matrix);
    placedPerVariant[variantIdx]++;
    if (s > 0.75) addCollider(x, z, 0.5 * s);
    placed++;
  }
  for (let i = 0; i < meshes.length; i++) {
    meshes[i].count = placedPerVariant[i];
    meshes[i].instanceMatrix.needsUpdate = true;
    game.propsRoot.add(meshes[i]);
  }
}

// Grass tufts - simple two-triangle cross billboards (cheap)
function scatterGrass(count) {
  const geo = new THREE.PlaneGeometry(0.55, 0.5);
  // Duplicate cross for full-billboard volume
  const merged = mergeGeometries([geo.clone().rotateY(0), geo.clone().rotateY(Math.PI / 2)]);
  const mat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(PALETTE.leafLight),
    roughness: 0.88,
    transparent: true,
    alphaTest: 0.45,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.InstancedMesh(merged, mat, count);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  mesh.name = 'grass';

  const rng = seedRng(3000);
  const dummy = new THREE.Object3D();
  let placed = 0, attempts = 0;
  while (placed < count && attempts < count * 8) {
    attempts++;
    const ang = rng() * Math.PI * 2;
    const rad = rng() * (WORLD_RADIUS * 0.8) + 4;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    const h = sampleTerrainH(x, z);
    if (h < 0.8 || h > 3.5) continue;
    if (insideZone(x, z, 0.3)) continue;
    const s = 0.8 + rng() * 0.7;
    dummy.position.set(x, h - 0.05, z);
    dummy.rotation.set(0, rng() * Math.PI * 2, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    mesh.setMatrixAt(placed, dummy.matrix);
    placed++;
  }
  mesh.count = placed;
  mesh.instanceMatrix.needsUpdate = true;
  game.propsRoot.add(mesh);
}
