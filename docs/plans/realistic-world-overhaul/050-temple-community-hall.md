# Plan 050: Community hall and open-source cafe (zone temple)

Epic E4. Estimated turns: 55.

## Goal

Build the open-source community hall and cafe (the zone id `temple` is only an id: the building is a civic hall with a cafe, NO religious imagery): a cafe counter with seating, a meetup hall with a small stage and projector, a kitchen counter, and a loft co-working space reached by stairs. The code wall screen in the hall opens the open-source AI agent dialogue.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only temple`).

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

### Step 1: Structure manifest for the Community Hall

Deliver:
- Create `src/world/buildings/temple/manifest.json` (schema of `docs/building-manifest.md`): `id: "temple"`, `displayName: "Community Hall"`, `prompt: "read the wall"`, footprint taken from the `temple` anchor in `src/world/layout/town.json` (about 20 by 16 m), floors ground floor (height 4.0) and a loft level at y 4.2 (height 3.2) over the north third, style: plaster wall tint `#efe0c0`, `hip` roof with `roofTile`, pitch 0.45, overhang 0.8, trim `woodDark`, pillared front porch.
- Rooms (ids fixed): `cafe` (cafe, 9 by 8 m); `hall` (meetup hall with a stage, 11 by 8 m); `kitchen` (cafe kitchen, 5 by 4 m); `loft` (loft co-working space (level 1), 11 by 5 m). Room count between 3 and 6.
- Doors: main door south into `cafe` (width 1.8, exterior, unlocked), `cafe` to `hall` (wide interior opening 2.4), `cafe` to `kitchen` (interior), a side exterior door into `hall` (width 1.6, exterior, unlocked). At least one unlocked exterior door that is not decorative. Windows: at least 12. Stairs and lifts: a staircase from `hall` to `loft` (rise 4.2, width 1.4).
- `exteriorDetails` counts (all seven classes, window at least 4): window 12, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 6; plus a pillared porch and a rangoli-free clean entrance. `interactables`: declare only `code-wall` now (kind `read`, room `hall`, `dialogueKey` `main`, prompt "read the wall").
- `tests/unit/buildings/temple.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the loft is reachable only by the staircase, both exterior doors are unlocked; the CLI `check:buildings --only temple --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/temple.test.js`
- `node scripts/check-buildings.mjs --only temple --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/temple/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/temple/build.js` exports `decorateTemple(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a front porch with 4 carved-look wooden pillars (portico), a hip tile roof with overhanging eaves, shutters, a chalkboard sign on an easel outside ("OPEN SOURCE CAFE / திறந்த மூல உணவகம்", key `oss-cafe`, Tamil draft), bicycle stands with 3 parked cycles, tubs of plants, string lights across the porch, a notice board by the door.
- Signage from `src/content/signage.js`: add the keys `oss-cafe`, `community-hall` (COMMUNITY HALL / சமுதாயக் கூடம்) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/templeExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/templeExterior.test.js`
- `node scripts/check-buildings.mjs --only temple --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/temple/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `cafe` (floor material `woodPlanks`): `counter-straight` with `coffee-machine`, `cash-counter`, `bar-counter`, `table-round` x4, `chair-cane` x12, `table-bar`, `stool-bar` x4, `menu-board` x2, `plant-potted-large` x3, `lamp-pendant` x5, `fan-ceiling` x3, `picture-frame-set` x4, `shelf-wall` with `book-row` and `flower-vase`, `rug-rect`, `wall-clock`, `tea-glass-set` x6 `on:table-round`, `plate-set` x4, `water-jug`, `condiment-tray`, `display-case-glass`, `notice-board` (community notices), `doormat`. Lights: pendants group `cafe` auto dusk, switch at the door.
- Room `hall` (floor material `woodPlanks`): `chair-plastic` x40 in `grid:5x8`, a stage platform built from `podium` x3 and `table-folding` x2 as a dais (plus a `rug-rect`), `projector-ceiling`, `projector-screen`, `wall-tv-large` (the code wall, 3 m slot), `speaker-studio` x2, `mic-desk`, `whiteboard-rolling` x2, `banner-hanging` x2, `fan-ceiling` x4, `plant-potted-large` x2, `curtain-pair` x4, `bench-wood` x2, `lamp-wall` x4, `notice-board`, `ceiling-panel-light` x6, `fire-extinguisher`, `exit-sign` x2, `trash-bin-small` x2. Lights: groups `hall-front` and `hall-back`, switch pair at the door.
- Room `kitchen` (floor material `floorTileDark`): `counter-kitchen-straight` x2, `stove-gas`, `sink-double`, `fridge`, `rice-cooker`, `pot-set`, `pan-hanging`, `shelf-utensils`, `spice-rack`, `water-filter`, `hood-chimney`, `tube-light` x2, `table-folding`, `trash-bin-small`, `grinder-wet`. Lights: tube lights group `kitchen`.
- Room `loft` (floor material `woodPlanks`): `desk-office` x4, `chair-office` x4, `laptop` x3, `monitor-desktop` x2, `keyboard-mouse` x4, `bean-bag` x3, `bookshelf-tall` x2, `plant-office` x3, `lamp-table` x3, `whiteboard-rolling`, `table-coffee`, `sofa-2`, `rug-round`, `wall-clock`, `fan-ceiling` x2, `ac-split`, `desk-lamp` x3, `kanban-board`. Lights: group `loft`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: code-wall (`read`, the object is the large "code wall" screen behind the stage); light switches per room; seats the cafe chairs, the hall chairs (at least 10 of them) and the bean bags.
- `tests/unit/buildings/templeInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; there are at least 36 chair items in the hall; the stage podiums do not block the aisle (a 1.0 m wide path from the door to the code wall).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/templeInterior.test.js`
- `node scripts/check-buildings.mjs --only temple`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `temple` becomes `name: "Community Hall"`, `prompt: "read the wall"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `temple` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `temple` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `temple` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the large "code wall" screen behind the stage) so `E` opens the existing dialogue for `temple` (A5); the dialogue is the open-source AI agent project as in v1; no part of the building models idols or religious imagery.
- Add `temple` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/temple.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `temple` with `interiorVisible` true and empty `problems`; walk to the the large "code wall" screen behind the stage and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[temple].mustInclude` and the display name; Escape closes; stairs to the loft work (hold `w` from the stair foot: `playerState().y` reaches 4.0); zero console errors.
- Add budget spots `temple-outside` and `temple-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 050 --spots temple-outside,temple-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/temple.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only temple`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/temple.test.js tests/unit/buildings/templeExterior.test.js tests/unit/buildings/templeInterior.test.js`
- `node scripts/check-buildings.mjs --only temple`
- `npx playwright test tests/e2e/temple.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): The building must read as a community cafe, not a temple.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
