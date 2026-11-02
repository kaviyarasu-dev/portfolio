# Plan 024: check:buildings and the Grand Hotel structure manifest

Epic E2. Estimated turns: 55.

## Goal

Create the machine check that enforces the Rich detail bar (`npm run check:buildings`) and the structure of the first real building, the Grand Hotel (zone id `plaza`): footprint, three levels (ground, first floor, roof terrace), all rooms, doors, windows, stairs, lift, exterior detail counts. Objects and lights are added by plans 025 to 027; the check has stages so it passes now on structure and later on the full bar.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.4, 10.6, requirement R6 and R7, assumption A6, A30)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/building-manifest.md
- src/world/kit/schema.js
- src/world/kit/building.js
- src/systems/nav/walkGraph.js
- src/world/props/index.js
- src/world/zones.js
- tests/fixtures/manifests/cottageFull.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: check-buildings with stages

Deliver:
- `tests/unit/scripts/checkBuildings.test.js` first. `scripts/check-buildings.mjs` (exports `checkBuilding(manifest, { stage })` and `checkAll({ stage, only, all })`; the CLI prints one table row per building and exits 1 on any problem): loads every `src/world/buildings/<id>/manifest.json`; options `--only <id>`, `--all` (all 14 zone ids must have a manifest), `--stage structure|rooms|full` (default `full`), `--rooms a,b` with `--min-types-per-room N` (default 12).
- Rules by stage. structure: `validateManifest` has no problems; 3 to 6 rooms (the `plaza` manifest may have up to 24); at least one `exterior` door with `locked: false` and `kind` not `decorative`; the building built headless with `buildBuilding` and stub contexts reports no `problems`; every room is reachable from `outside` with the walk graph when all non-locked, non-decorative doors are open; the manifest `exteriorDetails` has all seven classes (`window door signage drainpipe planter bin lamp`) with count at least 1 (`window` at least 4). rooms: for the rooms given in `--rooms` each has at least `--min-types-per-room` distinct object types. full: all of the above plus at least 40 distinct object types over all rooms, every type registered in the prop catalog, every interactable of kind `read` has a `dialogueKey`, and at least one `light` per room that has a window or a door to the outside.
- The `plaza` extra rules (any stage but `structure` for the lists): rooms named `lobby`, `restaurant`, `kitchen`; at least 4 rooms with id starting `guest-` and for each one a room `bath-<same suffix>` connected by a door; at least one room whose id starts with `corridor`; a floor with `rooftop: true` that is walkable (a room `rooftop` exists).
- Tests build small invalid manifests from `cottageFull.json` for each rule (too many rooms, no exterior door, locked-only route, missing detail class, unknown prop type, fewer than 40 types, hotel rule violations) and assert the message names the rule; a valid rich manifest is generated in the test by adding 40 real catalog types to a copy of the cottage.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/checkBuildings.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/check-buildings.mjs`

### Step 2: Grand Hotel structure manifest

Deliver:
- `src/world/buildings/plaza/manifest.json` with `id: "plaza"`, `displayName: "Grand Hotel"`, `prompt: "check in"`, footprint 28 m wide by 20 m deep, floors: level 0 (y 0, height 3.8), level 1 (y 4.0, height 3.4), level 2 `rooftop: true` (y 7.6). Rooms (ids fixed): ground floor `lobby`, `restaurant`, `kitchen`, `stairhall`; first floor `corridor-1`, `guest-1` to `guest-4`, `bath-1` to `bath-4`; `rooftop`. Total 14 spaces. Suggested layout (adjust so every door wall lies on a shared boundary): ground floor, front (+z) half is lobby (left, 16 m wide) and restaurant (right); back half is kitchen (right) and stairhall (left, with the lift shaft and the staircase); first floor, a corridor along the middle with four guest rooms on the front side, each with its bathroom behind it.
- Doors: main exterior door on the south wall into `lobby` (width 2.0, `exterior`), a second exterior door into `restaurant` (width 1.6), a service door from `kitchen` to outside (`exterior`, `locked: true`), interior doors between lobby and restaurant (wide opening 2.4), lobby and stairhall, restaurant and kitchen, stairhall and `corridor-1` via the stairs (no door), corridor to each guest room (`guest-1` and `guest-2` unlocked, `guest-3` and `guest-4` `locked: true`), each guest room to its bath, stairhall to `rooftop` via stairs. Windows: at least 24 over the facades (every guest room 2, lobby 3, restaurant 4, kitchen 1). Stairs: ground to first floor (rise 4.0) and first floor to roof (rise 3.6). One lift in the stairhall serving levels 0, 1 and 2.
- `exteriorDetails` counts: window 24 (or the real number), door 3, signage 3, drainpipe 4, planter 8, bin 3, lamp 8. `interactables`: only the three ids that exist now are declared here with real positions: `reception-intro` (kind `read`, room `lobby`, `dialogueKey` `intro`), more are added by later plans. `rooms[].objects` stays empty and `lights` empty for now.
- `tests/unit/buildings/plaza.test.js`: `checkBuilding(plaza, { stage: "structure" })` passes; room list exactly as above; guest-3 and guest-4 are locked and guest-1 and guest-2 are not; the main door width is 2.0; `check:buildings` CLI with `--only plaza --stage structure` exits 0.
- `src/world/zones.js`: add the `displayName` mapping for `plaza` (`Grand Hotel`) and the `mode` stays `radius` until plan 031.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/plaza.test.js`
- `node scripts/check-buildings.mjs --only plaza --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/plaza/manifest.json`

### Step 3: Hotel shell in the browser

Deliver:
- `src/dev/fixtures/building-plaza.js` builds the plaza manifest with the real context at the origin on a flat 120 m floor (no props yet); register as `building-plaza`. Spawn 8 m south of the main door.
- `tests/e2e/plaza-shell.spec.js`: `?fixture=building-plaza&time=0.5`; the main door opens with `e` and the player can walk into the lobby (`listBuildings()` shows `interiorVisible` true after entering); the locked service door and `guest-3` door refuse; `rendererInfo().calls` is under 150 with the interior visible; zero console errors. Take two shots with `npm run shots -- --fixture building-plaza --plan 024 --spots hotel-front,hotel-lobby` (add those two spots to `src/shots.json` first) and look at them (best effort).
- Update `docs/world-conventions.md` with a short "How to add a building" section: manifest, `check:buildings`, fixture, shots.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/plaza-shell.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/building-plaza.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/checkBuildings.test.js tests/unit/buildings/plaza.test.js`
- `node scripts/check-buildings.mjs --only plaza --stage structure`
- `npx playwright test tests/e2e/plaza-shell.spec.js`

Human check (goes in the report, never blocks): Walk the empty hotel shell once in `?fixture=building-plaza` to judge the proportions and room layout before furniture goes in.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
