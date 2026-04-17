// Tiny THREE helpers. Relies on global `THREE` from CDN.
// All factories return ready-to-add meshes/groups.

export function hexToColor(hex) { return new THREE.Color(hex); }

export function makeStandard(color, opts) {
  const mat = new THREE.MeshStandardMaterial({
    color: hexToColor(color),
    roughness: opts && opts.roughness != null ? opts.roughness : 0.78,
    metalness: opts && opts.metalness != null ? opts.metalness : 0.05,
    flatShading: opts && opts.flat === true
  });
  if (opts && opts.emissive != null) {
    mat.emissive = hexToColor(opts.emissive);
    mat.emissiveIntensity = opts.emissiveIntensity != null ? opts.emissiveIntensity : 0.6;
  }
  return mat;
}

export function makeBox(w, h, d, color, opts) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeCylinder(rt, rb, h, color, radial, opts) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, radial || 16);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeCone(r, h, color, radial, opts) {
  const geo = new THREE.ConeGeometry(r, h, radial || 12);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeSphere(r, color, widthSeg, heightSeg, opts) {
  const geo = new THREE.SphereGeometry(r, widthSeg || 16, heightSeg || 12);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeTorus(r, tube, radial, tubular, color, opts) {
  const geo = new THREE.TorusGeometry(r, tube, radial || 8, tubular || 24);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function makeGlowSphere(r, color, intensity) {
  const geo = new THREE.SphereGeometry(r, 16, 12);
  const mat = new THREE.MeshBasicMaterial({
    color: hexToColor(color),
    transparent: true,
    opacity: 0.85
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.emissiveIntensity = intensity || 1.0;
  return mesh;
}

export function makeGroup(x, y, z) {
  const g = new THREE.Group();
  if (x != null) g.position.set(x, y || 0, z || 0);
  return g;
}

export function disposeObject(obj) {
  obj.traverse(node => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach(m => m.dispose());
    }
  });
}

export function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

// Minimal BufferGeometry merger (BufferGeometryUtils isn't in UMD r147 core).
// Accepts optional per-source color attributes; if any source has vertex colors
// the merged geometry carries a color attribute (sources without colors contribute white).
export function mergeGeometries(geoms, useGroups) {
  const positionArrays = [];
  const normalArrays = [];
  const colorArrays = [];
  const indexArrays = [];
  let hasAnyColor = false;
  let indexOffset = 0;
  const groups = [];
  let groupStart = 0;
  for (let gi = 0; gi < geoms.length; gi++) {
    const g = geoms[gi];
    g.computeVertexNormals();
    const pos = g.attributes.position;
    const nrm = g.attributes.normal;
    const col = g.attributes.color;
    if (col) hasAnyColor = true;
    positionArrays.push(pos.array);
    normalArrays.push(nrm.array);
    colorArrays.push(col ? col.array : null);
    let idx;
    if (g.index) idx = g.index.array;
    else {
      idx = new Uint32Array(pos.count);
      for (let i = 0; i < pos.count; i++) idx[i] = i;
    }
    const shifted = new Uint32Array(idx.length);
    for (let i = 0; i < idx.length; i++) shifted[i] = idx[i] + indexOffset;
    indexArrays.push(shifted);
    if (useGroups && g.groups && g.groups.length) {
      for (const grp of g.groups) {
        groups.push({ start: groupStart + grp.start, count: grp.count, materialIndex: grp.materialIndex || 0 });
      }
    } else if (useGroups) {
      groups.push({ start: groupStart, count: idx.length, materialIndex: 0 });
    }
    groupStart += idx.length;
    indexOffset += pos.count;
  }
  const totalPos = positionArrays.reduce((a, b) => a + b.length, 0);
  const positions = new Float32Array(totalPos);
  const normals = new Float32Array(totalPos);
  let off = 0;
  for (const p of positionArrays) { positions.set(p, off); off += p.length; }
  off = 0;
  for (const n of normalArrays) { normals.set(n, off); off += n.length; }
  const totalIdx = indexArrays.reduce((a, b) => a + b.length, 0);
  const indices = new Uint32Array(totalIdx);
  off = 0;
  for (const i of indexArrays) { indices.set(i, off); off += i.length; }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  merged.setAttribute('normal',   new THREE.BufferAttribute(normals, 3));
  if (hasAnyColor) {
    const colors = new Float32Array(totalPos);
    let coff = 0;
    for (let ci = 0; ci < colorArrays.length; ci++) {
      const c = colorArrays[ci];
      const len = positionArrays[ci].length;
      if (c) {
        colors.set(c, coff);
      } else {
        for (let k = 0; k < len; k++) colors[coff + k] = 1;
      }
      coff += len;
    }
    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  merged.setIndex(new THREE.BufferAttribute(indices, 1));
  if (useGroups) for (const grp of groups) merged.addGroup(grp.start, grp.count, grp.materialIndex);
  return merged;
}
