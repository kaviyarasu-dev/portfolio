// Shared mutable game state. Every system reads/writes here.
// Must not be reassigned; only its keys are mutated.

export const game = {
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
    dayFraction: 0.28,   // 0..1 — golden-hour-ish start
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

export function initDomRefs() {
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
