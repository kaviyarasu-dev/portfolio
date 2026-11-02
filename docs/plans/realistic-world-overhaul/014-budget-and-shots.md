# Plan 014: Budgets file, budget checker and the screenshot tool

Epic E1. Estimated turns: 55.

## Goal

Two measuring tools that every later epic uses: `npm run check:budget` reads draw calls and triangles from `renderer.info` at fixed camera spots for the desktop tier and the phone tier and fails above the limits in `src/budgets.json`; `npm run shots` saves screenshots from the same kind of fixed spots for the visual self-reviews (D22). The first measurement of the v1 world is recorded in `docs/perf/baseline-v1.json`.

Conventions used by both tools (write them into `docs/world-conventions.md`): a spot is `{ id, x, y, z, yaw, pitch }` where `x, y, z` is the CAMERA position (`y` is an absolute height in metres, about ground + 2.5), `yaw` and `pitch` follow ARCHITECTURE 10.8 (yaw 0 looks toward -z, a positive yaw turns left toward -x, Euler order `YXZ`, pitch below 0 looks down); the player is teleported 6 m BEHIND the camera, at `x + 6 * sin(yaw)`, `z + 6 * cos(yaw)`, so the avatar is never in the frame and never under the camera; measurements and screenshots use the URL `?time=<t>&freeze=1&seed=1337` (default `t` 0.4) so they repeat.

Budget policy (consistent with ARCHITECTURE 10.4): the limits stay the A7 numbers (desktop 600 calls and 3,000,000 triangles, phone 250 and 800,000) and are never raised. `docs/perf/baseline-v1.json` records what the v1 world measures. If a v1 value is over a limit, `src/budgets.json` carries a per-profile, per-metric `baselineAllowance` (the measured v1 maximum plus 2 %, rounded up) so `check:budget` passes during epics 1 to 7 and prints the value as a WARNING; plan 076 (desktop budget pass) deletes every allowance and must get under the real limits.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Performance budgets), 8 and 10.4, 10.8 (angles), requirement R3 and decision D22)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/dev/worldHook.js
- src/engine/camera.js
- src/systems/controller.js
- src/config.js
- src/util/urlParams.js
- scripts/lib/paths.mjs
- playwright.config.js
- tests/e2e/helpers/pixels.js
- eslint.config.js
- package.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Camera override, the hook and the budgets file

