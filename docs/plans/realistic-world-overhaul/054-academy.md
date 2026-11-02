# Plan 054: School and college (zone academy): classroom, labs, staff room

Epic E4. Estimated turns: 55.

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

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Academy

Deliver:
- Create `src/world/buildings/academy/manifest.json` (schema of `docs/building-manifest.md`): `id: "academy"`, `displayName: "Academy"`, `prompt: "attend class"`, footprint taken from the `academy` anchor in `src/world/layout/town.json` (about 28 by 18 m), floors one floor (height 3.9), style: plaster wall tint `#f1eadb` with an ochre band, `flat` roof with a parapet and a small clock gable, trim `woodDark`.
- Rooms (ids fixed): `hall` (assembly hall and corridor, 28 by 4 m along the front); `classroom` (classroom, 9 by 8 m); `science-lab` (science lab, 9 by 8 m); `computer-lab` (computer lab, 9 by 6 m); `staff-room` (staff room, 8 by 6 m). Room count between 3 and 6.
- Doors: main door south into `hall` (width 2.0, exterior, unlocked), `hall` to `classroom`, `hall` to `science-lab`, `hall` to `computer-lab`, `hall` to `staff-room` (all interior, unlocked), a side exterior door from `hall` (width 1.4, exterior, unlocked). At least one unlocked exterior door that is not decorative. Windows: at least 16. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 16, door 2, signage 2, drainpipe 4, planter 8, bin 3, lamp 6; a flag mast with the flag in the front yard, a school bell on a stand, a low front wall. `interactables`: declare only `blackboard` now (kind `read`, room `classroom`, `dialogueKey` `main`, prompt "attend class").
- `tests/unit/buildings/academy.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the hall touches the four other rooms (each reachable in one door), there are 5 rooms; the CLI `check:buildings --only academy --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/academy.test.js`
- `node scripts/check-buildings.mjs --only academy --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/academy/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/academy/build.js` exports `decorateAcademy(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a long colonnaded front verandah (portico with 8 pillars), ochre band painting, a small clock gable with a working clock face on the roof (hands from real time, share the builder of plan 029), a flag mast 8 m with a flag cloth, a low front wall with a gate (decorative), a sign "ACADEMY / கல்விக்கழகம்" (key `academy`), planters along the wall, a small play yard with `bench-park` x2 outside.
- Signage from `src/content/signage.js`: add the keys `academy` (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/academyExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/academyExterior.test.js`
- `node scripts/check-buildings.mjs --only academy --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/academy/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `hall` (floor material `stonePaving`): `bench-wood` x4, `notice-board` x3, `school-bell`, `wall-clock` x2, `plant-potted-large` x4, `fan-ceiling` x6, `trophy-cup` x3, `display-case-glass`, `award-wall`, `flag-stand`, `water-dispenser`, `sign-board` (key `academy`), `lamp-wall` x6, `picture-frame-set` x4, `trash-bin-small` x2, `shoe-rack`, `podium`. Lights: group `hall` auto dusk.
- Room `classroom` (floor material `floorTile`): `desk-school` x12 in `grid:3x4`, `blackboard` x1 big, `teacher-desk`, `chair-wooden` x2, `wall-chart` x3, `fan-ceiling` x4, `tube-light` x6, `cabinet-low`, `bookshelf-low`, `globe`, `school-bell`, `notice-board`, `wall-clock`, `plant-potted-small` x2, `picture-frame-set`, `trash-bin-small`, `water-filter`. Lights: tube lights group `class`.
- Room `science-lab` (floor material `floorTile`): `lab-bench` x4, `stool` x8, `microscope` x4, `beaker-set` x4, `wall-chart` x2, `cabinet-glass` x2, `sink-double`, `fire-extinguisher` x2, `exit-sign`, `fan-ceiling` x3, `tube-light` x6, `blackboard`, `teacher-desk`, `shelf-wall` x2, `trash-bin-small`, `locker-bank`. Lights: group `lab`.
- Room `computer-lab` (floor material `floorTileDark`): `desk-cubicle` x8, `chair-office` x10, `monitor-desktop` x10, `keyboard-mouse` x10, `server-rack`, `network-box`, `printer-copier`, `ac-split` x2, `whiteboard-rolling`, `projector-ceiling`, `projector-screen`, `ceiling-panel-light` x6, `fire-extinguisher`, `exit-sign`, `plant-office` x2, `wall-clock`. Lights: panels group `computer`.
- Room `staff-room` (floor material `woodPlanks`): `desk-wood` x4, `chair-office` x4, `chair-wooden` x4, `filing-cabinet` x3, `bookshelf-tall` x2, `table-round`, `water-dispenser`, `kettle-tray`, `tea-glass-set`, `fan-ceiling` x2, `notice-board`, `wall-clock`, `plant-potted-large`, `lamp-table` x2, `picture-frame-set` x2, `rug-rect`, `cabinet-glass`. Lights: group `staff`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: blackboard (`read`, the object is the big blackboard); light switches per room; seats every school desk (at least 6 are seat interactables).
- `tests/unit/buildings/academyInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the classroom has 12 school desks; the lab has 4 microscopes; the clock builder shares code with the square clock (import, no copy).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/academyInterior.test.js`
- `node scripts/check-buildings.mjs --only academy`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `academy` becomes `name: "Academy"`, `prompt: "attend class"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `academy` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `academy` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `academy` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the big blackboard) so `E` opens the existing dialogue for `academy` (A5); the dialogue is the education and certification content as in v1.
- Add `academy` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/academy.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `academy` with `interiorVisible` true and empty `problems`; walk to the the big blackboard and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[academy].mustInclude` and the display name; Escape closes; sit at a school desk (`playerState().sitting`); zero console errors.
- Add budget spots `academy-outside` and `academy-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 054 --spots academy-outside,academy-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/academy.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only academy`

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

Human check (goes in the report, never blocks): Judge the school look.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
