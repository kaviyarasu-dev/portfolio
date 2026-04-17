// 14 landmark factories. Each returns a THREE.Group positioned at its zone
// anchor (on terrain). Each factory also registers colliders via addCollider().

import { game } from '../state.js';
import { PALETTE } from '../config.js';
import { ZONE_LAYOUT } from './zones.js';
import { addCollider } from './collision.js';
import {
  makeBox, makeCylinder, makeCone, makeSphere, makeTorus, makeGroup, hexToColor, makeStandard
} from '../util/three.js';
import { featured, otherProjects } from '../content/projects.js';

function sampleH(x, z) {
  if (game.terrainMesh && game.terrainMesh.userData.sampleHeight) {
    return game.terrainMesh.userData.sampleHeight(x, z);
  }
  return 0;
}

// Glowing material for accent beams, runes, screens.
function glow(color, intensity) {
  return new THREE.MeshStandardMaterial({
    color: hexToColor(color),
    emissive: hexToColor(color),
    emissiveIntensity: intensity != null ? intensity : 1.4,
    roughness: 0.35,
    metalness: 0.15,
    toneMapped: true
  });
}

// Signpost sign board — flat plank with title (no text here; text is on the HUD when you trigger it).
function sign(w, h, color) {
  const board = makeBox(w, h, 0.12, color, { roughness: 0.7 });
  const edge = makeBox(w + 0.1, h + 0.1, 0.06, PALETTE.woodDark, { roughness: 0.9 });
  edge.position.z = -0.05;
  const grp = makeGroup();
  grp.add(edge, board);
  return grp;
}

// Stylized fluted column: tapered cylinder shaft with 4 inward flutes, capital
// (abacus + echinus) on top, torus + plinth at the base. Group origin is shaft center.
function buildingTrimFlutedColumn(rTop, rBot, height, color, opts) {
  const g = new THREE.Group();
  const shaft = makeCylinder(rTop, rBot, height, color, 14, opts || { roughness: 0.82 });
  const pos = shaft.geometry.attributes.position;
  const fluteDepth = 0.05;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const ang = Math.atan2(z, x);
    const fluteMix = 0.5 + 0.5 * Math.cos(ang * 4);
    const factor = 1 - fluteMix * (fluteDepth / Math.max(rBot, 0.05));
    pos.setX(i, x * factor);
    pos.setZ(i, z * factor);
  }
  shaft.geometry.computeVertexNormals();
  g.add(shaft);

  const capitalMat = makeStandard(color, opts || { roughness: 0.82 });
  const echinusH = 0.22;
  const echinus = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop * 1.5, rTop * 1.05, echinusH, 14),
    capitalMat
  );
  echinus.position.y = height / 2 + echinusH / 2;
  echinus.castShadow = true;
  g.add(echinus);
  const abacusH = 0.1;
  const abacus = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop * 1.7, rTop * 1.7, abacusH, 14),
    capitalMat
  );
  abacus.position.y = height / 2 + echinusH + abacusH / 2;
  abacus.castShadow = true;
  g.add(abacus);

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(rBot * 1.1, 0.08, 8, 20),
    capitalMat
  );
  torus.rotation.x = Math.PI / 2;
  torus.position.y = -height / 2 - 0.05;
  torus.castShadow = true;
  g.add(torus);
  const plinth = new THREE.Mesh(
    new THREE.CylinderGeometry(rBot * 1.3, rBot * 1.35, 0.14, 14),
    capitalMat
  );
  plinth.position.y = -height / 2 - 0.15;
  plinth.receiveShadow = true;
  g.add(plinth);
  return g;
}

