# Plan 060: Seagulls, crows, forest birds, fish, crabs and butterflies

Epic E5. Estimated turns: 55.

## Goal

Living nature: seagulls circling over the harbour and beach and gliding along the shore, crows perched on roofs and lamp posts that now and then fly to another perch, small birds flitting between forest trees, schools of fish under the shallow water near the jetty, crabs scuttling on the beach, butterflies over gardens and flowers. Motion is a set of pure, deterministic functions of time and a seed, drawn with instancing. Counts follow the tier; reduced motion halves speeds. Trees, grass and waves already sway (plans 035 and 036).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4 and requirement R10, decision D8(b))
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
- `tests/unit/life/motion.test.js` first. `src/world/life/motion.js` exports pure functions `gullPose(t, seed, region)` (an orbit of radius 18 to 70 m around a centre in the region, altitude 10 to 35 m with slow altitude drift, speed 6 to 10 m/s, banking angle from curvature, a flap phase), `crowPose(t, seed, perches)` (stays on a perch for 20 to 90 s with small head turns, then flies a smooth arc of 2 to 4 s to another perch within 60 m), `birdPose(t, seed, treeSpots)` (hops and flits between tree spots in the canopy band 3 to 9 m high, 1 to 3 s legs), `fishPose(t, seed, school)` (a school of 14 fish orbiting inside an ellipse of 3 by 2 m at depth 0.3 to 1.2 m with sinusoidal tail wiggle phase; only exists where water depth is over 0.6 m), `crabPose(t, seed, home)` (sideways scuttles of 0.3 to 1.2 m in bursts, pauses 2 to 7 s, stays within 3 m of home on sand), `butterflyPose(t, seed, patch)` (a flutter path within a 6 m patch at 0.4 to 1.6 m above ground, wing flap phase at 8 Hz). All return `{ x, y, z, yaw, pitch, roll, phase }`; none uses `Math.random` or the wall clock.
- Tests: gull stays inside its radius and altitude bands for 600 simulated seconds and its speed stays within bounds (numerical derivative); crow positions are always on a perch or on an arc between two perches; birds stay inside the canopy band; fish depth within bounds; crabs never leave 3 m from home; butterflies altitude bounds; all deterministic for the same seed and different for another; no NaN.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/life/motion.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/life/motion.js`

### Step 2: Instanced rendering, placement and tiers

Deliver:
- `src/world/life/nature.js`: builds one `InstancedMesh` per kind (low-poly gull with two wing quads whose flap is a vertex-shader rotation from the phase attribute, crow, bird, fish with a tail wiggle in the vertex shader, crab with scuttle legs as a static mesh with a small bob, butterfly with two wing quads), places the regions from the town plan (gull regions: harbour, beach, jetty tip; crow perches: roof ridges and lamp posts of the town blocks (take from the placed buildings and lamp props within the area), bird spots: tree instances in the forest polygon, fish schools: harbour water near the jetty and quay with depth over 0.6 m, crab homes: beach polygon sand cells, butterfly patches: planters, gardens and the flower patches of vegetation near houses). Counts on high: 24 gulls, 10 crows, 20 forest birds, 5 fish schools, 30 crabs, 24 butterflies; scaled by `TIER_SETTINGS[tier].particleScale`; reduced motion halves the speeds; no animals inside buildings.
- Update: only entities within 120 m of the player are stepped (the rest are hidden); the per-frame CPU work stays under 1.0 ms on the high tier (assert in a unit test with 200 entities stepping 100 frames in under 120 ms in Node).
- `tests/e2e/nature.spec.js`: boot: `listObjects()` has kinds `gull`, `crow`, `bird`, `fish`, `crab`, `butterfly` with counts; the positions of the first gull differ by at least 3 m between two samples 1 s apart; every crab `y` is within 0.3 m of the ground (use `terrainHeight`); on `?quality=low` counts are 40 to 60 percent of high; with the reduced-motion setting the same gull moves less than half the distance in 1 s; zero console errors; `check:budget` still passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/nature.spec.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists src/world/life/nature.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/life/motion.test.js`
- `npx playwright test tests/e2e/nature.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
