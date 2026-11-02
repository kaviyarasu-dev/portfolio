# Plan 012: Dev fixtures framework and the light manager (pooled interior lights, switches, dusk)

Epic E1. Estimated turns: 50.

## Goal

Two foundations. (1) Fixtures: dev-only mini scenes loaded with `?fixture=<name>` so tests and visual self-reviews do not need the whole island. (2) The light manager: interior lights are registered as data, a small fixed pool of real point lights is moved to the nearest active lights (no shader recompiles), the rest are emissive fakes, groups can be switched, and lights marked `auto: 'dusk'` follow the clock.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 10.5 and assumption A11)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/engine/scene.js
- src/systems/clock.js
- src/engine/quality.js
- src/dev/worldHook.js
- src/systems/gameloop.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Fixtures framework

Deliver:
- `src/dev/fixtures/index.js`: `registerFixture(name, { build(ctx) })` where `ctx` has `{ scene, game, THREE }` and `build` returns `{ root, spawn: { x, y, z, yaw }, ready?: Promise }`; `getFixture(name)`; `listFixtures()`. Fixtures register themselves from `src/dev/fixtures/<name>.js`, imported by `index.js`. In this step provide only `blank` (a 60 m square floor); step 3 adds `lighting` and its import (so the step 1 test does not import a missing file). Plan 015 registers the v1 world area only when no fixture is active.
- `src/main.js`: when `import.meta.env.MODE !== 'production'` and `getParams().fixture` is set, boot builds the renderer, scene, sky and clock, player, camera, input, interaction and audio, but not terrain, props or the 14 buildings; it adds the fixture root and teleports the player to `spawn`. An unknown fixture name throws a clear error that lists the known names. The production build contains no fixture code (the dynamic import sits inside the dev-only branch).
- `tests/unit/dev/fixtures.test.js`: register, get, duplicate name throws, unknown name returns null.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/dev/fixtures.test.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/index.js src/dev/fixtures/blank.js`

### Step 2: Light manager (pure selection plus pooled THREE lights)

Deliver:
- `tests/unit/lights/lightManager.test.js` first. `src/systems/lights/lightManager.js` exports `nightFactor(dayFraction)` (0 from 0.30 to 0.62, ramps 0 to 1 between 0.62 and 0.78, 1 from 0.78 to 1.0 and from 0.0 to 0.18, ramps 1 to 0 between 0.18 and 0.30), `selectActiveLights(lights, playerPos, max)` (only lights that are on and within `distance * 1.5` of the player, nearest first, stable on ties by id, at most `max`), and `class LightManager`.
- `LightManager`: `registerLight({ id, x, y, z, color, intensity, distance, group, room, auto, emissive, exempt })` (`emissive` is an array of meshes whose material gets `emissiveIntensity` 0 or 1.2 as the light turns off or on, with the material cloned per light so lights do not share a state and `emissive` colour set to the light colour; `exempt: true` marks a special light such as the lighthouse spot that is never pooled and never counted in `maxPointLights`; a group that has no `auto` starts OFF, and for mixed `auto` values in one group the group follows `auto: "dusk"` if any member has it); `unregisterLight(id)`; `setGroup(group, on)`, `toggleGroup(group)`, `isGroupOn(group)`; `setNight(factor)` with hysteresis: `auto: 'dusk'` groups turn on when the factor reaches 0.55 and off when it falls under 0.45, and a manual switch is remembered until the next dusk/dawn flip; `attach(scene, poolSize)` creates `poolSize` `PointLight`s (no shadows) and `update(playerPos)` (a plain `{ x, y, z }`; distances are 3D so lights on other floors are far) moves the nearest active lights onto them (unused pool lights get intensity 0 and stay in the scene so the shader never recompiles); `list()` returns `[{ id, group, room, on, pooled, intensity }]`. Pool size comes from `TIER_SETTINGS[tier].maxPointLights` and follows tier changes through `resizePool(n)` (adding or removing pool lights on a tier change does recompile shaders once, which is accepted); pool lights use `decay: 2`, `castShadow: false`, the light `color` and `distance`; `pooledIntensity(id)` returns the real intensity of the pooled light or 0; the first `setNight` call applies the thresholds without hysteresis (on at or above 0.55, off below 0.45 only after having been on). Light units are physical (candela): document the intensity range that looks right (about 8 to 40 for a room lamp at `distance` 10).
- Tests: nightFactor table (0.5 gives 0, 0.7 between 0 and 1, 0.75 over 0.8, 0 gives 1, 0.28 under 0.2); selection by distance and max; ties; groups; hysteresis (factor 0.5 does not flip an already-on group); manual override survives a small night change and resets on a dusk flip; pool of 0 leaves emissives working; unregister.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/lights/lightManager.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/lights/lightManager.js`

### Step 3: Wire the manager in, add the lighting fixture and the hook

Deliver:
- Create the single `LightManager` in `src/engine/scene.js` (`game.lightManager`), call `setNight(nightFactor(game.clock.dayFraction))` and `update(player.position)` every frame from `gameloop.js`, and re-size the pool on `onTierChange`.
- `src/dev/fixtures/lighting.js`: a closed 8 m by 6 m room (box walls, floor, ceiling, a doorway), three registered lights: two in group `lamps` (`auto: 'dusk'`, with small emissive bulb meshes) and one in group `ceiling` (no auto). Spawn inside the room.
- Hook: `listLights()` returns `lightManager.list()`; `toggleLightGroup(group)`; `lightIntensity(id)` returns `lightManager.pooledIntensity(id)`; `tierSettings()` is not needed here. Write the recommended intensity range for room lamps into `docs/world-conventions.md`.
- `tests/e2e/lighting.spec.js` (every URL also has `&freeze=1`; the fixture mode starts with the loader hidden and `ready` true after the first frame): with `?fixture=lighting&time=0.5&freeze=1&quality=high` the `lamps` lights are off and the `ceiling` light is off; with `time=0.75` the lamps are on and at least one is pooled with `lightIntensity` over 0; `toggleLightGroup('ceiling')` turns it on at noon; with `quality=low` no light is pooled (emissive only) but `on` is still true; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/lighting.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/lighting.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/dev/fixtures.test.js tests/unit/lights/lightManager.test.js`
- `npx playwright test tests/e2e/lighting.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