// Hipped roof over a rectangle. Ridge runs along the longer axis.
// Eaves at y=0, peak at y=peakHeight. Uses DoubleSide material to
// forgive winding details for irregular hip triangles.
function buildingTrimHippedRoof(width, depth, peakHeight, color, opts) {
  const hw = width / 2, hd = depth / 2;
  const ridgeAlongX = width > depth;
  const rl = ridgeAlongX ? (width - depth) / 2 : (depth - width) / 2;
  const vertices = new Float32Array(18);
  // 0..3: eaves
  vertices[0] = -hw; vertices[1] = 0; vertices[2] = -hd;
  vertices[3] =  hw; vertices[4] = 0; vertices[5] = -hd;
  vertices[6] =  hw; vertices[7] = 0; vertices[8] =  hd;
  vertices[9] = -hw; vertices[10] = 0; vertices[11] = hd;
  // 4..5: ridge endpoints
  if (ridgeAlongX) {
    vertices[12] = -rl; vertices[13] = peakHeight; vertices[14] = 0;
    vertices[15] =  rl; vertices[16] = peakHeight; vertices[17] = 0;
  } else {
    vertices[12] = 0; vertices[13] = peakHeight; vertices[14] = -rl;
    vertices[15] = 0; vertices[16] = peakHeight; vertices[17] =  rl;
  }
  const indices = ridgeAlongX
    ? [0, 1, 5,  0, 5, 4,  3, 4, 5,  3, 5, 2,  0, 4, 3,  1, 2, 5]
    : [0, 1, 4,  1, 5, 4,  1, 2, 5,  2, 3, 5,  3, 4, 5,  0, 4, 3];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mat = makeStandard(color, Object.assign({ roughness: 0.75 }, opts || {}));
  mat.side = THREE.DoubleSide;
  mat.flatShading = true;
  mat.needsUpdate = true;
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Thin soffit trim box just under a flat roof. Centered at (0, y-offset, 0).
function buildingTrimRoofSoffit(width, depth, thickness, color, opts) {
  return makeBox(width + 0.1, thickness, depth + 0.1, color, opts || { roughness: 0.88 });
}

// --- PLAZA ---------------------------------------------------------
function buildPlaza(x, z) {
  const g = makeGroup(x, 0, z);

  const base = makeCylinder(7, 7.5, 0.35, PALETTE.stone, 28, { roughness: 0.88 });
  base.position.y = sampleH(x, z) + 0.15;
  base.receiveShadow = true;
  g.add(base);

  // Centre plinth
  const plinth = makeCylinder(1.6, 1.8, 1.6, PALETTE.stoneDark, 16);
  plinth.position.y = sampleH(x, z) + 0.8;
  g.add(plinth);

  // Glowing "K" emblem
  const emblem = new THREE.Mesh(
    new THREE.TorusGeometry(0.5, 0.12, 8, 24),
    glow(PALETTE.accentBlue, 1.8)
  );
  emblem.position.y = sampleH(x, z) + 2.0;
  emblem.rotation.x = Math.PI / 2;
  g.add(emblem);

  const light = new THREE.PointLight(PALETTE.accentBlue, 1.2, 14, 2.0);
  light.position.y = sampleH(x, z) + 2.0;
  g.add(light);
  emblem.userData.update = (dt, t) => {
    emblem.rotation.z = t * 0.0005;
    light.intensity = 1.0 + Math.sin(t * 0.002) * 0.2;
  };

  addCollider(x, z, 1.8);
  return g;
}

// --- NOTICE BOARD ---------------------------------------------------
function buildNotice(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  const post1 = makeCylinder(0.09, 0.09, 1.9, PALETTE.wood, 8);
  post1.position.set(-0.8, y0 + 0.95, 0);
  const post2 = post1.clone();
  post2.position.x = 0.8;
  g.add(post1, post2);

  const board = sign(2.2, 1.3, PALETTE.wood);
  board.position.set(0, y0 + 1.55, 0);
  g.add(board);

  // Parchment with hint of accent
  const parchment = makeBox(1.8, 1.0, 0.04, 0xf3e7c6, { roughness: 0.9 });
  parchment.position.set(0, y0 + 1.55, 0.1);
  g.add(parchment);

  const icon = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.05, 8, 16),
    glow(PALETTE.accentViolet, 1.4)
  );
  icon.rotation.x = Math.PI / 2;
  icon.position.set(0, y0 + 2.5, 0);
  g.add(icon);

  addCollider(x, z, 1.1);
  return g;
}

