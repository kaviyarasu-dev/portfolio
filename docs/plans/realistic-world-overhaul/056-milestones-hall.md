# Plan 056: Town hall and hall of achievements (zone milestones)

Epic E4. Estimated turns: 55.

## Goal

Build the Town Hall, the last landmark: a civic building with a clock gable, an entrance hall, the achievement hall with display cases, trophies and a timeline wall, a council chamber and an office. The central podium with its plaque opens the milestones dialogue (300K users, team lead and the other facts, exactly as v1).

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

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Town Hall

Deliver:
- Create `src/world/buildings/milestones/manifest.json` (schema of `docs/building-manifest.md`): `id: "milestones"`, `displayName: "Town Hall"`, `prompt: "see numbers"`, footprint taken from the `milestones` anchor in `src/world/layout/town.json` (about 22 by 16 m), floors one floor (height 5.0 for the achievement hall), style: plaster wall tint `#efe6d2`, `hip` roof with `roofTile` and a central clock gable, stone plinth, trim `woodDark`, columns on the front.
- Rooms (ids fixed): `entrance-hall` (entrance hall, 8 by 6 m); `achievement-hall` (hall of achievements, 14 by 10 m); `council-chamber` (council chamber, 8 by 6 m); `town-office` (town clerk office, 5 by 4 m). Room count between 3 and 6.
- Doors: a double main door south into `entrance-hall` (width 2.4, exterior, unlocked), `entrance-hall` to `achievement-hall` (wide interior opening 3.0), `achievement-hall` to `council-chamber` (interior, unlocked), `achievement-hall` to `town-office` (interior, unlocked), a side exterior door into `town-office` (exterior, `locked: true`). At least one unlocked exterior door that is not decorative. Windows: at least 12. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 12, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8; front columns and a flight of steps, flagpole. `interactables`: declare only `milestone-podium` now (kind `read`, room `achievement-hall`, `dialogueKey` `main`, prompt "see numbers").
- `tests/unit/buildings/milestones.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; there are 4 rooms; the main door is 2.4 m wide; the side door is locked; the CLI `check:buildings --only milestones --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/milestones.test.js`
- `node scripts/check-buildings.mjs --only milestones --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/milestones/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/milestones/build.js` exports `decorateMilestones(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a pillared front portico (6 columns) with a wide flight of steps, a central clock gable with a working clock (share the builder of plan 029), a flagpole with a flag, lamp posts, planters, a plaque by the door, a lit sign "TOWN HALL / நகர மன்றம்" (key `town-hall`).
- Signage from `src/content/signage.js`: add the keys `town-hall` (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/milestonesExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/milestonesExterior.test.js`
- `node scripts/check-buildings.mjs --only milestones --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/milestones/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `entrance-hall` (floor material `marble`): `bench-wood` x2, `plant-potted-large` x4, `flag-stand` x2, `plaque-wall` x2, `sign-board` ("TOWN HALL / நகர மன்றம்": key `town-hall`), `lamp-pendant` x3, `wall-clock`, `picture-frame-set` x4, `rug-rect`, `fan-ceiling` x3, `notice-board`, `doormat`, `brass-urn` x2, `oil-lamp-brass` x2, `table-side`, `flower-vase`, `rope-barrier` x2. Lights: group `entrance` auto dusk.
- Room `achievement-hall` (floor material `marble`): `display-case-glass` x6, `trophy-cup` x8, `podium` x1 (the plaque podium) plus `plaque-wall`, `award-wall` x2, `timeline-wall` x1 (6 m), `bust-abstract` x2, `banner-hanging` x4, `flag-stand` x3, `rope-barrier` x4, `bench-stone` x2, `lamp-pendant` x6, `fan-ceiling` x4, `plant-potted-large` x4, `picture-frame-set` x6, `rug-rect` x2, `wall-clock`, `flower-vase` x3, `vase-floor` x2. Lights: spot-style group `exhibit` and pendants group `hall`.
- Room `council-chamber` (floor material `woodPlanks`): `conference-table`, `chair-conference` x12, `podium`, `flag-stand`, `wall-tv-large`, `bookshelf-tall` x2, `plant-potted-large` x2, `curtain-pair` x3, `picture-frame-set` x3, `fan-ceiling` x3, `lamp-wall` x4, `rug-rect`, `wall-clock`, `water-dispenser`, `mic-desk` x3. Lights: group `chamber`.
- Room `town-office` (floor material `woodPlanks`): `desk-wood`, `chair-office`, `chair-wooden` x2, `filing-cabinet` x2, `cabinet-glass`, `bookshelf-low`, `monitor-desktop`, `keyboard-mouse`, `phone-desk`, `printer-copier`, `lamp-table`, `fan-ceiling`, `wall-clock`, `stamp-desk`, `plant-office`, `rug-rect`. Lights: group `office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: milestone-podium (`read`, the object is the central podium with the milestones plaque); light switches per room; seats the hall benches and the chamber chairs.
- `tests/unit/buildings/milestonesInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the timeline wall has at least 5 text slots filled from the milestones facts in `src/content/dialogues.js` (use only text that exists there, never invent).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/milestonesInterior.test.js`
- `node scripts/check-buildings.mjs --only milestones`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `milestones` becomes `name: "Town Hall"`, `prompt: "see numbers"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `milestones` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `milestones` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `milestones` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the central podium with the milestones plaque) so `E` opens the existing dialogue for `milestones` (A5); the dialogue is the milestones content as in v1.
- Add `milestones` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/milestones.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `milestones` with `interiorVisible` true and empty `problems`; walk to the the central podium with the milestones plaque and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[milestones].mustInclude` and the display name; Escape closes; the clock hands exist and rotate from the real time; zero console errors.
- Add budget spots `milestones-outside` and `milestones-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 056 --spots milestones-outside,milestones-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/milestones.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only milestones`

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

Human check (goes in the report, never blocks): Judge the hall of achievements.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
