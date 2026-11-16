# Plan 060: Seagulls, crows, forest birds, fish, crabs and butterflies

Epic E5. Estimated turns: 60.

## Goal

Living nature: seagulls circling over the harbour and beach and gliding along the shore, crows perched on roofs and lamp posts that now and then fly to another perch, small birds flitting between forest trees, schools of fish under the shallow water near the jetty, crabs scuttling on the beach, butterflies over gardens and flowers. Motion is a set of pure, deterministic functions of time and a seed, drawn with instancing. Counts follow the tier; reduced motion halves speeds. Trees, grass and waves already sway (plans 035 and 036).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 and 10.8 (hooks), requirement R10 (in _planning/requirements.md), decision D8)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/vegetation/render.js
- src/world/water/waves.js
- src/world/layout/town.json
- src/world/terrain/townHeight.js
- src/engine/quality.js
- src/util/rng.js
- src/systems/clock.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Pure motion models

Deliver:
- `tests/unit/life/motion.test.js` first. `src/world/life/motion.js` exports pure functions `gullPose(t, seed, region)` (an orbit of radius R = 18 to 70 m around a centre C in the region, angular rate chosen so the speed is v = 6 to 10 m/s, altitude 10 + 12.5 * (1 + sin(2 pi t / 240 + seed phase)) m, so 10 to 35 m; bank = atan(v * v / (R * 9.81)) with the sign of the turn, roll = bank; yaw = heading of the velocity; flap phase = 2 pi * 4 Hz * t + seed phase; region is `{ cx, cz, radius }` in metres, centre C is the region centre and the orbit is clipped to the region), `crowPose(t, seed, perches)` (stays on a perch for 20 to 90 s with small head turns, then flies a smooth arc of 2 to 4 s to another perch within 60 m), `birdPose(t, seed, treeSpots)` (hops and flits between tree spots in the canopy band 3 to 9 m high, 1 to 3 s legs), `fishPose(t, seed, school)` (a school of 14 fish orbiting inside an ellipse of 3 by 2 m at depth 0.3 to 1.2 m with sinusoidal tail wiggle phase; only exists where water depth is over 0.6 m), `crabPose(t, seed, home)` (sideways scuttles of 0.3 to 1.2 m in bursts, pauses 2 to 7 s, stays within 3 m of home on sand), `butterflyPose(t, seed, patch)` (a flutter path within a 6 m patch at 0.4 to 1.6 m above ground, wing flap phase at 8 Hz). Input shapes: `region` = `{ cx, cz, radius }`; `perches` = array of `{ x, y, z }` (roof ridge points and lamp heads); `treeSpots` = array of `{ x, y, z }` in the canopy band of the forest polygon; `school` = `{ cx, cz, y, rx: 1.5, rz: 1.0 }` (rx and rz are the ellipse half-axes in metres, so each school orbits inside a 3 by 2 m ellipse); `home` = `{ x, z }` on sand; `patch` = `{ cx, cz, radius: 3 }` (a 6 m diameter). Seeds are integers, and each function derives its own rng from `seed` with `src/util/rng.js`. All return `{ x, y, z, yaw, pitch, roll, phase }`; none uses `Math.random`, `Date.now`, `performance.now` or the wall clock (the test scans the file text for these names).
- Tests (`tests/unit/life/motion.test.js`, real assertions): gull stays inside its radius and altitude bands for 600 simulated seconds at 1/30 s steps, and its speed by a numerical derivative (central difference, 0.05 m/s tolerance) stays in 6 to 10 m/s; crow positions are on a perch (distance under 0.05 m) or on an arc between two perches whose length is 2 to 4 s of flight; crow head turns stay within 25 degrees; birds stay inside the canopy band of 3 to 9 m and hop legs last 1 to 3 s; fish stay on the school ellipse at depth 0.3 to 1.2 m, and a school has 14 fish; the tail wiggle phase is within 0 to 2 pi; crabs make bursts of 0.3 to 1.2 m with pauses of 2 to 7 s and never leave 3 m from home; butterfly altitude 0.4 to 1.6 m and the wing flap is 8 Hz (the test measures the phase rate); all deterministic for the same seed and different for another seed; no NaN for 10 seeds; the file text does not contain `Math.random`, `Date.now`, `performance.now`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/life/motion.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/life/motion.js`

### Step 2: Instanced rendering, placement and tiers

Deliver:
- `src/world/life/nature.js`: builds one `InstancedMesh` per kind, six draw calls in all: gull (a body box with two wing quads; the flap is a vertex-shader rotation of each wing about its root by `sin(phase)` times 0.5 rad, the phase comes from a per-instance attribute `aPhase` and a `uTime` uniform, both fed each frame, the instance matrix is written every frame for visible entities), crow and bird (small body boxes with a head, static meshes), fish (a flat ellipsoid with a tail quad; the tail wiggle is a vertex-shader rotation about the body axis with the phase), crab (a flattened body box, static, no leg animation: the scuttle is translation only), butterfly (two wing quads, flap through the vertex shader). Materials are `MeshStandardMaterial` with `onBeforeCompile` for the shader parts; no texture files. Instance colours: gulls white and grey, crows black, birds brown, fish silver, crabs orange-brown, butterflies seeded from a 5-colour list. Placement sources (all read from the town plan built by plan 032 and the placed props of plans 029 and 037, cross-plan requests where a field is not yet defined): gull regions = `{ cx, cz, radius }` centres for the harbour (harbour record of town.json), the beach (centre of the beach polygon) and the jetty tip (jetty end point); crow perches = roof ridge points of the town-block buildings (the ridge height is the roof height of the building record, plan 037) and the lamp-head points of the `lamp-street` props (plan 022, the lamp socket) inside the area; bird spots = tree instance positions inside the forest polygon of town.json, sampled at 4 m with the canopy height 3 to 9 m; fish schools = 5 school centres chosen from the harbour water cells near the jetty and quay with surface depth over 0.6 m, found by a fixed grid of 4 m; the grid must give 5 valid cells: if it gives fewer, the grid is refined to 2 m, and the test fails if there are still fewer than 5 (no fallback to 3 schools, so the e2e count of 70 fish holds); crab homes = sand cells from `surfaceAt(x, z)` (terrain type `sand`) on a 3 m grid over the beach polygon; butterfly patches = centres of the garden plots of town.json and the planter props within 40 m of houses. Counts on high: 24 gulls, 10 crows, 20 forest birds, 5 fish schools of 14 fish each (70 fish), 30 crabs, 24 butterflies. Each count is `round(high count * TIER_SETTINGS[tier].particleScale)` (round, not floor: at low scale 0.4 gulls are 10, which is 41.7 percent of 24). Reduced motion halves all speeds. No animal is placed inside a building footprint plus a 2 m margin (footprints from the town plots of plan 037).
- Update: `updateNature(dtMs, tGame, playerPos)` is called once per frame by the gameloop after the clock update; `tGame` is the game clock, so nature follows the game clock and freezes under `?freeze=1`. Only entities within 120 m of the player are stepped; the others get a zero-scale instance matrix (hidden). The per-frame CPU cost is asserted in `tests/unit/life/nature.perf.test.js` (new file, added to this step verify): 200 entities stepped 100 frames in Node, median of 5 runs, under 240 ms (a loosened Node limit, with no claim about the device). Area registration: nature is always on, not a streamed area; it is created once in the scene boot and disposed on scene teardown (dispose each InstancedMesh geometry and material). Hook: `listLife()` (new in worldHook.js, an ARCH 10.8 addition) returns `[{ kind, index, x, y, z }]` for the visible instances, ordered by kind and then index; `listObjects()` is not used for animals because the ARCH 10.8 shape `{ type, name, x, y, z }` does not cover instances. Reduced motion is read once at boot from the quality module (localStorage key `portfolio.reducedMotion`); a live change takes effect on the next frame by rescaling the speed factor (no rebuild).
- `tests/e2e/nature.spec.js` (every URL pins the tier: `?quality=high` for the high counts, `?quality=low` for the low counts; the default tier is medium on SwiftShader, so no test relies on it): with `?quality=high`, `listLife()` has kinds `gull`, `crow`, `bird`, `fish`, `crab`, `butterfly` with the counts of step 2 (fish counted as fish instances, 70); the first gull moves at least 3 m of game-time displacement over 1 s of game time, read with `expect.poll` (no fixed wait, game time from the hook, not wall time); every crab `y` is within 0.3 m of `terrainHeight(x, z)` and every crab stands on sand (`surfaceAt` is sand); with `?quality=low` each kind count is between 40 and 60 percent of the high count (the rounding rule of step 2 makes 10 of 24 gulls); with the reduced-motion setting (set in localStorage key `portfolio.reducedMotion` before boot) the same gull moves between 0.4 and 0.6 of the distance of the normal run over the same 1 s of game time (the true ratio is 0.5, so the tolerance band is 0.4 to 0.6, not "less than half"); zero console errors; `npm run check:budget` passes with the six new draw calls counted (no spot is raised).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/life/nature.perf.test.js`
- `npx playwright test tests/e2e/nature.spec.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists src/world/life/nature.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/life/motion.test.js tests/unit/life/nature.perf.test.js`
- `npx playwright test tests/e2e/nature.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): Look at the harbour, beach and forest: do the gulls, crabs and butterflies read as living things, without looking like a swarm or sliding over the ground?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
