// 3D island terrain - PlaneGeometry displaced by island shape + multi-octave noise.
// Vertex colors blend grass, sand, stone. A sampleHeight(x, z) closure is attached
// to the mesh for camera/player/interaction sampling.

import { game } from '../state.js';
import {
  WORLD_RADIUS, TERRAIN_SIZE, TERRAIN_SEGMENTS, WATER_LEVEL, PALETTE
} from '../config.js';
import { ZONE_LAYOUT } from './zones.js';

function rng(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    if (s <= 0) s += 2147483646;
    return s / 2147483647;
  };
}

function smoothNoise2D(seed) {
  const r = rng(seed);
  const GRID = 32;
  const table = new Float32Array(GRID * GRID);
  for (let i = 0; i < table.length; i++) table[i] = r() * 2 - 1;
  const get = (gx, gy) => {
    gx = ((gx % GRID) + GRID) % GRID;
    gy = ((gy % GRID) + GRID) % GRID;
    return table[gy * GRID + gx];
  };
  return (x, y) => {
    const gx = Math.floor(x), gy = Math.floor(y);
    const fx = x - gx, fy = y - gy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const n00 = get(gx, gy);
    const n10 = get(gx + 1, gy);
    const n01 = get(gx, gy + 1);
    const n11 = get(gx + 1, gy + 1);
    const nx0 = n00 + sx * (n10 - n00);
    const nx1 = n01 + sx * (n11 - n01);
    return nx0 + sy * (nx1 - nx0);
  };
}

function islandShape(x, z) {
  // Circular island with gentle drop-off. x, z in meters.
  const d = Math.sqrt(x * x + z * z);
  const nd = d / WORLD_RADIUS;  // 0..1 inside island
  // Central plateau + outer drop
  if (nd < 0.65) return 2.2 + Math.cos(nd * Math.PI * 0.5) * 0.8;
  if (nd < 0.95) return 1.2 * (1 - (nd - 0.65) / 0.3);
  return -2.5 * (nd - 0.95) / 0.2; // underwater slope
}

// Pathways - soft tint on the ground between plaza and each zone.
function pathInfluence(x, z) {
  let maxInfl = 0;
  for (let i = 0; i < ZONE_LAYOUT.length; i++) {
    const zone = ZONE_LAYOUT[i];
    if (zone.id === 'plaza') continue;
    // Distance from line segment (0,0)→(zone.x,zone.z)
    const ax = zone.x, az = zone.z;
    const len = Math.sqrt(ax * ax + az * az);
    if (len < 0.01) continue;
    const t = Math.max(0, Math.min(1, (x * ax + z * az) / (len * len)));
    const px = ax * t, pz = az * t;
    const dx = x - px, dz = z - pz;
    const d = Math.sqrt(dx * dx + dz * dz);
    const band = 3.5; // path half-width
    if (d < band) {
      const infl = 1 - d / band;
      if (infl > maxInfl) maxInfl = infl;
    }
  }
  return maxInfl;
}

function flattenNearZones(x, z) {
  // Returns [flatten, height] - inside a zone radius we zero noise and lift to 2.5
  for (let i = 0; i < ZONE_LAYOUT.length; i++) {
    const zone = ZONE_LAYOUT[i];
    const dx = x - zone.x, dz = z - zone.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    const r = zone.r * 1.6;
    if (d < r) {
      const t = d / r;
      const w = 1 - t * t;
      return { flatten: w, baseHeight: 2.4 };
    }
  }
  return { flatten: 0, baseHeight: 0 };
}

export function buildTerrain() {
  const geo = new THREE.PlaneGeometry(
    TERRAIN_SIZE, TERRAIN_SIZE,
    TERRAIN_SEGMENTS, TERRAIN_SEGMENTS
  );
  geo.rotateX(-Math.PI / 2);

  const noise1 = smoothNoise2D(9271);
  const noise2 = smoothNoise2D(1984);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  const colGrassA = new THREE.Color(PALETTE.grass);
  const colGrassB = new THREE.Color(PALETTE.grassDark);
  const colSand   = new THREE.Color(PALETTE.sand);
  const colSandD  = new THREE.Color(PALETTE.sandDark);
  const colStone  = new THREE.Color(PALETTE.stoneDark);
  const colPath   = new THREE.Color(PALETTE.pathLight);

  // We'll cache heights for later sampling (nearest neighbour).
  const nX = TERRAIN_SEGMENTS + 1;
  const heightCache = new Float32Array(nX * nX);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Height
    let h = islandShape(x, z);
    const n = noise1(x * 0.06, z * 0.06) * 0.9 + noise2(x * 0.18, z * 0.18) * 0.35;
    h += n;

    const flat = flattenNearZones(x, z);
    if (flat.flatten > 0) {
      h = h * (1 - flat.flatten) + flat.baseHeight * flat.flatten;
    }
    const pInf = pathInfluence(x, z);
    if (pInf > 0) {
      // Slight path depression and flattening
      h = h * (1 - pInf * 0.4) + 2.2 * pInf * 0.4;
    }
    pos.setY(i, h);

    // Cache
    heightCache[i] = h;

    // Color by height + proximity
    const dRadial = Math.sqrt(x * x + z * z) / WORLD_RADIUS;
    let col;
    if (h < WATER_LEVEL + 0.1) {
      col = colSandD;
    } else if (h < 1.0 || dRadial > 0.7) {
      col = colSand;
    } else {
      // grass blend
      const g = Math.min(1, 0.4 + (h - 1.2) * 0.3 + noise2(x * 0.3, z * 0.3) * 0.3);
      col = colGrassA.clone().lerp(colGrassB, g);
      // rocky patches on higher ground
      if (h > 3.2) col.lerp(colStone, Math.min(1, (h - 3.2) * 0.8));
    }

    if (pInf > 0.05) {
      col = col.clone().lerp(colPath, pInf * 0.75);
    }

    colors[i * 3 + 0] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.0
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  // Sampler using the same heightfield derivation (analytic, matches geometry).
  mesh.userData.sampleHeight = (x, z) => {
    let h = islandShape(x, z);
    h += noise1(x * 0.06, z * 0.06) * 0.9 + noise2(x * 0.18, z * 0.18) * 0.35;
    const flat = flattenNearZones(x, z);
    if (flat.flatten > 0) h = h * (1 - flat.flatten) + flat.baseHeight * flat.flatten;
    const pInf = pathInfluence(x, z);
    if (pInf > 0) h = h * (1 - pInf * 0.4) + 2.2 * pInf * 0.4;
    return h;
  };

  game.terrainMesh = mesh;
  game.worldRoot.add(mesh);

  return mesh;
}
