// Auto-generated from /js/*.js - do not edit. Run `node build.mjs` to regenerate.
(function(){
"use strict";

// ===== js/config.js =====
// Portfolio 2030 - 3D world config. All units are meters.
const WORLD_RADIUS = 180;          // island radius
const TERRAIN_SIZE = 420;          // terrain plane edge
const TERRAIN_SEGMENTS = 160;      // heightmap resolution
const WATER_LEVEL = -1.2;
const CAMERA_FOV_BASE = 62;
const CAMERA_FOV_SPRINT = 70;
const CAMERA_NEAR = 0.1;
const CAMERA_FAR = 600;
const CAMERA_DISTANCE = 5.2;
const CAMERA_HEIGHT = 2.35;
const CAMERA_SHOULDER = 0.55;
const WALK_SPEED = 4.0;
const SPRINT_SPEED = 7.8;
const TURN_LERP = 14.0;
const MOVE_ACCEL = 18.0;
const MOVE_DECEL = 22.0;
const SHADOW_MAP_SIZE_DESKTOP = 2048;
const SHADOW_MAP_SIZE_MOBILE = 1024;
const SHADOW_FRUSTUM_SIZE = 55;
const FOG_COLOR_DAY = 0xbcd4ea;
const FOG_COLOR_DUSK = 0xe8a77c;
const FOG_COLOR_NIGHT = 0x0d1a2e;
const FOG_DENSITY = 0.0085;
const SKY_TOP_DAY = 0x6fb7ff;
const SKY_MID_DAY = 0xbcd4ea;
const SKY_BOTTOM_DAY = 0xf0e2c4;
const SKY_TOP_DUSK = 0x30274e;
const SKY_MID_DUSK = 0xd47a4c;
const SKY_BOTTOM_DUSK = 0xffcb88;
const SKY_TOP_NIGHT = 0x05081a;
const SKY_MID_NIGHT = 0x0e1834;
const SKY_BOTTOM_NIGHT = 0x2a3357;
const PALETTE = {
  grass:        0x6fa04a,
  grassDark:    0x4f7a33,
  sand:         0xe6c887,
  sandDark:     0xb89a5a,
  stone:        0x8a8e95,
  stoneDark:    0x4a4e56,
  wood:         0x7a5a38,
  woodDark:     0x4a3420,
  water:        0x2a5f8a,
  waterDeep:    0x0f2a44,
  pathLight:    0xc9a577,
  pathDark:     0x88663d,
  leafLight:    0x7cb84a,
  leafDark:     0x3e6b24,
  accentBlue:   0x7cc7ff,
  accentViolet: 0xb48cff,
  accentGold:   0xf4c64e,
  accentOrange: 0xff8a55,
  accentRed:    0xe55a5a,
  accentGreen:  0x5ee0a0
};
const RESUME_HREF = './Kaviyarasu Full Stack Engineer Resume.pdf';
const TYPE_CPS = 120;
const INTERACT_RADIUS_DEFAULT = 4.2;
const DIALOGUE_CLOSE_RADIUS_PADDING = 2.0;

// ===== js/util/dom.js =====
function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.appendChild(document.createTextNode(attrs[k]));
      else node.setAttribute(k, attrs[k]);
    }
  }
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === 'string') node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  }
  return node;
}
const br = () => document.createElement('br');
const strong = (t) => el('strong', null, t);
function clearChildren(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

// ===== js/util/rng.js =====
function rand(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    if (s <= 0) s += 2147483646;
    return s / 2147483647;
  };
}

