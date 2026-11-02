# Plan 003: URL params, seeded RNG, the dev-only window.__world hook and v1 behaviour tests

Epic E1. Estimated turns: 45.

## Goal

Create the test seams every later plan uses: one URL-parameter parser, a seeded random generator used everywhere instead of `Math.random`, the dev-only `window.__world` hook, a production check that the hook is absent from the build, and Playwright tests that lock in the v1 behaviours that must survive (boot, WASD, `?time=`, `T`, `E` dialogue).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 7 and 10.5)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/state.js
- src/util/rng.js
- src/systems/clock.js
- src/systems/input.js
- src/systems/interaction.js
- src/ui/hud.js
- src/world/zones.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: URL parameter parser

Deliver:
- `tests/unit/util/urlParams.test.js` first. `src/util/urlParams.js` exports `parseParams(search)` returning `{ time, weather, seed, quality, only, fixture, debug, freeze }`: `time` a float clamped to 0..1 or `null` when missing or not a number; `weather` one of `clear|cloudy|mist|rain` else `null`; `seed` an integer, default 1337; `quality` one of `low|medium|high` else `null`; `only` an array of ids from a comma list (empty array when missing, ids trimmed, only `[a-z0-9-]` kept); `fixture` a string matching `[a-z0-9-]+` else `null`; `debug` boolean. Also exports `getParams()` that caches `parseParams(window.location.search)` and works when `window` is undefined (returns defaults).
- Edge cases to test and their defined results: `?time=abc` and `?time=` give null; `?time=-1` and `?time=2` clamp to 0 and 1 (v1 ignored out-of-range values; the clamp is the new rule); `?seed=12.7` floors to 12; a negative or non-numeric seed gives 1337; `?only=a,,b%20` gives `["a","b"]` (ids are trimmed, lower-cased, an id that contains a character outside `[a-z0-9-]` is dropped); `?weather=snow` null; duplicate keys: the first wins; empty string gives all defaults; `debug` and `freeze` are true for `?debug`/`?freeze`, `=1` and `=true`, false for `=0`, `=false` and absence.
- Replace the ad-hoc `URLSearchParams` use for `time` in `src/systems/clock.js` with `getParams().time`, and make `freeze` real: when `getParams().freeze` is true `updateClock` keeps `dayFraction` at the start value plus the `T` presses (the real-time part is not added). Add `tests/unit/systems/clockFreeze.test.js` for the pure helper you extract (`dayFractionAt({ nowMs, offsetMs, advance, frozen, startFraction })`): frozen ignores `nowMs`, unfrozen wraps at 1, `T` advance of 0.07 applies in both.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/util/urlParams.test.js`
- `node "{{runner}}/assert.mjs" has src/systems/clock.js "getParams"`

### Step 2: Seeded RNG everywhere

Deliver:
- `tests/unit/util/rng.test.js` first: same seed gives the same sequence; different seeds differ; values are in [0,1); `rngFor(name)` is stable per name and differs between names; and a scan test that fails when any file under `src/` (except `src/util/rng.js`) contains `Math.random`.
- `src/util/rng.js` keeps the existing `rand(seed)` export and adds `createRng(seed)` (mulberry32 returning a function) and `rngFor(name, seed = getParams().seed)` = `createRng(fnv1a(name) ^ seed)` (pass the seed explicitly in tests; do not depend on the cached params).
- Replace all 36 `Math.random` uses under `src/` with a generator from `rngFor('<module name>')` created once per module (not per call).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/util/rng.test.js`

### Step 3: Dev-only world hook and the production check

Deliver:
- `src/dev/worldHook.js` exports `installWorldHook({ game, clock, openDialogue })` (`game` is the shared state object, `clock` is `{ getTime, setTime }` that you add to `src/systems/clock.js` as exports, `openDialogue` from `src/ui/hud.js`) and defines `window.__world` with the fields listed in ARCHITECTURE.md 10.5 that can exist now: `ready`, `teleport(zoneIdOrX, z, y, yaw)` (a zone id puts the player 2 m south, +z, of the zone position; `y` is optional and defaults to the terrain height; `yaw` is optional and sets the player facing and the camera yaw; the velocity and the movement keys are reset), `playerState()` (`{x,y,z,yaw,moving,sprinting}`), `setTime(f)`, `time()`, `quality()` (returns `'high'` until plan 011), `listDoors()`, `listLights()`, `listObjects()`, `listNpcs()` (all return `[]` for now), `rendererInfo()` (reads `renderer.info.render.calls`, `.triangles`, `memory.textures`, `memory.geometries`; because the effect composer renders several passes per frame, set `renderer.info.autoReset = false` in `initRenderer` and call `renderer.info.reset()` once at the start of `renderFrame`, and keep a copy of the last complete frame so `rendererInfo()` returns the whole frame, not the last pass), `audioState()` (`{}`), `openDialogue(zoneId, key)` (the key is ignored until plan 017; the hook may skip the interaction radius close logic by setting `game.activeZone`), `cameraMode()` (`'third'`), `setWeather()` (no-op), `setCamera()` (no-op).
- In `src/main.js` install it only inside `if (import.meta.env.MODE !== 'production') { ... await import('./dev/worldHook.js') ... }` after the loop starts, and set `ready` true after the first frame. The production build must not contain the string `__world`.
- `scripts/check-prod-hook.mjs`: scans `dist/` (every file with the extension `.js .mjs .css .html .json .map .txt`) for `__world` and `worldHook`; exports `checkProdHook(distDir)` returning `{ ok, hits: [file...], missing }`; the CLI part only runs when the file is executed directly (compare `import.meta.url` with `process.argv[1]`) and exits 1 with the file list when found, 2 when `dist/` is missing, else 0. Write `tests/unit/scripts/prodHook.test.js` that runs the exported check function against a temp folder with and without the string.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/prodHook.test.js`
- `node "{{runner}}/assert.mjs" exists src/dev/worldHook.js scripts/check-prod-hook.mjs`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

### Step 4: Playwright: the hook and the v1 behaviours that must survive

Deliver:
- `tests/e2e/world-hook.spec.js`: wait for `window.__world.ready`; `teleport('library')` puts the player within 12 m of the library zone; `playerState()` has numeric fields; `rendererInfo().calls` is a number greater than 0; `openDialogue('plaza')` makes `#dialogue` get class `visible`.
- `tests/e2e/v1-behaviour.spec.js`: holding `w` for 800 ms moves the player at least 1 m (compare `playerState()` before and after); holding `Shift`+`w` moves farther than `w` alone over the same time; opening with `?time=0.75&freeze=1` gives `time()` within 0.001 of 0.75 and still within 0.001 after 3 s; pressing `t` changes `time()` by at least 0.07 within 1 s (read `time()` right before and after); `teleport("library")` then `e` makes `#dialogue` visible within 2 s (v1 opens the dialogue only on `E`), and teleporting 15 m away hides it within 1.5 s (v1 closes it by distance). Start every movement test with `teleport(0, 20, undefined, 0)` on open ground at the old plaza area facing +z, wait for `ready` first and read `time()` immediately after `ready`; hold keys with `page.keyboard.down` and poll `playerState()` until the distance moved is at least 1 m or 10 s pass (software WebGL is slow, so assert on distance reached, not on elapsed time); sprint must reach the same distance in less poll time than walking.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/world-hook.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/util/urlParams.test.js tests/unit/util/rng.test.js tests/unit/scripts/prodHook.test.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`
- `npx playwright test tests/e2e/world-hook.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
