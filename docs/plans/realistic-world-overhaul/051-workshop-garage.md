# Plan 051: Startup garage studio (zone workshop): 1CLX

Epic E4. Estimated turns: 60.

## Goal

Build the 1CLX startup garage: a converted garage with a half-open roller door, a dev corner, a meeting nook, a store and a tiny pantry, with startup character (whiteboards covered in sketches, a website-builder prototype on a big monitor, bean bags, cables). The big whiteboard opens the 1CLX project dialogue.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only workshop`).

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
- src/world/areas/forgeArea.js
- src/world/kit/exterior.js
- src/world/props/sets/tools.js
- src/world/buildings/forge/build.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Startup Garage

Deliver:
- Create `src/world/buildings/workshop/manifest.json` (schema of `docs/building-manifest.md`): `id: "workshop"`, `displayName: "Startup Garage"`, `prompt: "tinker"`, footprint taken from the `workshop` anchor in `src/world/layout/town.json` (exactly 16 by 12 m (`footprint { w: 16, d: 12 }`, building-local x -8 to 8 and z -6 to 6, origin at the centre, +z = front/south, N = -z); the `workshop` anchor of `town.json` (plan 032) must have that size, else stop with BLOCKED.md (the 043 pattern)), floors one floor (level 0, y 0, height 3.8), top-level `"stage": "structure"` for now (the interior step raises it to `full`), top-level `roomMin` `{ "garage-floor": 14, "meeting-nook": 12, "store": 12, "pantry": 12 }`, style: plaster wall tint `#d9cdb8`, `gable` roof `metalPainted` pitch 0.25, trim `woodDark`.
- Rooms (ids fixed): `garage-floor` (main open studio, 9 by 8 m); `meeting-nook` (meeting nook, 4 by 4 m); `store` (parts and stock store, 4 by 4 m); `pantry` (pantry corner, 3 by 3 m). Room count between 3 and 6.
- Doors: five doors; `at` = metres along the wall from the wall centre (world coordinate in brackets): `roller` (the roller door, DECORATIVE: kind `decorative`, not openable, the opening is free) on the south wall of `garage-floor`, width 3.2, height 3.0, at -4.0 (world x -4.0), hinge left; `main` (THE pedestrian door that every test and the e2e use) on the south wall of `garage-floor`, kind `exterior`, unlocked, width 1.2, height 2.2, at -1.0 (world x -1.0), hinge left; `meeting-door` from `garage-floor` to `meeting-nook` on the north wall of the garage (z -2), at -6.0 (world x -6.0), width 1.0, height 2.2, `interior`, unlocked, hinge right; `store-door` from `garage-floor` to `store` on the same wall, at -2.0 (world x -2.0), width 1.0, height 2.2, `interior`, unlocked, hinge left; `pantry-door` from `store` to `pantry` on the east wall of the store (x 0), at -0.5 (world z -4.5), width 0.9, height 2.2, `interior`, unlocked, hinge right. At least one unlocked exterior door that is not decorative. Windows: exactly 7 windows, ids `w-1` to `w-7`, all width 1.2, height 1.4, sill 1.0, each on an exterior wall of its room (no window faces the solid service void): `w-1` `garage-floor` west wall z 1.0; `w-2` `garage-floor` west wall z 4.0; `w-3` `garage-floor` south wall x -7.0; `w-4` `meeting-nook` west wall z -4.0; `w-5` `meeting-nook` north wall x -6.0; `w-6` `store` north wall x -2.0; `w-7` `pantry` north wall x 1.5. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 7, door 2 (`main` and `roller`), signage 2, drainpipe 4, planter 3, bin 2, lamp 4 (the manifest counts; the generic kit builds window, door and drainpipe, the decorator builds signage, planter, bin and lamp (`skipGeneric`)); the extras (builders in `build.js`, never declared in the manifest, ARCH 10.8) are: string lights, 2 scooters, a pallet bench, 3 tubs, a bicycle (`cycle-parked`, the plan 039 local item), a cable run and the satellite dish (`dish`, the plan 025 kit extra, not the prop). `interactables`: declare only `project-whiteboard` now (kind `read`, room `meeting-nook`, `dialogueKey` `main`, prompt "tinker").
- `tests/unit/buildings/workshop.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the roller door `roller` is `decorative` and 3.2 m wide, the pedestrian door `main` is unlocked and not decorative, exactly 7 windows with ids `w-1` to `w-7`, the four room rectangles (garage-floor 9 by 8, meeting-nook 4 by 4, store 4 by 4, pantry 3 by 3) do not overlap, the leftover footprint is solid service void with no door, and all four rooms are reachable from `garage-floor` through the unlocked interior doors (`store` to `pantry` through `pantry-door`); the CLI `check:buildings --only workshop --stage structure` exits 0.
- Manifest data (exact; building-local x and z, origin at the footprint centre): `footprint { w: 16, d: 12 }`; rooms `garage-floor` `[-8, -2, 1, 6]` (9 by 8, `surface` concrete), `meeting-nook` `[-8, -6, -4, -2]` (4 by 4, `woodPlanks`), `store` `[-4, -6, 0, -2]` (4 by 4, `concrete`), `pantry` `[0, -6, 3, -3]` (3 by 3, `floorTile`). LEFTOVER RULE (decision): the four rectangles do not tile the footprint (they cover 113 of 192 m2); the leftover 79 m2 is solid service void (thick walls, no room, no walk, no door, no window); the rectangles never overlap. `floors` `[{ level: 0, y: 0, height: 3.8 }]`; the five doors and seven windows exactly as given above; `roomMin` `{ "garage-floor": 14, "meeting-nook": 12, "store": 12, "pantry": 12 }`; `interactables`: `project-whiteboard` `{ kind: "read", room: "meeting-nook", x: -6.0, y: 1.5, z: -3.4, dialogueKey: "main", prompt: "tinker" }` (the whiteboard stands on the north wall at x -6.0, z -5.85, front toward +z, read point 2.45 m in front of it; readZone left at its default). Only this read point is written in the structure step.
- Doors: `main` (pedestrian, THE door of every test) is the only unlocked exterior door that is not decorative; `roller` is `decorative`. The stairs and lifts line is `none`. The manifest is `stage: "structure"` until the interior step.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/workshop.test.js`
- `node scripts/check-buildings.mjs --only workshop --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/workshop/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/workshop/build.js` exports `decorateWorkshop(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): all positions building-local (south wall at z 6, +z outward; rotations as in the generic placer), everything via `instance.addDetail`: (a) the DECORATIVE roller door `roller` (decision: decorative, the opening stays free) drawn by the new shared kit builder `rollerDoor({ width: 3.2, height: 3.0, ribs: 14, raised: 0.5 })` added to `src/world/kit/exterior.js`: a ribbed leaf over the top 1.5 m (half raised), a roll housing, no collider over the opening; plan 044 keeps its own `rollerShutter` in `forge/build.js` and this plan does not touch it (see the report: 044 may switch to the kit builder later); (b) the hand-painted signboard `signboard({ key: "onecl", w: 3.6, h: 0.7 })` above the roller door at x -5.0, y 3.2, z 6 (declared signage 1) and a second sign `signboard({ key: "open", w: 0.8, h: 0.3, style: "plaque" })` right of the main door at x 0.6, y 1.55, z 6 (declared signage 2, existing key `open`); (c) the extras (`detailClass: "extra"`, never declared): `stringLights()` x1 (12 bulbs along the south eave, lights in group `workshop:exterior`, `auto: "dusk"`), `scooter()` x2 (2 scooters, not motorbikes, at (-7.3, 4.6, 1.5708) and (-7.3, 5.4, 1.5708), box colliders), `palletBench()` x1 at (3.0, 6.6, 0), `tub()` x3 at (4.4, 6.5), (5.0, 6.5) and (5.6, 6.5) (`detailKind: "tub"`, wooden, plants optional), `cycle-parked` x1 (the plan 039 local item) at (-8.6, 2.0, 1.5708) against the west wall, `cableRun({ length: 6 })` x1 along the south wall from x 6.0 to 8.0 (grounded), `dish` x1 (the plan 025 kit extra, not the prop) on the roof at (7.0, 3.8, -2.0). Counts are asserted in the exterior test.
- Signage from `src/content/signage.js`: add the keys `onecl` (English 1CLX, Tamil ஒன்-சி-எல்-எக்ஸ் draft: the Tamil is a transliteration for the person to check), `open` (existing key, Open / திறந்திருக்கிறது); the digits in "1CLX" are text, the plan 025 digit-free rule applies to the keys only (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/workshopExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- `src/world/buildings/workshop/build.js` exports `decorateWorkshop(instance, ctx)` and the new builders `stringLights`, `scooter`, `palletBench`, `tub` and `cableRun` (each returns an Object3D whose root `userData` has `detailClass: "extra"`, `detailKind` and, when solid, `colliders` in the plan 025 form; at most 8 meshes per builder; materials from `getMaterial` only; deterministic). `cycle-parked` (plan 039) and `dish` (plan 025 kit extra) are reused by their exported builders, not copied.
- The kit builder `rollerDoor({ width, height, ribs, raised })` is added to `src/world/kit/exterior.js` (shared kit file; plan 044 keeps its own `rollerShutter` in `forge/build.js`, not changed here). `tests/unit/kit/exterior.test.js` gets a test: `rollerDoor({ width: 3.2, height: 3.0, ribs: 14, raised: 0.5 })` has 14 slats, a top half that reaches 1.5 m and no collider over the opening.
- `src/world/buildings/registry.js` (read first): `import { decorateWorkshop } from "./workshop/build.js"` and `DECORATORS.workshop = { decorate: decorateWorkshop, skipGeneric: ["signage", "planter", "bin", "lamp"] }`.
- `tests/unit/buildings/workshopExterior.test.js` also asserts (headless build with `getDecorator("workshop")`): `countDetails` gives the declared counts (window 7, door 2, signage 2, drainpipe 4, planter 3, bin 2, lamp 4) and the extras `string-lights` 1, `scooter` 2, `pallet-bench` 1, `tub` 3, `cycle-parked` 1, `cable-run` 1, `dish` 1; every lamp registers a light in group `workshop:exterior`; the manifest `roller` door is `decorative` and `main` is not; the two signs record `{ en: "1CLX", ta: "ஒன்-சி-எல்-எக்ஸ்" }` and `{ en: "Open", ta: "திறந்திருக்கிறது" }`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/workshopExterior.test.js`
- `node scripts/check-buildings.mjs --only workshop --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/workshop/build.js`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "workshop"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/workshop/build.js "decorateWorkshop"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/workshop/build.js "string-lights"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/workshop/build.js "cable-run"`
- `node "{{runner}}/assert.mjs" has src/world/kit/exterior.js "rollerDoor"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "onecl"`
- `node "{{runner}}/assert.mjs" has tests/unit/buildings/workshopExterior.test.js "getDecorator"`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `garage-floor` (floor material `concrete`): `workbench` x2, `desk-office` x4, `chair-office` x5, `monitor-dual` x3, `laptop` x3, `keyboard-mouse` x5, `whiteboard-rolling` x3, `kanban-board`, `bean-bag` x4, `sofa-2`, `table-coffee`, `wall-tv-large` (the prototype screen), `printer-3d`, `cable-reel` x2, `shelf-industrial`, `toolbox`, `pegboard-tools`, `fan-pedestal` x2, `tube-light` x5, `plant-office` x3, `desk-lamp` x3, `rug-round`, `trash-bin-small` x2, `water-dispenser`, `notice-board`. Lights: tube lights group `workshop:garage` with a rope-style switch at the door.
- Room `meeting-nook` (floor material `woodPlanks`): `table-round`, `chair-wooden` x4, `whiteboard` x1 (the project whiteboard with the text slot), `projector-screen`, `lamp-pendant`, `plant-potted-small` x2, `rug-round`, `cabinet-low`, `wall-clock`, `picture-frame-set`, `fan-ceiling`, `coffee-machine`, `flower-vase`. Lights: group `workshop:nook`.
- Room `store` (floor material `concrete`): `shelf-industrial` x3, `parts-bins` x3, `archive-box` x4, `toolbox`, `compressor`, `cable-reel`, `stool`, `filing-cabinet`, `tube-light` x2, `locker-bank`, `welding-mask`, `trash-bin-small`, `pegboard-tools`, `rope-coil` (14 types; the rooms rule needs 12, the store has exactly 12 without these two). Lights: group `workshop:store`.
- Room `pantry` (floor material `floorTile`): `counter-kitchen-straight`, `sink-double`, `fridge`, `microwave`, `kettle-tray`, `rice-cooker`, `shelf-utensils`, `water-filter`, `trash-bin-small`, `stool-bar` x2, `tea-glass-set`, `plate-set`, `tube-light`, `pot-set`. Lights: tube light group `workshop:pantry`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. The store and pantry each have 14 types (the rooms rule needs 12); the garage-floor has at least 14.
- Interactables: project-whiteboard (`read`, the object is the project whiteboard); light switches per room; seats the sofa, bean bags and the nook chairs.
- Lights (all colour `#f4f8ff` unless stated, `auto: "dusk"`, each light named): group `workshop:garage` `garage-1` (-6.5, 3.8, 0.0), `garage-2` (-3.0, 3.8, 0.0), `garage-3` (-6.5, 3.8, 3.5), `garage-4` (-3.0, 3.8, 3.5), `garage-5` (-0.5, 3.8, 1.75), intensity 16, distance 9; group `workshop:nook` `nook-1` pendant (-6.0, 2.6, -4.0), colour `#ffe2b0`, intensity 8, distance 6; group `workshop:store` `store-1` (-3.0, 3.6, -5.0) and `store-2` (-1.0, 3.6, -3.0), intensity 14, distance 8; group `workshop:pantry` `pantry-1` (1.5, 3.6, -4.5), intensity 12, distance 6.
- Switches (kind `switch`, `group` as named, y 1.3 unless stated): `sw-garage` (room garage-floor, x 0.3, y 2.0, z 5.85, the rope-style pull switch beside the main door, group `workshop:garage`), `sw-nook` (meeting-nook, x -4.5, z -2.3, group `workshop:nook`), `sw-store` (store, x -0.8, z -2.3, group `workshop:store`), `sw-pantry` (pantry, x 0.3, z -3.5, group `workshop:pantry`). Seats (kind `sit`, `object` = the prop type, so every placed item of that type is a seat): `sit-sofa` (garage-floor, `sofa-2`), `sit-bean` (garage-floor, `bean-bag`, 4), `sit-nook` (meeting-nook, `chair-wooden`, 4).
- Placements: `wall-tv-large` is the prototype screen on the east wall of the garage (x 0.85, y 1.6, z 2.0, rot -1.5708) with a `textSlots` entry `prototype` of type `screen`; the three rolling whiteboards and `project-whiteboard` each carry one text slot (type `board`) with the sketch words of the v1 project board. About 100 object entries are placed: garage-floor about 52, meeting-nook 14, store 14, pantry 14; items on tables, shelves and benches use `place` values, floor and wall items use explicit x, y, z and rot. The rolling whiteboards stand on the garage floor at their own positions; they are not walled.
- At the end of this step set top-level `"stage": "full"` in `src/world/buildings/workshop/manifest.json`.
- `tests/unit/buildings/workshopInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the `project-whiteboard` (meeting-nook) and the two other whiteboards carry text slots with the sketch text of the `whiteboard` content; `wall-tv-large` has a `textSlots` entry of type `screen` (id `prototype`); a clear walk of at least 1.2 m leads from the `main` door to the project whiteboard read point.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/workshopInterior.test.js`
- `node scripts/check-buildings.mjs --only workshop`
- `node "{{runner}}/assert.mjs" has src/world/buildings/workshop/manifest.json "project-whiteboard"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/workshop/manifest.json "sw-garage"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/workshop/manifest.json "sit-bean"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/workshop/manifest.json stage full`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- Area: new `src/world/areas/workshopArea.js` exports `createWorkshopArea(game, deps = {})` (deps override `buildBuilding`, `preloadBuildingProps` and `getDecorator` for tests) and returns one area `{ id: "workshop", priority: 30, loadRadius: 120, unloadRadius: 170, interior: true, load, unload }` at the `workshop` anchor of `src/world/layout/town.json`; `load` awaits `preloadBuildingProps`, then `buildBuilding(manifest, ctx, placement, getDecorator("workshop"))`, pushes the instance into `game.buildings` and returns the dispose handle; `unload` removes colliders, interactables, lights and doors. It is registered by ONE line `registerLandmarkArea(createWorkshopArea)` in `src/world/areas/index.js` (plan 040). `tests/unit/buildings/workshopArea.test.js` (fake deps) asserts the fields above (priority 30, radii 120 and 170, `interior` true), preload before build, nothing left after `unload`, a second `load` after `unload`, and that `createAllAreas` contains `workshop` once.
- Remove the v1 workshop: in `src/world/buildings.js` delete the factory `buildWorkshop` (the workshop hut) and its table entry, and any helper only it used (grep first); in `src/world/collision.js` and `src/world/buildingAnims.js` delete only the workshop entries (grep for the names the factory added; list them in the report). `src/content/dialogues.js`: the workshop title becomes `titleBar("Startup Garage -", ...)` with the accent part and the facts unchanged. `src/world/zones.js`: zone `workshop` becomes `name: "Startup Garage"`, `prompt: "tinker"`, `mode: "object"`; `src/ui/minimap.js` gets the same label if it has its own (the colour stays); README zone row `Startup Garage` (README.md is in the allowed paths).
- Zone test: this plan creates `tests/unit/world/zones.test.js` (the first zone test; plans 052 to 057 extend it and nobody else creates it) and it asserts mode `object` for `workshop` (E away from the whiteboard does NOT open the dialogue; E at the read point does). Spots (append; ids `workshop-outside` and `workshop-inside` with the SAME numbers in `src/budgets.json` and in `src/shots.json`, no third spot in this plan): with the `workshop` anchor at world (ax, az) and rotation 0: `workshop-outside` { x ax, y 1.8, z az+12.5, yaw 0, pitch 0.08 } (the front, the roller door and the signboard in view); `workshop-inside` { x ax-2.0, y 1.6, z az+1.5, yaw 0.524, pitch -0.08 } (from the garage toward the machines and the whiteboard). If the anchor rotation is not 0, recompute both with the ARCHITECTURE 10.8 transform and yaw plus the anchor rotation; the numbers in both files are the recomputed ones.
- `src/world/zones.js`: `workshop` becomes `name: "Startup Garage"`, `prompt: "tinker"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `workshop` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `workshop` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `workshop` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the project whiteboard) so `E` opens the existing dialogue for `workshop` (A5); the dialogue is the 1CLX project as in v1; the title text becomes exactly `Startup Garage -` followed by the v1 accent part, unchanged.
- Add `workshop` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/workshop.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `workshop` with `interiorVisible` true and empty `problems`; walk to the the project whiteboard and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[workshop].mustInclude` and the display name; Escape closes; the e2e walks in only through the pedestrian door `main` (the roller door `roller` is decorative: poll that its state stays closed and that pressing `e` at it does nothing); zero console errors; all waits use `expect.poll`; `?only=workshop&time=0.5&freeze=1&seed=1337` (the same URL pattern as plan 044); zero console errors.
- Add budget spots `workshop-outside` and `workshop-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 051 --spots workshop-outside,workshop-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/workshop.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only workshop`
- `npx vitest run tests/unit/world/zones.test.js tests/unit/buildings/workshopArea.test.js tests/unit/content/zoneExpect.test.js`
- `node "{{runner}}/assert.mjs" json src/world/buildings/workshop/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createWorkshopArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "decorateWorkshop"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "buildWorkshop"`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Startup Garage"`
- `node "{{runner}}/assert.mjs" has README.md "Startup Garage"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "workshop-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "workshop-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "workshop-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "workshop-inside"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/workshop.test.js tests/unit/buildings/workshopExterior.test.js tests/unit/buildings/workshopInterior.test.js`
- `node scripts/check-buildings.mjs --only workshop`
- `npx playwright test tests/e2e/workshop.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run test`
- `npm run check:content`
- `npx vitest run tests/unit/buildings/workshopExterior.test.js tests/unit/buildings/workshopArea.test.js tests/unit/props/tools.test.js`

Human check (goes in the report, never blocks): Does it look like a real startup garage?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
