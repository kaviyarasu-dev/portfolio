# Plan 077: All eight journeys in one command, journey 3 by the map, journey 6 at night, streaming order with real areas

Epic E8. Estimated turns: 50.

## Goal

Close the loop on the spec's user journeys. Journey 1 (arrive), 2 (door), 4 (lighthouse), 5 (sit), 7 (phone, plan 071 and 075) and 8 (no WebGL) have their tests; add journey 3 using the real fast-travel map, journey 6 (night in town with muffled sound indoors), and a runner script that runs all eight and prints a table. Prove the streaming order with the real areas: town centre and hotel before everything else, interiors released outside.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 8 and spec section 4 (user journeys), requirement R13, assumption A13, A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- tests/e2e/journey-1-arrive.spec.js
- tests/e2e/journey-2-door.spec.js
- tests/e2e/journey-3-library.spec.js
- tests/e2e/lighthouse.spec.js
- tests/e2e/journey-5-sit.spec.js
- tests/e2e/touch.spec.js
- tests/e2e/journey-8-no-webgl.spec.js
- src/ui/map.js
- src/engine/streaming.js
- src/world/areas/index.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Journey 3 by the map and journey 6 at night

Deliver:
- `tests/e2e/journey-3-map.spec.js` (journey 3): open the site, press `m`, click the Public Library marker, assert the player arrives at the library entrance, `e` opens the door and the player enters, climbs to the archive (`walkTo` the stair foot and hold `w`), `e` on the ledger: `#dialogue` is visible and the number of listed roles equals the number of entries in `src/content/experience.js` and the company names listed equal the content file in order (import the module in the test and compare the DOM text).
- `tests/e2e/journey-6-night.spec.js` (journey 6): open with `?time=0.75&freeze=1`; street lamps and window glow are on (`listLights()` has at least 8 street lamp lights on and `nightGlowStats()` reports over 40 glowing windows); `walkTo` the library door and enter: the library lights are on; `audioState().filter.outdoorCutoff` outdoors is at least 15000 and indoors with the door closed is at most 2500; walk out and the cutoff recovers above 15000 within 2 s; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-3-map.spec.js`
- `npx playwright test tests/e2e/journey-6-night.spec.js`

### Step 2: Streaming order with the real areas

Deliver:
- `tests/e2e/streaming-real.spec.js` (R13 and A26): open the base URL with default params and record `streamState().loadOrder`: the first two entries are `centre` and `hotel` (any order), they are `loaded` before `harbour`, `forest`, `west-gate` and every landmark area; `v1-world` does not exist any more; interior hiding: stand in the square and assert `listBuildings()` shows `interiorVisible: false` for the hotel, post office and library; walk into the hotel and it becomes true; after `teleport` to the lighthouse the hotel interior is released on the `low` tier (`interiorBuilt: false` through the hook) and rebuilt when you return; no loading screen appears after the first load (`#loader` stays hidden during the teleports); no area stays `failed`; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/streaming-real.spec.js`

### Step 3: The journeys runner

Deliver:
- `scripts/run-journeys.mjs`: runs the 8 journey specs in order with Playwright (`journey-1-arrive`, `journey-2-door`, `journey-3-map`, `lighthouse`, `journey-5-sit`, `journey-6-night`, `touch` plus `phone-download` as journey 7, `journey-8-no-webgl`) as child processes, prints a table of journey number, name, spec file, result and duration, and exits 1 if any fails. Add `package.json` script `test:journeys`. Export the journey table (`JOURNEYS`) and unit test `tests/unit/scripts/journeys.test.js`: eight entries numbered 1 to 8, every spec file exists, names match the spec section 4 titles ("Arrive and check in", "Walk through a door", "Read the experience", "Climb the lighthouse", "Sit and look around", "Night in town", "Phone visit", "No-WebGL visitor").
- Run `npm run test:journeys` once; all eight must pass.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/journeys.test.js`
- `npm run test:journeys`
- `node "{{runner}}/assert.mjs" exists scripts/run-journeys.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/journeys.test.js`
- `npx playwright test tests/e2e/streaming-real.spec.js`
- `npm run test:journeys`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
