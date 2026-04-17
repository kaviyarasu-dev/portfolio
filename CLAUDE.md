# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Three.js WebGL scene that renders Kaviyarasu's developer portfolio as a stylized low-poly island (Plaza of Kaviyarasu). The source lives as ES modules under `/js/`; a small Node build script concatenates them into `dist/bundle.js`, which is what the page actually loads.

- `index.html` — shell: canvas, HUD, dialogue div, touch controls, CSS. Loads Three.js r147 + postprocessing examples from jsDelivr, then Howler.js, then `./dist/bundle.js` (classic script, no `type="module"` — so `file://` works).
- `/js/` — ES module tree (see "Script architecture"). This is the dev view.
- `dist/bundle.js` — auto-generated artifact. Regenerate via `node build.mjs`.
- `build.mjs` — dumb concatenator: dep-ordered, strips `import`/`export`, wraps everything in one IIFE.
- `/assets/audio/` — optional MP3/OGG files (see `assets/audio/CREDITS.md`). Runs silently if missing.
- `Kaviyarasu Full Stack Engineer Resume.pdf` — downloaded by the Notice Board. **Exact filename matters**; `RESUME_HREF` in `js/config.js` points to it.

No package manager, no framework. Three.js and Howler.js come from CDNs.

## Run / iterate

- **Run**: double-click `index.html` (works via `file://`) OR visit `http://localhost/gggg/` under XAMPP. Either way the browser loads `dist/bundle.js`.
- **After editing any `/js/*.js` module, run `node build.mjs`** to regenerate `dist/bundle.js`. Takes <100ms. Forgetting this step is the #1 way to get "my change didn't do anything."
- **No tests, no linter.** For logic checks that don't need a browser, write a short Node script that imports from `/js/` directly — the source tree is valid ESM and Node resolves it as-is. For visual checks, open `index.html` and walk around.
- **Minimum browser support**: modern evergreen with WebGL. Uses `CapsuleGeometry`, `IcosahedronGeometry`, `CanvasTexture`, `InstancedMesh`, `ShaderMaterial`, ACES tone mapping.

## Renderer setup

- THREE.js r0.147.0 (UMD global via CDN script tags in `index.html`).
- WebGLRenderer with ACES Filmic tone mapping, shadow maps (PCFSoftShadowMap, 2048 desktop / 1024 mobile).
- Post-processing: EffectComposer → RenderPass → UnrealBloomPass (threshold 0.85, strength 0.55, radius 0.7) → FXAA ShaderPass.
- Directional sun light + HemisphereLight fill. Several building point lights for local glow.
- Fog: exponential (FogExp2-style), colour driven by day/night clock.

**Bloom is calibrated.** New emissives should stay under ~0.15 intensity unless you intend a landmark glow. Check at day, dusk, and night.

## Script architecture

