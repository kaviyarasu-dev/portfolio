# Plan 034: Road meshes with kerbs, junctions, surface lookup and clear-road checks

Epic E3. Estimated turns: 60.

## Goal

Turn the road polylines of `town.json` into real roads: ribbon meshes that follow the graded terrain (plan 033) with textures by class (main street paving, street gravel, lane dirt, path dirt), kerbs and gutters on main roads and streets, clean junctions without z-fighting, and a `surfaceAt(x, z)` function that audio (plan 064) uses for footsteps. A test proves that no collider blocks a road over its whole width.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.8 (Budget and shot spots, Town square, Town plan conventions, Terrain API) and requirement R9, assumption A14 (in requirements.md))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/layout/town.json
- src/world/layout/town.js
- src/world/layout/walk.js
- src/world/layout/geometry.js
- src/world/layout/square.js
- src/world/town/square.js
- src/world/terrain/townHeight.js
- src/world/terrain/splat.js
- src/world/terrain.js
- src/engine/materials.js
- src/util/uv.js
- src/systems/collision/world.js
- src/world/areas/plazaArea.js
- src/dev/worldHook.js
- src/budgets.json
- src/shots.json
- tests/unit/world/squareLandmarks.test.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Ribbon geometry and kerbs (pure, unit tested)