// --- SKILL FORGE ----------------------------------------------------
function buildForge(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  // Stone base
  const base = makeBox(6, 0.4, 6, PALETTE.stoneDark, { roughness: 0.9 });
  base.position.y = y0 + 0.2;
  g.add(base);

  // Walls
  const wallMat = { roughness: 0.88 };
  const w1 = makeBox(6, 3, 0.4, PALETTE.stone, wallMat); w1.position.set(0, y0 + 1.9, -2.8);
  const w2 = w1.clone(); w2.position.z = 2.8;
  const w3 = makeBox(0.4, 3, 6, PALETTE.stone, wallMat); w3.position.set(-2.8, y0 + 1.9, 0);
  const w4 = w3.clone(); w4.position.x = 2.8;
  g.add(w1, w2, w3, w4);

  // Chimney
  const chim = makeBox(1.1, 3.5, 1.1, PALETTE.stoneDark);
  chim.position.set(1.5, y0 + 3.1, -1.4);
  g.add(chim);

  // Anvil
  const anvilBase = makeCylinder(0.45, 0.55, 0.55, PALETTE.stoneDark, 10);
  anvilBase.position.set(0, y0 + 0.65, 0);
  g.add(anvilBase);
  const anvilTop = makeBox(1.1, 0.25, 0.5, PALETTE.stoneDark);
  anvilTop.position.set(0, y0 + 0.96, 0);
  g.add(anvilTop);

  // Forge glow
  const fire = makeSphere(0.6, PALETTE.accentOrange, 16, 12, { emissive: PALETTE.accentOrange, emissiveIntensity: 2.2, roughness: 0.35 });
  fire.position.set(-1.5, y0 + 1.1, 0);
  g.add(fire);
  const fireLight = new THREE.PointLight(0xff7a33, 2.5, 14, 2);
  fireLight.position.set(-1.5, y0 + 1.4, 0);
  g.add(fireLight);

  // Floating gems — skill-themed
  const gemColors = [PALETTE.accentBlue, PALETTE.accentViolet, PALETTE.accentGold, PALETTE.accentGreen];
  const gems = [];
  for (let i = 0; i < 4; i++) {
    const gem = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.25),
      glow(gemColors[i], 1.6)
    );
    gem.userData.phase = i * Math.PI / 2;
    gem.userData.orbit = 1.4;
    g.add(gem);
    gems.push(gem);
  }

  g.userData.update = (dt, t) => {
    fire.scale.setScalar(1 + Math.sin(t * 0.008) * 0.08);
    fireLight.intensity = 2.0 + Math.sin(t * 0.02) * 0.8 + Math.random() * 0.2;
    for (let i = 0; i < gems.length; i++) {
      const gem = gems[i];
      const a = t * 0.0015 + gem.userData.phase;
      gem.position.set(
        Math.cos(a) * gem.userData.orbit,
        y0 + 3.0 + Math.sin(a * 2) * 0.2,
        Math.sin(a) * gem.userData.orbit
      );
      gem.rotation.y = t * 0.002;
      gem.rotation.x = t * 0.003;
    }
  };

  addCollider(x, z, 3.6);
  return g;
}

// --- GRAVITYWRITE CITADEL (featured, tallest) -----------------------
function buildCitadel(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);
  const theme = featured.themeColor;
  const accent = featured.accentColor;

  // Wide stone base
  const base = makeCylinder(6, 7, 0.6, PALETTE.stoneDark, 20, { roughness: 0.9 });
  base.position.y = y0 + 0.3;
  g.add(base);

  // Main tower (tapered, octagonal)
  const main = makeCylinder(2.6, 3.2, 14, PALETTE.stone, 8, { roughness: 0.82 });
  main.position.y = y0 + 7.5;
  g.add(main);

  // Windows (emissive stripes)
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3 - i * 0.2, 0.18, 8, 24),
      glow(theme, 1.4)
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y0 + 4 + i * 3.5;
    g.add(ring);
  }

  // Crown — floating rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const r = makeTorus(3.2 - i * 0.4, 0.08, 8, 40, accent, { emissive: accent, emissiveIntensity: 1.6 });
    r.position.y = y0 + 15 + i * 0.7;
    r.rotation.x = Math.PI / 2;
    g.add(r);
    rings.push(r);
  }

  // Top spire
  const spire = makeCone(1.6, 3.2, PALETTE.stone, 8);
  spire.position.y = y0 + 16.5;
  g.add(spire);

  // Top orb
  const orb = makeSphere(0.8, theme, 24, 18, { emissive: theme, emissiveIntensity: 2.2 });
  orb.position.y = y0 + 18.6;
  g.add(orb);

  const orbLight = new THREE.PointLight(theme, 3.0, 26, 2);
  orbLight.position.y = y0 + 18.6;
  g.add(orbLight);

  // Flying text particles around it? Use small glowing dots in a ring.
  const dots = [];
  for (let i = 0; i < 18; i++) {
    const d = makeSphere(0.09, accent, 8, 6, { emissive: accent, emissiveIntensity: 2.0 });
    d.userData.phase = i * (Math.PI * 2 / 18);
    d.userData.orbit = 4 + Math.random() * 0.6;
    g.add(d);
    dots.push(d);
  }

  g.userData.update = (dt, t) => {
    for (let i = 0; i < rings.length; i++) {
      rings[i].rotation.z = t * 0.0008 * (i % 2 === 0 ? 1 : -1);
    }
    for (let i = 0; i < dots.length; i++) {
      const d = dots[i];
      const a = t * 0.0012 + d.userData.phase;
      d.position.set(
        Math.cos(a) * d.userData.orbit,
        y0 + 10 + Math.sin(a * 1.3 + i) * 1.2,
        Math.sin(a) * d.userData.orbit
      );
    }
    orbLight.intensity = 2.8 + Math.sin(t * 0.0015) * 0.3;
  };

  addCollider(x, z, 4.2);
  return g;
}

