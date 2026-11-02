# Plan 035: Sea and harbour water with depth colour, shoreline foam, waves and bobbing helpers

Epic E3. Estimated turns: 45.

## Goal

Replace the v1 water plane with a believable sea: depth-based colour from shallow turquoise to deep blue, animated normals, foam along the shore, calm water inside the harbour, Fresnel reflection of the sky and sun glint, correct fog. Wave height is a pure function (`waveHeightAt`) that boats use in epic 5. Simpler on the low tier.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 and requirement R9, assumption A14)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/water.js
- src/world/sky.js
- src/systems/clock.js
- src/world/terrain/townHeight.js
- src/world/layout/town.json
- src/engine/quality.js
- src/engine/assets.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Pure water functions

Deliver:
- `tests/unit/water/waves.test.js` first. `src/world/water/waves.js`: `waveHeightAt(x, z, t, { calm = 0 })` (sum of 4 sine waves with different directions, amplitude about 0.18 m total at open sea, scaled by `1 - calm`, `calm` in 0..1), `waveNormalAt(x, z, t)` (analytic), `depthAt(x, z, heightField)` (`waterLevel - terrainHeight`, never negative), `shallowFactor(depth)` (0 at depth 3, 1 at depth 0, smooth), `foamAmount(depth, t, x, z)` (0 beyond 0.7 m, strongest between 0.05 and 0.3 m, modulated by a moving noise in 0..1), `harbourCalm(x, z, town)` (1 inside the harbour polygon fading to 0 over 12 m outside it).
- Tests: wave height bounded by 0.35 m; periodic in time; the normal is unit length; `shallowFactor` monotonic; `foamAmount` 0 for depth over 0.8 and for depth 0 at the dry edge; `harbourCalm` 1 inside, 0 far outside; determinism.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/water/waves.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/water/waves.js`

### Step 2: Water mesh and shader

Deliver:
- `src/world/water/waterMesh.js`: a subdivided disc/square mesh covering the island plus 300 m of sea (finer cells near the shore: a 2 m grid within 320 m of the centre and coarser rings outside, built as separate meshes), per-vertex attribute `depth` computed from the height field, and a `MeshStandardMaterial` extended by `onBeforeCompile` (or a `ShaderMaterial` that includes the fog chunks): colour = mix(deep, shallow, `shallowFactor`), alpha rises with depth (0.55 shallow to 0.92 deep), animated normals from two scrolling procedural noise layers (no canvas texture needed), foam added from `foamAmount` in the fragment shader using a time uniform, Fresnel reflection from `scene.environment`, sun specular. `updateWater(dt, t)` advances the time uniform and keeps the water centred on the player in x and z in steps of 8 m to avoid swimming vertices. Low tier: no foam noise, one normal layer; reduced motion: waves slowed to 20 percent.
- `tests/unit/water/waterMesh.test.js`: in Node the mesh builds, the `depth` attribute is finite and non-negative, vertex counts are positive and the low tier has fewer, `updateWater` does not throw; the material has the fog flag enabled.
- Remove the v1 `buildWater` plane and generated normal-map canvas use; keep `updateWater` name for the game loop.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/water/waterMesh.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/water/waterMesh.js`

### Step 3: Playwright and a look

Deliver:
- `tests/e2e/water.spec.js`: boot with `?quality=high`: `listObjects()` has a `water` object; zero console errors (shader compile errors show up as console errors); `canvasLooksRendered`; on `?quality=low` also boots without errors; `waveHeightAt` is exposed in the hook as `waveHeight(x, z)` and stays under 0.35.
- Shots: spots `shore`, `harbour-water` in `src/shots.json` (add), `npm run shots -- --spots shore,harbour-water --plan 035`; look for visible foam, depth gradient, no hard seams at ring borders (best effort; fix).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/water.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/water/waves.test.js tests/unit/water/waterMesh.test.js`
- `npx playwright test tests/e2e/water.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
