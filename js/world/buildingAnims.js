import { game } from '../state.js';

export function makeFlag(poleHeight, clothWidth, clothHeight, color) {
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, poleHeight, 6),
    new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.6, metalness: 0.3 })
  );
  pole.position.y = poleHeight / 2;
  pole.castShadow = true;

  const clothGeo = new THREE.PlaneGeometry(clothWidth, clothHeight, 12, 8);
  const clothMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.8,
    side: THREE.DoubleSide
  });
  const cloth = new THREE.Mesh(clothGeo, clothMat);
  cloth.position.set(clothWidth / 2, poleHeight - clothHeight / 2, 0);
  cloth.castShadow = true;

  const basePositions = new Float32Array(clothGeo.attributes.position.array);

  function update(dt, time) {
    const pos = clothGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const bx = basePositions[i * 3];
      const normalizedX = (bx + clothWidth / 2) / clothWidth;
      const amp = normalizedX * 0.12;
      pos.array[i * 3 + 2] = basePositions[i * 3 + 2] + Math.sin(bx * 3 + time * 0.004) * amp;
    }
    pos.needsUpdate = true;
  }

  return { meshes: [pole, cloth], update };
}

export function makeSmokeEmitter(originY, color, count) {
  count = count || 10;
  const particles = [];
  for (let i = 0; i < count; i++) {
    const r = 0.08 + Math.random() * 0.04;
    const geo = new THREE.SphereGeometry(r, 6, 4);
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.6,
      roughness: 0.9
    });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = false;
    m.receiveShadow = false;
    m.userData.phase = Math.random() * Math.PI * 2;
    m.userData.speed = 0.3 + Math.random() * 0.4;
    m.userData.lifetime = 2000 + Math.random() * 2000;
    m.userData.age = Math.random() * m.userData.lifetime;
    m.userData.driftX = (Math.random() - 0.5) * 0.3;
    m.userData.driftZ = (Math.random() - 0.5) * 0.3;
    m.position.y = originY;
    particles.push(m);
  }

  function update(dt, time) {
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.userData.age += dt;
      if (p.userData.age >= p.userData.lifetime) {
        p.userData.age = 0;
        p.userData.speed = 0.3 + Math.random() * 0.4;
        p.userData.lifetime = 2000 + Math.random() * 2000;
        p.userData.driftX = (Math.random() - 0.5) * 0.3;
        p.userData.driftZ = (Math.random() - 0.5) * 0.3;
        p.scale.setScalar(1);
        p.material.opacity = 0.6;
        p.position.y = originY;
        continue;
      }
      const frac = p.userData.age / p.userData.lifetime;
      p.position.y = originY + frac * p.userData.speed * 4;
      p.position.x += p.userData.driftX * dt * 0.001;
      p.position.z += p.userData.driftZ * dt * 0.001;
      p.scale.setScalar(1 + frac * 1.5);
      p.material.opacity = 0.6 * (1 - frac);
    }
  }

  return { meshes: particles, update };
}

export function makeWindVane(radius, color) {
  const group = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(radius, 0.3, 0.03),
      new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: 0.7 })
    );
    blade.position.x = radius / 2;
    const arm = new THREE.Group();
    arm.add(blade);
    arm.rotation.y = i * Math.PI / 2;
    group.add(arm);
  }
  group.castShadow = true;

  function update(dt, time) {
    const speed = 1.5 + Math.sin(time * 0.001) * 0.5;
    group.rotation.y += speed * dt * 0.001;
  }

  return { meshes: [group], update };
}

export function makeDoorHinge(doorMesh, openAngle, openDuration, zoneId) {
  const pivot = new THREE.Group();
  const parent = doorMesh.parent;

  const doorWorldPos = new THREE.Vector3();
  doorMesh.getWorldPosition(doorWorldPos);

  const geo = doorMesh.geometry;
  geo.computeBoundingBox();
  const halfW = (geo.boundingBox.max.x - geo.boundingBox.min.x) / 2;

  pivot.position.copy(doorMesh.position);
  pivot.position.x -= halfW;

  if (parent) parent.remove(doorMesh);

  doorMesh.position.set(halfW, 0, 0);
  pivot.add(doorMesh);

  function update(dt, time) {
    const nz = game.nearestZone;
    let target = 0;
    if (nz && nz.id === zoneId) {
      target = openAngle;
    }
    pivot.rotation.y += (target - pivot.rotation.y) * Math.min(1, dt * 0.003);
  }

  return { meshes: [pivot], update };
}

export function makeHoverBob(mesh, amplitude, frequency, phaseOffset) {
  const originalY = mesh.position.y;

  function update(dt, time) {
    mesh.position.y = originalY + Math.sin(time * frequency + phaseOffset) * amplitude;
  }

  return { meshes: [], update };
}

export function makePulseRing(y, color, maxRadius, period) {
  const geo = new THREE.TorusGeometry(1, 0.04, 6, 32);
  const mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.8,
    depthWrite: false
  });
  const ring = new THREE.Mesh(geo, mat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = y;
  ring.castShadow = false;
  ring.receiveShadow = false;

  function update(dt, time) {
    const phase = (time % period) / period;
    const s = 0.1 + phase * (maxRadius - 0.1);
    ring.scale.setScalar(s);
    ring.material.opacity = 0.8 * (1 - phase);
  }

  return { meshes: [ring], update };
}

export function makePendulum(mesh, maxAngle, period) {
  function update(dt, time) {
    mesh.rotation.z = Math.sin(time / period * Math.PI * 2) * maxAngle;
  }

  return { meshes: [], update };
}