// --- BROADCAST TOWER (GravitySocial) --------------------------------
function buildBroadcastTower(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);
  const p = otherProjects.find(pr => pr.id === 'gravitysocial');
  const theme = p.themeColor, accent = p.accentColor;

  // Base
  const base = makeBox(5, 0.4, 5, PALETTE.stoneDark); base.position.y = y0 + 0.2; g.add(base);

  // Lattice tower: four diagonals + horizontal ties
  const towerH = 10;
  for (let i = 0; i < 4; i++) {
    const leg = makeCylinder(0.1, 0.1, towerH, PALETTE.wood, 6, { roughness: 0.85 });
    const ang = i * Math.PI / 2;
    leg.position.set(Math.cos(ang) * 1.2, y0 + towerH / 2, Math.sin(ang) * 1.2);
    g.add(leg);
  }
  // Crossbars
  for (let h = 1; h <= 4; h++) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.05, 6, 16),
      makeStandard(PALETTE.wood)
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = y0 + h * (towerH / 5);
    g.add(band);
  }

  // Top broadcast dish
  const dish = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 0.4, 16),
    makeStandard(PALETTE.stoneDark, { metalness: 0.4, roughness: 0.4 })
  );
  dish.rotation.z = Math.PI / 3;
  dish.position.set(0.6, y0 + towerH + 0.3, 0);
  g.add(dish);

  // 5 platform discs (FB, LI, X, IG, YT) orbiting
  const platformColors = [0x1877F2, 0x0A66C2, 0xFFFFFF, 0xE4405F, 0xFF0000];
  const platforms = [];
  for (let i = 0; i < 5; i++) {
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.55, 0.12, 18),
      glow(platformColors[i], 1.0)
    );
    disc.rotation.x = Math.PI / 2;
    disc.userData.phase = i * (Math.PI * 2 / 5);
    g.add(disc);
    platforms.push(disc);
  }

  const pulse = makeSphere(0.35, accent, 20, 14, { emissive: accent, emissiveIntensity: 2.2 });
  pulse.position.set(0, y0 + towerH + 0.3, 0);
  g.add(pulse);
  const light = new THREE.PointLight(accent, 1.8, 18, 2); light.position.y = y0 + towerH + 0.3; g.add(light);

  g.userData.update = (dt, t) => {
    for (let i = 0; i < platforms.length; i++) {
      const d = platforms[i];
      const a = t * 0.0018 + d.userData.phase;
      d.position.set(
        Math.cos(a) * 3.2,
        y0 + 5.0 + Math.sin(a * 0.8 + i) * 0.8,
        Math.sin(a) * 3.2
      );
      d.rotation.z = t * 0.004;
    }
    pulse.scale.setScalar(1 + Math.sin(t * 0.005) * 0.15);
  };

  addCollider(x, z, 2.4);
  return g;
}

// --- GATEWAY ARCH (GravityAuth) -------------------------------------
function buildGateway(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);
  const p = otherProjects.find(pr => pr.id === 'gravityauth');
  const theme = p.themeColor;

  const pillarA = makeBox(0.9, 5, 1.0, PALETTE.stone);
  pillarA.position.set(-2.2, y0 + 2.5, 0); g.add(pillarA);
  const pillarB = pillarA.clone(); pillarB.position.x = 2.2; g.add(pillarB);

  // Arch top: half-torus in XY plane. Default orientation has arc 0..π
  // span from (+r, 0, 0) over (0, r, 0) to (-r, 0, 0) — exactly the archway shape.
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(2.2, 0.45, 10, 30, Math.PI),
    makeStandard(PALETTE.stone)
  );
  arch.position.set(0, y0 + 5, 0);
  arch.castShadow = true;
  g.add(arch);

  // Glowing portal plane
  const portal = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 4.4),
    new THREE.MeshBasicMaterial({
      color: hexToColor(theme),
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    })
  );
  portal.position.set(0, y0 + 2.6, 0);
  g.add(portal);

  const glowL = new THREE.PointLight(theme, 1.8, 14, 2);
  glowL.position.set(0, y0 + 2.6, 0);
  g.add(glowL);

  // Keystone emblem
  const key = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.35),
    glow(theme, 1.8)
  );
  key.position.set(0, y0 + 5.2, 0);
  g.add(key);

  g.userData.update = (dt, t) => {
    portal.material.opacity = 0.55 + Math.sin(t * 0.003) * 0.08;
    key.rotation.y = t * 0.002;
  };

  addCollider(x - 2.2, z, 0.6);
  addCollider(x + 2.2, z, 0.6);
  return g;
}

