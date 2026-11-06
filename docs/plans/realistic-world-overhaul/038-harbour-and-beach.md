# Plan 038: Fishing harbour: jetty, quay, boats, nets, fish racks, fish market, beach details

Epic E3. Estimated turns: 60.

## Goal

The fishing harbour and beach of a Tamil Nadu coast: a wooden jetty on piles, a stone quay with bollards and lamps, catamarans (kattumaram) on the sand and in the water, painted fishing boats at moorings, fishing nets on frames and heaped, drying-fish racks, fish crates, wicker baskets, a fish market hall, a lifebuoy post, driftwood and shells on the beach (the fishermen huts are plots built by plan 037). Boats carry bobbing metadata for epic 5.

Data contract: plan 032 provides in `town.json` (and validates in `validateTown`) the jetty and quay data (jetty root point, direction, length and width; quay edge polyline; mooring points), the boat kinds (`catamaran`, `boat-fishing`, plus the two moored ones) and the closed-ring and plot-facing conventions. This plan only READS that data: it never changes the schema, `town.json`, `gen-town.mjs` or `plots.js`. Below `jetty` and `quay` are shorthand: use the exact key names plan 032 documents (read `src/world/layout/town.js` and `docs/world-conventions.md`). Extra items (nets, racks, crates, baskets, driftwood, shells, lifebuoys) are computed in code by `placeHarbourProps(town, seed)` in this plan, not stored in `town.json`.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.5, 10.8 (streaming, prop metadata, spots) and requirement R9, decision D25(c), D21)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/layout/town.json
- src/world/layout/town.js
- src/world/layout/plots.js
- src/world/layout/geometry.js
- src/world/props/catalog.js
- src/world/props/index.js
- src/world/props/sets/outdoorSeating.js
- src/world/water/waves.js
- src/world/town/townBuilder.js
- src/world/town/square.js
- src/world/areas/townAreas.js
- src/world/areas/plazaArea.js
- src/systems/collision/world.js
- src/systems/lights/lightManager.js
- src/engine/quality.js
- src/engine/materials.js
- src/world/kit/exterior.js
- src/budgets.json
- src/shots.json
- src/config.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Harbour props (headless)

