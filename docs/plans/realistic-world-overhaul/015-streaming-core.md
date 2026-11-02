# Plan 015: Streaming core: areas that load by priority and distance, retry on failure

Epic E1. Estimated turns: 45.

## Goal

The world will be loaded in areas (town centre and hotel first, other areas and interiors by distance, interiors hidden when the player is outside, no loading screen after the first load). This plan builds the generic `Streamer`, proves the order and the failure handling with fixture areas, and registers the v1 world as the first area. Real areas arrive in epics 2 to 4.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 7 (Resilience) and assumptions A13, A28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/engine/loader.js
- src/systems/gameloop.js
- src/engine/quality.js
- src/dev/worldHook.js
- src/dev/fixtures/index.js
- src/util/urlParams.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Streamer (pure logic, unit tested)

Deliver:
- `tests/unit/engine/streaming.test.js` first. `src/engine/streaming.js` exports `class Streamer`: `registerArea({ id, center: {x,z}, loadRadius, unloadRadius, priority = 0, interior = false, load(ctx) -> Promise<{ root?, dispose?() }>, minTier? })`; `update(playerPos, { dtMs })`; `has(id)`, `state(id)` (`idle|loading|loaded|failed`), `retry(id)`, `loadOrder` (array of ids in the order loads finished), `onStateChange(fn)`, `forceLoad(id)`, `setOnly(ids)` (only these ids may load; empty means all).
- Rules: an area becomes a load candidate when the player is within `loadRadius` or when `priority` is at least 100 (always-on areas such as the town centre); candidates load one at a time, highest priority first, then nearest; an area unloads (calls `dispose`, state back to `idle`) only when the player is beyond `unloadRadius` (which must be larger than `loadRadius`: registering otherwise throws); a failed load sets `failed`, records the error, is retried only by `retry(id)` and never blocks other areas; at most one load starts per `update`; interiors with `interior: true` are hidden (`root.visible = false`) unless the player is inside their `center` radius (`insideRadius`) — expose `isInside(id)`.
- Tests: priority 100 area loads first even when far; nearest-first among equals; unload hysteresis (no flapping at the boundary); failure then `retry` succeeds; a failing area does not stop a later area; `setOnly` filters; `loadOrder` records exact order; unloadRadius <= loadRadius throws; interior visibility toggles.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/streaming.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/streaming.js`

### Step 2: Integration: v1 world as an area, retry banner, ?only= and the hook

Deliver:
- Create the single `Streamer` in `src/main.js` (`game.streamer`), call `update` each frame, honour `getParams().only` through `setOnly` (dev builds only; in production the parameter is ignored). Register the existing v1 terrain, buildings and props as one area `v1-world` with priority 100 that loads during the boot sequence exactly as before (no visible change); the loading screen still covers the first load.
- `src/ui/retryBanner.js`: `showRetry(areaId, onRetry)` shows `#retry-banner` (role `alert`, text "Part of the world did not load." and a "Retry" button, built with `el()`), `hideRetry()`. The streamer state-change handler shows it for a `failed` area and hides it on success.
- Hook: `streamState()` returns `{ areas: [{ id, state }], loadOrder }`; `retryArea(id)`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/main.js "Streamer"`
- `node "{{runner}}/assert.mjs" exists src/ui/retryBanner.js`
- `npm run lint`

### Step 3: Streaming fixture and Playwright order and failure tests

Deliver:
- `src/dev/fixtures/streaming.js`: registers four areas with delayed loaders (`centre` priority 100 at the origin, `east` and `west` 120 m away with `loadRadius` 150, `far` 300 m away) whose `load` waits 150 ms and logs; `?fail=west` (fixture-only param read from the URL) makes `west` throw on its first load only.
- `tests/e2e/streaming.spec.js`: with `?fixture=streaming`, `streamState().loadOrder` starts with `centre`; `far` is not loaded until the player teleports within its radius; `west` shows `failed`, `#retry-banner` is visible, clicking Retry loads it and hides the banner; zero console errors apart from the one deliberate failure (the fixture logs it with `console.warn`, not `console.error`).
- Document the Streamer API and the `?only=` and `?fixture=` params in `docs/world-conventions.md`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/streaming.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/streaming.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/engine/streaming.test.js`
- `npx playwright test tests/e2e/streaming.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