// --- TRANSPORT HUB (TransGenie) ------------------------------------
function buildTransportHub(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);
  const p = otherProjects.find(pr => pr.id === 'transgenie');
  const theme = p.themeColor, accent = p.accentColor;

  // Platform base + darker rim step
  const platform = makeBox(8, 0.5, 6, PALETTE.stone);
  platform.position.y = y0 + 0.25; g.add(platform);
  const platformRim = makeBox(8.6, 0.22, 6.6, PALETTE.stoneDark, { roughness: 0.92 });
  platformRim.position.y = y0 + 0.11; g.add(platformRim);

  // Four fluted columns with capitals + base
  const colHeight = 4.2;
  const colCenterY = y0 + 0.5 + colHeight / 2;
  for (let i = 0; i < 4; i++) {
    const cx = i < 2 ? -3.2 : 3.2;
    const cz = i % 2 === 0 ? -2.3 : 2.3;
    const column = buildingTrimFlutedColumn(0.22, 0.32, colHeight, PALETTE.wood, { roughness: 0.82 });
    column.position.set(cx, colCenterY, cz);
    g.add(column);
  }

  // Hipped canopy (ridge along X) + soffit trim underneath
  const canopyEaveY = y0 + 0.5 + colHeight + 0.3;
  const canopy = buildingTrimHippedRoof(8.6, 6.6, 1.5, theme, { roughness: 0.72 });
  canopy.position.y = canopyEaveY;
  g.add(canopy);
  const soffit = buildingTrimRoofSoffit(8.4, 6.4, 0.2, PALETTE.woodDark, { roughness: 0.9 });
  soffit.position.y = canopyEaveY - 0.11;
  g.add(soffit);

  // Lantern strips — dim basic color, bloom-safe
  const lanternCol = new THREE.Color(accent).multiplyScalar(0.35);
  const lanternMat = new THREE.MeshBasicMaterial({ color: lanternCol, toneMapped: true });
  const lanternFront = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.04, 0.08), lanternMat);
  lanternFront.position.set(0, canopyEaveY - 0.16, -3.08);
  const lanternBack = lanternFront.clone();
  lanternBack.position.z = 3.08;
  g.add(lanternFront, lanternBack);

  // Vehicle silhouettes (3 under canopy): delivery bike, van, scooter
  const v1 = makeBox(1.0, 0.5, 0.4, accent); v1.position.set(-2.5, y0 + 0.8, 0); g.add(v1);
  const v2 = makeBox(1.6, 0.7, 0.7, theme);  v2.position.set(0, y0 + 0.85, 0); g.add(v2);
  const v3 = makeBox(0.9, 0.4, 0.35, accent); v3.position.set(2.3, y0 + 0.8, 0); g.add(v3);
  for (const v of [v1, v2, v3]) {
    const wheelMat = makeStandard(PALETTE.stoneDark);
    const w1 = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.06, 6, 12), wheelMat);
    w1.rotation.y = Math.PI / 2;
    w1.position.set(v.position.x - 0.3, y0 + 0.5, v.position.z + 0.25);
    const w2 = w1.clone(); w2.position.x = v.position.x + 0.3;
    const w3 = w1.clone(); w3.position.z = v.position.z - 0.25;
    const w4 = w2.clone(); w4.position.z = v.position.z - 0.25;
    g.add(w1, w2, w3, w4);
  }

  // Emissive "realtime" dot floating
  const dot = makeSphere(0.25, accent, 16, 12, { emissive: accent, emissiveIntensity: 2.5 });
  dot.position.y = y0 + 5.2;
  g.add(dot);
  const dotL = new THREE.PointLight(accent, 1.2, 10, 2);
  dotL.position.y = y0 + 5.2; g.add(dotL);

  g.userData.update = (dt, t) => {
    dot.position.y = y0 + 5.2 + Math.sin(t * 0.003) * 0.3;
    dotL.intensity = 1.2 + Math.sin(t * 0.006) * 0.4;
  };

  addCollider(x, z, 3.6);
  return g;
}

