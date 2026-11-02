# Plan 020: Building kit shell: manifest schema, walls with openings, floors, roofs and colliders

Epic E2. Estimated turns: 55. Model: opus.

## Goal

Build the generator that turns a building manifest into a walkable building shell: validated schema, wall segments with door and window openings, floor slabs, ceilings, five roof types, perimeter walls split from interior partitions, merged meshes (draw-call budget) and colliders. Everything runs headless so `check:buildings` can build and walk a building in Node. This plan covers geometry and collision only; rooms content, doors, lights and props come in plan 021.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.4, 10.6 and requirement R6, decision D18)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md`
- src/systems/collision/world.js
- src/engine/materials.js
- src/util/uv.js
- src/world/props/catalog.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Manifest schema, the manifest doc and fixtures

Deliver:
- `tests/unit/kit/schema.test.js` first. `src/world/kit/schema.js` exports `validateManifest(m)` returning an array of `{ path, message }` (empty means valid). Implement the format of ARCHITECTURE.md 10.6 exactly and add: top-level `lifts: [{ id, x, z, width, depth, floors: [levelIndex...], rot }]` and per-floor `rooftop: true` (a flat roof level that is walkable and gets a 1.0 m parapet). Checks: required fields and types; unique ids (rooms, doors, windows, stairs, interactables, lifts); every room `floor` exists in `floors`; room `bounds` are `[x0, z0, x1, z1]` with `x1 > x0` and `z1 > z0`, inside `footprint` (centre origin, so x in [-w/2, w/2], z in [-d/2, d/2]); rooms on the same floor do not overlap by more than 0.05 m2; each door `from` and `to` is a room id or `outside`, and the wall of the door lies on the shared boundary of the two rooms (or on the footprint edge for `outside`) within 0.05 m; door and window `at` positions plus half widths stay inside the wall length with 0.3 m margin; `kind` is one of `exterior|interior|decorative`; stairs `from` and `to` are rooms on adjacent floors; interactable `room` exists; `exteriorDetails.class` is one of `window|door|signage|drainpipe|planter|bin|lamp`; `style.roof.type` is one of `hip|gable|flat|dome|cone`.
- `docs/building-manifest.md` documents the schema with one full example and the rules (the next plans and every building plan read it). Create fixtures `tests/fixtures/manifests/cottage.json` (footprint 10 by 8, two rooms `hall` and `bedroom` on floor 0, an exterior door on the south wall, an interior door, two windows, flat roof with parapet, no objects) and `tests/fixtures/manifests/twoStorey.json` (footprint 12 by 10, two floors, stairs, hip roof).
- Tests: the fixtures validate; one test per rule that mutates a valid manifest and expects a message with the right `path`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/schema.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/schema.js docs/building-manifest.md tests/fixtures/manifests/cottage.json tests/fixtures/manifests/twoStorey.json`

### Step 2: Wall segments with openings

Deliver:
- `tests/unit/kit/walls.test.js` first. `src/world/kit/walls.js` exports `buildWallPlan(manifest)` returning `{ boxes, openings }`: for each floor, perimeter walls (thickness 0.3, along the footprint edge, flush inside it) and interior partition walls (thickness 0.15, centred on the shared room edges, de-duplicated so a shared edge yields one wall) from the room bounds; every door and window cuts an opening: a door gives a full-height gap plus a lintel box above `door.height`, a window gives a box below the sill and a box above `sill + height`. Each box is `{ id, cx, cz, hx, hz, rot, yMin, yMax, side: 'perimeter'|'interior', floor }` in building-local coordinates (rotation 0; the world rotation is applied later). Segments shorter than 0.05 m are dropped. A door between a room and `outside` is cut in the perimeter wall; a door between two rooms in the partition.
- Tests on the fixtures: the south door gap is exactly `width` wide; wall plus gaps cover the whole edge length (no leaks, no overlaps beyond 1 mm); a window leaves a sill box and a header box with the right heights; two adjacent rooms share one partition; a door at the very end of a wall (within margin) is rejected by the schema, not by this module; a two-storey manifest yields boxes with `yMin` equal to each floor `y`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/walls.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/walls.js`

### Step 3: Shell meshes: walls, floors, ceilings, roofs, merged by material

Deliver:
- `tests/unit/kit/shell.test.js` first. `src/world/kit/shell.js` exports `buildShell(manifest, ctx)` returning `{ exterior: Group, interior: Group, stats }`. `exterior` holds perimeter walls (outside face uses `style.wall` with `wallTint`, inside face the room wall material, default `plaster`), roof, parapets, window glass (`glass` material); `interior` holds partition walls, room floors (slab 0.2 m thick, `room.floorMaterial`), ceilings, stair bodies are NOT here. Use `applyMetricUV` with the spec tile size so textures tile at real scale. Merge all geometry that shares a material and a group into one mesh (`mergeGeometries`), so the shell of any building uses at most 8 meshes in `exterior` and 10 in `interior` for the fixtures.
- Roofs from `style.roof`: `flat` (slab, parapet 0.9 m high all around, a thin cornice), `hip` and `gable` (pitched prism over the top floor with `overhang`, `pitch` as rise over run, tile material, gable end walls), `dome` (hemisphere on a drum) and `cone` (for towers); the roof sits on the top `floors` entry; a floor marked `rooftop: true` is a flat walkable level with a parapet. Roof geometry covers the whole footprint (bounding box check).
- Tests: every roof type builds with finite geometry whose bounding box covers the footprint plus overhang; mesh counts under the limits; triangle count of the `twoStorey` shell under 6000; `userData.layer` is `exterior` or `interior`; tinting changes the wall material instance but not the texture set; building the same manifest twice gives equal stats.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/shell.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/shell.js`

### Step 4: Collision wiring and the walk-through test

Deliver:
- `src/world/kit/collide.js` exports `addShellColliders(world, manifest, plan, placement)` where `placement = { x, z, rot, y }` is the world placement: every wall box becomes `addBox` with id `<building>:wall:<n>` transformed to world coordinates (rotation supported); every room floor becomes `addFloor` at its floor `y`; stairs become `addStair` with rails; rooftop floors become `addFloor`; returns the list of ids so the building can remove them. Roofs of pitched types are not walkable.
- `tests/unit/kit/collide.test.js`: with the `cottage` fixture placed at (20, -15) rotated 30 degrees: a circle walks from outside through the south door into `hall`, through the interior door into `bedroom`, is blocked by every other wall, cannot walk through a window opening (the sill box blocks), and can stand on the floor at `y` 0; with `twoStorey`: walks up the stairs to floor 1 and the ground-floor walls do not block there.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/collide.test.js tests/unit/kit/shell.test.js tests/unit/kit/walls.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/collide.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/kit/schema.test.js tests/unit/kit/walls.test.js tests/unit/kit/shell.test.js tests/unit/kit/collide.test.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
