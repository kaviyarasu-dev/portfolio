import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 011
  {
    id: '011', name: 'quality-tiers-settings', title: 'Quality tiers low/medium/high, auto detection and the settings menu', epic: 'E1', est: 45,
    arch: 'sections 7 (Tiers, Accessibility) and requirement R3, decision D29',
    goal: [
      'Replace the v1 `perfMode` with the three tiers of the spec. `low` is the phone tier (D29: no point lights, 512 px textures, half the decor, interiors load only on entry). The tier is detected automatically, can be forced with `?quality=`, can be changed in a keyboard-operable settings panel, and a reduced-motion switch exists. Other plans read `getTier()` and `TIER_SETTINGS`; they never read the device themselves.',
    ],
    read: ['src/engine/renderer.js', 'src/systems/gameloop.js', 'src/state.js', 'src/engine/scene.js', 'src/ui/hud.js', 'index.html', 'src/dev/worldHook.js'],
    steps: [
      {
        title: 'Tier settings, detection and persistence (pure, unit tested)',
        items: [
          '`tests/unit/engine/quality.test.js` first. `src/engine/quality.js` exports `TIER_SETTINGS` with, per tier, these keys: `pixelRatioCap`, `shadows`, `shadowMapSize`, `bloom`, `fxaa`, `ssao`, `textureSize` (`\'512\'|\'1k\'`), `heroTextureSize` (`\'512\'|\'1k\'|\'2k\'`), `decorScale`, `maxPointLights`, `npcScale`, `particleScale`, `viewDistance`, `interiorsOnEntry`. Values: low = 1, false, 512, false, false, false, \'512\', \'512\', 0.5, 0, 0.4, 0.4, 220, true; medium = 1.5, true, 1024, true, true, false, \'1k\', \'1k\', 0.8, 4, 0.7, 0.7, 400, true; high = 2, true, 2048, true, true, true, \'1k\', \'2k\', 1, 8, 1, 1, 700, false.',
          '`detectTier({ isTouch, width, deviceMemory, cores, rendererName })` pure function (`main.js` calls it before `initRenderer` with `rendererName` undefined, then once the GL context exists calls `refineTier(rendererName)` which may only lower an auto tier, for a software renderer): touch device or width under 800 gives `low`; a software renderer name (contains `SwiftShader`, `llvmpipe` or `Software`) gives `medium`; deviceMemory 4 or less or cores 4 or less gives `medium`; else `high`. Missing inputs are treated as unknown, never as a failure.',
          '`getTier()`, `setTier(tier, { persist = true })`, `getAutoTier()`, `isAuto()`, `onTierChange(fn)` (returns an unsubscribe function), `getReducedMotion()`, `setReducedMotion(bool)`. Resolution order for the tier: `?quality=` param, stored choice (localStorage key `portfolio.quality`), detected tier, implemented as the pure `resolveTier({ param, stored, detected })` (the unit test calls it directly; module state has a `resetQualityForTests()` helper and `matchMedia` or `localStorage` being undefined never throws). `setTier(null)` means Auto (clears the stored value). While a URL param forces a tier, the panel shows that tier selected with the note "set by the page address" and panel changes apply for the session only (nothing is stored). Every storage access is wrapped in try/catch and works when `localStorage` throws or is undefined. Reduced motion defaults to the `prefers-reduced-motion: reduce` media query, overridable and stored under `portfolio.reducedMotion`.',
          'Test table: touch 390 wide gives low; 1920 wide with 8 cores and 16 GB gives high; SwiftShader gives medium; param beats stored beats detected; a throwing storage object does not break anything; `onTierChange` fires once per change and not for the same value.',
        ],
        verify: [vt('tests/unit/engine/quality.test.js'), exists('src/engine/quality.js')],
      },
      {
        title: 'Apply the tier to the renderer and replace perfMode',
        items: [
          'Remove `game.perfMode`, `setPerfMode` and the `perfWatch` branches that use it (search `src/` for every `perfMode` and `ultralow` use; none may remain). `src/engine/renderer.js` gets `applyTier(tier)`: pixel ratio `min(devicePixelRatio, pixelRatioCap)` (also `composer.setPixelRatio` and the FXAA `resolution` uniform), `renderer.shadowMap.enabled`, `game.sun.shadow.mapSize` and disposal of `game.sun.shadow.map` when the size changes, bloom pass `enabled`, FXAA pass `enabled` (the OutputPass of plan 002 stays on). It runs at boot and on every tier change. `tests/unit/engine/applyTier.test.js` drives it with plain fake objects (renderer, composer, passes, sun) and asserts each setting for the three tiers.',
          'The frame-time watcher in `src/systems/gameloop.js` now lowers the tier one step (high to medium to low) through `setTier(t, { persist: false, auto: true })` (the tier stays auto) when the average frame time over 180 frames exceeds 33 ms, at most once every 8 seconds, and only when the tier is auto (`isAuto()`), the URL has no `quality` param and `navigator.webdriver` is not true (so tests are never changed under them). Extract the rule as the pure `nextAutoTier({ tier, avgMs, sinceLastMs, auto })` with unit tests for the 33 ms and 8 s thresholds and the one-step rule. Replace the other v1 `perfMode` readers: `src/entity/player.js` head look-at runs unless the tier is `low`, and `src/world/buildings.js` smoke effects use `TIER_SETTINGS[getTier()].particleScale` (skip when it is under 0.5).',
          'Extend `src/dev/worldHook.js`: `quality()` returns the real tier, `setQuality(t)`, `pixelRatio()`, `reducedMotion()`.',
        ],
        verify: [none('src/state.js', 'perfMode'), none('src/entity/player.js', 'perfMode'), none('src/world/buildings.js', 'perfMode'), vt('tests/unit/engine/applyTier.test.js'), has('src/engine/renderer.js', 'applyTier')],
      },
      {
        title: 'Settings panel',
        items: [
          '`src/ui/settings.js`: `initSettings()` adds a gear button `#settings-btn` (aria-label "Settings") and builds `#settings` (role `dialog`, `aria-modal="true"`, labelled by its heading) with a radio group "Quality" (Auto, Low, Medium, High) and a checkbox "Reduce motion", plus a Close button. Key `O` toggles it; `Esc` closes it; opening it releases pointer lock and sets `game.uiBlocking = true` (the input code ignores movement, look and action keys while it is true, so arrow keys on the radios do not move the player; `main.js` calls `initSettings()`; the `O` listener lives in `settings.js`); focus moves into the panel and returns to the previous element on close; Tab stays inside while open. All DOM is built with the existing `el()` helper (no `innerHTML`). Choosing a radio calls `setTier` (Auto clears the stored choice). Styles go next to the other HUD CSS in `index.html`, same glass look as `#prompt`.',
          '`tests/e2e/settings.spec.js`: press `o` (panel visible, focus inside); choose Low with the keyboard (arrow keys on the radio group); `quality()` is `low` and `pixelRatio()` is 1 or less (also assert the radio checked state and `game.sun.shadow.mapSize` through the hook `tierSettings()` which returns the applied values); tick Reduce motion and `reducedMotion()` is true; press `Escape` (panel hidden); reload the page: both choices persist; open with `?quality=high` and the URL wins over the stored `low`.',
        ],
        verify: [pw('tests/e2e/settings.spec.js', 10), exists('src/ui/settings.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/engine/quality.test.js'), pw('tests/e2e/settings.spec.js', 10), pw('tests/e2e/smoke.spec.js', 15), pw('tests/e2e/v1-behaviour.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/index.html', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/engine/quality.test.js', 'portfolio/tests/e2e/settings.spec.js'],
  },

  // ---------------------------------------------------------------- 012
  {
    id: '012', name: 'fixtures-and-lighting-rig', title: 'Dev fixtures framework and the light manager (pooled interior lights, switches, dusk)', epic: 'E1', est: 50,
    arch: 'sections 4, 10.5 and assumption A11',
    goal: [
      'Two foundations. (1) Fixtures: dev-only mini scenes loaded with `?fixture=<name>` so tests and visual self-reviews do not need the whole island. (2) The light manager: interior lights are registered as data, a small fixed pool of real point lights is moved to the nearest active lights (no shader recompiles), the rest are emissive fakes, groups can be switched, and lights marked `auto: \'dusk\'` follow the clock.',
    ],
    read: ['src/main.js', 'src/engine/scene.js', 'src/systems/clock.js', 'src/engine/quality.js', 'src/dev/worldHook.js', 'src/systems/gameloop.js'],
    steps: [
      {
        title: 'Fixtures framework',
        items: [
          '`src/dev/fixtures/index.js`: `registerFixture(name, { build(ctx) })` where `ctx` has `{ scene, game, THREE }` and `build` returns `{ root, spawn: { x, y, z, yaw }, ready?: Promise }`; `getFixture(name)`; `listFixtures()`. Fixtures register themselves from `src/dev/fixtures/<name>.js`, imported by `index.js`. In this step provide only `blank` (a 60 m square floor); step 3 adds `lighting` and its import (so the step 1 test does not import a missing file). Plan 015 registers the v1 world area only when no fixture is active.',
          '`src/main.js`: when `import.meta.env.MODE !== \'production\'` and `getParams().fixture` is set, boot builds the renderer, scene, sky and clock, player, camera, input, interaction and audio, but not terrain, props or the 14 buildings; it adds the fixture root and teleports the player to `spawn`. An unknown fixture name throws a clear error that lists the known names. The production build contains no fixture code (the dynamic import sits inside the dev-only branch).',
          '`tests/unit/dev/fixtures.test.js`: register, get, duplicate name throws, unknown name returns null.',
        ],
        verify: [vt('tests/unit/dev/fixtures.test.js'), exists('src/dev/fixtures/index.js', 'src/dev/fixtures/blank.js')],
      },
      {
        title: 'Light manager (pure selection plus pooled THREE lights)',
        items: [
          '`tests/unit/lights/lightManager.test.js` first. `src/systems/lights/lightManager.js` exports `nightFactor(dayFraction)` (0 from 0.30 to 0.62, ramps 0 to 1 between 0.62 and 0.78, 1 from 0.78 to 1.0 and from 0.0 to 0.18, ramps 1 to 0 between 0.18 and 0.30), `selectActiveLights(lights, playerPos, max)` (only lights that are on and within `distance * 1.5` of the player, nearest first, stable on ties by id, at most `max`), and `class LightManager`.',
          '`LightManager`: `registerLight({ id, x, y, z, color, intensity, distance, group, room, auto, emissive, exempt })` (`emissive` is an array of meshes whose material gets `emissiveIntensity` 0 or 1.2 as the light turns off or on, with the material cloned per light so lights do not share a state and `emissive` colour set to the light colour; `exempt: true` marks a special light such as the lighthouse spot that is never pooled and never counted in `maxPointLights`; a group that has no `auto` starts OFF, and for mixed `auto` values in one group the group follows `auto: "dusk"` if any member has it); `unregisterLight(id)`; `setGroup(group, on)`, `toggleGroup(group)`, `isGroupOn(group)`; `setNight(factor)` with hysteresis: `auto: \'dusk\'` groups turn on when the factor reaches 0.55 and off when it falls under 0.45, and a manual switch is remembered until the next dusk/dawn flip; `attach(scene, poolSize)` creates `poolSize` `PointLight`s (no shadows) and `update(playerPos)` (a plain `{ x, y, z }`; distances are 3D so lights on other floors are far) moves the nearest active lights onto them (unused pool lights get intensity 0 and stay in the scene so the shader never recompiles); `list()` returns `[{ id, group, room, on, pooled, intensity }]`. Pool size comes from `TIER_SETTINGS[tier].maxPointLights` and follows tier changes through `resizePool(n)` (adding or removing pool lights on a tier change does recompile shaders once, which is accepted); pool lights use `decay: 2`, `castShadow: false`, the light `color` and `distance`; `pooledIntensity(id)` returns the real intensity of the pooled light or 0; the first `setNight` call applies the thresholds without hysteresis (on at or above 0.55, off below 0.45 only after having been on). Light units are physical (candela): document the intensity range that looks right (about 8 to 40 for a room lamp at `distance` 10).',
          'Tests: nightFactor table (0.5 gives 0, 0.7 between 0 and 1, 0.75 over 0.8, 0 gives 1, 0.28 under 0.2); selection by distance and max; ties; groups; hysteresis (factor 0.5 does not flip an already-on group); manual override survives a small night change and resets on a dusk flip; pool of 0 leaves emissives working; unregister.',
        ],
        verify: [vt('tests/unit/lights/lightManager.test.js'), exists('src/systems/lights/lightManager.js')],
      },
      {
        title: 'Wire the manager in, add the lighting fixture and the hook',
        items: [
          'Create the single `LightManager` in `src/engine/scene.js` (`game.lightManager`), call `setNight(nightFactor(game.clock.dayFraction))` and `update(player.position)` every frame from `gameloop.js`, and re-size the pool on `onTierChange`.',
          '`src/dev/fixtures/lighting.js`: a closed 8 m by 6 m room (box walls, floor, ceiling, a doorway), three registered lights: two in group `lamps` (`auto: \'dusk\'`, with small emissive bulb meshes) and one in group `ceiling` (no auto). Spawn inside the room.',
          'Hook: `listLights()` returns `lightManager.list()`; `toggleLightGroup(group)`; `lightIntensity(id)` returns `lightManager.pooledIntensity(id)`; `tierSettings()` is not needed here. Write the recommended intensity range for room lamps into `docs/world-conventions.md`.',
          '`tests/e2e/lighting.spec.js` (every URL also has `&freeze=1`; the fixture mode starts with the loader hidden and `ready` true after the first frame): with `?fixture=lighting&time=0.5&freeze=1&quality=high` the `lamps` lights are off and the `ceiling` light is off; with `time=0.75` the lamps are on and at least one is pooled with `lightIntensity` over 0; `toggleLightGroup(\'ceiling\')` turns it on at noon; with `quality=low` no light is pooled (emissive only) but `on` is still true; zero console errors.',
        ],
        verify: [pw('tests/e2e/lighting.spec.js', 10), exists('src/dev/fixtures/lighting.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/dev/fixtures.test.js', 'tests/unit/lights/lightManager.test.js'), pw('tests/e2e/lighting.spec.js', 10), pw('tests/e2e/smoke.spec.js', 15), npm('build', 15), node('scripts/check-prod-hook.mjs')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/dev/fixtures.test.js', 'portfolio/tests/unit/lights/lightManager.test.js', 'portfolio/tests/e2e/lighting.spec.js'],
  },

  // ---------------------------------------------------------------- 013
  {
    id: '013', name: 'materials-library', title: 'Shared PBR material library from CC0 Poly Haven textures', epic: 'E1', est: 50,
    arch: 'sections 1, 10.2 and requirement R3, decision D29',
    goal: [
      'Give every later plan a named set of realistic surfaces instead of flat vertex colours: about 22 CC0 PBR texture sets from Poly Haven packed to WebP (512 for phones, 1k default, 2k only for four hero sets), a `getMaterial(name, opts)` registry that picks the texture size from the quality tier, and metric UV mapping so walls and floors tile at a real-world scale. In Node (unit tests) materials work without textures.',
    ],
    read: ['scripts/assets/packMaterial.mjs', 'scripts/assets/polyhaven.mjs', 'scripts/search-assets.mjs', 'src/engine/quality.js', 'src/engine/assets.js', 'src/dev/fixtures/index.js', 'docs/world-conventions.md'],
    risks: ['D21 look risk: South Indian surfaces (pastel painted plaster, terracotta roof tile, red-oxide floors, coarse stucco) must come from generic CC0 textures plus a tint, so the registry stores a `tint` per material; the person judges the look (human check).'],
    steps: [
      {
        title: 'Batch tool and the texture sets',
        items: [
          '`scripts/assets/packMaterialList.mjs <list.json>`: for each `{ name, queries: [..], tags: [..], hero }` search Poly Haven textures (`searchAssets`) with each query, and try up to 3 candidate ids in order through `packMaterial` (the attempt counter of plan 005 applies per element `mat-<name>`); print one JSON line per material with the chosen id, or `{ name, ok: false, reason }`; write the summary to `assets/textures/INDEX.json` (name, polyhavenId, sizes) and ledger it. Unit test with a fake search and fake pack function: first candidate fails, second succeeds; all three fail gives `ok:false`.',
          'Write `scripts/assets/materials.list.json` with these 22 names and search hints (queries are hints; choose by what the API returns): `plaster` (painted plaster wall, smooth), `stucco` (rough exterior plaster), `concrete`, `roofTile` (terracotta roof tiles), `floorTile` (ceramic floor tiles, hero), `floorTileDark`, `woodPlanks` (wooden floor, hero), `woodDark` (dark varnished wood), `brick`, `stoneRough`, `stonePaving` (cobbles or paving), `fabric`, `carpet`, `metalBrushed`, `metalPainted`, `marble` (hero), `gravel`, `sand`, `grass`, `dirtRoad` (dirt or mud ground), `rockCliff`, `thatch` (dry grass or straw if available; may fall back). `plaster` is also hero. Run the batch (network). Accept the result when at least 18 of the 22 packed; list the failed ones in your report.',
          '`tests/unit/materials/sets.test.js`: `assets/textures/INDEX.json` parses; at least 18 sets; for each set the `512` and `1k` folders each contain `color.webp`, `normal.webp`, `rough.webp`; the four hero sets also have `2k`; every file is in the ledger (read `assets/LEDGER.json` directly); total size of `assets/textures` is under 30 MB.',
        ],
        verify: [vt('tests/unit/materials/sets.test.js'), exists('assets/textures/INDEX.json', 'scripts/assets/packMaterialList.mjs')],
      },
      {
        title: 'Metric UVs and the material registry',
        items: [
          '`tests/unit/materials/uv.test.js` and `tests/unit/materials/registry.test.js` first.',
          '`src/util/uv.js`: `applyMetricUV(geometry, metersPerTile = 2)` rewrites the `uv` attribute so one texture tile covers `metersPerTile` metres: for each vertex pick the dominant axis of its normal (x, y or z) and use the other two position components divided by `metersPerTile` (u horizontal, v vertical with y up for walls). Works on indexed and non-indexed geometry, on `BoxGeometry`, `PlaneGeometry` and custom geometry that has a normal attribute; throws a clear error when `normal` is missing. Test: a 4 m by 3 m by 0.2 m box has a front-face u range of 2 and v range of 1.5 for `metersPerTile` 2.',
          '`src/engine/materials.js`: `MATERIAL_SPECS` (name -> `{ set, tint, roughness, metalness, metersPerTile, normalScale, envMapIntensity }`; `set` is the folder name under `assets/textures/` or `null` for a flat fallback) for all 22 names plus non-textured `glass` (physical, transmission off, opacity 0.25, roughness 0.05), `emissiveWarm`, `emissiveCool`; `getMaterial(name, { tint, heroSize } = {})` returns a shared `MeshStandardMaterial` per (name, tint, size) key; `registerMaterial(name, spec)`; `MATERIAL_NAMES`; `disposeUnused()`. Textures load lazily with `TextureLoader` from `assetUrl(\'textures/<set>/<size>/color.webp\')`, color map `SRGBColorSpace`, anisotropy 4 (8 on high), repeat wrapping; the size follows `TIER_SETTINGS[getTier()].textureSize` (or `heroTextureSize` for hero sets) and every live material swaps its maps when the tier changes, disposing the old textures.',
          'Headless rule: when `typeof document === \'undefined\'` no texture is requested and the material keeps its flat `color` (tinted). Tests: same name and tint return the same instance; different tint returns a different one; unknown name throws; spec table covers every name in `INDEX.json`; a material in Node has `map === null`.',
        ],
        verify: [vt('tests/unit/materials/uv.test.js', 'tests/unit/materials/registry.test.js'), exists('src/engine/materials.js', 'src/util/uv.js')],
      },
      {
        title: 'Materials fixture and Playwright check',
        items: [
          '`src/dev/fixtures/materials.js`: a grid of 1.2 m cubes, one per material name, 2 m apart in rows of 6, each on a pedestal, lit by the normal sun; each cube uses `applyMetricUV` with the spec scale. Register the fixture `materials` and set `listObjects()` (hook) to include `{ type: \'material-sample\', name }` for each.',
          '`tests/e2e/materials.spec.js`: open `?fixture=materials&quality=medium`; wait for ready and 3 s; `listObjects()` has one sample per `MATERIAL_NAMES` entry; at least 15 distinct texture ids are reported by `rendererInfo().textures` or at least 15 (`textures` count) are loaded; zero console errors; then `?quality=low` loads fewer or smaller textures (compare `rendererInfo().textures` not larger than medium).',
          'Visual self-review (best effort): if `npm run shots` exists use it, otherwise take one Playwright screenshot of the fixture into `docs/shots/013/`, open it with the Read tool, and note flat or obviously wrong surfaces.',
        ],
        verify: [pw('tests/e2e/materials.spec.js', 10), exists('src/dev/fixtures/materials.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/materials/sets.test.js', 'tests/unit/materials/uv.test.js', 'tests/unit/materials/registry.test.js'), pw('tests/e2e/materials.spec.js', 10), npm('check:size')],
    allowed: ['portfolio/scripts/**', 'portfolio/assets/**', 'portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/**'],
    freeze: ['portfolio/tests/unit/materials/sets.test.js', 'portfolio/tests/unit/materials/uv.test.js', 'portfolio/tests/unit/materials/registry.test.js', 'portfolio/tests/e2e/materials.spec.js'],
    human: 'Look at the materials fixture (`npm run dev`, open `?fixture=materials`): do the surfaces look like believable plaster, tile, wood, stone?',
    blocked: ['Fewer than 18 texture sets could be packed because Poly Haven was unreachable: BLOCKED.md.'],
  },

  // ---------------------------------------------------------------- 014
  {
    id: '014', name: 'budget-and-shots', title: 'Budgets file, budget checker and the screenshot tool', epic: 'E1', est: 45,
    arch: 'sections 7 (Performance budgets), 8 and 10.4, requirement R3 and decision D22',
    goal: [
      'Two measuring tools that every later epic uses: `npm run check:budget` reads draw calls and triangles from `renderer.info` at fixed camera spots for the desktop tier and the phone tier and fails above the limits in `src/budgets.json`; `npm run shots` saves screenshots from the same kind of fixed spots for the visual self-reviews (D22). The first measurement of the v1 world is recorded.',
    ],
    read: ['src/dev/worldHook.js', 'src/engine/camera.js', 'src/systems/controller.js', 'scripts/lib/paths.mjs', 'playwright.config.js'],
    steps: [
      {
        title: 'Camera override in the hook and the budgets file',
        items: [
          '`src/engine/camera.js`: `game.camRig.override` (null or `{ x, y, z, yaw, pitch }`); when set, `updateCamera` places the camera exactly there and skips the follow logic and camera collision. Hook: `setCamera(pose|null)` and `cameraState()` (`{ x, y, z, yaw, pitch, override }`).',
          '`src/budgets.json`: `{ "version": 1, "desktop": { "viewport": [960, 540], "tier": "high", "drawCalls": 600, "triangles": 3000000 }, "phone": { "viewport": [390, 844], "tier": "low", "drawCalls": 250, "triangles": 800000 }, "spots": [ { "id": "spawn", "x": 0, "z": 3, "y": 3.5, "yaw": 0, "pitch": -0.2 }, ... ] }` with four spots that exist in the v1 world (spawn, library, lighthouse, harbour side); later plans append spots, never remove one. A `tests/unit/budgets/budgets.test.js` checks: numbers finite and positive, spot ids unique, phone limits lower than desktop, every spot inside the world radius read from `src/config.js`.',
          '`tests/e2e/camera-override.spec.js`: `setCamera` pose is returned by `cameraState()`, the canvas still renders (`canvasLooksRendered`), `setCamera(null)` clears the override.',
        ],
        verify: [vt('tests/unit/budgets/budgets.test.js'), pw('tests/e2e/camera-override.spec.js', 10), exists('src/budgets.json')],
      },
      {
        title: 'check-budget',
        items: [
          '`scripts/check-budget.mjs`: starts the Vite dev server with `createServer` from `vite` on port 4174 (strict), launches Chrome with `chromium.launch({ channel: \'chrome\', args: same as playwright.config.js })`, and for each budget profile (`desktop` with `?quality=high`, `phone` with `?quality=low` at the phone viewport) and each spot: open the page, wait for `__world.ready`, `teleport(x, z)`, `setCamera(spot)`, wait for 3 animation frames, read `rendererInfo()`; print a table of `spot, tier, calls, triangles, limit`; exit 1 when any value exceeds its limit. Options `--spot id`, `--profile desktop|phone`, `--json file`. Export `evaluate(measurements, budgets)` (pure) and `loadBudgets()`.',
          '`tests/unit/budgets/evaluate.test.js`: under, equal (passes) and over (fails) for calls and for triangles; the message names the spot.',
          'Run it on the v1 world: `npm run check:budget` must pass. Write the measured numbers to `docs/perf/baseline-v1.json` and a two-line note to `docs/world-conventions.md`. If a v1 value is already over a limit, do not raise the limit: report it.',
        ],
        verify: [vt('tests/unit/budgets/evaluate.test.js'), { cmd: 'npm run check:budget', timeout_min: 10 }, exists('docs/perf/baseline-v1.json')],
      },
      {
        title: 'The shots tool',
        items: [
          '`src/shots.json`: `{ "spots": [ { "id": "spawn", "x": 0, "z": 3, "y": 3.5, "yaw": 0, "pitch": -0.2, "time": 0.4 }, ... ] }` (same four spots; optional `time`, `weather`, `quality`). Later plans append their spots.',
          '`scripts/shots.mjs [--spots id,id|all] [--plan <id>] [--time f] [--weather w] [--quality t] [--fixture name] [--only areas] [--out dir]`: same server and browser launch as `check-budget` (share the code in `scripts/lib/browser.mjs`); saves `docs/shots/<plan>/<spot>-<tier>.png` (default plan `adhoc`), 960x540, after teleport, camera override and 8 frames; prints each path. `docs/shots/` is git-ignored.',
          '`tests/unit/scripts/shots.test.js`: argument parsing and output path building (pure functions exported from the script). Live: `npm run shots -- --spots spawn --plan 014` writes a PNG larger than 20 KB.',
          'Document both tools in `docs/world-conventions.md` (how a session views a screenshot: open the PNG with the Read tool).',
        ],
        verify: [vt('tests/unit/scripts/shots.test.js'), { cmd: 'npm run shots -- --spots spawn --plan 014', timeout_min: 10 }, exists('docs/shots/014/spawn-high.png'), exists('scripts/lib/browser.mjs')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/budgets/budgets.test.js', 'tests/unit/budgets/evaluate.test.js', 'tests/unit/scripts/shots.test.js'), { cmd: 'npm run check:budget', timeout_min: 10 }, pw('tests/e2e/camera-override.spec.js', 10)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/docs/**'],
    freeze: ['portfolio/tests/unit/budgets/budgets.test.js', 'portfolio/tests/unit/budgets/evaluate.test.js', 'portfolio/tests/unit/scripts/shots.test.js', 'portfolio/tests/e2e/camera-override.spec.js'],
    human: 'Open `docs/shots/014/spawn-high.png` once to see what the tool produces.',
  },

  // ---------------------------------------------------------------- 015
  {
    id: '015', name: 'streaming-core', title: 'Streaming core: areas that load by priority and distance, retry on failure', epic: 'E1', est: 45,
    arch: 'sections 6 (Streaming), 7 (Resilience) and assumptions A13, A28',
    goal: [
      'The world will be loaded in areas (town centre and hotel first, other areas and interiors by distance, interiors hidden when the player is outside, no loading screen after the first load). This plan builds the generic `Streamer`, proves the order and the failure handling with fixture areas, and registers the v1 world as the first area. Real areas arrive in epics 2 to 4.',
    ],
    read: ['src/main.js', 'src/engine/loader.js', 'src/systems/gameloop.js', 'src/engine/quality.js', 'src/dev/worldHook.js', 'src/dev/fixtures/index.js', 'src/util/urlParams.js'],
    steps: [
      {
        title: 'Streamer (pure logic, unit tested)',
        items: [
          '`tests/unit/engine/streaming.test.js` first. `src/engine/streaming.js` exports `class Streamer`: `registerArea({ id, center: {x,z}, loadRadius, unloadRadius, priority = 0, interior = false, load(ctx) -> Promise<{ root?, dispose?() }>, minTier? })`; `update(playerPos, { dtMs })`; `has(id)`, `state(id)` (`idle|loading|loaded|failed`), `retry(id)`, `loadOrder` (array of ids in the order loads finished), `onStateChange(fn)`, `forceLoad(id)`, `setOnly(ids)` (only these ids may load; empty means all).',
          'Rules: an area becomes a load candidate when the player is within `loadRadius` or when `priority` is at least 100 (always-on areas such as the town centre); candidates load one at a time, highest priority first, then nearest; an area unloads (calls `dispose`, state back to `idle`) only when the player is beyond `unloadRadius` (which must be larger than `loadRadius`: registering otherwise throws); a failed load sets `failed`, records the error, is retried only by `retry(id)` and never blocks other areas; at most one load starts per `update`; interiors with `interior: true` are hidden (`root.visible = false`) unless the player is inside their `center` radius (`insideRadius`) — expose `isInside(id)`.',
          'Tests: priority 100 area loads first even when far; nearest-first among equals; unload hysteresis (no flapping at the boundary); failure then `retry` succeeds; a failing area does not stop a later area; `setOnly` filters; `loadOrder` records exact order; unloadRadius <= loadRadius throws; interior visibility toggles.',
        ],
        verify: [vt('tests/unit/engine/streaming.test.js'), exists('src/engine/streaming.js')],
      },
      {
        title: 'Integration: v1 world as an area, retry banner, ?only= and the hook',
        items: [
          'Create the single `Streamer` in `src/main.js` (`game.streamer`), call `update` each frame, honour `getParams().only` through `setOnly` (dev builds only; in production the parameter is ignored). Register the existing v1 terrain, buildings and props as one area `v1-world` with priority 100 that loads during the boot sequence exactly as before (no visible change); the loading screen still covers the first load.',
          '`src/ui/retryBanner.js`: `showRetry(areaId, onRetry)` shows `#retry-banner` (role `alert`, text "Part of the world did not load." and a "Retry" button, built with `el()`), `hideRetry()`. The streamer state-change handler shows it for a `failed` area and hides it on success.',
          'Hook: `streamState()` returns `{ areas: [{ id, state }], loadOrder }`; `retryArea(id)`.',
        ],
        verify: [has('src/main.js', 'Streamer'), exists('src/ui/retryBanner.js'), npm('lint')],
      },
      {
        title: 'Streaming fixture and Playwright order and failure tests',
        items: [
          '`src/dev/fixtures/streaming.js`: registers four areas with delayed loaders (`centre` priority 100 at the origin, `east` and `west` 120 m away with `loadRadius` 150, `far` 300 m away) whose `load` waits 150 ms and logs; `?fail=west` (fixture-only param read from the URL) makes `west` throw on its first load only.',
          '`tests/e2e/streaming.spec.js`: with `?fixture=streaming`, `streamState().loadOrder` starts with `centre`; `far` is not loaded until the player teleports within its radius; `west` shows `failed`, `#retry-banner` is visible, clicking Retry loads it and hides the banner; zero console errors apart from the one deliberate failure (the fixture logs it with `console.warn`, not `console.error`).',
          'Document the Streamer API and the `?only=` and `?fixture=` params in `docs/world-conventions.md`.',
        ],
        verify: [pw('tests/e2e/streaming.spec.js', 10), exists('src/dev/fixtures/streaming.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/engine/streaming.test.js'), pw('tests/e2e/streaming.spec.js', 10), pw('tests/e2e/smoke.spec.js', 15), pw('tests/e2e/v1-behaviour.spec.js', 15), npm('build', 15), node('scripts/check-prod-hook.mjs')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md', 'portfolio/index.html'],
    freeze: ['portfolio/tests/unit/engine/streaming.test.js', 'portfolio/tests/e2e/streaming.spec.js'],
  },
];
