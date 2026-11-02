# Plan 049: Harbour ferry terminal and bus stop (zone transport)

Epic E4. Estimated turns: 55.

## Goal

Build the TransGenie ferry terminal on the quay: a covered concourse with ticket counters, a waiting hall, an office and departure boards, a gangway to a moored ferry boat, and the bus stop outside. The departure board opens the transport project dialogue.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only transport`).

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

### Step 1: Structure manifest for the Ferry Terminal

Deliver:
- Create `src/world/buildings/transport/manifest.json` (schema of `docs/building-manifest.md`): `id: "transport"`, `displayName: "Ferry Terminal"`, `prompt: "enter hub"`, footprint taken from the `transport` anchor in `src/world/layout/town.json` (about 28 by 16 m), floors one floor (height 4.4), style: plaster wall tint `#d9e6ef`, `gable` roof with `metalPainted` (blue), pitch 0.2, trim `metalPainted`.
- Rooms (ids fixed): `concourse` (main concourse, 12 by 10 m, open to the quay side); `waiting-hall` (waiting hall, 8 by 8 m); `terminal-office` (terminal office, 6 by 5 m). Room count between 3 and 6.
- Doors: two wide openings from the quay side and the road side into `concourse` (width 3.0, `exterior`, unlocked, both), `concourse` to `waiting-hall` (interior wide opening 2.4), `concourse` to `terminal-office` (interior, unlocked). At least one unlocked exterior door that is not decorative. Windows: at least 8. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 8, door 2, signage 3, drainpipe 4, planter 4, bin 4, lamp 8; plus a gangway, bollards, a ferry boat and a bus stop shelter. `interactables`: declare only `departure-board` now (kind `read`, room `concourse`, `dialogueKey` `main`, prompt "enter hub").
- `tests/unit/buildings/transport.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; both exterior openings are at least 3.0 m wide and unlocked; the CLI `check:buildings --only transport --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/transport.test.js`
- `node scripts/check-buildings.mjs --only transport --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/transport/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/transport/build.js` exports `decorateTransport(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a long overhanging canopy toward the water, painted steel columns, a gangway (a walkable `addFloor` ramp from the quay to the ferry deck with handrails), a moored ferry boat (new builder `ferry-small` in `src/world/props/sets/harbour.js`: 18 m, two decks, a wheelhouse, a bob metadata; not walkable except the gangway and the deck), mooring bollards, lifebuoys, a lit sign "FERRY TERMINAL / படகுத்துறை" (keys `ferry`), the bus stop shelter (`bus-stop-shelter` from plan 039) with a timetable board, lamps.
- Signage from `src/content/signage.js`: add the keys `ferry`, `timetable` (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/transportExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/transportExterior.test.js`
- `node scripts/check-buildings.mjs --only transport --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/transport/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `concourse` (floor material `stonePaving`): `departure-board` x2, `ticket-counter` x2, `ticket-machine` x2, `route-map-board` x2, `bench-bus-stop` x3, `luggage-trolley` x2, `luggage-suitcase` x3, `luggage-scale`, `plant-potted-large` x3, `life-jacket-rack`, `fan-ceiling` x4, `lamp-pendant` x4, `sign-board` x2 (key `ferry`), `trash-bin-small` x3, `wall-clock` x2, `water-dispenser`, `notice-board`, `exit-sign`, `fire-extinguisher`. Lights: group `concourse` auto dusk.
- Room `waiting-hall` (floor material `floorTile`): `chair-waiting` x6, `bench-wood` x2, `table-coffee` x2, `magazine-rack`, `water-dispenser`, `wall-tv-large`, `vending-machine`, `coffee-machine`, `plant-potted-small` x3, `ac-split` x2, `ceiling-panel-light` x6, `rug-rect`, `wall-clock`, `picture-frame-set` x2, `lamp-floor`, `trash-bin-small` x2. Lights: group `waiting`.
- Room `terminal-office` (floor material `woodPlanks`): `desk-office` x2, `chair-office` x3, `monitor-desktop` x2, `keyboard-mouse` x2, `phone-desk`, `filing-cabinet` x2, `cabinet-low`, `printer-copier`, `whiteboard-rolling`, `route-map-board`, `wall-clock`, `fan-ceiling`, `plant-office`, `water-filter`, `lamp-table`. Lights: group `office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: departure-board (`read`, the object is the large departure board); light switches per room; seats the shelter benches and waiting chairs.
- `tests/unit/buildings/transportInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the gangway is walkable from the quay to the ferry deck (walk graph) and the deck edge blocks (handrails).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/transportInterior.test.js`
- `node scripts/check-buildings.mjs --only transport`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `transport` becomes `name: "Ferry Terminal"`, `prompt: "enter hub"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `transport` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `transport` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `transport` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the large departure board) so `E` opens the existing dialogue for `transport` (A5); the dialogue is the TransGenie project as in v1.
- Add `transport` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/transport.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `transport` with `interiorVisible` true and empty `problems`; walk to the the large departure board and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[transport].mustInclude` and the display name; Escape closes; walk the gangway onto the ferry deck by `walkTo` and the player is on the deck (y near the deck height); zero console errors.
- Add budget spots `transport-outside` and `transport-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 049 --spots transport-outside,transport-inside,ferry-terminal-quay`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/transport.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only transport`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/transport.test.js tests/unit/buildings/transportExterior.test.js tests/unit/buildings/transportInterior.test.js`
- `node scripts/check-buildings.mjs --only transport`
- `npx playwright test tests/e2e/transport.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the terminal against a real ferry jetty.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
