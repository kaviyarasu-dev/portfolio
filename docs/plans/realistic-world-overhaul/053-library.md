# Plan 053: Grand public library with archive stacks (zone library)

Epic E4. Estimated turns: 60. Model: opus.

## Goal

Build the grand public library: a two-level reading hall with a mezzanine, a reading room, children's section, the librarian office and the archive stacks where the experience timeline lives. The archive ledger on its lectern opens the experience dialogue (journey 3 will check that the listed roles equal the content file).

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only library`).

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
- src/world/kit/exterior.js
- src/world/props/sets/seating.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Public Library

Deliver:
- Create `src/world/buildings/library/manifest.json` (schema of `docs/building-manifest.md`): `id: "library"`, `displayName: "Public Library"`, `prompt: "read archives"`, footprint taken from the `library` anchor in `src/world/layout/town.json` (exactly 24 by 18 m (`footprint { w: 24, d: 18 }`, building-local x -12 to 12 and z -9 to 9, origin at the centre, +z = front/south); the `library` anchor of `town.json` (plan 032) must have that size, else stop with BLOCKED.md), floors ground (level 0, y 0, height 4.8) and an archive level (level 1, y 5.0, height 3.4) over the rear part of the main hall (z -3 to 3, x -12 to 0); top-level `"stage": "structure"` for now (the interior step raises it to `full`), top-level `roomMin` `{ "main-hall": 14, "reading-room": 12, "archive-stacks": 14, "childrens-section": 12, "librarian-office": 12 }`, style: plaster wall tint `#e8d9b9`, `hip` roof with a central `dome` accent over the hall (use `hip` roof and add a small dome through the decorate hook), stone plinth in `stoneRough`, trim `woodDark`, arched windows.
- Rooms (ids fixed): `main-hall` (grand reading hall, 14 by 12 m, double height at the front); `reading-room` (quiet reading room, 8 by 6 m); `archive-stacks` (archive stacks and timeline (mezzanine level 1), 12 by 6 m); `childrens-section` (children's corner, 6 by 5 m); `librarian-office` (librarian office, 5 by 4 m). Room count between 3 and 6.
- Doors: five doors; `at` = metres along the wall from the wall centre (world coordinate in brackets): `main` (the double main door, ONE 2.2 m double leaf, exterior, unlocked) on the south wall of `main-hall` (z 9), at world x -5.0 (the centre of the leaf), width 2.2, height 2.6, hinge double; `side` (second exterior door, the one the exteriorDetails door count 2 refers to, exterior, unlocked, width 1.2, height 2.2) on the west wall of `main-hall` (x -12) at world z 6.0, hinge left; `hall-reading` (interior, unlocked, width 1.8) on the east wall of `main-hall` (x 2) at world z 0.0, hinge left; `hall-childrens` (interior, unlocked, wide, width 2.0) on the east wall of `main-hall` (x 2) at world z 5.5, hinge right; `hall-office` (interior, unlocked, width 0.9) on the north wall of `main-hall` (z -3) at world x -1.0, hinge left. Rooms (bounds `[x0, z0, x1, z1]`, ground level 0): `main-hall` `[-12, -3, 2, 9]` (14 by 12, double height at the front), `reading-room` `[2, -3, 10, 3]` (8 by 6), `childrens-section` `[2, 3, 8, 8]` (6 by 5), `librarian-office` `[-3, -7, 2, -3]` (5 by 4, north of the hall), `archive-stacks` `[-12, -3, 0, 3]` (12 by 6, LEVEL 1, y 5.0, over the rear part of the hall). LEFTOVER RULE (decision): the five rectangles do not overlap and do not tile; the leftover is two walled courtyards with no floor, not walkable, no door; their walls are the building walls and windows may face them. The archive has NO door: it is reached only by the stair. STAIR (explicit, not the default run): `main-staircase` x -2.0 (centre), dir -z (north), width 1.6, rise 5.0, run 6.4, foot at world z 3.6 (ground, inside the hall), top edge at world z -2.8 (inside the archive bounds); the level-1 slab has a rectangular hole x -2.8 to -1.2, z -2.8 to 3.6 for the stair (slab hole behaviour: the stair passes through the hole and the top lands on the archive floor). At least one unlocked exterior door that is not decorative. Windows: exactly 14 windows, ids `w-1` to `w-14`, all rectangular (the arch is a decorator extra above each one, see the exterior step), width 1.4, height 2.4, sill 1.2 on level 0 and sill 5.8 on level 1: `w-1` `main-hall` west wall z -1.5; `w-2` `main-hall` west wall z 1.5; `w-3` `archive-stacks` west wall z -1.0 (level 1); `w-4` `main-hall` south wall x -10.0; `w-5` `main-hall` south wall x -8.0; `w-6` `main-hall` south wall x -1.0; `w-7` `main-hall` south wall x 1.0; `w-8` `reading-room` east wall z -1.5; `w-9` `reading-room` east wall z 1.5; `w-10` `childrens-section` south wall x 4.0; `w-11` `childrens-section` south wall x 6.5; `w-12` `librarian-office` north wall x -1.0; `w-13` `archive-stacks` north wall x -8.0 (level 1); `w-14` `archive-stacks` north wall x -5.0 (level 1). Stairs and lifts: main staircase `main-staircase` from `main-hall` to `archive-stacks` as given in the doors text (rise 5.0, width 1.6, run 6.4), no lift.
- `exteriorDetails` counts (all seven classes, window at least 4): window 14, door 2 (`main` and `side`), signage 2, drainpipe 4, planter 6, bin 3, lamp 8 (the manifest counts; the generic kit builds window, door and drainpipe, the decorator builds signage, planter, bin and lamp (`skipGeneric`)); the extras (builders in `build.js`, never declared in the manifest, ARCH 10.8) are the entrance steps with balustrade, 4 columns with capitals, the pediment gable, the dome with finial, the 14 window arches, and 2 lamp posts (`detailClass: "extra"`; the lamp posts are NOT the lamp class, so the declared lamp 8 counts the decorator lamps only). `interactables`: declare only `archive-ledger` now (kind `read`, room `archive-stacks`, `dialogueKey` `main`, prompt "read archives").
- `tests/unit/buildings/library.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the archive stacks `archive-stacks` are reachable only by the stair (no door), the main door `main` is a 2.2 m double leaf and unlocked, the side door `side` is unlocked, exactly 14 windows `w-1` to `w-14`, the five room rectangles do not overlap and lie inside the 24 by 18 footprint, and the stair `main-staircase` has rise 5.0, width 1.6 and run 6.4; the CLI `check:buildings --only library --stage structure` exits 0.
- Manifest data (exact; building-local x and z, origin at the centre): `footprint { w: 24, d: 18 }`; ground rooms `main-hall` `[-12, -3, 2, 9]` (`marble`), `reading-room` `[2, -3, 10, 3]` (`woodPlanks`), `childrens-section` `[2, 3, 8, 8]` (`carpet`), `librarian-office` `[-3, -7, 2, -3]` (`woodPlanks`); level-1 room `archive-stacks` `[-12, -3, 0, 3]` (`woodPlanks`, floors entry `{ level: 1, y: 5.0, height: 3.4 }`); `floors` `[{ level: 0, y: 0, height: 4.8 }, { level: 1, y: 5.0, height: 3.4 }]`; the five doors, the stair and the fourteen windows exactly as given above; the slab hole for the stair as given. LEFTOVER RULE: rectangles never overlap, do not tile, the leftover is two walled floorless courtyards (not walkable, no door, windows may face them). `interactables` written in this step: `archive-ledger` `{ kind: "read", room: "archive-stacks", x: -8.0, y: 5.0, z: 1.2, dialogueKey: "main", prompt: "read archives" }` (the ledger rests on the single lectern `podium` at (-8.0, 5.0, -0.5), top at y 6.0; the read point is 1.7 m in front of it). The duplicate "reading-desk lectern" wording is removed: the archive has ONE lectern, the `podium`.
- Doors and stairs: `main` is the only unlocked exterior door that is not decorative; `side` is an unlocked exterior door (the second exterior door of the 2 declared); the archive has NO door.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/library.test.js`
- `node scripts/check-buildings.mjs --only library --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/library/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/library/build.js` exports `decorateLibrary(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): all positions building-local (south wall at z 9, +z outward), everything via `instance.addDetail`: (a) the lit sign `signboard({ key: "zone-library", w: 4.4, h: 0.8, style: "board" })` above the main door at x -5.0, y 4.2, z 9 (declared signage 1; its English is the zone name "Public Library", the frozen 025 value; the Tamil "பொது நூலகம்" is a draft); (b) the entrance steps `entranceSteps({ w: 6.0, treads: 3 })` x1 in front of the main door (extra, `detailKind: "steps"`, box colliders per tread), with a stone balustrade `balustrade({ length: 6.0 })` x2 along the steps; (c) the portico `column({ height: 4.2 })` x4 with capitals at x -7.5, -6.5, -3.5, -2.5 in front of the main door (extra, `detailKind: "column"`, box colliders); (d) the pediment gable `pediment({ w: 7.0 })` x1 over the porch (extra, `detailKind: "pediment"`); (e) the dome `dome({ radius: 2.6, finial: true })` x1 on the hip roof over the hall (extra, `detailKind: "dome"`, added through the decorate hook); (f) the 14 window arches `arch` x14 above the windows (extra, `detailKind: "window-arch"`, one per window `w-1` to `w-14`, stone surround); (g) two lamp posts `lampPost()` x2 beside the steps at (-9.0, 8.5) and (-1.0, 8.5) (extra, `detailKind: "lamp-post"`, not the lamp class); (h) the planters are the decorator planters (declared 6).
- Signage from `src/content/signage.js`: add the keys `zone-library` (the existing plan 025 key, English "Public Library"; the frozen test needs it to equal the zone name, so no second exterior key), `library-hall` (new interior key, interior sign-board in the hall, English "LIBRARY", Tamil நூலகம், digit-free), `archive` (ARCHIVE / காப்பகம், the sign on the wall beside the stair foot in the hall), `quiet` (QUIET PLEASE / அமைதி, the sign on the reading-room wall beside `hall-reading`); every key is digit-free, the Tamil is a draft for review (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/libraryExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- `src/world/buildings/library/build.js` exports `decorateLibrary(instance, ctx)` and the builders `entranceSteps`, `balustrade`, `column`, `pediment`, `dome`, `arch`, `lampPost` (each returns an Object3D whose root `userData` has `detailClass: "extra"`, `detailKind` and, when solid, `colliders` in the plan 025 form; at most 8 meshes each; materials from `getMaterial` only; deterministic).
- `src/world/buildings/registry.js` (read first): `import { decorateLibrary } from "./library/build.js"` and `DECORATORS.library = { decorate: decorateLibrary, skipGeneric: ["signage", "planter", "bin", "lamp"] }`. `tests/unit/buildings/libraryExterior.test.js` (headless build with `getDecorator("library")`) asserts the decorator is defined with those names; `countDetails` gives window 14, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8 and extras `steps` 1, `balustrade` 2, `column` 4, `pediment` 1, `dome` 1, `window-arch` 14, `lamp-post` 2; the dome finial is above the hip roof; every decorator lamp is in group `library:exterior`.
- The dome is built by the decorate hook over the hip roof of the building shell (`src/world/kit/shell.js` ridge and overhang are read first); no change to the kit.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/libraryExterior.test.js`
- `node scripts/check-buildings.mjs --only library --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/library/build.js`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "library"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/library/build.js "decorateLibrary"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/library/build.js "pediment"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/library/build.js "lamp-post"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "zone-library"`
- `node "{{runner}}/assert.mjs" has tests/unit/buildings/libraryExterior.test.js "getDecorator"`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `main-hall` (floor material `marble`): `reading-desk` x4, `chair-wooden` x16, `library-stack` x6, `ladder-library` x2, `card-catalog`, `book-cart` x2, `globe`, `map-table`, `lamp-pendant` x6, `reading-lamp-green` x6, `plant-potted-large` x4, `bench-wood` x2, `fan-ceiling` x4, `sign-board` ("LIBRARY / நூலகம்": key `library`), `wall-clock`, `picture-frame-set` x4, `rug-rect` x2, `notice-board`, `magazine-rack`, `display-case-glass` x2, `plaque-wall`, `bust-abstract`, `flower-vase` x2. Lights: pendants and green lamps groups `library:hall` and `library:reading` auto dusk, switch at the door.
- Room `reading-room` (floor material `woodPlanks`): `reading-desk` x3, `chair-wooden` x10, `library-stack` x3, `reading-lamp-green` x6, `bookshelf-tall` x2, `armchair` x2, `table-side`, `rug-rect`, `curtain-pair` x3, `plant-potted-small` x3, `wall-clock`, `fan-ceiling` x2, `picture-frame-set` x2, `lamp-floor`. Lights: group `library:reading-room`.
- Room `archive-stacks` (floor material `woodPlanks`): `library-stack` x8, `archive-box` x10, `scroll-case` x4, `map-table`, `ladder-library` x2, `card-catalog` x2, `reading-lamp-green` x4, `reading-desk` (the archive lectern: type `podium` for the ledger), `podium`, `timeline-wall` (6 m with the years of the experience entries as text slots), `display-case-glass` x2, `rope-barrier` x2, `lamp-wall` x4, `rug-rect`, `fan-ceiling`, `book-cart`. Lights: warm lamps group `library:archive`.
- Room `childrens-section` (floor material `carpet`): `bookshelf-low` x4, `book-row` filled, `table-round` x2, `chair-plastic` x8, `bean-bag` x4, `rug-round` x2, `plant-potted-small` x2, `picture-frame-set` x3, `lamp-pendant` x2, `wall-chart`, `cushion-set` x2, `stool` x4, `armchair` x1, `table-side` x1 (14 types; the room had exactly 12, so the two added types give the roomMin margin). Lights: group `library:kids`: four ceiling lights `kids-1` to `kids-4` (colour `#fff3dc`, intensity 10, distance 6, auto dusk).
- Room `librarian-office` (floor material `woodPlanks`): `desk-wood`, `chair-office`, `chair-wooden` x2, `filing-cabinet` x2, `bookshelf-tall`, `book-cart`, `lamp-table`, `monitor-desktop`, `keyboard-mouse`, `phone-desk`, `stamp-desk`, `wall-clock`, `fan-ceiling`, `plant-office`, `rug-rect`, `cabinet-glass`. Lights: group `library:office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. The distinct types per room: main-hall at least 14, reading-room 12, archive-stacks 14, childrens-section 14, librarian-office 12; the rooms rule holds for all five.
- Interactables: archive-ledger (`read`, the object is the archive ledger on its lectern (`podium`) under the timeline wall); light switches per room; seats reading chairs (at least 8 are seat interactables), the armchairs and bean bags.
- Lights (`auto: "dusk"`, each named, positions inside the room bounds 2.4 m from the walls at the ceiling height): group `library:hall`: pendants `hall-1` to `hall-6` at (-9, 3.8, 4), (-5, 3.8, 4), (-1, 3.8, 4), (-9, 3.8, 0), (-5, 3.8, 0), (-1, 3.8, 0), colour `#ffe2b0`, intensity 10, distance 8; group `library:reading` (the six green table lamps, see the placements) `reading-1` to `reading-6`, colour `#b8f0c8`, intensity 4, distance 3; group `library:reading-room`: `reading-room-1` to `reading-room-4` at (4, 3.6, -1.5), (8, 3.6, -1.5), (4, 3.6, 1.5), (8, 3.6, 1.5), colour `#fff1d0`, intensity 10, distance 7; group `library:archive`: `archive-1` to `archive-4` warm lamps at (-10, 6.6, -1.5), (-6, 6.6, -1.5), (-10, 6.6, 1.5), (-6, 6.6, 1.5), colour `#ffd9a0`, intensity 6, distance 5; group `library:kids`: `kids-1` to `kids-4` (the room list); group `library:office`: `office-1` at (-0.5, 3.6, -5.0) colour `#fff1d0`, intensity 10, distance 6 and `office-2` at (1.0, 1.1, -4.5) table lamp, intensity 4, distance 3, no auto.
- Switches (kind `switch`, y 1.3, `group` as named): `sw-hall` (main-hall, x -3.4, z 8.4, group `library:hall`), `sw-reading` (reading-room, x 2.4, z -2.4, group `library:reading-room`), `sw-archive` (archive-stacks, x -0.5, z -2.6, group `library:archive`, beside the stair top), `sw-kids` (childrens-section, x 2.4, z 7.6, group `library:kids`), `sw-office` (librarian-office, x 1.4, z -6.4, group `library:office`). Seats (kind `sit`, `object` = the prop type, at least 8 seats in total): `sit-hall` (main-hall, `chair-wooden`, 16), `sit-reading` (reading-room, `chair-wooden`, 10), `sit-armchair` (reading-room, `armchair`, 2), `sit-kids` (childrens-section, `chair-plastic`, 8), `sit-bean` (childrens-section, `bean-bag`, 4).
- Placements (about 150 entries): main-hall about 62 (`reading-desk` x4, `chair-wooden` x16 at the desks, `library-stack` x6, `ladder-library` x2, `card-catalog`, `book-cart` x2, `globe`, `map-table`, `lamp-pendant` x6, `reading-lamp-green` x6 on the desks (`place: "on:reading-desk"`), and the rest as listed); reading-room about 30 (`book-row` filled as an option of `bookshelf-tall`, not a separate type); archive-stacks about 26 with the `podium` lectern and the `timeline-wall` (6 m, 8 slots `event-1` to `event-8`, filled as given in the interior test); childrens-section about 20; librarian-office about 14. Floor items use explicit x, y, z and rot, items on desks and lecterns use `place`. Each `reading-desk` has exactly one lamp.
- At the end of this step set top-level `"stage": "full"` in `src/world/buildings/library/manifest.json`.
- `tests/unit/buildings/libraryInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the `timeline-wall` (plan 042 fixes 8 slots `event-1` to `event-8`, frozen): the first N slots carry the N entries of `src/content/experience.js` (N is read from the file at test time) as short company names (for example "Sparkout"), the remaining slots are empty strings, every entry text fits the 0.68 by 0.9 m slot; the years go in a second line of the same slot; the stair `main-staircase` leads to the stacks (a walk test along the stair).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/libraryInterior.test.js`
- `node scripts/check-buildings.mjs --only library`
- `node "{{runner}}/assert.mjs" has src/world/buildings/library/manifest.json "archive-ledger"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/library/manifest.json "main-staircase"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/library/manifest.json "sit-hall"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/library/manifest.json stage full`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- Area: `src/world/areas/libraryArea.js` exports `createLibraryArea(game, deps = {})` returning `{ id: "library", priority: 30, loadRadius: 120, unloadRadius: 170, interior: true, load, unload }` at the `library` anchor of `src/world/layout/town.json`; registered by ONE line `registerLandmarkArea(createLibraryArea)` in `src/world/areas/index.js` (plan 040). `tests/unit/buildings/libraryArea.test.js` (fake deps) asserts the fields, preload before build, nothing left after `unload`, a second `load` after `unload`, and that `library` appears once in `createAllAreas`.
- Remove the v1 library: in `src/world/buildings.js` delete `buildLibrary` (the factory around line 733, and its table entry near line 923) and any helper only it used (grep first); in `src/world/collision.js` and `src/world/buildingAnims.js` delete only the library entries (list them in the report). `src/content/dialogues.js`: the library title becomes `titleBar("Public Library -", "Experience")` with the accent part unchanged. `src/world/zones.js`: `library` becomes `name: "Public Library"`, `prompt: "read archives"`, `mode: "object"` with the object point x, z, r of the ledger (world x of the ledger, z of the ledger, r 2.0). `src/ui/minimap.js`: the label for the zone is the zone name. README zone row becomes Public Library (README.md is allowed). Test `tests/unit/world/zones.test.js` asserts mode object (E away from the ledger does NOT open the dialogue; E at its read point does).
- Spots: `library-outside`, `library-inside` and `library-archive` with the anchor at world (ax, az) and rotation 0: `library-outside` { x ax, y 1.8, z az+17.0, yaw 0, pitch 0.06 } (the steps, the portico and the dome in view); `library-inside` { x ax-4.0, y 1.6, z az+5.0, yaw 0.524, pitch -0.08 } (the hall toward the reading desks); `library-archive` { x ax-6.0, y 6.6, z az+0.0, yaw -0.785, pitch -0.05 } (the archive from the stair top toward the timeline wall). `library-outside` and `library-inside` go into BOTH `src/budgets.json` and `src/shots.json`; `library-archive` goes into `src/shots.json` only with the `extraShots` list. If the anchor rotation is not 0, recompute all three with the ARCHITECTURE 10.8 transform.
- `src/world/zones.js`: `library` becomes `name: "Public Library"`, `prompt: "read archives"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `library` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `library` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `library` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the archive ledger on its lectern (`podium`) under the timeline wall) so `E` opens the existing dialogue for `library` (A5); the dialogue is the experience timeline as in v1; the title text becomes exactly `Public Library -` followed by the v1 `Experience` word and the accent part, unchanged; the roles listed in the dialogue come only from `src/content/experience.js`; the content file is the single source.
- Add `library` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/library.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `library` with `interiorVisible` true and empty `problems`; walk to the the archive ledger on its lectern (`podium`) under the timeline wall and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[library].mustInclude` and the display name; Escape closes; teleport to the stair foot (building-local x -2.0, z 3.6, converted to world with the anchor), hold `w` with yaw 0 until `expect.poll` shows the player y within 0.1 m of 5.0 and inside the archive bounds (no fixed waits); teleport to the ledger read point (-8.0, 5.0, 1.2) and press `e`; the dialogue lists the same number of roles as `experience.js` (count the entries in the DOM against the content file imported in the test); URL `/?only=library&time=0.5&freeze=1&seed=1337`; zero console errors.
- Add budget spots `library-outside` and `library-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 053 --spots library-outside,library-inside,library-archive`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/library.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only library`
- `npx vitest run tests/unit/world/zones.test.js tests/unit/buildings/libraryArea.test.js tests/unit/content/zoneExpect.test.js`
- `node "{{runner}}/assert.mjs" json src/world/buildings/library/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createLibraryArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "decorateLibrary"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "buildLibrary"`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Public Library"`
- `node "{{runner}}/assert.mjs" has README.md "Public Library"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "library-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "library-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "library-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "library-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "library-archive"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/library.test.js tests/unit/buildings/libraryExterior.test.js tests/unit/buildings/libraryInterior.test.js`
- `node scripts/check-buildings.mjs --only library`
- `npx playwright test tests/e2e/library.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run test`
- `npm run check:content`
- `npm run check:local`
- `npx vitest run tests/unit/buildings/libraryExterior.test.js tests/unit/buildings/libraryArea.test.js tests/unit/props/seating.test.js`

Human check (goes in the report, never blocks): Judge the library atmosphere. Also check the Tamil of the signs (பொது நூலகம், நூலகம், காப்பகம், அமைதி) which are drafts for the person.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
