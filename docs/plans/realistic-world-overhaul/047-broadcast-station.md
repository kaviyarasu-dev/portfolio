# Plan 047: Radio and TV station (zone broadcast): studio, control room and the mast

Epic E4. Estimated turns: 60. Model: opus.

## Goal

Build the GravitySocial broadcast station: a low modern broadcast building with a studio behind glass, a control room, an equipment room and reception, and a 40 m red and white lattice radio mast beside it with blinking aviation lights. The control-room monitor wall opens the broadcast project dialogue; the ON AIR signs switch on while the player is inside the studio. Layout in one line (building-local metres, origin at the footprint centre, +z = front/south, N = -z; footprint 18 by 14: x -9 to 9, z -7 to 7; anchor broadcast (-120, -80) in town.json, ground y 16): reception x -9 to -3, z 1 to 7 (6 by 6); studio x -3 to 7, z -2 to 6 (10 by 8); control room x 2 to 9, z -7 to -2 (7 by 5, north of the studio, sharing the glass wall at z -2); equipment room x -3 to 2, z -7 to -2 (5 by 5, west of the control room). The north-west block x -9 to -3, z -7 to 1 is solid plaster and not a room. Every coordinate below is a target: `checkBuilding` is the judge; when the placer reports a collision, nudge the object by at most 0.4 m inside the same room and list it under `different_from_plan`.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only broadcast`).

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

### Step 1: Structure manifest for the Broadcast Station

Deliver:
- Create `src/world/buildings/broadcast/manifest.json` (schema of `docs/building-manifest.md`): `id: "broadcast"`, `displayName: "Broadcast Station"`, `prompt: "tune in"`, footprint taken from the `broadcast` anchor in `src/world/layout/town.json` (about 18 by 14 m (anchor broadcast (-120, -80, 18, 14), ground y 16, from town.json)), floors one floor (level 0, y 0, height 4.2); `stage` is `structure` after step 1 and `full` after step 3, style: plaster wall tint `#e9ecef`, `flat` roof with parapet, trim `metalPainted`.
- Rooms (ids fixed): `reception` (bounds `[-9, 1, -3, 7]`, reception and lounge, 6 by 6 m; the main door is in the south wall at x -6; the reception-studio door is in the east wall at z 3); `studio` (bounds `[-3, -2, 7, 6]`, main studio, 10 by 8 m, acoustic; reached ONLY through reception (the reception-studio door on the shared wall x -3, z 3); the glass window to the control room is on the north wall (z -2)); `control-room` (bounds `[2, -7, 9, -2]`, control room, 7 by 5 m, north of the studio; its south wall is the glass window into the studio (a decorate-built glass pane, see the structure step); its door to the equipment room is on the west wall at z -4.5); `equipment-room` (bounds `[-3, -7, 2, -2]`, transmitter and equipment room, 5 by 5 m; reached ONLY through the control room (its door on the east wall at z -4.5); the back exit is in the north wall at x -0.5). Room count between 3 and 6.
- Doors: five doors (`at` is the offset in metres along the wall from the wall centre, ARCHITECTURE 10.8): `main` from `outside` to `reception`, wall S, at -6 (x -6), width 1.8, height 2.4, kind `exterior`, unlocked; `reception-studio` (the acoustic double door) from `reception` to `studio`, wall E of reception (x -3), at -1 (z 3), width 1.8, height 2.2, kind `interior`, unlocked, no special field; `studio-control` from `studio` to `control-room`, wall N of studio (z -2), at 2 (x 4), width 1.0, height 2.2, kind `interior`, unlocked; `control-equipment` from `control-room` to `equipment-room`, wall W of control room (x 2), at 0 (z -4.5), width 0.9, height 2.2, kind `interior`, unlocked; `back` from `equipment-room` to `outside`, wall N (z -7), at 0 (x -0.5), width 1.0, height 2.2, kind `exterior`, `locked: true`.. At least one unlocked exterior door that is not decorative. Windows: exactly six exterior windows (the glass between control room and studio is NOT a manifest window, see the structure step): `w-1` reception S wall at -8.0 (width 1.2), `w-2` reception W wall at 4.0 (z, width 1.2), `w-3` reception S wall at -4.0 (width 1.2), `w-4` control-room E wall at -4.5 (z, width 1.6), `w-5` control-room N wall at 6.0 (x, width 1.6), `w-6` equipment-room N wall at -1.0 (x, width 1.0); all sill 0.9, height 1.5. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 6, door 2, signage 2, drainpipe 3, planter 3, bin 2, lamp 6; plus the extras of the exterior step: the radio mast, the satellite dish pair (plan 025 `satelliteDish`), a cable tray, a canopy and bollards. `interactables`: declare only `control-console` now (kind `read`, room `control-room`, `dialogueKey` `main`, prompt "tune in").
- `tests/unit/buildings/broadcast.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the studio is reached only through reception (the reception-studio door is its only door), the equipment room only through the control room, the back exit is locked and the main door is not, the reception-studio door is on the wall shared with the studio, the glass pane between control room and studio is on the wall z -2, exactly six windows w-1 to w-6, floor y 0 and height 4.2; the CLI `check:buildings --only broadcast --stage structure` exits 0.
- Manifest data (exact): `footprint { w: 18, d: 14 }`; rooms `reception` `[-9, 1, -3, 7]`, `studio` `[-3, -2, 7, 6]`, `control-room` `[2, -7, 9, -2]`, `equipment-room` `[-3, -7, 2, -2]` (floor 0; floorMaterial `floorTile`, `carpet`, `carpet`, `concrete`); doors and windows exactly as above; the north-west block is not a room.
- Interior glass: the kit gives a wall a window entry only on exterior walls, so the glass between `studio` and `control-room` is NOT a manifest window. Fallback (decided here): the decorate hook builds a glass pane 2.4 m wide (x 4.6 to 7.0) at y 1.0 to 2.6 on the wall z -2, framed by a 0.05 m `metalBrushed` border. The studio-control door sits in the x 3.5 to 4.5 gap of that wall.
- Stage: the file keeps `"stage": "structure"` after this step and becomes `"full"` in step 3.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/broadcast.test.js`
- `node scripts/check-buildings.mjs --only broadcast --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/broadcast/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/broadcast/build.js` exports `decorateBroadcast(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): the exterior is built by `src/world/buildings/broadcast/build.js` `decorateBroadcast(instance, ctx)` (all via `instance.addDetail`) with the kit `src/world/kit/exterior.js`. New builders in exterior.js (`extra` class, names and signatures): (a) `radioMast({ height = 40 })`: a square lattice mast of four corner legs (0.08 radius tubes) tapering from a 2.4 m square at the base to 0.8 m at the top, in 8 m segments (five for 40 m), each segment braced by thin diagonal boxes; the base pier 2.4 by 2.4 by 0.8 is the only solid part (collider box); bands alternate red (`metalPainted` tinted #c0392b) and white (`metalPainted` tinted #f4f4f4) every 4 m; the mast stands at local (15, 0), ground y 0; (b) guy wires: six thin cylinders (0.03 radius) from the mast at heights 20 and 36 to three anchor blocks (1.2 m cubes, colliders) at radius 25 m and local angles 0, 120 and 240 degrees; (c) three aviation lights: emissive spheres (0.25 radius) at the top of the mast merged into one mesh `keep-blink`, with `animated: { kind: "blink", period: 1.5, on: 0.5 }`, `userData.ledCount` 3 and `userData.dynamic` true (the plan 041 blink convention, ARCHITECTURE 10.8); (d) `satelliteDish()` (the plan 025 extra, reused) x2 on the control-room roof at (5.0, -3.0) and (7.0, -3.0); (e) `cableTray({ length = 8.0 })`: a 0.3 m wide ladder rack on brackets at y 3.6, from the equipment room north-east corner to the mast base; (f) `canopy({ w = 3.6, d = 1.6, height = 3.0 })` over the main door: a 0.15 m `metalPainted` slab with two columns (colliders), the 1.8 m door stays free; (g) `bollard()` x4 (0.2 m posts, colliders) at (-8.0, 8.4), (-4.5, 8.4), (-2.0, 8.4) and (2.0, 8.4); (h) `planterOutside()` (plan 025) x3 at (-8.6, 7.6), (-3.4, 7.6) and (9.4, 4.0). Signs: `signboard({ key: "broadcast-station", w: 4.0, h: 0.9, style: "board" })` lit on the canopy fascia at (-6.0, 3.6, 7.1) and `signboard({ key: "broadcast-station", w: 2.0, h: 0.6, style: "plaque" })` on the east wall at (9.1, 2.6, 0); both register their lights in group `broadcast:sign`, `auto: "dusk"`. The generic placer builds windows 6, doors 2, drainpipes 3, planters 3 (the classes; the three planters above are the generic ones), bins 2 at (-8.8, 7.6) and (9.0, -6.5) and lamps 6 (wall lamps on the south and east walls, group `broadcast:exterior`, `auto: "dusk"`). Mesh budget: `exterior-details` at most 14 meshes; the mast and the extras go to a separate group `broadcast-extras` (at most 30 meshes). The mast base is 6 m east of the footprint (local x 15, so 6 m from the east wall at x 9).
- Signage from `src/content/signage.js`: add the keys `broadcast-station` (BROADCAST STATION / ஒளிபரப்பு நிலையம்) for the exterior board and plaque; `broadcast-door` (BROADCAST / ஒளிபரப்பு) for the reception board; `on-air` (ON AIR / ஒளிபரப்பில்) for the two ON AIR signs; digit-free keys; the Tamil is a draft for the human check (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/broadcastExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- Registry: `src/world/buildings/registry.js` gets `import { decorateBroadcast } from "./broadcast/build.js"` and `DECORATORS.broadcast = { decorate: decorateBroadcast, skipGeneric: ["signage", "planter", "bin", "lamp"] }`; a unit test asserts `getDecorator("broadcast")` returns that entry (the plan 043 pattern).
- Area: `src/world/areas/broadcastArea.js` exports `createBroadcastArea`, registered with one line through the plan 040 `registerLandmarkArea(factory)` (priority 30, loadRadius 120, unloadRadius 170, interior true); a unit test asserts those values. The factory awaits `preloadBuildingProps(manifest, ctx)` before `buildBuilding`.
- ON AIR module: `src/world/buildings/broadcast/onAir.js` exports `setOnAir(on)` (sets the emissive of both `on-air-sign` objects) and `updateOnAir(player)`, called from the area update hook of `broadcast`. Interior detection: the player position is converted to building-local coordinates with the ARCHITECTURE 10.8 inverse transform (anchor (-120, -80), rotation from town.json) and tested against the studio bounds `[-3, -2, 7, 6]`. The record `{ type: "broadcast-studio", onAir: boolean }` in `game.areaObjects` is updated in place, and `listObjects()` reports `onAir`.
- Mast record: `game.areaObjects` gets `{ type: "radio-mast", height: 40, baseY: 16 }` (the top is 40 m above the base); a unit test asserts `height` is at least 35.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/broadcastExterior.test.js`
- `node scripts/check-buildings.mjs --only broadcast --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/broadcast/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `reception` (floor material `floorTile`): (all `x, z, rot`; wall items have `y` 0 and are modelled at their mounting height) `reception-desk-modern` at (-7.0, 2.2, 0); `sign-board` at (-6.0, 1.0, 0) with `text: "broadcast-door"` (BROADCAST / ஒளிபரப்பு); `on-air-sign` at (-3.1, 3.6, -1.5708) (the reception repeater above the reception-studio door); `sofa-2` at (-8.5, 3.6, 1.5708) and (-4.5, 6.0, 3.1416); `armchair` at (-4.0, 2.5, -1.5708) and (-8.6, 6.4, 1.5708); `table-coffee` at (-6.0, 4.0, 0); `plant-office` x3 at (-8.6, 1.6, 0), (-3.6, 6.4, 0), (-8.6, 6.6, 0); `wall-tv-large` x2 on the west wall at (-8.95, 1.8, 1.5708) and (-8.95, 5.4, 1.5708); `magazine-rack` at (-4.0, 1.8, 0); `water-dispenser` at (-3.6, 6.8, 0); `picture-frame-set` x3 at (-8.95, 3.6, 1.5708), (-3.05, 5.6, -1.5708) and (-7.0, 1.0, 0); `wall-clock` at (-8.0, 1.0, 0); `ac-split` at (-4.6, 1.0, 0); `rug-rect` at (-6.0, 4.0, 0); `doormat` at (-6.0, 6.7, 0); `ceiling-panel-light` x4 with `place: "ceiling"` at (-7.5, 2.5), (-4.5, 2.5), (-7.5, 5.5), (-4.5, 5.5). About 16 distinct types (rule: at least 12). Lights: the four panels share group `broadcast:reception`: `rec-1` (-7.5, 3.4, 2.5), `rec-2` (-4.5, 3.4, 2.5), `rec-3` (-7.5, 3.4, 5.5), `rec-4` (-4.5, 3.4, 5.5), colour `#fff1d0`, intensity 16, distance 9, `auto: "dusk"`; switch `sw-reception` at (-4.6, 1.3, 6.85), beside the main door.
- Room `studio` (floor material `carpet`): (all `x, z, rot`) `news-desk` at (2.0, 3.6, 0); `chair-conference` at (1.0, 4.9, 3.1416) and (3.0, 4.9, 3.1416) (presenter and guest, facing north); `camera-studio` x3 at (-1.0, 5.6, 3.1416), (2.0, 5.8, 3.1416) and (5.0, 5.6, 3.1416) (facing the desk); `light-softbox` x4 on stands at (-2.0, 0.0, 0), (6.0, 0.0, 0), (-2.0, 5.0, 0) and (6.0, 5.0, 0); `light-par-rig` x2 with `place: "ceiling"` at (0.0, 2.0) and (4.0, 2.0); `teleprompter` at (2.0, 4.6, 3.1416) (on the camera axis, just behind the desk); `green-screen` at (6.2, 2.9, -1.5708) (east wall, 3 m panel); `monitor-wall` at (-2.8, -0.4, 1.5708) (west wall, facing the presenters); `mic-desk` x3 with `place: "on:news-desk"` at (1.0, 3.8), (2.0, 3.8) and (3.0, 3.8); `mic-boom` at (-1.0, 4.5, 0); `speaker-studio` x2 at (-1.4, -1.2, 0) and (5.4, -1.2, 0); `acoustic-panel` x14: south wall z 5.85 at x -2.0, -0.5, 1.0, 2.5, 4.0, 5.5; east wall x 6.85 at z -1.0, 0.5, 2.0, 3.5; north wall z -1.85 at x -1.5 and 0.0; west wall x -2.85 at z 0.5 and 5.0; `on-air-sign` at (-2.85, 3.6, 1.5708) (the studio sign above the door, toggled by the on-air module); `headphones-hook` x2 at (-2.85, 1.2, 1.5708) and (-2.85, -0.6, 1.5708); `ac-split` x2 at (6.85, 5.6, -1.5708) and (-2.85, -1.6, 1.5708); `cable-reel` at (5.2, 0.0, 0); `lamp-floor` at (6.2, -0.8, 0); `bean-bag` at (6.2, 1.2, 0); `sofa-2` at (4.0, 0.6, 3.1416). About 19 distinct types (rule: at least 12). Lights: group `broadcast:studio` (bright): `stu-1` (-1.0, 3.4, 1.0), `stu-2` (3.0, 3.4, 1.0), `stu-3` (-1.0, 3.4, 4.0), `stu-4` (3.0, 3.4, 4.0), colour `#fff7ea`, intensity 36, distance 14, no `auto`; switch `sw-studio` at (-2.6, 1.3, 1.2) on the west wall beside the door; the ON AIR emissive is the `on-air-sign` objects (toggled by the on-air module, see the structure step).
- Room `control-room` (floor material `carpet`): (all `x, z, rot`) `mixing-console` at (5.5, -3.4, 0) (the operator console faces the glass); `monitor-wall` at (5.5, -6.9, 0) on the north wall (the large screen the console faces; its screen slot is the read point of the dialogue); `chair-office` x3 at (4.6, -4.4, 0), (5.5, -4.4, 0) and (6.4, -4.4, 0); `speaker-studio` x2 at (2.6, -6.4, 0) and (8.4, -6.4, 0); `patch-bay` x2 at (3.2, -6.9, 0) and (7.8, -6.9, 0) on the north wall; `server-rack` x2 on the east wall at (8.5, -4.6, -1.5708) and (8.5, -6.0, -1.5708); `headphones-hook` x2 on the west wall at (2.15, -6.2, 1.5708) and (2.15, -2.8, 1.5708); `acoustic-panel` x8: east wall at (8.85, -3.2), (8.85, -4.7), (8.85, -6.2) (rot -1.5708); north wall at (4.2, -6.85, 0) and (6.8, -6.85, 0); south wall at (2.6, -2.15, 3.1416) and (8.4, -2.15, 3.1416) (beside the glass, not on it); `monitor-dual` x2 with `place: "on:mixing-console"` at (5.0, -3.4) and (6.0, -3.4); `keyboard-mouse` x2 with `place: "on:mixing-console"` at (5.5, -3.2) and (4.7, -3.2); `desk-lamp` with `place: "on:mixing-console"` at (7.0, -3.2); `ac-split` at (2.6, -6.85, 0); `water-dispenser` at (8.4, -2.6, 0); `wall-clock` at (3.0, -6.85, 0); `phone-desk` at (7.2, -4.5, 0). About 16 distinct types (rule: at least 12). Lights: dim cool panels, group `broadcast:control`: `ctl-1` (4.0, 3.2, -6.0), `ctl-2` (7.0, 3.2, -6.0), `ctl-3` (5.5, 3.2, -4.0), colour `#d7e6ff`, intensity 8, distance 7, `auto: "dusk"`; emissive meters: a light `meters` (intensity 0, distance 1, group `broadcast:control`) at (5.5, 1.1, -3.6) whose emissive is the meter bars of `mixing-console` (if the console build has no meter bar, the meters are dropped and listed under `different_from_plan`); switch `sw-control` at (2.4, 1.3, -6.4) on the west wall.
- Room `equipment-room` (floor material `concrete`): (all `x, z, rot`) `server-rack` x4 at (-2.6, -6.4, 1.5708), (-2.6, -4.9, 1.5708), (-2.6, -3.4, 1.5708) (west wall column) and (0.8, -3.2, 3.1416); `antenna-rack` x2 at (1.2, -6.2, -1.5708) and (1.2, -2.9, -1.5708) (east wall, clear of the door at z -5 to -4); `patch-bay` at (-0.5, -2.6, 0); `network-box` x2 at (-1.6, -2.1, 0) and (0.6, -2.1, 0); `compressor` at (-1.2, -3.8, 0); `fire-extinguisher` x2 at (-2.6, -2.4, 0) and (0.4, -6.5, 0); `exit-sign` at (-0.5, -6.85, 0) (over the back exit); `locker-bank` at (-2.6, -1.6, 1.5708); `table-folding` at (-0.5, -5.0, 0); `stool` at (0.8, -4.6, 0); `ac-split` x2 at (1.9, -6.85, 3.1416) and (-1.8, -6.85, 0); `tube-light` x3 with `place: "ceiling"` at (-1.0, -6.0), (-1.0, -4.5) and (-1.0, -3.0); `cable-reel` at (-0.5, -3.6, 0); `trash-bin-small` at (1.6, -6.4, 0). About 14 distinct types (rule: at least 12). Lights: tube lights group `broadcast:equipment`: `eq-1` (-1.0, 3.6, -6.0), `eq-2` (-1.0, 3.6, -4.5), `eq-3` (-1.0, 3.6, -3.0), colour `#f4f8ff`, intensity 12, distance 7, no `auto`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: control-console (`read`, the object is the monitor wall on the north wall of the control room (its screen is the text slot; the console at (5.5, -3.4) faces it). The interactable `control-console` sits at (5.5, 1.2, -3.4)); light switches per room; seats the three `chair-office` seats of the control room (`sit-control-1` to `sit-control-3`) and the reception sofas (`sit-sofa-1`, `sit-sofa-2`).
- Interactables: `control-console` (`read`, at (5.5, 1.2, -3.4), prompt "tune in", `dialogueKey` `main`); switches `sw-reception`, `sw-studio`, `sw-control`; the sit seats listed above; the on-air module (structure step) reads the studio bounds.
- `tests/unit/buildings/broadcastInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the ON AIR sign object exists in `reception` and in `studio`; `setOnAir` flips the emissive of both; the player inside the studio bounds turns it on, outside turns it off; the mast builder and the extras are covered by the exterior test.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/broadcastInterior.test.js`
- `node scripts/check-buildings.mjs --only broadcast`