Deliver:
- `tests/unit/roads/ribbon.test.js` first. `src/world/roads/ribbon.js` (pure, headless; the file header explains the UV exception below). Constants: `ROAD_Y_OFFSET = { main: 0.05, street: 0.045, lane: 0.04, path: 0.035 }`, `KERB = { height: 0.15, width: 0.2 }`, `GUTTER_WIDTH = 0.3`. `buildRoadGeometry(road, heightAt, { step = 1.5, yOffset = ROAD_Y_OFFSET[road.class], metersPerTile = 4, from = 0, to = Infinity })` returns a `BufferGeometry` strip along the polyline (a `closed` road wraps, the first point is NOT repeated in the data, the geometry repeats the seam sample so there is no gap): samples every `step` metres PLUS every original polyline vertex (corners are always sampled); at each sample the left and right edge points are `centre -/+ n * width / 2 * m` with `n` the unit normal and `m = min(1 / cos(halfAngle), 2.0)` the miter factor (the factor is clamped to 2.0, so a sharper corner is bevelled by the clamp rather than spiking); heading `t = (tx, tz)`, LEFT normal is `(tz, -tx)` (heading east, left is north); `y = heightAt(x, z) + yOffset`; normals up; UV is metric with the one allowed exception to `applyMetricUV` (a world-aligned UV would not follow the road bends): `u = across metres / metersPerTile`, `v = along metres / metersPerTile` (the material `repeat` stays 1,1; plan 013 `metersPerTile` of `stonePaving`, `gravel`, `dirtRoad` is the value to pass); `from` and `to` (metres along the polyline) cut the strip to a run, used for clipping. `splitRunsOutsideRect(road, rect, step)` returns the runs `[{ from, to }]` of the road whose samples lie outside the oriented rectangle (used to leave the square free). `buildKerbGeometry(road, heightAt, side, opts)` with `side` `"left"` or `"right"` returns a kerb strip (box cross-section 0.2 m wide by 0.15 m high, its outer face on the road edge plus 0.2 m, top at `road y + 0.15`; `y` relative to the road surface at the same sample) for `main` and `street` classes and returns `null` for `lane` and `path`. `buildGutterGeometry(road, heightAt, side, opts)` returns a 0.3 m wide flat strip just inside the kerb at `road y + 0.01` (same classes, `null` otherwise).
- Per-road tie-break so equal classes never z-fight: the default `yOffset` of the road with index `i` in `town.roads` is `ROAD_Y_OFFSET[class] + (i % 40) * 0.0004`, exported as `roadYOffset(town, road)`.
- Tests: vertex count equals 2 per sample (open) and the closed loop has the seam sample doubled and no gap (first and last pair identical); width at straight segments equals `road.width` within 1 cm; the corner sample of a 90 degree turn has miter factor 1.414 within 0.01 and a 30 degree turn is clamped to 2.0 (edge offset at most `width`); no degenerate triangles (area under 1e-8) on a 90 degree corner and on the clamped one; heights follow the function within 0.06 m (including `yOffset`); `v` increases monotonically, `u` spans exactly `width / metersPerTile`; `from`/`to` produce a run whose first sample is at that arclength; `splitRunsOutsideRect` on a road crossing a rectangle returns two runs and none touches the rectangle; kerb: `null` for lane and path, for main its top is 0.15 above the road y at the same sample, left and right kerbs are 2 * (width / 2 + 0.2) apart at a straight sample, and the left kerb heading east has smaller z than the right; gutter strip width 0.3; `roadYOffset` differs between two roads of the same class.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/roads/ribbon.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/roads/ribbon.js`
- `node "{{runner}}/assert.mjs" has src/world/roads/ribbon.js "buildKerbGeometry"`
- `node "{{runner}}/assert.mjs" has src/world/roads/ribbon.js "splitRunsOutsideRect"`

### Step 2: Surface lookup and the clear-road test

Deliver:
- `tests/unit/roads/surface.test.js` first. `src/world/roads/surface.js` (pure, headless): `createSurfaceLookup(town, heightField, { square })` returns `surfaceAt(x, z)` with a `stats()` (`{ cells, maxPerCell }`) and these rules in order: inside `areas.square` rect (or the `square` argument) -> `stone`; within `harbour.quay.width` landward of the quay line and outside the harbour polygon -> `stone`; in water (`heightField.isWater`) -> `sand`; inside the half width of a road: `main` -> `stone`, `street`, `lane`, `path` -> `gravel` (the highest class wins where two overlap); otherwise the dominant layer of `splatWeights({ h: heightAt, slope: slopeAt, pathMask: 0 })` (plan 028; `[grass, sand, dirt, rock]` argmax, first wins ties) mapped `grass` -> `grass`, `sand` -> `sand`, `dirt` -> `gravel`, `rock` -> `stone`. Every returned value is in `SURFACES` of plan 064 (`grass sand gravel wood tile carpet stone metal`; plan 034 returns only `grass sand gravel stone`; `wood`, `tile`, `carpet`, `metal` come from buildings and the jetty). A spatial grid of road segments (cell 16 m) makes it fast. The module also exports `setSurfaceLookup(fn)` and the runtime `surfaceAt(x, z)` that delegates to the installed lookup (default returns `grass` until installed); plan 064 imports `surfaceAt` from `src/world/roads/surface.js` and `game.surfaceAt` is set to the same function at boot.
- Tests: points on the centreline of each class return the mapped surface (pick a sample at least 8 m from every other road, from the REAL data); a point in the square is `stone` and on the quay strip `stone`; a point 10 m off any road on grass terrain returns `grass`; a beach point near +0.2 returns `sand`; a point in the harbour water returns `sand`; a main street point still returns `stone` when a lane crosses it; 100000 calls over a 2000-point sample finish under 3000 ms and `stats().maxPerCell` is at most 12 (a relative bound instead of a tight timing); every return value is in `SURFACES` for a 2000-point island sample (seeded).
- `tests/unit/roads/clear.test.js`: build a headless `CollisionWorld` (plan 016; read `world.js` for the exact add and test calls) with these colliders, all with absolute `yMin`/`yMax`: every anchor as a box `{ kind: "box", id: "anchor:<id>", cx, cz, hx: w / 2, hz: d / 2, rot, yMin: heightAt(x, z), yMax: heightAt(x, z) + 8 }` (the oriented rectangle, `rot` as in plan 032), every plot as a box (`id: "plot:<id>"`, height 6), the REAL square colliders from `buildSquare(loadSquare(), ctx)` (`src/world/town/square.js`, plan 029; `loadSquare()` is in `src/world/layout/square.js`; copy the minimal headless `ctx` helper of `tests/unit/world/squareLandmarks.test.js`), whose descriptors are `{ kind: "circle" | "box" | "floor" }` as plan 029 defines them. For every road sample every 1 m along the centreline AND at the lateral offsets `+/- (width / 2 - 0.5)` (the whole walkable width), test a circle of radius 0.35 at `y = heightAt` and assert it is NOT blocked (an obstacle on a road is a layout bug). Exemptions, stated in the test: (a) a sample inside the `areas.square` rectangle is skipped (the square furniture, the banyan platform at (0, 26) and the clock tower are validated by plan 029 `checkSquare` `reachable` and `walkway` rules, and the road mesh is clipped out of the square below), (b) for a road with `access: <id>` the collider `anchor:<id>` is ignored within 4 m of that road end. When a sample fails: fix `town.json` roads (shift or reroute the road) or `src/world/layout/plots.js` inputs, run `node scripts/gen-town.mjs` and keep the frozen plan 032 tests (`plots.test.js`, `townPlan.test.js`, `townSchema.test.js`) passing; never loosen this test. If after two data fixes it still fails, write `BLOCKED.md` with the failing road id and sample.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/roads/surface.test.js tests/unit/roads/clear.test.js tests/unit/layout/plots.test.js tests/unit/layout/townPlan.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/roads/surface.js`
- `node "{{runner}}/assert.mjs" has src/world/roads/surface.js "createSurfaceLookup"`
- `node "{{runner}}/assert.mjs" has src/world/roads/surface.js "setSurfaceLookup"`

