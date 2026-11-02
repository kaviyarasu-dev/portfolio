# Plan 015: Streaming core: areas that load by priority and distance, retry on failure

Epic E1. Estimated turns: 55.

## Goal

The world will be loaded in areas (always-on areas first, other areas and interiors by distance, interiors hidden when the player is outside, no loading screen after the first load). This plan builds the generic `Streamer`, proves the order and the failure handling with fixture areas, and registers the v1 world as the first area, `v1-world`. Real areas arrive in epics 2 to 4. Transition note (write it into `docs/world-conventions.md`): ARCHITECTURE section 6 says "town centre and hotel first"; until the hotel and the town exist the always-on area is `v1-world`; later plans register their own always-on areas with `priority` 100 only when they must be present from the start.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 7 (Resilience), 10.5, 10.8 and assumptions A13, A28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/engine/loader.js
- src/systems/gameloop.js
- src/engine/quality.js
- src/dev/worldHook.js
- src/dev/fixtures/index.js
- src/util/urlParams.js
- src/util/dom.js
- src/world/terrain.js
- src/world/water.js
- src/world/buildings.js
- src/world/props.js
- `portfolio/index.html`

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Streamer (pure logic, unit tested)

Deliver:
- `tests/unit/engine/streaming.test.js` first. `src/engine/streaming.js` (headless: no `window`, `document` or WebGL at import) exports `class Streamer`, `resolveOnly(params, mode)` and `TIER_RANK`. Constructor `new Streamer({ game, scene, THREE, getTier } = {})`: every option is injectable and optional; `getTier` defaults to `getTier` from `src/engine/quality.js` (so tests pass `() => 'high'`); the context given to loaders is built fresh per load as `ctx = { game, scene, THREE, tier: getTier() }`.
- `registerArea({ id, center: { x, z }, loadRadius, unloadRadius, priority = 0, interior = false, insideRadius, minTier = 'low', essential = false, load })`. Validation (each throws an `Error` naming the id): `id` a non-empty string and unique; `center.x` and `center.z` finite; `load` a function; `minTier` one of `low|medium|high`. Areas with `priority >= 100` are ALWAYS-ON: `loadRadius` and `unloadRadius` are optional and ignored, they never unload by distance (this resolves the flapping a radius rule would cause). Areas with `priority < 100` need a finite `loadRadius > 0` and a finite `unloadRadius > loadRadius` (otherwise throw). `insideRadius` defaults to `loadRadius * 0.5` (or `Infinity` when there is no `loadRadius`, which means always inside). `essential: true` means `setOnly` never filters the area (the v1 world uses it). `load(ctx)` returns a Promise (or a plain value) of `{ root?, dispose?() }`.
- Methods. `update(playerPos)` with `playerPos = { x, z }` (no time argument: decisions use distance only; it stores the position as the last known one). In order, each call: (1) unload pass: a `loaded` area unloads when it is not always-on and not forced and the horizontal distance to its centre is greater than `unloadRadius`, or when the current tier is below its `minTier`; unloading removes `root` from `ctx.scene` (when a scene exists), calls `dispose()` inside try/catch (an exception is a `console.warn`), sets the state `idle` and emits; (2) interior visibility: for every `loaded` area with `interior: true`, `root.visible = isInside(id)`; (3) start AT MOST ONE load, and none when any load is in flight (one at a time): candidates are `idle` areas that pass the `setOnly` gate (or are `essential`), whose `minTier` is not above the current tier, and that are within `loadRadius` of the player or always-on or forced; order by `priority` descending, then distance ascending, then registration order; the chosen one becomes `loading`, `load(ctx)` runs inside try/catch (a synchronous throw counts as a failure), on success the state is `loaded`, `root` is added to `ctx.scene` (when given; for an interior `root.visible` is set from the last known position before it is added) and the id is appended to `loadOrder`; on failure the state is `failed`, the error is stored and `console.warn('[streaming] area "<id>" failed: <message>')` is logged (never `console.error`); both emit. A player who leaves while an area is loading changes nothing: the load finishes, and the area unloads at the next `update` if it is beyond `unloadRadius`.
- `forceLoad(id)` returns a Promise: it resolves when the area is `loaded` (immediately when it already is) and rejects with the load error on failure (the caller must handle the rejection). It marks the area forced: radius, `setOnly` and `minTier` are bypassed and a forced area never unloads by distance. It starts the load at once when no load is in flight, otherwise the area waits in a forced queue that is started as soon as the running load finishes (this is the only way a load starts outside `update`; forced loads still run one at a time). `setOnly(ids)` takes an array; an empty array or `null` means no filter; it gates only NEW loads, never unloads a loaded area and never filters an `essential` or forced area. `retry(id)`: when the state is `failed` it clears the error, sets `idle` and emits, returns `true` (the next `update` loads it when it is a candidate); otherwise returns `false`. `has(id)`, `state(id)` (`idle|loading|loaded|failed`, `null` for an unknown id), `error(id)` (the stored `Error` or `null`), `isInside(id)` (horizontal distance from the last known player position to the centre is at most `insideRadius`; `false` for an unknown id or before the first `update`), `loadOrder` (getter, a copy of the ids in the order loads FINISHED successfully; a reload after an unload appends again, failures are not listed), `areas()` (ids in registration order), `onStateChange(fn)` where `fn(id, state, error)` is called on every transition (`idle` to `loading`, `loading` to `loaded` or `failed`, `loaded` to `idle` on unload, `failed` to `idle` on retry) and it returns an unsubscribe function (a throwing listener is caught and logged with `console.warn`).
- `resolveOnly(params, mode)`: returns `null` when `mode === 'production'` (the `?only=` parameter is ignored in production), otherwise `params.only` (an array, see `parseParams` in `src/util/urlParams.js`) when it is a non-empty array, else `null`. `TIER_RANK = { low: 0, medium: 1, high: 2 }`.
- Unit tests (fake loaders with controllable promises, a fake scene with `add` and `remove`, `settle = () => new Promise(r => setTimeout(r, 0))`): an always-on area (priority 100) loads first even when far and never unloads however far the player goes; nearest first among equals; higher priority first; unload hysteresis (inside `loadRadius` loads, between the radii it stays loaded, beyond `unloadRadius` it unloads, no flapping when the player oscillates between the two radii); failure sets `failed`, `error(id)` holds the error, a warning is logged and no `console.error`; `retry` returns true and the next `update` loads it; `retry` on a loaded or unknown id returns false; a failing area does not stop a later area; a synchronous throw in `load` counts as failure; exactly one load starts per `update` and never while another is loading; `forceLoad` loads a far area, ignores `setOnly` and `minTier`, resolves when loaded, rejects on failure, waits behind a running load and the area then never unloads; `setOnly` gates new loads only (a loaded area stays loaded when it is excluded), an `essential` area ignores it, an empty array means all; `minTier`: an area with `minTier` `medium` is not loaded on `low` and a loaded one unloads when the tier drops; `onStateChange` receives the exact transition sequence and `unsubscribe` stops it; `loadOrder` records the exact order and a copy is returned; unloading calls `dispose` and removes the root from the scene; leaving while loading (load finishes, then unloads at the next update); `isInside` boundary (equal to `insideRadius` is inside); interior `root.visible` toggles when the player enters and leaves; registration errors (`unloadRadius <= loadRadius` throws for priority 0 but not for priority 100, duplicate id, bad centre, bad `minTier`); `state('nope')` is `null`; `resolveOnly` for development with `{ only: ['a', 'b'] }` gives the array, for `'production'` gives `null`, for an empty array gives `null`.
- Add the `fail` URL parameter now (ARCHITECTURE 10.8: every parameter is parsed in `src/util/urlParams.js`): `parseParams` also returns `fail`, a string matching `[a-z0-9-]+` or `null`. Do not edit the frozen `tests/unit/util/urlParams.test.js`; create `tests/unit/util/urlParamsFail.test.js` (`?fail=west` gives `west`, a missing value and `?fail=a%20b` give `null`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/streaming.test.js tests/unit/util/urlParamsFail.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/streaming.js`
- `node "{{runner}}/assert.mjs" has src/util/urlParams.js "fail"`

### Step 2: Integration: v1 world as an area, retry banner, ?only= and the hook

Deliver:
- Move the four v1 build steps `buildTerrain`, `buildWater`, `clearColliders` plus `placeBuildings`, and `scatterProps` (read `runPreload` in `src/main.js`; `buildSky` stays a separate boot step because the fixture boot of plan 012 also builds the sky) into a new module `src/world/v1World.js` that exports `loadV1World(ctx)`. It runs the four stages in that order, awaiting one animation frame between them, and before each stage calls the new export `setLoaderHint(hint)` of `src/engine/loader.js` (updates only the hint text, not the bar) with the same four hints as today ("Shaping island", "Pouring water", "Erecting landmarks", "Scattering props"), so the loading screen looks the same. The stages still add their objects to `game.scene` themselves; `loadV1World` returns `{ dispose() {} }` (the v1 world never unloads).
- `src/main.js`: right after `buildScene()` (same step) create the single `Streamer` as `game.streamer = new Streamer({ game, scene: game.scene, THREE, getTier })`, call `game.streamer.setOnly(resolveOnly(getParams(), import.meta.env.MODE))`, and, only when no fixture is active (`getParams().fixture` is null or the mode is production), call `game.streamer.registerArea({ id: 'v1-world', center: { x: 0, z: 0 }, priority: 100, essential: true, load: loadV1World })` (plan 012 says the v1 world is registered only when no fixture is active; with a fixture the streamer exists but has only the fixture's areas). The four removed preload steps become one step `{ hint: 'Shaping island', run: () => game.streamer.forceLoad('v1-world') }` that sits where the four were (the player does not exist yet, which is why boot forces the load instead of waiting for `update`; a rejection is caught, reported with `console.warn` and the fatal-error screen is shown through `showFatalError`, because the game cannot run without its world). `?only=` can therefore never prevent `v1-world` from loading (it is `essential`, forced and registered with priority 100), and in production it is ignored by `resolveOnly`. `src/systems/gameloop.js` calls `game.streamer.update(game.player.position)` once per frame, after the player exists (same place where plan 012 updates the light manager).
- `src/ui/retryBanner.js` (built with `el()` from `src/util/dom.js`, no `innerHTML`): `showRetry(areaId, onRetry)` adds the id to a set of failed ids and shows the banner, `hideRetry(areaId)` removes one id and hides the banner when none is left, `clearRetry()`. The banner is created once and mounted on `document.body` as `div#retry-banner` with `role="alert"`, a `span.retry-text` "Part of the world did not load." and a `button.retry-btn` (type `button`) "Retry"; clicking the button calls `onRetry(id)` for every failed id; visibility is the class `visible` on the banner (`#retry-banner { display: none }` and `#retry-banner.visible { display: flex }`). CSS goes into `index.html` next to the other HUD CSS: `position: fixed; left: 50%; bottom: 72px; transform: translateX(-50%); gap: 12px; padding: 10px 16px`, the same glass look as `#prompt`, and a `z-index` ten above the highest HUD z-index already in `index.html` (search for `z-index`; keep the `#loader` overlay above it). In `main.js` register `game.streamer.onStateChange((id, state) => { if (state === 'failed') showRetry(id, (i) => game.streamer.retry(i)); else hideRetry(id); })`.
- Hook (`src/dev/worldHook.js`): `streamState()` returns `{ areas: [{ id, state, error }], loadOrder }` (`error` is the message string or `null`, areas in registration order); `retryArea(id)` returns what `streamer.retry(id)` returns.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/main.js "new Streamer\("`
- `node "{{runner}}/assert.mjs" has src/main.js "forceLoad"`
- `node "{{runner}}/assert.mjs" has src/main.js "registerArea"`
- `node "{{runner}}/assert.mjs" has src/world/v1World.js "buildTerrain"`
- `node "{{runner}}/assert.mjs" has src/systems/gameloop.js "streamer.update"`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "streamState"`
- `node "{{runner}}/assert.mjs" exists src/ui/retryBanner.js src/world/v1World.js`
- `npm run lint`
- `npm run build`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`

### Step 3: Streaming fixture and Playwright order, unload and failure tests

Deliver:
- `src/dev/fixtures/streaming.js` (register it and add its import line to `src/dev/fixtures/index.js`; the fixture reaches the streamer through `ctx.game.streamer`): `build(ctx)` registers four areas and returns `{ root, spawn: { x: 0, y: 0, z: 0, yaw: 0 } }` where `root` holds a 60 m by 60 m flat floor at the origin. `centre`: centre (0, 0), `priority` 100, no radii. `east`: centre (120, 0), `loadRadius` 150, `unloadRadius` 190. `west`: centre (-120, 0), `loadRadius` 150, `unloadRadius` 190. `far`: centre (300, 0), `loadRadius` 100, `unloadRadius` 140. Each `load` waits 150 ms, logs `console.info('[fixture:streaming] loaded <id>')` and returns a `root` (a coloured 4 m box at the area centre) and a `dispose` that logs `console.info('[fixture:streaming] unloaded <id>')`. When `getParams().fail === 'west'`, the `west` loader throws `Error('deliberate failure')` on its FIRST call only (a module-level flag) after logging `console.warn('[fixture:streaming] west fails on purpose')`; the second call succeeds.
- `tests/e2e/streaming.spec.js` (every URL has `&freeze=1&time=0.4`; wait for `ready`; every wait is `expect.poll(..., { timeout: 15000 })`, never a fixed delay; each test records `console` messages of type `error` and `pageerror` and asserts there are none: the deliberate failure is reported with `console.warn` only, zero `console.error` is allowed anywhere). Test 1, `?fixture=streaming`: poll until `streamState().loadOrder` has 3 entries; `loadOrder[0]` is `centre`; `east` and `west` are both loaded; `far` is `idle`; then `teleport(250, 0)`: poll until `far` is `loaded` and `west` is `idle` (it was 370 m away, beyond `unloadRadius`) while `east` and `centre` stay `loaded`; `loadOrder` ends with `far`. Test 2, `?fixture=streaming&fail=west`: poll until `west` is `failed` and its `error` text contains `deliberate`; `centre` and `east` are still loaded (a failure does not block other areas); `#retry-banner` is visible and has `role` `alert`; click its Retry button; poll until `west` is `loaded` and the banner is not visible; `loadOrder` ends with `west`; a `console.warn` message that mentions `west` was seen. Test 3, `retryArea` hook: `?fixture=streaming&fail=west`, once `west` is `failed` run `retryArea('west')` (it returns `true`) and poll until `west` is `loaded`. Test 4, v1 world (default boot, no fixture): `/?only=nothing&time=0.4&freeze=1` reaches `ready`; `streamState().areas` is exactly `[{ id: 'v1-world', state: 'loaded', error: null }]` and `loadOrder` is `['v1-world']` (so `?only=` did not stop it); `canvasLooksRendered` (from `tests/e2e/helpers/pixels.js`).
- Document in `docs/world-conventions.md` (a section "Streamer"): the API above, always-on versus radius areas, `essential`, `forceLoad` at boot, `?only=` (dev only, `v1-world` ignores it) and `?fixture=`, `?fail=`, the retry banner, the transition note from the goal, and that plans register their areas with `game.streamer.registerArea`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/streaming.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/streaming.js`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/index.js "streaming"`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "Streamer"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/engine/streaming.test.js tests/unit/util/urlParamsFail.test.js`
- `npx playwright test tests/e2e/streaming.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
