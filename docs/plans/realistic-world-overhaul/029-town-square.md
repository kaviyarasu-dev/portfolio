# Plan 029: Town square in front of the hotel: paving, banyan platform, clock tower, street furniture

Epic E2. Estimated turns: 55.

## Goal

Build the public square the visitor sees on leaving the hotel, in a South Indian town style: a paved square with kerbs, a large banyan-style tree on a round stone platform, a clock tower with a working clock face, street lamps that switch on at dusk, benches, bins, planters, direction signposts in English and Tamil and a bus-stop shelter bench. Positions come from a data file so plan 032 can move it. Collision, lights and walkability are real.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3 (town plan), 10.4 and decision D21, D25(b))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props.js
- src/world/terrain/height.js
- src/world/props/sets/lamps.js
- src/world/props/sets/outdoorSeating.js
- src/world/kit/exterior.js
- src/content/signage.js
- src/systems/lights/lightManager.js
- src/world/zones.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Slice layout data and the square plan

Deliver:
- `src/world/layout/slice.json`: provisional world placement used until plan 032: `{ "hotel": { "x": 0, "z": -14, "rot": 0 }, "square": { "cx": 0, "cz": 20, "w": 56, "d": 44, "y": 0.15 } }` and a list of `furniture` entries `{ "type", "x", "z", "rot" }` for benches, lamps, bins, planters, signposts (the data lives in the file, not in code).
- `tests/unit/layout/square.test.js` first. `src/world/layout/square.js` exports `loadSquare()` and `checkSquare(plan, { collision })`: furniture stays inside the square rectangle (at least 0.8 m from its edge); no two solid items overlap; at least 3.0 m of clear walkway between the hotel door (at `hotel.z + 10` on the south side) and the platform; every furniture item is reachable by the walk graph from the hotel door; at least 8 street lamps spaced 6 to 14 m apart; at least 6 benches; at least 4 bins; at least 4 planters; at least 2 signposts.
- Author the furniture list with these counts and sensible spacing: lamps along the long edges and around the platform, benches facing the platform, signposts at the road entrances (west, east, south).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/layout/square.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/layout/slice.json src/world/layout/square.js`

### Step 2: Landmark builders: paving, banyan platform, clock tower

Deliver:
- `tests/unit/world/squareLandmarks.test.js` first. `src/world/town/square.js` exports `buildSquare(plan, ctx)` returning `{ root, colliders, lights, update(dtMs) }`: paved ground (`stonePaving` with a border band of `brick`, 0.15 m above terrain with a 0.2 m kerb and drop kerbs at the road gaps) laid with a darker grid pattern; `buildBanyan()` (a spreading tree: thick buttress trunk, 14 aerial prop roots as thin tapered cylinders, 5 large canopy blobs made of 600 leaf quads in total, instanced; round platform of cut stone 6 m wide with two steps and a low wall; a small stone lamp stand on the platform without any idol); `buildClockTower()` (square base with arched openings, 9 m tower, a belfry roof with a small dome, four clock faces; the hour and minute hands are separate nodes rotated from the real local time each second; the clock face material is emissive after dusk).
- Street furniture from the catalog (`lamp-street` registered with the light manager, `bench-park`, `bin`-like `trash-bin-small` placed as `binOutside` from the exterior kit, `planter-brick`, `sign-board` posts with Tamil and English text from `signage.js`, a bus-stop shelter using `bench-bus-stop` with a roof). Colliders: the platform (circle), the tower base (box), each lamp post (circle 0.2), benches (boxes), planters. Lamps are `auto: "dusk"` with warm colour.
- Tests: `buildSquare` in Node returns the root with the expected meshes; the clock hands rotate for a fake date (3:00 gives the hour hand 90 degrees from 12 and the minute hand at 12); every furniture type exists in the catalog; collider count matches the solid items; light count equals the lamps; frame mesh count after merging under 40 (draw calls).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/world/squareLandmarks.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/town/square.js`

### Step 3: Integrate into the world, Playwright and shots

Deliver:
- In `src/main.js` build the square after the terrain (inside the v1 world loading step for now; plan 031 moves it into a streamed area): flatten the terrain under the square and hotel footprint with `flatAreas` from `slice.json`, add the square colliders to `game.collision`, register the lamp lights. Remove v1 trees, rocks and grass that fall inside the square rectangle (the v1 props scatter checks a list of exclusion rectangles: add the square and the hotel footprint plus 3 m).
- `tests/e2e/square.spec.js`: boot with `?time=0.75&freeze=1`: `listLights()` has at least 8 lamp lights on; the player cannot walk through the platform (teleport 6 m west of the platform centre, hold `d` toward it for 3 s: distance to the centre stays at least 3 m minus 0.5 m for the wall); the clock tower hands exist (`listObjects()` includes `clock-tower`); zero console errors; `check:budget` spot `square` (add it) passes.
- Shots: spots `square-day` (time 0.4) and `square-night` (time 0.75) in `src/shots.json`; `npm run shots -- --spots square-day,square-night --plan 029`; view and fix (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/square.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/layout/square.test.js tests/unit/world/squareLandmarks.test.js`
- `npx playwright test tests/e2e/square.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

Human check (goes in the report, never blocks): Judge the square: does it feel like a real town centre? Tamil signposts need a reader.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
