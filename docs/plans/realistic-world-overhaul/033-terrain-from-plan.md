# Plan 033: Terrain built from the town plan; world enlarged to 300 m; v1 landmarks moved to their anchors

Epic E3. Estimated turns: 50.

## Goal

Rebuild the island from `town.json`: an irregular coast at about 300 m, plateaus under every anchor and plot, graded roads, the harbour basin cut below the water, a gently sloping beach, the hill, and wading limits so the player cannot walk out into deep water. Move the v1 landmark circles to their new anchors (`zones.js` reads the town plan) and enlarge the world constants, minimap and sky.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4 and requirement R9, assumption A14)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/terrain/height.js
- src/world/terrain/splat.js
- src/world/terrain/terrainMesh.js
- src/world/layout/town.json
- src/world/layout/town.js
- src/world/layout/geometry.js
- src/world/zones.js
- src/config.js
- src/ui/minimap.js
- src/world/sky.js
- src/systems/collision/world.js
- src/world/props.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Heightfield from the town plan

Deliver:
- `tests/unit/terrain/townHeight.test.js` first. Extend `createHeightField` with `createTownHeightField(town, { seed })` in `src/world/terrain/townHeight.js` (the old function stays for tests that use it): island coast radius 285 to 300 m perturbed by low-frequency noise (never inside 270 m), land height gently rising to a few metres inland, the hill (`town.areas.hill`) as a smooth bump up to its `h` (14 to 22 m), plateaus for each anchor and plot (height = the terrain height at the centre clamped to 0.3 to 3 m, blended over 6 m), roads graded: along each road polyline the height is a smoothed profile (moving average over 25 m) blended over `width / 2 + 3 m`, the harbour polygon below -2.5 m with a quay edge (a 3 m strip at +0.4 m on the land side), the beach polygon sloping at 0.03 to 0.09 from +1.0 m down to the water level, farmland flat plates with 0.3 m field bunds optional, the square rectangle flat at the slice height 0.15 m.
- Tests: no NaN over a 4 m grid; outside radius 300 the height is under -3 m; anchor plateaus within 0.03 m of their `y` at the centre; road slope (rise over run sampled every 2 m) at most 0.12 along every road; the harbour interior is under -1.8 m except the quay strip; beach slope inside the beach polygon between 0.02 and 0.10; hill peak between 14 and 22 m; the land is one connected island (flood fill on a 6 m grid, the largest component has at least 95 percent of land cells); determinism.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/terrain/townHeight.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/terrain/townHeight.js`

### Step 2: Wading limit, enlarged world constants and the v1 landmarks at their anchors

Deliver:
- `tests/unit/collision/wading.test.js` first (a NEW test file; do not edit the frozen collision tests). Add `setWading({ waterLevel, maxDepth = 0.7 })` to `CollisionWorld`: a move whose target has terrain ground below `waterLevel - maxDepth` is treated as blocked (slides along the shore); the player can wade in shallow water. Tests: walking from a beach into the sea stops at depth 0.7; moving along the shoreline slides; with `setWading` not called nothing changes.
- `src/config.js`: `WORLD_RADIUS = 300`, `TERRAIN_SIZE = 680`, `TERRAIN_SEGMENTS` 340 for high tier (`TIER_SETTINGS` gets `terrainSegments`: low 170, medium 256, high 340), `CAMERA_FAR = 900`, fog density lowered to keep the horizon (about 0.0045). `src/world/terrain.js` builds the mesh from the town height field and uses `town.roads` for the path mask; `sampleHeight` equals the new `heightAt`.
- `src/world/zones.js`: `ZONE_LAYOUT` positions and `r` come from `town.json` anchors (`x`, `z`; `r` stays as v1), the v1 building factories take their world position from the zone; the temporary relocations of plan 031 are removed (`slice.json` is deleted and its users read `town.json`: hotel at the `plaza` anchor, square from `areas.square`). The v1 `buildPlaza` stays removed.
- `src/ui/minimap.js` and `src/world/sky.js`: scale the minimap range to the new radius (still a player-centred disc, 120 m visible) and keep the sky dome and sun shadow frustum sizes valid for the larger world (sky mesh radius at least 850 m). The v1 props scatter uses `WORLD_RADIUS` and the town plan exclusion list (roads buffer, plots, anchors, water, square); keep the counts as they are for now (plan 036 replaces vegetation).
- `tests/e2e/world-scale.spec.js`: boot; for every zone id `teleport(id)` puts the player within 0.15 m of the terrain height (hook `terrainHeight`); `collisionStats()` shows the wading rule (`wading: true` added to the stats); walking east from the beach for 12 s ends in water no deeper than 0.8 m; zero console errors; `check:budget` passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/wading.test.js`
- `npx playwright test tests/e2e/world-scale.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/terrain/townHeight.test.js tests/unit/collision/wading.test.js tests/unit/layout/townPlan.test.js`
- `npx playwright test tests/e2e/world-scale.spec.js`
- `npx playwright test tests/e2e/slice-regression.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