### Step 4: Convert the zone, stream it, Playwright, budgets and shots

Deliver:
- `src/world/zones.js`: `broadcast` becomes `name: "Broadcast Station"`, `prompt: "tune in"`, `mode: "object"` (ARCHITECTURE 10.7, A30). Update the broadcast dialogue title in `src/content/dialogues.js` to the display name `Broadcast Station` (facts unchanged). The manifest `stage` is set to `full` (json assert below). Remove the v1 broadcast factory from `src/world/buildings.js` with its collider and animation hooks; record the removed identifier in the report and check it with `none` in the verify list. The minimap label and the README zone table label: the README is in the plan `allowed` list (plan 043 pattern); the minimap label file is named in the report, or it becomes a human_check item if it is outside the allowed paths.
- The `broadcast` area is registered through the plan 040 `registerLandmarkArea(createBroadcastArea)` line in `src/world/areas/index.js` (structure step). The read interactable `control-console` opens the existing dialogue for `broadcast` (A5). `tests/fixtures/zoneExpect.json` already has `broadcast` (plan 043): no change.
- `tests/e2e/broadcast.spec.js` (generated name, frozen) on `/?only=broadcast&time=0.5&freeze=1&seed=1337`: teleport 6 m in front of the main door, `e` opens it, walk in with no loader; `listBuildings()` shows `broadcast` with `interiorVisible` true and no problems; teleport to local (3.6, -3.4), about 1.9 m west of the console (negative check: the zone is in mode `object`, so `e` there must not open the dialogue and `#dialogue` stays hidden), then teleport to the read spot in front of the console (local (5.5, -2.4)), press `e`, `#dialogue` is visible and contains every string of `zoneExpect.json` for broadcast plus the display name, Escape closes; the ON AIR and mast checks of the e2e extra; zero console errors. Every wait is `expect.poll`.
- Budget and shot spots (ids of this plan only): `broadcast-outside` (budget and shot) camera local (6, 40) at height 6 (world x -114, z -40, y 16 + 6 = 22), yaw 2.918, pitch 0.6 (sees the building and the mast top); `broadcast-inside` (budget and shot; the main room is the reception) camera local (-6.0, 6.5) at height 1.6 (world x -126, z -73.5, y 17.6), yaw 0, pitch 0; `broadcast-mast` (shot only) camera local (30, 12) at height 1.6 (world x -90, z -68, y 17.6), yaw 0.896, pitch 0.1. The numbers are for the anchor (-120, -80), ground y 16 and rotation 0; if the anchor or rotation differ, recompute with the ARCHITECTURE 10.8 transform (yaw plus rotation). `has` checks on both files; `npm run check:budget` passes; run `npm run shots -- --plan 47 --spots broadcast-outside,broadcast-inside,broadcast-mast`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures and black rooms (best effort, list the fixes under `different_from_plan`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/broadcast.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only broadcast --stage full`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "broadcast"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createBroadcastArea"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/broadcast/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Broadcast Station"`
- `node "{{runner}}/assert.mjs" has README.md "Broadcast Station"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "broadcast-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "broadcast-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "broadcast-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "broadcast-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "broadcast-mast"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/broadcast.test.js tests/unit/buildings/broadcastExterior.test.js tests/unit/buildings/broadcastInterior.test.js`
- `node scripts/check-buildings.mjs --only broadcast`
- `npx playwright test tests/e2e/broadcast.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the mast and the studio from the street and inside. The Tamil of the three keys (ஒளிபரப்பு நிலையம், ஒளிபரப்பு, ஒளிபரப்பில்) is a draft: review it.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
