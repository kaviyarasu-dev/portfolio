# Plan 047: Radio and TV station (zone broadcast): studio, control room and the mast

Epic E4. Estimated turns: 55.

## Goal

Build the GravitySocial broadcast station: a low modern broadcast building with a studio behind glass, a control room, an equipment room and reception, and a 40 m red and white lattice radio mast beside it with blinking aviation lights. The control-room console screen opens the broadcast project dialogue; the ON AIR sign switches on when the player is in the studio.

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
- Create `src/world/buildings/broadcast/manifest.json` (schema of `docs/building-manifest.md`): `id: "broadcast"`, `displayName: "Broadcast Station"`, `prompt: "tune in"`, footprint taken from the `broadcast` anchor in `src/world/layout/town.json` (about 18 by 14 m), floors one floor (height 4.2), style: plaster wall tint `#e9ecef`, `flat` roof with parapet, trim `metalPainted`.
- Rooms (ids fixed): `reception` (reception and lounge, 6 by 6 m); `studio` (main studio, 10 by 8 m, acoustic); `control-room` (control room, 7 by 5 m, raised floor, glass window into the studio); `equipment-room` (transmitter and equipment room, 5 by 5 m). Room count between 3 and 6.
- Doors: main door south into `reception` (width 1.8, exterior, unlocked), `reception` to `studio` (acoustic double door, interior, unlocked), `studio` to `control-room` (interior), `control-room` to `equipment-room` (interior, unlocked), a back exit from `equipment-room` (exterior, locked). At least one unlocked exterior door that is not decorative. Windows: at least 6 including a wide interior window between control room and studio (a `glass` pane inside the partition: model it as a window entry on the shared wall). Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 6, door 2, signage 2, drainpipe 3, planter 3, bin 2, lamp 6; the mast and a satellite dish farm are extra exterior builders. `interactables`: declare only `control-console` now (kind `read`, room `control-room`, `dialogueKey` `main`, prompt "tune in").
- `tests/unit/buildings/broadcast.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the studio is reached only through reception, the back exit is locked, the control-room window entry is on the wall shared with the studio; the CLI `check:buildings --only broadcast --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/broadcast.test.js`
- `node scripts/check-buildings.mjs --only broadcast --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/broadcast/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/broadcast/build.js` exports `decorateBroadcast(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a 40 m lattice radio mast (new builder `radioMast({ height: 40 })` in `exterior.js`: a triangular lattice of thin members in 8 m segments painted red and white, guy wires as thin lines to 3 anchor blocks, 3 blinking red aviation lights as emissive spheres with `animated: { kind: "blink" }`), a satellite dish pair, a cable tray, a lit signboard, an entrance canopy, two planters, bollards.
- Signage from `src/content/signage.js`: add the keys `broadcast` (BROADCAST STATION / ஒளிபரப்பு நிலையம்), `on-air` (ON AIR) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/broadcastExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/broadcastExterior.test.js`
- `node scripts/check-buildings.mjs --only broadcast --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/broadcast/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `reception` (floor material `floorTile`): `reception-desk-modern`, `sofa-2` x2, `armchair` x2, `table-coffee`, `plant-office` x3, `wall-tv-large` x2, `magazine-rack`, `water-dispenser`, `sign-board` ("BROADCAST / ஒளிபரப்பு": add key `broadcast`), `on-air-sign` repeater, `ceiling-panel-light` x4, `picture-frame-set` x3, `rug-rect`, `wall-clock`, `ac-split`, `doormat`. Lights: panels group `reception`.
- Room `studio` (floor material `carpet`): `news-desk`, `chair-conference` x2, `camera-studio` x3, `light-softbox` x4, `light-par-rig` x2, `teleprompter`, `green-screen`, `monitor-wall`, `mic-desk` x3, `mic-boom`, `speaker-studio` x2, `acoustic-panel` x14, `on-air-sign` over the door, `headphones-hook` x2, `ac-split` x2, `cable-reel`, `lamp-floor`, `bean-bag`, `sofa-2`. Lights: studio lights group `studio` (bright), a switch panel at the door; ON AIR emissive turns on while the player is inside (system toggles `on-air-sign`).
- Room `control-room` (floor material `carpet`): `mixing-console`, `monitor-wall`, `chair-office` x3, `speaker-studio` x2, `patch-bay` x2, `server-rack` x2, `headphones-hook` x2, `acoustic-panel` x8, `desk-office`, `monitor-dual` x2, `keyboard-mouse` x2, `desk-lamp`, `ac-split`, `water-dispenser`, `wall-clock`, `phone-desk`. Lights: dim cool panels group `control` and emissive meters.
- Room `equipment-room` (floor material `concrete`): `server-rack` x4, `antenna-rack` x2, `patch-bay`, `network-box` x2, `compressor`, `fire-extinguisher` x2, `exit-sign`, `locker-bank`, `table-folding`, `stool`, `ac-split` x2, `tube-light` x3, `cable-reel`, `trash-bin-small`. Lights: tube lights group `equipment`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: control-console (`read`, the object is screen above the mixing console); light switches per room; seats chairs in the control room and reception sofas.
- `tests/unit/buildings/broadcastInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the ON AIR sign object exists in `reception` and `studio`; `setOnAir` flips the emissive; the mast builder is covered by the exterior test.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/broadcastInterior.test.js`
- `node scripts/check-buildings.mjs --only broadcast`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `broadcast` becomes `name: "Broadcast Station"`, `prompt: "tune in"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `broadcast` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `broadcast` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `broadcast` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (screen above the mixing console) so `E` opens the existing dialogue for `broadcast` (A5); the dialogue is the GravitySocial project as in v1.
- Add `broadcast` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/broadcast.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `broadcast` with `interiorVisible` true and empty `problems`; walk to the screen above the mixing console and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[broadcast].mustInclude` and the display name; Escape closes; walking into the studio turns the ON AIR emissive on (hook `listObjects()` reports `onAir: true`), leaving turns it off; the mast top is higher than 35 m (hook `listObjects()` reports the `radio-mast` height); zero console errors.
- Add budget spots `broadcast-outside` and `broadcast-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 047 --spots broadcast-outside,broadcast-inside,broadcast-mast`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/broadcast.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only broadcast`

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

Human check (goes in the report, never blocks): Judge the mast and studio.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
