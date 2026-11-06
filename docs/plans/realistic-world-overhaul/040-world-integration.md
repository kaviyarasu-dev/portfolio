# Plan 040: World integration: areas, minimap, fog, tour of every area, budgets, review pack

Epic E3. Estimated turns: 60.

## Goal

Close epic 3: all areas stream in the right order for the bigger world through ONE area table (`createAllAreas`, which replaces the per-plan registrations of plans 031, 037, 038 and 039 and the direct v1-world registration in `main.js`), the minimap shows the real island (roads, water, labels), fog suits the tier view distance, every area passes the budget, a tour test teleports to eleven spots and checks the player stands on the ground and nothing errors, an auto-walk helper exists for the later journey tests, and a review pack for the person is written. (The walk time to the farthest landmark is already tested in plan 032; fast travel belongs to plan 068, not here.)

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 10.4, 10.5, 10.8 (streaming, spots) and requirement R9, decision D14, A13)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/engine/streaming.js
- src/engine/quality.js
- src/world/areas/index.js
- src/world/areas/plazaArea.js
- src/world/areas/townAreas.js
- src/world/areas/harbourAreas.js
- src/world/areas/localAreas.js
- src/ui/minimap.js
- src/world/sky.js
- src/systems/clock.js
- src/systems/input.js
- src/systems/controller.js
- src/dev/worldHook.js
- src/world/layout/town.js
- src/world/layout/walk.js
- src/world/layout/town.json
- src/world/town/harbour.js
- src/world/terrain/townHeight.js
- src/world/zones.js
- src/budgets.json
- src/shots.json
- scripts/lib/browser.mjs
- scripts/check-budget.mjs
- scripts/shots.mjs
- tests/e2e/journey-1-arrive.spec.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: One area table, radii and the main.js wiring

