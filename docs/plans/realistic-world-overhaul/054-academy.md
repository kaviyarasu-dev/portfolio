# Plan 054: School and college (zone academy): classroom, labs, staff room

Epic E4. Estimated turns: 60.

## Goal

Build the academy: a school and college building with a classroom, a science lab, a computer lab, a staff room and an assembly corridor hall, painted in the typical white and ochre of an Indian school with a flag mast in the front yard. The blackboard in the classroom opens the education and certification dialogue.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only academy`).

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
- src/world/buildings/registry.js
- src/world/areas/index.js
- src/world/buildings/workshop/build.js
- src/world/props/sets/school.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Academy

Deliver:
- Create `src/world/buildings/academy/manifest.json` (schema of `docs/building-manifest.md`): `id: "academy"`, `displayName: "Academy"`, `prompt: "attend class"`, footprint taken from the `academy` anchor in `src/world/layout/town.json` (exactly 28 by 18 m (`footprint { w: 28, d: 18 }`, building-local x -14 to 14 and z -9 to 9, origin at the centre, +z = front/south); the `academy` anchor of `town.json` (plan 032) must have that size, else stop with BLOCKED.md (the 043 pattern). LAYOUT DECISION: the 28 m width cannot hold the four classrooms side by side (9+9+9+8 = 35 m), so the hall is a central east-west corridor and the rooms are in two rows (see the structure step)), floors one floor (level 0, y 0, height 3.9), top-level `"stage": "structure"` for now (step 3 raises it to `full`), top-level `roomMin` `{ "hall": 14, "classroom": 12, "science-lab": 12, "computer-lab": 12, "staff-room": 12 }`, style: plaster wall tint `#f1eadb` with an ochre band, `flat` roof with a parapet and a small clock gable, trim `woodDark`.
- Rooms (ids fixed): `hall` (assembly hall and corridor, 28 by 4 m along the front); `classroom` (classroom, 9 by 8 m); `science-lab` (science lab, 9 by 8 m); `computer-lab` (computer lab, 9 by 6 m); `staff-room` (staff room, 8 by 6 m). Room count between 3 and 6.
- Doors: six doors; `at` = metres along the wall from the wall centre (world coordinate in brackets): `main` (exterior, unlocked, width 2.0, height 2.4, the main door) on the south wall of `hall` (z 3), at world x 2.0, hinge left; `side` (exterior, unlocked, width 1.4, height 2.2, the second exterior door) on the east wall of `hall` (x 14), at world z 1.0, hinge right; `hall-classroom` (interior, unlocked, width 2.0) on the north wall of `hall` (z -1), at world x -9.5, hinge left; `hall-science` (interior, unlocked, width 2.0) on the same wall, at world x -0.5, hinge left; `hall-computer` (interior, unlocked, width 1.4) on the same wall, at world x 8.5, hinge right; `hall-staff` (interior, unlocked, width 1.4) on the south wall of the hall (z 3) inside the staff-room footprint edge, at world x -10.0, hinge left. Rooms (bounds `[x0, z0, x1, z1]`): `hall` `[-14, -1, 14, 3]` (28 by 4, the central corridor), `classroom` `[-14, -9, -5, -1]` (9 by 8), `science-lab` `[-5, -9, 4, -1]` (9 by 8), `computer-lab` `[4, -9, 13, -3]` (9 by 6), `staff-room` `[-14, 3, -6, 9]` (8 by 6, south of the hall west end). LEFTOVER RULE (decision, the same as plans 051 to 053): the rectangles do not overlap and do not tile; the leftover is solid service void and the front yard, not walkable inside the building. At least one unlocked exterior door that is not decorative. Windows: exactly 16 windows, ids `w-1` to `w-16`, all width 1.2, height 1.4, sill 1.0, each on an exterior wall of its room: `w-1` `classroom` north wall x -12.0; `w-2` `classroom` north wall x -8.0; `w-3` `classroom` west wall z -7.0; `w-4` `classroom` west wall z -4.0; `w-5` `science-lab` north wall x -2.0; `w-6` `science-lab` north wall x 1.5; `w-7` `computer-lab` north wall x 6.0; `w-8` `computer-lab` north wall x 10.5; `w-9` `hall` south wall x 6.0; `w-10` `hall` south wall x 8.0; `w-11` `hall` south wall x 10.0; `w-12` `hall` south wall x 12.0; `w-13` `staff-room` west wall z 5.0; `w-14` `staff-room` west wall z 7.5; `w-15` `staff-room` south wall x -12.0; `w-16` `staff-room` south wall x -8.0. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 16, door 2 (`main` and `side`), signage 2, drainpipe 4 (the four corners), planter 8 (pots built by the decorator), bin 3, lamp 6 (the manifest counts; the generic kit builds window, door and drainpipe, the decorator builds signage, planter, bin and lamp (`skipGeneric`)); the extras (builders in `build.js`, never declared in the manifest, ARCH 10.8) are the portico, the ochre band, the clock gable with clock, the flag mast with the flag cloth, the low front wall with gate, 2 `bench-park`, and the school bell on a stand. `interactables`: declare only `blackboard` now (kind `read`, room `classroom`, `dialogueKey` `main`, prompt "attend class").
- `tests/unit/buildings/academy.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the hall `hall` touches the four other rooms (each reachable through one interior door), the rooms `classroom` `science-lab` `computer-lab` `staff-room` and `hall` are 5 rectangles that do not overlap and lie inside the 28 by 18 footprint, `main` and `side` are unlocked exterior doors, exactly 16 windows `w-1` to `w-16`, and the manifest is `stage` structure; the CLI `check:buildings --only academy --stage structure` exits 0.
- Manifest data (exact; building-local x and z, origin at the centre): `footprint { w: 28, d: 18 }`; rooms `hall` `[-14, -1, 14, 3]` (`stonePaving`), `classroom` `[-14, -9, -5, -1]` (`floorTile`), `science-lab` `[-5, -9, 4, -1]` (`floorTile`), `computer-lab` `[4, -9, 13, -3]` (`floorTileDark`), `staff-room` `[-14, 3, -6, 9]` (`woodPlanks`); `floors` `[{ level: 0, y: 0, height: 3.9 }]`; the six doors and the sixteen windows exactly as given above; `roomMin` as given. `interactables` written in this step: `blackboard` `{ kind: "read", room: "classroom", x: -13.0, y: 1.5, z: -6.0, dialogueKey: "main", prompt: "attend class" }` (the big board is on the north wall of the classroom at (-11.0, 1.2, -8.9), front toward +z; the read point is in the west aisle). Only the read point is written in the structure step.
- Doors: `main` is the unlocked exterior door (not decorative); `side` is the second unlocked exterior door; all four hall doors are interior and unlocked. Stairs and lifts: `none`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/academy.test.js`
- `node scripts/check-buildings.mjs --only academy --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/academy/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/academy/build.js` exports `decorateAcademy(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): all positions building-local (south wall of the hall at z 3, +z outward), everything via `instance.addDetail`: (a) the lit sign `signboard({ key: "zone-academy", w: 4.0, h: 0.8, style: "board" })` above the main door at x 2.0, y 3.2, z 3 (declared signage 1; its English is the zone name "Academy", the frozen 025 value; the Tamil கல்விக்கழகம் is a draft); a second signage `signboard({ key: "open", w: 0.8, h: 0.3, style: "plaque" })` right of the main door at x 3.6, y 1.55, z 3 (declared signage 2, existing key `open`); (b) the extras (`detailClass: "extra"`, never declared): `portico({ pillars: 8, height: 3.6 })` x1 along the hall front (8 pillars at x -10.5 to 10.5 in steps of 3.0, z 5.0, box colliders per pillar, `detailKind: "portico"`); the ochre band is painted on the hall walls by the decorator (a paint band, no mesh count); `clockGable({ w: 3.0 })` x1 on the roof gable above the classroom end, with the working clock face, the hands read from the real time, built by the square-clock builder EXPORTED by the plan 029 block in `defs/e2c.mjs` (imported, not copied; the export name is read from that block first), `detailKind: "clock-gable"`; `flagMast({ height: 8.0 })` x1 in the front yard at (-6.0, 6.0) with a flag cloth, `detailKind: "flag-mast"`, box collider at the foot; `lowWall({ length: 12.0, gate: true })` x1 along the front yard (decorative, z 11.0, a gate of 2.0 m at x 0.0), `detailKind: "low-wall"`, collider only at the gate posts; `benchPark()` x2 in the play yard at (8.0, 6.0) and (11.0, 6.0) (the plan 022 bench, `detailKind: "bench-park"`); `schoolBell({ standHeight: 2.2 })` x1 on a stand at (-7.0, 5.0), `detailKind: "school-bell"`, box collider. Counts and sizes are asserted in the exterior test. No curtain fills: the interior is enterable (this overrides the generic sentence of the exterior step). Planters are the decorator planters (declared 8), not extras.
- Signage from `src/content/signage.js`: add the keys `zone-academy` (the existing plan 025 key, English "Academy"; no second key, the frozen test needs it equal to the zone name), `open` (existing key), and the hall board uses `zone-academy` too; the hall board Tamil is a draft; the keys are digit-free (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/academyExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- `src/world/buildings/academy/build.js` exports `decorateAcademy(instance, ctx)` and the builders `portico`, `clockGable` (the clock is the square-clock builder of plan 029, IMPORTED), `flagMast`, `lowWall`, `benchPark` (imported from the plan 022 bench set, not copied) and `schoolBell` (each returns an Object3D whose root `userData` has `detailClass: "extra"`, `detailKind` and, when solid, `colliders` in the plan 025 form; at most 8 meshes each; materials from `getMaterial` only; deterministic).
- `src/world/buildings/registry.js` (read first): `import { decorateAcademy } from "./academy/build.js"` and `DECORATORS.academy = { decorate: decorateAcademy, skipGeneric: ["signage", "planter", "bin", "lamp"] }`. `tests/unit/buildings/academyExterior.test.js` (headless build with `getDecorator("academy")`) asserts the decorator is defined with those four names; `countDetails` gives window 16, door 2, signage 2, drainpipe 4, planter 8, bin 3, lamp 6 and the extras `portico` 1 (8 pillars), `clock-gable` 1, `flag-mast` 1 (8.0 m tall), `low-wall` 1, `bench-park` 2, `school-bell` 1; the two signs record `{ en: "Academy", ta: "கல்விக்கழகம்" }` and `{ en: "Open", ta: "திறந்திருக்கிறது" }`; the clock hands follow the real time in the headless test (the function is called with a fixed date).
- The ochre band is paint, so it is part of the wall tint of the decorator (`style.wallTint` and the band colour), not an extra.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/academyExterior.test.js`
- `node scripts/check-buildings.mjs --only academy --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/academy/build.js`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "academy"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/academy/build.js "decorateAcademy"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/academy/build.js "portico"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/academy/build.js "clock-gable"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "zone-academy"`
- `node "{{runner}}/assert.mjs" has tests/unit/buildings/academyExterior.test.js "getDecorator"`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `hall` (floor material `stonePaving`): `bench-wood` x4, `notice-board` x3, `school-bell`, `wall-clock` x2, `plant-potted-large` x4, `fan-ceiling` x6, `trophy-cup` x3, `display-case-glass`, `award-wall`, `flag-stand`, `water-dispenser`, `sign-board` (key `zone-academy`, the same key as the exterior, no second key; English "Academy"), `lamp-wall` x6, `picture-frame-set` x4, `trash-bin-small` x2, `shoe-rack`, `podium`. Lights: group `academy:hall` auto dusk.
- Room `classroom` (floor material `floorTile`): `desk-school` x12 in `grid:3x4`, `blackboard` x1 big, `teacher-desk`, `chair-wooden` x2, `wall-chart` x3, `fan-ceiling` x4, `tube-light` x6, `cabinet-low`, `bookshelf-low`, `globe`, `school-bell`, `notice-board`, `wall-clock`, `plant-potted-small` x2, `picture-frame-set`, `trash-bin-small`, `water-filter`. Lights: tube lights group `academy:class`.
- Room `science-lab` (floor material `floorTile`): `lab-bench` x4, `stool` x8, `microscope` x4, `beaker-set` x4, `wall-chart` x2, `cabinet-glass` x2, `sink-double`, `fire-extinguisher` x2, `exit-sign`, `fan-ceiling` x3, `tube-light` x6, `blackboard`, `teacher-desk`, `shelf-wall` x2, `trash-bin-small`, `locker-bank`. Lights: group `academy:lab`.
- Room `computer-lab` (floor material `floorTileDark`): `desk-cubicle` x8, `chair-office` x10, `monitor-desktop` x10, `keyboard-mouse` x10, `server-rack`, `network-box`, `printer-copier`, `ac-split` x2, `whiteboard-rolling`, `projector-ceiling`, `projector-screen`, `ceiling-panel-light` x6, `fire-extinguisher`, `exit-sign`, `plant-office` x2, `wall-clock`. Lights: panels group `academy:computer`.
- Room `staff-room` (floor material `woodPlanks`): `desk-wood` x4, `chair-office` x4, `chair-wooden` x4, `filing-cabinet` x3, `bookshelf-tall` x2, `table-round`, `water-dispenser`, `kettle-tray`, `tea-glass-set`, `fan-ceiling` x2, `notice-board`, `wall-clock`, `plant-potted-large`, `lamp-table` x2, `picture-frame-set` x2, `rug-rect`, `cabinet-glass`. Lights: group `academy:staff`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. Distinct types per room: hall at least 14, classroom 14, science-lab 14, computer-lab 12 and staff-room 12; the rooms rule holds for all five.
- Interactables: blackboard (`read`, the object is the big blackboard); light switches per room; seats every school desk (at least 6 are seat interactables).
- Interactables (manifest, building-local, y 1.3 unless stated): switches `sw-hall` (hall, x 0.4, z 2.6, group `academy:hall`, beside `main`), `sw-class` (classroom, x -5.6, z -1.8, group `academy:class`), `sw-lab` (science-lab, x 3.4, z -1.8, group `academy:lab`), `sw-computer` (computer-lab, x 4.6, z -3.6, group `academy:computer`), `sw-staff` (staff-room, x -5.6, z 3.6, group `academy:staff`). Seats (kind `sit`, `object` = the prop type, so every seat of every placed item is registered): `sit-desk` (classroom, `desk-school`, 12 desks; the desks rot 3.1416 so the pupils face north, the board wall), `sit-lab-stool` (science-lab, `stool`, 8), `sit-lab-chair` (computer-lab, `chair-office`, 10), `sit-staff` (staff-room, `chair-office`, 4). Every seat type exists in the catalog.
- Lights (`auto: "dusk"` unless stated, each light named, every manifest light has a lightSocket of the same id): group `academy:hall` six pendants `hall-1` to `hall-6` in two rows of 3 at z 0.0 and z 2.0, x -10.0, -2.0, 6.0 at y 3.6, colour `#fff4df`, intensity 12, distance 8; group `academy:class` six tube lights `class-1` to `class-6` (x -12.0 and -7.0 at z -7.0, -4.0 and -2.5 in three rows of two), colour `#f4f8ff`, intensity 16, distance 9; group `academy:lab` six tube lights `lab-1` to `lab-6` (x -3.0, -0.5 and 2.0 at z -7.0 and -3.5), colour `#f4f8ff`, intensity 16, distance 9; group `academy:computer` six ceiling panels `computer-1` to `computer-6` (x 5.5, 8.5, 11.5 at z -7.5 and -4.5), colour `#fbfdff`, intensity 14, distance 8; group `academy:staff` three lamps `staff-1` to `staff-3` (x -12.0, -9.0, -7.0 at z 6.0), colour `#ffe2b0`, intensity 8, distance 6.
- Placements (about 100 entries): hall about 30, classroom about 30, science-lab about 22, computer-lab about 20, staff-room about 20 (count checked by the interior test); items on desks, shelves and benches use `place` values, floor and wall items use explicit x, y, z and rot. Microscopes (`microscope` x 4) are placed `place: "on:lab-bench"`. The school desks are `desk-school` x 12 in `grid:3x4` at x -11.0, -8.5, -6.0 and z -7.0, -5.5, -4.0, -2.5 with rot 3.1416 (aisles of at least 0.9 m). The second `blackboard` is on the science-lab north wall at (-0.5, 1.2, -8.9).
- At the end of this step set top-level `"stage": "full"` in `src/world/buildings/academy/manifest.json`.
- `tests/unit/buildings/academyInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the classroom has 12 `desk-school` (grid 3 by 4) and the seats of all of them are registered (at least 6 seat interactables); the science lab has 4 microscopes; the clock gable imports the square-clock builder of plan 029 (import, no copy: the test greps for the import); the classroom `blackboard` read point (-13.0, 1.5, -6.0) is in the aisle, 2.2 m from the board, and a clear walk of at least 0.9 m leads from `hall-classroom` to it.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/academyInterior.test.js`
- `node scripts/check-buildings.mjs --only academy`
- `node "{{runner}}/assert.mjs" has src/world/buildings/academy/manifest.json "blackboard"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/academy/manifest.json "sit-desk"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/academy/manifest.json "sw-hall"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/academy/manifest.json stage full`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- Area: `src/world/areas/academyArea.js` exports `createAcademyArea(game, deps = {})` returning `{ id: "academy", priority: 30, loadRadius: 120, unloadRadius: 170, interior: true, load, unload }` at the `academy` anchor of `src/world/layout/town.json`; registered by ONE line `registerLandmarkArea(createAcademyArea)` in `src/world/areas/index.js` (plan 040). `tests/unit/buildings/academyArea.test.js` (fake deps) asserts the fields, preload before build, nothing left after `unload`, a second `load` after `unload`, and that `academy` appears once in `createAllAreas`.
- Remove the v1 academy: in `src/world/buildings.js` delete the factory `buildAcademy` and its table entry, and any helper only it used (grep first); in `src/world/buildingAnims.js` and `src/world/collision.js` delete only the academy entries (list the lines in the report). `src/content/dialogues.js`: the academy title becomes `titleBar("Academy -", ...)` with the rest of the v1 title and the accent part unchanged. `src/world/zones.js`: `academy` becomes `name: "Academy"`, `prompt: "attend class"`, `mode: "object"`. `src/ui/minimap.js`: the label for the zone is the zone name. README zone row becomes Academy (README.md is allowed). `tests/unit/world/zones.test.js` asserts mode object (E away from the blackboard does NOT open the dialogue; E at its read point does).
- Spots: `academy-outside` and `academy-inside` with the anchor at world (ax, az) and rotation 0: `academy-outside` { x ax, y 1.8, z az+14.0, yaw 0, pitch 0.06 } (the portico, the clock gable and the flag mast in view); `academy-inside` { x ax-6.0, y 1.6, z az+1.0, yaw 0.524, pitch -0.08 } (the hall toward the classroom door). The same numbers go into `src/budgets.json` and `src/shots.json`, no third spot. If the anchor rotation is not 0, recompute both with the ARCHITECTURE 10.8 transform. Run the shots with `npm run shots -- --plan 54` (the plan number as the shots script expects it; the step-4 template line above shows the padded id form and this is the one to use).
- `src/world/zones.js`: `academy` becomes `name: "Academy"`, `prompt: "attend class"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `academy` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `academy` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `academy` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the big blackboard) so `E` opens the existing dialogue for `academy` (A5); the dialogue is the education and certification content as in v1; the title text becomes exactly `Academy -` followed by the v1 rest of the title, unchanged.
- Add `academy` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/academy.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `academy` with `interiorVisible` true and empty `problems`; walk to the the big blackboard and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[academy].mustInclude` and the display name; Escape closes; teleport 6 m in front of `main` (polled), `e` opens it, walk in through `main`, teleport to the blackboard read point and press `e` (`#dialogue` visible, polled); sit at a school desk (`playerState().sitting` true, polled); URL `/?only=academy&time=0.5&freeze=1&seed=1337`; zero console errors; no fixed waits; zero console errors.
- Add budget spots `academy-outside` and `academy-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 054 --spots academy-outside,academy-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/academy.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only academy`
- `npx vitest run tests/unit/world/zones.test.js tests/unit/buildings/academyArea.test.js tests/unit/content/zoneExpect.test.js`
- `node "{{runner}}/assert.mjs" json src/world/buildings/academy/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createAcademyArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "decorateAcademy"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "buildAcademy"`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Academy"`
- `node "{{runner}}/assert.mjs" has README.md "Academy"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "academy-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "academy-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "academy-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "academy-inside"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/academy.test.js tests/unit/buildings/academyExterior.test.js tests/unit/buildings/academyInterior.test.js`
- `node scripts/check-buildings.mjs --only academy`
- `npx playwright test tests/e2e/academy.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run test`
- `npm run check:content`
- `npm run check:phone`
- `npx vitest run tests/unit/buildings/academyExterior.test.js tests/unit/buildings/academyArea.test.js tests/unit/props/schoolPost.test.js`

Human check (goes in the report, never blocks): Judge the school look. Also check the Tamil of the sign (கல்விக்கழகம் is a draft) for the person; the Tamil review is a human check, not a test.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