```
/js/
  main.js                — async bootstrap (see "Bootstrap order" below)
  state.js               — the one shared mutable `game` object
  config.js              — WORLD_RADIUS, TERRAIN_SIZE, camera, fog, sky colors, PALETTE, RESUME_HREF, INTERACT_RADIUS_DEFAULT
  util/
    dom.js               — el(), strong(), br(), clearChildren()  (preserves no-innerHTML rule)
    rng.js               — seeded rng
    math.js              — lerp, clamp, smoothstep, easeOutCubic
    three.js             — makeBox/makeCylinder/makeCone/makeSphere/makeTorus/makeGroup factories, makeStandard material helper, mergeGeometries (indexed BufferGeometry merger with optional vertex-color support)
  engine/
    assets.js            — procedural textures (grass, sand, path, water normal)
    renderer.js          — initRenderer(), initComposer(), renderFrame(), resizeRenderer(), setPerfMode() (normal | low | ultralow)
    scene.js             — buildScene() (root Scene, DirectionalLight sun, HemisphereLight hemi, propsRoot, buildingsRoot), updateSunFromDirection()
    camera.js            — initCameraRig(), updateCamera() (third-person follow, mouse yaw/pitch, dead-zone)
    loader.js            — runPreload(), hideLoader(), showFatalError() with progress bar
  world/
    zones.js             — ZONE_LAYOUT: 14 landmark anchor positions + interaction radii
    collision.js         — addCollider()/clearColliders(), capsule-vs-cylinder tests for player movement
    terrain.js           — PlaneGeometry island, per-vertex height noise, vertex colors from PALETTE, sampleHeight(x,z)
    water.js             — transparent plane with scrolling normal map
    sky.js               — Sky dome (inverted sphere ShaderMaterial, vertical gradient), sun billboard, LOW-POLY CLOUDS (3 icosahedron-merged prototype puffs × 8 instances each = 24 drifting clouds; emissive scales down at dusk/night; wraps around ±260u)
    buildings.js         — 14 landmark factories returning THREE.Group each (plaza, notice, forge, citadel, broadcast, gateway, transport, temple, workshop, freshnote, library, academy, lighthouse, milestones). Shared helpers: `buildingTrimFlutedColumn`, `buildingTrimHippedRoof`, `buildingTrimRoofSoffit` — reusable across factories. `updateBuildings(dt, t)` walks group.userData.update callbacks.
    props.js              — scatterTrees/scatterRocks/scatterGrass — all InstancedMesh. **Trees**: 2 species (pine + broadleaf), 4 InstancedMeshes total (~100 pine + ~40 broadleaf), vertex-color tip-to-base gradient. **Rocks**: 3 shape variants (IcosahedronGeometry(r,1) + multi-octave warp), 60 total, vertex-color moss baked on upward-facing verts. **Grass**: cross-billboard tufts.
  entity/
    player.js             — smooth humanoid: capsule torso (scale 1.25x1.0x0.78), capsule arms/legs, sphere head, multi-icosahedron hair tuft. Procedural fabric roughnessMap on shirt/pants/cape. Cape = 4 verlet-simulated plane segments. Walk/sprint cycle drives limb-GROUP rotations (.lleg/.rleg/.larm/.rarm) — so any anatomy changes must preserve those group pivots.
  systems/
    audio.js              — Howler.js wrappers; initAudio(), onZoneChange/onFootstep/onType/onInteract; silent-fail if /assets/audio/* missing
    input.js              — keyboard (WASD, Shift, E, T, Esc), pointer-lock mouse look, touch joystick + action buttons
    controller.js         — player movement + collision + terrain clamping + facing smoothing
    interaction.js        — nearest-zone detection, dialogue open/close, resume download
    clock.js              — 10-min day cycle (?time=0..1 query param seeds, T advances), driving updateSky() + fog + exposure + sun intensity
    gameloop.js           — rAF loop, calls update(dt,time) then render(time). Perf watchdog swaps perfMode if avg dt > 30ms
  ui/
    hud.js                — dialogue panel (TreeWalker typewriter), zone pill, toast, prompt
    minimap.js            — 256×256 offscreen canvas, redrawn each frame from world state
  content/
    contact.js, projects.js, experience.js, education.js, dialogues.js — resume-accurate data, dialogues render DOM via util/dom.js
```

Module graph is acyclic. **`state.js` is the only shared mutable** — all systems read/write `game.*`.

## Bootstrap order (`main.js#boot` via `runPreload`)

1. `initDomRefs()` — canvas, dialogue/HUD/toast DOM refs, `touchMode` detection.
2. `initRenderer()` — WebGLRenderer + shadow config.
3. `initAssets()` — procedural terrain textures.
4. `buildScene()` — Scene, sun DirectionalLight, hemi HemisphereLight, propsRoot, buildingsRoot.
5. `buildTerrain()` — island PlaneGeometry with noise + per-vertex colors + sampleHeight.
6. `buildWater()` — water plane.
7. `buildSky()` — sky dome shader + sun billboard + `buildClouds()` (24 drifting InstancedMesh puffs).
8. `clearColliders()` → `placeBuildings()` — 14 factories called, each adds a Group to `game.buildingsRoot`.
9. `scatterProps()` — trees (4 InstancedMesh), rocks (3 InstancedMesh), grass (1 InstancedMesh) into `game.propsRoot`.
10. `buildPlayer()` — humanoid rig into `game.scene`.
11. `initCameraRig()` → `initComposer(scene, camera)` — EffectComposer with bloom + FXAA.
12. `wireInput()` → `initInteraction()` → `initAudio()` → `initClock()` → `initMinimap()`.
13. `startLoop()` starts rAF, `hideLoader()` fades overlay.

