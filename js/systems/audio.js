// Audio via Howler. All tracks are optional — missing files silent-fail.

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

export function initAudio() {
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

export function onZoneEnter(zoneId) {
  if (zoneId && MUSIC_MAP[zoneId]) playMusic(MUSIC_MAP[zoneId]);
  else playMusic(DEFAULT_TRACK);
}

export function onFootstep(terrainType, sprinting) {
  if (!unlocked) return;
  const now = performance.now();
  const threshold = sprinting ? 180 : 260;
  if (now - lastFootstep < threshold) return;
  lastFootstep = now;
  const s = terrainType === 'sand' ? sfx.footstep_sand : sfx.footstep_grass;
  if (s) { try { s.play(); } catch (e) {} }
}

export function onInteract() {
  if (!unlocked || !sfx.interact) return;
  try { sfx.interact.play(); } catch (e) {}
}

export function onType() {
  if (!unlocked || !sfx.type_tick) return;
  try { sfx.type_tick.play(); } catch (e) {}
}
