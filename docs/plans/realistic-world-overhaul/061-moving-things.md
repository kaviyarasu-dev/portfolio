# Plan 061: Boats on routes, the bus, flags, real-time clocks, ceiling fans, lighthouse beam, blinking lights

Epic E5. Estimated turns: 60.

## Goal

Everything that moves on a fixed rule: catamarans and boats bobbing on the waves, fishing boats sailing a loop out of the harbour and back, the ferry docked and swaying, the town bus driving its route and stopping at the bus stop, an auto-rickshaw loop, flags and bunting waving, every wall clock showing the real time, ceiling fans spinning, the lighthouse beam sweeping with a real spot light at night, red mast lights blinking. A generic animator registry reads the `userData.animated` metadata that props already carry.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 and requirement R10, decision D8(c))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/sets/harbour.js
- src/world/props/sets/air.js
- src/world/props/sets/decor.js
- src/world/props/sets/street.js
- src/world/water/waves.js
- src/world/town/harbour.js
- src/world/buildings/lighthouse/build.js
- src/world/buildings/broadcast/build.js
- src/systems/lights/lightManager.js
- src/world/layout/walk.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Animator registry and kinds

Deliver:
- `tests/unit/life/animators.test.js` first. `src/world/life/animators.js`: `AnimatorSet` with `register(object, meta)` (meta from `userData.animated`: `{ kind: "spin"|"bob"|"blink"|"hands"|"flag"|"swing", ... }`), `scan(root)` (registers every descendant with the metadata), `update(dtMs, playerPos, tNow)` stepping only objects within 70 m of the player (and always the lighthouse beam). Kinds: `spin` (rotation about the axis at `speed` rad/s, fans 6 rad/s and a slow globe), `bob` (meta `{ amp }`; the vertical offset is `waveHeightAt(x, z, tNow) ` at the object position with the wave phase, plus roll and pitch from the wave normal; the meta `period` is not used, the wave supplies the period), `swing` (the root of `barrier-gate`, owned by plan 048, carries `userData.swingTarget` in 0..1; meta `{ min, max, speed }` in radians: the node named `keep-boom` moves toward the angle `min + (max - min) * swingTarget` at `speed` rad/s and stops there, the ARCH 10.8 entry), `blink` (meta `{ period: 1.2, on: 0.3 }`; toggles emissive intensity between 1.2 and 0.1 on a per-object clone of the material, applied only to meshes named `keep-blink*`, the ARCH 10.8 rule; the mast lights of the broadcast building (plan 047) and the lighthouse lantern carry this name), `hands` (clock: finds children whose names start with `hand-hour` and `hand-minute` (the plain `hand-hour` and the per-floor `hand-hour-<f>` of a tower clock) and sets their rotation from the real local time: hour = (h mod 12 + m / 60 + s / 3600) * 30 degrees, minute = (m + s / 60) * 6 degrees; the hour and minute hand rotation is set as rotation.z = -angle in radians, per ARCH 10.8), `flag` (a vertex wave on the cloth plane with amplitude by an assumed wind of 0.4 to 1.0, phase from position).
- Tests: spin angle after 1 s; bob stays within `amp` plus 0.05 of the wave and follows the wave phase; blink duty cycle; `hands` at 15:15:30 gives hour hand 97.75 degrees and minute hand 93.0 degrees (and at midnight both 0); `flag` vertices stay within amplitude; `swing` reaches the angle `min + (max - min) * swingTarget` at `speed` rad/s and then stops; `scan` registers descendants of a group, not only the root; a `bob` object follows `waveHeightAt` at its own x and z (offset within `amp` plus 0.05); a fan (`fan-ceiling`) turns at 6 rad/s; the globe spins at its slow speed; objects farther than 70 m from the player (measured from the object origin, bounding box not used) are not stepped while the lighthouse beam is always stepped; reduced motion (read from the constructor option `reducedMotion`, which the gameloop passes from the quality module) slows spin and flags to 30 percent; `animators.js` does not touch `window` or `document` at import (headless rule, ARCH 10.5).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/life/animators.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/life/animators.js`

### Step 2: Routes: boats, bus, auto-rickshaw

Deliver:
- `tests/unit/life/routes.test.js` first. `src/world/life/routes.js`: `RouteFollower({ points, speed, loop, dwell: [{ at: index, ms }] })` with `update(dtMs)` returning `{ x, z, yaw, progress, dwelling }` (smooth corners with a turning radius, constant speed along the polyline, dwell at marked points). Data goes in a NEW file `src/world/life/routes.json`, NOT in `town.json` (the town.json keys are frozen by plan 032: `version radius spawn anchors areas harbour local roads plots boats`, so the plan 032 schema test and `scripts/gen-town.mjs --check` stay untouched). Each route record has the keys `id`, `points` (array of `[x, z]` in world metres), `speed` (m/s), `loop` (boolean), `dwell` (array of `{ at, ms }`, `at` is a point index). Routes: `fishing-loop` (speed 1.6 m/s; starts at the harbour mouth point read from the `harbour` record of town.json (plan 032 keys), runs straight out 120 m along the harbour axis and back, every point over water cells only; ends at the mouth), `fishing-loop-2` (same rule, second harbour side), `catamaran-drift` (speed 0.3 m/s, a 12 m radius circle with its centre at the harbour water cell nearest the jetty tip, 48 points), `bus` (speed 6 m/s, loop of the main street and ring road given as the ordered road ids of plan 034 with the polyline sampled every 2 m; the bus stop is the stop record of plan 034 and has `dwell` `{ at, ms: 8000 }`), `auto` (speed 5 m/s, a shorter street loop given the same way by road ids). The shared harbour mouth and the bus stop index are written into the record by hand, and the test in step 2 reads them back. Corner smoothing radius is 4 m for all routes. Cross-plan request: plan 034 must expose its road ids and the stop record; plan 032 must keep the `harbour` record shape.
- Tests: follower stays on the polyline within 0.5 m (corner smoothing excepted: within 1.5 m); loop wraps; dwell holds the position for the given time; every boat route point is on water (height under the waterline minus 0.5 m) and every bus and auto route point is on a road with no solid collider within 1.5 m (use the road clearance world of plan 034); the bus never passes through the square platform (the platform rectangle is read from `loadSquare()` of plan 031, with a 2 m margin); the bus dwell at its stop is 8000 ms; the auto route closes within 1 m; the catamaran circle stays in water; the ferry has no route; the vehicle record shape of `listObjects()` is checked; each test fails if its item is missing (no stub passes). The file `routes.js` does not touch `window` or `document` at import (this check moved here from step 1, where the file does not exist yet).
- Hook the followers to the objects: boats `bob` plus route, the bus and the auto drive their route as `non-solid` objects (no collider added, so no collision damage and no ragdoll). Yield rule: "ahead" means the player is within 8 m of the vehicle and inside a 30 degree cone around the vehicle heading; then the vehicle decelerates at a constant 3 m/s squared to a stop and waits; it resumes when the player is at least 8 m away or after 4 s of waiting, whichever comes first. The ferry (the ferry prop of the harbour prop set in `src/world/props/sets/harbour.js`, producer plan 038) has no route, stays docked and only bobs with its `bob` meta. The catamaran and fishing boats are the only boats with routes. Add vehicles to `listObjects()` as `{ type: "vehicle", id, x, z, heading, dwelling }` (`dwelling` is true while the bus or the auto holds at a dwell point; the hook shape is written in ARCH 10.8 by this plan as an addition, not a rename).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/life/routes.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/life/routes.js src/world/life/routes.json`

