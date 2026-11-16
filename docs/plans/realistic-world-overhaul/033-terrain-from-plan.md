# Plan 033: Terrain built from the town plan; world enlarged to 300 m; v1 landmarks moved to their anchors

Epic E3. Estimated turns: 60.

## Goal

Rebuild the island from `town.json` (plan 032): an irregular coast between 280 and 288 m, plateaus under every anchor and plot, graded roads, the harbour basin cut below the water with a quay strip, a gently sloping beach, the hill, farmland plates, and a wading limit so the player cannot walk out into deep water (the v1 `max(y, -0.5)` clamp is removed). Move the v1 landmark circles to their anchors (`zones.js` reads the town plan), delete `slice.json` (its data moves to `square.json`, `loadSquare()` keeps its shape) and enlarge the world constants, minimap and sky.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.8 (Terrain API, Town square, Slice integration, Town plan conventions) and requirement R9, assumption A14)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/terrain/height.js
- src/world/terrain/splat.js
- src/world/terrain/terrainMesh.js
- src/world/terrain.js
- src/world/layout/town.json
- src/world/layout/town.js
- src/world/layout/geometry.js
- src/world/layout/walk.js
- src/world/layout/slice.json
- src/world/layout/square.js
- src/world/zones.js
- src/config.js
- src/budgets.json
- src/ui/minimap.js
- src/world/sky.js
- src/engine/scene.js
- src/systems/controller.js
- src/systems/collision/world.js
- src/world/props.js
- src/main.js
- src/world/areas/plazaArea.js
- src/dev/worldHook.js
- tests/unit/terrain/terrainBuild.test.js
- tests/unit/world/sliceAreas.test.js
- tests/e2e/slice-regression.spec.js
- tests/e2e/terrain.spec.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Town heightfield (pure, tested)

