# Plan 031: Vertical slice integration: streamed hotel and square, spawn in the lobby, journey 1, review pack

Epic E2. Estimated turns: 50.

## Goal

Put the slice together as the visitor will experience it: the Grand Hotel and the square are streamed areas that load first, the visitor spawns in the hotel lobby facing the reception, the intro dialogue opens only from the reception desk (A6), the old v1 plaza building and anything overlapping the new square is gone, budgets hold, journey 1 passes end to end, and a review pack of screenshots for the person is written. After this plan the runner pauses for approval of the look (D17).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 10.4, 10.7 and requirement R7, decision D17, A6)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/world/zones.js
- src/engine/streaming.js
- src/world/layout/slice.json
- src/world/town/square.js
- src/world/buildings/plaza/build.js
- src/systems/interaction.js
- src/world/buildings.js
- src/budgets.json
- src/shots.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Streamed areas, spawn and zone changes

Deliver:
- `tests/unit/world/sliceAreas.test.js` first. `src/world/areas/plazaArea.js` exports `createPlazaAreas(game)` returning two Streamer area definitions: `centre` (id `centre`, priority 100, always on) loading the terrain-flattening data, square and street furniture, and `hotel` (id `hotel`, priority 100, `loadRadius` 140, `unloadRadius` 180) loading the hotel building through `buildBuilding` with `decoratePlaza` and the lights; the hotel area registers its interior as `interior: true`. The remaining v1 buildings, props and trees stay in the `v1-world` area (priority 50, they load after).
- Remove the v1 `plaza` building factory call and its collider from `src/world/buildings.js`. Relocate the v1 buildings that overlap the square or hotel footprints: add a test that no `ZONE_LAYOUT` circle (radius `r`) intersects the square rectangle or the hotel footprint plus 3 m; move `notice` to (-40, 24) and `milestones` to (40, 24) in `src/world/zones.js` if they do (they keep `mode: "radius"`). `plaza` becomes `name: "Grand Hotel"`, `mode: "object"`, `prompt: "check in"`.
- Spawn: the player starts inside the lobby, 5 m in front of the reception desk, facing it (read the desk position from the manifest `reception-intro` interactable), `playerState()` reports a position inside the hotel footprint. `teleport('plaza')` goes to the same place. Skip the v1 auto-open of the plaza dialogue (it only opens from the desk now); the `T`, `?time` features stay.
- The loading screen covers only the `centre` and `hotel` areas plus the player; the loader hides when they are `loaded`; the `v1-world` area continues in the background (show nothing). If an area fails, the retry banner of plan 015 appears.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/sliceAreas.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/areas/plazaArea.js`
- `npm run lint`

### Step 2: Journey 1 and the streaming order

Deliver:
- `tests/e2e/journey-1-arrive.spec.js` (journey 1 of the spec): open the base URL with default params; the loader shows progress then hides; `playerState()` is inside the hotel footprint; hold `w` until within 1.8 m of the reception desk (poll `playerState()` every 200 ms for at most 12 s); press `e`: `#dialogue` is visible and mentions the name from the contact content; press Escape: hidden; `streamState().loadOrder` starts with `centre` and `hotel` before `v1-world`; zero console errors.
- `tests/e2e/slice-regression.spec.js`: the other 13 v1 zones still behave as in v1 (loop over their ids: `teleport(id)`, press `e`, `#dialogue` visible, teleport away and it closes; the `notice` zone downloads the PDF instead, assert the download event and the RESUME DOWNLOADED toast); pressing `e` next to the hotel door outside does NOT open the plaza dialogue (only the reception desk does); `collisionStats()` shows boxes (hotel) and circles (v1 buildings).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`

### Step 3: Budgets, shots and the review pack

Deliver:
- Make sure `src/budgets.json` has spots `lobby`, `restaurant`, `square`, `guest-room`, `rooftop` (placed in world coordinates with the hotel at its slice position) and run `npm run check:budget`: desktop and phone profiles must pass. If a spot is over its limit, reduce draw calls by merging static meshes per material, using `InstancedMesh` for repeated props (chairs, lamps, leaves), and hiding the interior when outside; do NOT raise a limit.
- Run `npm run shots -- --plan 031 --spots hotel-front,hotel-corner,square-day,square-night,hotel-reception,hotel-restaurant,hotel-kitchen,hotel-corridor,hotel-guest-1,hotel-bath-1,hotel-rooftop` (adapt the spots to the final world coordinates, and use the slice positions rather than the fixture). Open every PNG with the Read tool and fix visible defects: floating objects, objects inside walls, flat or missing textures, black rooms, z-fighting. Best effort, never fails; list what you fixed.
- Write `docs/review/slice-review.md` for the person: what to open (`npm run dev`, then the URL), the 11 screenshot paths under `docs/shots/031/`, the controls to try (E, V, T, O), what is intentionally not done yet (the other 13 buildings are still v1, the terrain is v1 size, no NPCs, weather or new audio), the known weaknesses you saw, and the budget numbers from `check:budget`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/review/slice-review.md docs/shots/031/hotel-front-high.png`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/world/sliceAreas.test.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only plaza`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): MILESTONE: the runner pauses after this plan. Open `docs/review/slice-review.md` and the screenshots, walk the hotel and square with `npm run dev`, and approve the look (or tell the planner what to change) before epic 3 starts (D17). Run `/plan-replan realistic-world-overhaul` for changes.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
