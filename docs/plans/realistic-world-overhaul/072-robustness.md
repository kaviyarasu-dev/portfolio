# Plan 072: Robustness: context loss, failed chunk or area load, failed assets, global errors

Epic E7. Estimated turns: 60.

## Goal

The site must never end as a blank page. WebGL context loss shows a message and restores the world when the browser gives the context back (or offers a reload after 8 s); a failed optional chunk, area or model load shows the retry banner and recovers on retry; a failed texture or GLB falls back to flat materials and code-built props with one warning; an unexpected error shows a small notice instead of silence. Each case has a Playwright test or a unit test. This is one plan with three steps; it is not split, because the plan list has no id for a second block.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6, 7 (Resilience) in ARCHITECTURE.md, assumption A28 in _planning/requirements.md)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/boot/world.js (plan 069: the world boot moved out of main.js; the only place that imports the five lazy modules), src/main.js (plans 002/003/067/069: the boot split only), src/dev/worldHook.js (plan 003: frameCount, textureFallbackCount added)
- src/engine/renderer.js (plans 002/011/012: renderer, resize())
- src/engine/streaming.js (plan 015)
- src/ui/retryBanner.js (plan 015: showRetry, hideRetry)
- src/engine/loader.js (plan 030)
- src/engine/materials.js (plan 013: getMaterial)
- src/world/props/glbProps.js (plan 030: preloadProps)
- src/systems/audio/engine.js and src/systems/audio/ambience.js (plans 064/065)
- src/world/weather/index.js (plan 062)
- src/world/life/nature.js (plan 060, confirm the path there)
- src/world/npc/manager.js (plan 058, confirm the path there)
- src/ui/map.js (plan 068)
- scripts/check-prod-hook.mjs (plans 001/002)
- tests/e2e/smoke.spec.js (plan 001)
- index.html (plan 002)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Context loss and restore

Deliver:
- `src/engine/contextGuard.js` exports `createContextGuard({ canvas, renderer, onLost, onRestored, timers })`, returning `{ dispose() }`. `timers` is `{ setTimeout, clearTimeout }`, injected, defaulting to the globals. The module has no `window` or `document` use at import time (ARCH 10.5 headless rule); the canvas is passed in. On `webglcontextlost` it calls `preventDefault()`, calls `onLost`, shows `#context-lost` and starts an 8 s timer that shows `#context-reload` (a Reload button). On `webglcontextrestored` it runs the restore list in this order: `renderer.state.reset()`; set `needsUpdate = true` on every texture and every material (Three does not recreate them); `renderer.shadowMap.needsUpdate = true`; if a composer exists, call the resize function of plan 012 (`resize()` in `src/engine/renderer.js`) to re-create its targets, otherwise skip; then hide `#context-lost`, clear the reload timer and call `onRestored`.
- Markup in `index.html` (static, plan 002 owner): `<div id="context-lost" role="status" hidden>` with the exact text "Graphics were interrupted. Restoring..." and `<button id="context-reload" hidden>Reload</button>` inside it (shown after 8 s). The render loop (plan 003) pauses while lost: `game.paused` (plan 012 pause flag) is read by the loop, and `frameCount()` in `src/dev/worldHook.js` (addition only) returns the number of render-loop ticks since boot; it increments once per tick in the loop and stops while paused.
- Unit tests `tests/unit/engine/contextGuard.test.js` (fake canvas with event listeners, fake timers): lost then restored shows then hides the message; lost for 8 s shows the reload button; repeated loss works; `dispose()` removes both listeners and clears the timer.
- `tests/e2e/context-loss.spec.js` (URL `/?time=0.5&freeze=1`, WebGL2 required: the test asserts the context type is `webgl2` and fails clearly otherwise): (a) the canvas centre 9 by 9 pixel average before loss is recorded; (b) `WEBGL_lose_context` is obtained from the canvas context and `loseContext()` is called; `#context-lost` is visible (expect, 15 s) and `frameCount()` stops advancing (two polls with equal value); (c) `restoreContext()`: `#context-lost` is hidden (expect, 15 s), `frameCount()` advances again, and the centre pixel average is within 20 levels of the value from (a) and not blank (luminance above 10 of 255); (d) console errors are empty except messages starting with "WebGL: CONTEXT_LOST_WEBGL", which are allowed. If `WEBGL_lose_context` is missing in the software GL of the runner, the test FAILS with a clear message (it is never marked skipped, because a skip would pass trivially); if the runner cannot provide the extension, the step stops as not done and reports it. The unit test is not a substitute for this e2e. A real-GPU context loss is a human check (not run in CI).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/contextGuard.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/contextGuard.js`
- `npx playwright test tests/e2e/context-loss.spec.js`

### Step 2: Retry wrapper, lazy modules, asset fallbacks and the global handler

Deliver:
- `src/engine/chunks.js` exports `loadChunk(importFn, name, { retries = [500, 1500], onFail })`, returning `Promise<{ ok, module?, name }>`. Three tries in total: immediate, then after 500 ms, then after 1500 ms (backoff from `retries`, timers injected for tests). After the third failure it resolves `{ ok: false, name }`, calls `onFail(name)` and shows the retry banner. Retry banner (plan 015 `src/ui/retryBanner.js`): this plan calls the plan 015 `showRetry(areaId, onRetry)` and `hideRetry(areaId)` with exactly that signature (first argument is the row key, an area id for areas or a chunk name such as "ambience" for a lazy module; one row per key, several allowed). If plan 015 does not export them with that signature when this step starts, this plan adds them to `src/ui/retryBanner.js` with that same signature and records the addition as a cross-plan request to plan 015.
- Lazy modules: `src/boot/world.js` (plan 069; main.js only does the boot split) removes the static imports of the five optional modules and loads each with `loadChunk(() => import("<path>"), "<name>")`: weather `src/world/weather/index.js` (plan 062), nature `src/world/life/nature.js` (plan 060), NPC manager `src/world/npc/manager.js` (plan 058), map UI `src/ui/map.js` (plan 068), ambience `src/systems/audio/ambience.js` (plan 065). The attach functions live in `src/engine/chunks.js`: `attachWeather(game, module)`, `attachNature(game, module)`, `attachNpc(game, module)`, `attachMap(game, module)`, `attachAmbience(game, module)`; each attaches the module to `game` and does nothing when the module is undefined (it failed). The game starts without an optional module and attaches it later when the retry succeeds. Required modules (renderer, world areas) failing leave the retry banner and the already loaded world. Frozen tests that import a module statically keep their imports; only `src/boot/world.js` changes (and `src/main.js` only where plan 069 already changed it). Note: the optional modules are not in the required set, so the renderer (a static import) is not a banner case; its failure is handled by the plan 069 fallback path.
- Asset fallbacks: `getMaterial` (plan 013) returns a material with a flat placeholder texture at once and swaps in the map when the load succeeds; on failure it keeps the placeholder and sets `material.userData.textureFallback = true`; `textureFallbackCount()` in `src/dev/worldHook.js` counts flagged materials (the flag is not on `listObjects()` records). `preloadProps` (plan 030) falls back to the code-built prop of the same type on a failed GLB and logs one `console.warn` per asset name (a Set of names). Audio (plans 064/065): failures are silent beyond one `console.warn` in total. Area load failures are shown by the plan 015 banner.
- Global handler in `src/engine/errors.js` (no DOM at import; `install({ win, toast, console, timers })` injected): `error` and `unhandledrejection` listeners; an event is ignored when its script URL (or the rejection stack location) does not start with `location.origin` (extension filter); at most one `#error-toast` (`role="alert"`, text exact: "Something went wrong. The world keeps running; reload if it looks wrong.") and one `console.error` per 30 s window. Unit tests `tests/unit/engine/errors.test.js` (fake timers): rate limit (two errors in 30 s give one toast and one console.error; a third after 30 s gives a second), extension filter (an error from another origin is ignored), `chunks.test.js` (flaky import fails twice then succeeds: three calls total, success; permanent failure: three calls, backoff delays 500 and 1500 asserted, `onFail` called once with the name).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/chunks.test.js`
- `npx vitest run tests/unit/engine/errors.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/chunks.js src/engine/errors.js`

