# Plan 063: Living light: windows, signs, facades, street lights and the sky at dusk, with machine proof

Epic E5. Estimated turns: 50.

## Goal

Make dusk and night feel alive: house windows glow, shop and hotel signs light up, facade bands and lamps switch on, street lights follow the clock, interiors light as the light manager already does, the lighthouse sweeps, the sky gains a moon and stars, and the sun colour warms at golden hour. A machine proof reads the real light state through `__world` with `?time=`: lights on at night, off at noon.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 and requirement R10, assumption A11, A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/lights/lightManager.js
- src/world/kit/bake.js
- src/world/town/townBuilder.js
- src/world/kit/signTexture.js
- src/world/sky.js
- src/systems/clock.js
- src/world/weather/index.js
- src/world/buildings

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Night glow system

Deliver:
- `tests/unit/lights/nightGlow.test.js` first. `src/systems/lights/nightGlow.js`: `NightGlow` registers meshes or materials flagged `userData.nightGlow = { color, maxIntensity, group?, jitter? }` (windows of town houses and shops, sign boards, facade bands, lamp bulbs, the clock face of the clock tower, the lighthouse lantern) and sets their `emissiveIntensity` each frame from `effectiveNight` (`max(nightFactor, gloom * 0.7)`) with a per-instance random on-time offset of up to 0.12 so houses do not all switch on in the same second (seeded), turning smoothly over 3 s; windows on baked town blocks are driven by a per-block shared material with an instanced `glow` attribute (so baking keeps working); `jitter` flickers oil lamps slightly.
- Tests: intensity is 0 at noon and at least 0.8 of max at midnight; the offset spreads switch-on times over at least 6 percent of the dusk window; deterministic; unregistering removes the entry; reduced motion removes the flicker.
- Mark the glowing parts in the existing builders: `curtain` window fills of town houses, shop signboards, the hotel and tower signs, the clock faces (square tower, academy, town hall), mast lamps, lighthouse lantern. Keep each change small and covered by the tests of those builders (they must still pass).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/lights/nightGlow.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/lights/nightGlow.js`

### Step 2: Sky at dusk: moon, stars, warm sun, and the all-buildings light rule

Deliver:
- `src/world/sky.js`: a moon disc with a soft halo (opposite the sun, visible at night, brightness by `nightFactor`) and a star field (1500 points on the dome, twinkle by shader time, hidden by clouds `cloudCover`), warm orange sun tint and longer shadows between dayFraction 0.62 and 0.72 and 0.28 to 0.34 (golden hour) through the existing clock colours. Reduced motion: no twinkle.
- `tests/unit/lights/allBuildingsLights.test.js`: for all 14 landmark manifests, each room that has a window or an exterior door has at least one light with `auto: "dusk"`, and at the effective night 1 the headless light manager reports at least one `on` light group per building; every landmark `exteriorDetails` lamp count is at least 2 and registered as night glow.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/lights/allBuildingsLights.test.js`
- `npm run lint`

### Step 3: Playwright proof with ?time=

Deliver:
- `tests/e2e/living-light.spec.js`: with `?time=0.5&freeze=1` (noon): `listLights()` has no lights `on` outdoors (street lamps) and none of the lobby group is on; `lightIntensity` of every pooled light is 0; with `?time=0.75&freeze=1`: at least 8 street lamp lights `on`, the lobby group `on` after `teleport('plaza')`, and `nightGlowStats()` (new hook) reports at least 40 glowing window instances and a mean intensity over 0.6; walk to the library, enter: the main hall group is `on`; set `setTime(0.5)` live and after 5 s the groups switch off again; `?time=0.75&freeze=1&weather=rain` and `?time=0.5&freeze=1&weather=rain` both turn interior lights on (gloom rule) only for the second case at noon is the street lamp group still off; zero console errors; `check:budget` night spots pass (glow adds no draw calls).
- Shots: `npm run shots -- --spots square-night,main-street,harbour,lighthouse-road --time 0.75 --plan 063`; view and fix (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/living-light.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/lights/nightGlow.test.js tests/unit/lights/allBuildingsLights.test.js`
- `npx playwright test tests/e2e/living-light.spec.js`
- `node scripts/check-buildings.mjs --all`

Human check (goes in the report, never blocks): Walk the town at dusk (`?time=0.72&freeze=1`): is it beautiful or garish?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