Deliver:
- `tests/unit/props/harbour.test.js` first. `src/world/props/sets/harbour.js` (category `harbour`, exports `TYPES`) and ONE added import line in `src/world/props/index.js` (the generic `allProps` test then covers every type). Every type is registered with `size` (bbox, front toward +z), `solid`, `mount: "floor"`, `seats: []` as in this table, and the only `meta` key used is `animated` (never an unknown key): `catamaran` [1.6, 2.4, 5.6] solid (5 lashed logs tapering to a raised bow, rope lashings, an outrigger beam, a small mast stub 2.4 m high; `meta.animated: { kind: "bob", amp: 0.08, period: 3.2 }`); `boat-fishing` [2.6, 3.2, 8.0] solid with `variants: 3` (three hull colours, same size: wooden hull with a painted stripe, thwarts, an outboard motor aft and a small wheelhouse cabin; `animated: { kind: "bob", amp: 0.06, period: 3.8 }`); `boat-rowing` [1.3, 0.7, 3.5] solid; `net-rack` [3.0, 2.2, 0.5] not solid (two poles, a cross beam and a draped net built as a grid of crossing thin boxes 0.01 m, NO alpha-tested texture: headless tests have no textures); `net-heap` [1.2, 0.7, 1.2] not solid (lumpy pile with floats); `fish-rack` [2.4, 1.8, 1.2] not solid (bamboo A-frame with three rows of small silvery fish: the rows are three groups named `keep-fish-row-1`, `keep-fish-row-2`, `keep-fish-row-3`, each one merged mesh); `crate-fish` [0.6, 0.35, 0.4] solid; `basket-wicker` [0.5, 0.45, 0.5] not solid; `ice-box` [0.9, 0.55, 0.55] solid; `bollard` [0.35, 0.6, 0.35] solid; `mooring-post` [0.3, 1.2, 0.3] solid; `lifebuoy-post` [0.5, 1.6, 0.2] solid (post with a red and white ring); `anchor-prop` [0.9, 1.3, 0.4] solid; `driftwood` [1.4, 0.35, 0.5] not solid; `shell-cluster` [0.4, 0.1, 0.4] not solid; `rope-coil` [0.6, 0.25, 0.6] not solid; `fish-scale` [0.6, 1.5, 0.4] solid (hanging scale on a stand). The `animated` metadata is read by plan 061 (kinds spin, bob, blink, hands, flag, swing).
- Tests: the exact `TYPES` list; every `size` within 2 percent of the built bounding box; solid flags as in the table; catamaran length (z extent) 5.0 to 6.0 m, `boat-fishing` 7.0 to 9.0 m (check all 3 variants), `boat-rowing` 3.5 m, every boat under 3.5 m high; `catamaran` and `boat-fishing` have `animated.kind === "bob"` with a finite positive `amp` (catamaran 0.08, boat-fishing 0.06) and `period`, and the other types have no `animated`; `fish-rack` has three children named `keep-fish-row-1` to `keep-fish-row-3` each with more than 40 triangles and the whole prop more than 300 triangles; `net-rack` has more than 20 net line meshes before merging or a merged mesh with more than 200 triangles, and no mesh has a texture map; `boat-fishing` has a node named `cabin` and `animated` only on the root; the generic `allProps` test passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/harbour.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/harbour.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "harbour"`

### Step 2: Jetty and quay (walkable deck, rails, piles, lamps)

Deliver:
- `tests/unit/town/harbourLayout.test.js` first (part 1: jetty and quay). Fixed heights: the quay strip top is the terrain at +0.4 m (plan 033); export `JETTY_DECK_Y = 0.45` from `src/world/town/harbour.js` (the deck is 0.05 m above the quay strip so the step from quay to deck is far below the 0.45 m step-up and no ramp or step is needed; the deck is 1.65 m above the water level -1.2). One number, used by the builder, the tests and the e2e test.
- `src/world/town/harbour.js`: `buildHarbour(town, ctx)` with the SAME `ctx` plan 037 passes to `buildTown` (`{ lightManager, getMaterial, buildProp, tier }`) plus `heightAt(x, z)` (the height field), returning like plan 029 `buildSquare`: `{ root, colliders, floors, lights, objects, update(dtMs), stats(), dispose() }`; the builder never touches `game`: `colliders` and `floors` are plain descriptors (`{ kind: "box", id, cx, cz, hx, hz, rot, yMin, yMax }`, `{ kind: "floor", id, x0, x1, z0, z1, y, rot }`) for the caller to add to the collision world, and `objects` is the list for `game.areaObjects`. Everything it creates is named with the prefix `harbour:` (`harbour:jetty`, `harbour:jetty:deck`, `harbour:fish-market`, `harbour:<propType>-<n>`, collider and floor ids `harbour:...`).
- Jetty (from the jetty data of plan 032: root point on the quay, direction, length 55, width 4): plank deck mesh with 0.05 m gaps, one floor descriptor `harbour:jetty:deck` (x0, x1, z0, z1 in the jetty frame, `rot` from the direction) at `JETTY_DECK_Y`; 70 piles (35 pairs, one every 55/34 m, radius 0.15, from y -3.2 to the deck underside) as ONE `InstancedMesh` named `jetty-piles` with `count` 70, no colliders for piles; two handrails (post every 2.5 m plus a top rail at 1.0 m above the deck) one on each long side, along the whole length, made of 11 box colliders per side (`harbour:jetty:rail-L-<n>`, `harbour:jetty:rail-R-<n>`, 0.1 m thick, `yMin` deck, `yMax` deck + 1.0), the root end and the far end are open (no rail across); 8 bollards (props `bollard`, 4 per side, evenly spaced, inside the rails) and 6 lamp posts (the exterior kit `lamp` builder of plan 025, read `exterior.js`; spaced every 9 m on alternating sides) whose lights are registered with `ctx.lightManager.registerLight({ id: "harbour:lamp-<n>", x, y, z, color: "#ffd9a0", intensity: 10, distance: 9, group: "harbour-lamps", auto: "dusk", emissive: [bulbMesh] })` and unregistered in `dispose()`; `objects` has one `{ type: "jetty", name: "harbour:jetty", x, y: JETTY_DECK_Y, z, length: 55, width: 4, rot, root: { x, z }, dir: { x, z } }` record (plans 039 and 040 read it).
- Quay edge (from the quay polyline of plan 032, the 3 m stone strip along the harbour): a vertical stone face (material from the stone family of `MATERIAL_NAMES`) from y -2.5 up to the strip top, a 0.25 m high by 0.3 m wide stone kerb along the top edge (a mesh only: the wading limit of plan 033 already stops the player at the water), at least 2 stone step groups named `quay-steps-<n>` cut into the face (decorative, not walkable), rubber fenders (black cylinders, every 6 m, instanced), and `bollard` props every 8 m along the quay edge (at least 6 on the real data; with the 8 on the jetty that is the 14 required in total).
- Tests (headless, `new CollisionWorld()` from plan 016 with a test terrain provider that returns 0.4 on the quay strip and -3 elsewhere, the descriptors added as the real caller does, `moveCircle` in 0.1 m steps with radius 0.35 as in the plan 016 tests): walking from 3 m before the jetty root along the jetty direction to the far end reaches it, `y` stays within 0.02 of `JETTY_DECK_Y` from the root onward and never jumps by more than 0.1 per move; sideways moves from the deck centre line are blocked by the rails (the lateral offset never exceeds 1.55 m = rail inner face 1.9 minus the circle radius 0.35, plus 0.01 tolerance) on both sides; the deck floor descriptor is 55 by 4 within 0.01; `jetty-piles` count is 70; 6 `registerLight` calls with group `harbour-lamps` and `auto: "dusk"` (fake light manager) and as many `unregisterLight` calls after `dispose()`; 8 bollards on the jetty and at least 14 in total; the kerb, at least 2 `quay-steps-*` groups and the fenders exist; every collider id starts with `harbour:` and ids are unique; `objects` contains the jetty record with `y` equal to `JETTY_DECK_Y`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/town/harbourLayout.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/town/harbour.js`
- `node "{{runner}}/assert.mjs" has src/world/town/harbour.js "JETTY_DECK_Y"`