// --- OPEN-SOURCE TEMPLE (AI Agent) ----------------------------------
function buildTemple(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);
  const p = otherProjects.find(pr => pr.id === 'ai-agent');
  const theme = p.themeColor;

  // Stepped base
  for (let s = 0; s < 3; s++) {
    const step = makeBox(6 - s * 0.9, 0.35, 6 - s * 0.9, PALETTE.stone);
    step.position.y = y0 + 0.18 + s * 0.35;
    g.add(step);
  }

  // Four pillars
  for (let i = 0; i < 4; i++) {
    const dx = i < 2 ? -1.9 : 1.9;
    const dz = i % 2 === 0 ? -1.9 : 1.9;
    const col = makeCylinder(0.28, 0.35, 3.6, PALETTE.stone, 12);
    col.position.set(dx, y0 + 2.9, dz);
    g.add(col);
  }

  // Roof (pyramid)
  const roof = makeCone(2.6, 1.8, PALETTE.stoneDark, 4);
  roof.position.y = y0 + 5.8;
  roof.rotation.y = Math.PI / 4;
  g.add(roof);

  // Center rune (Laravel red + OSS)
  const rune = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.5, 0.12, 48, 8),
    glow(theme, 1.8)
  );
  rune.position.y = y0 + 3.0;
  g.add(rune);
  const runeL = new THREE.PointLight(theme, 1.8, 14, 2); runeL.position.y = y0 + 3.0; g.add(runeL);

  // Glowing pedestal ring
  const ring = makeTorus(1.1, 0.08, 8, 40, theme, { emissive: theme, emissiveIntensity: 1.4 });
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y0 + 1.4; g.add(ring);

  g.userData.update = (dt, t) => {
    rune.rotation.y = t * 0.0014;
    rune.rotation.x = t * 0.0008;
    runeL.intensity = 1.4 + Math.sin(t * 0.003) * 0.4;
  };

  addCollider(x, z, 2.8);
  return g;
}

// --- 1CLX WORKSHOP (drag-and-drop stacked blocks) -------------------
function buildWorkshop(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);
  const p = otherProjects.find(pr => pr.id === '1clx');
  const theme = p.themeColor, accent = p.accentColor;

  // Workshop hut
  const base = makeBox(5, 2.8, 4, PALETTE.wood);
  base.position.y = y0 + 1.4; g.add(base);
  const roof = makeBox(5.4, 0.3, 4.4, theme);
  roof.position.y = y0 + 2.95; g.add(roof);

  // Door
  const door = makeBox(1.0, 1.7, 0.1, PALETTE.woodDark);
  door.position.set(0, y0 + 0.85, 2.01); g.add(door);

  // Stacked floating blocks (drag-drop metaphor)
  const blockColors = [theme, accent, 0x7cc7ff, 0xb48cff, 0x5ee0a0];
  const blocks = [];
  for (let i = 0; i < 5; i++) {
    const b = makeBox(0.7, 0.3, 0.7, blockColors[i], { emissive: blockColors[i], emissiveIntensity: 0.4 });
    b.userData.baseY = y0 + 3.4 + i * 0.45;
    b.userData.phase = i * 0.7;
    g.add(b);
    blocks.push(b);
  }

  g.userData.update = (dt, t) => {
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      b.position.set(
        Math.sin(t * 0.001 + b.userData.phase) * 0.3,
        b.userData.baseY + Math.sin(t * 0.0015 + b.userData.phase) * 0.15,
        Math.cos(t * 0.001 + b.userData.phase) * 0.3
      );
      b.rotation.y = t * 0.0008 + i;
    }
  };

  addCollider(x, z, 2.8);
  return g;
}

// --- FRESHNOTE STUDIO (small workshop) -----------------------------
function buildFreshnoteStudio(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  const hut = makeBox(3.6, 2.4, 3.2, PALETTE.wood);
  hut.position.y = y0 + 1.2; g.add(hut);
  const roof = makeCone(2.8, 1.2, PALETTE.woodDark, 4);
  roof.rotation.y = Math.PI / 4;
  roof.position.y = y0 + 3.0; g.add(roof);

  // Desk light inside (glowing window)
  const window1 = makeBox(0.9, 0.6, 0.05, 0xfff0c4, { emissive: 0xfff0c4, emissiveIntensity: 1.1 });
  window1.position.set(0, y0 + 1.6, 1.6); g.add(window1);
  const winL = new THREE.PointLight(0xffe7a0, 0.9, 8, 2); winL.position.set(0, y0 + 1.6, 2.0); g.add(winL);

  // Small sign
  const plank = makeBox(1.4, 0.35, 0.1, PALETTE.woodDark);
  plank.position.set(0, y0 + 2.95, 1.65); g.add(plank);

  addCollider(x, z, 1.9);
  return g;
}