### Step 3: Lighthouse beam, blinking mast lights, wiring and Playwright

Deliver:
- Lighthouse: the `lens-fresnel` spins (`spin` 0.6 rad/s) and a `SpotLight` (distance 220, angle 0.12, penumbra 0.6) is attached to the lens and rotates with it; the spot is on only when `nightFactor` is over 0.5 (this plan uses nightFactor only; plan 062 adds its gloom term later, do not add gloom here); the spot is registered as one special light through the plan 012 LightManager outside the light pool (cross-plan request: if plan 012 has no call for an exempt special light, plan 012 must add one; this plan does not invent it); it is disabled on the `low` tier (the emissive lens still glows). Its `listObjects()` record is `{ type: "beam", id: "lighthouse-beam", x, y, z, rotationY, on }`, and `listLights()` lists it by the id `lighthouse-beam`. A faint beam cone mesh (additive, very low opacity) follows the spot at night on medium and high. The lighthouse is built by `src/world/buildings/lighthouse/build.js` (plan 037), and its lens node is named `lens-fresnel`.
- Wiring: the area loaders call `AnimatorSet.scan` on every building and prop root when it loads (one line added to each loader; the global `AnimatorSet` is created in the scene boot and updated from the gameloop with `update(dtMs, playerPos, tNow)`, and the constructor takes `{ reducedMotion }`). Flags: the cloth plane meshes named `flag-cloth*` on the town hall, academy and post office masts and the bunting strings get the `flag` kind (their builders are owned by plans 037, 043 and 047; cross-plan request to name `flag-cloth*` in those builders). `wall-clock` objects everywhere use `hands`. `fan-ceiling` objects spin always when within 70 m (the room-light gating is dropped: the room membership data is not defined by any plan). The mast lights and the lighthouse lantern get the `blink` kind on meshes named `keep-blink*`.
- `tests/e2e/moving-things.spec.js`: boot with `?time=0.75&freeze=1`: `listObjects()` reports the lighthouse beam angle changing by at least 0.3 rad between two samples with `fastForward(1.2)` between them, and a spot light exists on `high`; with `?time=0.5&freeze=1` the beam is off; the bus position changes by at least 10 m over 6 s of fake time; the bus reports `dwelling: true` at some moment within 120 s of simulated time. Use the hook `fastForward(seconds)` (new in this plan, added to worldHook.js): it advances the AnimatorSet, the RouteFollowers, the NpcManager of plan 058 (NPCs included) and the clocks by `seconds` of fake time in steps of at most 50 ms and does not change the weather; sample with `expect.poll` (ARCH 10.8 rule, no fixed waits, game time not wall time). The hotel lobby `wall-clock` hands: hook `clockTimes()` returns `[{ id, hourDeg, minuteDeg }]` for every wall clock; the e2e reads the lobby clock by its object id from the manifest of plan 040 and checks that its hands match the real local time: the test computes the expected hour and minute angles from `new Date()` and the hands must agree within one minute; game time and `fastForward` do not move the hands. A ceiling fan rotation differs between two samples; zero console errors. The budget check is `npm run check:budget` in the acceptance list, and it passes with the new animated objects counted as the existing draw calls (no new budget spot).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx playwright test tests/e2e/moving-things.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/life/animators.test.js tests/unit/life/routes.test.js tests/unit/layout/townPlan.test.js`
- `npx playwright test tests/e2e/moving-things.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): Watch the harbour, the bus stop and the lighthouse at dusk: do the boats, the bus and the beam move believably, and do the wall clocks show the real time?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