### Step 3: Playwright failure cases and the build split

Deliver:
- `tests/e2e/chunk-fail.spec.js` runs against the dev server (route blocking needs source URLs; URL `/?time=0.5&freeze=1`; waits are `expect` or `expect.poll` with timeouts up to 15 s): (a) `page.route("**/src/systems/audio/ambience.js", r => r.abort())`: the world still boots (the canvas centre sample is not blank), `#retry-banner` names "ambience" (expect), unroute, click the Retry button of that row: the banner row hides and `audioState().ambience` is present (poll; `audioState` is a field of the dev hook owned by plan 003 in `src/dev/worldHook.js`, not plan 010); (b) `page.route("**/textures/**/color.webp", r => r.abort())`: the world boots, flat materials are used (`textureFallbackCount()` is above 0), no blank canvas, exactly one `console.warn` for the textures; (c) `page.route("**/src/world/life/nature.js", r => r.abort())` (a lazy dynamic import, so the route abort reaches the `loadChunk` retry path; the renderer is a static import and is not used here): the world still boots, `#retry-banner` names "nature" (expect), and there is no page error (`pageerror` events are empty); (d) a thrown `Error` inside `setTimeout` (triggered with `page.evaluate`) shows `#error-toast` once, and the single expected `pageerror` is filtered and counted as exactly one; (e) console errors are empty except the allowed "WebGL: CONTEXT_LOST_WEBGL" text.
- Build (after `npm run build`): `dist/assets/` has a separate chunk for ambience (Vite splits dynamic imports by default; the check is by FILE NAME, not by a string in the bundle: `tests/unit/build/distChunks.test.js` lists `dist/assets/` and asserts that a file whose name matches `/^ambience[-.].*.js$/` exists; it FAILS when dist is missing, and it runs after `npm run build`, not in `npm test`), `node scripts/check-prod-hook.mjs` passes, and `npm run check:size` passes.
- Human check: a real-GPU context loss on a laptop (not run in CI).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/chunk-fail.spec.js`
- `npm run build`
- `npx vitest run tests/unit/build/distChunks.test.js`
- `node scripts/check-prod-hook.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run test`
- `npx vitest run tests/unit/engine/contextGuard.test.js tests/unit/engine/chunks.test.js tests/unit/engine/errors.test.js`
- `npx playwright test tests/e2e/context-loss.spec.js`
- `npx playwright test tests/e2e/chunk-fail.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`
- `npm run check:size`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