### Step 3: Fish market, boats and beach details from the plan data

Deliver:
- `tests/unit/town/harbourLayout.test.js` part 2. In `harbour.js`: the fish market `harbour:fish-market` is an open hall of its own (it is NOT the 037 `market` archetype plot): 12 m by 6 m, 8 pillars (circle colliders), a roof of ribbed corrugated sheet (a material from `MATERIAL_NAMES`: `metal` if present, else `concrete` with a blue-grey tint; ribs are thin boxes), 4 `table-folding` props (use the existing prop type; if the catalog has no such type take the closest table and say so in the report) with `crate-fish`, `ice-box`, `basket-wicker` and `fish-scale` on and around them, and a `signboard` of the existing sign key `fish-market` (plan 025). Position: on the quay 14 m from the jetty root along the quay edge, 8 m inland, front toward the water; when that spot overlaps a plot, anchor, road buffer or the square, shift it along the quay in 2 m steps up to 20 m (deterministic). `objects` gets `{ type: "fish-market", name: "harbour:fish-market", x, y, z, rot }`.
- Boats from `town.boats` (plan 032 data; the session reads the final kinds and counts): beach catamarans sit on the sand with `y = terrain height at the centre - 0.08` and the terrain under the bow and stern within 0.35 m of that `y`; in-water boats (catamarans and fishing boats) float at `y = WATER_LEVEL + 0.05` (`WATER_LEVEL` from `src/config.js`) and are NOT walkable: each gets a box collider the size of its hull (`harbour:boat-<id>`), and the terrain at their centre is at least 0.3 m below the water level; moored boats lie within 6 m of the jetty segment or the quay edge. Every boat is a `buildProp(kind)` named `harbour:boat-<id>` and gets an `objects` record `{ type: kind, name, x, y, z, rot }` (type `catamaran` or `boat-fishing` exactly, plans 039 and 061 read them).
- `src/world/town/harbourProps.js`: `placeHarbourProps(town, seed)` (pure, deterministic, seed 1337 default, uses `src/util/rng.js`) returns the extra items `[{ type, x, z, rot }]` along the beach and quay: `net-rack` 5, `net-heap` 4, `fish-rack` 6, `crate-fish` 12 (in groups of 2 to 3 near the fish market and the quay), `basket-wicker` 8, `ice-box` 3, `lifebuoy-post` 2 (one at the jetty root, one at the quay end), `anchor-prop` 2, `rope-coil` 6, `mooring-post` 4, `boat-rowing` 3 (on the sand), `driftwood` 10 and `shell-cluster` 12 (beach polygon, near the waterline). On tier `low` the decor kinds (basket, driftwood, shell, rope, crate beyond 6) are scaled by `TIER_SETTINGS.low.decorScale` through a `tier` argument; boats, jetty, racks and nets are never scaled. Items are not on a road buffer, not inside a plot, anchor or the water, and keep 0.5 m between each other. `buildHarbour` places them with `buildProp` and names them `harbour:<type>-<n>`.
- Tests: `placeHarbourProps` determinism (same seed same list, other seed different); the counts above at tier `high`, so `net-rack` at least 4 and nets in total (`net-rack` plus `net-heap`) at least 8, fish racks at least 6; nothing overlaps a plot, anchor, road buffer, the square or the water polygon, and nothing overlaps another item (0.5 m); every type exists in the catalog; from the real `town.json`: catamarans at least 10 (beach ones on the sand per the rule above, in-water ones per the rule above), `boat-fishing` at least 8 (6 in the harbour plus 2 moored) and the moored ones within 6 m of the jetty or quay, no beach boat overlaps a plot or a road buffer (when the plan 032 data fails this, fix `generateBoats` in `plots.js`, run `node scripts/gen-town.mjs` and say so in the report: that is why `plots.test.js` is unfrozen), the fish market is clear of plots, anchors, roads and the square, in-water boats have collider boxes of hull size; at tier `low` the decor count is at most the `decorScale` fraction plus 1 and the boat count is unchanged; `buildHarbour(town, ctx)` in Node returns `objects` containing the types `jetty`, `fish-market`, at least 10 `catamaran`, at least 8 `boat-fishing`, at least 4 `net-rack`, at least 4 `net-heap` and at least 6 `fish-rack` (plan 039 counts these by type and by the `harbour:<type>` name prefix, so the names above are a contract).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/town/harbourLayout.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/town/harbourProps.js`

### Step 4: Areas, spots, Playwright and shots

Deliver:
- `src/world/areas/harbourAreas.js` exports `createHarbourAreas(game, town)` returning two Streamer area definitions (ARCH 10.8: an area below priority 100 needs `unloadRadius > loadRadius`): `harbour` (jetty, quay, market, boats, harbour props; centre = the midpoint between the jetty root and the jetty end, priority 60, `loadRadius` 170, `unloadRadius` 230) and `beach` (beach boats, beach props, driftwood, shells; centre = beach polygon centroid, priority 40, `loadRadius` 160, `unloadRadius` 220). Their `load` builds with `buildHarbour` (the beach part builds only the beach items), first awaits `preloadProps(types, { tier })` (plan 030), adds `root` to the scene, adds every `colliders` and `floors` descriptor to the collision world, pushes `objects` into `game.areaObjects`, and `dispose()` removes all of them (colliders by id, objects from `areaObjects`, lights, geometry). Register both in `src/main.js` with `game.streamer.registerArea` for each returned definition (plan 040 later replaces the per-plan registrations by one `createAllAreas` table). Unit test in `tests/unit/town/harbourAreas.test.js`: two definitions, unique ids, radii rule, the centre is inside the island, `load` with fakes adds and `dispose` removes every collider and every `areaObjects` entry it added.
- Spots: append to `src/budgets.json` AND `src/shots.json` (same `x, y, z, yaw, pitch`, never change an existing one; plan 014 already owns `harbour`, plan 035 `shore` and `harbour-water`, plan 036 `beach`, so use new ids) the three spots `harbour-quay`, `harbour-jetty`, `beach-boats`, written as literal numbers computed from the real data (with `R` the jetty root, `D` the unit jetty direction, `yawJ = atan2(-D.x, -D.z)`): `harbour-quay` camera at `R - 10*D` shifted 3 m along the left perpendicular, `y` = 0.4 + 2.5, yaw `yawJ`, pitch -0.12; `harbour-jetty` camera at `R + 20*D`, `y` = `JETTY_DECK_Y` + 1.8, yaw `yawJ`, pitch -0.05; `beach-boats` camera 14 m from the centroid `C` of the beach catamarans toward the land, `y` = terrain at the camera + 2.5, yaw `atan2(-(C.x - cam.x), -(C.z - cam.z))` (look direction is `(-sin yaw, -cos yaw)`, ARCH 10.8), pitch -0.15; every spot within `WORLD_RADIUS - 5` of the origin. Verify both files carry the three ids (the verify commands below) and that `npx vitest run tests/unit/budgets/budgets.test.js` (plan 014 consistency test) still passes.
- `src/dev/worldHook.js`: no new field is needed (`listObjects()` already returns `areaObjects`).
- `tests/e2e/harbour.spec.js` (URL `?time=0.4&freeze=1`; wait for `ready`; every wait is `expect.poll(..., { timeout: 20000 })`, never a fixed delay): read the jetty record from `listObjects()` (`root`, `dir`, `y`); `teleport(root.x - 4 * dir.x, root.z - 4 * dir.z, undefined, yaw)` with `yaw = atan2(-dir.x, -dir.z)`; hold `w` and poll until the distance from the root along `dir` is at least 30 m, then assert `playerState().y` is within 0.1 of the jetty `y` while the player is on the deck; teleport to mid-jetty facing 90 degrees to the axis (yaw plus or minus 1.5708), hold `w` and poll until the lateral offset stops changing between two polls 500 ms apart: it is at most 1.6 m and `y` is still within 0.1 of the deck; `listObjects()` has at least 10 `catamaran`, a `jetty` and a `fish-market`; `streamState()` shows `harbour` and `beach` `loaded` after teleporting near them; zero console errors; `check:budget` with the three new spots passes.
- Shots: `npm run shots -- --spots harbour-quay,harbour-jetty,beach-boats --plan 038`; open each PNG in `docs/shots/038/` with the Read tool and fix floating boats, boats inside the sand or the jetty, piles showing above the deck, flat colours (best effort, never fails; list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/town/harbourAreas.test.js tests/unit/budgets/budgets.test.js`
- `node "{{runner}}/assert.mjs" has src/budgets.json "harbour-quay"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "harbour-jetty"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "beach-boats"`
- `node "{{runner}}/assert.mjs" has src/shots.json "harbour-quay"`
- `node "{{runner}}/assert.mjs" has src/shots.json "harbour-jetty"`
- `node "{{runner}}/assert.mjs" has src/shots.json "beach-boats"`
- `npx playwright test tests/e2e/harbour.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/harbour.test.js tests/unit/props/allProps.test.js tests/unit/town/harbourLayout.test.js tests/unit/town/harbourAreas.test.js tests/unit/layout/plots.test.js tests/unit/budgets/budgets.test.js`
- `npx playwright test tests/e2e/harbour.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): Catamaran and net detail must look right to someone who knows the coast (D25).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
