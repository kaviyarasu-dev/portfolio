# Plan 062: Weather: clouds, mist, rain and wet ground, seeded and forceable with ?weather=

Epic E5. Estimated turns: 60.

## Goal

A believable sky and weather: layered drifting clouds, morning mist, occasional rain with streaks and splashes, wet ground and darker, softer light. The weather follows a seeded schedule (same seed, same weather) and `?weather=clear|cloudy|mist|rain` forces a state. Rain is rare (a few minutes in an hour of play). Effects scale with the tier.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4 (URL params), 10.5 and 10.8 (hooks), requirement R10 (in _planning/requirements.md), decision D8, assumption A19)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/sky.js
- src/systems/clock.js
- src/util/urlParams.js
- src/engine/scene.js
- src/world/terrain/terrainMesh.js
- src/world/roads/roads.js
- src/systems/lights/lightManager.js
- src/engine/quality.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Weather model (pure)

Deliver:
- `tests/unit/weather/model.test.js` first. `src/world/weather/model.js`: `weatherAt(tSeconds, seed, { forced })` takes GAME seconds (the v1 clock of plan 012: a day is 600 s, so `dayFraction = (t / 600) mod 1`) and is pure (no prior state is read). It returns `{ type, cloudCover (0..1), mist (0..1), rain (0..1), wetness (0..1), gloom (0..1), windSpeed (m/s), sunFactor, fogFactor }`. The schedule is built from seeded 60 s segments drawn with the rng of `src/util/rng.js`: clear most of the time; cloudy in about 15 percent of segments; mist only when dayFraction is 0.2 to 0.32, with a 25 percent chance per day (drawn from the seed and the day index); rain episodes of 90 to 240 s, one episode placed in each 20 minute window with probability 0.36 (about 5 percent of time overall). Each change of type is a 20 s smoothstep ramp; during a ramp `type` is the type of the segment that is more than half reached. `wetness` rises with rain and decays with a 180 s e-folding time (so it is at 0.37 of its peak after 180 s of dry weather). Formulas: `gloom = max(cloudCover * 0.6, rain * 0.9)`; `sunFactor = 1 - 0.55 * cloudCover - 0.4 * rain` (clear 1.0, rain at most 0.45); `fogFactor = mist`; `windSpeed = 2 + 8 * rain + 2 * cloudCover`. `forced` pins the type: a forced window blends from the schedule into the forced type over 3 s, computed from the schedule and the forced type only. Weather is a function of game time, so under `?freeze=1` (which stops the game clock) the weather stops too.
- Tests: determinism; continuity on the schedule (forced windows excluded), sampled every 0.1 s: the change per second is at most 0.1 for `cloudCover`, `mist`, `rain`, `gloom`, `sunFactor` and `fogFactor` (the 20 s smoothstep peaks at 0.075 per second), at most 0.05 for `wetness` (it rises toward `rain` with a 60 s time constant), and at most 1.0 m/s per second for `windSpeed`; the 3 s blend of a forced window (smoothstep peak 0.5 per second) is tested separately with a limit of 0.55 per second on the same 0..1 fields; bounds 0..1 and windSpeed 0..12; rain share of 24 simulated hours between 3 and 12 percent for each seed in the list 1, 2, 3, 4, 5; episode length 90 to 240 s; mist only inside dayFraction 0.2 to 0.32; cloudy share near 15 percent; forced types with the 3 s blend; wetness lags rain and reads 0.37 of peak 180 s after rain stops (tolerance 0.02); `sunFactor` 1.0 when clear and at most 0.45 in rain; `fogFactor` higher in mist than in clear.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/weather/model.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/weather/model.js`

### Step 2: 2a: cloud dome, rain streaks, splash rings and the weather index

Deliver:
- `src/world/weather/clouds.js`: a cloud dome, a sphere of radius 800 m centred on the camera with 32 by 16 segments, drawn with a `ShaderMaterial` (transparent, depthWrite false, no texture file). The fragment shader sums two octaves of scrolling 3D value noise (octave 2 at 2.1 times the frequency and 0.5 times the amplitude, scroll 0.6 m/s along the wind); alpha = smoothstep(0.45, 0.75, noise - (1 - cloudCover)) times the horizon fade smoothstep(0.0, 0.2, dir.y). Colour = mix(sky colour, sun colour, 0.3 * max(0, dot(dir, sunDir))) * (1 - 0.6 * gloom). The v1 sky gradient in `src/world/sky.js` (plan 002) stays beneath it. `src/world/weather/rain.js`: an `InstancedMesh` of thin streak quads (0.02 m wide, 0.6 m long, white at alpha 0.35) inside a 30 m box that follows the PLAYER (not the camera); fall speed 14 m/s, horizontal slant = windSpeed / 14 per metre fallen; positions wrap with modulo inside the box so no streak leaves it. Counts come from a local table in rain.js (3000 high, 1500 medium, 600 low), keyed by the quality tier that plan 011 exposes (the tier key is read from the quality module; do NOT add a TIER_SETTINGS key, same rule as plan 033). Reduced motion: rain count 0, and the scene tint uniform (not a DOM overlay) darkens the scene by 15 percent in rain. Splash rings: 120 ring quads, radius growing from 0.05 to 0.3 m over 0.4 s, placed on the ground (height from `terrainHeight`) only within 12 m of the player, reused in a ring buffer.
- `src/world/weather/index.js` (2a part) ties the model and the 2a renderers together: `updateWeather(dtMs)` advances the model with the game clock (frozen under `?freeze=1`; the dt is clamped to 50 ms like the game loop); `getWeatherState()` returns `{ type, cloudCover, rain, wetness, gloom, windSpeed, sunFactor, fogFactor, rainStreaks }` (`cloudCover` and `rain` are read by plans 063 and 065) where `rainStreaks` is the live streak count; `setWeather(type)` replaces the plan 003 no-op stub with a real forced type (`clear|cloudy|mist|rain`), also used by `?weather=` (URL params from `src/util/urlParams.js`). The hooks `weatherState()`, `sunIntensity()` and `setWeather(type)` are added to `src/dev/worldHook.js` by this plan (ARCH 10.8 additions, nothing renamed). The gameloop calls `updateWeather` once per frame. Wetness, light and events are in step 2b.
- `tests/unit/weather/render.test.js` (2a part, real vitest assertions, no `assert.mjs exists` stubs): rain streak count by tier (3000, 1500, 600); every streak stays inside the 30 m box after 600 frames of 1/60 s; the box centre equals the player position after a move of 10 m; splash rings are present within 12 m of the player and absent beyond; cloud dome uniforms (`cloudCover`, `gloom`, sun direction) change when the model changes; reduced motion gives rain count 0 and the tint uniform; in Node nothing touches `window` or `document` (the module imports are checked).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/weather/render.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/weather/clouds.js src/world/weather/rain.js src/world/weather/index.js`

