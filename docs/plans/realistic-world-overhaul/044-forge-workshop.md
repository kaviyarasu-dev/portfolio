# Plan 044: Engineering Workshop (zone forge): tools, electronics and the skills board

Epic E4. Estimated turns: 55.

## Goal

Build the Engineering Workshop, a small-scale engineering works of the kind found in Tamil Nadu industrial lanes: a shop floor with lathe and drill press, a tool store, an electronics lab and an office; exterior with a corrugated tin roof, a roller shutter, a chimney and a painted signboard. The skills board on the shop floor opens the tech-skills dialogue. This plan also adds the tool props that the garage workshop reuses.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only forge`).

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

### Step 1: Structure manifest for the Engineering Workshop

Deliver:
- Create `src/world/buildings/forge/manifest.json` (schema of `docs/building-manifest.md`): `id: "forge"`, `displayName: "Engineering Workshop"`, `prompt: "inspect skills"`, footprint taken from the `forge` anchor in `src/world/layout/town.json` (about 18 by 14 m), floors one floor (height 4.2 for the shop floor), style: plaster wall tint `#c9c2b2` (concrete grey), `flat` roof is not used: use `gable` with `metalPainted` corrugated look (material `metalPainted`), pitch 0.25, trim `metalPainted`.
- Rooms (ids fixed): `shop-floor` (main machine floor, 11 by 9 m); `tool-store` (tool and parts store, 5 by 4 m); `electronics-lab` (electronics bench room, 6 by 5 m); `office` (works office, 5 by 4 m). Room count between 3 and 6.
- Doors: a roller-shutter door south into `shop-floor` (width 3.0, height 3.0, `exterior`, unlocked, treated as a normal door leaf in the kit with the shutter drawn as a ribbed leaf), a small pedestrian door beside it into `shop-floor` (width 1.2, `exterior`, unlocked), `shop-floor` to `tool-store`, `shop-floor` to `electronics-lab`, `electronics-lab` to `office` (interior doors). At least one unlocked exterior door that is not decorative. Windows: at least 8 high strip windows. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 8, door 2, signage 2, drainpipe 4, planter 2, bin 3, lamp 4; the exterior has a chimney stack, a roller shutter, stacked pallets and a water drum. `interactables`: declare only `skills-board` now (kind `read`, room `shop-floor`, `dialogueKey` `main`, prompt "inspect skills").
- `tests/unit/buildings/forge.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the roller-shutter door is at least 3.0 m wide, both exterior doors are unlocked, the four rooms are all reachable; the CLI `check:buildings --only forge --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/forge.test.js`
- `node scripts/check-buildings.mjs --only forge --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/forge/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/forge/build.js` exports `decorateForge(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): corrugated metal roof (ribbed `metalPainted`), ribbed roller shutter leaf half raised, a brick chimney stack with a cap, a painted signboard "ENGINEERING WORKS / பொறியியல் பணிமனை" (add key `workshop-sign`), pallets, an oil drum and a water tank, wall lamps, two windows with bars (grille), a small shed lean-to.
- Signage from `src/content/signage.js`: add the keys `workshop-sign`, `skills-board` ("SKILLS" / "திறன்கள்") (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/forgeExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/forgeExterior.test.js`
- `node scripts/check-buildings.mjs --only forge --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/forge/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- New props first (category `tools`, file `src/world/props/sets/tools.js`, same quality bar and metadata rules as plans 019 and 022): `workbench`, `toolbox`, `pegboard-tools`, `lathe-machine`, `drill-press`, `bench-vise`, `parts-bins`, `oscilloscope`, `soldering-station`, `printer-3d`, `cable-reel`, `welding-mask`, `compressor`, `shelf-industrial`. machines have at least 8 distinct parts (lathe: bed, headstock, chuck, tailstock, carriage, handwheels, motor cover, base). Register them in `src/world/props/index.js` and add `tests/unit/props/tools.test.js` (exact list, sizes within 20 percent of the bounding box, categories, lathe length 1.4 to 2.2 m, workbench height 0.85 to 0.95 m, small tools not solid).
- Room `shop-floor` (floor material `concrete`): `lathe-machine` x2, `drill-press` x2, `workbench` x4, `bench-vise` x4, `toolbox` x3, `pegboard-tools` x3 on walls, `compressor`, `shelf-industrial` x2, `parts-bins` x3, `welding-mask` x2, `cable-reel` x2, `fan-pedestal` x2, `tube-light` x6, `fire-extinguisher` x2, `exit-sign`, `sign-board` (Tamil text slot "SKILLS" board position), `trash-bin-small`, `water-dispenser`, `stool` x3, `wall-clock`. Lights: six tube lights group `shop` plus a big switch at the door.
- Room `tool-store` (floor material `concrete`): `shelf-industrial` x4, `parts-bins` x4, `toolbox` x2, `cable-reel` x2, `archive-box` x3, `filing-cabinet`, `table-folding`, `stool`, `tube-light` x2, `locker-bank`, `pegboard-tools`, `rope-coil`, `book-stack`, `trash-bin-small`. Lights: two tube lights group `store`.
- Room `electronics-lab` (floor material `floorTile`): `workbench` x2, `oscilloscope` x2, `soldering-station` x2, `printer-3d`, `monitor-desktop` x2, `laptop`, `keyboard-mouse` x2, `chair-office` x3, `server-rack`, `network-box`, `whiteboard-rolling`, `shelf-wall` x2, `parts-bins` x2, `desk-lamp` x2, `ac-split`, `fan-ceiling`, `plant-office`. Lights: panel lights group `lab`.
- Room `office` (floor material `floorTile`): `desk-wood`, `chair-office`, `chair-wooden` x2, `filing-cabinet` x2, `bookshelf-low`, `cabinet-low`, `monitor-desktop`, `phone-desk`, `wall-clock`, `picture-frame-set`, `fan-ceiling`, `water-dispenser`, `rug-rect`, `plant-potted-small`, `printer-copier`. Lights: one tube light and a lamp group `office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: skills-board (`read`, the object is big skills board (a `sign-board` with the Tamil and English heading) on the long wall of the shop floor); light switches per room; seats the stools and the office chair.
- `tests/unit/buildings/forgeInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the skills board is within 8 m of the main door and clear; lathes are solid; the electronics lab has 2 oscilloscopes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/forgeInterior.test.js tests/unit/props/tools.test.js tests/unit/props/allProps.test.js`
- `node scripts/check-buildings.mjs --only forge`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `forge` becomes `name: "Engineering Workshop"`, `prompt: "inspect skills"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `forge` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `forge` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `forge` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (big skills board (a `sign-board` with the Tamil and English heading) on the long wall of the shop floor) so `E` opens the existing dialogue for `forge` (A5); the content stays exactly as v1.
- Add `forge` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/forge.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `forge` with `interiorVisible` true and empty `problems`; walk to the big skills board (a `sign-board` with the Tamil and English heading) on the long wall of the shop floor and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[forge].mustInclude` and the display name; Escape closes; undefined; zero console errors.
- Add budget spots `forge-outside` and `forge-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 044 --spots forge-outside,forge-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/forge.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only forge`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/forge.test.js tests/unit/buildings/forgeExterior.test.js tests/unit/buildings/forgeInterior.test.js`
- `node scripts/check-buildings.mjs --only forge`
- `npx playwright test tests/e2e/forge.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge whether the workshop reads as a real engineering works.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
