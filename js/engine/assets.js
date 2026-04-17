// Procedural texture + environment map generators. All CPU-side Canvas2D work
// wrapped into THREE.CanvasTextures. Nothing downloads from disk.

export const Assets = {
  grassTexture: null,
  stoneTexture: null,
  sandTexture: null,
  waterNormalTex: null,
  noiseTex: null,
  envMap: null
};

function canvasTex(size, draw, repeat) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  if (THREE.SRGBColorSpace) t.colorSpace = THREE.SRGBColorSpace;
  else if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding;
  return t;
}

function dataNormalMap(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  g.fillStyle = '#8080ff';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 160; i++) {
    const x = Math.random() * size, y = Math.random() * size;
    const r = 8 + Math.random() * 30;
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(110,130,255,0.8)');
    grad.addColorStop(1, 'rgba(128,128,255,0)');
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
}

function grassPattern(g, size) {
  g.fillStyle = '#5f8a3b';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 0.6 + Math.random() * 0.4;
    const r = Math.floor(90 * shade);
    const gr = Math.floor(150 * shade);
    const b = Math.floor(60 * shade);
    g.fillStyle = 'rgba(' + r + ',' + gr + ',' + b + ',' + (0.3 + Math.random() * 0.4) + ')';
    g.fillRect(x, y, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
  // occasional flower
  for (let i = 0; i < 35; i++) {
    g.fillStyle = ['#f5c741','#f2a5c5','#e5e5e5','#ffce4e'][Math.floor(Math.random() * 4)];
    g.beginPath();
    g.arc(Math.random() * size, Math.random() * size, 1.6, 0, Math.PI * 2);
    g.fill();
  }
}

function stonePattern(g, size) {
  g.fillStyle = '#7a7f86';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = Math.floor(80 + Math.random() * 80);
    g.fillStyle = 'rgba(' + v + ',' + v + ',' + (v + 10) + ',0.45)';
    g.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
  }
  // cracks
  g.strokeStyle = 'rgba(40,42,48,0.45)';
  g.lineWidth = 1;
  for (let i = 0; i < 40; i++) {
    g.beginPath();
    let x = Math.random() * size, y = Math.random() * size;
    g.moveTo(x, y);
    for (let j = 0; j < 6; j++) {
      x += (Math.random() - 0.5) * 20;
      y += (Math.random() - 0.5) * 20;
      g.lineTo(x, y);
    }
    g.stroke();
  }
}

function sandPattern(g, size) {
  g.fillStyle = '#e4c886';
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const v = 200 + Math.random() * 40;
    g.fillStyle = 'rgba(' + Math.floor(v) + ',' + Math.floor(v * 0.85) + ',' + Math.floor(v * 0.55) + ',' + (0.2 + Math.random() * 0.4) + ')';
    g.fillRect(x, y, 1, 1);
  }
}

function noisePattern(g, size) {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = Math.floor(Math.random() * 255);
      g.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
      g.fillRect(x, y, 1, 1);
    }
  }
}

export function initAssets() {
  Assets.grassTexture   = canvasTex(256, grassPattern, 80);
  Assets.stoneTexture   = canvasTex(256, stonePattern, 14);
  Assets.sandTexture    = canvasTex(256, sandPattern,  40);
  Assets.noiseTex       = canvasTex(128, noisePattern, 1);
  Assets.waterNormalTex = dataNormalMap(256);
}

// Build an HDR-ish environment cube from a procedural gradient scene,
// then PMREM-filter it so Standard materials get decent reflections.
export function buildEnvMap(renderer) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  // Build a procedural equirect sky as canvas texture.
  const w = 512, h = 256;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.0, '#6aa8e6');
  grad.addColorStop(0.4, '#b9d7ef');
  grad.addColorStop(0.55, '#fff0d0');
  grad.addColorStop(0.7, '#f0d5ad');
  grad.addColorStop(1.0, '#6d5c4a');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);
  // sun glow band
  g.fillStyle = 'rgba(255,230,180,0.6)';
  g.beginPath();
  g.ellipse(w * 0.5, h * 0.55, w * 0.25, h * 0.08, 0, 0, Math.PI * 2);
  g.fill();

  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  const cubeRT = pmrem.fromEquirectangular(tex);
  Assets.envMap = cubeRT.texture;
  pmrem.dispose();
  tex.dispose();
  return Assets.envMap;
}
