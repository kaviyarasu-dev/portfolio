# Plan 077: All eight journeys in one command, journey 3 by the map, journey 6 at night, streaming order with real areas

Epic E8. Estimated turns: 50.

## Goal

Close the loop on the spec's user journeys. Journey 1 (arrive), 2 (door), 4 (lighthouse), 5 (sit), 7 (phone, plan 071 and 075) and 8 (no WebGL) have their tests; add journey 3 using the real fast-travel map, journey 6 (night in town with muffled sound indoors), and a runner script that runs all eight and prints a table. Prove the streaming order with the real areas: centre and hotel before everything else, interiors released outside.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 8 and spec section 4 (user journeys), 10.8 (world hook), requirement R13, assumption A13, A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/plans/realistic-world-overhaul/ARCHITECTURE.md (sections 6, 8, 10.8)
- tests/e2e/journey-1-arrive.spec.js (031), tests/e2e/journey-2-door.spec.js (031/057), tests/e2e/journey-3-library.spec.js (057, frozen; NOT edited by this plan), tests/e2e/lighthouse.spec.js (055), tests/e2e/journey-5-sit.spec.js (027), tests/e2e/touch.spec.js (071), tests/e2e/journey-8-no-webgl.spec.js (069), tests/e2e/phone-download.spec.js and tests/e2e/phone-world.spec.js (075)
- src/ui/map.js (plan 068: fast-travel map, the marker selector and the entrance and front point helpers it exports, mute key N, plan 064)
- src/systems/teleport.js (plan 068: fastTravelPoint)
- src/engine/streaming.js (plan 015: streamState, loadOrder, area states)
- src/world/areas/index.js and ZONE_LAYOUT (plan 040: zone id to area id table)
- src/world/buildings/ and the v1 world module (plans 031 and 057: removed)
- src/content/experience.js (plan 006: export EXPERIENCE)
- src/dev/worldHook.js (plan 003 owns the hook): listBuildings (plan 021), listLights (plan 012), nightGlowStats (plan 063), audioState and the outdoorCutoff filter (plan 065), unlock rule (plan 064), setTime, teleport
- src/world/kit/interiors.js (plan 075: interior manager, low-tier release rule)
- package.json (plan 001: scripts, lint config covers tests/ and scripts/)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Journey 3 by the map and journey 6 at night

Deliver:
- Hook fields used by this plan (hook owner plan 003; added to ARCHITECTURE 10.8 as a cross-plan request): `listBuildings()` records have `interiorBuilt: boolean` [plan 021, extended by 075] next to `interiorVisible`; `listLights()` records have `id`, `group`, `on` and `auto` [light fields from plans 012 and 063; plan 012 returns `id`, `group`, `room`, `on`, `pooled`, `intensity` and, after the fix in `defs/e1c.mjs`, `auto`]. There is no `type` field. Street lamps (plan 029) are identified by an `id` starting `street-lamp-` and by `auto` equal to `dusk`; they sit in group `square:street` and switch on automatically at dusk (plan 063). The library hall lights are the lights whose `group` is `library:hall` (plan 053 `hall` group, scoped to its building by the plan 021 per-building group rule). Teleport targets are ZONE IDS only (plan 003 hook: a zone id; no x,z coordinates in this plan): zone `plaza` is area `hotel` (so the hotel is teleported to as zone `plaza`); zone `centre` is area `centre`; every other zone id is its own area id (plan 040 ZONE_LAYOUT is the source). The fast-travel jump is `fastTravelPoint` in `src/systems/teleport.js` (plan 068).
- `tests/e2e/journey-3-map.spec.js` (new, frozen; journey 3 by the map): open the site, press `m`, click the Public Library marker (the marker selector is the one plan 068 exports and the test imports; its name is not restated here), `expect.poll` until the player is within 6 m of the library entrance point (the entrance helper exported by plan 068; the test imports it). Press `e` to open the door and walk in through it (hold `w`; no coordinate teleport, since teleport targets are zone ids only and walkTo follows the road graph only). Climb to the archive by walking the stair inside the library (hold `w`), then hold `w` inside the room to reach the ledger. Press `e` on the ledger: `#dialogue` is visible; the role entries `[data-section="experience"] article h3` count is greater than zero and equals `EXPERIENCE.length` (export from `src/content/experience.js`, plan 006); the company names `[data-company]` equal the company names of `EXPERIENCE` in order (compare the DOM text with the imported module).
- `tests/e2e/journey-6-night.spec.js` (new, frozen; journey 6): open `/?quality=low` (no `?time` and no `freeze`: the audio filter stops under freeze, plan 065), then call `__world.setTime(0.75)` and `expect.poll` until the street lamps are on (plan 063 dusk rule). Street lamps (auto, dusk): `listLights()` has at least 8 records whose `id` starts with `street-lamp-`, whose `auto` is `dusk` (group `square:street`), and whose `on` is true; `nightGlowStats()` reports over 40 glowing windows. Teleport to zone `library` (the front, outside the door), press `e` to open the door, walk in through it (hold `w`), press `e` on the door to CLOSE it (door state from plan 017), and assert the library hall lights (`group` equal to `library:hall`) are on. Press a movement key to unlock audio first (plan 064 unlock rule), then `audioState().filter.outdoorCutoff` outdoors is at least 15000 and indoors with the door closed is at most 2500. Teleport to zone `centre` (outdoors) and `expect.poll` until the outdoor cutoff is above 15000 within 2 s. If `audioState().unlocked` is still false after the key press, the test fails with the message "audio not unlocked" (the filter values are asserted regardless: they update independent of the audio graph, plan 065). Zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-3-map.spec.js`
- `npx playwright test tests/e2e/journey-6-night.spec.js`

### Step 2: Streaming order with the real areas

Deliver:
- `tests/e2e/streaming-real.spec.js` (new, frozen; R13 and A26): open the base URL with default params and record `streamState().loadOrder` (poll until 15 entries or until all 14 areas are loaded). The first two entries are `centre` and `hotel` (any order); both are `loaded` before `harbour`, `forest`, `west-gate` and every landmark area (the 13 landmark areas: the 14 zone ids of ZONE_LAYOUT minus `plaza`). Each landmark area is loaded by teleporting to its zone id and `expect.poll`-ing `streamState()` until it is `loaded` (no "not in loadOrder yet" pass).
- Module check: `none` on `src` for the v1 world module name `v1-world` (plans 031 and 057 removed it). Interior hiding: stand in the square and assert `listBuildings()` shows `interiorVisible: false` for the hotel, the post office and the library (use `toBe(false)`, after `expect.poll` until the library record exists). Walk into the hotel (teleport to zone `plaza`, then walk through its door and inside) and it becomes `true`. The interior release check uses `/?quality=low&freeze=1`: after `teleport` to the lighthouse, the LIBRARY interior is released (`interiorBuilt: false`) because the library is a landmark with `interior: true`; the hotel is an always-on area and is exempt from the manager (plan 075), so it is not used for the release check. Teleport back: the library is rebuilt (`interiorBuilt: true`).
- Loading: `#loader` carries the class `hidden` (plan 002); assert `toHaveClass(/hidden/)` (not only "not visible") after the first load and during every teleport. No area stays `failed`: `expect.poll` until no area is in state `failed`, with a 15 s timeout. Zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/streaming-real.spec.js`

