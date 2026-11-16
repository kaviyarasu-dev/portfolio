# Plan 046: GravityWrite HQ (zone citadel), part 2: newsroom, meeting room, executive office, server room, rooftop

Epic E4. Estimated turns: 60. Model: opus.

## Goal

Finish the tower: furnish the newsroom, the meeting room (its wall screen opens the featured-project dialogue), the executive office, the server room and the rooftop, then convert the zone and prove it in the browser. Plan 045 owns the structure, facade, lobby, lift, stairs and the manifest `citadel`. This plan EDITS that manifest: it adds objects, lights, switches, seats and floor plates, and changes the top-level `"stage"` from `structure` to `full`. It never rewrites rooms, bounds, floors, stairs, lifts, doors, windows or exterior details. The 045 frozen tests (`citadel.test.js`, `citadelExterior.test.js`, `citadelLobby.test.js`) are not edited; this plan writes its own tests named `citadelFloors*`.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only citadel`).

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

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Manifest: edit the plan 045 structure to stage full (objects, lights, switches, seats, floor plates)

Deliver:
- EDIT `src/world/buildings/citadel/manifest.json` (created by plan 045; do NOT create it, do NOT rewrite its structure: rooms, bounds, floors, stairs, lift, doors, windows, exteriorDetails and the `meeting-screen` interactable stay exactly as plan 045 wrote them). Add to the rooms of levels 1 to 4 the `objects` and `lights` given in the room rows of this plan (a `grid:2x4` or `grid:2x5` is written out as explicit x, z lists, the placer checks them). Add the switches `sw-newsroom`, `sw-meet-front`, `sw-meet-back`, `sw-exec` (kind `switch`, with the room and group named above), the seats `sit-meet-1` to `sit-meet-6` (kind `sit`, room `meeting-room`, at the six conference chairs of the north and south rows at x 1.6, 2.8, 4.0, with object `chair-conference`), `sit-bean-1` to `sit-bean-3` (kind `sit`, room `newsroom`, on the three bean bags), and the floor plates (the `sign-board` objects of rooms newsroom, meeting-room, server-room and rooftop). Set the top-level `"stage"` to `full`. The rooms rule (12 distinct types per room, default) is met by every room; the lobby keeps `roomMin` `{ "lobby": 14 }`.
- Tests first: `tests/unit/buildings/citadelFloors.test.js` (new, frozen). It asserts the NEW content, so it fails before the work: `checkBuilding(manifest, { stage: "full" })` has no problems; the five rooms newsroom, meeting-room, executive-office, server-room and rooftop each have at least 12 distinct catalog types; newsroom has 8 `desk-cubicle` and 8 `chair-office` at the desks; the meeting table has 14 `chair-conference`; the server room has 10 `server-rack` in two columns; the lights of the groups `citadel:newsroom-a`, `citadel:newsroom-b`, `citadel:newsroom-c`, `citadel:meeting-front`, `citadel:meeting-back`, `citadel:exec`, `citadel:server` and `citadel:roof` exist with the groups above; the switches `sw-newsroom`, `sw-meet-front`, `sw-meet-back`, `sw-exec` exist; `sit-meet-1` to `sit-meet-6` and `sit-bean-1` to `sit-bean-3` exist; the head of the meeting table (7.0, 3.2) is within 6 m of the stair s2 arrival landing at local (8.0, -1.3) (4.6 m); the `meeting-screen` interactable is still at x 9.3, z 3.2 (plan 045); the four floor plates exist with the texts `citadel-floor-first`, `citadel-floor-second`, `citadel-floor-third`, `citadel-floor-fourth`; the stair core x 4.9 to 10.65, z -8.7 to -0.5 and the lift strip contain no object (except the stair-core-free rule of plan 045); `check:buildings --only citadel --stage full` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadelFloors.test.js`
- `node scripts/check-buildings.mjs --only citadel --stage full`
- `node "{{runner}}/assert.mjs" json src/world/buildings/citadel/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/world/buildings/citadel/manifest.json "sit-meet-1"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/citadel/manifest.json "sw-meet-back"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/citadel/manifest.json "citadel-floor-fourth"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/citadel/manifest.json "meeting-screen"`

### Step 2: Signage: four floor-plate keys (words, no digits) and their test

