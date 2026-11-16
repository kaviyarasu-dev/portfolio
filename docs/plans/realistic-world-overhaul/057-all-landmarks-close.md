# Plan 057: All 14 landmarks: v1 building code removed, consistency checks, dialogues and journeys 2 to 4

Epic E4. Estimated turns: 60.

## Goal

Close epic 4. Every landmark is now a walk-in building. Remove the v1 BUILDING code only (the v1-world terrain area stays: plans 015, 031, 033 and 036 own it and the boot order `v1-world`, `centre`, `hotel` is asserted by frozen plan 031 tests), make the final consistency checks (`check:buildings --all`, names, modes, dialogues), run all 14 dialogues in the browser, prove journeys 2, 3 and 4 with teleports to the doors, and write the review pack. After this plan the runner pauses for your review.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.7 and requirement R6, R8, assumption A30; ARCH 10.8 (the v1-world area stays, see step 1))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/zones.js
- src/world/buildings.js
- src/world/buildingAnims.js
- src/world/collision.js
- src/world/areas/index.js
- src/content/dialogues.js
- tests/fixtures/zoneExpect.json
- scripts/check-buildings.mjs
- `portfolio/README.md`
- src/ui/minimap.js
- src/systems/gameloop.js
- src/systems/interaction.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Remove v1 building code, keep the v1-world terrain, finish the zone table

Deliver:
- `tests/unit/world/zones.test.js` is created by plan 051 and extended by plans 052 to 056: extend it here and do not create it new (keep the assertions of the earlier plans). `ZONE_LAYOUT` (in `src/world/zones.js`) has exactly the 14 ids; every zone has `mode: "object"` EXCEPT `notice`, which stays `mode: "radius"` (decision: plan 043 leaves notice in radius mode, ARCHITECTURE 10.7 and the frozen plan 017 test 5 keep the notice radius; the test lists it in the constant `RADIUS_ZONES` = ["notice"] and asserts that this is the only radius zone); every zone whose manifest exists (`src/world/buildings/<id>/manifest.json`) has `name` equal to the manifest `displayName` and `prompt` equal to the manifest `prompt`; the zones without a manifest (the plaza of plan 031 and any other zone found by grep) are listed in the constant `NON_BUILDING_ZONES` of the test with their expected name; the position of every building zone equals the world position of the manifest read interactable (anchor x and z plus the local x and z, rotation 0, tolerance 0.5 m; the anchor from `src/world/layout/town.json`); the plaza zone equals the reception desk of plan 031 (-13.25, -6.7, radius 3). Old v1 names: the constant `V1_NAMES` = ["Plaza of Kaviyarasu", "Notice Board", "Skill Forge", "Citadel", "Broadcast"] is matched as WHOLE names only (`zone.name` equal to one of them is a failure; "Broadcast Station" is fine). The minimap: `none("src/ui/minimap.js", name)` for each V1_NAMES entry, and the minimap takes each label from `src/world/zones.js` (no second copy of a name).
- Remove the v1 building code only. In `src/world/buildings.js` delete every remaining v1 building factory and its table entry (the factories of the 14 landmarks are already removed by plans 043 to 056; list what is left in the report) and any helper only they used (grep first); delete `src/world/buildingAnims.js` and every import of it; in `src/world/collision.js` remove the v1 per-building colliders and keep the terrain collision; remove `updateBuildings` from the per-frame loop in `src/systems/gameloop.js`; keep the radius-mode branch of `tryAction` in `src/systems/interaction.js` (the `notice` zone stays `radius`, so the branch is still used; do not remove it); keep `openDialogue` and the dialogue builders. Delete a `src/util/three.js` helper only when `grep -rn` of its name over `src`, `tests` and `scripts` finds nothing but its own definition; otherwise keep it.
- KEEP the `v1-world` area: it owns the terrain, the far road, the scatter and the water (plans 015, 031, 033 and 036; ARCHITECTURE 10.8), it stays in `src/world/areas/index.js` with priority 100 and `essential: true`, and the boot order `v1-world`, `centre`, `hotel` stays. Frozen plan 031 tests (`tests/unit/world/sliceAreas.test.js`, `tests/e2e/slice-regression.spec.js`, `tests/e2e/journey-1-arrive.spec.js`) are NOT edited; they must still pass. If a frozen test asserts that a v1 building exists, it must be listed in `unfreeze` below and reported (the expected list is empty; do not unfreeze anything silently).
- README (`README.md` is allowed): replace the controls table with the keys that the code binds (grep the key handlers under `src/systems` and `src/ui` at step start: WASD, Shift, mouse, E, V first person, T time, O settings as the minimum; the real list wins), and the zone table with the 14 display names and what each shows (from the content files, no new facts). Touch controls (plan 071) and the map (plan 068) are listed as "coming" because they are not implemented in this epic. Assertions: `has("README.md", "Town Hall")`, `has("README.md", "Startup Garage")`, `has("README.md", "Design Studio")`, `has("README.md", "Public Library")`, `has("README.md", "Academy")`, `has("README.md", "Lighthouse")`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/zones.test.js`
- `node -e "const fs=require('fs');process.exit(['src/world/buildingAnims.js'].some(p=>fs.existsSync(p))?1:0)"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "updateBuildings"`
- `node "{{runner}}/assert.mjs" none src/systems/gameloop.js "updateBuildings"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "v1-world"`
- `npm run lint`
- `npx vitest run tests/unit/world/sliceAreas.test.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`

### Step 2: Whole-set checks and all 14 dialogues

Deliver:
- `npm run check:buildings -- --all` must pass: all 14 manifests, every rule, `stage` full in each. Fix every finding in the building it concerns; do not weaken the checker. If the checker itself is wrong, stop with BLOCKED.md.
- `tests/helpers/doors.js` (new, used by the journey tests too): `doorWorld(zoneId)` reads the manifest of the zone (`src/world/buildings/<id>/manifest.json`), takes the first unlocked exterior door that is not decorative (the main door of every landmark), converts its building-local position with the anchor of `src/world/layout/town.json` and the ARCHITECTURE 10.8 transform, and returns the world x, y, z and the outward yaw. `teleportToDoor(page, zoneId)` teleports 6 m outside the door, then `e` opens it (polled), then teleports 1.5 m inside. Teleport only: `walkTo` is the road graph only and cannot open doors or climb stairs (plan 040).
- `tests/e2e/dialogues-all.spec.js`: for each of the 14 zones: `teleportToDoor` to the building door, then `teleport` to the interactable position of the read object (`listInteractables()` gives its position by id from each manifest), press `e`, assert `#dialogue` has class `visible`, contains the display name and every `mustInclude` string of `tests/fixtures/zoneExpect.json`, close with Escape. The `notice` zone triggers a download as well (listen for the download event). The plaza is opened at its reception interactable `reception-intro` (plan 031). Every wait is `expect.poll`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node scripts/check-buildings.mjs --all`
- `npx playwright test tests/e2e/dialogues-all.spec.js`

