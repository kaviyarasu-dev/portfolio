# Plan 056: Town hall and hall of achievements (zone milestones)

Epic E4. Estimated turns: 60.

## Goal

Build the Town Hall, the last landmark: a civic building with a clock gable over a pillared portico, an entrance hall, the achievement hall with display cases, trophies and a timeline wall, a council chamber and a town clerk office. The central podium with its plaque opens the milestones dialogue (300K users, team lead and the other facts, exactly as v1).

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only milestones`).

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
- src/world/kit/shell.js
- src/world/props/sets/seating.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Town Hall

Deliver:
- Create `src/world/buildings/milestones/manifest.json` (schema of `docs/building-manifest.md`): `id: "milestones"`, `displayName: "Town Hall"`, `prompt: "see numbers"`, footprint taken from the `milestones` anchor in `src/world/layout/town.json` (exactly 22 by 16 m (`footprint { w: 22, d: 16 }`, building-local x -11 to 11 and z -8 to 8, origin at the centre, +z = front/south = the road side); the `milestones` anchor of `town.json` (the value after plan 033 wins over the earlier numbers of 031 and 032) must have that size, else stop with BLOCKED.md (the 043 pattern). Anchor y is read from `town.json`; every world y is anchor y plus the building-local y. The rotation is taken as 0 (front = +z square to the road); if not 0 every spot, the zone point and the door positions are recomputed with the ARCHITECTURE 10.8 transform.), floors one floor (level 0, y 0, height 5.0, the achievement hall height, building-wide), top-level `"stage": "structure"` for now (the interior step raises it to `full`), top-level `roomMin` `{ "entrance-hall": 12, "achievement-hall": 14, "council-chamber": 12, "town-office": 12 }`. Style: plaster wall tint `#efe6d2`, `hip` roof with `roofTile` (the shell roof), stone plinth `stoneRough`, trim `woodDark`; the clock gable and the portico are decorator extras, not roof types., style: undefined.
- Rooms (ids fixed): `entrance-hall` (entrance hall, 8 by 6 m, bounds [-4, 2, 4, 8], south of the achievement hall, the main door in its south wall); `achievement-hall` (hall of achievements, 14 by 10 m, bounds [-11, -8, 3, 2], the main room); `council-chamber` (council chamber, 8 by 6 m, bounds [3, -8, 11, -2], east of the achievement hall); `town-office` (town clerk office, 5 by 4 m, bounds [-11, 2, -6, 6], touching the west exterior wall for its side door). Room count between 3 and 6.
- Doors: five doors; `at` = metres along the wall from the wall centre, world coordinate in brackets (building-local): `main` (THE main door, exterior, unlocked, double-leaf look, one door record of width 2.4) on the south wall of `entrance-hall` (z 8), at world x 0.0, width 2.4, height 2.6, hinge double; `office-side` (exterior, `locked: true`, the side door of the office) on the west wall of `town-office` (x -11), at world z 4.0, width 0.9, height 2.2, hinge left; `entrance-achievement` (interior, unlocked, a wide opening with no leaf, width 3.0, height 2.6, hinge none) on the wall z 2 between `entrance-hall` and `achievement-hall`, at world x -1.0; `achievement-council` (interior, unlocked, width 1.2, height 2.2, hinge left) on the wall x 3 between `achievement-hall` and `council-chamber`, at world z -5.0; `achievement-office` (interior, unlocked, width 1.0, height 2.2, hinge right) on the wall z 2 between `achievement-hall` and `town-office`, at world x -8.5. Rooms (bounds `[x0, z0, x1, z1]`): `entrance-hall` `[-4, 2, 4, 8]` (8 by 6), `achievement-hall` `[-11, -8, 3, 2]` (14 by 10), `council-chamber` `[3, -8, 11, -2]` (8 by 6), `town-office` `[-11, 2, -6, 6]` (5 by 4). LEFTOVER RULE (decision, the same as plans 051 to 054): the four rectangles do not overlap and do not tile (they cover 256 of 352 m2); the leftover is solid service void (thick walls, no room, no door, no window), the south-east and south-west corners beside the entrance included.. At least one unlocked exterior door that is not decorative. Windows: exactly 12 windows, ids `w-1` to `w-12`, rectangular, each on an exterior wall of its room: `w-1` `achievement-hall` north wall x -10.0; `w-2` `achievement-hall` north wall x 0.0; `w-3` `achievement-hall` north wall x 2.0; `w-4` `achievement-hall` west wall z -6.0; `w-5` `achievement-hall` west wall z -3.0; `w-6` `achievement-hall` west wall z 0.0 (achievement-hall windows are 1.2 by 2.4, sill 1.2); `w-7` `council-chamber` north wall x 5.0; `w-8` `council-chamber` north wall x 9.0; `w-9` `council-chamber` east wall z -5.0; `w-10` `entrance-hall` south wall x -3.0; `w-11` `entrance-hall` east wall z 5.0; `w-12` `town-office` south wall x -8.5 (the other windows are 1.2 by 1.4, sill 1.0). No window is on a wall between two rooms.. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 12, door 2 (the two exterior doors `main` and `office-side`; the interior doors are not counted), signage 2, drainpipe 4 (the four corners of the footprint, built by the generic kit), planter 6 (pots at the steps and the front yard, built by the decorator), bin 3, lamp 8 (the manifest counts; the generic kit builds window, door and drainpipe, the decorator builds signage, planter, bin and lamp (`skipGeneric`)); the extras (builders in `build.js`, never declared in the manifest, ARCH 10.8) are the six portico columns, the entrance steps, the clock gable with its clock face, the flagpole with flag, the lamp posts beside the steps, the plaque by the door (a `plaque-wall` placement, not an extra) and the planters outside (counted in the 6 declared planters). `interactables`: declare only `milestone-podium` now (kind `read`, room `achievement-hall`, `dialogueKey` `main`, prompt "see numbers").
- `tests/unit/buildings/milestones.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the main door `main` is 2.4 m wide and unlocked, `office-side` is locked, exactly 12 windows `w-1` to `w-12`, the four room rectangles (entrance-hall 8 by 6, achievement-hall 14 by 10, council-chamber 8 by 6, town-office 5 by 4) do not overlap and lie inside the 22 by 16 footprint, all four rooms are reachable from `achievement-hall` through the unlocked interior doors (`entrance-achievement`, `achievement-council`, `achievement-office`), and the manifest is `stage` structure; the CLI `check:buildings --only milestones --stage structure` exits 0.
- Manifest data (exact; building-local x and z, origin at the centre): `footprint { w: 22, d: 16 }`; rooms as given above, `floors` `[{ level: 0, y: 0, height: 5.0 }]`; the five doors and the twelve windows exactly as given above; `roomMin` as given. `interactables` written in this step: `milestone-podium` `{ kind: "read", room: "achievement-hall", x: -4.0, y: 1.5, z: -1.2, dialogueKey: "main", prompt: "see numbers" }` (the plaque podium stands at (-4.0, 0, -3.0), top at y 1.1, front toward +z; the read point is 1.8 m in front of it, outside the rope barrier at z -2.0). The second podium in the council chamber has no interactable. Only this read point is written in the structure step.
- Doors: `main` is the only unlocked exterior door that is not decorative; `office-side` is the locked exterior door. Stairs and lifts: `none`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/milestones.test.js`
- `node scripts/check-buildings.mjs --only milestones --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/milestones/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/milestones/build.js` exports `decorateMilestones(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): all positions building-local (south wall at z 8, +z outward), everything via `instance.addDetail`: (a) the lit sign `signboard({ key: "zone-milestones", w: 4.0, h: 0.8, style: "board" })` above the main door at x 0.0, y 3.6, z 8 (declared signage 1; its English is the zone name "Town Hall", the frozen 025 value; the Tamil "நகர மன்றம்" is a draft); a second signage `signboard({ key: "open", w: 0.8, h: 0.3, style: "plaque" })` right of the main door at x 2.0, y 1.55, z 8 (declared signage 2, existing key `open`); (b) the portico (extra, `detailKind: "column"`, six columns with capitals `column({ height: 4.2 })` at x -4.4, -3.0, -1.6, 1.6, 3.0 and 4.4, z 9.2, box colliders, the gap of 3.2 m at the centre leaves the door approach clear); (c) the wide entrance steps (extra, `detailKind: "steps"`) `entranceSteps({ w: 8.0, treads: 3 })` in front of the wall from z 8.0 to 9.2, box colliders per tread; (d) the clock gable (extra, `detailKind: "clock-gable"`) `clockGable({ w: 4.0 })` on the front roof above the entrance, a clock face of radius 1.0 at (0.0, 6.0, 8.1) facing +z built by the clock face builder of this plan (see the structure step), no collider; (e) the flagpole (extra, `detailKind: "flagpole"`) `flagpole({ height: 9.0 })` at (-8.0, 7.0) with a flag cloth and a box collider at the foot; (f) 8 decorator lamps (declared) at x -9.0, -6.0, 6.0 and 9.0 and z 10.5 and 12.5 (height 3.2), group `milestones:exterior`, `auto: "dusk"`; (g) 6 decorator planters (declared) at (-5.0, 9.6), (5.0, 9.6), (-5.0, 11.0), (5.0, 11.0), (-8.0, 9.0) and (8.0, 9.0); (h) 3 decorator bins (declared) at (-10.0, 8.6), (10.0, 8.6) and (0.0, 10.4); (i) a plaque by the door (the `plaque-wall` of plan 042) at (3.4, 1.6, 8.0). No curtain fills: the interior is enterable.
- Signage from `src/content/signage.js`: add the keys `zone-milestones` (the existing plan 025 key; the exterior English equals the zone name "Town Hall", the frozen value), `open` (existing key), `town-hall` (the interior sign-board in `entrance-hall`, English "TOWN HALL", Tamil நகர மன்றம், a new digit-free key with the same words, the review step checks the Tamil) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/milestonesExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- `src/world/buildings/milestones/build.js` exports `decorateMilestones(instance, ctx)` and the builders `column`, `entranceSteps`, `clockGable`, `flagpole` and `lampPost` (each returns an Object3D whose root `userData` has `detailClass: "extra"`, `detailKind` and, when solid, `colliders` in the plan 025 form; at most 8 meshes each; materials from `getMaterial` only; deterministic). The clock face is in `src/world/buildings/milestones/clock.js`: `buildClockFace({ radius: 1.0 })` returns the face with the hand nodes `hand-hour-<f>` and `hand-minute-<f>` (the face name is `<f>`, four faces at the gable). Plan 029 exports only `buildClockTower(ctx)` and is not changed by this plan. The hands are set by `handAngles(now)`: hour angle = ((hours % 12) + minutes / 60) * pi / 6, minute angle = minutes * pi / 30, and each hand node gets `rotation.z = -angle` (ARCH 10.8). The time comes from `ctx.now()` (default `Date.now`), which the unit test replaces with a fixed date. The decorator returns `tick(now)`, and the area calls `tick(ctx.now())` on each frame and publishes the record `{ type: "clock-face", hourAngle, minuteAngle }` in the area objects list.
- `src/world/buildings/registry.js` (read first): `import { decorateMilestones } from "./milestones/build.js"` and `DECORATORS.milestones = { decorate: decorateMilestones, skipGeneric: ["signage", "planter", "bin", "lamp"] }`. `tests/unit/buildings/milestonesExterior.test.js` (headless build with `getDecorator("milestones")`) asserts the decorator is defined with those names; `countDetails` gives window 12, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8 and the extras `column` 6, `steps` 1, `clock-gable` 1, `flagpole` 1 (9.0 m tall); the two signs record `{ en: "Town Hall", ta: "நகர மன்றம்" }` and `{ en: "Open", ta: "திறந்திருக்கிறது" }`; every decorator lamp is in group `milestones:exterior`; the clock hands follow `handAngles` for a fixed date (test uses 10:10).
- Area: `src/world/areas/milestonesArea.js` exports `createMilestonesArea(game, deps = {})` (fields as in `forgeArea.js`, deps override `buildBuilding`, `preloadBuildingProps`, `getDecorator` and `now`) returning `{ id: "milestones", priority: 30, loadRadius: 120, unloadRadius: 170, interior: true, load, unload }` at the `milestones` anchor of `src/world/layout/town.json`; registered by ONE line `registerLandmarkArea(createMilestonesArea)` in `src/world/areas/index.js` (plan 040). `tests/unit/buildings/milestonesArea.test.js` (fake deps) asserts those fields, preload before build, nothing left after `unload`, a second `load` after `unload`, that `milestones` appears once in `createAllAreas`, and the `tick` call with a fixed date.
- Remove the v1 Town Hall: in `src/world/buildings.js` delete the factory `buildMilestones` and its table entry, and any helper only it used (grep first); in `src/world/buildingAnims.js` and `src/world/collision.js` delete only the milestones entries (list the lines in the report). `src/content/dialogues.js`: the milestones title becomes `titleBar("Town Hall -", ...)` with the rest of the v1 title unchanged. `src/world/zones.js`: `milestones` becomes `name: "Town Hall"`, `prompt: "see numbers"`, `mode: "object"` with the object point at the world position of the read point (anchor x - 4.0, anchor z - 1.2) and r 2.0. `src/ui/minimap.js`: the label for the zone is the zone name, the colour stays. README zone row becomes Town Hall (README.md is allowed). `tests/unit/world/zones.test.js` asserts mode object (E away from the podium does NOT open the dialogue; E at its read point does).
- Spots: `milestones-outside` and `milestones-inside` with the anchor at world (ax, az), anchor y `ay` and rotation 0: `milestones-outside` { x ax, y ay+1.8, z az+15.0, yaw 0, pitch 0.06 } (the portico, the clock gable and the flagpole in view); `milestones-inside` { x ax-8.0, y ay+1.6, z az+0.5, yaw (the yaw from this point toward the podium at (-4.0, -3.0), in the ARCHITECTURE 10.8 convention), pitch -0.08 } (the achievement hall toward the plaque podium). The same numbers go into `src/budgets.json` and `src/shots.json`, no third spot. If the anchor rotation is not 0, recompute both with the ARCHITECTURE 10.8 transform. Run the shots with `npm run shots -- --plan 56`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/milestonesExterior.test.js`
- `node scripts/check-buildings.mjs --only milestones --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/milestones/build.js`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "milestones"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/milestones/build.js "decorateMilestones"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/milestones/build.js "clockGable"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/milestones/clock.js "handAngles"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "zone-milestones"`
- `node "{{runner}}/assert.mjs" has tests/unit/buildings/milestonesExterior.test.js "getDecorator"`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `entrance-hall` (floor material `marble`): `bench-wood` x2, `plant-potted-large` x4, `flag-stand` x2, `plaque-wall` x2, `sign-board` (key `town-hall`, English "TOWN HALL", Tamil நகர மன்றம் as a draft, interior sign), `lamp-pendant` x3, `wall-clock`, `picture-frame-set` x4, `rug-rect`, `fan-ceiling` x3, `notice-board`, `doormat`, `brass-urn` x2, `oil-lamp-brass` x2, `table-side`, `flower-vase`, `rope-barrier` x2. Lights: pendants group `milestones:entrance` auto dusk.
- Room `achievement-hall` (floor material `marble`): `display-case-glass` x6, `trophy-cup` x8, `podium` x1 (the plaque podium, the milestone podium) plus `plaque-wall`, `award-wall` x2, `timeline-wall` x1 (6 m, on the north wall at x -7 to -1), `bust-abstract` x2, `banner-hanging` x4, `flag-stand` x3, `rope-barrier` x4, `bench-stone` x2, `lamp-pendant` x4, `fan-ceiling` x4, `plant-potted-large` x4, `picture-frame-set` x6, `rug-rect` x2, `wall-clock`, `flower-vase` x3, `vase-floor` x2. Lights: spot-style group `milestones:exhibit` (three over each display case row) and pendants group `milestones:hall`.
- Room `council-chamber` (floor material `woodPlanks`): `conference-table`, `chair-conference` x12, `podium` (the speaker podium, a second podium with no interactable), `flag-stand`, `wall-tv-large`, `bookshelf-tall` x2, `plant-potted-large` x2, `curtain-pair` x3, `picture-frame-set` x3, `fan-ceiling` x3, `lamp-wall` x4, `rug-rect`, `wall-clock`, `water-dispenser`, `mic-desk` x3. Lights: pendants group `milestones:chamber`.
- Room `town-office` (floor material `woodPlanks`): `desk-wood`, `chair-office`, `chair-wooden` x2, `filing-cabinet` x2, `cabinet-glass`, `bookshelf-low`, `monitor-desktop`, `keyboard-mouse`, `phone-desk`, `printer-copier`, `lamp-table`, `fan-ceiling`, `wall-clock`, `stamp-desk`, `plant-office`, `rug-rect`. Lights: group `milestones:office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. The distinct types per room: entrance-hall at least 14, achievement-hall 14, council-chamber 12 and town-office 12; the rooms rule holds for all four.
- Interactables: milestone-podium (`read`, the object is the central podium with the milestones plaque); light switches per room; seats the two benches of the entrance hall (`bench-wood`, 2) and the 12 chamber chairs (`chair-conference`, 12), at least 14 seat interactables in total.
- Lights (`auto: "dusk"` unless stated, each named): group `milestones:entrance`: pendants `entrance-1` to `entrance-3` at (-3.0, 4.2, 4.0), (0.0, 4.2, 4.0), (3.0, 4.2, 4.0), colour `#ffe2b0`, intensity 10, distance 7; group `milestones:hall`: pendants `hall-1` to `hall-4` at (-9.0, 4.4, -6.0), (-5.0, 4.4, -6.0), (-9.0, 4.4, -1.0), (-5.0, 4.4, -1.0), colour `#fff4df`, intensity 12, distance 8; group `milestones:exhibit`: spot-style lights `exhibit-1` to `exhibit-3` at (-10.0, 3.8, -6.5), (-10.0, 3.8, -4.5), (-10.0, 3.8, -2.5) over the west display cases and `exhibit-4` to `exhibit-6` at (2.0, 3.8, -6.5), (2.0, 3.8, -4.5), (2.0, 3.8, -2.5) over the east display cases, intensity 10, distance 4, a spot on the non-phone tiers and an emissive case light on the phone tier; group `milestones:chamber`: pendants `chamber-1` to `chamber-3` at (5.5, 4.0, -6.0), (8.5, 4.0, -6.0), (7.0, 4.0, -3.5), colour `#fbfdff`, intensity 10, distance 7; group `milestones:office`: `office-1` pendant at (-8.5, 3.6, 4.0) and `office-2` desk lamp at (-8.5, 1.2, 5.0) (no auto), colour `#f4f8ff`, intensity 10 and 4.
- Switches (kind `switch`, y 1.3, `group` as named): `sw-entrance` (entrance-hall, x 1.8, z 7.85, group `milestones:entrance`, beside `main`), `sw-hall` (achievement-hall, x -10.8, z -7.85, group `milestones:hall`), `sw-exhibit` (achievement-hall, x 2.6, z -7.85, group `milestones:exhibit`), `sw-chamber` (council-chamber, x 10.85, z -2.6, group `milestones:chamber`), `sw-office` (town-office, x -10.85, z 2.6, group `milestones:office`). Seats (kind `sit`, `object` = the prop type): `sit-bench` (entrance-hall, `bench-wood`, 2), `sit-chamber` (council-chamber, `chair-conference`, 12).
- Placements (about 75 entries): entrance-hall about 20, achievement-hall about 30, council-chamber about 14, town-office about 14; the six `display-case-glass` at (-10.2, -6.5), (-10.2, -4.5), (-10.2, -2.5), (2.2, -6.5), (2.2, -4.5), (2.2, -2.5) (floor items, rot facing the room); the four `rope-barrier` posts at (-6.0, -4.6), (-2.0, -4.6), (-6.0, -2.0) and (-2.0, -2.0) with a rope between the posts of each pair (the read point at z -1.2 stays outside the barrier); the plaque podium at (-4.0, 0, -3.0); the timeline wall on the north wall at x -4.0 (6 m, z -7.9) with the eight text slots; floor items use explicit x, y, z and rot, items on tables, cases and benches use `place` values.
- At the end of this step set top-level `"stage": "full"` in `src/world/buildings/milestones/manifest.json`.
- `tests/unit/buildings/milestonesInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the timeline wall `timeline-wall` (plan 042 slots `event-1` to `event-8`) has at least 5 slots filled with milestone facts taken from the milestones content of the v1 dialogue source (grep for `300K` and `team lead` at step start; use only text that exists there, never invent), the remaining slots are empty strings, each text fits its slot (0.68 by 0.9 m); the milestone podium read point (-4.0, 1.5, -1.2) is reachable: a clear walk of at least 1.2 m from `entrance-achievement` to it; the achievement hall holds the 6 display cases, the 4 rope barrier posts and the plaque podium.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/milestonesInterior.test.js`
- `node scripts/check-buildings.mjs --only milestones`
- `node "{{runner}}/assert.mjs" has src/world/buildings/milestones/manifest.json "milestone-podium"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/milestones/manifest.json "timeline-wall"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/milestones/manifest.json "sit-bench"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/milestones/manifest.json stage full`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- Dialogue test: the zoneExpect `milestones` entry (tests/fixtures/zoneExpect.json) is checked by `tests/unit/content/zoneExpect.test.js` after the title change; no new fixture is added here.
- `src/world/zones.js`: `milestones` becomes `name: "Town Hall"`, `prompt: "see numbers"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `milestones` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `milestones` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `milestones` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the central podium with the milestones plaque) so `E` opens the existing dialogue for `milestones` (A5); the dialogue is the milestones content as in v1; the title text becomes exactly `Town Hall -` followed by the v1 part of the title, unchanged, so the zoneExpect `milestones` mustInclude strings still match.
- Add `milestones` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/milestones.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `milestones` with `interiorVisible` true and empty `problems`; walk to the the central podium with the milestones plaque and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[milestones].mustInclude` and the display name; Escape closes; teleport 6 m in front of `main` (polled door state: `main` closed then opened by `e`, polled), walk in through `main`, teleport to the milestone podium read point (-4.0, 1.5, -1.2) and press `e`: `#dialogue` visible with the Town Hall name and the milestones mustInclude strings (polled); the clock face: the area objects list has a record `{ type: "clock-face", hourAngle, minuteAngle }` whose angles are numbers in 0 to 2 pi and the hand nodes `hand-hour-<f>` and `hand-minute-<f>` have rotation.z equal to minus the record angle (within 0.01); no fixed waits; zero console errors; URL `/?only=milestones&time=0.5&freeze=1&seed=1337`; zero console errors.
- Add budget spots `milestones-outside` and `milestones-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 056 --spots milestones-outside,milestones-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/milestones.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only milestones`
- `npx vitest run tests/unit/world/zones.test.js tests/unit/buildings/milestonesArea.test.js tests/unit/content/zoneExpect.test.js`
- `node "{{runner}}/assert.mjs" json src/world/buildings/milestones/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createMilestonesArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "decorateMilestones"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "buildMilestones"`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Town Hall"`
- `node "{{runner}}/assert.mjs" has README.md "Town Hall"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "milestones-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "milestones-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "milestones-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "milestones-inside"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/milestones.test.js tests/unit/buildings/milestonesExterior.test.js tests/unit/buildings/milestonesInterior.test.js`
- `node scripts/check-buildings.mjs --only milestones`
- `npx playwright test tests/e2e/milestones.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run test`
- `npm run check:content`
- `npm run check:phone`
- `npx vitest run tests/unit/buildings/milestonesExterior.test.js tests/unit/buildings/milestonesArea.test.js`

Human check (goes in the report, never blocks): Judge the hall of achievements and the look of the Town Hall. Also check the Tamil of the signs (நகர மன்றம் is a draft) for the person; the Tamil review is a human check, not a test.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
