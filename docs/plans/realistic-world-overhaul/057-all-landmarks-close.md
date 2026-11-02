# Plan 057: All 14 landmarks: v1 code removed, consistency checks, dialogues and journeys 2 to 4

Epic E4. Estimated turns: 50.

## Goal

Close epic 4. Every landmark is now a walk-in building. Remove the v1 building code, make the final consistency checks (`check:buildings --all`, names, modes, dialogues), run all 14 dialogues in the browser, and prove journeys 2, 3 and 4 with the auto-walk helper. After this plan the runner pauses for your review.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.7 and requirement R6, R8, assumption A30)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/zones.js
- src/world/buildings.js
- src/world/buildingAnims.js
- src/world/areas/index.js
- src/content/dialogues.js
- tests/fixtures/zoneExpect.json
- scripts/check-buildings.mjs
- `portfolio/README.md`
- src/ui/minimap.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Remove v1 building code and finish the zone table

Deliver:
- `tests/unit/world/zones.test.js` first (new file): `ZONE_LAYOUT` has exactly the 14 ids; every zone has `mode: "object"`; every zone `name` equals `displayName` of its `src/world/buildings/<id>/manifest.json`; every `prompt` equals the manifest `prompt`; positions equal the `town.json` anchors; no zone name still contains old v1 names (`Plaza of Kaviyarasu`, `Notice Board`, `Skill Forge`, `Citadel`, `Broadcast`... the old strings: check against a list), the minimap legend labels come from the same names.
- Delete `src/world/buildings.js`, `src/world/buildingAnims.js` and every import of them; remove the `v1-world` area from `src/world/areas/index.js`; remove the radius-mode branch of `src/systems/interaction.js` (`tryAction` special cases) now that every zone is `object`; remove `updateBuildings` from the game loop; remove v1 per-building colliders. Keep `openDialogue` and the dialogue builders. Delete unused v1 helpers that are now dead (`src/util/three.js` functions that nothing imports; check with a search before deleting).
- README: replace the controls table with the real one (WASD, Shift, mouse, E, V first person, T time, O settings; touch controls arrive in plan 071 and the map in plan 068, mention them as "coming" only if not yet implemented) and the zone table with the 14 display names and what each shows (the section from the content files, no new facts).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/zones.test.js`
- `node -e "const fs=require('fs');process.exit(['src/world/buildings.js','src/world/buildingAnims.js'].some(p=>fs.existsSync(p))?1:0)"`
- `npm run lint`

### Step 2: Whole-set checks and all 14 dialogues

Deliver:
- `npm run check:buildings -- --all` must pass: all 14 manifests, every rule, the stage `full`. Fix every finding in the building it concerns (do not weaken the checker).
- `tests/e2e/dialogues-all.spec.js`: for each of the 14 zones: `teleport` to the building door, enter by `walkTo` the interactable position, press `e` at the read object (`listInteractables()` gives its position by id from each manifest), assert `#dialogue` has class `visible`, contains the display name and every `mustInclude` string of `zoneExpect.json`, close with Escape. The `notice` zone triggers a download as well (listen for the event). The `plaza` desk is the reception.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node scripts/check-buildings.mjs --all`
- `npx playwright test tests/e2e/dialogues-all.spec.js`

### Step 3: Journeys 2, 3 and 4 and the review pack

Deliver:
- `tests/e2e/journey-2-door.spec.js` (journey 2): start at the spawn, `walkTo` the post office door, `e` opens it, walk in with the loader staying hidden, `walkTo` the counter, `e`: a download named `Kaviyarasu_Fullstack_Engineer_Resume.pdf` starts. `tests/e2e/journey-3-library.spec.js` (journey 3; the fast-travel map arrives in plan 068, so use `teleport('library')` now; plan 077 switches this step to the map): enter the library, climb to the archive, `e` on the ledger: the dialogue roles equal the entries of `src/content/experience.js` (count and company names). The journey 4 test is `tests/e2e/lighthouse.spec.js` from plan 055; run it here too.
- `npm run check:budget` with spots for every landmark (`<id>-outside` and `<id>-inside` were added by each plan) passes both profiles; if a landmark is over, fix it in that building. `npm run shots -- --plan 057` for the 14 exteriors and 14 main rooms (add spots where missing); view and fix visible defects (best effort).
- Write `docs/review/landmarks-review.md` for the person: the 28 screenshot paths, a table of the 14 buildings (display name, rooms, distinct object types from `check:buildings`, which dialogue it opens), the controls, what is still missing (NPCs, weather, new audio, map, text mode, tour, touch).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-2-door.spec.js`
- `npx playwright test tests/e2e/journey-3-library.spec.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/review/landmarks-review.md`

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
