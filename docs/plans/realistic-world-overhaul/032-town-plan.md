# Plan 032: Town plan data: roads, areas, landmark anchors, plots, and the layout tests

Epic E3. Estimated turns: 55.

## Goal

Design the island as a real South Indian coastal town (radius about 300 m) as data: `src/world/layout/town.json` with road polylines, the harbour, beach, forest, hill and farmland areas, the 14 landmark anchors, the spawn, and about 40 generated plots for houses, shops, cafe, market and fishermen huts. Pure geometry tests prove no overlaps, every landmark reachable from the spawn along roads, and the walk to the farthest landmark within 460 m. Nothing in the 3D world changes in this plan.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3 (Town plan), 10.4 and requirement R9, decision D14, D21)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/zones.js
- src/world/layout/slice.json
- src/world/layout/square.js
- src/world/buildings/plaza/manifest.json
- src/config.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Geometry helpers and the town.json schema

Deliver:
- `tests/unit/layout/geometry.test.js` and `tests/unit/layout/townSchema.test.js` first. `src/world/layout/geometry.js` (pure): `polygonContains(poly, x, z)`, `polygonArea`, `polylineLength(points)`, `pointAlongPolyline(points, d)`, `distanceToPolyline(points, x, z)`, `rectOverlap(a, b, margin)` for oriented rectangles `{ x, z, w, d, rot }`, `rectInPolygon`, `nearestPointOnPolyline`.
- `src/world/layout/town.js` exports `validateTown(town)` returning problems and `loadTown()`. Schema: `{ version: 1, radius: 300, spawn: { x, z }, anchors: { <zoneId>: { x, z, rot, w, d } }, areas: { sea, harbour: polygon, beach: polygon, forest: polygon, farmland: polygon, hill: { x, z, r, h }, square: { cx, cz, w, d } }, roads: [{ id, class: "main|street|lane|path", width, points: [[x, z]...] }], plots: [{ id, type: "house-a|house-b|shop-row|cafe|market|hut", x, z, w, d, rot, facing }], boats: [{ id, kind, x, z, rot }] }`. Rules: all 14 zone ids present in `anchors` with positive `w` and `d`; every polygon has at least 3 points and is inside the radius; road widths by class (main 7, street 5, lane 3.5, path 1.8); points inside the radius minus 15 m.
- Tests: the geometry helpers on known shapes (rotated rectangles overlapping and not, a polygon with a hole-free concave shape, distance to a polyline segment end); the schema validator accepts a minimal valid town built in the test and rejects each broken rule.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/layout/geometry.test.js tests/unit/layout/townSchema.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/layout/geometry.js src/world/layout/town.js`

### Step 2: Author roads, areas and anchors; reachability and walk-time tests

Deliver:
- Write `src/world/layout/town.json` (without plots yet, `plots: []`, `boats: []`). Compass: +x is east, +z is south. Concept (adjust coordinates freely but keep the idea and pass the tests): the sea is east and south; the harbour basin on the east coast (x 170 to 240, z 10 to 110) with the ferry terminal on its quay; a sand beach along the south-east shore; the lighthouse on the north-east headland (about 200, -90); the hill with the radio station and mast in the north-west (about -120, -90, height 18 m); forest north and north-west of the town; farmland west and south-west; the main street runs west to east through the town centre to the harbour; a ring road connects the outskirts; the west entrance gate (gateway gatehouse) stands where the west road enters the town (about -150, 0). The hotel (`plaza`) is at (0, -14) facing south onto the square (56 by 44 at (0, 20)); the spawn is the lobby (0, -8).
- Suggested anchors (x, z, w, d): plaza (0,-14,28,20); milestones town hall (0,68,22,16); notice post office (-48,20,14,10); library (-60,-34,24,18); academy (-100,40,30,22); forge engineering workshop (60,60,18,14); citadel office tower (72,-22,22,18); broadcast station (-120,-80,18,14); gateway gatehouse (-150,0,14,10); transport ferry terminal (190,50,28,16); temple community hall (-70,84,20,16); workshop startup garage (40,100,16,12); freshnote design studio (-20,104,16,12); lighthouse (200,-90,12,12).
- Roads: one `main` from the west gate through the square to the harbour; two `street` roads crossing it; `lane`s to each landmark; a `path` to the lighthouse and one up the hill; a ring `street`. Each anchor must have a road polyline passing within 12 m of its entrance side. Areas as polygons.
- `src/world/layout/walk.js`: `buildRoadGraph(town)` (nodes at road ends and intersections within 1.5 m, edges with lengths), `shortestWalk(graph, from, to)` returning the length in metres along roads plus the first and last connector segments from the point to the nearest road point, `farthestLandmark(town)`.
- `tests/unit/layout/townPlan.test.js`: `validateTown` has no problems; the road graph is one connected component; every landmark is reachable from the spawn; the farthest shortest walk is at most `MAX_PATH_METRES` (add `export const MAX_PATH_METRES = 460;` to `src/config.js`); no two anchor rectangles overlap (margin 4 m); no anchor rectangle intersects the harbour, beach (sea side), or a road polyline buffer of half width plus 1 m (except its own access lane end); the square rectangle does not overlap any anchor other than `plaza`; the hill centre is at least 60 m from every anchor except `broadcast`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/layout/townPlan.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/layout/town.json src/world/layout/walk.js`
- `node "{{runner}}/assert.mjs" has src/config.js "MAX_PATH_METRES"`

### Step 3: Plot generator and counts

Deliver:
- `src/world/layout/plots.js` exports `generatePlots(town, seed)` (pure, deterministic): walks along `street` and `lane` roads every 14 to 22 m on both sides, places a rectangle plot facing the road (setback 3 m from the edge), type chosen by zone of the town: `shop-row` along the main street within 120 m of the square, `house-a` and `house-b` elsewhere in town, `cafe` once next to the square, `market` once near the harbour road, `hut` along the beach and harbour (6), skipping any candidate that overlaps another plot, an anchor (margin 4 m), a road buffer, the square or a water polygon; target counts: at least 28 houses, 8 shop rows, 1 cafe, 1 market, 6 huts; also `generateBoats(town, seed)` (8 catamarans on the beach, 4 in the water near the beach, 6 fishing boats in the harbour, 2 moored at the jetty).
- `scripts/gen-town.mjs` writes the generated `plots` and `boats` into `town.json` (keep the authored fields untouched, stable key order); run it. A unit test regenerates and asserts the committed `town.json` plots equal the generator output (so nobody edits plots by hand without the generator).
- `tests/unit/layout/plots.test.js`: counts above; no overlaps (margin 1.5 m between plots, 4 m to anchors); every plot has road access (distance to a road under 14 m); determinism for seed 1337; a different seed gives a different but valid set; `hut` plots are within 40 m of the beach or harbour polygon.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/layout/plots.test.js tests/unit/layout/townPlan.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/layout/plots.js scripts/gen-town.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/layout/geometry.test.js tests/unit/layout/townSchema.test.js tests/unit/layout/townPlan.test.js tests/unit/layout/plots.test.js`

Human check (goes in the report, never blocks): Open `src/world/layout/town.json` in a viewer or look at the minimap later; judge whether the town plan feels right.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
