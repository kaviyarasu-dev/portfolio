# Plan 031: Vertical slice integration: streamed hotel and square, spawn in the lobby, journey 1, review pack

Epic E2. Estimated turns: 60.

## Goal

Put the slice together as the visitor will experience it: the Grand Hotel and the square are streamed areas that are loaded before the player exists, the visitor spawns in the hotel lobby facing the reception, the intro dialogue opens only from the reception desk with E (A6), the v1 plaza building is gone (plan 029 already skips it) and the four v1 zones that overlap the square or the hotel (`milestones`, `notice`, `plaza`, `temple`) are moved, budgets hold, journey 1 passes end to end, and a review pack of 11 screenshots for the person is written. After this plan the runner pauses for approval of the look (D17).

Decisions fixed here. (1) Relocations: `notice` to (-40, 24), `milestones` to (40, 24), `temple` to (-40, 50) (all keep `mode: "radius"` and their radius); the `plaza` ZONE (v1 centre (0, 3), radius 4.5, which lies inside the square) moves into the lobby: world centre = the reception desk, which is the `reception-intro` interactable at hotel-local (-13.25, 7.3) transformed with the hotel placement (0, -14), so world (-13.25, -6.7), radius 3, `name` `Grand Hotel`, `mode` `object`, `prompt` `check in`. (2) Boot order, deterministic: the existing boot step of plan 015 `forceLoad('v1-world')` stays first because the v1 world owns the terrain (flat areas, exclusion rects, `buildTerrain()` and the height field must exist before anything stands on it and before the player exists); then two new boot steps `forceLoad('centre')` and `forceLoad('hotel')`; the player is created after all three, so `streamState().loadOrder` is exactly `['v1-world', 'centre', 'hotel']`. (3) Streamer contract of plan 015: `centre` and `hotel` are always-on (`priority` 100, no `loadRadius`, no `unloadRadius`, no `interior` flag), the `v1-world` area keeps priority 100, `essential` and `forceLoad` as plan 015 registers it (do not change it to 50). (4) The slice data is read ONLY through `loadSquare()` from `src/world/layout/square.js` (plans 032 and 033 may change the source, never the shape). (5) Spawn: the lobby point 5 m east of the desk, facing it (west): world `(-8.25, -6.7)`, yaw `+PI / 2` (yaw 0 looks toward -z, a positive yaw turns left, so +PI / 2 looks toward -x), y on the lobby floor. (6) Spot ids are NEW and appended, never changed: `slice-hotel-front`, `slice-hotel-corner`, `slice-lobby`, `slice-restaurant`, `slice-kitchen`, `slice-corridor`, `slice-guest-1`, `slice-bath-1`, `slice-rooftop` (new), plus the existing world spots `square-day` and `square-night` of plan 029 = the 11 shots; budgets get four of them: `slice-lobby`, `slice-restaurant`, `slice-guest-1`, `slice-rooftop` (`square` already exists from plan 029).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 10.4, 10.7, 10.8 (Budget and shot spots, Streaming, Town square) and requirement R7, decision D17, A6)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/world/zones.js
- src/engine/streaming.js
- src/world/layout/slice.json
- src/world/layout/square.js
- src/world/buildings/plaza/manifest.json
- src/world/buildings/plaza/build.js
- src/world/buildings/registry.js
- src/world/kit/building.js
- src/dev/fixtures/building-plaza.js
- src/dev/worldHook.js
- src/systems/interaction/registry.js
- src/systems/collision/world.js
- src/world/buildings.js
- src/world/terrain.js
- src/ui/minimap.js
- src/ui/map.js
- src/budgets.json
- src/shots.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Streamed areas, boot order, spawn and zone relocation

