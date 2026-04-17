import fs from 'node:fs';
import path from 'node:path';

// Concatenation order matters: utilities & config first, then state,
// then engine/world/entity, then systems, then UI, then bootstrap.
const ORDER = [
  // foundation
  'js/config.js',
  'js/util/dom.js',
  'js/util/rng.js',
  'js/util/math.js',
  'js/util/three.js',
  'js/state.js',

  // content
  'js/content/contact.js',
  'js/content/projects.js',
  'js/content/experience.js',
  'js/content/education.js',
  'js/content/dialogues.js',

  // engine
  'js/engine/assets.js',
  'js/engine/renderer.js',
  'js/engine/scene.js',
  'js/engine/camera.js',
  'js/engine/loader.js',

  // world
  'js/world/zones.js',
  'js/world/collision.js',
  'js/world/terrain.js',
  'js/world/water.js',
  'js/world/sky.js',
  'js/world/buildings.js',
  'js/world/props.js',

  // entity
  'js/entity/player.js',

  // systems (audio first so interaction can import its callbacks safely)
  'js/systems/audio.js',
  'js/systems/input.js',

  // UI depends on dialogues + state
  'js/ui/hud.js',
  'js/ui/minimap.js',

  // systems that depend on UI + engine
  'js/systems/controller.js',
  'js/systems/interaction.js',
  'js/systems/clock.js',
  'js/systems/gameloop.js',

  // bootstrap last
  'js/main.js'
];

const root = path.dirname(new URL(import.meta.url).pathname);

let out = '// Auto-generated from /js/*.js — do not edit. Run `node build.mjs` to regenerate.\n';
out += '(function(){\n"use strict";\n\n';

for (const rel of ORDER) {
  const full = path.join(root, rel);
  let src = fs.readFileSync(full, 'utf8');
  src = src.replace(/^\s*import\s+[^;]*?;\s*$/gm, '');
  src = src.replace(/^\s*export\s+default\s+/gm, '');
  src = src.replace(/^\s*export\s+/gm, '');
  out += '// ===== ' + rel + ' =====\n' + src.trim() + '\n\n';
}

out += '})();\n';

const distDir = path.join(root, 'dist');
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'bundle.js'), out);
console.log('Wrote dist/bundle.js — ' + (out.length / 1024).toFixed(1) + ' KB');