Deliver:
- `tests/unit/terrain/townHeight.test.js` first. `src/world/terrain/townHeight.js` exports `createTownHeightField(town, { seed = 1337, waterLevel = -1.2, extraFlatAreas = [] })` returning `{ heightAt, slopeAt, isWater, shoreDistance, radius, waterLevel }` (a superset of `createHeightField` of plan 028, whose function stays for its own tests): `heightAt(x, z)`; `slopeAt(x, z)` = gradient magnitude by central differences over 1 m; `isWater(x, z)` = `heightAt < waterLevel`; `shoreDistance(x, z)` = signed metres to the nearest waterline (positive on land, negative in water) taken from a 4 m grid distance transform built lazily on the first call; `radius` = `town.radius` (300). Pure, no `window`, deterministic for a seed (the noise uses `createRng(seed)` from `src/util/rng.js`). Helper `smoothstep(t) = t * t * (3 - 2 * t)` on a clamped `t`; a weight `w` is applied as `h = h + (target - h) * w` (replacement blending, never max).
- Composition, in this order (a later layer wins where it has weight; write the order as a comment at the top of the file): (1) BASE. Coast radius `R(theta)` = 284 + 4 * (low-frequency noise from three seeded sine harmonics), clamped to 280..288, and forced to exactly 280 in the angular wedge from `atan2(10, 212)` to `atan2(110, 212)` (smoothly blended over 10 degrees each side) so the harbour basin opens straight to the sea. With `s = R(theta) - r` (metres inland of the coast): land height `L = 0.3 + inland rise + hill + low noise` where inland rise = `0.012 * max(0, -0.707 x - 0.707 z)` (up to about 3 m in the north-west, the sea is east and south), hill = `h * (1 - (d / r)^2)^2` for `d < r` from `areas.hill`, noise amplitude 0.25 m at wavelength about 40 m; for `s >= 0`: `h = waterLevel + (L - waterLevel) * smoothstep(s / 30)`; for `s < 0`: `h = waterLevel - 1.8 * smoothstep(-s / 12) - 0.02 * max(0, -s - 12)` (so the sea floor is at or below -3.0 beyond 12 m from the coast, hence below -3 outside radius 300 since `R <= 288`). (2) FARMLAND: one flat plate per `areas.farmland` polygon at `clamp(base height at the polygon centroid, 0.3, 2.5)`, weight 1 inside, 0 at 6 m outside (no bunds). (3) BEACH: inside `areas.beach` the height is `waterLevel + 0.055 * t` with `t = R(theta) - r`, capped at +1.0, i.e. a 0.055 radial slope; weight 1 inside the polygon and 0 at 8 m outside it (landward blend). (4) PLOT plateaus then (5) ANCHOR plateaus (list order inside each, anchors after plots so an anchor wins an overlap): target height = `anchor.y` when present (plaza 0, broadcast 16, lighthouse 6 from plan 032), else the height of layers 1 to 3 at the centre clamped to 0.3..3.0 m (plots always clamp); the weight is 1 inside the oriented footprint rectangle grown by 2 m (anchors) or 1 m (plots) and falls to 0 over a further 6 m (anchors) or 5 m (plots), using the distance to the rectangle from `rectCorners`. (6) ROADS: for each road (a `closed` road wraps), sample the polyline every 2 m, read the height of layers 1 to 5 at each sample, smooth it with a moving average over 25 m, then limit the slope with a forward and a backward pass (`|p[i] - p[i-1]| <= 0.20` per 2 m step, i.e. 0.10), giving the graded profile; the height at a point is the profile at its nearest road sample; the weight is 1 within `width / 2 + 1` of the centreline and falls to 0 over `blend = clamp(|profile - terrain| / 0.5, 3, 12)` metres beyond that, so the road shoulder never steeper than about 0.5. Roads are applied in list order (main first). (7) HARBOUR: inside `areas.harbour` the height is -2.8 (weight 1, with a 0.5 m smoothstep at the polygon edge: the plan 038 stone face hides it). (8) QUAY strip: land within `harbour.quay.width` (3 m) landward of `harbour.quay.points` and outside the basin polygon is +0.4 (weight 1, 1.5 m blend landward). (9) SQUARE and extra flat areas, last: `extraFlatAreas` (the same semantics as ARCH 10.8: circle `{ x, z, r, y }` weight `1 - (d / r)^2`; rect `{ kind: "rect", x, z, hx, hz, blend, y }` weight 1 inside) in list order; `buildTerrain` passes the `flatAreas` of `loadSquare()` so the square and the hotel stay at the slice terrain height (0, the paving mesh is 0.15 above it).
- Rule when the road tests fail (state in the file header and in the report): you MAY edit the authored `roads` of `town.json` (lengthen, wind or shift a road, never remove one, never change an anchor, an area or the harbour) and re-run `node scripts/gen-town.mjs` and the frozen plan 032 tests; the usual case is the hill path/lane to `broadcast`, which has to climb from about 1 m to 16 m at a slope of 0.10 and so must be at least 170 m long and wind up the hill.
- Tests (grid and sampling helpers inside the test file; use the REAL `town.json`): no NaN or non-finite on a 4 m grid over the whole terrain square; the coast radius found by scanning each of 360 angles inward from 330 m (step 1 m, first sample with height at or above the water level) is between 279 and 289; heights from radius 300 to 340 on 24 angles are at most -2.99; the harbour: `heightAt` is below -1.8 at the centroid of `areas.harbour` and on a 4 m grid inside it except points within 3 m of the polygon edge, the quay strip points (1.5 m landward of the quay line) are within 0.1 of 0.4, and the open mouth: `heightAt(285, z)` is below the water level for z in 20, 40, 60, 80; beach: grid cells inside the beach polygon that are at least 8 m from its edge, 3 m from any plot and 6 m from any road and whose height is between -1.2 and 1.0 have `slopeAt` between 0.02 and 0.10; hill: the maximum height inside the hill circle is between 14 and 22; inland rise: the mean height of the 20 forest/farmland grid cells farthest from the coast is above 0.8; plateaus: every anchor centre height is within 0.03 of `anchor.y` when it has one, else within 0.03 of the clamped base height and inside 0.3..3.0, the four corners of every anchor rectangle are within 0.15 of the centre height, every plot centre height is within 0.3..3.05; roads: the slope along every road sampled every 2 m (rise over run) is at most 0.12, the height at each anchor entrance point is within 0.4 of that anchor plateau height, the shoulder slope (`slopeAt` at `width / 2 + 1.5` from the centre on both sides, 40 samples per road class) is at most 0.55; farmland: grid points inside the farmland polygon at least 10 m from any road are within 0.05 of each other and between 0.3 and 2.5; the square rectangle from `loadSquare()` is flat at the slice terrain height within 0.02; the land is one connected island (flood fill on a 6 m grid of cells above the water level: the largest component has at least 95 percent of the land cells); `shoreDistance` is positive at the plaza and negative at (320, 0); `isWater` agrees with `heightAt`; determinism (two fields from the same seed agree at 50 points, seed 2 differs somewhere); the extra flat area semantics (a circle and a rect applied last win).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/terrain/townHeight.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/terrain/townHeight.js`
- `node "{{runner}}/assert.mjs" has src/world/terrain/townHeight.js "shoreDistance"`
- `node "{{runner}}/assert.mjs" has src/world/terrain/townHeight.js "createTownHeightField"`

### Step 2: Wire the town terrain into the game: constants, square.json, zones, exclusions

Deliver:
- Capture BEFORE changing anything: write `tests/unit/layout/fixtures/square-v1.json` = `JSON.stringify(loadSquare(), null, 2)` (a one-off node script or a throwaway test; the file stays, it is the contract that `loadSquare()` keeps its shape). Then `src/world/layout/square.json` = that object WITHOUT the hotel placement (`x`, `z`, `rot`) and WITHOUT the square rectangle (`cx`, `cz`, `w`, `d`): those two come from `town.json` (`anchors.plaza`, `areas.square`). `loadSquare()` in `src/world/layout/square.js` composes both and still returns the identical shape: `tests/unit/layout/squareFromTown.test.js` deep-equals `loadSquare()` to the fixture (numbers within 1e-9), asserts `loadSquare().hotel` position equals `town.anchors.plaza` and the square rect equals `town.areas.square`, and `slice.json` no longer exists. `slice.json` is DELETED (use `absent`), its remaining data (platform, furniture, `flatAreas`, `exclusionRects`, hotel doors) lives in `square.json`, and `v1ZonesOverlappingSquare` is kept. The `hook.squareInfo()` is unchanged.
- `src/config.js` (the numbers are fixed by ARCH 10.4): `WORLD_RADIUS = 300`, `TERRAIN_SIZE = 680`, `CAMERA_FAR = 900`, `FOG_DENSITY = 0.0045` (v1 0.0085; at 850 m the fog factor is still 1, so the sky dome blends into it), `TERRAIN_SEGMENTS = 340` stays exported as the high-tier value; `TIER_SETTINGS` is NOT given a new key (ARCH 10.8). In `src/world/terrain/terrainMesh.js` change only the numbers inside `terrainSegments(tier)`: low 170, medium 256, high 340 (plan 028 froze its test to "strictly increasing and between 64 and 400"). `src/world/terrain.js`: `buildTerrain()` keeps its name and `mesh.userData.sampleHeight`; it now builds `game.heightField = createTownHeightField(loadTown(), { seed: getParams().seed, waterLevel: WATER_LEVEL, extraFlatAreas: [...getExtraFlatAreas(), ...loadSquare().flatAreas] })` (so `heightField` has the superset API), the path mask from the town roads (adapt `town.roads` to the input format of `createPathMask` in `splat.js`: every road is a dirt strip of `width + 1` m), and `sampleHeight = heightAt`. `setExtraFlatAreas`/`getExtraFlatAreas` stay exported but plan 029/031 callers no longer pass the slice areas (the heightfield takes them from `loadSquare()`): remove that call from `src/main.js` or the `v1-world` area `load` (grep `setExtraFlatAreas`; a test greps that no file under `src/` other than `terrain.js` calls it with slice areas).
- `src/world/zones.js`: the 13 v1 zones other than `plaza` take `x`, `z` from `town.json` anchors (`r`, `mode`, names stay as v1; the v1 building factories read their world position from the zone, rotation stays 0 because the epic 4 plans replace every v1 box with a building placed with the anchor `rot`); the `plaza` zone is NOT moved (it stays at the reception desk, plan 031, `mode: object`). The temporary relocations of plan 031 (`notice` (-40, 24), `milestones` (40, 24), `temple` (-40, 50)) are therefore replaced by the anchors (-48, 20), (0, 68), (-70, 84) (the values come from the data, never literals). `tests/unit/world/zonesFromTown.test.js`: each of the 13 zones equals its anchor x, z; `plaza` equals the desk position of plan 031; `v1ZonesOverlappingSquare(ZONE_LAYOUT, loadSquare())` is empty except `plaza`; zone circles do not overlap the harbour polygon.
- Props exclusion (`src/world/props.js`, builds on plan 029 `addExclusionRect`/`clearExclusionRects`/`isExcluded(x, z, pad)`): add `addExclusionPolygon(points)` and `addExclusionPolyline(points, halfWidth)` (module-level lists, cleared by `clearExclusionRects`) and make `isExcluded` test all three kinds. `src/world/layout/exclusions.js` exports `townExclusions(town)` returning `{ rects: [], polygons: [], polylines: [] }`: every road as a polyline with `halfWidth = width / 2 + 2`, every plot and anchor rectangle as a 4-point polygon (`rectCorners`, grown by 2 m), the harbour and beach polygons, the farmland polygon, the `areas.square` rect. `main.js` (or the `v1-world` load, next to the existing slice `exclusionRects` calls) registers them before `scatterProps()`; additionally the scatter skips points where `game.heightField.isWater(x, z)` or height is below 0.1. The v1 scatter counts stay as they are (plan 036 replaces vegetation). `tests/unit/world/townExclusions.test.js`: a point on a road centreline, inside a plot, inside an anchor, inside the harbour, inside the beach and 5 m from a road are excluded or not as expected; the existing 029 exclusion test still passes.
- Edit the tests the removed v1 data invalidates (this plan UNFREEZES them; keep their intent, change only what the plan changed): `tests/unit/terrain/terrainBuild.test.js` (028: the v1 heights fixture `v1Heights.json` no longer applies; assert `sampleHeight` equals `game.heightField.heightAt` at 20 seeded points and the town plateau heights at the 14 anchors), `tests/unit/world/sliceAreas.test.js` (031: relocation numbers become the anchors read from `town.json`; the loadOrder and the plaza zone checks stay), `tests/e2e/slice-regression.spec.js` (031: `playerState()` within 8 m of the anchor positions read via `fs` from `town.json` instead of the temporary relocation numbers) and `tests/e2e/terrain.spec.js` (028: assert heights through `terrainHeight()` against the town heightfield behaviour listed in the tests of step 3, no v1 height literals).
- `docs/world-conventions.md`: append a "Town terrain" section (the town.json keys of plan 032, the layer order of step 1, `createTownHeightField` API, `square.json`, the coast and wading numbers).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/layout/squareFromTown.test.js tests/unit/world/zonesFromTown.test.js tests/unit/world/townExclusions.test.js tests/unit/terrain/terrainBuild.test.js tests/unit/terrain/terrainMesh.test.js tests/unit/world/sliceAreas.test.js tests/unit/world/propsExclusion.test.js tests/unit/layout/square.test.js tests/unit/layout/townPlan.test.js`
- `node -e "const fs=require('fs');process.exit(['src/world/layout/slice.json'].some(p=>fs.existsSync(p))?1:0)"`
- `node "{{runner}}/assert.mjs" exists src/world/layout/square.json src/world/layout/exclusions.js tests/unit/layout/fixtures/square-v1.json`
- `node "{{runner}}/assert.mjs" has src/config.js "WORLD_RADIUS = 300"`
- `node "{{runner}}/assert.mjs" has src/config.js "CAMERA_FAR = 900"`
- `node "{{runner}}/assert.mjs" none src/config.js "terrainSegments"`
- `node "{{runner}}/assert.mjs" has src/world/props.js "addExclusionPolyline"`
- `npm run lint`

