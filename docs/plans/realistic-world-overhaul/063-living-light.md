# Plan 063: Living light: windows, signs, facades, street lights and the sky at dusk, with machine proof

Epic E5. Estimated turns: 60.

## Goal

Make dusk and night feel alive: house windows glow, shop and hotel signs light up, facade bands and lamps switch on, street lights follow the clock, interiors light as the light manager already does, the lighthouse sweeps, the sky gains a moon and stars, and the sun colour warms at golden hour. A machine proof reads the real light state through `__world` with `?time=`: lights on at night, off at noon.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 and 10.8 (hooks), requirement R10 and assumptions A11, A26 (all in _planning/requirements.md))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/lights/lightManager.js
- src/world/town/bakeStatic.js
- src/world/town/townBuilder.js
- src/world/kit/signTexture.js
- src/world/sky.js
- src/systems/clock.js
- src/world/weather/index.js
- src/world/buildings/lighthouse/build.js
- src/world/buildings/broadcast/build.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Night glow system

Deliver:
- `tests/unit/lights/nightGlow.test.js` first. `src/systems/lights/nightGlow.js` (created by this plan): `export function effectiveNight(nightFactor, gloom)` returns `Math.max(nightFactor, gloom * 0.7)`; plan 063 step 1 replaces the inline `max(nightFactor, gloom * 0.7)` in `src/world/weather/index.js` (plan 062) with the import of this function, a one-line edit in an allowed src file. `class NightGlow` with `constructor({ seed, reducedMotion })`, `register(objectOrMaterial)` reading `userData.nightGlow = { color, maxIntensity, group?, jitter? }` (group defaults to `town`), `unregister(objectOrMaterial)` removing the entry, and `update(dtSeconds, effectiveNight)` setting each entry `emissiveIntensity = maxIntensity * ramp`; the ramp is a smoothstep over a 3 s game-time turn (dtSeconds is already clamped to 0.05 by the gameloop). Per-instance on-time: a seeded threshold in [0.0, 0.12] of the night ramp, so switch-on times spread over at least 6 percent of the dusk window and do not all happen in the same second. `jitter` (oil lamps only): intensity times (1 + 0.05 * sin(2 pi * 3 Hz * t + seeded phase)); reduced motion removes the jitter. Windows on baked town blocks: the existing `<blockId>:windows` master light of plan 037 (group `town-windows`, flagged `userData.curtain = true`) keeps its role, and this plan adds a per-instance `glow` attribute on the same shared material, so baking (`src/world/town/bakeStatic.js`, plan 029) keeps working. Instantiated in the scene boot as `game.nightGlow` and updated once per frame from the gameloop.
- Tests: `effectiveNight(0, 1)` is 0.7 and `effectiveNight(0.3, 0)` is 0.3; intensity is 0 at noon and at least 0.8 of max at midnight (effectiveNight 1 after the 3 s turn); the offset spreads switch-on times over at least 6 percent of the dusk window; deterministic for the same seed and different for another; unregistering removes the entry and its material update stops; reduced motion removes the flicker and keeps the ramp; the jitter amplitude stays within 5 percent.
- Mark the glowing parts in the existing builders, one small change per builder file: `curtain` window fills of town houses (`src/world/town/townBuilder.js`, plan 037 owner); shop signboards (the shop builders, plans 037 and 044 to 051, named in each builder file); the hotel and tower signs and the clock faces of the square tower (plan 029), the academy and the town hall (their landmark plans, named in each builder); mast lamps (`src/world/buildings/broadcast/build.js`, plan 047); the lighthouse lantern (`src/world/buildings/lighthouse/build.js`, plan 037). Each marked item is listed in one table in `tests/unit/lights/nightGlow.test.js`, and that test builds each builder headlessly and requires at least one `userData.nightGlow` object per listed item (so an unmarked item fails). The builders' own tests must still pass.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/lights/nightGlow.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/lights/nightGlow.js`

### Step 2: Sky at dusk: moon, stars, warm sun, and the all-buildings light rule