### Step 3: Materials, junctions, merged meshes, wiring and the hook

Deliver:
- `tests/unit/roads/roads.test.js` first (headless: `getMaterial` and `heightAt` stubs from the REAL `town.json` and `createTownHeightField`). `src/world/roads/roads.js` exports `buildRoads(town, ctx, { part = "all" } = {})` with `ctx = { heightAt, getMaterial }` returning `{ root, objects, stats(), dispose() }` (it never touches `game`). Meshes (all merged with `mergeGeometries`; names are contracts): one per class `roads:main` (material `stonePaving`), `roads:street` (`gravel`), `roads:lane` (`dirtRoad`), `roads:path` (`dirtRoad` with tint `#b4a48c`, darker than the lane); kerbs `roads:kerb-main` and `roads:kerb-street` (both sides merged, material `stonePaving` tint `#cfc9bd`); gutters `roads:gutter` (material `concrete` tint `#4a4a48`); junction patches `roads:patch-<class>`. Every road material is a `.clone()` of the shared material with `polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2` (patches -3, -3; kerbs -2, -2), so the terrain splat never wins. Roads whose centre samples lie inside `areas.square` are cut out with `splitRunsOutsideRect` (the square paving of plan 029 covers it); roads take `yOffset` from `roadYOffset`.
- Junction patches: for every crossing or T of two roads of DIFFERENT class (found with `segmentIntersection` over the road segments, plus road ends within 1.5 m of another road, same logic as `buildRoadGraph`) add a disc (24 segments, radius = half the wider road width + 1 m, vertices at `heightAt + max(ribbon yOffsets) + 0.004`) with the material of the higher class; same-class crossings get no patch (the per-road `yOffset` tie-break resolves them). Part rule (the clipping rule): a ribbon sample, kerb sample or gutter sample belongs to `near` when the midpoint of its segment is within 120 m of the square centre `(areas.square.cx, areas.square.cz)`, otherwise to `far`; a patch belongs to the part that contains its centre; `part: "all"` builds both; boundary samples are shared so the two parts leave no gap. `objects` has one record per mesh `{ type: "road", name: "roads:<class>", class, triangles }` (kerbs, gutters and patches use `type: "road-kerb"`, `"road-gutter"`, `"road-patch"`), pushed by the caller into `game.areaObjects`.
- Wiring (read `plazaArea.js`, `main.js` and the `v1-world` load first): the `centre` area `load(ctx)` calls `buildRoads(town, { heightAt: game.heightField.heightAt, getMaterial }, { part: "near" })`, adds `root` to its group and pushes `objects` into `game.areaObjects`; the `v1-world` load calls it with `part: "far"` after `buildTerrain()`; both `dispose` on unload. At boot, right after `buildTerrain()`, `setSurfaceLookup(createSurfaceLookup(town, game.heightField, { square: loadSquare() }))` and `game.surfaceAt = surfaceAt`. `src/dev/worldHook.js` gains `surfaceAt(x, z)`. Delete any remaining v1 path tint code in `src/world/terrain.js` (plan 028 should already have removed it; the check below greps `pathInfluence` and `colPath`).
- Tests (`roads.test.js`): `buildRoads` returns the shape above and meshes with the exact names for the classes present in `town.json`; each class is ONE merged mesh (mesh count per class is 1 in `part: "all"`); kerb meshes exist for main and street only; the number of junction patches equals the number of different-class crossings computed independently in the test from the data; every patch vertex y is above the ribbons of both roads at its centre; every road material has `polygonOffsetFactor` below 0; the patch material is the material of the higher class; `near` and `far` triangle counts sum to the `all` count within 3 percent (shared boundary samples) and `near` contains `roads:main` while `far` contains `roads:path`; no ribbon vertex lies inside the `areas.square` rectangle; the path material tint differs from the lane tint; `dispose()` removes geometries. A grep test asserts `setSurfaceLookup` is called in `main.js` or the area load and that `pathInfluence` and `colPath` do not occur in `src/world/terrain.js`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/roads/roads.test.js tests/unit/roads/ribbon.test.js tests/unit/roads/surface.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/roads/roads.js`
- `node "{{runner}}/assert.mjs" has src/world/roads/roads.js "polygonOffset"`
- `node "{{runner}}/assert.mjs" none src/world/terrain.js "pathInfluence|colPath"`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "surfaceAt"`

