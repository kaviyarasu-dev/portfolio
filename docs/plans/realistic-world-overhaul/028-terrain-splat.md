# Plan 028: Textured terrain: heightfield module and a four-layer splat material

Epic E2. Estimated turns: 50.

## Goal

Replace the v1 vertex-colour terrain with a textured one: a pure heightfield module (`heightAt`, shore and slope helpers), splat weights (grass, sand, dirt road, rock) and a standard material extended with the four CC0 texture sets from plan 013 (`grass`, `sand`, `dirtRoad`, `rockCliff`). The island size stays as v1 until plan 033 rebuilds the terrain from the town plan; this plan keeps the same API so that plan only swaps data.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.2, 10.4 and requirement R9, assumption A14)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/terrain.js
- src/world/props.js
- src/world/zones.js
- src/engine/materials.js
- src/engine/quality.js
- src/config.js
- assets/textures/INDEX.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Heightfield and splat weights (pure)

Deliver:
- `tests/unit/terrain/height.test.js` and `tests/unit/terrain/splat.test.js` first. `src/world/terrain/height.js`: `createHeightField({ seed, radius, flatAreas, paths, waterLevel })` returns `{ heightAt(x, z), slopeAt(x, z), isWater(x, z), shoreDistance(x, z) }` using the same noise as v1 (move the v1 functions here, behaviour for existing zones must match v1 within 0.05 m at each zone centre) with `flatAreas: [{ x, z, r, y }]` (smooth blend to a plateau), the island falloff to below the water level at `radius`, and no values outside [-12, 40].
- `src/world/terrain/splat.js`: `splatWeights({ h, slope, shore, pathMask, waterLevel })` returns `[grass, sand, dirt, rock]` summing to 1 (each in [0,1]): sand near the water level (within 1.2 m above it), rock on slopes over 0.7, dirt where `pathMask` is 1, grass elsewhere, smooth transitions (no value jumps over 0.35 between points 0.5 m apart). `pathMask(x, z)` comes from a list of path polylines with a half-width and a 1.5 m falloff.
- Tests: determinism; zones centres match the v1 heights; flat area plateau within 0.02 m at the centre; island edge under the water; weights sum to 1 and are never negative over a 50 by 50 sample grid; sand at h = waterLevel + 0.3; rock at slope 1.0; dirt on a path; continuity.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/terrain/height.test.js tests/unit/terrain/splat.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/terrain/height.js src/world/terrain/splat.js`

### Step 2: Splat material and terrain mesh

Deliver:
- `src/world/terrain/terrainMesh.js`: builds the terrain mesh from the heightfield (segments from `TERRAIN_SEGMENTS`, 200 by 200 on high, 120 by 120 on low), vertex attribute `splat` (vec4) from `splatWeights`, normals from the height function, and a `MeshStandardMaterial` extended with `onBeforeCompile` that blends four albedo textures by `splat` using planar world-xz coordinates divided by each layer tile size (grass 4 m, sand 3 m, dirt 3 m, rock 5 m) plus a second sample at a different scale to hide tiling, and adds the rock normal map on high tier only. At most 10 texture units in total. Texture size follows the tier (`getMaterial` helpers or a shared loader). Falls back to a flat-colour blend when `document` is undefined (Node).
- `tests/unit/terrain/terrainMesh.test.js`: in Node the mesh builds, has `position`, `normal`, `splat` attributes of equal vertex counts, all splat values finite; the low-tier mesh has fewer vertices than the high one; the material has an `onBeforeCompile` function and `defines` for the layer count.
- Replace the v1 `buildTerrain` body in `src/world/terrain.js` with the new module (keep `sampleHeight` exported and equal to `heightAt`); the player still stands on the terrain (`collision.groundHeight`). Props that read `sampleHeight` keep working.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/terrain/terrainMesh.test.js`
- `node "{{runner}}/assert.mjs" has src/world/terrain.js "createHeightField"`
- `npm run lint`

### Step 3: Playwright, budget and a look

Deliver:
- `tests/e2e/terrain.spec.js`: boot, ready, zero console errors; `playerState().y` at the spawn is within 0.1 m of `heightAt` for that point (expose `terrainHeight(x, z)` in the hook); on `?quality=low` the terrain triangle count (reported by `rendererInfo` difference or a hook `terrainStats()`) is lower than on high; `canvasLooksRendered`.
- `npm run check:budget` still passes. `npm run shots -- --spots spawn,library --plan 028`; look at them: the ground must show visible grass texture, sand at the shore and dirt on paths, with no stretched textures (best effort; fix tile sizes if needed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/terrain.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/terrain/height.test.js tests/unit/terrain/splat.test.js tests/unit/terrain/terrainMesh.test.js`
- `npx playwright test tests/e2e/terrain.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