// --- LIBRARY (4 wings = 4 jobs) ------------------------------------
function buildLibrary(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  // Central hall
  const hall = makeBox(5, 4, 5, PALETTE.stone);
  hall.position.y = y0 + 2; g.add(hall);
  const dome = makeSphere(2.4, PALETTE.stoneDark, 16, 8);
  dome.scale.y = 0.6;
  dome.position.y = y0 + 4.5; g.add(dome);
  const spire = makeCone(0.4, 1.2, PALETTE.accentGold, 8);
  spire.position.y = y0 + 5.7; g.add(spire);

  // 4 wings (N, E, S, W) with different wing colors
  const wingColors = [PALETTE.accentBlue, PALETTE.accentViolet, PALETTE.accentGreen, PALETTE.accentGold];
  const dirs = [[0, -3.8], [3.8, 0], [0, 3.8], [-3.8, 0]];
  for (let i = 0; i < 4; i++) {
    const dx = dirs[i][0], dz = dirs[i][1];
    const wing = makeBox(2.5, 2.6, 2.5, PALETTE.wood);
    wing.position.set(dx, y0 + 1.3, dz); g.add(wing);
    const cap = makeBox(2.7, 0.2, 2.7, wingColors[i], { emissive: wingColors[i], emissiveIntensity: 0.4 });
    cap.position.set(dx, y0 + 2.7, dz); g.add(cap);
  }

  addCollider(x, z, 3.6);
  return g;
}

// --- ACADEMY -------------------------------------------------------
function buildAcademy(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  const main = makeBox(6, 3, 4, PALETTE.wood);
  main.position.y = y0 + 1.5; g.add(main);
  const roof = makeBox(6.4, 0.3, 4.4, PALETTE.accentRed);
  roof.position.y = y0 + 3.15; g.add(roof);

  // Tower
  const tower = makeBox(1.2, 5, 1.2, PALETTE.wood);
  tower.position.set(2.0, y0 + 2.5, 0); g.add(tower);
  const bellRoof = makeCone(1.0, 1.2, PALETTE.accentRed, 4);
  bellRoof.rotation.y = Math.PI / 4;
  bellRoof.position.set(2.0, y0 + 5.6, 0); g.add(bellRoof);
  const bell = makeSphere(0.35, PALETTE.accentGold, 14, 10, { metalness: 0.5, roughness: 0.3 });
  bell.position.set(2.0, y0 + 4.8, 0); g.add(bell);

  // Windows
  for (let i = -1; i <= 1; i++) {
    const w = makeBox(0.6, 0.9, 0.06, 0xd9e9ff, { emissive: 0xbbd4ff, emissiveIntensity: 0.5 });
    w.position.set(i * 1.4, y0 + 1.8, 2.02); g.add(w);
  }

  addCollider(x, z, 3.2);
  return g;
}

// --- LIGHTHOUSE ---------------------------------------------------
function buildLighthouse(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  const base = makeCylinder(2.2, 2.6, 1.2, PALETTE.stoneDark, 14);
  base.position.y = y0 + 0.6; g.add(base);

  // Striped tower
  const segs = 5;
  const segH = 2.0;
  for (let i = 0; i < segs; i++) {
    const seg = makeCylinder(1.1 - i * 0.05, 1.2 - i * 0.05, segH, i % 2 === 0 ? 0xffffff : PALETTE.accentRed, 16);
    seg.position.y = y0 + 1.2 + i * segH + segH / 2;
    g.add(seg);
  }

  const top = makeCylinder(1.1, 1.3, 0.6, PALETTE.stone, 16);
  top.position.y = y0 + 1.2 + segs * segH + 0.3; g.add(top);

  // Lamp room
  const lampHouse = makeCylinder(0.9, 0.9, 1.2, 0xffefaa, 16, { emissive: 0xffe08a, emissiveIntensity: 1.6 });
  lampHouse.position.y = y0 + 1.2 + segs * segH + 1.2; g.add(lampHouse);
  const lampLight = new THREE.PointLight(0xfff0b8, 3.0, 40, 2);
  lampLight.position.copy(lampHouse.position);
  g.add(lampLight);

  // Rotating spotlight beam: put the cone in a pivot group so we can spin
  // the whole group around world Y. The cone itself is oriented horizontally.
  const beamPivot = makeGroup(0, y0 + 1.2 + segs * segH + 1.2, 0);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(3.0, 24, 24, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0xfff2c8,
      transparent: true,
      opacity: 0.14,
      side: THREE.DoubleSide,
      depthWrite: false,
      fog: false
    })
  );
  // Cone default: apex +Y. Rotate around X so apex points +Z (horizontal beam).
  beam.rotation.x = Math.PI / 2;
  // Shift so base sits at pivot, apex extends outward
  beam.position.z = 12;
  beamPivot.add(beam);
  g.add(beamPivot);

  const cap = makeCone(1.1, 1.0, PALETTE.accentRed, 16);
  cap.position.y = y0 + 1.2 + segs * segH + 2.2; g.add(cap);

  g.userData.update = (dt, t) => {
    beamPivot.rotation.y = t * 0.0006;
    lampLight.intensity = 2.6 + Math.sin(t * 0.002) * 0.3;
  };

  addCollider(x, z, 2.2);
  return g;
}