### Step 4: Playwright, spots and a look

Deliver:
- Spots (ARCH 10.8: `y` is the absolute CAMERA height; append to `src/budgets.json` AND `src/shots.json` with identical `x, y, z, yaw, pitch`, never change an existing one; the ids `main-street`, `junction`, `lane` are new; write literal numbers computed once from the real data with a throwaway node script, `heightAt` from `createTownHeightField`): `main-street`: `P` = the point of the `main` road nearest to x 70 outside the square, `T` = its unit east-pointing tangent; camera `P - 10 T`, `y = heightAt + 2.2`, `yaw = atan2(-T.x, -T.z)`, pitch -0.08. `junction`: the crossing of `main` with the nearest `street` outside the square, camera 18 m back along the main tangent, `y = heightAt + 3.5`, yaw toward the crossing, pitch -0.2. `lane`: the first lane (by id) that ends at an anchor outside the square, camera 12 m back along it, `y = heightAt + 2.0`, yaw along the lane toward the anchor, pitch -0.1. A unit test `tests/unit/roads/spots.test.js` asserts the three ids exist in both files with equal numbers.
- `tests/e2e/roads.spec.js` (`?time=0.4&freeze=1&seed=1337`, wait for `window.__world.ready`, every wait is `expect.poll(..., { timeout: 20000 })`, never a fixed delay; read `town.json` with `fs`): `listObjects()` has a `road` record named `roads:<class>` for every class present (main, street, lane, path) and `road-kerb` for `main`; stand on the main street east of the square (the `main-street` spot target `P`): `teleport(P.x - 4 T.x, P.z - 4 T.z, undefined, yaw)` with `yaw = atan2(-T.x, -T.z)`, hold `w`, poll until the distance travelled along `T` is at least 20 m (the player is not blocked: the travelled distance keeps growing between two polls 500 ms apart until 20 m) and `playerState().y` is within 0.25 of `terrainHeight(x, z)` at the end; `surfaceAt(P.x, P.z)` is `stone`, a lane centreline point (at least 8 m from other roads) is `gravel`, a forest polygon centroid is one of `grass`, `gravel`, `stone`; `streamState()` shows `centre` and `v1-world` loaded; zero console errors; `rendererInfo().calls` at the `main-street` spot is at most the desktop `drawCalls` limit of `budgets.json`.
- Shots: `npm run shots -- --spots main-street,junction,lane --plan 034`; open each PNG in `docs/shots/034/` with the Read tool and fix z-fighting, floating kerbs, a visible seam between the near and far parts, a road crossing the square paving, texture stretching (best effort, never fails; list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/roads/spots.test.js`
- `node "{{runner}}/assert.mjs" has src/budgets.json "main-street"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "junction"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "lane"`
- `node "{{runner}}/assert.mjs" has src/shots.json "main-street"`
- `node "{{runner}}/assert.mjs" has src/shots.json "junction"`
- `node "{{runner}}/assert.mjs" has src/shots.json "lane"`
- `npx playwright test tests/e2e/roads.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/roads/ribbon.test.js tests/unit/roads/surface.test.js tests/unit/roads/clear.test.js tests/unit/roads/roads.test.js tests/unit/roads/spots.test.js tests/unit/layout/plots.test.js tests/unit/layout/townPlan.test.js`
- `npx playwright test tests/e2e/roads.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): Judge whether the main street, junctions and lanes look like a real South Indian coastal town road network (kerbs, gutters, materials), not flat ribbons.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
