# Plan 050: Community hall and open-source cafe (zone temple)

Epic E4. Estimated turns: 60. Model: opus.

## Goal

Build the open-source community hall and cafe (the zone id `temple` is only an id: the building is a civic hall with a cafe, NO religious imagery, and its objects are typed `community-hall`, never `temple`): a cafe counter with seating, a meetup hall with a small stage and a code-wall screen, a kitchen, and a loft co-working space reached by one stair from the hall. The code wall screen in the hall opens the open-source AI agent dialogue. Layout in one line (building-local metres, origin at the footprint centre, +z = south = front, -z = north; footprint 20 by 16: x -10 to 10, z -8 to 8; the `temple` anchor in town.json (plan 032) gives the world origin): cafe x -10 to -1, z 0 to 8 (9 by 8, south-west, main door in its south wall); hall x -1 to 10, z 0 to 8 (11 by 8, south-east, the MAIN ROOM); kitchen x -10 to -5, z -4 to 0 (5 by 4, north-west of the cafe); loft x -1 to 10, z -3 to 2 (11 by 5, level 1 at y 4.2, over the north part of the hall and over solid mass). Leftover rule: every footprint cell not inside a ground room is SOLID plaster mass (the north strip x -10 to 10 at z -8 to -3 and at z -4 to 0 outside the kitchen, and x -5 to -1 at z -4 to 0): it is structure, not walkable and has no door. The loft slab covers the solid mass where it overhangs. The porch in front of the main door is outside the footprint (z 8 to 10). Every coordinate below is a target: `checkBuilding` is the judge; when the placer reports a collision, nudge by at most 0.4 m inside the same room and list it under `different_from_plan`.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only temple`).

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
- docs/plans/realistic-world-overhaul/039-*.md (the local temple and its ids)
- docs/plans/realistic-world-overhaul/043-*.md
- docs/plans/realistic-world-overhaul/048-*.md (the fixed pattern of this file)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Community Hall

Deliver:
- Create `src/world/buildings/temple/manifest.json` (schema of `docs/building-manifest.md`): `id: "temple"`, `displayName: "Community Hall"`, `prompt: "read the wall"`, footprint taken from the `temple` anchor in `src/world/layout/town.json` (about 20 by 16 m (the ground rooms cover x -10 to 10 and z -4 to 8 and the solid mass covers the rest; the loft sits at level 1)), floors ground floor (height 4.0) and a loft level at y 4.2 (height 3.2) over x -1 to 10, z -3 to 2, style: plaster wall tint `#efe0c0`, `hip` roof with `roofTile`, pitch 0.45, overhang 0.8, trim `woodDark`, pillared front porch.
- Rooms (ids fixed): `cafe` (cafe, 9 by 8 m, bounds `[-10, 0, -1, 8]`, south-west, the main door in its south wall); `hall` (meetup hall with a stage, 11 by 8 m, bounds `[-1, 0, 10, 8]`, south-east, the MAIN ROOM (the room of the side door, the cafe opening and the code wall)); `kitchen` (cafe kitchen, 5 by 4 m, bounds `[-10, -4, -5, 0]`, north-west, reached through the cafe north wall door); `loft` (loft co-working space (level 1, y 4.2), bounds `[-1, -3, 10, 2]`, 11 by 5 m, reached ONLY by the hall stair). Room count between 3 and 6.
- Doors: four doors (`at` is the offset in metres along the wall from the wall centre, ARCHITECTURE 10.8): `main` from `outside` to `cafe`, wall S of the cafe (z 8), at 0.0 (x -5.5), width 1.8, height 2.4, kind `exterior`, unlocked; `side` from `outside` to `hall`, wall S of the hall (z 8), at 2.0 (x 6.5), width 1.6, height 2.4, kind `exterior`, unlocked; `cafe-hall` from `cafe` to `hall`, wall E of the cafe (x -1), at 0.0 (z 4), width 2.4, height 2.4, kind `interior`, unlocked (the wide opening); `cafe-kitchen` from `cafe` to `kitchen`, wall N of the cafe (z 0), at -2.0 (x -7.5), width 1.0, height 2.2, kind `interior`, unlocked. The loft has no door: its only access is the stair (the stair is not a door).. At least one unlocked exterior door that is not decorative. Windows: twelve windows (at least 12), all sill 0.9 and height 1.5 unless stated: `w-1` cafe S wall at -3.0 (x -8.5), width 1.2; `w-2` cafe S wall at 3.0 (x -2.5), width 1.2; `w-3` cafe W wall (x -10) at -1.5 (z 2.5), width 1.2; `w-4` cafe W wall at 1.5 (z 5.5), width 1.2; `w-5` hall S wall (z 8) at -3.0 (x 1.5), width 1.2; `w-6` hall S wall at -1.0 (x 3.5), width 1.2; `w-7` hall E wall (x 10) at -3.0 (z 1.0), width 1.0; `w-8` hall E wall at 1.7 (z 6.2), width 1.0 (clear of the stair at x 8.4 to 9.6); `w-9` loft N wall (z -3, the loft level, sill 0.9 above the loft floor) at -3.5 (x 1.0), width 1.2; `w-10` loft N wall at 0.5 (x 5.0), width 1.2; `w-11` loft W wall (x -1) at 0.0 (z -0.5), width 1.0; `w-12` loft E wall (x 10) at -1.0 (z -1.5), width 1.0.. Stairs and lifts: one staircase in the hall from the hall floor (y 0) to the loft floor (y 4.2): 21 risers of 0.2 m (rise 4.2), 20 treads of 0.27 m (run 5.4 m), width 1.2 m, climbing north (-z), foot at (9.0, 7.4) and top step at (9.0, 2.0) where the loft floor begins; the loft floor has the stair head opening at x 8.4 to 9.6, z 1.6 to 2.0; a handrail on the west side only (x 8.4, 0.9 high, colliders 0.1 thick), no rail on the east side at the wall; the stair stays out of the 1.0 m aisle from the cafe door (z 2.8 to 5.2 at x -1) to the screen and out of the chair grid (x 3.75 to 7.45).
- `exteriorDetails` counts (all seven classes, window at least 4): window 12, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 6; plus the porch pillars, the shutters, the chalkboard easel, the bicycle stands, the plant tubs and the string lights listed in the exterior step. `interactables`: declare only `code-wall` now (kind `read`, room `hall`, `dialogueKey` `main`, prompt "read the wall").
- `tests/unit/buildings/temple.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the loft is reachable only by the staircase (the walk graph with the stair removed fails to reach the loft), both exterior doors are unlocked, the stair head is at the loft floor edge (y 4.2) and the stair does not block the cafe-hall door aisle; the CLI `check:buildings --only temple --stage structure` exits 0.
- Manifest data (exact; all x, z building-local): `footprint { w: 20, d: 16 }`; rooms `cafe` `[-10, 0, -1, 8]`, `hall` `[-1, 0, 10, 8]`, `kitchen` `[-10, -4, -5, 0]`, `loft` `[-1, -3, 10, 2]` (floor 0 for the three ground rooms, floor 1 at y 4.2 for the loft; floorMaterial `woodPlanks`, `woodPlanks`, `floorTileDark`, `woodPlanks`); the doors, windows and stair exactly as above; the manifest `stage` is `structure` in this step (step 4 changes it to `full` and asserts it with json); the solid mass in the leftover rule has no room id. Interactables: `code-wall` `{ kind: "read", room: "hall", x: 3.5, y: 1.6, z: 2.4, dialogueKey: "main", prompt: "read the wall" }`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/temple.test.js`
- `node scripts/check-buildings.mjs --only temple --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/temple/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/temple/build.js` exports `decorateTemple(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): the exterior is built by `src/world/buildings/temple/build.js` `decorateTemple(instance, ctx)` (all via `instance.addDetail`) with the kit `src/world/kit/exterior.js` and the extension items above. A front porch with 4 plain wooden pillars (portico, no carving), a hip tile roof with overhanging eaves, shutters, a chalkboard sign on an easel outside ("OPEN SOURCE CAFE / திறந்த மூல உணவகம்", key `oss-cafe`), bicycle stands with 3 parked cycles, tubs of plants, string lights across the porch, a notice board by the door. Signs: `oss-cafe` (declared signage 1) and `community-hall` (declared signage 2, on the side door plaque). Both register their lights in group `temple:sign`, `auto: "dusk"`. The generic placer builds windows 12, doors 2, drainpipes 4, planters 6, bins 3 and lamps 6 (lamps group `temple:exterior`, `auto: "dusk"`). Mesh budget: `exterior-details` at most 14 meshes; the porch, shutters, string lights and cycles go to a separate group `temple-extras` (at most 30 meshes). Colour: plaster wall tint `#efe0c0`, hip tile roof.
- Signage from `src/content/signage.js`: add the keys `oss-cafe` (OPEN SOURCE CAFE / திறந்த மூல உணவகம்) and `community-hall` (COMMUNITY HALL / சமுதாயக் கூடம்); digit-free keys; the Tamil words are a draft for the human check (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/templeExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- Registry: `src/world/buildings/registry.js` gets `import { decorateTemple } from "./temple/build.js"` and `DECORATORS.temple = { decorate: decorateTemple, skipGeneric: ["signage", "planter", "bin", "lamp"] }` (the plan 048 pattern); a unit test asserts `getDecorator("temple")` returns that entry.
- Area: `src/world/areas/templeArea.js` exports `createTempleArea`, registered with one line `registerLandmarkArea(createTempleArea)` (plan 040) in `src/world/areas/index.js` (priority 30, loadRadius 120, unloadRadius 170, interior true); a unit test asserts those values. The factory awaits `preloadBuildingProps(manifest, ctx)` before `buildBuilding`.
- NAME COLLISION (plan 039): plan 039 places a small village temple at the west gate, typed `temple` (`local:temple`, spot id `temple`, the `local.temple` entry of town.json). This plan keeps the zone and building id `temple` (manifest id, registry key, area id are fixed by the zone) and types ALL its own game.areaObjects entries `community-hall`, `cafe-counter`, `stage`, `loft-desk` and so on, never `temple`. Its spot ids are `temple-outside` and `temple-inside` (not `temple`). A unit test asserts: `listBuildings()` has `temple` exactly once, and no game.areaObjects entry with type `temple` comes from this plan.
- Exterior extras (new builders in `src/world/buildings/temple/build.js` as `extra` details; `temple` builders in the file are NEW names, the plan 039 `temple` prop is not touched): `porch({ w: 6.0, d: 2.0, height: 3.6, pillars: 4 })` in front of the main door (the pillars are plain `woodDark` columns with a flat cap, no carving and no religious shapes), `shutters` x6 on the windows (`woodDark` panels with slats, 0.6 m wide), `chalkboard-easel` at (-4.2, 9.2) outside the porch (text slot `face`, sign key `oss-cafe`), `bicycle-stand` x2 at (-8.0, 10.0) and (-6.0, 10.0) with `cycle-parked` x3 (plan 039 prop, placed by this plan, not the 039 local set), `plant-tub` x4 by the porch (`plant-potted-large`, not a new type), `string-lights` x1 across the porch as 12 small emissive spheres (decorative emissive meshes, not registered lights; the 12 are counted in the exterior mesh budget), `notice-board-outside` at (-6.5, 7.9) beside the door (the `notice-board` type already in the list). The detail count of this plan is 6 planters, so the `planter` class counts the porch tubs.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/templeExterior.test.js`
- `node scripts/check-buildings.mjs --only temple --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/temple/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `cafe` (floor material `woodPlanks`): (all `x, z, rot`) `counter-straight` at (-9.0, 0.8, 0) with `coffee-machine` on it at (-9.0, 0.8, 0) (the counter is on the north wall, the kitchen door is at x -7.5); `cash-counter` at (-9.5, 2.6, 1.5708); `bar-counter` at (-9.5, 4.8, 1.5708); `table-round` at (-7.0, 2.6, 0), (-7.0, 5.6, 0), (-4.0, 2.6, 0) and (-4.0, 5.6, 0); `chair-cane` x12 around the four tables (three per table, positions at each table centre plus or minus 0.9 m on x and z; they are the seat interactables `sit-cafe-1` to `sit-cafe-12`); `table-bar` at (-2.2, 6.4, 0); `stool-bar` x4 at (-2.6, 7.2, 0), (-1.8, 7.2, 0), (-2.2, 5.8, 0) and (-3.2, 6.2, 0); `menu-board` x2 on the west wall at (-10.0, 3.0, 1.5708) and on the south wall beside the main door at (-7.4, 7.95, 3.1416); `plant-potted-large` at (-10.0, 6.8, 0), (-5.0, 7.4, 0) and (-1.6, 0.6, 0); `lamp-pendant` x5 place ceiling (see lights); `fan-ceiling` x3 place ceiling at (-8.0, 4.0), (-4.0, 4.0) and (-2.0, 6.5); `picture-frame-set` x4 on the west and north walls at (-10.0, 5.0, 1.5708), (-3.0, 0.02, 0), (-1.6, 3.4, -1.5708) and (-6.0, 0.02, 0); `shelf-wall` with `book-row` and `flower-vase` on the east wall at (-1.2, 6.5, -1.5708); `rug-rect` at (-6.0, 4.0, 0); `wall-clock` at (-8.0, 0.02, 0); `tea-glass-set` x6 with `place: "on:table-round"` (two per table); `plate-set` x4 on the tables; `water-jug` at (-4.0, 6.6, 0); `condiment-tray` at (-7.0, 5.0, 0); `display-case-glass` at (-2.0, 1.2, -1.5708); `notice-board` (community notices) at (-5.5, 7.95, 3.1416) beside the door; `doormat` at (-5.5, 7.6, 0). Lights: pendants group `temple:cafe` (`caf-1` at (-8.0, 3.2, 2.0), `caf-2` at (-4.0, 3.2, 2.0), `caf-3` at (-8.0, 3.2, 6.0), `caf-4` at (-4.0, 3.2, 6.0) and `caf-5` at (-2.0, 3.2, 4.0)), colour `#ffd9a0`, intensity 10, distance 6, `auto: "dusk"`; switch `sw-cafe` at (-4.2, 1.3, 7.85) beside the main door.
- Room `hall` (floor material `woodPlanks`): (all `x, z, rot`) `chair-plastic` x40 in `grid:5x8`: columns x 4.0, 4.8, 5.6, 6.4 and 7.2, rows z 2.6, 3.32, 4.04, 4.76, 5.48, 6.2, 6.92 and 7.64 (the grid extent x 3.75 to 7.45, z 2.35 to 7.9; the stair at x 8.4 to 9.6 keeps clear of it); a stage platform (the dais) x 1.0 to 5.5, z 0.2 to 1.9, built from `podium` at (1.5, 1.0, 0), (3.0, 1.0, 0) and (4.5, 1.0, 0) and `table-folding` at (2.25, 1.6, 0) and (3.75, 1.6, 0); `projector-ceiling` place ceiling at (3.5, 3.9, 4.0); the CODE WALL is `projector-screen` (2.0 m wide, the screen, on the north wall at (3.5, 1.6, 0.05): a 2.0 m slot, not the 3 m slot of the TV; the read point is in front of it); `speaker-studio` at (0.4, 0.6, 0) and (9.4, 0.6, 0); `mic-desk` at (1.4, 1.5, 0) on the dais; `whiteboard-rolling` at (0.4, 3.0, 0) and (0.4, 5.0, 0); `banner-hanging` at (1.0, 0.02, 0) and (6.0, 0.02, 0) on the north wall beside the screen; `fan-ceiling` place ceiling at (1.0, 2.6), (5.0, 6.0), (9.0, 6.0) and (5.0, 2.6); `plant-potted-large` at (9.2, 2.6, 0) and (0.3, 7.5, 0); `curtain-pair` x4 on the east wall at (9.95, 3.0, -1.5708), (9.95, 5.0, -1.5708) and on the south wall at (2.0, 7.95, 3.1416) and (8.0, 7.95, 3.1416); `bench-wood` at (0.4, 6.0, 1.5708) and (0.4, 4.0, 1.5708); `lamp-wall` x4 on the walls at (-0.9, 1.5, 1.5708), (-0.9, 6.5, 1.5708), (9.9, 1.5, -1.5708) and (5.0, 0.02, 0); `notice-board` at (-0.9, 3.5, 1.5708); `ceiling-panel-light` x6 place ceiling (see lights); `fire-extinguisher` at (-0.6, 7.6, 0); `exit-sign` x2 at (6.5, 7.95, 3.1416) above the side door and (-0.9, 0.5, 1.5708) at the west door; `trash-bin-small` x2 at (9.3, 7.5, 0) and (-0.5, 7.5, 0). Lights: groups `temple:hall-front` (`hf-1` at (2.0, 3.8, 1.5), `hf-2` at (6.0, 3.8, 1.5)) and `temple:hall-back` (`hb-1` at (2.0, 3.8, 6.0), `hb-2` at (6.0, 3.8, 6.0)), colour `#fff4e0`, intensity 12, distance 8, no `auto`; switch pair at the side door: `sw-hall-1` at (4.8, 1.3, 7.85) for `temple:hall-front` and `sw-hall-2` at (4.8, 1.3, 7.7) for `temple:hall-back`.
- Room `kitchen` (floor material `floorTileDark`): (all `x, z, rot`) `counter-kitchen-straight` at (-9.6, -2.0, 1.5708) and at (-7.0, -3.6, 0); `stove-gas` at (-6.0, -3.6, 0); `sink-double` at (-8.0, -3.6, 0); `fridge` at (-9.6, -0.6, 1.5708); `rice-cooker` at (-7.2, -2.0, 0) (on the counter); `pot-set` at (-6.0, -2.0, 0) (on the stove side); `pan-hanging` at (-8.6, -3.98, 0) on the north wall; `shelf-utensils` at (-6.4, -3.98, 0) on the north wall; `spice-rack` at (-9.98, -2.8, 1.5708) (west wall); `water-filter` at (-5.4, -1.2, -1.5708) (east wall beside the cafe door); `hood-chimney` at (-6.0, -3.98, 0) above the stove; `tube-light` x2 place ceiling at (-9.0, -2.0) and (-6.0, -2.0); `table-folding` at (-7.5, -1.2, 0) (prep table, clear of the cafe door swing); `trash-bin-small` at (-5.4, -3.4, 0); `grinder-wet` at (-8.6, -1.0, 0) on the counter. Lights: tube lights group `temple:kitchen` (`kit-1` at (-9.0, 3.4, -2.0) and `kit-2` at (-6.0, 3.4, -2.0)), colour `#f4f8ff`, intensity 10, distance 5, no `auto`.
- Room `loft` (floor material `woodPlanks`): (all `x, z, rot`, level-1 coordinates use the same z) `desk-office` at (0.0, -2.2, 0), (2.0, -2.2, 0), (4.0, -2.2, 0) and (6.0, -2.2, 0); `chair-office` x4 at (0.0, -1.0, 3.1416), (2.0, -1.0, 3.1416), (4.0, -1.0, 3.1416) and (6.0, -1.0, 3.1416); `laptop` x3 with `place: "on:desk-office"` (on the first three desks); `monitor-desktop` x2 with `place: "on:desk-office"` (desks 1 and 2); `keyboard-mouse` x4 with `place: "on:desk-office"`; `desk-lamp` x3 with `place: "on:desk-office"` (desks 1, 2 and 3); `bean-bag` x3 at (6.5, 0.5, 0), (7.5, 1.0, 0) and (5.6, 1.2, 0); `bookshelf-tall` at (-0.4, -0.5, 1.5708) and (9.4, -2.5, -1.5708); `plant-office` at (9.2, 0.5, 0), (-0.4, 1.4, 0) and (8.6, -0.6, 0); `lamp-table` at (7.4, -2.8, 0), (1.0, 0.0, 0) and (9.0, 1.4, 0); `whiteboard-rolling` at (8.0, -2.4, 3.1416); `table-coffee` at (4.5, 0.4, 0); `sofa-2` at (7.0, 0.9, 0) against the bean bags; `rug-round` at (5.0, 0.4, 0); `wall-clock` at (8.0, -2.95, 0) on the north wall; `fan-ceiling` x2 place ceiling at (2.0, -0.5) and (7.0, -0.5); `ac-split` at (9.0, -2.95, 0); `kanban-board` at (3.0, -2.95, 0) on the north wall. Lights: group `temple:loft` (`lof-1` at (1.0, 6.9, -1.0), `lof-2` at (6.0, 6.9, -1.0) and `lof-3` at (9.0, 6.9, 0.8)), colour `#f2f6ff`, intensity 12, distance 8, no `auto`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: code-wall (`read`, the object is the large "code wall" screen (the `projector-screen` on the north wall of the hall at (3.5, 1.6, 0.05), behind the stage)); light switches per room; seats the cafe chairs (`sit-cafe-1` to `sit-cafe-12` on `chair-cane`), the hall chairs (`sit-hall-1` to `sit-hall-40` on `chair-plastic`; at least 10 of them are seat interactables) and the bean bags (`sit-bag-1` to `sit-bag-3` on `bean-bag`).
- `tests/unit/buildings/templeInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; there are exactly 40 chair-plastic items in the hall (the 5 by 8 grid) and the 36 minimum holds; the stage does not block the aisle (a 1.0 m wide path from the cafe-hall door at (-1, 4) to the screen at (2.5, 2.4), clear of the chair grid and the stair); the cafe, hall and kitchen have at least 12 distinct types each and the hall (the main room) has at least 14.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/templeInterior.test.js`
- `node scripts/check-buildings.mjs --only temple`

### Step 4: Convert the zone, stream it, Playwright, budgets and shots

Deliver:
- `src/world/zones.js`: `temple` keeps its zone id and becomes `name: "Community Hall"`, `prompt: "read the wall"`, `mode: "object"` (ARCHITECTURE 10.7, A30). Update the temple dialogue title in `src/content/dialogues.js` (facts unchanged, no "accent part" wording). Remove the v1 temple factory from `src/world/buildings.js` with its collider and animation hooks; record the removed identifier in the report and check it with `none` in the verify list. The README zone table label is in the plan `allowed` list (plan 043 pattern); the minimap label file is named in the report, or it becomes a human_check item if it is outside the allowed paths.
- The temple area is registered with one line `registerLandmarkArea(createTempleArea)` in `src/world/areas/index.js` (plan 040), file `src/world/areas/templeArea.js`: priority 30, loadRadius 120, unloadRadius 170, interior true. The read interactable `code-wall` opens the existing dialogue for `temple` (A5). `tests/fixtures/zoneExpect.json` already has `temple` (plan 043): no change.
- The zones mode check: `mode: "object"` means the E key only. A teleport 2.5 m away from the code wall, at (3.5, 4.0), with `E` pressed there does NOT open the dialogue (`#dialogue` stays hidden); the E key at the code wall opens it.
- `tests/e2e/temple.spec.js` (generated name, frozen) on `/?only=temple&time=0.5&freeze=1&seed=1337`: teleport 6 m in front of the main door, `e` opens it, walk in with no loader; `listBuildings()` shows `temple` exactly once with `interiorVisible` true and no problems; teleport to 2.5 m in front of the code wall, press `e`, `#dialogue` is visible and contains every string of `zoneExpect.json` for temple plus the display name, Escape closes; the stair check of the e2e extra with the loft bounds (all with `expect.poll`, no fixed waits); zero console errors.
- Budget and shot spots (ids of this plan only; NOT `temple`, which belongs to plan 039): `temple-outside` (budget and shot) camera at local (0, 14), height 4.0, yaw 0, pitch 0.1; `temple-inside` (budget and shot; the main room, the hall) camera at local (2.5, 6.0), height 1.6, yaw 0.197, pitch 0 (it looks at the stage and the screen); `temple-stair` (shot only) camera at local (6.0, 6.0), height 1.6, yaw 0.0, pitch -0.05 (the stair in the hall). World = anchor (x, z read from town.json, ground y from town.json) plus local, with the rotation from town.json added to the yaw; the anchor values are written into both files. `has` checks on both files; `npm run check:budget` passes; run `npm run shots -- --plan 50 --spots temple-outside,temple-inside,temple-stair`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures and black rooms (best effort, list the fixes under `different_from_plan`).
- Signage: the keys `oss-cafe` and `community-hall` exist in `src/content/signage.js` (asserted with `has`); the manifest `stage` is set to `full` (json assert below).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/temple.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only temple`
- `node "{{runner}}/assert.mjs" json src/world/buildings/temple/manifest.json stage full`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "temple"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createTempleArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "DECORATORS.temple"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "oss-cafe"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "community-hall"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "temple-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "temple-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "temple-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "temple-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "temple-stair"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/temple.test.js tests/unit/buildings/templeExterior.test.js tests/unit/buildings/templeInterior.test.js`
- `node scripts/check-buildings.mjs --only temple`
- `npx playwright test tests/e2e/temple.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): The building must read as a community cafe and civic hall, not a temple. The Tamil of the two signs is a draft: review it.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