Deliver:
- Add four keys to `src/content/signage.js` (the module plan 045 uses; read how plan 025 adds keys): `citadel-floor-first` { en: "FIRST FLOOR", ta: "முதல் தளம்" }, `citadel-floor-second` { en: "SECOND FLOOR", ta: "இரண்டாம் தளம்" }, `citadel-floor-third` { en: "THIRD FLOOR", ta: "மூன்றாம் தளம்" }, `citadel-floor-fourth` { en: "FOURTH FLOOR", ta: "நான்காம் தளம்" }. Digits are not allowed in keys (the frozen plan 025 signage test). The Tamil words are a draft for the human check.
- Tests: in `tests/unit/buildings/citadelFloorsExterior.test.js` (new, frozen; it is written first and fails before the keys exist): `SIGNS["citadel-floor-first"]` and the other three equal the strings above; no key of `citadel` contains a digit; `getDecorator("citadel").skipGeneric` still equals `["signage", "planter", "bin", "lamp"]` (plan 045 registry entry, unchanged); the exterior detail counts of plan 045 are unchanged (`countDetails` window 30, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadelFloorsExterior.test.js`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "citadel-floor-first"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "citadel-floor-fourth"`
- `node scripts/check-buildings.mjs --only citadel --stage full`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `newsroom` (floor material `carpet`): (all `x, z, rot`; wall items have `y` 0 and are modelled at their own mounting height) `desk-cubicle` x8 in ONE `grid:2x4` block: x in {-8.0, -6.0} by z in {-6.0, -3.8, -1.6, 0.6}, rot 0; `cubicle-partition` x6 at (-4.6, -6.9, 1.5708), (-4.6, -4.7, 1.5708), (-4.6, -2.5, 1.5708), (-4.6, -0.3, 1.5708), (2.6, -6.9, 1.5708), (2.6, -2.5, 1.5708); `chair-office` x8 one in front of each desk (desk x, desk z + 0.9, rot 3.1416); `monitor-dual` x6 on desks 1 to 6 (desk x, desk z - 0.2, rot 0); `monitor-desktop` x4 on desks 7 and 8 and on the two standing desks; `standing-desk` x2 at (2.0, -6.0, 0) and (2.0, -3.8, 0); `laptop` x3 on desk tops of desks 1 to 3; `keyboard-mouse` x10 on the desk tops (one per desk, desk x, desk z + 0.1) and on the two standing desks; `phone-desk` x4 on desks 1 to 4 (desk x + 0.5, desk z, rot 0); `desk-lamp` x4 on desks 5 to 8 (desk x + 0.6, desk z - 0.4, rot 0); `kanban-board` x2 at (-10.6, -4.0, 1.5708) and (-10.6, 2.0, 1.5708) (wall items); `whiteboard-rolling` x2 at (-5.0, 7.5, 0) and (3.0, 7.5, 0); `wall-tv-large` x3 at (10.6, 0.0, -1.5708), (10.6, 2.2, -1.5708), (10.6, 4.4, -1.5708) (east wall, the free stretch of plan 045); `printer-copier` x2 at (6.0, 6.5, 0) and (-8.0, 7.3, 0); `water-dispenser` at (-9.5, 7.0, 0); `coffee-machine` at (-8.4, 7.0, 0); `bean-bag` x3 at (-3.5, 6.0, 0), (-1.5, 7.2, 0), (0.5, 6.0, 0); `plant-office` x6 at (-10.2, -8.0, 0), (-10.2, 6.0, 0), (-6.0, 8.2, 0), (2.0, 8.2, 0), (7.0, 8.2, 0), (10.2, 8.2, 0); `ceiling-panel-light` x12 with `place: "ceiling"` at x -7.5, -2.5, 2.5, 7.5 and z -6.0, 0.0, 6.0 (a 4 by 3 grid); `ac-split` x3 at (-10.6, -7.2, 1.5708), (0.0, -8.6, 0), (10.6, 7.0, -1.5708); `wall-clock` x2 at (-3.0, -8.6, 0) and (1.5, 8.6, 3.1416); `fire-extinguisher` x2 at (-0.5, 8.6, 3.1416) and (-10.6, 5.0, 1.5708); `exit-sign` x2 at (-6.0, 8.6, 3.1416) and (6.0, 8.6, 3.1416); `trash-bin-small` x4 at (-7.0, -8.0, 0), (0.5, -8.0, 0), (6.0, 8.0, 0), (-3.0, 8.0, 0); `notice-board` at (-10.6, -0.5, 1.5708); `sign-board` at (3.0, -8.6, 0) with `text: "citadel-floor-first"` (the floor plate, FIRST FLOOR / முதல் தளம்). Distinct types about 27 (rule: at least 12). Lights: the twelve panels share three groups: `citadel:newsroom-a` (z -6.0), `citadel:newsroom-b` (z 0.0), `citadel:newsroom-c` (z 6.0), each group is two lights at x -5.0 and x 5.0, y 4.3, colour `#f2f6ff`, intensity 20, distance 14, `auto: "dusk"`; switch bank `sw-newsroom` at (4.2, 1.3, -8.65) on the north wall beside the stair foot, it toggles the three groups.
- Room `meeting-room` (floor material `woodPlanks`): (all `x, z, rot`) `conference-table` x1 at (4.0, 3.2, 0) (6 m long along x); `chair-conference` x14: north row (1.6, 1.9, 0), (2.8, 1.9, 0), (4.0, 1.9, 0), (5.2, 1.9, 0), (6.4, 1.9, 0); south row (1.6, 4.5, 3.1416), (2.8, 4.5, 3.1416), (4.0, 4.5, 3.1416), (5.2, 4.5, 3.1416), (6.4, 4.5, 3.1416); west end (0.4, 2.6, 1.5708) and (0.4, 3.8, 1.5708); east end (7.6, 2.6, -1.5708) and (7.6, 3.8, -1.5708); `wall-tv-large` x1 on the east wall at (10.6, 3.2, -1.5708) (the project screen, a 1.45 m screen slot; the head of the table faces it); `projector-screen` x1 on the north wall at (1.5, -8.6, 0) (3 m wide, the projection surface of the room); `projector-ceiling` x1 with `place: "ceiling"` at (3.0, 0.0); `whiteboard-rolling` x2 at (0.5, 7.5, 0) and (9.5, 7.5, 0); `cabinet-low` x2 at (9.5, 8.2, 3.1416) and (6.8, 8.2, 3.1416) (they stand against the south wall); `coffee-machine` at (0.4, 7.4, 0); `water-dispenser` at (0.4, 6.5, 0); `plant-office` x4 at (-0.4, -7.8, 0), (-0.4, 8.2, 0), (10.2, 8.2, 0), (3.0, 8.2, 0); `lamp-floor` x2 at (10.0, 0.6, 0) and (0.4, -0.6, 0); `curtain-pair` x4 on the south windows, at (0.9, 8.6, 3.1416), (3.1, 8.6, 3.1416), (5.0, 8.6, 3.1416), (7.1, 8.6, 3.1416) (wall items); `rug-rect` at (4.0, 3.2, 0) under the table; `wall-clock` at (-0.6, -3.0, 1.5708) (west wall, next to the door); `picture-frame-set` x3 at (-0.6, 5.0, 1.5708), (-0.6, 7.0, 1.5708) and (10.6, -6.0, -1.5708) (wall items); `ac-split` x2 at (-0.6, 8.2, 1.5708) and (10.6, 8.0, -1.5708); `ceiling-panel-light` x8 with `place: "ceiling"` at x 2.0, 4.0, 6.0, 8.0 and z 1.8, 4.6; `exit-sign` at (-0.6, 8.6, 3.1416); `fire-extinguisher` at (9.8, 8.6, 3.1416); `trophy-cup` on `cabinet-low` (`place: "on:cabinet-low"`, the cabinet at (9.5, 8.2)); `sign-board` at (-0.9, -3.5, 1.5708) with `text: "citadel-floor-second"` (SECOND FLOOR / இரண்டாம் தளம்). Distinct types about 20 (rule: at least 12). Lights: group `citadel:meeting-front` = `meet-1` (3.0, 4.3, 1.8) and `meet-2` (3.0, 4.3, 4.6); group `citadel:meeting-back` = `meet-3` (8.0, 4.3, 1.8) and `meet-4` (8.0, 4.3, 4.6); each colour `#fff1d0`, intensity 18, distance 12, `auto: "dusk"` for the back group only; the 8 ceiling panels share these four lights; a dimmer-style switch pair `sw-meet-front` (-0.4, 1.3, -1.2) and `sw-meet-back` (-0.4, 1.3, -1.8) by the l2-link door (the door is on the room west wall at z 0).
- Room `executive-office` (floor material `woodPlanks`): (all `x, z, rot`) `desk-wood` x1 at (-7.0, -3.0, 0); `chair-office` x1 at (-7.0, -4.2, 0); `monitor-dual` x1 at (-7.0, -3.4, 0) on the desk; `keyboard-mouse` x1 at (-7.0, -2.6, 0) on the desk; `phone-desk` x1 at (-8.2, -2.8, 0) on the desk; `lamp-table` x1 `place: "on:desk-wood"` at (-7.4, -2.8, 0); `globe` x1 `place: "on:desk-wood"` at (-6.4, -3.0, 0); `armchair` x2 at (-4.2, 1.0, -1.5708) and (-4.2, 3.2, -1.5708); `sofa-2` x1 at (-7.0, 6.6, 3.1416); `table-coffee` x1 at (-5.0, 3.0, 0) with `flower-vase` x1 `place: "on:table-coffee"`; `rug-round` x1 at (-5.0, 3.0, 0); `bookshelf-tall` x2 at (-6.0, -8.6, 0) and (-2.2, -8.6, 0) (north wall); `cabinet-glass` x1 at (-10.6, -1.5, 1.5708); `safe-box` x1 at (-9.4, -7.6, 0); `plant-potted-large` x2 at (-10.2, 7.8, 0) and (-2.2, -7.6, 0); `lamp-floor` x1 at (-9.8, 0.6, 0); `curtain-pair` x3 on the west windows at (-10.7, -4.0, 1.5708), (-10.7, 0.0, 1.5708), (-10.7, 4.0, 1.5708); `wall-clock` at (-4.0, -8.6, 0); `picture-frame-set` x2 at (-9.0, -8.6, 0) and (-10.6, 6.0, 1.5708); `mirror-wall` at (-1.4, 5.0, -1.5708) (on the partition with the meeting room); `ac-split` at (-3.0, 8.6, 3.1416); `sign-board` none. Distinct types about 22 (rule: at least 12). Lights: group `citadel:exec`: `exec-1` (-9.8, 3.4, 0.6) colour `#ffd9a0` intensity 8 distance 6, `exec-2` (-6.0, 4.3, -1.0) colour `#fff1d0` intensity 14 distance 9, `exec-3` (-7.4, 1.2, -2.8) colour `#ffd9a0` intensity 6 distance 5 (the table lamp), all `auto: "dusk"` except `exec-3`; switch `sw-exec` at (-1.2, 1.3, 1.2) on the office side of the l2-link door.
- Room `server-room` (floor material `floorTileDark`): (all `x, z, rot`) `server-rack` x10 in two aisles of five (`grid:2x5`): left column x -9.6 (rot 1.5708), right column x -6.8 (rot -1.5708), z in {-7.2, -5.7, -4.2, -2.7, -1.2}; `network-box` x2 at (-3.0, -7.6, 0) and (-3.0, -6.0, 0); `ac-split` x4 at (-10.6, 6.0, 1.5708), (-10.6, 0.5, 1.5708), (-3.0, 8.6, 3.1416), (2.0, -8.6, 0); `fire-extinguisher` x3 at (-10.6, 8.0, 1.5708), (-0.5, 8.6, 3.1416), (4.0, 8.6, 3.1416); `exit-sign` x2 at (-1.5, -8.6, 0) and (-4.6, 8.6, 3.1416); `ceiling-panel-light` x6 with `place: "ceiling"` at x -7.0, -2.0, 3.0 and z -4.0, 4.0; `workbench` x2 at (3.0, 2.0, 0) and (3.0, 5.0, 0); `chair-office` x2 at (2.0, 2.0, 1.5708) and (2.0, 5.0, 1.5708); `laptop` `place: "on:workbench"` (on the first bench); `monitor-desktop` x2 `place: "on:workbench"` (one on each bench); `cable-reel` at (6.0, 2.0, 0); `locker-bank` at (6.0, 6.0, 0); `whiteboard-rolling` at (-4.0, 6.0, 0); `trash-bin-small` at (-8.0, -8.0, 0); `water-dispenser` at (4.0, 7.8, 0); `sign-board` at (0.0, -8.6, 0) with `text: "citadel-floor-third"` (THIRD FLOOR / மூன்றாம் தளம்). Distinct types 15 (rule: at least 12). Lights: cool white panels group `citadel:server`: `server-1` (-7.0, 3.4, -4.0), `server-2` (-2.0, 3.4, -4.0), `server-3` (3.0, 3.4, -4.0), `server-4` (-7.0, 3.4, 4.0), `server-5` (-2.0, 3.4, 4.0), `server-6` (3.0, 3.4, 4.0); colour `#f4f8ff`, intensity 16, distance 9, `auto: "dusk"`; no switch (the level is always lit; the emergency red strip of the first draft is dropped because the manifest has no emissive-only light shape).
- Room `rooftop` (floor material `stonePaving`): (all `x, z, rot`) `bench-park` x4 at (-2.0, -7.0, 0), (2.0, -7.0, 0), (-2.0, 4.0, 3.1416), (2.0, 4.0, 3.1416); `planter-brick` x6 at (-10.2, -4.0, 0), (-10.2, 0.0, 0), (-10.2, 4.0, 0), (2.0, -8.0, 0), (5.0, 7.5, 0), (10.2, 3.0, 0); `planter-box` x4 at (-8.0, 7.6, 0), (-1.0, 7.6, 0), (5.0, 2.0, 0), (-5.0, -4.0, 0); `table-round` x3 at (-5.0, 1.0, 0), (1.0, 1.5, 0), (5.0, -2.0, 0); `chair-plastic` x12, four per table: for table (tx, tz) at (tx - 0.9, tz, 1.5708), (tx + 0.9, tz, -1.5708), (tx, tz - 0.9, 0), (tx, tz + 0.9, 3.1416); `roof-water-tank` x1 at (-9.0, 2.0, 0) (plan 027 rooftop set); `solar-heater` x1 at (-5.5, 5.0, 0) (plan 027 rooftop set, the 2.5 by 2.1 m footprint); `lantern-hanging` x6 with `place: "ceiling"` at (-8.0, -2.0), (-8.0, 2.0), (-3.0, 0.0), (3.0, 0.0), (0.0, 4.0), (-4.0, -4.5); `fan-pedestal` x2 at (-3.0, 3.5, 0) and (4.0, 6.0, 0); `flower-vase` x3 `place: "on:table-round"` (one on each table); `lamp-wall` x4 at (-10.6, -2.0, 1.5708), (-10.6, 4.0, 1.5708), (-4.0, 8.6, 3.1416), (4.0, 8.6, 3.1416); `plant-potted-large` x3 at (-10.0, -7.8, 0), (4.5, -7.8, 0), (9.6, 5.0, 0); `sign-board` at (0.0, 8.6, 3.1416) with `text: "citadel-floor-fourth"` (FOURTH FLOOR / நான்காம் தளம்). Distinct types 12 (rule: at least 12; the rooftop is the minimum, so the rooftop objects list must not lose a type). The `satellite-dish` of the first draft is dropped: it is not a registered prop type (the dish builder of plan 025 is an exterior extra and this plan adds no exterior). Lights: lanterns group `citadel:roof` (`roof-1` (-8.0, 2.4, -2.0), `roof-2` (-3.0, 2.4, 0.0), `roof-3` (3.0, 2.4, 0.0), `roof-4` (-4.0, 2.4, -4.5)), colour `#ffd9a0`, intensity 8, distance 10, `auto: "dusk"`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. The exterior and lobby types (plan 045) count toward the 40 types; this plan adds the rooms above.
- Interactables: meeting-screen (`read`, the object is wall screen on the east wall of the meeting room (the plan 045 interactable at x 9.3, z 3.2; the head of the table faces it)); light switches per room; seats the six `sit-meet` seats at the conference table, the three `sit-bean` bean bags (chairs of the desks are not seat interactables).
- `tests/unit/buildings/citadelFloorsInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; all floors reachable by the lift and by the stairs (the unit test of plan 045 covers the graph; this test adds the lift to the walk graph of the new objects); the meeting screen is within 6 m of the stair s2 landing (4.6 m); the newsroom has at least 8 `desk-cubicle` items; the switches toggle their groups.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadelFloorsInterior.test.js`
- `node scripts/check-buildings.mjs --only citadel`

### Step 4: Convert the zone, stream it, Playwright, budgets and shots

Deliver:
- `src/world/zones.js`: `citadel` becomes `name: "GravityWrite HQ"`, `prompt: "enter HQ"`, `mode: "object"` (ARCHITECTURE 10.7, A30). Update the citadel dialogue title in `src/content/dialogues.js` to the display name `GravityWrite HQ` (facts unchanged). Remove the v1 factory for `citadel` from `src/world/buildings.js` together with its collider and animation hooks; record the removed identifier in the report and check it with `none` in the verify list. Update the minimap zone label and the README zone table label: the README is added to this plan `allowed` list (plan 043 pattern); if the minimap label lives in a file that is not in `allowed`, it is a human_check item.
- Register the streamed area through plan 040: `registerLandmarkArea(factory)` for `citadel` in `src/world/areas/index.js` with `createCitadelArea` in `src/world/areas/citadelArea.js` (priority 30, loadRadius 120, unloadRadius 170, interior true, asserted by a unit test); the factory `await`s `preloadBuildingProps(manifest, ctx)` before `buildBuilding`. The `meeting-screen` read interactable opens the existing dialogue for `citadel` (A5); the dialogue text stays as v1. `tests/fixtures/zoneExpect.json` already has `citadel` (plan 043): no change.
- `tests/e2e/citadel.spec.js` (generated name, frozen) on `/?only=citadel&time=0.5&freeze=1&seed=1337`: teleport 6 m in front of the `main` door, `e` opens it, walk in with no loader; `listBuildings()` shows `citadel` with `interiorVisible` true and no problems; the second floor: ride the lift (plan 045 lift API, `citadel:lift1`) to level 2, teleport to local (8.0, 5.2), about 2.4 m from the screen (negative check: the zone is in mode `object`, so `e` there must not open the dialogue and `#dialogue` stays hidden), then teleport to the read spot in front of the screen (local (8.0, 3.2)), press `e`, `#dialogue` is visible and contains every string of `zoneExpect.json` for citadel plus the display name, Escape closes; teleport to the foot of stair s4 (local (8.0, -7.1) on the third floor) and walk up with the forward key while polling `playerState().y` until it is within 0.1 of 17.4 (`walkTo` is road-graph only, plan 040, and cannot climb); zero console errors. Every wait is `expect.poll`.
- Budget and shot spots (ids of this plan only; `citadel-outside` and `citadel-lobby` belong to plan 045 and are NOT redefined): `citadel-inside` (budget and shot) = the lobby as the main room of the building, camera local (0, 6.5), y 1.6, yaw 3.1416, pitch 0, world (72, -15.5); `citadel-newsroom` (budget and shot) camera local (-8.0, 7.0) at level 1, y 6.4, yaw -0.10, pitch -0.05, world (64, -15); `citadel-meeting` (budget and shot) camera local (1.5, 6.0) at level 2, y 10.6, yaw -0.727, pitch -0.1, world (73.5, -16); `citadel-roof` (budget and shot) camera local (-4.0, 2.0) at level 4, y 19.0, yaw -1.107, pitch -0.2, world (68, -20). The numbers are for anchor (72, -22) and rotation 0; if the anchor differs, recompute with the ARCHITECTURE 10.8 transform (yaw plus rotation). `has` checks on both files; `npm run check:budget` passes; run `npm run shots -- --plan 46 --spots citadel-inside,citadel-newsroom,citadel-meeting,citadel-roof`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures and black rooms (best effort, list the fixes under `different_from_plan`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/citadel.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only citadel --stage full`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "citadel"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createCitadelArea"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/citadel/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "GravityWrite HQ"`
- `node "{{runner}}/assert.mjs" has README.md "GravityWrite HQ"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "citadel-inside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "citadel-newsroom"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "citadel-meeting"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "citadel-roof"`
- `node "{{runner}}/assert.mjs" has src/shots.json "citadel-roof"`
- `node "{{runner}}/assert.mjs" has src/shots.json "citadel-meeting"`
- `node "{{runner}}/assert.mjs" has src/shots.json "citadel-newsroom"`
- `node "{{runner}}/assert.mjs" has src/shots.json "citadel-inside"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/citadelFloors.test.js tests/unit/buildings/citadelFloorsExterior.test.js tests/unit/buildings/citadelFloorsInterior.test.js`
- `node scripts/check-buildings.mjs --only citadel`
- `npx playwright test tests/e2e/citadel.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the newsroom, the meeting room and the rooftop. The Tamil of the four floor words is a draft: review it. The tower facade is judged in plan 045.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