### Step 3: 2b: ground wetness, light, mist fog, the setNight rule and the rain event

Deliver:
- `src/world/weather/index.js` (2b part) and the materials: a single shared `uWet` uniform is created once in the weather module and injected by `onBeforeCompile` into the REAL materials, not only this plan's own objects: the terrain splat material (plan 028 and 033), the road material (plan 034), the paving material of the square (plan 031 and 034) and the roof tile material from `getMaterial` (plan 037 and 041; `getMaterial` returns the shared patched material per key, so the uniform is shared). Injection happens at material creation through one registry function `applyWetness(material)` that sets `material.userData.wetPatched = true` and skips a material already patched (no double patching). Magnitudes at wetness 1: colour multiplied by 0.75, roughness reduced by 0.35 (clamped at 0). Light: `sunFactor` scales the sun light intensity (`game.sun` from the LightManager of plan 012) and the hemisphere light by the same factor (`game.hemi`); the bloom threshold is lowered by 0.05 at rain (plan 012 bloom). Mist: fog density and colour blend toward the mist colour by `fogFactor` (0.6 at most). `setNight` input of the LightManager (plan 012) is `max(nightFactor, gloom * 0.7)`, computed inline in `index.js`. This is the formula of `effectiveNight(nightFactor, gloom)` that plan 063 creates later in `src/systems/lights/nightGlow.js`; 062 runs first, so it does not import that module, and plan 063 switches this line to the import. Event: when the type changes to `rain` the module emits `weather:rain` once through `src/systems/events.js` (plan 012 owns the bus; cross-plan request), payload `{ type: "rain", wetness, intensity }`, intensity = rain value. Weather time uses the game clock and freezes under `?freeze=1`.
- `tests/unit/weather/wetness.test.js` (new file, 2b): `uWet` follows the model wetness; the real terrain, road, paving and roof materials report `userData.wetPatched` after creation and their shader contains the `uWet` uniform; `getMaterial` returns one shared patched material per key; `applyWetness` twice does not patch twice; `setNight` receives `max(nightFactor, gloom * 0.7)` (exact value); the event `weather:rain` is emitted exactly once on the transition to rain and not again while raining; `sunIntensity()` equals the base sun intensity times `sunFactor` (exact); reduced motion does not change the wetness path.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/weather/wetness.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/weather/index.js`

### Step 4: Playwright and a look

Deliver:
- `tests/e2e/weather.spec.js` (every `?time=` URL also carries `&freeze=1`, every quality pinned in the URL): `?weather=rain&time=0.4&freeze=1&quality=low`: `weatherState().type` is `rain`, `listObjects()` has a `rain` object with 600 streaks (the low count); the same URL with `quality=high` has 3000; `rendererInfo().calls` stays within the budget; the canvas is not blank (the sample pixel rule of plans 002 and 005); zero console errors; `?weather=clear&time=0.4&freeze=1`: no rain object; `?weather=mist&time=0.25&freeze=1`: `weatherState().fogFactor` over 0.5; `?weather=rain&time=0.4&freeze=1` gives `sunIntensity()` at most 45 percent of the value of the same time with `?weather=clear` (both read from the hook, so the scaling of 2b is proven); `setWeather('clear')` at runtime removes the rain: poll with `expect.poll` (no fixed wait) until the rain object is gone, within 4 s of game time; the schedule is checked through the hook `weatherAt(tSeconds)` (added to worldHook.js in this plan, returns the model state at that game time): with the same `?seed=` two page loads give equal `weatherAt(600)`. Hooks used: `weatherState`, `sunIntensity`, `setWeather`, `weatherAt`, `listObjects`, `rendererInfo`.
- Budget: append one spot `weather-rain` to `src/budgets.json` in the plan 014 spot shape with no `weather` field (its view is the square-day view and its URL carries `?weather=rain&time=0.4&freeze=1`, so the rain state comes from the URL) (plan 014 rule: append only, limits are never raised). The new draw calls are the cloud dome (1), the rain streaks (1) and the splash rings (1); they must fit the existing square-day limit with the shared budget. If they do not fit, the splash rings are merged into the rain InstancedMesh as a second instance group, which keeps one draw call per kind. `npm run check:budget` is in acceptance.
- Shots (best effort, not a pass gate): `npm run shots -- --spots square-day --weather rain --plan 062`, then `--weather mist` and `--weather cloudy`; the PNGs go to `docs/shots/062/` (allowed by this plan). View the three PNGs with the Read tool and fix only the defects visible in them (for example rain too bright, mist hiding the square); list each fix in the report.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx playwright test tests/e2e/weather.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/weather/model.test.js tests/unit/weather/render.test.js tests/unit/weather/wetness.test.js`
- `npx playwright test tests/e2e/weather.spec.js`
- `npm run check:budget`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
