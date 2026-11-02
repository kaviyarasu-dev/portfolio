# Plan 046: GravityWrite HQ (zone citadel), part 2: newsroom, meeting room, executive office, server room, rooftop

Epic E4. Estimated turns: 55. Model: opus.

## Goal

Finish the tower: furnish the newsroom floor, the meeting room (its wall screen opens the featured-project dialogue), the executive office, the server room and the rooftop, convert the zone and prove it in the browser. Structure, facade and lobby exist from plan 045; read them first and do NOT rewrite the manifest structure, only add objects, lights and interactables.

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

### Step 1: Structure manifest for the GravityWrite HQ

Deliver:
- Create `src/world/buildings/citadel/manifest.json` (schema of `docs/building-manifest.md`): `id: "citadel"`, `displayName: "GravityWrite HQ"`, `prompt: "enter HQ"`, footprint taken from the `citadel` anchor in `src/world/layout/town.json` (already set by plan 045 (do not change)), floors as in plan 045 (levels 0 to 4), style: unchanged from plan 045.
- Rooms (ids fixed): `newsroom` (level 1 open-plan newsroom, whole floor); `meeting-room` (level 2 meeting room 12 by 9 m); `executive-office` (level 2 executive office 9 by 9 m); `server-room` (level 3 server room 10 by 8 m); `rooftop` (level 4 rooftop terrace). Room count between 3 and 6.
- Doors: unchanged from plan 045. At least one unlocked exterior door that is not decorative. Windows: unchanged. Stairs and lifts: unchanged.
- `exteriorDetails` counts (all seven classes, window at least 4): unchanged. `interactables`: declare only `meeting-screen` now (kind `read`, room `meeting-room`, `dialogueKey` `main`, prompt "view project").
- `tests/unit/buildings/citadel.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the manifest structure from plan 045 is unchanged (room ids, floors, lift, stairs); the CLI `check:buildings --only citadel --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadel.test.js`
- `node scripts/check-buildings.mjs --only citadel --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/citadel/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/citadel/build.js` exports `decorateCitadel(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): nothing new (done in plan 045); this step only verifies the exterior still passes and adds the night lighting of the facade bands to the light manager if plan 045 did not.
- Signage from `src/content/signage.js`: add the keys `citadel-floor-1`..`citadel-floor-4` floor number plates (English only plus Tamil words for "floor" `தளம்`) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/citadelExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadelExterior.test.js`
- `node scripts/check-buildings.mjs --only citadel --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/citadel/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `newsroom` (floor material `carpet`): `desk-cubicle` x8 in two `grid:2x4` blocks, `cubicle-partition` x6, `chair-office` x10, `monitor-dual` x6, `monitor-desktop` x4, `laptop` x3, `keyboard-mouse` x10, `phone-desk` x4, `kanban-board` x2, `whiteboard-rolling` x2, `wall-tv-large` x3, `printer-copier` x2, `water-dispenser`, `coffee-machine`, `bean-bag` x3, `plant-office` x6, `desk-lamp` x4, `ceiling-panel-light` x12, `ac-split` x3, `wall-clock` x2, `fire-extinguisher` x2, `exit-sign` x2, `trash-bin-small` x4, `notice-board`, `standing-desk` x2. Lights: twelve panels in 3 groups `newsroom-a/b/c` with one switch bank at the stair door.
- Room `meeting-room` (floor material `woodPlanks`): `conference-table` x1 centre, `chair-conference` x14 around it, `wall-tv-large` x1 large (the project screen, 3 m wide slot), `projector-ceiling`, `projector-screen`, `whiteboard-rolling` x2, `cabinet-low` x2, `coffee-machine`, `water-dispenser`, `plant-office` x4, `lamp-floor` x2, `curtain-pair` x4, `rug-rect`, `wall-clock`, `picture-frame-set` x3, `ac-split` x2, `ceiling-panel-light` x8, `exit-sign`, `fire-extinguisher`, `trophy-cup`. Lights: panels group `meeting` with a dimmer-style switch pair (two groups `meeting-front` and `meeting-back`).
- Room `executive-office` (floor material `woodPlanks`): `desk-wood` x1 large, `chair-office` x1, `armchair` x2, `sofa-2`, `table-coffee`, `bookshelf-tall` x2, `cabinet-glass`, `plant-potted-large` x2, `lamp-floor`, `lamp-table`, `monitor-dual`, `keyboard-mouse`, `phone-desk`, `rug-round`, `curtain-pair` x3, `wall-clock`, `picture-frame-set` x2, `mirror-wall`, `globe`, `flower-vase`, `ac-split`, `safe-box`. Lights: lamps and panels group `exec`.
- Room `server-room` (floor material `floorTileDark`): `server-rack` x10 in two aisles (`grid:2x5`), `network-box` x2, `ac-split` x4, `fire-extinguisher` x3, `exit-sign` x2, `ceiling-panel-light` x6, `workbench` x2, `chair-office` x2, `laptop`, `monitor-desktop` x2, `cable-reel`, `locker-bank`, `whiteboard-rolling`, `trash-bin-small`, `water-dispenser`. Lights: cool white panels group `server`, and a small red emergency strip (emissive only).
- Room `rooftop` (floor material `stonePaving`): `bench-park` x4, `planter-brick` x6, `planter-box` x4, `table-round` x3, `chair-plastic` x12, `roof-water-tank` x1, `satellite-dish` x2, `lantern-hanging` x6, `fan-pedestal` x2, `flower-vase` x3 `on:table-round`, `lamp-wall` x4, `plant-potted-large` x3, `solar-heater`. Lights: lanterns group `roof` auto dusk.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. The exterior and lobby types count toward the 40 types.
- Interactables: meeting-screen (`read`, the object is large wall screen at the head of the meeting table); light switches per room; seats every conference chair at the table (at least 6 are seat interactables), the lobby sofas, bean bags.
- `tests/unit/buildings/citadelInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; all floors reachable by the lift and by stairs; the meeting screen is within 6 m of the stair landing; the newsroom has at least 8 desks.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadelInterior.test.js`
- `node scripts/check-buildings.mjs --only citadel`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `citadel` becomes `name: "GravityWrite HQ"`, `prompt: "enter HQ"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `citadel` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `citadel` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `citadel` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (large wall screen at the head of the meeting table) so `E` opens the existing dialogue for `citadel` (A5); the dialogue is the featured project (GravityWrite) as in v1.
- Add `citadel` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/citadel.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `citadel` with `interiorVisible` true and empty `problems`; walk to the large wall screen at the head of the meeting table and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[citadel].mustInclude` and the display name; Escape closes; ride the lift to level 2 and open the screen dialogue; walk to the rooftop by stairs after the lift test using `walkTo`; zero console errors.
- Add budget spots `citadel-outside` and `citadel-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 046 --spots citadel-outside,citadel-inside,citadel-newsroom,citadel-meeting`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/citadel.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only citadel`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/citadel.test.js tests/unit/buildings/citadelExterior.test.js tests/unit/buildings/citadelInterior.test.js`
- `node scripts/check-buildings.mjs --only citadel`
- `npx playwright test tests/e2e/citadel.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the newsroom and meeting room look.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
