# Plan 014: Budgets file, budget checker and the screenshot tool

Epic E1. Estimated turns: 45.

## Goal

Two measuring tools that every later epic uses: `npm run check:budget` reads draw calls and triangles from `renderer.info` at fixed camera spots for the desktop tier and the phone tier and fails above the limits in `src/budgets.json`; `npm run shots` saves screenshots from the same kind of fixed spots for the visual self-reviews (D22). The first measurement of the v1 world is recorded.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Performance budgets), 8 and 10.4, requirement R3 and decision D22)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/dev/worldHook.js
- src/engine/camera.js
- src/systems/controller.js
- scripts/lib/paths.mjs
- playwright.config.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Camera override in the hook and the budgets file

Deliver:
- `src/engine/camera.js`: `game.camRig.override` (null or `{ x, y, z, yaw, pitch }`); when set, `updateCamera` places the camera exactly there and skips the follow logic and camera collision. Hook: `setCamera(pose|null)` and `cameraState()` (`{ x, y, z, yaw, pitch, override }`).
- `src/budgets.json`: `{ "version": 1, "desktop": { "viewport": [960, 540], "tier": "high", "drawCalls": 600, "triangles": 3000000 }, "phone": { "viewport": [390, 844], "tier": "low", "drawCalls": 250, "triangles": 800000 }, "spots": [ { "id": "spawn", "x": 0, "z": 3, "y": 3.5, "yaw": 0, "pitch": -0.2 }, ... ] }` with four spots that exist in the v1 world (spawn, library, lighthouse, harbour side); later plans append spots, never remove one. A `tests/unit/budgets/budgets.test.js` checks: numbers finite and positive, spot ids unique, phone limits lower than desktop, every spot inside the world radius read from `src/config.js`.
- `tests/e2e/camera-override.spec.js`: `setCamera` pose is returned by `cameraState()`, the canvas still renders (`canvasLooksRendered`), `setCamera(null)` clears the override.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/budgets/budgets.test.js`
- `npx playwright test tests/e2e/camera-override.spec.js`
- `node "{{runner}}/assert.mjs" exists src/budgets.json`

### Step 2: check-budget

Deliver:
- `scripts/check-budget.mjs`: starts the Vite dev server with `createServer` from `vite` on port 4174 (strict), launches Chrome with `chromium.launch({ channel: 'chrome', args: same as playwright.config.js })`, and for each budget profile (`desktop` with `?quality=high`, `phone` with `?quality=low` at the phone viewport) and each spot: open the page, wait for `__world.ready`, `teleport(x, z)`, `setCamera(spot)`, wait for 3 animation frames, read `rendererInfo()`; print a table of `spot, tier, calls, triangles, limit`; exit 1 when any value exceeds its limit. Options `--spot id`, `--profile desktop|phone`, `--json file`. Export `evaluate(measurements, budgets)` (pure) and `loadBudgets()`.
- `tests/unit/budgets/evaluate.test.js`: under, equal (passes) and over (fails) for calls and for triangles; the message names the spot.
- Run it on the v1 world: `npm run check:budget` must pass. Write the measured numbers to `docs/perf/baseline-v1.json` and a two-line note to `docs/world-conventions.md`. If a v1 value is already over a limit, do not raise the limit: report it.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/budgets/evaluate.test.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/perf/baseline-v1.json`

### Step 3: The shots tool

Deliver:
- `src/shots.json`: `{ "spots": [ { "id": "spawn", "x": 0, "z": 3, "y": 3.5, "yaw": 0, "pitch": -0.2, "time": 0.4 }, ... ] }` (same four spots; optional `time`, `weather`, `quality`). Later plans append their spots.
- `scripts/shots.mjs [--spots id,id|all] [--plan <id>] [--time f] [--weather w] [--quality t] [--fixture name] [--only areas] [--out dir]`: same server and browser launch as `check-budget` (share the code in `scripts/lib/browser.mjs`); saves `docs/shots/<plan>/<spot>-<tier>.png` (default plan `adhoc`), 960x540, after teleport, camera override and 8 frames; prints each path. `docs/shots/` is git-ignored.
- `tests/unit/scripts/shots.test.js`: argument parsing and output path building (pure functions exported from the script). Live: `npm run shots -- --spots spawn --plan 014` writes a PNG larger than 20 KB.
- Document both tools in `docs/world-conventions.md` (how a session views a screenshot: open the PNG with the Read tool).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/shots.test.js`
- `npm run shots -- --spots spawn --plan 014`
- `node "{{runner}}/assert.mjs" exists docs/shots/014/spawn-high.png`
- `node "{{runner}}/assert.mjs" exists scripts/lib/browser.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/budgets/budgets.test.js tests/unit/budgets/evaluate.test.js tests/unit/scripts/shots.test.js`
- `npm run check:budget`
- `npx playwright test tests/e2e/camera-override.spec.js`

Human check (goes in the report, never blocks): Open `docs/shots/014/spawn-high.png` once to see what the tool produces.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
