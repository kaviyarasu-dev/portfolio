# Plan 052: Design and note-taking studio (zone freshnote)

Epic E4. Estimated turns: 55.

## Goal

Build the Freshnote design studio: a bright two-room studio with a gallery wall of notes and sketches, a design room with drawing tables and easels, a meeting room and a pantry. The mood board in the design room opens the Freshnote project dialogue.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only freshnote`).

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

### Step 1: Structure manifest for the Design Studio

Deliver:
- Create `src/world/buildings/freshnote/manifest.json` (schema of `docs/building-manifest.md`): `id: "freshnote"`, `displayName: "Design Studio"`, `prompt: "visit studio"`, footprint taken from the `freshnote` anchor in `src/world/layout/town.json` (about 16 by 12 m), floors one floor (height 3.8), style: plaster wall tint `#f4efe6`, `flat` roof with a green parapet, pastel accent trim `#9ec7b3`.
- Rooms (ids fixed): `gallery` (entry gallery with note walls, 8 by 6 m); `design-room` (design room, 9 by 6 m); `meeting-room` (meeting room, 5 by 5 m); `pantry` (pantry, 4 by 3 m). Room count between 3 and 6.
- Doors: main door south into `gallery` (width 1.8, exterior, unlocked), `gallery` to `design-room` (wide interior opening 2.2), `gallery` to `meeting-room` (interior), `design-room` to `pantry` (interior), a back door from `pantry` to outside (exterior, `locked: true`). At least one unlocked exterior door that is not decorative. Windows: at least 12 large windows. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 12, door 2, signage 2, drainpipe 3, planter 8, bin 2, lamp 5; a green wall (vertical planter), a bicycle rack, a sandwich board. `interactables`: declare only `mood-board` now (kind `read`, room `design-room`, `dialogueKey` `main`, prompt "visit studio").
- `tests/unit/buildings/freshnote.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the back door is locked, the main door unlocked; the CLI `check:buildings --only freshnote --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/freshnote.test.js`
- `node scripts/check-buildings.mjs --only freshnote --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/freshnote/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/freshnote/build.js` exports `decorateFreshnote(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a vertical green wall made of 40 small planter boxes, a sandwich-board sign, big windows with white frames, a small sloped awning, pastel colour accent, bicycle rack with 3 cycles (`cycle-parked`), a lit signboard "FRESHNOTE / ஃபிரெஷ்நோட்" (key `freshnote`, Tamil draft).
- Signage from `src/content/signage.js`: add the keys `freshnote` (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/freshnoteExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/freshnoteExterior.test.js`
- `node scripts/check-buildings.mjs --only freshnote --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/freshnote/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- New props first (category `design`, file `src/world/props/sets/design.js`, same quality bar and metadata rules as plans 019 and 022): `drawing-table`, `easel`, `color-swatch-wall`, `mood-board`, `drawing-tablet`, `sample-books`, `paper-roll-stand`, `display-stand`. the mood board has a pinned-notes layout with at least 12 small note quads in several pastel colours and a text slot. Register them in `src/world/props/index.js` and add `tests/unit/props/design.test.js` (exact list, sizes within 20 percent of the bounding box, categories, mood-board has 12 note parts, easel height 1.5 to 1.9 m, drawing-tablet not solid).
- Room `gallery` (floor material `woodPlanks`): `display-stand` x4, `mood-board` x3, `picture-frame-set` x6, `sample-books` x2, `bench-wood` x2, `plant-potted-large` x3, `lamp-floor` x3, `rug-round`, `sign-board` (key `freshnote`), `wall-clock`, `notice-board`, `table-side` x2, `flower-vase` x2, `fan-ceiling` x2, `lamp-pendant` x4, `mirror-wall`, `shelf-wall` x3 with `book-row`, `doormat`. Lights: pendants group `gallery` auto dusk.
- Room `design-room` (floor material `woodPlanks`): `drawing-table` x4, `easel` x3, `drawing-tablet` x3, `color-swatch-wall`, `mood-board` (the project board, a large one), `paper-roll-stand`, `chair-office` x4, `stool` x4, `monitor-dual` x2, `laptop` x2, `keyboard-mouse` x3, `desk-lamp` x4, `cabinet-low` x2, `shelf-wall` x2, `plant-office` x3, `whiteboard-rolling`, `bean-bag` x2, `fan-ceiling` x2, `ac-split`, `wall-tv-large`, `trash-bin-small`, `rug-rect`. Lights: bright panels group `design`.
- Room `meeting-room` (floor material `carpet`): `table-dining-6` as the meeting table, `chair-conference` x6, `wall-tv-large`, `whiteboard`, `plant-office` x2, `cabinet-low`, `coffee-machine`, `lamp-pendant`, `curtain-pair` x2, `wall-clock`, `picture-frame-set`, `ac-split`. Lights: group `meeting`.
- Room `pantry` (floor material `floorTile`): `counter-kitchen-straight`, `sink-double`, `fridge`, `microwave`, `kettle-tray`, `tea-glass-set`, `plate-set`, `stool-bar` x3, `table-bar`, `shelf-utensils`, `water-filter`, `trash-bin-small`, `plant-potted-small`, `tube-light`. Lights: group `pantry`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: mood-board (`read`, the object is the large mood board in the design room); light switches per room; seats the stools, office chairs and bean bags.
- `tests/unit/buildings/freshnoteInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the mood board has the largest text slot in the building and is reachable.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/freshnoteInterior.test.js tests/unit/props/design.test.js tests/unit/props/allProps.test.js`
- `node scripts/check-buildings.mjs --only freshnote`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `freshnote` becomes `name: "Design Studio"`, `prompt: "visit studio"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `freshnote` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `freshnote` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `freshnote` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the large mood board in the design room) so `E` opens the existing dialogue for `freshnote` (A5); the dialogue is the Freshnote project as in v1.
- Add `freshnote` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/freshnote.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `freshnote` with `interiorVisible` true and empty `problems`; walk to the the large mood board in the design room and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[freshnote].mustInclude` and the display name; Escape closes; the green wall counts toward `planter` details; zero console errors.
- Add budget spots `freshnote-outside` and `freshnote-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 052 --spots freshnote-outside,freshnote-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/freshnote.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only freshnote`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/freshnote.test.js tests/unit/buildings/freshnoteExterior.test.js tests/unit/buildings/freshnoteInterior.test.js`
- `node scripts/check-buildings.mjs --only freshnote`
- `npx playwright test tests/e2e/freshnote.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Does the studio feel like a real design studio?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
