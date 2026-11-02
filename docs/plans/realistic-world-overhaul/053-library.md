# Plan 053: Grand public library with archive stacks (zone library)

Epic E4. Estimated turns: 55. Model: opus.

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

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Public Library

Deliver:
- Create `src/world/buildings/library/manifest.json` (schema of `docs/building-manifest.md`): `id: "library"`, `displayName: "Public Library"`, `prompt: "read archives"`, footprint taken from the `library` anchor in `src/world/layout/town.json` (about 24 by 18 m), floors ground (height 4.8) and a mezzanine level at y 5.0 (height 3.4) over the rear third, style: plaster wall tint `#e8d9b9`, `hip` roof with a central `dome` accent over the hall (use `hip` roof and add a small dome through the decorate hook), stone plinth in `stoneRough`, trim `woodDark`, arched windows.
- Rooms (ids fixed): `main-hall` (grand reading hall, 14 by 12 m, double height at the front); `reading-room` (quiet reading room, 8 by 6 m); `archive-stacks` (archive stacks and timeline (mezzanine level 1), 12 by 6 m); `childrens-section` (children's corner, 6 by 5 m); `librarian-office` (librarian office, 5 by 4 m). Room count between 3 and 6.
- Doors: a double main door south into `main-hall` (width 2.2, exterior, unlocked), `main-hall` to `reading-room` (interior), `main-hall` to `childrens-section` (interior wide), `main-hall` to `librarian-office` (interior, unlocked), `archive-stacks` reached only by a staircase (width 1.6, rise 5.0) from `main-hall`. At least one unlocked exterior door that is not decorative. Windows: at least 14 tall arched windows. Stairs and lifts: main staircase from `main-hall` to `archive-stacks` (rise 5.0, width 1.8), no lift.
- `exteriorDetails` counts (all seven classes, window at least 4): window 14, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8; a flight of entrance steps with a balustrade and two lamp posts. `interactables`: declare only `archive-ledger` now (kind `read`, room `archive-stacks`, `dialogueKey` `main`, prompt "read archives").
- `tests/unit/buildings/library.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the archive stacks are reachable only by stairs; the main door is 2.2 m wide; there are 5 rooms; the CLI `check:buildings --only library --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/library.test.js`
- `node scripts/check-buildings.mjs --only library --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/library/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/library/build.js` exports `decorateLibrary(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a wide flight of entrance steps with a stone balustrade, four columns with capitals (portico), a pediment-style gable over the porch using the exterior kit, arched windows with stone surrounds, a small dome with a finial on the roof, two lamp posts, a lit sign "PUBLIC LIBRARY / பொது நூலகம்" (key `library`), planters.
- Signage from `src/content/signage.js`: add the keys `library`, `archive` (ARCHIVE / காப்பகம்), `quiet` (QUIET PLEASE / அமைதி) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/libraryExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/libraryExterior.test.js`
- `node scripts/check-buildings.mjs --only library --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/library/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `main-hall` (floor material `marble`): `reading-desk` x4, `chair-wooden` x16, `library-stack` x6, `ladder-library` x2, `card-catalog`, `book-cart` x2, `globe`, `map-table`, `lamp-pendant` x6, `reading-lamp-green` x6, `plant-potted-large` x4, `bench-wood` x2, `fan-ceiling` x4, `sign-board` ("LIBRARY / நூலகம்": key `library`), `wall-clock`, `picture-frame-set` x4, `rug-rect` x2, `notice-board`, `magazine-rack`, `display-case-glass` x2, `plaque-wall`, `bust-abstract`, `flower-vase` x2. Lights: pendants and green lamps groups `hall` and `reading` auto dusk, switch at the door.
- Room `reading-room` (floor material `woodPlanks`): `reading-desk` x3, `chair-wooden` x10, `library-stack` x3, `reading-lamp-green` x6, `bookshelf-tall` x2, `armchair` x2, `table-side`, `rug-rect`, `curtain-pair` x3, `plant-potted-small` x3, `wall-clock`, `fan-ceiling` x2, `picture-frame-set` x2, `lamp-floor`. Lights: group `reading-room`.
- Room `archive-stacks` (floor material `woodPlanks`): `library-stack` x8, `archive-box` x10, `scroll-case` x4, `map-table`, `ladder-library` x2, `card-catalog` x2, `reading-lamp-green` x4, `reading-desk` (the archive lectern: type `podium` for the ledger), `podium`, `timeline-wall` (6 m with the years of the experience entries as text slots), `display-case-glass` x2, `rope-barrier` x2, `lamp-wall` x4, `rug-rect`, `fan-ceiling`, `book-cart`. Lights: warm lamps group `archive`.
- Room `childrens-section` (floor material `carpet`): `bookshelf-low` x4, `book-row` filled, `table-round` x2, `chair-plastic` x8, `bean-bag` x4, `rug-round` x2, `plant-potted-small` x2, `picture-frame-set` x3, `lamp-pendant` x2, `wall-chart`, `cushion-set` x2, `stool` x4. Lights: group `kids`.
- Room `librarian-office` (floor material `woodPlanks`): `desk-wood`, `chair-office`, `chair-wooden` x2, `filing-cabinet` x2, `bookshelf-tall`, `book-cart`, `lamp-table`, `monitor-desktop`, `keyboard-mouse`, `phone-desk`, `stamp-desk`, `wall-clock`, `fan-ceiling`, `plant-office`, `rug-rect`, `cabinet-glass`. Lights: group `office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: archive-ledger (`read`, the object is the archive ledger on its lectern (`podium`) under the timeline wall); light switches per room; seats reading chairs (at least 8 are seat interactables), the armchairs and bean bags.
- `tests/unit/buildings/libraryInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the timeline wall has one text slot per experience entry in `src/content/experience.js` (read the file: the number of text slots equals the number of entries) and the slot texts are the company names from that file; the stairs lead to the stacks.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/libraryInterior.test.js`
- `node scripts/check-buildings.mjs --only library`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `library` becomes `name: "Public Library"`, `prompt: "read archives"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `library` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `library` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `library` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the archive ledger on its lectern (`podium`) under the timeline wall) so `E` opens the existing dialogue for `library` (A5); the dialogue is the experience timeline as in v1; the roles listed in the dialogue come only from `src/content/experience.js`.
- Add `library` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/library.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `library` with `interiorVisible` true and empty `problems`; walk to the the archive ledger on its lectern (`podium`) under the timeline wall and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[library].mustInclude` and the display name; Escape closes; walk the staircase to the archive (hold `w` from the stair foot) and read the ledger there; the dialogue lists the same number of roles as `experience.js` (count the entries in the DOM against the content file imported in the test); zero console errors.
- Add budget spots `library-outside` and `library-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 053 --spots library-outside,library-inside,library-archive`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/library.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only library`

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

Human check (goes in the report, never blocks): Judge the library atmosphere.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