// ===== js/util/math.js =====
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
const smoothstep = (t) => t * t * (3 - 2 * t);
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const wrapAngle = (a) => {
  while (a > Math.PI)  a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const angleLerp = (a, b, t) => a + wrapAngle(b - a) * t;
const angleDamp = (a, b, lambda, dt) => {
  const d = wrapAngle(b - a);
  return a + d * (1 - Math.exp(-lambda * dt));
};

// ===== js/util/three.js =====
// Tiny THREE helpers. Relies on global `THREE` from CDN.
// All factories return ready-to-add meshes/groups.
function hexToColor(hex) { return new THREE.Color(hex); }
function makeStandard(color, opts) {
  const mat = new THREE.MeshStandardMaterial({
    color: hexToColor(color),
    roughness: opts && opts.roughness != null ? opts.roughness : 0.78,
    metalness: opts && opts.metalness != null ? opts.metalness : 0.05
  });
  if (opts && opts.flat === true) {
    mat.flatShading = true;
    mat.needsUpdate = true;
  }
  if (opts && opts.emissive != null) {
    mat.emissive = hexToColor(opts.emissive);
    mat.emissiveIntensity = opts.emissiveIntensity != null ? opts.emissiveIntensity : 0.6;
  }
  return mat;
}
function makeBox(w, h, d, color, opts) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function makeCylinder(rt, rb, h, color, radial, opts) {
  const geo = new THREE.CylinderGeometry(rt, rb, h, radial || 16);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function makeCone(r, h, color, radial, opts) {
  const geo = new THREE.ConeGeometry(r, h, radial || 12);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function makeSphere(r, color, widthSeg, heightSeg, opts) {
  const geo = new THREE.SphereGeometry(r, widthSeg || 16, heightSeg || 12);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function makeTorus(r, tube, radial, tubular, color, opts) {
  const geo = new THREE.TorusGeometry(r, tube, radial || 8, tubular || 24);
  const mesh = new THREE.Mesh(geo, makeStandard(color, opts));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
function makeGlowSphere(r, color, intensity) {
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
function makeGroup(x, y, z) {
  const g = new THREE.Group();
  if (x != null) g.position.set(x, y || 0, z || 0);
  return g;
}
function disposeObject(obj) {
  obj.traverse(node => {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach(m => m.dispose());
    }
  });
}
function v3(x, y, z) { return new THREE.Vector3(x, y, z); }

// Minimal BufferGeometry merger (BufferGeometryUtils isn't in UMD r147 core).
// Accepts optional per-source color attributes; if any source has vertex colors
// the merged geometry carries a color attribute (sources without colors contribute white).
function mergeGeometries(geoms, useGroups) {
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

// ===== js/state.js =====
// Shared mutable game state. Every system reads/writes here.
// Must not be reassigned; only its keys are mutated.
const game = {
  // DOM
  canvas: null,
  container: null,
  dialogueEl: null,
  hudZoneEl: null,
  promptEl: null,
  toastEl: null,
  crosshairEl: null,
  minimapCanvas: null,
  loaderEl: null,
  loaderBarEl: null,
  loaderHintEl: null,

  // Three.js core
  renderer: null,
  composer: null,
  scene: null,
  camera: null,
  sun: null,
  sunTarget: null,
  hemi: null,
  envTexture: null,

  // World
  terrainMesh: null,
  waterMesh: null,
  skyMesh: null,
  worldRoot: null,
  propsRoot: null,
  buildingsRoot: null,
  zones: [],              // [{ id, name, position: Vector3, radius, mesh, interactRadius }]
  colliders: [],          // [{ center: Vector3, radius }] (buildings + rocks)

  // Player
  player: {
    root: null,           // THREE.Group
    body: null,
    position: null,       // THREE.Vector3
    velocity: null,       // THREE.Vector3
    facing: 0,            // yaw radians
    targetFacing: 0,
    walkPhase: 0,
    moving: false,
    sprinting: false,
    speed: 0,
    grounded: true
  },

  // Camera rig
  camRig: {
    yaw: 0,
    pitch: -0.22,
    distance: 0,
    fov: 62,
    targetFov: 62,
    shakeAmp: 0,
    shakeUntil: 0
  },

  // Input
  keys: {},
  pointer: {
    locked: false,
    dx: 0, dy: 0
  },
  touch: {
    active: false,
    moveVec: { x: 0, y: 0 },
    lookDx: 0, lookDy: 0,
    joystickId: null,
    lookId: null
  },
  touchMode: false,

  // Interaction
  activeZone: null,
  nearestZone: null,
  activeZoneTimer: 0,

  // Typewriter state
  typingSpans: null,
  typingProgress: 0,
  typedSoFar: 0,

  // Clock
  clock: {
    dayFraction: 0.28,   // 0..1 - golden-hour-ish start
    speed: 0,            // auto-advance speed (0 = static)
    sunDir: null         // THREE.Vector3
  },

  // Toast
  toastTimer: 0,

  // Perf
  lastTime: 0,
  frameSamples: [],
  perfMode: 'normal',    // 'normal' | 'low' | 'ultralow'
  pixelRatio: 1,

  // Resize
  viewWidth: 0,
  viewHeight: 0,

  // Flags
  initialized: false
};
function initDomRefs() {
  game.canvas = document.getElementById('game-canvas');
  game.container = document.getElementById('game-container');
  game.dialogueEl = document.getElementById('dialogue');
  game.hudZoneEl = document.getElementById('hud-zone');
  game.promptEl = document.getElementById('prompt');
  game.toastEl = document.getElementById('toast');
  game.crosshairEl = document.getElementById('crosshair');
  game.minimapCanvas = document.querySelector('#minimap canvas');
  game.loaderEl = document.getElementById('loader');
  game.loaderBarEl = document.getElementById('loader-bar-fill');
  game.loaderHintEl = document.getElementById('loader-hint');

  game.touchMode = ('ontouchstart' in window) ||
                   navigator.maxTouchPoints > 0 ||
                   window.innerWidth < 800;
}

// ===== js/content/contact.js =====
const contact = {
  name: 'Kaviyarasu M',
  title: 'Senior Full Stack Engineer',
  location: 'Erode, Tamil Nadu, India',
  email: 'kaviyarasu.m.dev@gmail.com',
  phone: '+91 63839 64471',
  linkedin: {
    label: 'linkedin.com/in/kaviyarasu-m-dev',
    url:   'https://linkedin.com/in/kaviyarasu-m-dev'
  },
  github: {
    label: 'github.com/kaviyarasu-dev',
    url:   'https://github.com/kaviyarasu-dev'
  }
};

// ===== js/content/projects.js =====
// Every resume project gets full-fat detail here. Buildings + dialogues read this.
const featured = {
  id: 'gravitywrite',
  zoneId: 'citadel',
  name: 'GravityWrite',
  tagline: 'Multi-Provider AI Content SaaS',
  url: 'https://app.gravitywrite.com',
  company: 'Website Learners Pvt Ltd',
  role: 'Lead Full Stack Engineer',
  period: '2024 – Present',
  stack: ['Laravel', 'React.js', 'Node.js', 'OpenAI', 'Claude', 'Gemini', 'n8n', 'MySQL'],
  themeColor: 0x7cc7ff,
  accentColor: 0xb48cff,
  summary:
    'AI content generation platform scaled from zero to 300,000+ active users. ' +
    'Long-form blogs, ad copy, and social variants across OpenAI, Claude, and Gemini ' +
    'with runtime model switching and MCP-powered automation.',
  bullets: [
    'Architected and shipped GravityWrite end-to-end on Laravel + React.',
    'Multi-provider LLM stack (OpenAI · Claude · Gemini) with runtime model switching.',
    'Custom MCP tool embedded into n8n workflows - prompt-to-post pipelines run unattended.',
    'Database design, API architecture, billing, workspaces, model orchestration.'
  ],
  metrics: [
    { num: '300K+',  caption: 'Active users' },
    { num: '3',      caption: 'LLM providers' },
    { num: '0 → 1',  caption: 'Architected from scratch' }
  ]
};
const otherProjects = [
  {
    id: 'gravitysocial',
    zoneId: 'broadcast',
    name: 'GravitySocial',
    tagline: 'AI Social Media Scheduler',
    url: 'https://social.gravitywrite.com',
    company: 'Website Learners Pvt Ltd',
    period: '2025',
    stack: ['Laravel', 'Vue.js', 'Node.js', 'OpenAI', 'Claude', 'n8n', 'MySQL'],
    themeColor: 0xff8a55,
    accentColor: 0xf4c64e,
    summary:
      'Multi-platform AI scheduler for Facebook, LinkedIn, X, Instagram, and YouTube. ' +
      'Switchable image generation providers and automated content pipelines.',
    bullets: [
      'Five platforms supported end-to-end: FB · LinkedIn · X · Instagram · YouTube.',
      'Image provider switching across OpenAI and Gemini.',
      '50% reduction in media search time vs baseline.'
    ],
    metrics: [
      { num: '5',   caption: 'Platforms' },
      { num: '50%', caption: 'Faster media search' }
    ]
  },
  {
    id: 'gravityauth',
    zoneId: 'gateway',
    name: 'GravityAuth',
    tagline: 'Centralised SSO Gateway',
    url: 'https://auth.gravitywrite.com',
    company: 'Website Learners Pvt Ltd',
    period: '2025',
    stack: ['Laravel', 'MySQL', 'Google OAuth'],
    themeColor: 0x5ee0a0,
    accentColor: 0x7cc7ff,
    summary:
      'Single Sign-On gateway with Google OAuth. Shared identity across GravityWrite ' +
      'and GravitySocial - one session, one account, every product.',
    bullets: [
      'Google OAuth flow with refresh handling and session orchestration.',
      'Shared-session bridge for GravityWrite and GravitySocial.',
      'Hardened token storage and cross-domain cookie handling.'
    ],
    metrics: [
      { num: '1',  caption: 'Identity, many apps' },
      { num: 'OAuth', caption: 'Google SSO' }
    ]
  },
  {
    id: 'transgenie',
    zoneId: 'transport',
    name: 'TransGenie',
    tagline: 'Multi-Service Platform',
    url: 'https://transgenie.io',
    company: 'Sparkout Tech Solutions Pvt Ltd',
    period: '2023 – 2024',
    stack: ['Laravel', 'Node.js', 'PHP', 'PostgreSQL', 'Sockets'],
    themeColor: 0xe55a5a,
    accentColor: 0xf4c64e,
    summary:
      'Food delivery + transport + on-demand service platform. Built full-architecture ' +
      'vendor and admin APIs, and real-time socket infrastructure from scratch.',
    bullets: [
      'Designed architecture for three service verticals in one platform.',
      'Real-time socket events for order/driver/vendor flows.',
      'Vendor dashboards and complete admin API surface.'
    ],
    metrics: [
      { num: '3', caption: 'Service verticals' },
      { num: 'Realtime', caption: 'Sockets end-to-end' }
    ]
  },
  {
    id: 'ai-agent',
    zoneId: 'temple',
    name: 'Laravel AI Agent',
    tagline: 'Open-Source Package',
    url: 'https://github.com/kaviyarasu-dev/agent',
    company: 'Personal · Open Source',
    period: '2025',
    stack: ['Laravel', 'OpenAI', 'Claude', 'Gemini', 'Ideogram', 'Runware'],
    themeColor: 0xb48cff,
    accentColor: 0x7cc7ff,
    summary:
      'Open-source Laravel package that unifies OpenAI, Claude, Gemini, Ideogram, and Runware ' +
      'behind one interface with runtime provider switching and zero-config defaults.',
    bullets: [
      'Sole author and maintainer. SOLID-compliant provider architecture.',
      'Text generation + image generation across five providers.',
      'Extensible provider registration; zero-config bootstrap.'
    ],
    metrics: [
      { num: '5',     caption: 'Providers unified' },
      { num: 'OSS',   caption: 'Maintained publicly' }
    ]
  },
  {
    id: '1clx',
    zoneId: 'workshop',
    name: '1CLX',
    tagline: 'Social Automation + Website Builder',
    url: null,
    company: 'The Infinity Hub',
    period: '2021 – 2023',
    stack: ['Laravel', 'PHP', 'JavaScript', 'jQuery'],
    themeColor: 0xf4c64e,
    accentColor: 0x5ee0a0,
    summary:
      'Social media automation product with a drag-and-drop website builder. ' +
      'Led the architecture, the 5-developer team, and end-to-end delivery.',
    bullets: [
      'Led a 5-developer team through end-to-end delivery.',
      '15+ PRs reviewed per sprint to maintain release stability.',
      'JavaScript drag-and-drop block editor comparable to WordPress page builders.'
    ],
    metrics: [
      { num: '5', caption: 'Dev team size' },
      { num: '15+', caption: 'PRs / sprint' }
    ]
  }
];

// The project list used by the content grid in some dialogues.
const allProjects = [featured, ...otherProjects];

// ===== js/content/experience.js =====
// Full-resume experience. Each entry powers one wing of the Library building.
const experience = [
  {
    id: 'website-learners',
    period: 'Dec 2024 - Present',
    company: 'Website Learners (Pvt.) Ltd',
    title: 'Senior Full Stack Developer',
    location: 'Chennai, India',
    stack: ['Node.js', 'Laravel', 'Vue.js', 'React.js', 'n8n', 'OpenAI', 'Claude', 'Ideogram', 'Leonardo', 'Runware'],
    bullets: [
      'Architected and shipped GravityWrite - AI content generation SaaS serving 300,000+ active users, built on Laravel + React with multi-provider LLM support (OpenAI, Claude, Gemini) and runtime model switching.',
      'Built GravitySocial - multi-platform AI social media scheduler (Facebook, LinkedIn, X, Instagram, YouTube); integrated dynamic image generation with provider switching across OpenAI and Gemini; reduced media search time by 50%.',
      'Engineered a custom MCP tool embedded into n8n workflows, enabling fully automated AI content pipelines from prompt to published post with zero manual intervention.',
      'Built GravityAuth - centralized SSO system with Google OAuth, enabling seamless shared authentication across GravityWrite and GravitySocial.'
    ]
  },
  {
    id: 'sparkout',
    period: 'Sep 2023 - Nov 2024',
    company: 'Sparkout Tech Solutions (Pvt.) Ltd',
    title: 'Associate Software Developer',
    location: 'Chennai, India',
    stack: ['Laravel', 'Node.js', 'PHP', 'HTML', 'CSS', 'JavaScript', 'Bootstrap'],
    bullets: [
      'Led architecture and delivery for TransGenie - a multi-service platform (food delivery, transport, on-demand) - building all vendor/admin APIs and real-time socket event infrastructure from scratch.',
      'Established a modular Laravel/PHP framework following SOLID principles that reduced cross-team technical debt measurably across a 5-developer squad.',
      'Ran structured code reviews averaging 15+ PRs per sprint, catching architectural regressions before merge and enforcing consistent coding standards.'
    ]
  },
  {
    id: 'infinity-hub',
    period: 'Dec 2021 - Aug 2023',
    company: 'The Infinity Hub',
    title: 'Senior PHP Laravel Developer',
    location: 'Erode, India',
    stack: ['Laravel', 'PHP', 'HTML', 'CSS', 'JavaScript', 'Bootstrap'],
    bullets: [
      'Led architecture design and end-to-end delivery of 1CLX - a social media automation and website builder product - overseeing a 5-developer team and 15+ PRs per sprint to maintain release stability.',
      'Built a drag-and-drop website builder in JavaScript with dynamic block-based editing, comparable in feature depth to lightweight WordPress page builders.'
    ]
  },
  {
    id: 'freshnote',
    period: 'Nov 2020 - Dec 2021',
    company: 'Freshnote Technologies',
    title: 'Full Stack Developer',
    location: 'Erode, India',
    stack: ['PHP', 'HTML', 'CSS', 'JavaScript', 'Bootstrap'],
    bullets: [
      'Sole developer across 5+ client projects - owned full-stack delivery from requirements gathering to production deployment with no technical oversight.',
      'Delivered each project end-to-end in PHP and JavaScript, building reusable component patterns that sped up subsequent client deliveries.'
    ]
  }
];

// ===== js/content/education.js =====
const education = [
  {
    period: '2014 – 2017',
    degree: 'Bachelor in Information Technology',
    institution: 'Gobi Arts & Science College'
  }
];
const certifications = [
  {
    period: '2018 – 2019',
    name: 'PHP Certificate Course',
    institution: 'N-School Academy'
  }
];

// ===== js/content/dialogues.js =====
// Dialogue templates. Each returns an array of DOM nodes built with el().
// No innerHTML / outerHTML anywhere.





const SKILLS = [
  { name: 'Laravel / PHP',              pct: 95 },
  { name: 'React.js / Vue.js',          pct: 90 },
  { name: 'Node.js',                    pct: 85 },
  { name: 'MySQL / PostgreSQL',         pct: 90 },
  { name: 'OpenAI · Claude · Gemini',   pct: 92 },
  { name: 'n8n · MCP automation',       pct: 88 },
  { name: 'TailwindCSS',                pct: 85 },
  { name: 'Git · CI/CD',                pct: 82 }
];

function titleBar(pre, accent, post) {
  const h = el('h2', null, pre ? pre + ' ' : '');
  h.appendChild(el('span', { class: 'accent' }, accent));
  if (post) h.appendChild(document.createTextNode(' ' + post));
  return h;
}

function chip(text, pro) {
  return el('span', { class: pro ? 'chip pro' : 'chip' }, text);
}

function chipRow(items, pro) {
  const row = el('p', null);
  for (const t of items) row.appendChild(chip(t, pro));
  return row;
}

function row(label, value) {
  const r = el('div', { class: 'row' });
  r.appendChild(el('span', { class: 'label' }, label));
  if (typeof value === 'string') r.appendChild(document.createTextNode(value));
  else r.appendChild(value);
  return r;
}

function link(href, label, external) {
  const attrs = external
    ? { href, target: '_blank', rel: 'noopener' }
    : { href };
  return el('a', attrs, label);
}

function skillBar(s) {
  const meter = el('span', { class: 'meter', style: '--pct:' + s.pct + '%' });
  return el('div', { class: 'bar' },
    el('span', { class: 'name' }, s.name),
    meter,
    el('span', { class: 'pct' }, s.pct + '%')
  );
}

function metric(num, caption) {
  return el('div', { class: 'metric' },
    el('div', { class: 'num' }, num),
    el('div', { class: 'caption' }, caption)
  );
}

function metricsGrid(items) {
  const g = el('div', { class: 'metrics' });
  for (const m of items) g.appendChild(metric(m.num, m.caption));
  return g;
}

function bulletList(bullets) {
  const ul = el('ul');
  for (const b of bullets) ul.appendChild(el('li', null, b));
  return ul;
}

function projectBlock(p, isFeatured) {
  const block = el('div', { class: isFeatured ? 'entry pro' : 'entry' });
  block.appendChild(el('h3', null, p.name));
  block.appendChild(el('div', { class: 'period' }, (p.period || '') + ' · ' + (p.company || '')));
  block.appendChild(el('p', null, p.summary));
  block.appendChild(chipRow(p.stack, isFeatured));
  if (p.bullets && p.bullets.length) block.appendChild(bulletList(p.bullets));
  if (p.url) block.appendChild(el('p', null, link(p.url, p.url, true)));
  if (p.metrics && p.metrics.length) block.appendChild(metricsGrid(p.metrics));
  return block;
}

function closingHint() {
  return el('div', { class: 'hint-close' }, 'walk away to close');
}
const DIALOGUES = {
  plaza: () => [
    titleBar('', contact.name, '- Senior Full Stack Engineer'),
    el('p', null, '5+ years building and scaling ', strong('AI-integrated SaaS platforms'),
      '. Architected ', strong('GravityWrite'), ' from zero to ',
      strong('300,000+ active users'),
      ' on Laravel + React + a multi-provider LLM stack (OpenAI · Claude · Gemini).'),
    el('p', null,
      'Full-stack ownership across database design, API architecture, and shipped features. ',
      'Track record of cutting backend response times, leading engineering teams, and shipping open-source tooling.'),
    row('Based in', contact.location),
    row('Reach', link('mailto:' + contact.email, contact.email, false)),
    el('p', null,
      chip('Laravel'), chip('React.js'), chip('Node.js'), chip('OpenAI'),
      chip('Claude'), chip('Gemini'), chip('n8n'), chip('MCP')
    ),
    closingHint()
  ],

  notice: () => [
    titleBar('The Notice Board -', 'Resume'),
    el('p', null,
      'A weathered scroll is pinned to the board. It contains the full resume: ',
      strong('skills'), ', ', strong('experience'), ', ', strong('projects'),
      ', and ', strong('education'), '.'),
    el('p', null, 'Press ', strong('[E]'), ' or tap ', strong('ACT'),
      ' to download the resume as a PDF.'),
    closingHint()
  ],

  forge: () => {
    const out = [ titleBar('The Skill Forge -', 'Tech Stack') ];
    for (const s of SKILLS) out.push(skillBar(s));
    out.push(el('p', { style: 'margin-top:14px' },
      chip('SOLID'), chip('REST API'), chip('MCP'), chip('Prompt Engineering'),
      chip('Agent Building'), chip('CI/CD')));
    out.push(closingHint());
    return out;
  },

  citadel: () => [
    titleBar('GravityWrite Citadel -', 'Featured'),
    el('p', null, strong(featured.name), ' - ', featured.tagline),
    el('p', null, featured.summary),
    row('Role', featured.role),
    row('Company', featured.company),
    row('Period', featured.period),
    chipRow(featured.stack, true),
    bulletList(featured.bullets),
    metricsGrid(featured.metrics),
    el('p', { style: 'margin-top:12px' }, link(featured.url, featured.url, true)),
    closingHint()
  ],

  broadcast:  () => projectDialogue('broadcast',  'Broadcast Tower -', 'GravitySocial'),
  gateway:    () => projectDialogue('gateway',    'The Gateway -',     'GravityAuth'),
  transport:  () => projectDialogue('transport',  'Transport Hub -',   'TransGenie'),
  temple:     () => projectDialogue('temple',     'Open-Source Temple -', 'Laravel AI Agent'),
  workshop:   () => projectDialogue('workshop',   'Builder\u2019s Workshop -', '1CLX'),

  freshnote: () => {
    const job = experience.find(j => j.id === 'freshnote');
    return [
      titleBar('Freshnote Studio -', 'Early Career'),
      el('div', { class: 'period' }, job.period + ' · ' + job.company),
      row('Role', job.title),
      row('Where', job.location),
      el('p', null, 'First full-stack chapter. Sole developer across ',
        strong('5+ client projects'),
        ' from requirements gathering to production deployment - no oversight, no safety net.'),
      chipRow(job.stack),
      bulletList(job.bullets),
      closingHint()
    ];
  },

  library: () => {
    const out = [ titleBar('The Library -', 'Experience') ];
    for (const job of experience) {
      const e = el('div', { class: 'entry' });
      e.appendChild(el('h3', null, job.title));
      e.appendChild(el('div', { class: 'period' }, job.period + ' · ' + job.company + ' · ' + job.location));
      e.appendChild(chipRow(job.stack));
      e.appendChild(bulletList(job.bullets));
      out.push(e);
    }
    out.push(closingHint());
    return out;
  },

  academy: () => {
    const out = [ titleBar('The Academy -', 'Education') ];
    for (const ed of education) {
      out.push(el('div', { class: 'entry' },
        el('h3', null, ed.degree),
        el('div', { class: 'period' }, ed.period + ' · ' + ed.institution)
      ));
    }
    out.push(el('h2', { style: 'margin-top:18px' }, 'Certifications'));
    for (const cert of certifications) {
      out.push(el('div', { class: 'entry' },
        el('h3', null, cert.name),
        el('div', { class: 'period' }, cert.period + ' · ' + cert.institution)
      ));
    }
    out.push(closingHint());
    return out;
  },

  lighthouse: () => [
    titleBar('The Lighthouse -', 'Contact'),
    el('p', null, 'Always up for ', strong('senior full-stack'),
      ' or ', strong('AI-integrated product'), ' work. Reach any channel below - all active.'),
    row('Email',    link('mailto:' + contact.email, contact.email, false)),
    row('Phone',    link('tel:' + contact.phone.replace(/\s/g, ''), contact.phone, false)),
    row('LinkedIn', link(contact.linkedin.url, contact.linkedin.label, true)),
    row('GitHub',   link(contact.github.url,   contact.github.label,   true)),
    row('Location', contact.location),
    closingHint()
  ],

  milestones: () => [
    titleBar('Milestones -', 'Numbers'),
    el('p', null, 'Five years of measurable outcomes - not output-of-effort bullet points, ',
      'but real, verifiable delivery metrics.'),
    metricsGrid([
      { num: '300K+',  caption: 'GravityWrite active users' },
      { num: '5+',     caption: 'Years full-stack' },
      { num: '5',      caption: 'Dev squad led (Sparkout + 1CLX)' },
      { num: '15+',    caption: 'PRs reviewed per sprint' },
      { num: '50%',    caption: 'Media search time cut (GravitySocial)' },
      { num: '3',      caption: 'LLM providers unified' },
      { num: 'OSS',    caption: 'Laravel AI Agent - public + maintained' },
      { num: 'MCP',    caption: 'Custom n8n tool - automated pipelines' }
    ]),
    closingHint()
  ]
};

function projectDialogue(zoneId, titlePre, titleAccent) {
  const p = otherProjects.find(x => x.zoneId === zoneId) || featured;
  return [
    titleBar(titlePre, titleAccent),
    el('p', null, strong(p.name), ' - ', p.tagline),
    el('p', null, p.summary),
    row('Role', p.company === 'Personal · Open Source' ? 'Sole author' : 'Engineer'),
    row('Company', p.company),
    row('Period', p.period),
    chipRow(p.stack),
    bulletList(p.bullets),
    p.metrics && p.metrics.length ? metricsGrid(p.metrics) : el('p', null),
    p.url ? el('p', { style: 'margin-top:12px' }, link(p.url, p.url, true)) : el('p', null),
    closingHint()
  ];
}

// ===== js/engine/assets.js =====
// Procedural texture + environment map generators. All CPU-side Canvas2D work
// wrapped into THREE.CanvasTextures. Nothing downloads from disk.
const Assets = {
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
function initAssets() {
  Assets.grassTexture   = canvasTex(256, grassPattern, 80);
  Assets.stoneTexture   = canvasTex(256, stonePattern, 14);
  Assets.sandTexture    = canvasTex(256, sandPattern,  40);
  Assets.noiseTex       = canvasTex(128, noisePattern, 1);
  Assets.waterNormalTex = dataNormalMap(256);
}

// Build an HDR-ish environment cube from a procedural gradient scene,
// then PMREM-filter it so Standard materials get decent reflections.
function buildEnvMap(renderer) {
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

// ===== js/engine/renderer.js =====
// WebGLRenderer + EffectComposer setup. Relies on globals:
//   THREE, THREE.EffectComposer, THREE.RenderPass, THREE.UnrealBloomPass,
//   THREE.ShaderPass, THREE.FXAAShader  (loaded in index.html)
const Renderer = {
  bloomPass: null,
  fxaaPass: null,
  composerEnabled: true
};
function initRenderer() {
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
function initComposer(scene, camera) {
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
function resizeRenderer() {
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
function renderFrame() {
  if (Renderer.composerEnabled && game.composer) {
    game.composer.render();
  } else {
    game.renderer.render(game.scene, game.camera);
  }
}
function setPerfMode(mode) {
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

// ===== js/engine/scene.js =====
// Root scene construction: fog, sun, hemisphere fill, root groups, env map.
function buildScene() {
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
function updateSunFromDirection(dir) {
  if (!game.sun) return;
  const dist = 80;
  game.sun.position.set(dir.x * dist, dir.y * dist, dir.z * dist);
  // Keep sunTarget at the player for shadow frustum following
  if (game.player && game.player.position) {
    game.sunTarget.position.copy(game.player.position);
  }
}

// ===== js/engine/camera.js =====
// Third-person over-shoulder camera with pitch/yaw, collision push-in, FOV bump.
const CameraRig = {
  lookSensitivity: 0.0025,
  touchLookSens: 0.0055,
  pitchMin: -0.85,
  pitchMax: 0.45
};

const CAMERA_ZOOM_MIN = 2.5;
const CAMERA_ZOOM_MAX = 18;
const CAMERA_ZOOM_WHEEL_SENS = 0.0035;
const CAMERA_ZOOM_PINCH_SENS = 0.015;
const CAMERA_ZOOM_DAMP = 8;

const _tmpIdealPos = { x: 0, y: 0, z: 0 };
function initCameraRig() {
  game.camRig.yaw = 0;
  game.camRig.pitch = -0.22;
  game.camRig.distance = CAMERA_DISTANCE;
  game.camRig.targetDistance = CAMERA_DISTANCE;
  game.camRig.fov = CAMERA_FOV_BASE;
  game.camRig.targetFov = CAMERA_FOV_BASE;
  game.camRig.shakeAmp = 0;
  game.camRig.shakeUntil = 0;
}
function applyLookInput(dx, dy, fromTouch) {
  const s = fromTouch ? CameraRig.touchLookSens : CameraRig.lookSensitivity;
  game.camRig.yaw -= dx * s;
  game.camRig.pitch = clamp(
    game.camRig.pitch - dy * s,
    CameraRig.pitchMin,
    CameraRig.pitchMax
  );
}
function applyZoomInput(wheelDeltaY, fromTouch) {
  const rig = game.camRig;
  if (rig.targetDistance == null) rig.targetDistance = rig.distance;
  const sens = fromTouch ? CAMERA_ZOOM_PINCH_SENS : CAMERA_ZOOM_WHEEL_SENS;
  rig.targetDistance = clamp(
    rig.targetDistance + wheelDeltaY * sens,
    CAMERA_ZOOM_MIN,
    CAMERA_ZOOM_MAX
  );
}
function setTargetFov(sprinting) {
  game.camRig.targetFov = sprinting ? CAMERA_FOV_SPRINT : CAMERA_FOV_BASE;
}
function cameraShake(amp, ms) {
  game.camRig.shakeAmp = amp;
  game.camRig.shakeUntil = performance.now() + ms;
}
function updateCamera(dt) {
  const p = game.player;
  const rig = game.camRig;
  const cam = game.camera;
  if (!p || !p.position || !cam) return;

  const dtS = Math.min(0.05, dt / 1000);

  // FOV ease
  rig.fov = damp(rig.fov, rig.targetFov, 6, dtS);
  if (Math.abs(cam.fov - rig.fov) > 0.01) {
    cam.fov = rig.fov;
    cam.updateProjectionMatrix();
  }

  // Zoom ease - mouse wheel / pinch feed rig.targetDistance.
  if (rig.targetDistance != null && rig.targetDistance !== rig.distance) {
    rig.distance = damp(rig.distance, rig.targetDistance, CAMERA_ZOOM_DAMP, dtS);
  }

  const cy = Math.cos(rig.yaw);
  const sy = Math.sin(rig.yaw);
  const cp = Math.cos(rig.pitch);
  const sp = Math.sin(rig.pitch);

  // Target pivot is head height on the player with a shoulder offset.
  const pivotY = p.position.y + CAMERA_HEIGHT;
  const shoulderX = CAMERA_SHOULDER * cy;
  const shoulderZ = -CAMERA_SHOULDER * sy;
  const pivotX = p.position.x + shoulderX;
  const pivotZ = p.position.z + shoulderZ;

  // Ideal camera position behind player using spherical coords.
  const dist = rig.distance;
  _tmpIdealPos.x = pivotX + dist * sy * cp;
  _tmpIdealPos.y = pivotY - dist * sp;
  _tmpIdealPos.z = pivotZ + dist * cy * cp;

  // Collision push-in: sweep a few test points from pivot outward; pull in if terrain/building blocks.
  // Simple heuristic: clamp above terrain height + 0.6m.
  if (game.terrainMesh) {
    const minY = sampleTerrainHeight(_tmpIdealPos.x, _tmpIdealPos.z) + 0.6;
    if (_tmpIdealPos.y < minY) _tmpIdealPos.y = minY;
  }

  // Lerp camera to ideal.
  cam.position.x = damp(cam.position.x, _tmpIdealPos.x, 14, dtS);
  cam.position.y = damp(cam.position.y, _tmpIdealPos.y, 14, dtS);
  cam.position.z = damp(cam.position.z, _tmpIdealPos.z, 14, dtS);

  // Shake offset
  const now = performance.now();
  if (now < rig.shakeUntil) {
    const t = (rig.shakeUntil - now) / 1000;
    const amp = rig.shakeAmp * Math.min(1, t);
    cam.position.x += (Math.random() - 0.5) * amp;
    cam.position.y += (Math.random() - 0.5) * amp;
  }

  cam.lookAt(pivotX, pivotY - 0.25, pivotZ);
}
function getCameraYaw() { return game.camRig.yaw; }

// Sample terrain height at (x, z). Returns 0 if no terrain yet.
function sampleTerrainHeight(x, z) {
  if (game.terrainMesh && game.terrainMesh.userData.sampleHeight) {
    return game.terrainMesh.userData.sampleHeight(x, z);
  }
  return 0;
}

// ===== js/engine/loader.js =====
// Async preload + progress. Procedural assets don't need network,
// but we fake progress in steps so the loader feels alive.
const Loader = {
  steps: [],
  current: 0
};

function setProgress(pct, hint) {
  if (game.loaderBarEl) game.loaderBarEl.style.width = pct + '%';
  if (hint && game.loaderHintEl) game.loaderHintEl.textContent = hint;
}
async function runPreload(steps) {
  Loader.steps = steps;
  Loader.current = 0;
  const n = steps.length;
  setProgress(0, 'Initialising');
  for (let i = 0; i < n; i++) {
    const step = steps[i];
    if (step.hint) setProgress((i / n) * 100, step.hint);
    await new Promise(r => requestAnimationFrame(r));
    await Promise.resolve(step.run());
    setProgress(((i + 1) / n) * 100, step.hint);
  }
  setProgress(100, 'Ready');
}
function hideLoader() {
  if (!game.loaderEl) return;
  game.loaderEl.classList.add('hidden');
  setTimeout(() => { game.loaderEl.style.display = 'none'; }, 700);
}
function showFatalError(err) {
  if (!game.loaderEl) return;
  game.loaderEl.classList.remove('hidden');
  game.loaderEl.style.display = 'flex';
  if (game.loaderHintEl) {
    game.loaderHintEl.textContent = 'Error: ' + (err && err.message ? err.message : err);
    game.loaderHintEl.style.color = '#ff7a7a';
  }
  console.error(err);
}

// ===== js/world/zones.js =====
// 14 zones placed across the island. Each has a world position + interaction radius.
// The buildings layer consumes ZONE_LAYOUT to place landmarks.
const ZONE_LAYOUT = [
  { id: 'plaza',      name: 'Plaza of Kaviyarasu',     x:   0, z:   3, r: 4.5, prompt: 'read intro' },
  { id: 'notice',     name: 'Notice Board · Resume',    x:   4, z:   8, r: 3.2, prompt: 'take resume' },
  { id: 'forge',      name: 'Skill Forge',              x: -28, z: -34, r: 4.8, prompt: 'inspect forge' },
  { id: 'citadel',    name: 'GravityWrite Citadel',     x:   0, z: -58, r: 6.5, prompt: 'enter citadel' },
  { id: 'broadcast',  name: 'GravitySocial Broadcast',  x:  34, z: -42, r: 5.0, prompt: 'tune in' },
  { id: 'gateway',    name: 'GravityAuth Gateway',      x: -44, z:   6, r: 4.5, prompt: 'cross gateway' },
  { id: 'transport',  name: 'TransGenie Transport Hub', x:  48, z:  12, r: 5.0, prompt: 'enter hub' },
  { id: 'temple',     name: 'Open-Source Temple',       x: -32, z:  42, r: 5.0, prompt: 'read runes' },
  { id: 'workshop',   name: '1CLX Workshop',            x:  36, z:  40, r: 4.6, prompt: 'tinker' },
  { id: 'freshnote',  name: 'Freshnote Studio',         x: -12, z:  56, r: 4.2, prompt: 'visit studio' },
  { id: 'library',    name: 'Library of Experience',    x: -60, z: -16, r: 5.0, prompt: 'read archives' },
  { id: 'academy',    name: 'Academy',                  x:  56, z: -22, r: 4.5, prompt: 'attend class' },
  { id: 'lighthouse', name: 'Lighthouse · Contact',     x:  66, z: -68, r: 4.5, prompt: 'signal' },
  { id: 'milestones', name: 'Milestones Monument',      x:   0, z:  28, r: 4.5, prompt: 'see numbers' }
];
function zoneById(zones, id) {
  return zones.find(z => z.id === id) || null;
}

// ===== js/world/collision.js =====
// Sphere vs. bounding sphere list collision. Buildings + big props register a
// collider; the player controller calls resolveCollision() each frame.
function addCollider(x, z, radius) {
  game.colliders.push({ x, z, r: radius });
}
function clearColliders() {
  game.colliders.length = 0;
}

// Push (x, z) out of every overlapping collider circle. Returns the adjusted point.
function resolveCollision(x, z, selfR) {
  let px = x, pz = z;
  for (let i = 0; i < game.colliders.length; i++) {
    const c = game.colliders[i];
    const dx = px - c.x;
    const dz = pz - c.z;
    const minD = c.r + selfR;
    const dSq = dx * dx + dz * dz;
    if (dSq < minD * minD && dSq > 0.00001) {
      const d = Math.sqrt(dSq);
      const push = (minD - d) / d;
      px += dx * push;
      pz += dz * push;
    }
  }
  return { x: px, z: pz };
}

// Check if a world point is inside any collider (for spawn safety).
function pointInsideCollider(x, z, pad) {
  for (let i = 0; i < game.colliders.length; i++) {
    const c = game.colliders[i];
    const dx = x - c.x, dz = z - c.z;
    const r = c.r + (pad || 0);
    if (dx * dx + dz * dz < r * r) return true;
  }
  return false;
}

// ===== js/world/buildingAnims.js =====
function makeFlag(poleHeight, clothWidth, clothHeight, color) {
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
function makeSmokeEmitter(originY, color, count) {
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
function makeWindVane(radius, color) {
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
function makeDoorHinge(doorMesh, openAngle, openDuration, zoneId) {
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
function makeHoverBob(mesh, amplitude, frequency, phaseOffset) {
  const originalY = mesh.position.y;

  function update(dt, time) {
    mesh.position.y = originalY + Math.sin(time * frequency + phaseOffset) * amplitude;
  }

  return { meshes: [], update };
}
function makePulseRing(y, color, maxRadius, period) {
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
function makePendulum(mesh, maxAngle, period) {
  function update(dt, time) {
    mesh.rotation.z = Math.sin(time / period * Math.PI * 2) * maxAngle;
  }

  return { meshes: [], update };
}

// ===== js/world/terrain.js =====
// 3D island terrain - PlaneGeometry displaced by island shape + multi-octave noise.
// Vertex colors blend grass, sand, stone. A sampleHeight(x, z) closure is attached
// to the mesh for camera/player/interaction sampling.



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
function buildTerrain() {
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

// ===== js/world/water.js =====
// Animated water - single plane at WATER_LEVEL with a custom shader that
// samples a scrolling normal map and fakes fresnel-tinted reflection using
// the scene envMap.
function buildWater() {
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
function updateWater(dt, time) {
  if (game.waterMesh && game.waterMesh.userData.update) {
    game.waterMesh.userData.update(dt, time);
  }
}

// ===== js/world/sky.js =====
// Sky dome - large inward-facing sphere with a vertical gradient shader.
// Also spawns a sun billboard (always facing camera) for visual anchor.
// Scatters low-poly drifting clouds below the dome (see buildClouds).



const SKY_VS = `
varying vec3 vWorldPos;
void main() {
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const SKY_FS = `
varying vec3 vWorldPos;
uniform vec3 uTop;
uniform vec3 uMid;
uniform vec3 uBot;
void main() {
  float h = normalize(vWorldPos).y;
  vec3 col;
  if (h > 0.0) {
    col = mix(uMid, uTop, smoothstep(0.0, 0.7, h));
  } else {
    col = mix(uMid, uBot, smoothstep(0.0, 0.35, -h));
  }
  gl_FragColor = vec4(col, 1.0);
}
`;
const Sky = {
  mesh: null,
  sunBillboard: null,
  uniforms: null,
  clouds: null,
  cloudMat: null,
  cloudWind: null
};

const CLOUD_BATCH_COUNT = 3;
const CLOUD_INSTANCES_PER_BATCH = 8;
const CLOUD_SCATTER_RADIUS = 240;
const CLOUD_ALTITUDE_MIN = 85;
const CLOUD_ALTITUDE_MAX = 120;
const CLOUD_WIND_SPEED = 0.35;
const CLOUD_WRAP_RADIUS = 260;
const CLOUD_EMISSIVE_DAY = 0.08;
const CLOUD_EMISSIVE_DUSK = 0.05;
const CLOUD_EMISSIVE_NIGHT = 0.02;
const CLOUD_TINT_DAY = 0xffffff;
const CLOUD_TINT_DUSK = 0xffb58c;
const CLOUD_TINT_NIGHT = 0x5c6780;

let cloudLastTime = 0;

function seedRngClouds(seed) {
  let s = seed | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    if (s <= 0) s += 2147483646;
    return s / 2147483647;
  };
}

function buildCloudPrototype(rng) {
  // 8-12 puffs per prototype: inner cluster (larger, central) + feather puffs
  // (smaller, outer) that give wispy silhouette edges. Puff colors use a
  // stepped 3-tone gradient (shadow / mid / top) so flatShading keeps facets.
  const puffs = [];
  const puffCount = 8 + Math.floor(rng() * 5);
  for (let p = 0; p < puffCount; p++) {
    const isFeather = p >= 6;
    const r = isFeather ? (1.0 + rng() * 0.6) : (1.8 + rng() * 1.4);
    const geo = new THREE.IcosahedronGeometry(r, 0);
    const xSpread = isFeather ? 5.5 : 4.2;
    const ySpread = isFeather ? 0.8 : 1.2;
    const zSpread = isFeather ? 5.5 : 4.2;
    geo.translate((rng() - 0.5) * xSpread, (rng() - 0.5) * ySpread, (rng() - 0.5) * zSpread);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    for (let v = 0; v < pos.count; v++) {
      const yLocal = pos.getY(v);
      const yNorm = Math.min(1, Math.max(0, (yLocal / Math.max(0.001, r) + 1.0) * 0.5));
      let tone;
      let rMul = 1, gMul = 1, bMul = 1;
      if (yNorm < 0.35) {
        tone = 0.72;           // shadow underside
        rMul = 0.96; bMul = 1.04; // cool shadow
      } else if (yNorm < 0.7) {
        tone = 0.86;           // mid band
      } else {
        tone = 1.0;            // sunlit top
      }
      colors[v * 3]     = Math.min(1, tone * rMul);
      colors[v * 3 + 1] = Math.min(1, tone * gMul);
      colors[v * 3 + 2] = Math.min(1, tone * bMul);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    puffs.push(geo);
  }
  return mergeGeometries(puffs);
}

function lerpScalar(a, b, t) { return a + (b - a) * t; }
function buildClouds() {
  const rng = seedRngClouds(49211);
  const clouds = [];
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: CLOUD_EMISSIVE_DAY,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    fog: true,
    vertexColors: true
  });
  const dummy = new THREE.Object3D();
  const cloudTint = new THREE.Color();
  for (let b = 0; b < CLOUD_BATCH_COUNT; b++) {
    const proto = buildCloudPrototype(rng);
    const inst = new THREE.InstancedMesh(proto, mat, CLOUD_INSTANCES_PER_BATCH);
    inst.name = 'clouds-' + b;
    inst.castShadow = false;
    inst.receiveShadow = false;
    inst.frustumCulled = false;
    for (let i = 0; i < CLOUD_INSTANCES_PER_BATCH; i++) {
      const ang = rng() * Math.PI * 2;
      const rad = rng() * CLOUD_SCATTER_RADIUS;
      dummy.position.set(
        Math.cos(ang) * rad,
        CLOUD_ALTITUDE_MIN + rng() * (CLOUD_ALTITUDE_MAX - CLOUD_ALTITUDE_MIN),
        Math.sin(ang) * rad
      );
      dummy.rotation.set(0, rng() * Math.PI * 2, 0);
      const s = 0.75 + rng() * 0.9;
      dummy.scale.set(s, s * (0.55 + rng() * 0.3), s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      // Per-instance warm/cool tint: half the clouds lean warm (R up, B down),
      // half lean cool. Shift capped at ±4% so day/dusk/night material tint
      // pipeline still dominates the overall color.
      const warmBias = (rng() - 0.5) * 0.08;
      cloudTint.setRGB(1.0 + warmBias, 1.0, 1.0 - warmBias);
      inst.setColorAt(i, cloudTint);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    clouds.push(inst);
    game.scene.add(inst);
  }
  Sky.clouds = clouds;
  Sky.cloudMat = mat;
  Sky.cloudWind = new THREE.Vector3(1, 0, 0.3).normalize();
  cloudLastTime = performance.now();
  return clouds;
}

function driftClouds(phase) {
  if (!Sky.clouds) return;
  const now = performance.now();
  const dt = cloudLastTime ? Math.min(100, now - cloudLastTime) : 16;
  cloudLastTime = now;
  const step = CLOUD_WIND_SPEED * (dt / 1000);
  const dx = Sky.cloudWind.x * step;
  const dz = Sky.cloudWind.z * step;
  const wrap = CLOUD_WRAP_RADIUS;

  const m = new THREE.Matrix4();
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scl = new THREE.Vector3();

  for (const inst of Sky.clouds) {
    for (let i = 0; i < inst.count; i++) {
      inst.getMatrixAt(i, m);
      m.decompose(pos, quat, scl);
      pos.x += dx;
      pos.z += dz;
      if (pos.x > wrap)       pos.x -= wrap * 2;
      else if (pos.x < -wrap) pos.x += wrap * 2;
      if (pos.z > wrap)       pos.z -= wrap * 2;
      else if (pos.z < -wrap) pos.z += wrap * 2;
      m.compose(pos, quat, scl);
      inst.setMatrixAt(i, m);
    }
    inst.instanceMatrix.needsUpdate = true;
  }

  if (Sky.cloudMat) {
    let targetIntensity = CLOUD_EMISSIVE_DAY;
    let targetColorHex = CLOUD_TINT_DAY;
    if (phase === 'dusk')       { targetIntensity = CLOUD_EMISSIVE_DUSK;  targetColorHex = CLOUD_TINT_DUSK; }
    else if (phase === 'night') { targetIntensity = CLOUD_EMISSIVE_NIGHT; targetColorHex = CLOUD_TINT_NIGHT; }
    Sky.cloudMat.emissiveIntensity = lerpScalar(Sky.cloudMat.emissiveIntensity, targetIntensity, 0.04);
    const targetColor = new THREE.Color(targetColorHex);
    Sky.cloudMat.color.lerp(targetColor, 0.04);
  }
}
function buildSky() {
  const uniforms = {
    uTop: { value: new THREE.Color(SKY_TOP_DAY) },
    uMid: { value: new THREE.Color(SKY_MID_DAY) },
    uBot: { value: new THREE.Color(SKY_BOTTOM_DAY) }
  };
  Sky.uniforms = uniforms;

  const geo = new THREE.SphereGeometry(480, 32, 16);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: SKY_VS,
    fragmentShader: SKY_FS,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'sky';
  game.skyMesh = mesh;
  Sky.mesh = mesh;
  game.scene.add(mesh);

  // Sun disc
  const sunGeo = new THREE.SphereGeometry(3.2, 24, 16);
  const sunMat = new THREE.MeshBasicMaterial({
    color: 0xfff0c4,
    fog: false,
    transparent: true,
    opacity: 0.95
  });
  const sun = new THREE.Mesh(sunGeo, sunMat);
  sun.name = 'sunDisc';
  Sky.sunBillboard = sun;
  game.scene.add(sun);

  buildClouds();

  return mesh;
}

// Update sky colors + sun position based on sun direction (normalized).
function updateSky(sunDir, phase) {
  if (!Sky.uniforms) return;
  const topA = new THREE.Color(), midA = new THREE.Color(), botA = new THREE.Color();
  if (phase === 'day') {
    topA.setHex(SKY_TOP_DAY); midA.setHex(SKY_MID_DAY); botA.setHex(SKY_BOTTOM_DAY);
  } else if (phase === 'dusk') {
    topA.setHex(SKY_TOP_DUSK); midA.setHex(SKY_MID_DUSK); botA.setHex(SKY_BOTTOM_DUSK);
  } else {
    topA.setHex(SKY_TOP_NIGHT); midA.setHex(SKY_MID_NIGHT); botA.setHex(SKY_BOTTOM_NIGHT);
  }
  Sky.uniforms.uTop.value.copy(topA);
  Sky.uniforms.uMid.value.copy(midA);
  Sky.uniforms.uBot.value.copy(botA);

  if (Sky.sunBillboard && sunDir) {
    const dist = 380;
    Sky.sunBillboard.position.set(sunDir.x * dist, sunDir.y * dist, sunDir.z * dist);
    // Color shift through the day
    const col = Sky.sunBillboard.material.color;
    if (phase === 'dusk')      col.setHex(0xff9a4a);
    else if (phase === 'night') col.setHex(0xd9dcff);
    else                        col.setHex(0xfff0c4);
  }

  driftClouds(phase);
}

// ===== js/world/buildings.js =====
// 14 landmark factories. Each returns a THREE.Group positioned at its zone
// anchor (on terrain). Each factory also registers colliders via addCollider().







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

// Signpost sign board - flat plank with title (no text here; text is on the HUD when you trigger it).
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

  const noticeFlutter = makePendulum(parchment, 0.03, 2000);

  const icon = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.05, 8, 16),
    glow(PALETTE.accentViolet, 1.4)
  );
  icon.rotation.x = Math.PI / 2;
  icon.position.set(0, y0 + 2.5, 0);
  g.add(icon);

  g.userData.update = (dt, t) => { noticeFlutter.update(dt, t); };

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

  const forgeSmoke = makeSmokeEmitter(y0 + 4.8, 0x888888, 8);
  forgeSmoke.meshes.forEach(m => { m.position.x = 1.5; m.position.z = -1.4; g.add(m); });

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

  // Floating gems - skill-themed
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
  const forgeBaseUpdate = g.userData.update;
  g.userData.update = (dt, t) => {
    forgeBaseUpdate(dt, t);
    if (game.perfMode !== 'low' && game.perfMode !== 'ultralow') forgeSmoke.update(dt, t);
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

  // Crown - floating rings
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

  const citadelFlag = makeFlag(2.5, 1.2, 0.8, featured.themeColor);
  citadelFlag.meshes.forEach(m => { m.position.y += y0 + 18.1; g.add(m); });

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
  const citadelBaseUpdate = g.userData.update;
  g.userData.update = (dt, t) => {
    citadelBaseUpdate(dt, t);
    citadelFlag.update(dt, t);
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

  const broadcastPulseRing = makePulseRing(y0 + 10.3, accent, 4.0, 3000);
  broadcastPulseRing.meshes.forEach(m => g.add(m));

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
  const broadcastBaseUpdate = g.userData.update;
  g.userData.update = (dt, t) => {
    broadcastBaseUpdate(dt, t);
    broadcastPulseRing.update(dt, t);
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
  // span from (+r, 0, 0) over (0, r, 0) to (-r, 0, 0) - exactly the archway shape.
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

  // Lantern strips - dim basic color, bloom-safe
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
  const transportBob1 = makeHoverBob(v1, 0.04, 0.003, 0);
  const transportBob2 = makeHoverBob(v2, 0.05, 0.0025, 1.0);
  const transportBob3 = makeHoverBob(v3, 0.04, 0.003, 2.0);
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
  const transportBaseUpdate = g.userData.update;
  g.userData.update = (dt, t) => {
    transportBaseUpdate(dt, t);
    transportBob1.update(dt, t);
    transportBob2.update(dt, t);
    transportBob3.update(dt, t);
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
  const workshopHinge = makeDoorHinge(door, -Math.PI / 2, 2000, 'workshop');
  workshopHinge.meshes.forEach(m => g.add(m));

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
  const workshopBaseUpdate = g.userData.update;
  g.userData.update = (dt, t) => {
    workshopBaseUpdate(dt, t);
    workshopHinge.update(dt, t);
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

  const bellSwing = makePendulum(bell, 0.15, 1200);
  g.userData.update = (dt, t) => { bellSwing.update(dt, t); };

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

  const lighthouseVane = makeWindVane(0.8, PALETTE.stoneDark);
  lighthouseVane.meshes.forEach(m => { m.position.y = y0 + 1.2 + 5 * 2.0 + 2.8; g.add(m); });

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
  const lighthouseBaseUpdate = g.userData.update;
  g.userData.update = (dt, t) => {
    lighthouseBaseUpdate(dt, t);
    lighthouseVane.update(dt, t);
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
function placeBuildings() {
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
function updateBuildings(dt, time) {
  const root = game.buildingsRoot;
  if (!root) return;
  if (game.perfMode === 'ultralow') return;
  for (let i = 0; i < root.children.length; i++) {
    const c = root.children[i];
    if (c.userData && c.userData.update) c.userData.update(dt, time);
  }
}

// ===== js/world/props.js =====
// Instanced trees, rocks, grass tufts. One draw call per prop type.
// Scatter respects zone radii (no props inside plaza/building trigger zones)
// and the island's walkable area.





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
function scatterProps() {
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

// ===== js/entity/player.js =====
// Rigged GLTF character (Soldier.glb) with skeletal animation.
// Uses AnimationMixer with crossfading between idle/walk/run.
const PlayerRig = {
  root: null,
  body: null,
  mixer: null,
  headBone: null,
  baseActions: {},
  currentBase: 'idle',
  allActions: []
};

function setActionWeight(action, weight) {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}

function crossFadeBase(toName, duration) {
  if (toName === PlayerRig.currentBase) return;
  const fromAction = PlayerRig.baseActions[PlayerRig.currentBase];
  const toAction = PlayerRig.baseActions[toName];
  if (!toAction) return;

  setActionWeight(toAction, 1);
  toAction.time = 0;

  if (fromAction) {
    fromAction.crossFadeTo(toAction, duration, true);
  } else {
    toAction.fadeIn(duration);
  }

  PlayerRig.currentBase = toName;
}
function triggerGesture() {}
async function buildPlayer() {
  const root = new THREE.Group();
  root.name = 'player';

  const body = new THREE.Group();
  body.name = 'body';
  root.add(body);

  const gltf = await new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    const binary = Uint8Array.from(atob(XBOT_MODEL_DATA), c => c.charCodeAt(0));
    loader.parse(binary.buffer, '', resolve, reject);
  });

  const model = gltf.scene;
  model.traverse(obj => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
    if (obj.isBone && obj.name.toLowerCase().includes('head') && !obj.name.toLowerCase().includes('top')) {
      PlayerRig.headBone = obj;
    }
  });
  body.add(model);

  const mixer = new THREE.AnimationMixer(model);
  PlayerRig.mixer = mixer;
  PlayerRig.allActions = [];

  // Soldier.glb animations are index-based: [0]=Idle, [1]=Run, [3]=Walk
  // Map them by scanning clip names (case-insensitive) with index fallback
  const animations = gltf.animations;
  const clipMap = { idle: null, walk: null, run: null };

  for (const clip of animations) {
    const lower = clip.name.toLowerCase();
    if (lower.includes('idle')) clipMap.idle = clip;
    else if (lower.includes('walk')) clipMap.walk = clip;
    else if (lower.includes('run')) clipMap.run = clip;
  }
  // Index fallback if name matching failed
  if (!clipMap.idle && animations[0]) clipMap.idle = animations[0];
  if (!clipMap.run && animations[1]) clipMap.run = animations[1];
  if (!clipMap.walk && animations[3]) clipMap.walk = animations[3];

  const baseWeights = { idle: 1, walk: 0, run: 0 };
  for (const [name, clip] of Object.entries(clipMap)) {
    if (!clip) continue;
    const action = mixer.clipAction(clip);
    setActionWeight(action, baseWeights[name]);
    action.play();
    PlayerRig.baseActions[name] = action;
    PlayerRig.allActions.push(action);
  }

  PlayerRig.currentBase = 'idle';

  root.position.set(0, 0, 10);
  game.scene.add(root);

  game.player.root = root;
  game.player.body = body;
  game.player.position = root.position;
  game.player.velocity = new THREE.Vector3();
  game.player.facing = 0;
  game.player.targetFacing = 0;
  game.player.walkPhase = 0;
  game.player.speed = 0;
  game.player.moving = false;
  game.player.sprinting = false;

  PlayerRig.root = root;
  PlayerRig.body = body;
  return root;
}
function animatePlayer(dt) {
  const p = game.player;
  if (!p.body) return;

  const dtS = dt / 1000;

  let targetBase = 'idle';
  if (p.moving && p.sprinting) {
    targetBase = 'run';
  } else if (p.moving) {
    targetBase = 'walk';
  }
  crossFadeBase(targetBase, 0.35);

  if (PlayerRig.mixer) {
    PlayerRig.mixer.update(dtS);
  }

  // Head look-at via skeleton bone
  if (PlayerRig.headBone && game.perfMode !== 'ultralow') {
    if (game.nearestZone) {
      const dx = game.nearestZone.x - game.player.position.x;
      const dz = game.nearestZone.z - game.player.position.z;
      const worldYaw = Math.atan2(dx, dz);
      let localYaw = worldYaw - p.facing;
      while (localYaw > Math.PI) localYaw -= Math.PI * 2;
      while (localYaw < -Math.PI) localYaw += Math.PI * 2;
      localYaw = Math.max(-1.05, Math.min(1.05, localYaw));
      PlayerRig.headBone.rotation.y += (localYaw - PlayerRig.headBone.rotation.y) * Math.min(1, dtS * 3);
    } else {
      PlayerRig.headBone.rotation.y += (0 - PlayerRig.headBone.rotation.y) * Math.min(1, dtS * 3);
    }
  }

  p.body.rotation.y = p.facing;
}

// ===== js/systems/audio.js =====
// Audio via Howler. All tracks are optional - missing files silent-fail.

const ASSET_BASE = './assets/audio';
const DEFAULT_TRACK = 'island_day';
const MUSIC_MAP = {
  citadel:    'castle',
  temple:     'forge',
  lighthouse: 'lighthouse',
  library:    'library',
  academy:    'library',
  forge:      'forge'
};

let unlocked = false;
const tracks = {};
const sfx = {};
let currentMusic = null;
let lastFootstep = 0;

function hasHowler() {
  return typeof window !== 'undefined' && typeof window.Howl !== 'undefined';
}

function safeLoad(category, name, opts) {
  if (!hasHowler()) return null;
  return new window.Howl({
    src: [ASSET_BASE + '/' + category + '/' + name + '.ogg',
          ASSET_BASE + '/' + category + '/' + name + '.mp3'],
    onloaderror: () => {},
    onplayerror: () => {},
    loop: opts && opts.loop,
    volume: opts && opts.volume != null ? opts.volume : 1,
    pool: opts && opts.pool,
    html5: opts && opts.html5
  });
}
function initAudio() {
  if (!hasHowler()) return;

  const musicNames = ['island_day', 'island_night', 'castle', 'forge', 'lighthouse', 'library'];
  for (const n of musicNames) tracks[n] = safeLoad('music', n, { loop: true, volume: 0, html5: true });

  sfx.footstep_grass = safeLoad('sfx', 'footstep_grass', { volume: 0.35, pool: 4 });
  sfx.footstep_sand  = safeLoad('sfx', 'footstep_sand',  { volume: 0.35, pool: 4 });
  sfx.interact       = safeLoad('sfx', 'interact',       { volume: 0.55, pool: 2 });
  sfx.type_tick      = safeLoad('sfx', 'type_tick',      { volume: 0.08, pool: 4 });
  sfx.scroll_pickup  = safeLoad('sfx', 'scroll_pickup',  { volume: 0.7,  pool: 1 });
  sfx.ocean_loop     = safeLoad('sfx', 'ocean_loop',     { volume: 0.25, loop: true });
  sfx.wind_loop      = safeLoad('sfx', 'wind_loop',      { volume: 0.15, loop: true });

  const unlock = () => {
    if (unlocked) return;
    unlocked = true;
    try {
      if (window.Howler && window.Howler.ctx && window.Howler.ctx.state === 'suspended') {
        window.Howler.ctx.resume();
      }
    } catch (e) {}
    if (sfx.ocean_loop) { try { sfx.ocean_loop.play(); } catch (e) {} }
    if (sfx.wind_loop)  { try { sfx.wind_loop.play();  } catch (e) {} }
    playMusic(DEFAULT_TRACK);
  };
  window.addEventListener('keydown',   unlock, { once: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
  window.addEventListener('mousedown', unlock, { once: true });
}

function playMusic(name) {
  if (!unlocked) return;
  const next = tracks[name];
  if (!next || next === currentMusic) return;
  const prev = currentMusic;
  if (prev) {
    try { prev.fade(prev.volume() || 0.5, 0, 800); } catch (e) {}
    setTimeout(() => { try { prev.pause(); } catch (e) {} }, 820);
  }
  try {
    if (!next.playing()) next.play();
    next.volume(0);
    next.fade(0, 0.45, 800);
  } catch (e) {}
  currentMusic = next;
}
function onZoneEnter(zoneId) {
  if (zoneId && MUSIC_MAP[zoneId]) playMusic(MUSIC_MAP[zoneId]);
  else playMusic(DEFAULT_TRACK);
}
function onFootstep(terrainType, sprinting) {
  if (!unlocked) return;
  const now = performance.now();
  const threshold = sprinting ? 180 : 260;
  if (now - lastFootstep < threshold) return;
  lastFootstep = now;
  const s = terrainType === 'sand' ? sfx.footstep_sand : sfx.footstep_grass;
  if (s) { try { s.play(); } catch (e) {} }
}
function onInteract() {
  if (!unlocked || !sfx.interact) return;
  try { sfx.interact.play(); } catch (e) {}
}
function onType() {
  if (!unlocked || !sfx.type_tick) return;
  try { sfx.type_tick.play(); } catch (e) {}
}

// ===== js/systems/input.js =====
// Input: keyboard, mouse (with optional pointer lock), touch joystick + look pad.
const Input = {
  actionCallback: null   // set by interaction.js
};
function wireInput() {
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    game.keys[k] = true;
    if (['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d',' '].includes(k)) e.preventDefault();
    if (k === 'shift') game.player.sprinting = true;
    if (k === 'e' && Input.actionCallback) Input.actionCallback();
    if (k === 'escape' && document.pointerLockElement) document.exitPointerLock();
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    game.keys[k] = false;
    if (k === 'shift') game.player.sprinting = false;
  });
  window.addEventListener('blur', () => {
    for (const k of Object.keys(game.keys)) game.keys[k] = false;
    game.player.sprinting = false;
  });

  if (!game.touchMode) {
    const canvas = game.canvas;
    canvas.addEventListener('click', () => {
      if (!document.pointerLockElement) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      game.pointer.locked = document.pointerLockElement === canvas;
      if (game.crosshairEl) {
        game.crosshairEl.classList.toggle('visible', game.pointer.locked);
      }
    });
    document.addEventListener('mousemove', e => {
      if (game.pointer.locked) applyLookInput(e.movementX, e.movementY, false);
    });
    // Wheel zoom - works whether or not pointer is locked. preventDefault stops
    // the page from scrolling underneath the canvas.
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      applyZoomInput(e.deltaY, false);
    }, { passive: false });
  }

  if (game.touchMode) {
    document.getElementById('joystick').classList.add('active');
    document.getElementById('action-btn').classList.add('active');
    document.getElementById('run-btn').classList.add('active');
    document.getElementById('look-pad').classList.add('active');
    wireTouch();
    const helpEl = document.getElementById('help');
    if (helpEl) helpEl.style.display = 'none';
  }
}

function wireTouch() {
  const joystick = document.getElementById('joystick');
  const knob = joystick.querySelector('.knob');
  const lookPad = document.getElementById('look-pad');
  const actBtn = document.querySelector('#action-btn button');
  const runBtn = document.querySelector('#run-btn button');

  const jCx = () => {
    const r = joystick.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, radius: r.width / 2 };
  };
  function resetJoystick() {
    knob.style.transform = 'translate(0, 0)';
    game.touch.moveVec.x = 0;
    game.touch.moveVec.y = 0;
  }
  function updateJoystick(t) {
    const c = jCx();
    let dx = t.clientX - c.cx;
    let dy = t.clientY - c.cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    const max = c.radius * 0.9;
    if (d > max) { dx = (dx / d) * max; dy = (dy / d) * max; }
    knob.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    game.touch.moveVec.x = dx / max;
    game.touch.moveVec.y = dy / max;
  }

  joystick.addEventListener('touchstart', e => {
    e.preventDefault();
    const t = e.changedTouches[0];
    game.touch.joystickId = t.identifier;
    updateJoystick(t);
  }, { passive: false });
  joystick.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.joystickId) updateJoystick(t);
    }
  }, { passive: false });
  const endJoystick = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.joystickId) {
        game.touch.joystickId = null;
        resetJoystick();
      }
    }
  };
  joystick.addEventListener('touchend', endJoystick);
  joystick.addEventListener('touchcancel', endJoystick);

  lookPad.addEventListener('touchstart', e => {
    for (const t of e.changedTouches) {
      if (game.touch.lookId == null) {
        game.touch.lookId = t.identifier;
        game.touch.lookLastX = t.clientX;
        game.touch.lookLastY = t.clientY;
      }
    }
  }, { passive: true });
  lookPad.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.lookId) {
        const dx = t.clientX - game.touch.lookLastX;
        const dy = t.clientY - game.touch.lookLastY;
        game.touch.lookLastX = t.clientX;
        game.touch.lookLastY = t.clientY;
        applyLookInput(dx, dy, true);
      }
    }
  }, { passive: true });
  const endLook = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === game.touch.lookId) game.touch.lookId = null;
    }
  };
  lookPad.addEventListener('touchend', endLook);
  lookPad.addEventListener('touchcancel', endLook);

  actBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (Input.actionCallback) Input.actionCallback();
  }, { passive: false });
  actBtn.addEventListener('click', () => {
    if (Input.actionCallback) Input.actionCallback();
  });

  runBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    const on = runBtn.classList.toggle('on');
    game.player.sprinting = on;
  }, { passive: false });
  runBtn.addEventListener('click', () => {
    const on = runBtn.classList.toggle('on');
    game.player.sprinting = on;
  });
}
function getMoveIntent() {
  let dx = 0, dy = 0;
  if (game.keys['w'] || game.keys['arrowup'])    dy += 1;
  if (game.keys['s'] || game.keys['arrowdown'])  dy -= 1;
  if (game.keys['a'] || game.keys['arrowleft'])  dx -= 1;
  if (game.keys['d'] || game.keys['arrowright']) dx += 1;
  if (game.touch.moveVec.x || game.touch.moveVec.y) {
    dx += game.touch.moveVec.x;
    dy += -game.touch.moveVec.y;
  }
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  return { dx, dy };
}

// ===== js/ui/hud.js =====
// HUD: dialogue modal, prompt, zone label, toast, typewriter effect.
// Pure DOM manipulation - all nodes built via el() from dialogues.js.
function openDialogue(zoneId) {
  const gen = DIALOGUES[zoneId];
  if (!gen || !game.dialogueEl) return;
  clearChildren(game.dialogueEl);
  const nodes = gen();
  for (const n of nodes) game.dialogueEl.appendChild(n);
  game.dialogueEl.classList.add('visible');
  game.dialogueEl.scrollTop = 0;
  startTypewriter();
}
function closeDialogue() {
  if (!game.dialogueEl) return;
  game.dialogueEl.classList.remove('visible');
  game.typingSpans = null;
}
function setZoneLabel(name) {
  if (!game.hudZoneEl) return;
  if (game.hudZoneEl.textContent !== name) {
    game.hudZoneEl.textContent = name;
  }
  game.hudZoneEl.classList.add('visible');
}
function clearZoneLabel() {
  if (!game.hudZoneEl) return;
  game.hudZoneEl.classList.remove('visible');
}

let promptText = '';
function showPrompt(text) {
  if (!game.promptEl) return;
  const keyLabel = game.touchMode ? 'ACT' : 'E';
  if (text !== promptText) {
    clearChildren(game.promptEl);
    game.promptEl.appendChild(el('span', { class: 'key' }, keyLabel));
    game.promptEl.appendChild(document.createTextNode(text));
    promptText = text;
  }
  game.promptEl.classList.add('visible');
}
function hidePrompt() {
  if (!game.promptEl) return;
  game.promptEl.classList.remove('visible');
  promptText = '';
}
function showToast(text) {
  if (!game.toastEl) return;
  game.toastEl.textContent = text;
  game.toastEl.classList.add('visible');
  game.toastTimer = 1800;
}
function updateToast(dt) {
  if (!game.toastEl) return;
  if (game.toastTimer > 0) {
    game.toastTimer -= dt;
    if (game.toastTimer <= 0) game.toastEl.classList.remove('visible');
  }
}

// Typewriter - walks all text nodes inside the dialogue and fades characters in.
function startTypewriter() {
  if (!game.dialogueEl) return;
  const walker = document.createTreeWalker(game.dialogueEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let tn;
  while ((tn = walker.nextNode())) textNodes.push(tn);
  game.typingSpans = [];
  game.typingProgress = 0;
  game.typedSoFar = 0;
  for (const node of textNodes) {
    const text = node.textContent;
    if (!text) continue;
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const s = document.createElement('span');
      s.textContent = ch;
      s.style.opacity = '0';
      frag.appendChild(s);
      game.typingSpans.push(s);
    }
    node.parentNode.replaceChild(frag, node);
  }
}
function advanceTyping(dt) {
  if (!game.typingSpans || game.typedSoFar >= game.typingSpans.length) return;
  game.typingProgress += (TYPE_CPS * dt) / 1000;
  const target = Math.min(game.typingSpans.length, Math.floor(game.typingProgress));
  let typedThisFrame = 0;
  for (let i = game.typedSoFar; i < target; i++) {
    game.typingSpans[i].style.opacity = '1';
    typedThisFrame++;
  }
  if (typedThisFrame > 0) onType();
  game.typedSoFar = target;
}

// ===== js/ui/minimap.js =====
// Minimap - 2D canvas rendered once per frame (cheap). Shows island silhouette,
// zones as icons, player as a glowing dot + facing wedge.



let ctx = null;
let cw = 160, ch = 160;
function initMinimap() {
  if (!game.minimapCanvas) return;
  ctx = game.minimapCanvas.getContext('2d');
  cw = game.minimapCanvas.width;
  ch = game.minimapCanvas.height;
}

function worldToMap(x, z, scale) {
  return {
    mx: cw / 2 + (x / WORLD_RADIUS) * (cw / 2) * scale,
    my: ch / 2 + (z / WORLD_RADIUS) * (ch / 2) * scale
  };
}

const ZONE_COLORS = {
  plaza: '#7cc7ff',
  notice: '#b48cff',
  forge: '#f4c64e',
  citadel: '#7cc7ff',
  broadcast: '#ff8a55',
  gateway: '#5ee0a0',
  transport: '#e55a5a',
  temple: '#b48cff',
  workshop: '#f4c64e',
  freshnote: '#96a0b5',
  library: '#7cc7ff',
  academy: '#ff8a55',
  lighthouse: '#e55a5a',
  milestones: '#f4c64e'
};
function updateMinimap() {
  if (!ctx) return;
  ctx.clearRect(0, 0, cw, ch);

  // Island silhouette
  ctx.save();
  ctx.fillStyle = 'rgba(80, 120, 70, 0.45)';
  ctx.beginPath();
  ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ring
  ctx.strokeStyle = 'rgba(124, 199, 255, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  // Zones
  for (let i = 0; i < ZONE_LAYOUT.length; i++) {
    const zn = ZONE_LAYOUT[i];
    const p = worldToMap(zn.x, zn.z, 0.85);
    ctx.fillStyle = ZONE_COLORS[zn.id] || '#ffffff';
    ctx.beginPath();
    ctx.arc(p.mx, p.my, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Player
  if (game.player && game.player.position) {
    const p = worldToMap(game.player.position.x, game.player.position.z, 0.85);
    // Facing wedge
    ctx.save();
    ctx.translate(p.mx, p.my);
    ctx.rotate(game.player.facing);
    ctx.fillStyle = 'rgba(180,140,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, -2);
    ctx.lineTo(-7, -14);
    ctx.lineTo(7, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Dot
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.mx, p.my, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b48cff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Nearest zone highlight
  if (game.nearestZone) {
    const p = worldToMap(game.nearestZone.x, game.nearestZone.z, 0.85);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.mx, p.my, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ===== js/systems/controller.js =====
// Player movement controller. Translates (camera-relative) move intent to
// world-space velocity, applies collision, updates facing.







const PLAYER_RADIUS = 0.45;
function updateController(dt, time) {
  const p = game.player;
  const dtS = Math.min(0.05, dt / 1000);
  const intent = getMoveIntent();
  const moving = intent.dx !== 0 || intent.dy !== 0;

  const yaw = getCameraYaw();
  // Convert camera-relative intent into world-space direction:
  //   forward (dy = +1) = -Z in world rotated by yaw
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const forwardX = -sy, forwardZ = -cy;
  const rightX   =  cy, rightZ   = -sy;

  const wx = forwardX * intent.dy + rightX * intent.dx;
  const wz = forwardZ * intent.dy + rightZ * intent.dx;
  const intentLen = Math.hypot(wx, wz);

  const targetSpeed = p.sprinting && moving ? SPRINT_SPEED : (moving ? WALK_SPEED : 0);

  // Accelerate / decelerate (damp takes dt in seconds)
  if (moving) {
    p.speed = damp(p.speed, targetSpeed, MOVE_ACCEL, dtS);
    p.targetFacing = Math.atan2(wx, wz);
  } else {
    p.speed = damp(p.speed, 0, MOVE_DECEL, dtS);
  }

  setTargetFov(p.sprinting && moving);

  // Apply facing lerp
  p.facing = angleDamp(p.facing, p.targetFacing, TURN_LERP, dtS);

  // Translate
  if (intentLen > 0 && p.speed > 0.001) {
    const nx = wx / intentLen;
    const nz = wz / intentLen;
    let ppx = p.position.x + nx * p.speed * dtS;
    let ppz = p.position.z + nz * p.speed * dtS;
    const fixed = resolveCollision(ppx, ppz, PLAYER_RADIUS);
    ppx = fixed.x; ppz = fixed.z;

    // Keep on island - clamp to max radius ~170m
    const rad = Math.hypot(ppx, ppz);
    const MAX = 168;
    if (rad > MAX) {
      ppx = (ppx / rad) * MAX;
      ppz = (ppz / rad) * MAX;
    }

    p.position.x = ppx;
    p.position.z = ppz;
  }

  // Glue to terrain height
  const h = sampleTerrainHeight(p.position.x, p.position.z);
  p.position.y = Math.max(h, -0.5);

  p.moving = moving && p.speed > 0.05;

  // Footsteps
  if (p.moving) {
    const stepInterval = p.sprinting ? 280 : 410;
    if (!p._lastStep || time - p._lastStep > stepInterval) {
      p._lastStep = time;
      onFootstep(h < 0.9 ? 'sand' : 'grass', p.sprinting);
    }
  }
}

// ===== js/systems/interaction.js =====
// Nearest-zone detection + E/ACT trigger. Opens dialogue, downloads resume.
function initInteraction() {
  Input.actionCallback = tryAction;
}
function updateInteraction(dt) {
  if (!game.zones || !game.zones.length) return;
  const px = game.player.position.x;
  const pz = game.player.position.z;

  let nearest = null;
  let nearestD = Infinity;
  for (let i = 0; i < game.zones.length; i++) {
    const z = game.zones[i];
    const dx = px - z.x, dz = pz - z.z;
    const d = Math.sqrt(dx * dx + dz * dz);
    if (d < (z.r + INTERACT_RADIUS_DEFAULT) && d < nearestD) {
      nearestD = d;
      nearest = z;
    }
  }
  game.nearestZone = nearest;

  if (nearest) {
    setZoneLabel(nearest.name);
    if (!game.activeZone || game.activeZone.id !== nearest.id) {
      showPrompt(nearest.prompt || 'interact');
    }
  } else {
    clearZoneLabel();
    hidePrompt();
    if (game.activeZone) {
      game.activeZoneTimer += dt;
      if (game.activeZoneTimer > 350) {
        closeDialogue();
        game.activeZone = null;
        game.activeZoneTimer = 0;
      }
    }
  }
}
function tryAction() {
  const z = game.nearestZone;
  if (!z) return;

  if (z.id === 'notice') {
    const a = document.createElement('a');
    a.href = RESUME_HREF;
    a.download = 'Kaviyarasu_Fullstack_Engineer_Resume.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('RESUME DOWNLOADED');
    cameraShake(0.18, 220);
    onInteract();
    return;
  }

  if (game.activeZone && game.activeZone.id === z.id) {
    closeDialogue();
    game.activeZone = null;
    game.activeZoneTimer = 0;
    return;
  }

  openDialogue(z.id);
  game.activeZone = z;
  game.activeZoneTimer = 0;
  onZoneEnter(z.id);
  onInteract();
  triggerGesture('agree');
}

// ===== js/systems/clock.js =====
// Day/night clock. Sun orbits around the player, sky + fog + exposure tween
// with the phase. T key bumps time forward; ?time=0..1 URL param seeds the clock.





const DAY_LENGTH_MS = 10 * 60 * 1000; // 10-minute full cycle
let clockOffset = 0;
let advanceOnT = 0;
function initClock() {
  const params = new URLSearchParams(window.location.search);
  const qp = parseFloat(params.get('time'));
  if (!Number.isNaN(qp) && qp >= 0 && qp <= 1) {
    game.clock.dayFraction = qp;
  }
  clockOffset = performance.now() - game.clock.dayFraction * DAY_LENGTH_MS;
  window.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 't') {
      advanceOnT += 0.07;
    }
  });
  game.clock.sunDir = new THREE.Vector3();
}

function phaseFor(t) {
  if (t < 0.08)  return 'night';
  if (t < 0.20)  return 'dusk';    // dawn (sun rising)
  if (t < 0.58)  return 'day';
  if (t < 0.68)  return 'day';
  if (t < 0.80)  return 'dusk';    // sunset
  return 'night';
}
function updateClock(time) {
  const elapsed = (time + advanceOnT * DAY_LENGTH_MS - clockOffset) % DAY_LENGTH_MS;
  const t = (elapsed + DAY_LENGTH_MS) % DAY_LENGTH_MS / DAY_LENGTH_MS;
  game.clock.dayFraction = t;

  // Sun angle: 0..1 → -90°..+270° so the sun is below the horizon at t=0 and 1.
  const ang = (t * Math.PI * 2) - Math.PI * 0.5;
  const sunDir = game.clock.sunDir;
  sunDir.set(Math.cos(ang), Math.sin(ang), 0.3);
  sunDir.normalize();

  updateSunFromDirection(sunDir);

  const phase = phaseFor(t);
  updateSky(sunDir, phase);

  // Fog color tween + exposure
  const fog = game.scene.fog;
  if (fog) {
    let target;
    if (phase === 'day')       target = new THREE.Color(FOG_COLOR_DAY);
    else if (phase === 'dusk') target = new THREE.Color(FOG_COLOR_DUSK);
    else                        target = new THREE.Color(FOG_COLOR_NIGHT);
    fog.color.lerp(target, 0.05);
    game.scene.background.copy(fog.color);
  }

  // Exposure
  const renderer = game.renderer;
  if (renderer) {
    let targetExp = 1.05;
    if (phase === 'day')  targetExp = 1.05;
    if (phase === 'dusk') targetExp = 1.15;
    if (phase === 'night') targetExp = 0.55;
    renderer.toneMappingExposure = lerp(renderer.toneMappingExposure, targetExp, 0.04);
  }

  // Sun intensity
  if (game.sun) {
    let i = 2.2;
    if (phase === 'day')  i = 2.4;
    if (phase === 'dusk') i = 1.5;
    if (phase === 'night') i = 0.25;
    game.sun.intensity = lerp(game.sun.intensity, i, 0.05);
  }
  if (game.hemi) {
    let hi = 0.55;
    if (phase === 'night') hi = 0.2;
    game.hemi.intensity = lerp(game.hemi.intensity, hi, 0.05);
  }
}

// ===== js/systems/gameloop.js =====
// Main rAF loop. Runs controller + systems, renders scene via composer.











let loopRunning = false;
function startLoop() {
  if (loopRunning) return;
  loopRunning = true;
  game.lastTime = performance.now();
  window.addEventListener('resize', resizeRenderer);
  window.addEventListener('orientationchange', resizeRenderer);
  requestAnimationFrame(frame);
}

function frame(time) {
  const dt = Math.min(50, time - game.lastTime);
  game.lastTime = time;

  update(dt, time);
  render(time);
  perfWatch(dt);

  requestAnimationFrame(frame);
}

function update(dt, time) {
  updateController(dt, time);
  updateCamera(dt);
  updateInteraction(dt);
  updateClock(time);
  updateWater(dt, time);
  updateBuildings(dt, time);
  animatePlayer(dt);
  advanceTyping(dt);
  updateToast(dt);
  updateMinimap();
}

function render(time) {
  renderFrame();
}

function perfWatch(dt) {
  game.frameSamples.push(dt);
  if (game.frameSamples.length > 180) game.frameSamples.shift();
  if (game.frameSamples.length < 180) return;
  const avg = game.frameSamples.reduce((a, b) => a + b, 0) / game.frameSamples.length;
  if (avg > 30 && game.perfMode === 'normal') {
    setPerfMode('low');
    console.info('Perf: avg ' + avg.toFixed(1) + 'ms → low mode');
  } else if (avg > 42 && game.perfMode === 'low') {
    setPerfMode('ultralow');
    console.info('Perf: avg ' + avg.toFixed(1) + 'ms → ultralow mode');
  }
}

// ===== js/main.js =====
// Async bootstrap. Runs on DOMContentLoaded from the bundled IIFE.



















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
    { hint: 'Summoning traveler',   run: () => buildPlayer() },
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

})();