Deliver:
- `tests/unit/world/areas.test.js` first. `src/world/areas/index.js` exports `createAllAreas(game, town, { fixture } = {})` returning the final table, and `registerLandmarkArea(factory)` with `clearLandmarkAreas()` (tests only). `createAllAreas` wraps (calls and concatenates, never copies) what the earlier plans export: `createPlazaAreas(game)` (plan 031: `centre`, `hotel`), `createTownAreas(game, town)` (plan 037, `townAreas.js`: one `town-<block>` area per 80 m block; read the file first and adapt this ONE call if plan 037 exported a different name or registers itself), `createHarbourAreas(game, town)` (plan 038: `harbour`, `beach`), `createLocalAreas(game, town)` (plan 039: `west-gate`, `street-life-centre`, `street-life-harbour`), the `v1-world` area (moved here from the direct call in `main.js`, same `load: loadV1World`), and then one definition for each factory added with `registerLandmarkArea(factory)` (a factory is `(game, town) => areaDef`; plans 043 to 056 each add ONE `registerLandmarkArea(...)` line in `areas/index.js` for their landmark instead of editing the table). With a fixture active (`fixture` not null) it returns `[]` (the streamer then holds only the fixture areas, plan 015). Final table and radii: `centre` priority 100; `hotel` 100 (radii 140 and 180 as plan 031, ignored); `town-<block>` 80 for blocks within 100 m of the square else 40, `loadRadius` 160, `unloadRadius` 220; `harbour` 60, 170 and 230; `beach` 40, 160 and 220; `west-gate` 50, 150 and 200; `street-life-centre` and `street-life-harbour` 50, 130 and 180; `v1-world` 100 and `essential: true` (plan 015 and ARCH 10.8: always-on, radii not needed; it is 100, not 50; the 13 v1 landmarks stay there until epic 4 replaces them one by one). No `forest` or `hill-and-outskirts` streamer area is created: vegetation is rendered in 100 m chunks by plan 036 and is not a streamer area.
- Tier radii: `radiiForTier(def, tier)` multiplies `loadRadius` and `unloadRadius` by 0.75 on tier `low` and by 1 otherwise (so `unloadRadius > loadRadius` always holds and `TIER_SETTINGS` gets NO new key), applied once when `createAllAreas` builds the table from `getTier()`; a tier change takes effect at the next page load (documented in `docs/world-conventions.md`, no re-registration).
- `src/main.js`: after `loadTown()` and `game.streamer` exist, call `createAllAreas(game, town, { fixture: getParams().fixture })` ONCE and `game.streamer.registerArea` every returned definition; delete the registrations that plans 031, 037, 038 and 039 added in `main.js` and the direct `v1-world` call (each area is registered exactly once; the loading-screen rule of plan 031 on `centre` and `hotel` is unchanged).
- Tests: ids unique and kebab-case; every area with priority below 100 has finite `loadRadius` below `unloadRadius` and every area with priority 100 is exempt from the radius rule; `v1-world` has priority 100 and `essential`; `centre`, `hotel` and `v1-world` are present, with `fixture` set the table is empty; the low-tier radii equal 0.75 times the others with the rule still holding; a fake landmark factory added with `registerLandmarkArea` appears in the table and `clearLandmarkAreas()` removes it; every area centre is inside the island radius; every plot lies in exactly one `town-<block>` block (the 80 m grid rule of plan 037) and every boat, the jetty, the gate and the temple lie within the `loadRadius` of at least one non-always-on area; the streamer with the real table and a fake loader loads `centre`, `hotel` and `v1-world` before any area below 100.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/areas.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/areas/index.js`
- `node "{{runner}}/assert.mjs" has src/main.js "createAllAreas"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "registerLandmarkArea"`

### Step 2: Minimap, fog and view distance

Deliver:
- `src/ui/minimapData.js` (pure, headless, no `window`): `buildMinimapLayers(town, heightField, { cell = 6 })` returns `{ cell, size, origin, mask, roads, landmarks, harbour }`: `mask` is a `Uint8Array` of `size * size` cells (`size = ceil(2 * (radius + 30) / cell)`, 110 for radius 300, `origin = -(radius + 30)`) with 0 = sea (height below `WATER_LEVEL - 1.5`), 1 = shallows (below `WATER_LEVEL`), 2 = land (at or above `WATER_LEVEL`); `roads` is `[{ id, class, width, color, points }]` with colours by class (main `#d9c9a3`, street `#c9b793`, lane `#b9a983`, path `#a99a74`); `landmarks` is 14 `{ id, x, z, name }` with `name` the zone display name; `harbour` is the polygon. `src/ui/minimap.js` stays a thin drawing layer: the mask drawn once into an offscreen canvas (sea, shallows, land), roads by class, the harbour, the player arrow, one letter per landmark with the display name in the legend and on hover; a larger map is plan 068. `tests/unit/ui/minimapData.test.js`: `size` and mask length for radius 300, the spawn cell is land and the cell at radius + 20 is sea, shallows exist, 14 landmarks with names equal to `zones.js` display names, one road entry per town road with the class colour, determinism.
- `src/world/atmosphere.js` (pure): `fogParams(viewDistance)` returns `{ density: 1.73 / viewDistance, near: 0.35 * viewDistance, far: viewDistance }` (read `sky.js` for the fog type in use: `FogExp2` takes `density`, linear `Fog` takes `near` and `far`) and `shadowExtent(tier)` returns 40, 55 or 70 m for low, medium, high (the sun shadow frustum follows the player with this half size; this is a function, NOT a new `TIER_SETTINGS` key, per plan 033). Wire both into `sky.js` and the render loop from `TIER_SETTINGS[tier].viewDistance` (re-applied on tier change). `tests/unit/world/atmosphere.test.js`: fog density decreases as the view distance grows, `near < far`, shadow extents increase low to high. The old claim "nothing pops closer than 150 m" is dropped as a check; it is a human check.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/minimapData.test.js tests/unit/world/atmosphere.test.js`
- `node "{{runner}}/assert.mjs" exists src/ui/minimapData.js src/world/atmosphere.js`

### Step 3: Auto-walk helper (dev only)

Deliver:
- Read `src/systems/input.js` and `src/systems/controller.js` first. `src/dev/autoWalk.js` (dev only, imported by `worldHook.js`) and the hook `walkTo(x, z, { sprint = true, timeoutMs = 90000 })` returning a promise that resolves `{ arrived, blocked, x, z }`. It plans a route with the road graph of `src/world/layout/walk.js` (nearest road point to the start, shortest road path, nearest road point to the target) and steers the player through the SAME inputs the controller reads (so collision and doors behave as for a person): it holds the forward key state (`w`, plus `shift` when sprinting) and turns `game.camRig.yaw` toward the next waypoint (yaw as ARCH 10.8); it never moves the player directly. If `input.js` has no way to set key state from code, add one exported function there (additive, for example `setKeyState(code, down)`). It stops when within 1.5 m of the target (`arrived: true`), when the player moved less than 0.3 m in 3 s (`blocked: true`) or on timeout. Time is GAME time (the sum of the clamped per-frame `dt`), so slow software WebGL frames cannot cause a false timeout.
- `tests/unit/dev/autoWalk.test.js`: the pure functions `steerToward(pos, target, yaw)` (returns `{ forward, turn }`: turn left when the target is to the left in the ARCH 10.8 convention, forward 0 when the angle error is above 1.2 rad) and `advanceWaypoint(route, pos)` (advance within 1.5 m, never skip), and the blocked detector on a fake position series.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/dev/autoWalk.test.js`
- `node "{{runner}}/assert.mjs" exists src/dev/autoWalk.js`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "walkTo"`

### Step 4: Tour spots, world tour test, budgets and the review pack

Deliver:
- `src/dev/tourSpots.js` (pure): `tourSpots(town, heightField, square)` returns the 11 spots `{ id, x, z }` computed from the data, each moved to a standable land point by `findStandPoint(x, z)` (spiral outward in 2 m steps up to 20 m until the terrain is at least `WATER_LEVEL + 0.3` and the point is not inside an anchor or plot rectangle): `hotel-lobby` (`town.spawn`), `square` (the square centre from `loadSquare()`), `main-street` (the `main` road at 40 percent of its length), `harbour-quay` (jetty root minus 3 m along the jetty direction, from the jetty record of plan 038), `jetty-end` (root plus 52 m along the direction, NOT moved), `beach` (beach polygon centroid), `forest-edge` (the forest polygon point nearest to the spawn moved 4 m toward the polygon centroid), `hill-top` (the `broadcast` anchor), `west-gate` (`local.gate` minus 6 m along the passage axis), `lighthouse` (the `lighthouse` anchor), `farmland` (farmland polygon centroid). `tests/unit/dev/tourSpots.test.js`: 11 unique ids, each spot inside the island, on land (height at least `WATER_LEVEL + 0.3`, `jetty-end` excepted and checked to lie on the deck), not inside an anchor or plot rectangle, deterministic.
- `tests/e2e/world-tour.spec.js` (`?quality=high&time=0.4&freeze=1&seed=1337`: the high tier is the only one with a budget for desktop; every wait is `expect.poll(..., { timeout: 30000 })`, no fixed delays; the test timeout is 300 s; read `budgets.json` with `fs` for the draw-call limit): record console `error` and `pageerror` for the whole tour; for each of the 11 spots: `teleport(x, z)`, poll until no area in `streamState().areas` has state `loading` (areas near the player have loaded), then assert `playerState().y` is within 0.15 m of the expected standing surface (the terrain height from the hook `terrainHeight(x, z)`, except `jetty-end` where it is the deck `y` of the jetty record of `listObjects()`), `rendererInfo().calls` is at most the desktop `drawCalls` of `src/budgets.json` and no area has state `failed`; at the end no console errors. A spot that stands inside a loading interior is not a tour spot (none of the 11 is).
- `tests/e2e/auto-walk.spec.js` (poll timeout 240000, test timeout 300 s): from the harbour quay (`teleport` to the `harbour-quay` tour spot) `walkTo` the square resolves `arrived: true` and the player ends within 3 m of the square centre; the promise is awaited inside `page.evaluate`, the test never sleeps.
- Budget spots: `main-street` (plan 034), `beach` and `forest` (plan 036) and `harbour-quay`, `harbour-jetty` (plan 038) already exist: verify with `has` and DO NOT redefine them. Append to `src/budgets.json` AND `src/shots.json` (identical numbers, never change an existing spot; plan 014 owns `harbour`, plan 035 `harbour-water`, plan 038 `harbour-quay`) the new ids `harbour-wide`, `west-gate-road`, `lighthouse-road` as literal numbers from the real data: `harbour-wide` camera 75 m west of the harbour polygon centroid at the same `z`, `y` = terrain + 5, yaw -1.5708 (looking east), pitch -0.18; `west-gate-road` camera 14 m west of `local.gate` on the road, `y` = ground + 2.5, looking east, pitch -0.05; `lighthouse-road` camera on the lighthouse path 35 m before the anchor, `y` = ground + 2.5, looking at the anchor (yaw `atan2(dx, dz)` with the ARCH 10.8 convention, `d` = anchor minus camera), pitch -0.08. Run `npm run check:budget`: both profiles pass for all spots. If a spot is over budget find the cause with `rendererInfo()` and fix (merge more, instancing, shorter distances, hide far interiors); never raise a limit and never add a `baselineAllowance`.
- Review pack: write `docs/review/town-review.md` (what to look at, the list of PNGs under `docs/shots/040/`, a section titled "Known gaps": 13 landmarks are still v1 boxes, no NPCs, weather or new audio, Tamil strings are drafts). Shots with `npm run shots`: 12 day shots `npm run shots -- --plan 040 --spots hotel-front,square-day,main-street,harbour-quay,harbour-jetty,beach-boats,beach,forest,gopuram,street-life,harbour-wide,lighthouse-road` (files `docs/shots/040/<spot>-high.png`) and 4 night shots `npm run shots -- --plan 040 --time 0.9 --out docs/shots/040/night --spots square-night,harbour-quay,gopuram,main-street` (files `docs/shots/040/night/<spot>-high.png`); open at least 8 of them with the Read tool and fix visible defects (best effort, never fails; list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/dev/tourSpots.test.js`
- `node "{{runner}}/assert.mjs" has src/budgets.json "harbour-wide"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "west-gate-road"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "lighthouse-road"`
- `node "{{runner}}/assert.mjs" has src/shots.json "harbour-wide"`
- `node "{{runner}}/assert.mjs" has src/shots.json "west-gate-road"`
- `node "{{runner}}/assert.mjs" has src/shots.json "lighthouse-road"`
- `npx playwright test tests/e2e/world-tour.spec.js`
- `npx playwright test tests/e2e/auto-walk.spec.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/review/town-review.md docs/shots/040/harbour-quay-high.png docs/shots/040/night/harbour-quay-high.png`
- `node "{{runner}}/assert.mjs" has docs/review/town-review.md "Known gaps"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/world/areas.test.js tests/unit/ui/minimapData.test.js tests/unit/world/atmosphere.test.js tests/unit/dev/autoWalk.test.js tests/unit/dev/tourSpots.test.js tests/unit/budgets/budgets.test.js`
- `npx playwright test tests/e2e/world-tour.spec.js`
- `npx playwright test tests/e2e/auto-walk.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Milestone of epic 3: walk the town, harbour, beach and forest and tell the planner what to change before epic 4. Check by eye that nothing pops in closer than about 150 m and that fog looks right at dusk.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
