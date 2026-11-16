# Plan 049: Harbour ferry terminal and bus stop (zone transport)

Epic E4. Estimated turns: 60. Model: opus.

## Goal

Build the TransGenie ferry terminal on the quay: a covered concourse with ticket counters and departure boards, a waiting hall, a terminal office, a covered canopy on the quay side, and a gangway from the quay to a moored ferry-small boat (new set file, see the props step). The bus stop is the bus-shelter that plan 039 already places beside the transport anchor: this plan reuses it and adds only a timetable board. The large departure board in the concourse opens the TransGenie transport project dialogue. Layout in one line (building-local metres, origin at the footprint centre, +z = quay side and south, -z = road side and north; footprint 28 by 16: x -14 to 14, z -8 to 8; the `transport` anchor in town.json (plan 032) gives the world origin): waiting hall x -12 to -4, z -8 to 0 (8 by 8, north-west); concourse x -4 to 8, z -8 to 2 (12 by 10, the MAIN ROOM, north-centre); terminal office x -4 to 2, z 2 to 7 (6 by 5, south-west, below the concourse). The room bounds tile the building; every footprint cell outside a room is OUTSIDE the walls (road plaza to the north and east, quay canopy to the south at z 2 to 8, x 2 to 14). Every coordinate below is a target: `checkBuilding` is the judge; when the placer reports a collision, nudge by at most 0.4 m inside the same room and list it under `different_from_plan`.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only transport`).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.6 and requirement R6, R8, decision D4, D9, D18, A5, A30)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/building-manifest.md
- src/world/buildings/plaza/manifest.json
- src/world/buildings/plaza/build.js
- src/world/kit/exterior.js
- src/world/kit/building.js
- src/world/layout/town.json
- src/world/zones.js
- src/content/dialogues.js
- src/content/signage.js
- scripts/check-buildings.mjs
- docs/plans/realistic-world-overhaul/038-*.md
- docs/plans/realistic-world-overhaul/039-*.md
- docs/plans/realistic-world-overhaul/041-*.md
- docs/plans/realistic-world-overhaul/042-*.md
- docs/plans/realistic-world-overhaul/043-*.md
- src/world/props/sets/transport.js (plan 044)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Ferry Terminal

Deliver:
- Create `src/world/buildings/transport/manifest.json` (schema of `docs/building-manifest.md`): `id: "transport"`, `displayName: "Ferry Terminal"`, `prompt: "enter hub"`, footprint taken from the `transport` anchor in `src/world/layout/town.json` (about 28 by 16 m (the room tiling below covers x -12 to 8 and z -8 to 7; the rest is canopy and plaza, see the goal); the `transport` anchor of town.json (plan 032) gives the origin), floors one floor (level 0, y 0, height 4.4), style: plaster wall tint `#d9e6ef`, `gable` roof with `metalPainted` (blue), pitch 0.2, trim `metalPainted`; the quay canopy is a flat-roofed steel frame on 6 columns, not part of the rooms.
- Rooms (ids fixed): `concourse` (main concourse, 12 by 10 m, bounds `[-4, -8, 8, 2]`, the MAIN ROOM (the room of the road door and the quay door; the departure board is on its north wall)); `waiting-hall` (waiting hall, 8 by 8 m, bounds `[-12, -8, -4, 0]`, reached from the concourse through the hall door in its east wall); `terminal-office` (terminal office, 6 by 5 m, bounds `[-4, 2, 2, 7]`, south of the concourse, reached through the office door in the concourse south wall). Room count between 3 and 6.
- Doors: four doors (`at` is the offset in metres along the wall from the wall centre, ARCHITECTURE 10.8; the wall letter is relative to the building anchor rotation): `road-door` from `outside` to `concourse`, wall N (z -8), at 2.0 (x 4), width 3.0, height 2.6, kind `exterior`, unlocked; `quay-door` from `outside` to `concourse`, wall S of the concourse (z 2), at 3.5 (x 5.5), width 3.0, height 2.6, kind `exterior`, unlocked; `hall-door` from `concourse` to `waiting-hall`, wall W of the concourse (x -4), at -1.0 (z -4), width 2.4, height 2.4, kind `interior`, unlocked (the wide opening); `office-door` from `concourse` to `terminal-office`, wall S of the concourse (z 2), at -4.5 (x -2.5), width 1.0, height 2.2, kind `interior`, unlocked. Every room is reachable from the road door and the quay door with the interior doors open.. At least one unlocked exterior door that is not decorative. Windows: ten windows (at least 8), all sill 1.0 and height 1.8: `w-1` waiting-hall N wall (z -8) at -2.0 (x -10), width 1.2; `w-2` waiting-hall N wall at 1.0 (x -7), width 1.2; `w-3` waiting-hall W wall (x -12) at -2.0 (z -6), width 1.2; `w-4` waiting-hall W wall at 2.0 (z -2), width 1.2; `w-5` concourse N wall (z -8) at 5.0 (x 7), width 1.0; `w-6` concourse E wall (x 8) at -3.0 (z -6), width 1.2; `w-7` concourse E wall at 2.0 (z -1), width 1.2; `w-8` terminal-office S wall (z 7) at -1.0 (x -2), width 1.0; `w-9` terminal-office S wall at 1.0 (x 0), width 1.0; `w-10` terminal-office W wall (x -4) at 0.0 (z 4.5), width 1.0. The walls facing the outside are the only walls with windows.. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 10, door 2, signage 3, drainpipe 4, planter 4, bin 4, lamp 8; plus the quay canopy columns, the gangway and rails, bollards, lifebuoys and the timetable board (listed in the exterior step). `interactables`: declare only `departure-board` now (kind `read`, room `concourse`, `dialogueKey` `main`, prompt "enter hub").
- `tests/unit/buildings/transport.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; both exterior doors (`road-door` and `quay-door`) are 3.0 m wide and unlocked; the manifest has exactly four doors and ten windows; floor height 4.4; the rooms tile as the bounds say (no two rooms overlap); the CLI `check:buildings --only transport --stage structure` exits 0.
- Manifest data (exact; all x, z building-local): `footprint { w: 28, d: 16 }`; rooms `concourse` `[-4, -8, 8, 2]`, `waiting-hall` `[-12, -8, -4, 0]`, `terminal-office` `[-4, 2, 2, 7]` (floor 0; floorMaterial `stonePaving`, `floorTile`, `woodPlanks`); the doors and windows exactly as above; the manifest `stage` is `structure` in this step (step 4 changes it to `full` and asserts it with json); `interactables` declare `departure-board` only (ARCHITECTURE 10.8 ignores manifest door interactables; the gangway is not a manifest door).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/transport.test.js`
- `node scripts/check-buildings.mjs --only transport --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/transport/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/transport/build.js` exports `decorateTransport(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): the exterior is built by `src/world/buildings/transport/build.js` `decorateTransport(instance, ctx)` (all via `instance.addDetail`) with the kit `src/world/kit/exterior.js` and the extension items above. Signs: `signboard({ key: "ferry", w: 3.6, h: 0.9, style: "board" })` lit, on the canopy fascia (declared signage 1); `signboard({ key: "ferry", w: 2.0, h: 0.6, style: "plaque" })` on the road door lintel (declared signage 2); the timetable board (declared signage 3, above). Lights register in group `transport:sign`, `auto: "dusk"`. The generic placer builds windows 10, doors 2, drainpipes 4, planters 4 (placed by the generic placer), bins 4, and lamps 8 (wall lamps beside the road door, the quay door and the windows; group `transport:exterior`, `auto: "dusk"`). Mesh budget: `exterior-details` at most 14 meshes; the canopy, gangway, rails, bollards and buoys go to a separate group `transport-extras` (at most 30 meshes). Colour: plaster wall tint `#d9e6ef`, blue `metalPainted` roof.
- Signage from `src/content/signage.js`: add the keys `ferry` (FERRY TERMINAL / படகுத்துறை) on the canopy and the road door plaque, and `timetable` (TIMETABLE / கால அட்டவணை) on the timetable board; both keys are digit-free; the Tamil words are a draft for the human check (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/transportExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- Registry: `src/world/buildings/registry.js` gets `import { decorateTransport } from "./transport/build.js"` and `DECORATORS.transport = { decorate: decorateTransport, skipGeneric: ["signage", "planter", "bin", "lamp"] }` (the plan 048 pattern); a unit test asserts `getDecorator("transport")` returns that entry.
- Bus stop (NO second shelter): plan 039 already places one `bus-shelter` (plan 029 prop) and one `bus-town` beside the `transport` anchor, the shelter 4 m before the bus. This plan reads the placed positions from the 039 output (`src/world/layout/localDetail.json` and the local-detail placement list) and does not build a shelter. It adds one `timetable` sign board (`signboard({ key: "timetable", w: 1.0, h: 0.7, style: "board" })`) on a post 1.5 m beside the 039 shelter, on the side away from the bus. A unit test asserts: the timetable post is at least 1.2 m from the 039 shelter and at least 2.0 m from the 039 bus-town box (bus-town is 10 m long), and no 049 object overlaps the 039 items.
- Ferry (new set file, see the props step): `ferry-small` is placed by the decorate code of this plan (`decorateTransport` computes the berth from town.json and adds the ferry with `instance.addDetail` and its own collider and deck). The ferry is listed in `game.areaObjects` with type `ferry-small`.
- Gangway: the walkable ramp runs from the quay strip at (5.5, 9.0) (building-local, just beyond the canopy edge at z 8, in front of the quay door) to the ferry deck rail at (5.5, 15.0): length 6.0 along +z, width 2.0 (x 4.5 to 6.5), top height 1.0, bottom height 0.4 (the quay top, plan 038 note), slope 0.6 over 6.0 = 0.1. It is one `addFloor` ramp (plan 033 API). Rails: 0.9 high on both sides, colliders 0.1 thick (ids `transport:gangway-rail-west` and `transport:gangway-rail-east`), no rail at the two landing ends.
- Ferry berth and deck: the ferry-small long axis is parallel to the quay (rot 1.5708), centre (5.5, 17.1), so its quay-facing side is at z 15.0 (6.0 m seaward of the quay edge at z 9.0) and its deck spans x -3.5 to 14.5, z 15.0 to 19.2. Deck top height 1.0 (one `addFloor` over the deck rectangle, not over the hull). The hull is one solid collider box per deck. A 2.0 m boarding gap at x 4.5 to 6.5 on the deck rail, the rest of the deck edge has a rail. Clearance test: the ferry is at least 6.0 m from every plan 038 jetty box (the jetty is 55 m by 4 m from the quay root) and at least 8.0 m from every `boats[]` entry of town.json with place `jetty` or `harbour`.
- Exterior extras (new builders in `src/world/kit/exterior.js`, `detailClass` `extra`): `canopy({ w: 14.0, d: 6.0, height: 4.2 })` on six `metalPainted` columns at x 2.0, 8.0 and 14.0 on the lines z 2.0 and z 8.0, over the quay side; `bollard()` (reused from plan 047) x4 on the quay strip at (3.0, 9.6), (8.0, 9.6), (3.0, 12.0) and (8.0, 12.0); `lifebuoy-ring` x2 on the ferry rail at (4.4, 15.0) and (6.6, 15.0) (boarding gap, not blocking the gangway).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/transportExterior.test.js`
- `node scripts/check-buildings.mjs --only transport --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/transport/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- New props first (category `transport`, file `src/world/props/sets/ferry.js`, same quality bar and metadata rules as plans 019 and 022): `ferry-small`. New set file `src/world/props/sets/ferry.js` (NOT `harbour.js`: plan 038 freezes the exact TYPES of that file). Table: `ferry-small` [4.2, 5.0, 18.0] solid, `mount: "floor"`, `seats: []`, bounding box with the front toward +z, origin at the waterline centre. Parts: a hull box 4.2 wide by 1.6 high by 18.0 long with a pointed bow at +z (a tapered prism), a main deck slab with its top at y 1.0 (the deck), a wheelhouse box [2.4, 2.0, 3.0] at the aft third on the deck, two `metalPainted` rails along the deck edges (0.9 high), and one lifebuoy ring. The only meta key: `animated: { kind: "bob", amp: 0.05, period: 4.0 }` (numbers, consumed by plan 061). Register it in `src/world/props/index.js` with one import line and add `ferry-small` to the catalog; the catalog total test (plan 042, at least 232 types) still passes.. Register them in `src/world/props/index.js` and add `tests/unit/props/ferry.test.js` (exact list, sizes within 20 percent of the bounding box, categories, the exact TYPES list, the bounding box within 20 percent, `animated` numbers, solid, not seated, and the deck top at y 1.0 (the `addFloor` height)).
- Room `concourse` (floor material `stonePaving`): (all `x, z, rot`; wall items use the wall position, they are modelled at their mounting height) `departure-board` at (0.5, -7.9, 0) (the READ board, north wall, from plan 044) and `departure-board` at (-3.9, -0.5, 1.5708) (west wall); `ticket-counter` at (-0.5, -6.0, 0) and (2.5, -6.0, 0) (plan 044); `ticket-machine` at (-2.8, -7.2, 0) and (6.4, -7.2, 0) (plan 044); `route-map-board` at (0.5, 1.9, 0) (south wall, plan 044); `bench-bus-stop` at (1.0, -2.0, 0), (3.5, -2.0, 0) and (6.0, -2.0, 0) (seats); `luggage-trolley` at (-2.0, -2.0, 0.3) and (-2.0, -0.6, 0.3); `luggage-suitcase` at (-0.6, -0.7, 0), (0.2, -0.3, 0) and (-1.2, 0.2, 0); `luggage-scale` at (2.6, 0.6, 0) (plan 044); `plant-potted-large` at (7.4, -5.0, 0), (7.4, 0.5, 0) and (3.9, 0.6, 0); `life-jacket-rack` at (7.4, -3.0, -1.5708) (plan 044); `fan-ceiling` place ceiling at (-2.0, -4.0), (2.0, -4.0), (6.0, -4.0) and (2.0, 0.5); `lamp-pendant` place ceiling at (-1.0, -1.0), (3.0, -1.0), (5.0, -5.0) and (-2.0, -6.5); `sign-board` key `ferry` at (2.0, -7.9, 0) and (-3.9, -7.0, 1.5708); `trash-bin-small` at (7.4, -6.5, 0), (7.4, -1.5, 0) and (-3.6, 0.8, 0); `wall-clock` at (-2.0, -7.9, 0) and (7.9, -4.0, -1.5708); `water-dispenser` at (-1.6, 0.8, 0); `notice-board` at (7.9, -2.0, -1.5708); `exit-sign` at (4.0, 1.9, 3.1416) above the quay door; `fire-extinguisher` at (-3.8, -1.6, 1.5708). Lights: group `transport:concourse` (`con-1` at (-1.0, 2.6, -5.0), `con-2` at (4.0, 2.6, -5.0), `con-3` at (0.0, 2.6, -1.0), `con-4` at (6.5, 2.6, -1.0)), colour `#f5f7ff`, intensity 12, distance 8, `auto: "dusk"`; switch `sw-concourse` at (-3.8, 1.2, 1.2) on the west wall.
- Room `waiting-hall` (floor material `floorTile`): (all `x, z, rot`) `chair-waiting` at (-10.5, -6.0, 0), (-9.0, -6.0, 0), (-7.5, -6.0, 0), (-10.5, -4.0, 3.1416), (-9.0, -4.0, 3.1416) and (-7.5, -4.0, 3.1416); `bench-wood` at (-9.5, -1.4, 0) and (-6.5, -1.4, 0); `table-coffee` at (-10.5, -2.6, 0) and (-7.0, -2.6, 0); `magazine-rack` at (-11.6, -7.0, 0); `water-dispenser` at (-5.4, -1.0, 0); `wall-tv-large` on the west wall at (-11.9, -4.0, 1.5708) (between the two west windows, its 1.45 m slot fits there); `vending-machine` at (-4.8, -7.2, -1.5708); `coffee-machine` at (-5.0, -2.6, 0); `plant-potted-small` at (-11.6, -0.5, 0), (-7.4, -0.5, 0) and (-11.6, -6.6, 0); `ac-split` on the north wall at (-8.5, -7.9, 0) and on the west wall at (-11.9, -7.4, 1.5708); `ceiling-panel-light` place ceiling at (-10.5, -6.0), (-7.5, -6.0), (-10.5, -2.0), (-7.5, -2.0), (-10.5, -6.0 second row at y 4.2) and (-7.5, -2.0 second row); `rug-rect` at (-8.5, -4.0, 0); `wall-clock` at (-5.0, -7.9, 0); `picture-frame-set` on the west wall at (-11.9, -1.0, 1.5708) and on the south wall at (-8.0, -0.02, 3.1416); `lamp-floor` at (-11.5, -2.6, 0); `trash-bin-small` at (-4.8, -0.6, 0) and (-11.6, -4.6, 0). Lights: group `transport:waiting` (`wai-1` at (-8.0, 3.2, -6.0) and `wai-2` at (-8.0, 3.2, -2.0)), colour `#fff1d0`, intensity 10, distance 7, `auto: "dusk"`; switch `sw-waiting` at (-4.8, 1.2, -1.2).
- Room `terminal-office` (floor material `woodPlanks`): (all `x, z, rot`) `desk-office` at (-2.5, 4.0, 0) and (0.5, 4.0, 0); `chair-office` at (-2.5, 5.2, 3.1416), (0.5, 5.2, 3.1416) and (-1.0, 6.2, 3.1416); `monitor-desktop` x2 with `place: "on:desk-office"` (one on each desk); `keyboard-mouse` x2 with `place: "on:desk-office"`; `phone-desk` at (1.5, 6.4, 0); `filing-cabinet` at (-3.6, 6.4, 1.5708) and (-3.6, 5.4, 1.5708); `cabinet-low` at (1.6, 6.5, 0); `printer-copier` at (0.8, 2.6, 0); `whiteboard-rolling` at (1.7, 3.8, -1.5708); `wall-clock` at (-0.8, 2.1, 0) (north wall, the concourse wall); `fan-ceiling` place ceiling at (-1.0, 4.5); `plant-office` at (1.6, 2.6, 0); `water-filter` at (1.6, 5.2, 0); `lamp-table` at (1.9, 3.0, 0). Lights: group `transport:office` (`off-1` at (-1.0, 2.6, 4.5) and `off-2` at (0.5, 2.6, 6.0)), colour `#dfeaff`, intensity 10, distance 6, no `auto`; switch `sw-office` at (-3.8, 1.2, 6.0).
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: departure-board (`read`, the object is the large departure board on the north wall of the concourse at (0.5, -7.9, 0) (the plan 044 departure-board, eight text slots row-1 to row-8)); light switches per room; seats the concourse benches (`sit-bench-1` to `sit-bench-3` on `bench-bus-stop`), the waiting-hall chairs (`sit-wait-1` to `sit-wait-6` on `chair-waiting`) and the bench (`sit-wood-1` and `sit-wood-2` on `bench-wood`); the ferry has no seat interactables (the cabin is not walkable).
- Switches: `sw-concourse`, `sw-waiting`, `sw-office`, one per room, each on its wall beside the room door. The ticket counters and the ticket machines are solid (plan 044 colliders); the walk graph passes around them.
- Types: the concourse has 19 distinct types, the waiting hall 16, the terminal office 15 (the main room needs 14). Types from plan 044 (`ticket-counter`, `ticket-machine`, `departure-board`, `luggage-scale`, `route-map-board`, `life-jacket-rack`) are reused, not rebuilt. If `bench-bus-stop` is not in the catalog, use `bench-wood` and list it under `different_from_plan`.
- `tests/unit/buildings/transportInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the gangway is walkable from the quay to the ferry deck (walk graph of the floor: the ramp and the deck are floors, the hull is solid), the deck edge blocks except at the boarding gap; the ferry clearance from the 038 jetty and boats holds; every room is reachable from the road door and the quay door.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/transportInterior.test.js tests/unit/props/ferry.test.js tests/unit/props/allProps.test.js`
- `node scripts/check-buildings.mjs --only transport`

### Step 4: Convert the zone, stream it, Playwright, budgets and shots

Deliver:
- `src/world/zones.js`: `transport` becomes `name: "Ferry Terminal"`, `prompt: "enter hub"`, `mode: "object"` (ARCHITECTURE 10.7, A30). Update the transport dialogue title in `src/content/dialogues.js` (facts unchanged). Remove the v1 transport factory from `src/world/buildings.js` with its collider and animation hooks; record the removed identifier in the report and check it with `none` in the verify list. The README zone table label is in the plan `allowed` list (plan 043 pattern); the minimap label file is named in the report, or it becomes a human_check item if it is outside the allowed paths.
- The transport area is registered with one line `registerLandmarkArea(createTransportArea)` in `src/world/areas/index.js` (plan 040), file `src/world/areas/transportArea.js` exporting `createTransportArea`: priority 30, loadRadius 120, unloadRadius 170, interior true; a unit test asserts those values. The factory awaits `preloadBuildingProps(manifest, ctx)` before `buildBuilding`. The read interactable `departure-board` opens the existing dialogue for `transport` (A5). `tests/fixtures/zoneExpect.json` already has `transport` (plan 043): no change.
- The E key is the only interaction key: a teleport to 2.5 m in front of the board, with `E` pressed AWAY from the board (at (0.5, -4.0)), does NOT open the dialogue (`#dialogue` stays hidden); this checks `mode: "object"`. The v1 transport factory removal is checked with `none`.
- `tests/e2e/transport.spec.js` (generated name, frozen) on `/?only=transport&time=0.5&freeze=1&seed=1337`: teleport 6 m in front of the road door, `e` opens it, walk in with no loader; `listBuildings()` shows `transport` with `interiorVisible` true and no problems; teleport to 2.5 m in front of the departure board, press `e`, `#dialogue` is visible and contains every string of `zoneExpect.json` for transport plus the display name, Escape closes; the gangway and deck checks of the e2e extra (all with `expect.poll`, no fixed waits); zero console errors.
- Budget and shot spots (ids of this plan only): `transport-outside` (budget and shot) camera at local (0, 17.0), height 4.0, yaw 0, pitch 0.1 (on the quay side, looking north at the terminal); `transport-inside` (budget and shot; the main room concourse) camera at local (0.0, 0.0), height 1.6, yaw -0.063, pitch 0 (it looks north at the departure board (0.5, -7.9)); `ferry-terminal-quay` (shot only) camera at local (16.0, 16.0), height 2.0, yaw 0.6 (it looks at the gangway and the ferry deck). World = anchor (x, z read from town.json, ground y from town.json) plus local, with the rotation from town.json added to the yaw; the anchor values are written into both files. `has` checks on both files; `npm run check:budget` passes; run `npm run shots -- --plan 49 --spots transport-outside,transport-inside,ferry-terminal-quay`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures and black rooms (best effort, list the fixes under `different_from_plan`).
- Signage: the keys `ferry` and `timetable` exist in `src/content/signage.js` (asserted with `has`); the manifest `stage` is set to `full` (json assert below).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/transport.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only transport`
- `node "{{runner}}/assert.mjs" json src/world/buildings/transport/manifest.json stage full`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "transport"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createTransportArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "DECORATORS.transport"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "timetable"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "ferry"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "transport-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "transport-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "transport-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "transport-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "ferry-terminal-quay"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/transport.test.js tests/unit/buildings/transportExterior.test.js tests/unit/buildings/transportInterior.test.js`
- `node scripts/check-buildings.mjs --only transport`
- `npx playwright test tests/e2e/transport.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the terminal against a real ferry jetty and the gangway slope. The Tamil of the two keys (படகுத்துறை, கால அட்டவணை) is a draft: review it.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
