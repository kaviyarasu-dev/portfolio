# Plan 021: Building kit part 2: walk graph, object placement, doors, lights, lifts and the BuildingInstance

Epic E2. Estimated turns: 55. Model: opus.

## Goal

Complete the kit: a generic walk-graph (reachability using the real collision world), automatic and explicit object placement from the manifest with overlap and door-clearance checks, doors built from manifest entries (plan 017), lights registered with the light manager (plan 012), lifts (plan 018), and the single entry point `buildBuilding(manifest, ctx)` returning a `BuildingInstance` that can show or hide its interior. A cottage fixture proves it end to end in the browser.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.4, 10.6 and decisions D18, D19, assumptions A10, A11)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/building-manifest.md
- src/world/kit/schema.js
- src/world/kit/shell.js
- src/world/kit/collide.js
- src/world/kit/walls.js
- src/world/props/catalog.js
- src/systems/interaction/doors.js
- src/systems/interaction/elevator.js
- src/systems/lights/lightManager.js
- src/systems/interaction/lightSwitch.js
- src/systems/interaction/sit.js
- src/systems/collision/world.js
- tests/fixtures/manifests/cottage.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Walk graph (reachability with the real movement rules)

Deliver:
- `tests/unit/nav/walkGraph.test.js` first. `src/systems/nav/walkGraph.js`: `reachableFrom(world, start, { cell = 0.4, radius = 0.35, bounds, maxStates = 400000 })` does a breadth-first search over states `(ix, iz, yq)` (`yq` = ground height rounded to 0.1 m) using `world.moveCircle` for each of 8 neighbour moves: a move is allowed when `blocked` is false and the position reached is within 0.05 m of the target cell centre. Returns `{ has(x, z, y), cells, states }`. `canReach(world, from, to, opts)` returns true when `to` is within one cell of a reached state. `findPath(world, from, to, opts)` returns a list of `{ x, z, y }` waypoints (A* on the same moves, then string-pulled with `raycast2D`), or null.
- Tests on a hand-built world: open field reachable; a wall splits two areas; a gap of 0.6 m is not passable but 1.2 m is; stairs connect two floors (reach the top); a disabled box (open door) connects rooms; `maxStates` exceeded throws a clear error; `findPath` waypoints never cross a wall.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/nav/walkGraph.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/nav/walkGraph.js`

### Step 2: Object placement

Deliver:
- `tests/unit/kit/place.test.js` first. `src/world/kit/place.js`: `placeObjects(room, manifest, { getMeta, rng })` returns `{ items: [{ type, x, y, z, rot, room, on? }], problems: [] }`. `getMeta(type)` returns `{ size: [w, h, d], solid }` (inject `getPropMeta`). Rules: `place: "wall:N|E|S|W"` puts props against that wall inside the room, back to the wall (rot so +z faces into the room), offset `d/2 + 0.05`, spread evenly along the free length of the wall and never inside a door or window opening plus 0.5 m on each side; `corner:NE|NW|SE|SW`; `center`; `grid:RxC` (spacing = prop size + 0.45 m, centred in the room, rows along x); `ceiling` (y = room ceiling height minus prop height); `on:<type>` (placed on the top of the first item of that type in the same room: y = item y + item height, x and z of the item); explicit `x`, `z`, `rot`, `y` win. Coordinates are building-local. `count` repeats a placement.
- Problems reported (never silently fixed): a solid prop whose footprint leaves the room bounds; two solid props whose footprints overlap by more than 5 percent of the smaller; a solid prop inside the 1.0 m by door-width clearance rectangle in front of any door of the room; a `wall:` placement that does not fit (not enough free wall length); `on:` target missing.
- Tests: each `place` kind with known sizes gives exact coordinates; doors keep their clearance; overlapping explicit props are reported; grid 2x3 inside a 6x4 room; unfit wall placement reported; determinism with the same seed.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/place.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/place.js`

### Step 3: Doors, lights, lifts, interactables and the BuildingInstance

Deliver:
- `tests/unit/kit/building.test.js` first, using `tests/fixtures/manifests/cottage.json` and `twoStorey.json` (extend copies of them in new fixture files `cottageFull.json` with two lights, a switch interactable, a read interactable, a seat, three props from the catalog; do not edit the frozen originals).
- `src/world/kit/doors.js` (`buildDoors`): for every manifest door make a frame (jambs and lintel boxes in `style.trim`), a leaf mesh (`woodDark` panel with a handle) in a pivot at the hinge, and a `createDoor` from plan 017; `kind: "decorative"` gives a fixed leaf with a collider and no interactable; `locked: true` is locked. `src/world/kit/lights.js` (`buildLights`): registers each `room.lights` entry with the light manager (group, auto, emissive bulb mesh as a small sphere using `emissiveWarm`); `src/world/kit/lifts.js` (`buildLifts`): shaft walls with openings at each floor, cabin, buttons via `createLift`.
- `src/world/kit/building.js`: `buildBuilding(manifest, ctx, placement = { x: 0, z: 0, rot: 0, y: 0 })` where `ctx = { collision, interaction, lightManager, events, getMaterial, getPropMeta, buildProp, rng, registerSeat, registerSwitch, registerRead, scene? }` returns `BuildingInstance { id, root, exterior, interior, rooms, doors, lights, lifts, items, problems, collisionIds, setInteriorVisible(bool), insideRoom(x, z, y), isNear(x, z), update(dtMs, playerPos), dispose() }`. It builds the shell (plan 020), adds collision, places objects (props are `buildProp`, instanced into the `interior` group; solid props add collision boxes from their size and rotation), registers interactables from the manifest (`read` through `registerRead`, `sit` through `registerSeat` using the prop `seats`, `switch` through `registerSwitch`), and collects `problems` from placement. `update` shows the interior when the player is inside the footprint or within 3 m of an exterior door and hides it otherwise (`interior.visible`), never toggling more than once per 200 ms. `dispose` removes every collider, interactable, light and door it created. Headless: with stub contexts everything works in Node.
- Tests: instance has the right room, door and light counts; every interior door and the exterior door can be opened (`doors[i].use`) and then the walk graph reaches both rooms from outside, with the doors closed it does not; a locked interior door keeps its room unreachable; props produce collision (a circle cannot walk through a placed solid bed) and are inside their rooms; visibility toggling with hysteresis; `dispose` leaves the world empty (`collision.list()` length 0); lift shaft in `twoStorey` variant reachable by walk graph only through stairs or lift.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/building.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/building.js src/world/kit/doors.js src/world/kit/lights.js src/world/kit/lifts.js tests/fixtures/manifests/cottageFull.json`

### Step 4: Cottage fixture and Playwright

Deliver:
- `src/dev/fixtures/cottage.js`: builds `cottageFull.json` with the real context (`game.collision`, registry, light manager) at the origin on a flat floor; spawn 6 m south of the door. Register it as `cottage`.
- `tests/e2e/cottage.spec.js` on `?fixture=cottage&time=0.5`: from the spawn the interior is hidden (`listObjects()` reports `interiorVisible: false` for the building); walk to the door, `e` opens it, walk in, interior visible; press `e` at the switch and the room light group turns on; `e` at the seat sits; zero console errors. Add a hook field `listBuildings()` returning `[{ id, interiorVisible, rooms, problems }]`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/cottage.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/cottage.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/nav/walkGraph.test.js tests/unit/kit/place.test.js tests/unit/kit/building.test.js tests/unit/kit/collide.test.js`
- `npx playwright test tests/e2e/cottage.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
