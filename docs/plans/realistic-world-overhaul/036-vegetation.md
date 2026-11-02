# Plan 036: Coconut palms, trees, shrubs, grass and crops: instanced, wind-swayed, placed by area

Epic E3. Estimated turns: 55.

## Goal

Replace the v1 trees, rocks and grass with believable South Indian vegetation: coconut palms (hero), neem-like broadleaf trees, banyan on the square (already built), casuarina near the beach, mango trees, banana clusters, shrubs (hibiscus), ferns and undergrowth in the forest, grass tufts and flowers around the player, paddy and crop rows in the farmland, reeds at the harbour edge, and rocks. All instanced with wind sway, placed from the town plan areas with exclusions, scaled by tier. Colliders for trunks.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4 and requirement R9, decision D21, D29)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props.js
- src/world/town/square.js
- src/world/layout/town.json
- src/world/layout/geometry.js
- src/world/terrain/townHeight.js
- src/world/roads/surface.js
- src/engine/quality.js
- src/util/rng.js
- src/systems/clock.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Species builders (headless)

Deliver:
- `tests/unit/vegetation/species.test.js` first. `src/world/vegetation/species.js` exports `SPECIES` (id -> `{ build(rng, variant) -> { geometries: [{ geometry, material }], height, trunkRadius, lod: [..] }, collider?: { r }, windStrength }`) for: `coconut-palm` (curved ringed trunk 8 to 14 m with a slight lean, 14 to 18 drooping fronds each a bent strip with many leaflet cards, a coconut cluster), `neem` (3 to 6 m trunk, wide dense crown of 5 leaf-card blobs), `mango` (rounded crown), `casuarina` (tall thin with drooping needle clusters), `banana-clump` (3 to 5 plants, big paddle leaves), `shrub-hibiscus` (with red flower dots), `fern`, `grass-tuft`, `flower-patch` (3 colours), `paddy-row` (a 4 m strip of 40 thin blades), `reed-clump`, `rock` (3 variants of displaced icospheres in `stoneRough`/`rockCliff`). Each species yields at most 2 materials and merged geometry, a high and a low detail version (the low version has at most 35 percent of the triangles).
- Tests: every species builds in Node with finite geometry; heights in range (palm 8 to 14 m, neem 4 to 8 m, banana 2 to 4 m); triangles per instance: palm high at most 3500 and low at most 1200, tuft at most 40; variants differ for different seeds; the palm trunk is not straight (horizontal offset of the top at least 0.5 m).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/vegetation/species.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/vegetation/species.js`

### Step 2: Placement rules (pure)

Deliver:
- `tests/unit/vegetation/scatter.test.js` first. `src/world/vegetation/scatter.js`: `scatterVegetation(town, heightField, { seed, tier })` returns instances `[{ species, x, y, z, rot, scale, variant }]` by rules: coconut palms along the beach line (every 6 to 12 m within the beach polygon edge band), around huts and the harbour, avenue trees (neem) along main street every 15 to 20 m at 4.5 m from the centreline, forest polygon dense mix (neem, mango, casuarina, fern, shrubs; density 1 tree per 55 m2), hill slopes thinner, farmland: paddy rows in rectangles and a few palms on bunds, banana clumps near houses (one per two plots), shrubs and flowers at plot fronts, reeds along the harbour and shore edge, rocks on the beach edge and hill; grass tufts and flowers are NOT in this list (they are chunk-streamed around the player, see next step). Exclusions: road buffer (half width plus 1.2 m), plots and anchors (rect plus 2 m), the square, water (height under the waterline plus 0.3), slope over 0.6 for trees.
- `density` follows `TIER_SETTINGS[tier].decorScale` (tree and shrub counts halve on `low`). Returns also `colliders: [{ x, z, r }]` for trunks with `trunkRadius >= 0.15` limited to instances within the town, forest and beach (not grass).
- Tests: determinism; exclusions hold for every instance (road, plot, anchor, square, water) over the full set; per-species counts within ranges (palms 120 to 400 on high, total trees at most 1400); low tier count between 40 and 60 percent of high; no two trees closer than 0.8 m; avenue trees sit 4.5 m +- 1 m from main street centreline.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/vegetation/scatter.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/vegetation/scatter.js`

### Step 3: Instanced rendering, wind, grass chunks, colliders and integration

Deliver:
- `src/world/vegetation/render.js`: one `InstancedMesh` per species per detail level per spatial chunk of 100 m (frustum culling per chunk), instance matrices from the scatter, LOD by distance with hysteresis (high under 70 m, low beyond), wind sway in the vertex shader via `onBeforeCompile` (a time uniform, sway amplitude by vertex height and species `windStrength`, a phase from the instance position; amplitude 0 when `getReducedMotion()` or tier `low` is on and `windStrength` low), shadows only on the high and medium tiers for palms and trees. `GrassChunks`: grass tuft and flower instances generated per 20 m cell within 60 m of the player (30 m on low), deterministic per cell seed, created and disposed as the player moves (at most 2 cells per frame), excluded from roads, plots, water and sand.
- Colliders: trunks go to `game.collision.addCircle` (they are in the broadphase).
- Remove the v1 `scatterProps` trees, rocks and grass; keep any v1 prop that is not vegetation. Add `listObjects()` entries `{ type: "vegetation-chunk", species, count }` to the hook, and hook `vegetationStats()` returning `{ instances, drawCalls }`.
- `tests/e2e/vegetation.spec.js`: boot with `?quality=high`: `vegetationStats().instances` is over 600; with `?quality=low` it is between 40 and 60 percent of high; walking into a palm trunk (teleport 3 m from a known palm at the beach, walk toward it) is blocked 0.5 m from its centre; the palm tops move over time with sway: sample a hook `windOffset(x, z)` twice 600 ms apart and expect a difference (not with reduced motion); zero console errors; `check:budget` passes with the new spots `beach` and `forest` added to `src/budgets.json`.
- Shots: `beach`, `forest`, `avenue` spots in `src/shots.json`; `npm run shots -- --spots beach,forest,avenue --plan 036`; view and fix (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/vegetation.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/vegetation/species.test.js tests/unit/vegetation/scatter.test.js`
- `npx playwright test tests/e2e/vegetation.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

Human check (goes in the report, never blocks): Look at the palms, forest and beach: do they feel like coastal Tamil Nadu?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