// --- MILESTONES MONUMENT ------------------------------------------
function buildMilestones(x, z) {
  const g = makeGroup(x, 0, z);
  const y0 = sampleH(x, z);

  // Stone platform
  const plat = makeCylinder(3.2, 3.4, 0.4, PALETTE.stone, 18);
  plat.position.y = y0 + 0.2; g.add(plat);

  // Obelisk
  const obelisk = makeBox(1.2, 7.5, 1.2, PALETTE.stoneDark);
  obelisk.position.y = y0 + 4.15; g.add(obelisk);

  const top = makeCone(0.9, 1.0, PALETTE.accentGold, 4);
  top.rotation.y = Math.PI / 4;
  top.position.y = y0 + 8.4; g.add(top);

  // Four glowing metric bands on obelisk
  const bandColors = [PALETTE.accentBlue, PALETTE.accentViolet, PALETTE.accentGreen, PALETTE.accentOrange];
  for (let i = 0; i < 4; i++) {
    const band = makeBox(1.22, 0.15, 1.22, bandColors[i], { emissive: bandColors[i], emissiveIntensity: 0.9 });
    band.position.y = y0 + 1.5 + i * 1.6;
    g.add(band);
  }

  // Orbiting number symbols (basic glowing shapes)
  const syms = [];
  const symColors = [PALETTE.accentBlue, PALETTE.accentGold, PALETTE.accentGreen, PALETTE.accentViolet];
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.24),
      glow(symColors[i], 1.6)
    );
    s.userData.phase = i * Math.PI / 2;
    g.add(s);
    syms.push(s);
  }

  g.userData.update = (dt, t) => {
    for (let i = 0; i < syms.length; i++) {
      const a = t * 0.0014 + syms[i].userData.phase;
      syms[i].position.set(Math.cos(a) * 2.6, y0 + 5 + Math.sin(a * 2) * 0.3, Math.sin(a) * 2.6);
      syms[i].rotation.y = t * 0.002;
    }
  };

  addCollider(x, z, 2.0);
  return g;
}

// --- REGISTRATION -------------------------------------------------
const BUILD_FACTORIES = {
  plaza:      buildPlaza,
  notice:     buildNotice,
  forge:      buildForge,
  citadel:    buildCitadel,
  broadcast:  buildBroadcastTower,
  gateway:    buildGateway,
  transport:  buildTransportHub,
  temple:     buildTemple,
  workshop:   buildWorkshop,
  freshnote:  buildFreshnoteStudio,
  library:    buildLibrary,
  academy:    buildAcademy,
  lighthouse: buildLighthouse,
  milestones: buildMilestones
};

export function placeBuildings() {
  const placed = [];
  for (const zone of ZONE_LAYOUT) {
    const factory = BUILD_FACTORIES[zone.id];
    if (!factory) continue;
    const group = factory(zone.x, zone.z);
    group.name = 'building-' + zone.id;
    game.buildingsRoot.add(group);
    placed.push({
      id: zone.id,
      name: zone.name,
      x: zone.x,
      z: zone.z,
      r: zone.r,
      group,
      prompt: zone.prompt
    });
  }
  game.zones = placed;
}

export function updateBuildings(dt, time) {
  const root = game.buildingsRoot;
  if (!root) return;
  for (let i = 0; i < root.children.length; i++) {
    const c = root.children[i];
    if (c.userData && c.userData.update) c.userData.update(dt, time);
  }
}
