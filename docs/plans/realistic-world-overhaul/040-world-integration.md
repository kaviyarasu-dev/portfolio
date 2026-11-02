# Plan 040: World integration: areas, minimap, fog, tour of every area, budgets, review pack

Epic E3. Estimated turns: 50.

## Goal

Close epic 3: all areas stream in the right order for the bigger world, the minimap shows the real island (roads, water, labels), fog and view distance suit 300 m, every area passes the budget, a tour test teleports to every area and checks the player stands on the ground and nothing errors, and a review pack for the person is written. Fast travel keeps the whole island reachable in time (walk time already tested in plan 032).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 10.4 and requirement R9, decision D14, A13)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/engine/streaming.js
- src/world/areas
- src/ui/minimap.js
- src/world/sky.js
- src/systems/clock.js
- src/budgets.json
- src/shots.json
- src/world/layout/town.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Area table, priorities and tier rules

Deliver:
- `tests/unit/world/areas.test.js` first. `src/world/areas/index.js` exports `createAllAreas(game, town)` returning the final table: `centre` (100), `hotel` (100), `town-<block>` (80 near the square, 40 elsewhere), `harbour` (60), `beach` (40), `west-gate` (50), `forest` (30), `hill-and-outskirts` (20), `v1-world` (the 13 remaining v1 landmarks, 50, until epic 4 replaces them). Every area has `loadRadius < unloadRadius`, a centre inside the island and a unique id. Phone tier (`low`): vegetation and town block areas use `TIER_SETTINGS.low.viewDistance` for their load radii.
- Tests: ids unique; sorted order of `priority` then distance from the spawn puts `centre`, `hotel` first; all areas together cover every anchor, plot, boat and vegetation chunk (each plot belongs to exactly one block area); low-tier radii are smaller.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/areas.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/areas/index.js`

### Step 2: Minimap, fog and view distance

Deliver:
- `src/ui/minimap.js`: draw the island from the data: sea colour, land polygon (the heightfield sampled on a coarse 6 m grid cached once into an offscreen canvas, land vs shallows vs sea), roads by class (width and colour), the harbour, the player arrow, and a letter or small icon per landmark with the zone display name on hover or in the legend; a larger map is plan 068. `tests/unit/ui/minimapData.test.js`: the pure function `buildMinimapLayers(town, heightField)` returns road polylines, landmark list of 14, and a land mask of the expected size (a function so the canvas drawing stays thin).
- Fog and sky: fog density scales with `viewDistance` of the tier; the sun shadow frustum follows the player (already) with size from the tier; far scenery fades into fog, nothing pops closer than 150 m (check by teleport tests only).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/minimapData.test.js`
- `node "{{runner}}/assert.mjs" exists src/ui/minimap.js`

### Step 3: World tour test, budgets and the review pack

Deliver:
- `tests/e2e/world-tour.spec.js`: for each of these spots (hotel lobby, square, main street, harbour quay, jetty end, beach, forest edge, hill top near the broadcast anchor, west gate, lighthouse anchor, farmland): `teleport`, wait 1.5 s, assert the ground rule (`playerState().y` within 0.15 m of the standing surface), `rendererInfo().calls` under the budget, no console errors during the whole tour, and `streamState()` has no area in state `failed`. Time between spots is under 20 s each.
- Auto-walk for tests (journeys 3, 4 and 7 need long walks): `src/dev/autoWalk.js` and the hook `walkTo(x, z, { sprint = true, timeoutMs = 90000 })` returning a promise that resolves `{ arrived, blocked, x, z }`. It plans a route with the road graph of `src/world/layout/walk.js` (nearest road point to start, shortest road path, nearest road point to target) and steers the player by feeding the same movement input the controller reads (so collision and doors behave as for a person), turning toward the next waypoint; it stops when within 1.5 m of the target, when blocked for 3 s, or on timeout. `tests/unit/dev/autoWalk.test.js` tests the pure steering function (`steerToward(pos, target, yaw)` gives forward and turn values; waypoint advance); `tests/e2e/auto-walk.spec.js`: from the harbour quay `walkTo` the square resolves `arrived: true` in under 90 s of test time.
- Add the budget spots `main-street`, `harbour`, `beach`, `forest`, `west-gate`, `lighthouse-road` to `src/budgets.json` (if missing) and run `npm run check:budget`: both profiles pass. If a spot is over budget find the cause with `rendererInfo()` and fix (merge more, instancing, shorter distances, hide far interiors); never raise a limit.
- Write `docs/review/town-review.md` (what to look at, the screenshot list under `docs/shots/040/`, known gaps: 13 landmarks are still v1 boxes, no NPCs, weather or new audio) and produce the shots for 12 spots day and 4 at night with `npm run shots --plan 040`; view them and fix visible defects (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/world-tour.spec.js`
- `npx playwright test tests/e2e/auto-walk.spec.js`
- `npx vitest run tests/unit/dev/autoWalk.test.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/review/town-review.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/world/areas.test.js tests/unit/ui/minimapData.test.js`
- `npx playwright test tests/e2e/world-tour.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Milestone of epic 3: walk the town, harbour, beach and forest and tell the planner what to change before epic 4.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
