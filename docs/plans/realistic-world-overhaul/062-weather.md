# Plan 062: Weather: clouds, mist, rain and wet ground, seeded and forceable with ?weather=

Epic E5. Estimated turns: 55.

## Goal

A believable sky and weather: layered drifting clouds, morning mist, occasional rain with streaks and splashes, wet ground and darker, softer light. The weather follows a seeded schedule (same seed, same weather) and `?weather=clear|cloudy|mist|rain` forces a state. Rain is rare (a few minutes in an hour of play). Effects scale with the tier.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4 (URL params) and requirement R10, decision D8(d), assumption A19)
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
- `tests/unit/weather/model.test.js` first. `src/world/weather/model.js`: `weatherAt(tSeconds, seed, { forced })` returns a continuous state `{ type, cloudCover (0..1), mist (0..1), rain (0..1), wetness (0..1), gloom (0..1), windSpeed, sunFactor, fogFactor }`. The schedule is built from seeded segments: clear most of the time, cloudy 15 percent, mist only in the early morning (dayFraction 0.2 to 0.32) with 25 percent chance, rain episodes of 90 to 240 s about 5 percent of the time in total, with 20 s smooth ramps; `wetness` rises with rain and dries over 180 s. `forced` pins the type with 3 s blends. Over 24 simulated hours of game time rain covers 3 to 12 percent of the time.
- Tests: determinism; continuity (no jump of more than 0.05 per second in any field); bounds 0..1; rain total fraction; forced types; wetness lags rain; `sunFactor` lower with cloud cover (clear 1.0, rain at most 0.45); `fogFactor` higher in mist.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/weather/model.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/weather/model.js`

### Step 2: Clouds, mist, rain rendering and ground wetness

Deliver:
- `src/world/weather/clouds.js`: a cloud layer dome with a procedural noise shader (two octaves of scrolling 3D value noise, no texture file) whose coverage and darkness follow `cloudCover` and `gloom`, tinted by the sky colour and the sun direction, fading at the horizon; the existing v1 sky gradient stays beneath. `src/world/weather/rain.js`: an `InstancedMesh` of thin streak quads in a 30 m box around the camera (3000 on high, 1500 medium, 600 low, none when reduced motion is on and then a darker grey overlay only), falling at 14 m/s with wind slant, wrapping inside the box; splash rings: 120 small expanding ring quads near the ground within 12 m; the box follows the player. Mist: fog density and colour blend from `fogFactor`. Wetness: a shared uniform `uWet` used by the terrain, road and paving materials through `onBeforeCompile` (colour 25 percent darker, roughness down by 0.35 at wetness 1) and by `getMaterial` for roof tiles and paving; light: `sunFactor` scales the sun, the hemisphere and the bloom threshold lowers slightly.
- `src/world/weather/index.js` ties it together: `updateWeather(dtMs)` advances the model with the game clock; `setWeather(type)` for the hook and `?weather=`; `getWeatherState()`; the `LightManager` `setNight` input uses `max(nightFactor, gloom * 0.7)` so interior lights come on in heavy rain; it emits the event `weather:rain` with the intensity for the audio plan 065.
- `tests/unit/weather/render.test.js`: rain streak count by tier; box wraps (no streak leaves the box); `uWet` follows the model; cloud material uniforms update; in Node nothing touches the DOM.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/weather/render.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/weather/clouds.js src/world/weather/rain.js src/world/weather/index.js`

### Step 3: Playwright and a look

Deliver:
- `tests/e2e/weather.spec.js`: `?weather=rain&time=0.4`: `weatherState().type` is `rain`, `listObjects()` has a `rain` object with at least 500 streaks on `?quality=low` and more on high, `rendererInfo().calls` stays within the budget, canvas renders, zero console errors; `?weather=clear`: no rain object; `?weather=mist&time=0.25`: fog factor over 0.5; `?weather=rain` darkens: the sun intensity (hook `sunIntensity()`) is at most 45 percent of the `clear` value at the same time; `setWeather('clear')` at runtime removes the rain within 4 s; with the same `?seed` the schedule at time 600 s is equal in two page loads.
- Shots: `npm run shots -- --spots square-day --weather rain --plan 062` and `--weather mist`, `--weather cloudy`; view and fix (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/weather.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/weather/model.test.js tests/unit/weather/render.test.js`
- `npx playwright test tests/e2e/weather.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