## Update/render loop (`systems/gameloop.js`)

Each frame:
1. `updateController(dt,time)` — apply input, move player, check collisions, clamp to terrain.
2. `updateCamera(dt)` — follow player, apply mouse-look, ease FOV.
3. `updateInteraction(dt)` — zone triggers + dialogue.
4. `updateClock(time)` — day/night phase; drives `updateSky()` (sky dome colors, sun position, cloud drift + emissive tint, fog color, exposure, sun intensity).
5. `updateWater(dt,time)` — normal map scroll.
6. `updateBuildings(dt,time)` — calls every group.userData.update callback (rotating emblems, pulsing lights, floating orbs).
7. `animatePlayer(dt)` — walk-cycle limb rotation, head bob, cape verlet.
8. `advanceTyping(dt)` + `updateToast(dt)` + `updateMinimap()`.

Then `renderFrame()` (composer.render).

**Shadow frustum** and bloom threshold are tuned for the island size. Large new emissive surfaces must be tested against bloom blowout.

## Constraints

- **No `innerHTML` / `outerHTML`.** The project's Write/Edit security hook blocks strings containing those tokens. Build DOM with `el()` from `util/dom.js`. Dialogue content goes through `DIALOGUES[id]()` returning DOM nodes.
- **Whitelisted external resources**:
  - Three.js r147 and postprocessing shaders from jsdelivr (pinned).
  - Howler.js CDN: `https://cdnjs.cloudflare.com/ajax/libs/howler/2.2.4/howler.min.js`.
  - Google Fonts: `Press Start 2P`.
  - Local audio under `/assets/audio/**` (OGG/MP3) — optional, silent-fail.
- **Procedural-first**: no external model (.gltf/.fbx) or texture imports. Textures are generated via `CanvasTexture`/`DataTexture`. All geometry is built from Three primitives or `BufferGeometry`.
- **`PALETTE` is locked** (`js/config.js`). Don't substitute colors.
- **Instancing budgets** (keep total draw calls low):
  - Trees: up to 4 InstancedMesh (pine-trunk, pine-canopy, broadleaf-trunk, broadleaf-canopy).
  - Rocks: 3 InstancedMesh (shape variants, ~20 each).
  - Clouds: 3 InstancedMesh (8 each).
  - Grass: 1 InstancedMesh (400).
- **IIFE name collisions**: all modules concatenate into one IIFE in the order listed in `build.mjs`. Two modules can't both declare the same top-level name (`const`, `let`, `function`). `util/math.js#lerp` has been hit before — prefix locals (`lerpScalar`, `buildingTrim*`, etc.) to keep top-level names unique across the tree.
- **Zone edits**: change coords in `world/zones.js` (`ZONE_LAYOUT`); match the building factory in `world/buildings.js`; add an entry in `content/dialogues.js`. Collision radius is registered inside each factory via `addCollider(x, z, r)`.

## Debug

- `?time=0.75` URL param → boot at dusk (`0`=midnight, `0.5`=noon).
- `T` advances time, `Shift` sprint, `E` interact, `Esc` exit pointer-lock / close dialogue.

## Zones (quick reference)

Plaza (hub) · Notice Board (resume) · Skill Forge (skills) · Citadel (featured project) · Broadcast Tower · Gateway · Transport Hub (plaza gazebo — fluted columns + hipped roof) · Temple (AI Agent OSS) · Workshop · Freshnote Studio · Library (experience) · Academy (education + PHP cert) · Lighthouse (contact) · Milestones.
