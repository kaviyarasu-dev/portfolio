# Plan 034: Road meshes with kerbs, junctions, surface lookup and clear-road checks

Epic E3. Estimated turns: 50.

## Goal

Turn the road polylines into real roads: ribbon meshes that follow the graded terrain with textures by class (main street paving, street gravel, lane dirt, path dirt), kerbs and gutters on main roads and streets, clean junctions without z-fighting, and a `surfaceAt(x, z)` function that audio (plan 064) will use for footsteps. A test proves no collider blocks a road.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4 and requirement R9, assumption A14)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/layout/town.json
- src/world/layout/walk.js
- src/world/layout/geometry.js
- src/world/terrain/townHeight.js
- src/engine/materials.js
- src/util/uv.js
- src/world/terrain/splat.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Ribbon geometry and kerbs (pure, unit tested)

Deliver:
- `tests/unit/roads/ribbon.test.js` first. `src/world/roads/ribbon.js`: `buildRoadGeometry(road, heightAt, { step = 1.5, yOffset })` returns a `BufferGeometry` strip along the polyline: samples every `step` metres, left and right edges offset by `width / 2` along the local normal (smoothed at corners with a miter limit of 2.0), `y = heightAt + yOffset` (main 0.05, street 0.045, lane 0.04, path 0.035 so overlaps do not z-fight), UV u across (0..1), v in metres along the road divided by 4, vertex normals up. `buildKerbGeometry(road, heightAt, side)` returns a 0.15 m high, 0.2 m wide kerb strip along an edge for `main` and `street` classes only. Both are headless.
- Tests: vertex count equals 2 per sample; width at straight segments equals `road.width` within 1 cm; no degenerate triangles (area under 1e-8) on a 90 degree corner; heights follow the function within 0.06 m; v increases monotonically; kerb height 0.15; a closed loop road does not leave a gap at the seam.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/roads/ribbon.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/roads/ribbon.js`

### Step 2: Materials, junctions, scene integration and surface lookup

Deliver:
- `src/world/roads/roads.js`: `buildRoads(town, ctx)` returns `{ root, surfaceAt(x, z), update }` with one merged mesh per class (material: main `stonePaving`, street `gravel`, lane `dirtRoad`, path `dirtRoad` darker tint), kerb meshes merged per side, junction patches (a disc of the higher class material at each intersection of two roads of different class, radius = half the wider road + 1 m, 0.03 m above both) to hide the seams, road-side drainage gutters as a thin dark strip next to kerbs. Roads render with `polygonOffset` so they never fight with the terrain splat.
- `src/world/roads/surface.js` (pure, headless): `createSurfaceLookup(town, heightField)` returning `surfaceAt(x, z)` -> `'stone'` on main roads and the square, `'gravel'` on streets and lanes and paths, otherwise from the terrain splat dominant layer (`grass`, `sand`, `gravel` for dirt, `stone` for rock). A spatial grid of road segments (cell 16 m) keeps the lookup fast.
- `tests/unit/roads/surface.test.js`: points on each road class return the mapped surface; a point 10 m off the road on grass terrain returns `grass`; sand near the shoreline; the lookup handles 100000 calls in under 300 ms. `tests/unit/roads/clear.test.js`: build a headless collision world with all anchors as boxes (footprints), plots as boxes, square furniture (from `square.js`), and assert that sampling every 1 m along every road centreline gives `blockedAt` false at radius 0.35 (a plot or lamp on a road is a layout bug; fix the data or the generator inputs, not the test).
- Wire `buildRoads` into the world build (the `centre` area for the roads within 120 m of the square, the rest in `v1-world` for now) and remove the v1 straight path tint code from the terrain.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/roads/surface.test.js tests/unit/roads/clear.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/roads/roads.js src/world/roads/surface.js`

### Step 3: Playwright and a look

Deliver:
- `tests/e2e/roads.spec.js`: boot; `listObjects()` reports road meshes per class; walking along the main street from the square to the east for 8 s moves the player at least 20 m without being blocked (`playerState()`); `surfaceAt` exposed in the hook as `surfaceAt(x, z)` returns `stone` on the main street; zero console errors; `check:budget` passes.
- Shots: add spots `main-street`, `junction`, `lane` to `src/shots.json` and run `npm run shots -- --spots main-street,junction,lane --plan 034`; look for z-fighting, floating kerbs, texture stretching (best effort, fix what you see).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/roads.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/roads/ribbon.test.js tests/unit/roads/surface.test.js tests/unit/roads/clear.test.js`
- `npx playwright test tests/e2e/roads.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