Deliver:
- `tests/unit/engine/cameraOverride.test.js` first. New module `src/engine/cameraOverride.js` (no imports, headless) exports `applyCameraOverride(camera, pose)`: `camera.position.set(x, y, z)`, `camera.rotation.order = 'YXZ'`, `camera.rotation.set(pose.pitch, pose.yaw, 0)`, `camera.updateMatrixWorld(true)`. Test with a `PerspectiveCamera` from `three`: for yaw 0 pitch 0 the world forward vector `new Vector3(0, 0, -1).applyQuaternion(camera.quaternion)` is (0, 0, -1); for yaw 0.5 it is `(-sin 0.5, 0, -cos 0.5)`; for pitch -0.3 the forward y is `sin(-0.3)` (looks down); position is exact.
- `src/engine/camera.js`: `game.camRig.override` is `null` or `{ x, y, z, yaw, pitch }` (initialise it to `null` in `src/state.js` and `initCameraRig`). The FIRST thing `updateCamera` does is `if (rig.override) { applyCameraOverride(cam, rig.override); return; }`: no follow logic, no damping, no shake and no terrain or building collision while an override is set (plan 016 rewrites this function and must keep this first branch). Clearing it (`null`) returns to the normal rig, which eases back.
- Hook (`src/dev/worldHook.js`, replace the no-op of plan 003): `setCamera(pose|null)` throws `Error` unless `pose` is null or has five finite numbers, then sets `game.camRig.override` (a copy); `cameraState()` returns `{ x, y, z, yaw, pitch, override }` where `x, y, z` come from `game.camera.position`, `yaw` and `pitch` from `new THREE.Euler().setFromQuaternion(game.camera.quaternion, 'YXZ')` (`y` and `x` components) and `override` is `true` when an override is set, so the values prove what the camera really does and are not an echo of the argument.
- `src/budgets.json` (exact shape): `{ "version": 1, "desktop": { "viewport": [960, 540], "tier": "high", "drawCalls": 600, "triangles": 3000000 }, "phone": { "viewport": [390, 844], "tier": "low", "drawCalls": 250, "triangles": 800000 }, "baselineAllowance": { "desktop": { "drawCalls": null, "triangles": null }, "phone": { "drawCalls": null, "triangles": null } }, "spots": [ ... ] }`. Spots (v1 world coordinates, ground height there is about 2.9 m on the plateau, 0.8 m near the east shore; camera `y` = ground + 2.5): `{ "id": "spawn", "x": 0, "y": 5.5, "z": 12, "yaw": 0, "pitch": -0.2 }` (9 m south of the plaza, looking north at it); `{ "id": "library", "x": -50, "y": 5.4, "z": 0, "yaw": 0.56, "pitch": -0.15 }` (looks at the library zone at -60, -16 from 19 m); `{ "id": "lighthouse", "x": 52, "y": 5.3, "z": -50, "yaw": -0.66, "pitch": -0.08 }` (looks at the lighthouse zone at 66, -68 from 23 m); `{ "id": "harbour", "x": 130, "y": 3.3, "z": 40, "yaw": -1.57, "pitch": -0.1 }` (v1 has no harbour: this is the east shore about 136 m from the centre looking east at the water; later epics append the real harbour as a new spot, they never move or remove this one). A spot may also carry optional `time` (default 0.4) and `weather` (default none). Later plans append spots, never remove or change one.
- `src/shots.json` is created in this step too (so the consistency test can run): `{ "version": 1, "spots": [ { "id": "spawn", "x": 0, "y": 5.5, "z": 12, "yaw": 0, "pitch": -0.2, "time": 0.4 }, ... ] }` with the same four spots and identical poses as `src/budgets.json`, plus `"time": 0.4` on each; optional per-spot `time`, `weather`, `quality` are DEFAULTS that CLI flags override (step 3). Later plans append their spots to both files.
- `tests/unit/budgets/budgets.test.js`: every limit is finite and positive; spot ids unique and kebab-case; each spot has five finite numbers, `|yaw| <= PI`, `|pitch| <= 1.4`; the phone limits are lower than the desktop limits; every spot is inside the world radius (`Math.hypot(x, z) <= WORLD_RADIUS - 5`, `WORLD_RADIUS` imported from `src/config.js`); each `baselineAllowance` entry is `null` or a number greater than the matching limit; the four ids `spawn`, `library`, `lighthouse`, `harbour` exist; every budgets spot also exists in `src/shots.json` with identical `x, y, z, yaw, pitch` (shots may have extra spots; this test is the consistency check between the two files, read both with `fs`).
- `tests/e2e/camera-override.spec.js` (URL `/?time=0.4&freeze=1`, wait for `ready`, poll with `expect.poll`, no fixed waits): `setCamera({ x: 0, y: 40, z: 60, yaw: 0.8, pitch: 0.9 })` (a pose the normal rig can never produce: the pitch is above its limit and nothing is near it) and poll until `cameraState()` has x, y, z within 0.001 and yaw and pitch within 0.001 of it and `override` true; then `teleport(0, -50)` (moves the player 110 m away) and after 10 animation frames the camera is still at that pose (the follow logic is skipped); a second pose `y: -5` underground is honoured too (camera collision is skipped); the canvas still renders (`canvasLooksRendered` from `tests/e2e/helpers/pixels.js`); `setCamera(null)` then poll until `cameraState().override` is false and the camera is within 12 m of `playerState()` (the rig eased back); `setCamera({ x: NaN, y: 1, z: 1, yaw: 0, pitch: 0 })` rejects.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/cameraOverride.test.js tests/unit/budgets/budgets.test.js`
- `npx playwright test tests/e2e/camera-override.spec.js`
- `node "{{runner}}/assert.mjs" exists src/budgets.json src/shots.json src/engine/cameraOverride.js`

### Step 2: The shared browser helper and check-budget

Deliver:
- `scripts/lib/browser.mjs` (first line `/* global window, requestAnimationFrame */`: `eslint.config.js` is frozen and gives `scripts/**` only Node globals, so every browser-side callback inside `page.evaluate` in the scripts of this plan needs that comment) exports: `CHROME_ARGS` (copy the `launchOptions.args` of `playwright.config.js`; read the file, and use `--use-angle=swiftshader --use-gl=angle --enable-unsafe-swiftshader --ignore-gpu-blocklist` if it has none); `startServer({ port = 4174 })` = Vite `createServer({ server: { port, strictPort: true }, logLevel: 'error' })` + `listen()`, returns `{ baseUrl, close() }` where `baseUrl` is `server.resolvedUrls.local[0]` (it already contains `/portfolio/`); `launchBrowser()` = `chromium.launch({ channel: 'chrome', args: CHROME_ARGS })`; `newProfilePage(browser, profile)` (`desktop`: viewport 960x540, `deviceScaleFactor` 1; `phone`: viewport 390x844, `isMobile: true`, `hasTouch: true`, `deviceScaleFactor` 1) which also records console `error` and `pageerror` texts in `page.consoleErrors`; `openWorld(page, baseUrl, params)` builds `?` + `URLSearchParams(params)`, goes there and waits for `window.__world && window.__world.ready === true` with a 90 s timeout (throws a clear error on timeout); `waitFrames(page, n)` (n `requestAnimationFrame` ticks inside `page.evaluate`); `playerBehind(spot)` returns `{ x: spot.x + 6 * Math.sin(spot.yaw), z: spot.z + 6 * Math.cos(spot.yaw) }`; `poseToSpotCall(page, spot)` does `teleport(playerBehind.x, playerBehind.z)` then `setCamera(spot)` through `page.evaluate`. Never start the server on port 4173 (the Playwright config uses it).
- `scripts/check-budget.mjs` (the `package.json` script `check:budget` already points at it) exports `parseArgs(argv)` (`--spot id`, `--profile desktop|phone`, `--json file`; returns `{ spot, profile, json }`, throws on an unknown flag or a bad profile), `loadBudgets(path = src/budgets.json)` (reads and validates the shape of step 1, throws with a clear message), `evaluate(measurements, budgets)` (pure) and `main(argv)`; the CLI part runs only when `import.meta.url` equals the file URL of `process.argv[1]`. `measurements` is an array of `{ profile, spot, calls, triangles }`. `evaluate` returns `{ ok, failures, warnings }` where a failure is `{ profile, spot, metric, value, limit }` with `metric` one of `drawCalls` or `triangles`: a value fails when it is strictly greater than the effective limit; the effective limit is the plain limit, or the `baselineAllowance` for that profile and metric when it is not null and larger; a value over the plain limit but within the allowance is a WARNING (same fields plus `allowance`), not a failure. Equal to the limit passes. `formatFailure(f)` returns text such as `desktop/library drawCalls 612 > 600` (names the profile and the spot). `summarizeMax(measurements)` returns `{ desktop: { calls, triangles }, phone: { ... } }` (the maxima).
- `main`: start the server (port 4174), launch Chrome, then for each profile (`desktop` URL params `quality=high`, `phone` `quality=low`, both with `time=<spot time or 0.4>&freeze=1&seed=1337`) and each spot (all four, or `--spot`): `newProfilePage`, `openWorld`, `poseToSpotCall`, `waitFrames(page, 5)`, read `window.__world.rendererInfo()` (the whole last frame, plan 003) and keep `{ profile, spot: id, tier, calls, triangles }`. Print a table `profile spot tier calls limit triangles limit`, print warnings in a clearly marked WARNING block ("over the real limit, allowed by baselineAllowance until plan 076"), exit 1 when `failures` is not empty, always close the browser and the server (also on errors). `--json file` writes `{ "version": 1, "measurements": [...], "max": summarizeMax(...) }` BEFORE the exit code is decided, so a failing run still leaves its numbers.
- `tests/unit/budgets/evaluate.test.js`: under the limit passes; exactly at the limit passes; one over fails, for `drawCalls` and for `triangles` separately; the failure lists profile, spot, metric, value and limit and `formatFailure` names the spot; phone uses the phone limits; a value over the limit but under a non-null `baselineAllowance` gives a warning and `ok` true; over the allowance fails with the allowance as `limit`; `parseArgs` accepts and rejects (unknown flag, `--profile tablet`); `loadBudgets` throws on a missing `desktop` key; `summarizeMax` picks maxima per profile.
- Measure the v1 world for real: `node scripts/check-budget.mjs --json docs/perf/baseline-v1.json` (this writes the baseline even when a value is over a limit). Then: if no value is over a limit, leave every `baselineAllowance` `null`; if a metric of a profile is over its limit, set that `baselineAllowance` entry in `src/budgets.json` to `Math.ceil(measuredMax * 1.02)` (never touch the limits), and re-run `npm run check:budget`: it must now exit 0 (warnings are fine). Write a short "Budgets" section into `docs/world-conventions.md`: the policy paragraph above, the spot convention, the commands, and what v1 measured.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/budgets/evaluate.test.js`
- `npm run check:budget -- --json docs/perf/last-run.json`
- `node -e "const j=JSON.parse(require('fs').readFileSync('docs/perf/last-run.json','utf8'));const m=j.measurements;process.exit(j.version===1&&m.length===8&&m.every(r=>Number.isFinite(r.calls)&&r.calls>0&&Number.isFinite(r.triangles)&&r.triangles>0&&['desktop','phone'].includes(r.profile))?0:1)"`
- `node -e "const j=JSON.parse(require('fs').readFileSync('docs/perf/baseline-v1.json','utf8'));const m=j.measurements;process.exit(j.version===1&&m.length===8&&m.every(r=>Number.isFinite(r.calls)&&Number.isFinite(r.triangles))&&j.max.desktop.calls>0&&j.max.phone.triangles>0?0:1)"`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "baselineAllowance"`
- `node "{{runner}}/assert.mjs" exists docs/perf/baseline-v1.json scripts/lib/browser.mjs scripts/check-budget.mjs`

### Step 3: The shots tool

Deliver:
- The spots file `src/shots.json` already exists (step 1). `scripts/shots.mjs` reads it.
- `tests/unit/scripts/shots.test.js` first. `scripts/shots.mjs` exports the pure functions `parseArgs(argv)`, `buildOutPath({ out, plan, name, tier, repoRoot })` and `resolveShotPlan({ args, spots })`, plus `main(argv)`; the CLI part runs only when `import.meta.url` equals the file URL of `process.argv[1]`. Flags: `--spots id,id|all` (default `all`), `--plan <id>` (default `adhoc`; must match `/^[a-z0-9][a-z0-9-]{0,40}$/`), `--time f`, `--weather w`, `--quality low|medium|high` (default `high`), `--fixture name`, `--only a,b`, `--pose x,y,z,yaw,pitch` (five numbers) with `--name label` (default `pose`), `--out dir`. Rules: output file name is `<spot>-<tier>.png` where `tier` is the quality that was requested (so `spawn-high.png`); `--out` replaces the folder `docs/shots/<plan>` and must resolve inside the repo (anything else throws); precedence per value is CLI flag, then the spot field, then the default (time 0.4, weather none, quality high); with `--pose` exactly one shot named by `--name` is taken at that pose; with `--fixture` and neither `--spots` nor `--pose` exactly one shot named `<fixture>` is taken WITHOUT a camera override (the fixture spawn and the normal rig, which is the default pose of a fixture); an unknown spot id throws and lists the known ids.
- `main`: start the server with `startServer` (port 4174), launch Chrome, one desktop-profile page per shot (viewport 960x540): `openWorld` with `quality`, `time`, `freeze=1`, `seed=1337`, plus `weather`, `fixture`, `only` when given; for a spot or pose call `poseToSpotCall`; `waitFrames(page, 8)`; `page.screenshot({ path })` of the whole page (the HUD is included); create the folder; print the saved absolute path of each file; close everything on every exit path. Same `/* global window, requestAnimationFrame */` rule for any callback code.
- Tests in `shots.test.js`: `parseArgs` (defaults, every flag, bad plan name, `--pose` with four numbers rejected, unknown flag); `buildOutPath` for plan `014` gives `docs/shots/014/spawn-high.png`, `--out` override replaces the folder, an `--out` outside the repo throws, a name with `..` throws; `resolveShotPlan` (default is all spots; spot `time` is used unless `--time` is given; `--quality low` is requested for every shot and appears in the tier; `--fixture` alone gives one pose-less shot; unknown spot throws). Live: `npm run shots -- --spots spawn --plan 014` writes a PNG larger than 20 KB (checked by a command), and `npm run shots -- --spots library --quality low --plan 014` writes `library-low.png`.
- Document both tools in `docs/world-conventions.md`: the commands and flags, the spot and player-behind convention, the output folder (git-ignored `docs/shots/`, written by the tool so the session never writes it by hand), and how a session views a screenshot (open the PNG with the Read tool).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/shots.test.js`
- `npm run shots -- --spots spawn --plan 014`
- `npm run shots -- --spots library --quality low --plan 014`
- `node "{{runner}}/assert.mjs" exists docs/shots/014/spawn-high.png docs/shots/014/library-low.png scripts/shots.mjs`
- `node -e "process.exit(require('fs').statSync('docs/shots/014/spawn-high.png').size>20000?0:1)"`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "npm run shots"`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "x,y,z,yaw,pitch"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/engine/cameraOverride.test.js tests/unit/budgets/budgets.test.js tests/unit/budgets/evaluate.test.js tests/unit/scripts/shots.test.js`
- `npm run check:budget`
- `npx playwright test tests/e2e/camera-override.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

Human check (goes in the report, never blocks): Open `docs/shots/014/spawn-high.png` once to see what the tool produces: the plaza should be ahead of the camera, the avatar must not be in the frame.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
