# Plan 061: Boats on routes, the bus, flags, real-time clocks, ceiling fans, lighthouse beam, blinking lights

Epic E5. Estimated turns: 55.

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
- `tests/unit/life/animators.test.js` first. `src/world/life/animators.js`: `AnimatorSet` with `register(object, meta)` (meta from `userData.animated`: `{ kind: "spin"|"bob"|"blink"|"hands"|"flag"|"swing", ... }`), `scan(root)` (registers every descendant with the metadata), `update(dtMs, playerPos, tNow)` stepping only objects within 70 m of the player (and always the lighthouse beam). Kinds: `spin` (rotation about the axis at `speed` rad/s, fans 6 rad/s and a slow globe), `bob` (`waveHeightAt` plus roll and pitch from the wave normal, amplitude `amp`), `blink` (period 1.2 s, 0.3 s on, emissive intensity toggle), `hands` (clock: finds children `hand-hour` and `hand-minute` and sets their rotation from the real local time: hour = (h mod 12 + m / 60) * 30 degrees, minute = (m + s / 60) * 6 degrees), `flag` (a vertex wave on the cloth plane with amplitude by an assumed wind of 0.4 to 1.0, phase from position).
- Tests: spin angle after 1 s; bob stays within `amp` plus 0.05 of the wave and follows the wave phase; blink duty cycle; `hands` at 15:15:30 gives hour hand 97.75 degrees and minute hand 91.0 degrees (and at midnight both 0); `flag` vertices stay within amplitude; objects farther than 70 m are not stepped; reduced motion slows spin and flags to 30 percent.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/life/animators.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/life/animators.js`

### Step 2: Routes: boats, bus, auto-rickshaw

Deliver:
- `tests/unit/life/routes.test.js` first. `src/world/life/routes.js`: `RouteFollower({ points, speed, loop, dwell: [{ at: index, ms }] })` with `update(dtMs)` returning `{ x, z, yaw, progress, dwelling }` (smooth corners with a turning radius, constant speed along the polyline, dwell at marked points). Data in `town.json` `routes`: `fishing-loop` (a fishing boat sails from the harbour mouth out 120 m to sea and back, 1.6 m/s, over water cells only), `fishing-loop-2`, `catamaran-drift` (a slow 12 m circle, 0.3 m/s), `bus` (a loop along the main street and ring road passing the bus stop with a dwell of 8 s there; speed 6 m/s), `auto` (a shorter street loop, 5 m/s). Regenerate `town.json` with `scripts/gen-town.mjs` or edit by hand and cover it in the test.
- Tests: follower stays on the polyline within 0.5 m (corner smoothing excepted: within 1.5 m); loop wraps; dwell holds the position for the given time; every boat route point is on water (height under the waterline minus 0.5 m) and every bus and auto route point is on a road with no solid collider within 1.5 m (use the road clearance world of plan 034); the bus never passes through the square platform.
- Hook the followers to the objects: boats `bob` plus route, the bus and the auto drive their route as `non-solid` objects: when the player is within 8 m ahead on the road the vehicle slows to a stop and waits (no collision damage, no ragdoll), then continues; the ferry stays docked and only bobs. Add them to `listObjects()` as `{ type: "vehicle", id, x, z }`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/life/routes.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/life/routes.js`

### Step 3: Lighthouse beam, blinking mast lights, wiring and Playwright

Deliver:
- Lighthouse: the `lens-fresnel` spins (`spin` 0.6 rad/s) and a `SpotLight` (distance 220, angle 0.12, penumbra 0.6) is attached to the lens and rotates with it; the spot is on only when `nightFactor` is over 0.5 or the weather gloom is high; it is a pool-exempt light (one special light) and is disabled on the `low` tier (the emissive lens still glows). A faint beam cone mesh (additive, very low opacity) follows the spot at night on medium and high.
- Wiring: scan every building and prop root with `AnimatorSet.scan` when it loads; flags on the town hall, academy and post office masts, bunting strings get the `flag` kind; `wall-clock` objects everywhere use `hands`; `fan-ceiling` objects spin only when the room light group is on or the player is in the room (fans in empty dark rooms may stay still); the mast `blink` lights.
- `tests/e2e/moving-things.spec.js`: boot with `?time=0.75&freeze=1`: `listObjects()` reports the lighthouse beam angle changing by at least 0.3 rad between two samples 1.2 s apart and a spot light exists on `high`; with `?time=0.5&freeze=1` the beam is off; the bus position changes by at least 10 m over 6 s and it dwells at the stop at some moment within 90 s of simulated time (use `setTime` is not enough: sample positions for up to 120 s with the hook `fastForward(seconds)` that advances the animators and routes by fake time, add it to the hook); the hotel lobby `wall-clock` hands equal the system time within one minute (hook `clockTimes()` returns each clock hands in degrees); a ceiling fan rotation differs between two samples; zero console errors; `check:budget` passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
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

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
