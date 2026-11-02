# Plan 051: Startup garage studio (zone workshop): 1CLX

Epic E4. Estimated turns: 55.

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

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Startup Garage

Deliver:
- Create `src/world/buildings/workshop/manifest.json` (schema of `docs/building-manifest.md`): `id: "workshop"`, `displayName: "Startup Garage"`, `prompt: "tinker"`, footprint taken from the `workshop` anchor in `src/world/layout/town.json` (about 16 by 12 m), floors one floor (height 3.8), style: plaster wall tint `#d9cdb8`, `gable` roof `metalPainted` pitch 0.25, trim `woodDark`.
- Rooms (ids fixed): `garage-floor` (main open studio, 9 by 8 m); `meeting-nook` (meeting nook, 4 by 4 m); `store` (parts and stock store, 4 by 4 m); `pantry` (pantry corner, 3 by 3 m). Room count between 3 and 6.
- Doors: a roller door south into `garage-floor` (width 3.2, exterior, unlocked, half raised), a pedestrian door beside it (width 1.2, exterior, unlocked), `garage-floor` to `meeting-nook`, `garage-floor` to `store`, `store` to `pantry` (interior, unlocked). At least one unlocked exterior door that is not decorative. Windows: at least 6. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 6, door 2, signage 2, drainpipe 3, planter 3, bin 2, lamp 4; a cable run, parked motorbikes, a wooden pallet bench outside. `interactables`: declare only `project-whiteboard` now (kind `read`, room `meeting-nook`, `dialogueKey` `main`, prompt "tinker").
- `tests/unit/buildings/workshop.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the roller door is at least 3.0 m wide; the CLI `check:buildings --only workshop --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/workshop.test.js`
- `node scripts/check-buildings.mjs --only workshop --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/workshop/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/workshop/build.js` exports `decorateWorkshop(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a roller door (ribbed leaf half raised, builder `rollerDoor` added to `exterior.js` and shared with the workshop), a hand-painted signboard "1CLX / ஒன்-சி-எல்-எக்ஸ்" (key `onecl`; the Tamil is a transliteration draft), string lights, parked scooters (`scooter`) x2, a pallet bench, tubs, a bicycle against the wall, a satellite dish.
- Signage from `src/content/signage.js`: add the keys `onecl` (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/workshopExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/workshopExterior.test.js`
- `node scripts/check-buildings.mjs --only workshop --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/workshop/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `garage-floor` (floor material `concrete`): `workbench` x2, `desk-office` x4, `chair-office` x5, `monitor-dual` x3, `laptop` x3, `keyboard-mouse` x5, `whiteboard-rolling` x3, `kanban-board`, `bean-bag` x4, `sofa-2`, `table-coffee`, `wall-tv-large` (the prototype screen), `printer-3d`, `cable-reel` x2, `shelf-industrial`, `toolbox`, `pegboard-tools`, `fan-pedestal` x2, `tube-light` x5, `plant-office` x3, `desk-lamp` x3, `rug-round`, `trash-bin-small` x2, `water-dispenser`, `notice-board`. Lights: tube lights group `garage` with a rope-style switch at the door.
- Room `meeting-nook` (floor material `woodPlanks`): `table-round`, `chair-wooden` x4, `whiteboard` x1 (the project whiteboard with the text slot), `projector-screen`, `lamp-pendant`, `plant-potted-small` x2, `rug-round`, `cabinet-low`, `wall-clock`, `picture-frame-set`, `fan-ceiling`, `coffee-machine`, `flower-vase`. Lights: group `nook`.
- Room `store` (floor material `concrete`): `shelf-industrial` x3, `parts-bins` x3, `archive-box` x4, `toolbox`, `compressor`, `cable-reel`, `stool`, `filing-cabinet`, `tube-light` x2, `locker-bank`, `welding-mask`, `trash-bin-small`. Lights: group `store`.
- Room `pantry` (floor material `floorTile`): `counter-kitchen-straight`, `sink-double`, `fridge`, `microwave`, `kettle-tray`, `rice-cooker`, `shelf-utensils`, `water-filter`, `trash-bin-small`, `stool-bar` x2, `tea-glass-set`, `plate-set`, `tube-light`, `pot-set`. Lights: tube light group `pantry`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: project-whiteboard (`read`, the object is the project whiteboard); light switches per room; seats the sofa, bean bags and the nook chairs.
- `tests/unit/buildings/workshopInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; whiteboards have text slots; the prototype screen slot exists; the roller door is walkable around.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/workshopInterior.test.js`
- `node scripts/check-buildings.mjs --only workshop`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `workshop` becomes `name: "Startup Garage"`, `prompt: "tinker"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `workshop` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `workshop` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `workshop` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the project whiteboard) so `E` opens the existing dialogue for `workshop` (A5); the dialogue is the 1CLX project as in v1.
- Add `workshop` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/workshop.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `workshop` with `interiorVisible` true and empty `problems`; walk to the the project whiteboard and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[workshop].mustInclude` and the display name; Escape closes; the roller door region lets the player walk in without opening anything; zero console errors.
- Add budget spots `workshop-outside` and `workshop-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 051 --spots workshop-outside,workshop-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/workshop.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only workshop`

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

Human check (goes in the report, never blocks): Does it look like a real startup garage?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