Deliver:
- `src/world/sky.js` (plan 002 owner; this plan edits that file, not a `sky/` folder): a moon disc of angular radius 2.5 degrees with a halo out to 6 degrees (additive, opacity 0.35 at the edge fading to 0), placed opposite the sun on the dome, brightness = nightFactor (zero in daytime). Stars: one Points object on the dome, 1500 points at the high tier (1000 medium, 500 low), 1.5 px, drawn with a `ShaderMaterial`; twinkle = 0.7 + 0.3 * sin(2 pi * 0.5 Hz * t + the star phase); star alpha = nightFactor * (1 - cloudCover), with `cloudCover` read from `getWeatherState()` of plan 062 (the star field is hidden under full cloud). Golden hour: the sun colour lerps to #ffb36b at dayFraction 0.62 to 0.72 and 0.28 to 0.34, peaking at the middle of each window, on top of the existing clock colours of plan 012; shadow length multiplier = 1 + 1.2 * max(0, 1 - sunElevation / 0.35) with sunElevation in radians. Reduced motion: twinkle factor fixed at 1 (no twinkle). Lighthouse beam gloom term: the plan 061 spot is on when `effectiveNight(nightFactor, gloom)` is over 0.5 (061 used nightFactor only; this plan adds the gloom term to the beam).
- `tests/unit/sky/night.test.js` (new file, real assertions): star count 1500 on high, 1000 medium, 500 low; twinkle factor is exactly 1 under reduced motion; the moon direction is opposite the sun direction within 0.01 rad; star alpha is 0 at cloudCover 1; golden-hour sun colour equals #ffb36b at the middle of each window and the shadow multiplier is at least 1.5 at sunElevation 0.
- `tests/unit/lights/allBuildingsLights.test.js`: for all 14 landmark manifests (the list is read from `src/world/buildings/*/manifest.json`, and the test fails if the count is not 14), each room that has a window or an exterior door has at least one light with `auto: "dusk"`. Where a landmark room lacks one, this plan adds `auto: "dusk"` in that building manifest (`src/world/buildings/<id>/manifest.json`, allowed by src/**), and the report lists every manifest edited. The test builds the exteriors headlessly with `createHeadlessContext()` and `tier: "high"` (the helper of plan 037), and at effective night 1 the headless LightManager reports at least one `on` light group per building. Lamp count: for each landmark, the sum of `count` over the `exteriorDetails` entries with `class: "lamp"` is at least 2, and the registry size of `NightGlow` for that building is at least that sum.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/sky/night.test.js tests/unit/lights/allBuildingsLights.test.js`

### Step 3: Playwright proof with ?time=

Deliver:
- `tests/e2e/living-light.spec.js` (every URL pins `&quality=high` for the counts and the pool test; `&freeze=1` on every `?time=`). Names: the hotel lobby light group is `plaza:lobby`; the library main hall group is `library:hall` (the group name of plan 053, cross-audit item 2); street lamp lights are `listLights()` records whose id starts with `street-lamp-`, whose group is `square:street` and whose `auto` is `dusk` (the id prefix plus auto dusk, the rule agreed with plan 060). Plan 029 creates these lamps as ids `street-lamp-<n>` in group `square:street`, so no cross-plan rename is needed. The four cases, as one list: (a) `?time=0.75&freeze=1&quality=high` (dusk, clear): at least 8 street lamp lights `on`; `teleport('plaza')` then the `plaza:lobby` group is `on`; `nightGlowStats()` (new hook in worldHook.js, returns `{ glowingWindows, meanIntensity }` where a window is glowing when its intensity is over 0.05) reports at least 40 glowing windows and a mean intensity over 0.6; `teleport('library')` and the door interaction of plan 017 (`useNearest()`) opens the library, then `library:hall` is `on`. (b) `?time=0.5&freeze=1&quality=high` (noon, clear): no street lamp light is `on`, `plaza:lobby` and `library:hall` are off, and every pooled light has `lightIntensity` 0. (c) `?time=0.75&freeze=1&weather=rain&quality=high` (dusk, rain): `plaza:lobby` is `on`. (d) `?time=0.5&freeze=1&weather=rain&quality=high` (noon, rain): `plaza:lobby` is `on` (the gloom rule: interior lights use effectiveNight), and the street lamp lights are still off (they use nightFactor only). Live switch: from case (a) call `setTime(0.5)` and use `expect.poll` (no fixed wait) until `plaza:lobby` and `library:hall` are off, within 5 s of game time. Zero console errors. The budget: no new spot; the existing `square-night` spot of plan 031 is checked by `npm run check:budget`, and glow adds no draw calls (only emissive changes).
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
- `npx vitest run tests/unit/lights/nightGlow.test.js tests/unit/lights/allBuildingsLights.test.js tests/unit/sky/night.test.js`
- `npx playwright test tests/e2e/living-light.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --all`

Human check (goes in the report, never blocks): Walk the town at dusk (`?time=0.72&freeze=1`): is it beautiful or garish?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