### Step 3: Wading limit, minimap, sky and the world-scale checks

Deliver:
- `tests/unit/collision/wading.test.js` first (a NEW file; do not edit frozen collision tests). `CollisionWorld.setWading({ waterLevel, maxDepth = 0.7, ground })` where `ground(x, z)` is the TERRAIN height provider only (the heightfield `heightAt`, never the combined ground height). A move whose target satisfies `waterLevel - ground(x, z) > maxDepth` is blocked unless a walkable floor descriptor (jetty deck, platform, quay strips are terrain) supports the target within the normal step-up of the player (use the same floor lookup the walking code uses, read `world.js`); a blocked move slides along the shore like a wall hit (move the axes separately). The check samples the target centre and four points on the radius 0.35 circle. `getWading()` returns `{ enabled, waterLevel, maxDepth }`. Tests with a synthetic sloping terrain: walking from a beach into the sea stops at depth 0.7 within 0.1 m; moving along the shoreline slides (the along-shore distance still grows); a floor descriptor over deep water is walkable (a deck at 0.45 over terrain -3) and stepping off it into deep water is blocked; with `setWading` not called nothing changes; depth exactly at the limit is allowed.
- `src/systems/controller.js`: delete the v1 clamp (`p.position.y = Math.max(h, -0.5)` becomes `p.position.y = h`; with wading blocked below `waterLevel - 0.7` = -1.9 the player y never drops below about -1.9). Boot: in the `v1-world` area load, right after `buildTerrain()` and where `game.collision` already exists (read `main.js` and `world.js`), call `game.collision.setWading({ waterLevel: WATER_LEVEL, maxDepth: 0.7, ground: game.heightField.heightAt })`; the hook `collisionStats()` gains `wading: { enabled, waterLevel, maxDepth }` from `getWading()`. A unit test greps that the clamp text `-0.5` no longer appears in `controller.js`.
- `src/ui/minimap.js`: the minimap stays the v1 fixed whole-island disc (it is NOT player-centred; `worldToMap` divides by `WORLD_RADIUS`, so it rescales with the config). Export `worldToMap(x, z, scale = 1, size = 160)` as a pure function, draw the town roads once into a cached offscreen canvas (1 px lines, class `main` 2 px) and the harbour polygon in water blue below the zone icons (guard with `typeof document`); the 14 zone icons use `ZONE_LAYOUT` (already moved). `tests/unit/ui/minimapScale.test.js`: `worldToMap(0, 0)` is the canvas centre, `worldToMap(WORLD_RADIUS, 0)` the right edge, `worldToMap(-300, 300)` the bottom-left corner, and the lighthouse anchor lands inside the disc. `src/world/sky.js`: the sky dome sphere radius becomes 850 (v1 480; it must stay below `CAMERA_FAR` 900 and the dome follows the camera as in v1: read how it is positioned). `src/engine/scene.js`: the sun shadow frustum is `SHADOW_FRUSTUM_SIZE` (v1 55 m half size, it follows the player as in v1) and stays unchanged; do not enlarge it. `tests/unit/world/worldScaleConfig.test.js`: `WORLD_RADIUS` 300, `TERRAIN_SIZE` 680, `CAMERA_FAR` 900, `FOG_DENSITY` 0.0045, sky radius at least 850 and below `CAMERA_FAR`, `TIER_SETTINGS.low` has no `terrainSegments` key and `terrainSegments` returns 170, 256, 340.
- `tests/e2e/world-scale.spec.js` (URL `?time=0.4&freeze=1&seed=1337`, wait for `window.__world.ready`, every wait is `expect.poll(..., { timeout: 20000 })`, never a fixed delay): for each of the 14 zone ids `teleport(id)` and assert `playerState().y` is within 0.15 of `terrainHeight(x, z)` (for `plaza`, which is inside the hotel lobby, assert y within 0.3 of 0 instead); `terrainStats().segments` equals the tier value (`tierSettings()`/`quality()` decides: 340 at high, run with `&quality=high`); `collisionStats().wading.enabled` is true; the wading walk: read `town.json` with `fs`, take the beach polygon, pick the sample (from 24 angles) with no boat and no plot within 6 m of a 45 m seaward ray from a dry beach point (`terrainHeight` about +0.3) and `teleport` there facing the sea (`yaw` pointing outward from the origin: `yaw = atan2(-dx, -dz)` with `(dx, dz)` the outward unit vector), hold `w` (walk, not sprint), poll until `playerState()` x, z changed by less than 0.05 m between two polls 500 ms apart AND the travelled distance is at least 8 m; then the depth `WATER_LEVEL - terrainHeight(x, z)` at the stopping point is greater than 0 and at most 0.8, `playerState().y` is within 0.15 of `terrainHeight`, and the player did not stop because of a boat or hut (no collider of `listObjects()` within 2 m); `rendererInfo().triangles` for the terrain at high is below the `budgets.json` limit; zero console errors.
- Budget: `npm run check:budget` must pass with the new terrain (at 340 segments the high tier terrain is about 231 thousand triangles). If it fails on triangles or draw calls, lower the `high` number inside `terrainSegments` (320, then 300) and say so in the report; never raise a limit or add an allowance (ARCH 10.8).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/wading.test.js tests/unit/ui/minimapScale.test.js tests/unit/world/worldScaleConfig.test.js tests/unit/terrain/townHeight.test.js`
- `node "{{runner}}/assert.mjs" none src/systems/controller.js "-0\.5"`
- `npx playwright test tests/e2e/world-scale.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/terrain/townHeight.test.js tests/unit/collision/wading.test.js tests/unit/layout/townPlan.test.js tests/unit/layout/squareFromTown.test.js tests/unit/world/zonesFromTown.test.js tests/unit/terrain/terrainBuild.test.js tests/unit/world/sliceAreas.test.js`
- `npx playwright test tests/e2e/world-scale.spec.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npm run check:budget`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