### Step 3: Journeys 2, 3 and 4, budgets, shots and the review pack

Deliver:
- `tests/e2e/journey-2-door.spec.js` (journey 2): start at the spawn in the hotel lobby (no teleport; if one is needed, the hotel zone id is read from `ZONE_LAYOUT`, never guessed), `teleportToDoor` to the post office (the zone whose manifest is the post office; its id is read from `ZONE_LAYOUT`, not guessed), `e` at the counter: a download named `Kaviyarasu_Fullstack_Engineer_Resume.pdf` starts (download event, plus the RESUME DOWNLOADED toast of plan 043). `tests/e2e/journey-3-library.spec.js` (journey 3; the fast-travel map arrives in plan 068, so use `teleport("library")` now; plan 077 switches this step to the map): `teleportToDoor("library")`, `teleport` to the stair foot (building-local (-2.0, 0, 3.6) converted with the anchor), hold `w` with yaw 0, `expect.poll` that the player y is within 0.1 of the archive floor (anchor y plus 5.0), `teleport` to the ledger read point (-8.0, 5.0, 1.2) and press `e`: the roles in the dialogue (count the entries with the role marker of the dialogue builder, read at step start) equal the entries of `src/content/experience.js` in number and company names. The journey 4 test is `tests/e2e/lighthouse.spec.js` from plan 055; run it here too.
- `npm run check:budget` with spots for every landmark: `<id>-outside` and `<id>-inside` must exist in `src/budgets.json` and `src/shots.json`. Known ids from the plans: citadel, temple, forge, transport, notice, gateway, broadcast (their owning plans), workshop (051), freshnote (052), library and `library-archive` (053), academy (054), lighthouse with `lighthouse-top` and `lighthouse-cottage` (055), milestones (056). Plaza has only the `slice-*` ids of plan 031: add `plaza-outside` and `plaza-inside` here at the reception desk (-13.25, -6.7) with coordinates. Hotel, post office and any other zone of `ZONE_LAYOUT` without spots: add the missing ids here with coordinates from its manifest, and `has` asserts for all 14 zones in the verify list. Budgets only for the ones that need it; the shots list for all. The check passes both profiles; if a landmark is over, fix it in that building. `npm run shots -- --plan 57` for the 14 exteriors and 14 main rooms (add spots where missing); view and fix visible defects (best effort). Shot paths under `docs/shots/` are git-ignored and inside `portfolio/docs/shots/**` (allowed below).
- Write `docs/review/landmarks-review.md` for the person: the 28 screenshot paths (14 `-outside` and 14 `-inside`), a table of the 14 buildings (display name, rooms, distinct object types from `check:buildings`, which dialogue it opens), the controls, what is still missing (NPCs, weather, new audio, map, text mode, tour, touch). `tests/unit/docs/landmarksReview.test.js` (new, small) asserts the 28 shot paths are present, the table has 14 rows, and each display name is in the file.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-2-door.spec.js`
- `npx playwright test tests/e2e/journey-3-library.spec.js`
- `npx playwright test tests/e2e/lighthouse.spec.js`
- `npm run check:budget`
- `npx vitest run tests/unit/docs/landmarksReview.test.js`
- `node "{{runner}}/assert.mjs" exists docs/review/landmarks-review.md`
- `node "{{runner}}/assert.mjs" has src/budgets.json "plaza-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "lighthouse-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "milestones-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "library-archive"`
- `npm run check:ledger`
- `npm run check:size`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/world/zones.test.js`
- `node scripts/check-buildings.mjs --all`
- `npx playwright test tests/e2e/dialogues-all.spec.js`
- `npx playwright test tests/e2e/journey-2-door.spec.js`
- `npx playwright test tests/e2e/journey-3-library.spec.js`
- `npx playwright test tests/e2e/lighthouse.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Milestone of epic 4: walk every landmark and approve before life, audio and extras are added.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