Deliver:
- `tests/unit/world/sliceAreas.test.js` first (headless, real `Streamer` from `src/engine/streaming.js` with a fake scene, fake builders injected through `createPlazaAreas(game, deps = {})`; hotel and square data come from the real `loadSquare()` and the real plaza manifest, never from literals except where stated). It pins: (a) `createPlazaAreas(game)` returns exactly two definitions in this order, ids `centre` then `hotel`, both `priority` 100, both with a finite `center` (`centre` = the square rectangle centre, `hotel` = the hotel placement `x, z`), `insideRadius` equal to half the diagonal of the square rectangle (respectively of the hotel footprint) plus 3, and NO `loadRadius`, `unloadRadius` or `interior` key; registering both with a real Streamer after a `v1-world` fake (priority 100, essential) does not throw and `forceLoad` of the three in boot order gives `loadOrder` exactly `['v1-world', 'centre', 'hotel']`; (b) `computeSpawn(manifest, placement, collision)` (pure, exported from `plazaArea.js`) returns the desk position transformed to world plus 5 m along +x (within 0.05 of `(-8.25, -6.7)` for the real data), `yaw` within 0.01 of `Math.PI / 2`, `y` equal to the lobby floor y (`placement.y + floors[0].y`), the point lies inside the lobby room bounds and inside the hotel footprint, the distance to the desk is 5 m; with a manifest that has no `reception-intro` interactable it returns the hard-coded fallback constants `SPAWN_FALLBACK` (the same numbers); with a fake collision world that blocks the first candidate it returns the next free candidate; with the hotel area in state `failed` the spawn helper `pickSpawn(game)` returns the outside fallback in front of the portico (the main door x, z 2 m in front, yaw 0); (c) overlap rule: `v1ZonesOverlappingSquare(zones, loadSquare())` called with the real `ZONE_LAYOUT` zones in the shape plan 029 uses returns exactly `['plaza']` (the hotel own zone, exempt: its circle centre must lie inside the hotel footprint and its circle must not intersect the square rectangle), and a literal 14 zone copy with the OLD positions still returns `milestones`, `notice`, `plaza`, `temple` (guards the helper); (d) the relocated zones equal `notice` (-40, 24), `milestones` (40, 24), `temple` (-40, 50), keep `mode` `radius`, the `plaza` zone is `mode` `object` at the desk world position within 0.05 (computed from the manifest and the placement, so the test fails if plan 026 moves the desk), and the straight line distance from the spawn to every zone is at most `MAX_PATH_METRES` (only a lower bound of the R9 walk limit; the real path check belongs to the layout plans of epic 3); (e) failure and retry: with a `hotel` loader that throws, boot `forceLoad('hotel')` rejects, `streamer.state('hotel')` is `failed`, `onStateChange` saw `failed`, `streamer.retry('hotel')` returns true and the next `update` (or `forceLoad`) with a working loader makes it `loaded`; (f) dispose of `centre` removes every collider id it added and every `game.areaObjects` entry it pushed (use fake `game.collision` and `game.areaObjects`).
- `src/world/areas/plazaArea.js` exports `createPlazaAreas(game, deps = {})` (deps override `buildSquare`, `buildBuilding`, `preloadBuildingProps`, `getDecorator` for tests), `computeSpawn`, `pickSpawn`, `SPAWN_FALLBACK`. `centre` `load(ctx)` does what plan 029 put into `main.js` AFTER `buildTerrain()`: `buildSquare(slice, ctx)` with the real `game.lightManager`, `getMaterial`, `buildProp` and the current tier, the colliders (`addCircle`, `addBox`, `addFloor`), `game.areaObjects` pushes, and the per-frame `square.update` registration; it returns `{ root, dispose }`. `hotel` `load(ctx)` does exactly what `src/dev/fixtures/building-plaza.js` (plan 024) does for the same manifest but with the hotel placement from `loadSquare()` (read the fixture and copy its wiring of colliders, doors, interactables, lights and `game.areaObjects`; `await preloadBuildingProps(manifest, ctx)` first, plan 030) and `getDecorator('plaza')`; it returns `{ root, dispose }`. Do NOT use the area `interior: true` flag: it toggles the visibility of the whole area root and would hide the exterior; interior hiding and the low tier `interiorsOnEntry` rule are already done inside `buildBuilding` by plan 024 (read `src/world/kit/building.js`; if that is not so, add the hiding there, never in the Streamer). The terrain part stays in the `v1-world` loader in `main.js`: `slice.exclusionRects.forEach(addExclusionRect)`, `setExtraFlatAreas(...)` (plan 028) BEFORE `buildTerrain()`, `scatterProps()`; remove `buildSquare` and the square colliders from that loader because `centre` owns them now.
- `src/main.js`: after the `v1-world` registration of plan 015, `createPlazaAreas(game).forEach((a) => game.streamer.registerArea(a))` (plan 040 later wraps this call into `createAllAreas`; keep it a single call). Right after the existing `Shaping island` boot step add two steps in this order: `{ hint: 'Building the square', run: () => game.streamer.forceLoad('centre') }` and `{ hint: 'Opening the hotel', run: () => game.streamer.forceLoad('hotel') }`. A rejection of `centre` or `hotel` is caught and reported with `console.warn` only (the retry banner of plan 015 appears through its `onStateChange`, do not add another banner) and boot continues; the player is created only after the three steps and starts at `pickSpawn(game)` (the lobby spawn; the outside fallback when the hotel is not loaded). The loader hides when the boot steps are done; the loader needs no other change.
- Zones in `src/world/zones.js` (check first with a grep for every OLD x and z of the four zones across `src/`, including `src/ui/minimap.js`, `src/ui/map.js`, the tour and `src/dev/worldHook.js`, and fix hard-coded hits so everything reads `ZONE_LAYOUT`): `notice` to (-40, 24), `milestones` to (40, 24), `temple` to (-40, 50) (radius and `mode: "radius"` unchanged), and `plaza` to world (-13.25, -6.7) radius 3, `name: "Grand Hotel"`, `mode: "object"`, `prompt: "check in"`. Read `src/world/buildings.js`: each moved v1 building and its collider must follow its zone (if a position is hard-coded there, change it to read the zone), and the building must not overlap another v1 building, tree or prop at the new place: add an exclusion rect (`addExclusionRect`, plan 029) of the zone radius plus 6 m around each of the three moved zones in the `v1-world` loader before `scatterProps()`. Terrain check at each moved zone with `game.heightField` (hook `terrainHeight(x, z)`): the height must be at least `WATER_LEVEL + 0.5` and `slopeAt` below 0.35; if one fails, append a circle flat area `{ x, z, r: zoneRadius + 3, y: <current height> }` to the list given to `setExtraFlatAreas` in `main.js` instead of moving the zone. `teleport('plaza')` goes to the spawn (`game.spawn` set by `main.js` after boot; the hook reads it), the other zone ids teleport next to their NEW positions as before.
- Plaza building and dialogue: plan 029 already stopped building the v1 `plaza` building (`SKIPPED_V1 = new Set(['plaza'])` in `src/world/buildings.js`), so nothing is to be removed from the loop. Grep `tests/` and `scripts/` for `SKIPPED_V1`: if nothing imports it, delete the constant and the dead v1 plaza factory call and collider code (only dead code); if something imports it, keep it. There is NO v1 auto-open of the plaza dialogue to skip (v1 opens a dialogue only on `E`, ARCHITECTURE 10.7, plan 017): instead the e2e below asserts that no dialogue opens without `E`. The `T` key and the `?time` and `?freeze` features stay untouched.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/sliceAreas.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/areas/plazaArea.js`
- `node "{{runner}}/assert.mjs" has src/main.js "createPlazaAreas"`
- `node "{{runner}}/assert.mjs" has src/world/zones.js "Grand Hotel"`
- `npm run lint`

### Step 2: Journey 1, regression and the streaming order

Deliver:
- `tests/e2e/journey-1-arrive.spec.js` (journey 1 of the spec; URL `/?time=0.5&freeze=1`; every wait is `expect.poll(..., { timeout: 15000 })` or a locator assertion with a timeout, never a fixed delay; record `console` errors and `pageerror` and assert none): the loader shows progress then hides; `streamState().areas` lists `v1-world`, `centre`, `hotel` all `loaded` and `loadOrder` equals `['v1-world', 'centre', 'hotel']`; `playerState()` is inside the hotel footprint (read the footprint and placement with `loadSquare()` imported in the test, field names from `slice.json`) and within 0.3 m of the spawn `(-8.25, -6.7)`; with no key pressed `#dialogue` stays hidden (assert it after `ready`, and again after the player has been moved by `teleport` to a point 2 m from the desk, still without `E`: the old v1 radius auto-open must not exist); hold `w` until the distance between `playerState()` and the `reception-intro` entry of `listInteractables()` is at most 1.8 m (poll; if the desk collider keeps the player further away, read the reach in `src/systems/interaction/registry.js` and use that value, and write the number in a comment); press `e`: `#dialogue` is visible and contains the name from `src/content/contact.js` (check the real export name first); press `Escape`: `#dialogue` is hidden; press `e` once more, then walk away (hold `s`) and expect the dialogue to close (it closes about 350 ms of GAME time after leaving, so poll with a 15 s timeout, never a fixed wait).
- `tests/e2e/slice-regression.spec.js` (URL `/?time=0.5&freeze=1`, same rules): for the 13 v1 zones other than `plaza` (ids from `ZONE_LAYOUT`; `notice` is handled separately below): `teleport(id)`, press `e`, `#dialogue` is visible, `teleport` away and poll until it is hidden (game-time delay); the `notice` zone downloads the PDF instead (assert the download event and the RESUME DOWNLOADED toast); the three relocated zones `notice`, `milestones`, `temple` are reached with `teleport(id)` at their NEW positions (`playerState()` within 8 m of (-40, 24), (40, 24), (-40, 50)); standing at the OLD plaza centre (0, 3) in the square pressing `e` opens nothing; standing 1.5 m in front of the main hotel door outside (world `(-6, -2.5)`, yaw 0) pressing `e` opens the door (poll `listDoors()` for `plaza:main` `open`) and `#dialogue` stays hidden; `collisionStats()` shows boxes (hotel) and circles (v1 buildings).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`

### Step 3: Budgets, shots and the review pack

Deliver:
- `tests/unit/budgets/sliceSpots.test.js` first (a new file; the plan 014 test is not edited): `src/budgets.json` and `src/shots.json` both contain the four budget ids `slice-lobby`, `slice-restaurant`, `slice-guest-1`, `slice-rooftop` with identical `x, y, z, yaw, pitch`; `src/shots.json` contains all 11 ids of the review pack (`slice-hotel-front`, `slice-hotel-corner`, `slice-lobby`, `slice-restaurant`, `slice-kitchen`, `slice-corridor`, `slice-guest-1`, `slice-bath-1`, `slice-rooftop`, `square-day`, `square-night`); no earlier spot id was changed or removed (compare with the ids and poses of plans 014, 024, 026, 027 and 029 written as literals inside the test); every spot is finite, `|yaw| <= PI`, `|pitch| <= 1.4`, inside `WORLD_RADIUS - 5`; for each interior spot the parked player point (camera `x + 6 sin(yaw)`, `z + 6 cos(yaw)`) lies inside the hotel footprint from `loadSquare()`.
- Append these spots (camera positions in WORLD coordinates, the hotel at `(0, -14)` with rotation 0, so a hotel-local point `(x, z)` is world `(x, z - 14)`; they are the fixture spots of plans 024, 026 and 027 moved to the world). `src/budgets.json` and `src/shots.json` (same pose, shots also carry `time`): `{ "id": "slice-lobby", "x": -6.0, "y": 1.7, "z": -6.8, "yaw": 1.5708, "pitch": -0.1, "time": 0.5 }` (looks west at the reception desk), `{ "id": "slice-restaurant", "x": 3.0, "y": 1.7, "z": -9.0, "yaw": -1.5708, "pitch": -0.1, "time": 0.5 }`, `{ "id": "slice-guest-1", "x": -4.2, "y": 5.6, "z": -10.4, "yaw": 1.903, "pitch": -0.12, "time": 0.5 }`, `{ "id": "slice-rooftop", "x": -4.0, "y": 9.6, "z": -9.0, "yaw": -1.6, "pitch": -0.1, "time": 0.5 }`. `src/shots.json` only: `{ "id": "slice-hotel-front", "x": 0.0, "y": 3.5, "z": 20.0, "yaw": 0, "pitch": -0.1, "time": 0.5 }` (from the platform looking at the facade; if the banyan or the clock tower blocks it, move the camera sideways, record the new pose in the file and in the review doc), `{ "id": "slice-hotel-corner", "x": -22.0, "y": 3.0, "z": 6.0, "yaw": -0.675, "pitch": -0.1, "time": 0.5 }`, `{ "id": "slice-kitchen", "x": 8.0, "y": 1.8, "z": -15.5, "yaw": 0, "pitch": -0.1, "time": 0.5 }`, `{ "id": "slice-corridor", "x": -6.0, "y": 5.6, "z": -12.5, "yaw": -1.5708, "pitch": -0.05, "time": 0.5 }`, `{ "id": "slice-bath-1", "x": -1.5, "y": 5.6, "z": -10.5, "yaw": 3.1416, "pitch": -0.15, "time": 0.5 }`. Never change an existing spot.
- Run `npm run check:budget` (desktop and phone profiles must pass; `check:budget` passed before this plan, so the four new spots are the only new risk). If a spot is over its limit, reduce draw calls by merging static meshes per material, using `InstancedMesh` for repeated props (chairs, lamps, leaves) and hiding the interior when outside; do NOT raise a limit and do NOT touch `baselineAllowance`.
- Run `npm run shots -- --plan 031 --spots slice-hotel-front,slice-hotel-corner,square-day,square-night,slice-lobby,slice-restaurant,slice-kitchen,slice-corridor,slice-guest-1,slice-bath-1,slice-rooftop` (the PNG names are `<spot>-high.png` under `docs/shots/031/`). Open every PNG with the Read tool and fix visible defects: floating objects, objects inside walls, flat or missing textures, black rooms, z-fighting. Best effort, never fails; list what you fixed.
- `tests/unit/docs/sliceReview.test.js` first, then `docs/review/slice-review.md`. The test reads the doc and checks: it contains all 11 paths `docs/shots/031/<id>-high.png`, the controls `E`, `V`, `T`, `O` each explained, a heading `Not done yet` (the other 13 buildings are still v1, the terrain is v1 size, no NPCs, weather or new audio), a heading `Known weaknesses` with at least 3 bullets, a heading `Budget numbers` with the desktop and phone draw calls and triangles per spot as printed by `check:budget` (at least 8 numbers), the line `npm run dev` and the URL, and a line with the straight line distance from the lobby spawn to the farthest v1 zone and the 460 m limit (R9). The doc is for the person: what to open, the shot paths, the controls, what is not done, the weaknesses you saw, the budget numbers.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/budgets/sliceSpots.test.js tests/unit/docs/sliceReview.test.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" has src/budgets.json "slice-lobby"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "slice-rooftop"`
- `node "{{runner}}/assert.mjs" has src/shots.json "slice-hotel-front"`
- `node "{{runner}}/assert.mjs" has src/shots.json "slice-bath-1"`
- `node "{{runner}}/assert.mjs" exists docs/review/slice-review.md docs/shots/031/slice-hotel-front-high.png docs/shots/031/slice-hotel-corner-high.png docs/shots/031/square-day-high.png docs/shots/031/square-night-high.png docs/shots/031/slice-lobby-high.png docs/shots/031/slice-restaurant-high.png docs/shots/031/slice-kitchen-high.png docs/shots/031/slice-corridor-high.png docs/shots/031/slice-guest-1-high.png docs/shots/031/slice-bath-1-high.png docs/shots/031/slice-rooftop-high.png`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/world/sliceAreas.test.js tests/unit/budgets/sliceSpots.test.js tests/unit/docs/sliceReview.test.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only plaza`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): MILESTONE: the runner pauses after this plan. Open `docs/review/slice-review.md` and the screenshots, walk the hotel and square with `npm run dev`, and approve the look (or tell the planner what to change) before epic 3 starts (D17). Run `/plan-replan realistic-world-overhaul` for changes.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