### Step 3: The journeys runner

Deliver:
- `scripts/run-journeys.mjs`: exports `JOURNEYS` = `[{ n: 1, name: 'Arrive and check in', spec: 'tests/e2e/journey-1-arrive.spec.js' }, { n: 2, name: 'Walk through a door', spec: 'tests/e2e/journey-2-door.spec.js' }, { n: 3, name: 'Read the experience', spec: 'tests/e2e/journey-3-map.spec.js' }, { n: 4, name: 'Climb the lighthouse', spec: 'tests/e2e/lighthouse.spec.js' }, { n: 5, name: 'Sit and look around', spec: 'tests/e2e/journey-5-sit.spec.js' }, { n: 6, name: 'Night in town', spec: 'tests/e2e/journey-6-night.spec.js' }, { n: 7, name: 'Phone visit', specs: ['tests/e2e/touch.spec.js', 'tests/e2e/phone-download.spec.js', 'tests/e2e/phone-world.spec.js'] }, { n: 8, name: 'No-WebGL visitor', spec: 'tests/e2e/journey-8-no-webgl.spec.js' }]` (journey 7 uses `specs`, an array; the others use `spec`). It runs the specs serially (`--workers=1`, one child process per spec) with `node node_modules/@playwright/test/cli.js test <spec> --reporter=list` and `shell: false` (Windows-safe), runs every journey (no stop at the first failure), prints the table `n | name | spec | result | seconds`, and exits 1 if any journey fails.
- Pure helper `checkSpecs(JOURNEYS, root)` returns the list of spec paths that do not exist under `root`. `node scripts/run-journeys.mjs --dry-run` prints the table with the 8 rows without running Playwright and exits 1 when `checkSpecs` is not empty. `package.json` gets the script `test:journeys` = `node scripts/run-journeys.mjs`. Unit test `tests/unit/scripts/journeys.test.js` (new, frozen): eight entries numbered 1 to 8; the names equal the spec section 4 titles ("Arrive and check in", "Walk through a door", "Read the experience", "Climb the lighthouse", "Sit and look around", "Night in town", "Phone visit", "No-WebGL visitor"); every spec file exists; `checkSpecs` with a fake root that lacks a file returns that path; `--dry-run` prints 8 rows and exits 0 on the real repo.
- Run `npm run test:journeys` once; all eight must pass. The 60 minute timeout is for the serial run of eight Playwright specs with WebGL under SwiftShader. A journey failure is a code fix, never an edit of a frozen test; if a frozen test is wrong, the plan writes `BLOCKED.md` (the one write allowed in the plan folder, the INSTRUCTIONS rule 2 exception) and stops.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/journeys.test.js`
- `node scripts/run-journeys.mjs --dry-run`
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
