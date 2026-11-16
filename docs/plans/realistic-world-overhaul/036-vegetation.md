# Plan 036: Coconut palms, trees, shrubs, grass and crops: instanced, wind-swayed, placed by area

Epic E3. Estimated turns: 60.

## Goal

Replace the v1 trees, rocks and grass (`scatterProps` in `src/world/props.js`) with believable South Indian vegetation: coconut palms (hero), neem-like broadleaf trees, casuarina near the beach, mango trees, banana clumps, hibiscus shrubs, ferns, grass tufts and flowers around the player, paddy rows in the farmland, reeds in the shallows and rocks. All instanced, wind-swayed, placed from the `town.json` areas (plan 032) on the plan 033 heightfield with exclusions, scaled by tier. Colliders for trunks.

Budget decisions (fixed here, the draw-call risk is the main design constraint): static vegetation is split in spatial chunks of 150 m; LOD is chosen PER CHUNK (high detail when the chunk centre is within 110 m of the player, low beyond, hysteresis 15 m), so each species has exactly one `InstancedMesh` per populated chunk per active LOD; the low LOD of every species has ONE material; grass and flowers use one pooled `InstancedMesh` each for the whole player neighbourhood (not one per 20 m cell). `vegetationStats().drawCalls` is at most 120 on high and 70 on low.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.5, 10.8 (Budget and shot spots, Town plan conventions, Terrain API) and decisions D21, D29 (requirements.md; R9 is the layout limit and does not apply here))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props.js
- src/world/town/square.js
- src/world/layout/square.js
- src/world/layout/town.json
- src/world/layout/town.js
- src/world/layout/plots.js
- src/world/layout/geometry.js
- src/world/layout/exclusions.js
- src/world/terrain/townHeight.js
- src/world/roads/surface.js
- src/engine/quality.js
- src/util/rng.js
- src/systems/gameloop.js
- src/systems/collision/world.js
- src/dev/worldHook.js
- src/main.js
- src/config.js
- src/budgets.json
- src/shots.json
- tests/unit/world/propsExclusion.test.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Species builders (headless)

Deliver:
- `tests/unit/vegetation/species.test.js` first. `src/world/vegetation/species.js` exports `SPECIES` (id to `{ variants, build(rng, variant) -> { high: [{ geometry, material }], low: [{ geometry, material }], height, trunkRadius, meta }, collider: radius or 0, windStrength, shadow: bool }`), where `rng` is a function returning floats in [0, 1) (`createRng(seed)` of `src/util/rng.js`; the v1 `rand(seed)` has the same shape) and `variant` an integer below `variants`. Species (variants, collider radius, windStrength): `coconut-palm` (3, 0.2, 1.0; curved ringed trunk 8 to 14 m leaning 0.5 to 2 m, 14 to 18 drooping fronds each a bent strip with leaflet cards, 3 to 6 coconuts; `meta = { fronds, coconuts }`), `neem` (2, 0.3, 0.7; 3 to 6 m trunk, wide crown of 5 leaf-card blobs, height 4 to 8 m), `mango` (1, 0.35, 0.6; rounded dense crown, 4 to 8 m), `casuarina` (1, 0.15, 0.9; tall thin 7 to 12 m with drooping needle clusters), `banana-clump` (1, 0, 0.8; 3 to 5 plants with paddle leaves, 2 to 4 m), `shrub-hibiscus` (1, 0, 0.4; 0.8 to 1.6 m with red flower dots), `fern` (1, 0, 0.4; 0.4 to 1.0 m), `grass-tuft` (1, 0, 0.3; 0.2 to 0.5 m), `flower-patch` (3 colour variants: white, yellow, pink; 0.2 to 0.5 m; 0, 0.3), `paddy-row` (1, 0, 0.3; a 4 m strip of 40 blades, 0.3 to 0.8 m), `reed-clump` (1, 0, 0.6; 1.0 to 2.0 m), `rock` (3, 0.5 for the largest variant else 0, 0; displaced icospheres 0.3 to 1.2 m). Shadow casting species: palm, neem, mango, casuarina.
- Materials (headless, a documented exception to the plan 013 library, which has no foliage sets): `foliageMaterial()` and `barkMaterial()` are cached `MeshStandardMaterial` with `vertexColors: true`, no textures, roughness 0.9 (`foliageMaterial` is `DoubleSide`); guarded so nothing touches `document`; a species has at most 2 materials in `high` and EXACTLY 1 in `low` (all vertex coloured, `DoubleSide`); rocks use one grey `vertexColors` material. Geometries are merged per material, indexed or not consistently, with `position`, `normal`, `color` attributes, finite values.
- Asset source (R9 says CC0 trees and plants; audit E3 #7, Poly Haven attempt before the code-built fallback): a throwaway node script (not committed) queries the public Poly Haven API (`https://api.polyhaven.com/assets?t=models`, categories `trees` and `plants`) and downloads ONE model each for `coconut-palm`, `neem`, `banana-clump` and `fern` as glTF into the public assets folder (`publicDir` is `assets/`, so `portfolio/assets/vegetation/`). Allowed-source rule: only polyhaven.com models whose licence is CC0; the asset id, licence, source URL and file name of each are recorded in `src/world/vegetation/assets.json`; any other licence or host is rejected. A download that fails, is not CC0, or whose triangle count is above the species limit of the test below keeps the code-built geometry of this step for that species, and the report lists which species used which source and why any failed. The species test checks that each species marked `source: "polyhaven"` in `assets.json` has its file present and a CC0 licence; no test needs the network.
- Tests: every species and variant builds in Node; every geometry is finite and has `color`; heights in the ranges above for ALL species (assert each range); palm `meta.fronds` is 14 to 18 and `meta.coconuts` 3 to 6; triangles per instance: palm high at most 3500, tuft and flower patch at most 40, and for EVERY species the low LOD has at most 35 percent of the high triangles; materials: at most 2 in `high` and exactly 1 in `low` for every species; variants differ for different variant numbers and for different seeds; the palm top is displaced at least 0.5 m horizontally from the base; `collider` values as listed; building twice with the same seed gives identical positions.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/vegetation/species.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/vegetation/species.js`
- `node "{{runner}}/assert.mjs" has src/world/vegetation/species.js "coconut-palm"`

### Step 2: Placement rules (pure) and the wind function

Deliver:
- `tests/unit/vegetation/scatter.test.js` first. `src/world/vegetation/scatter.js`: `scatterVegetation(town, heightField, { seed = 1337, tier = "high" })` returns `{ instances: [{ id, species, group, x, y, z, rot, scale, variant, r }], colliders: [{ id, x, z, r }] }` (pure, `createRng` from `src/util/rng.js`, never `Math.random`). Every candidate gets a random `r` in [0, 1) from ONE fixed stream drawn regardless of the tier; the tier keeps an instance only when `r < scale` with `scale = TIER_SETTINGS[tier].decorScale` (high 1, medium 0.8, low 0.5, passed in as `decorScale` for tests; every species is scaled except `paddy-row`), so low is a subset of medium and medium of high, and `id` is the index in the full list (stable across tiers; the collider id is `veg:<id>`). The waterline constant is `WATER_LEVEL` from `src/config.js` (-1.2); `heightAt`, `slopeAt` and `shoreDistance` come from the plan 033 field.
- Exclusions for everything except the exceptions below: a road buffer (half width + 1.2 m, any road), plot and anchor rectangles grown by 2 m (`rectCorners`/`rectDistance`), `town.areas.square` rect grown by 1 m (plan 033 moved the slice data into `town.json`; do not read `slice.json`), the harbour polygon and the quay strip (within 4 m of the quay line), the jetty corridor (6 m wide along its axis), the LOCAL and HARBOUR FOOTPRINTS (audit E3 #3: plans 038 and 039 place the gate, temple and fish market buildings after this plan, so 036 keeps every tree-class centre out of them now). Local footprint: the rectangles of the anchors `gateway` and `temple` grown by 10 m, plus a circle of radius 12 m around `town.local.gate` and `town.local.temple` (x, z) for each that is present in `town.json`. Harbour footprint: the `market` plot rectangle grown by 8 m (the harbour palms of rule 1 stand outside it; if fewer than 20 fit, the count gives way and the report says so). Terrain at or below `WATER_LEVEL + 0.3` (trees, palms, shrubs), slope above 0.6 for trees and palms, the farmland polygon for forest species and the forest polygon for `paddy-row`. Exceptions: `reed-clump` stands in the shallows (height between -0.6 and -0.05, inside the beach polygon) and ignores the water rule; avenue trees use the margin 0.5 m for plots (they stand in the 3 m setback strip) and 2 m for anchors; plot-front shrubs and banana clumps ignore their OWN plot (margin 0.3 to every other plot).
- Rules and numbers (high tier, all counts asserted in the tests): (1) beach palms: Poisson rejection with minimum distance 6 m over the beach polygon where `shoreDistance` is 15 to 45 m and height is at least 0.5, then keep with probability 0.55: palms along the beach line spaced 6 to 12 m; plus 3 palms within 10 m of every `hut` plot (landward side), 20 palms along the harbour polygon landward of the quay (8 m behind the strip), 1 palm per 3 house plots, palms every 14 m along the inner edge of the farmland polygon (bunds), and open-ground palms (one per 400 m2 candidate cell in the town within 200 m of the origin that passes the exclusions); target palms 80 to 400. (2) Avenue: `neem` with `group: "avenue"` along the `main` road, every 15 to 20 m, alternating sides at 5.0 +- 0.3 m from the centreline, outside the square rect grown by 6 m and at least 8 m from any other road centreline; at least 20. (3) Forest polygon: `neem`, `mango`, `casuarina` (weights 0.4, 0.3, 0.3) at density 1 tree per 70 m2 (Poisson minimum distance 3 m), understory `fern` 1 per 25 m2 and `shrub-hibiscus` 1 per 60 m2. (4) Hill (`areas.hill` circle): trees accepted with probability 0.4, `rock` 1 per 150 m2 where slope is above 0.25. (5) Farmland: `paddy-row` in a grid of 4 m rows spaced 1.2 m, rows aligned to the longest polygon edge, row centre inside the polygon and 6 m from roads and plots. (6) Banana: one `banana-clump` behind every second house plot (`d / 2 + 3` m behind the plot centre along `-(sin rot, cos rot)`). (7) Plot fronts: 2 `shrub-hibiscus` per house plot 1.4 m in front of the front edge at the two front corners inset 1 m. (8) Reeds: one `reed-clump` every 4 to 8 m in the shallows within 80 m of the harbour polygon. (9) Rocks: 1 per 400 m2 on beach cells with height 0.2 to 1.2. Tree cap: instances of `coconut-palm`, `neem`, `mango`, `casuarina` total at most 1400 on high (after generation, thin deterministically by `r` from the top if above the cap). Grass tufts and flowers are NOT in this list (they stream around the player in step 3).
- `colliders`: one circle per instance of a species with `collider > 0` and `trunkRadius >= 0.15` (palms 0.2, neem 0.3, mango 0.35, casuarina 0.15, the largest rock variant 0.5; instances inside the exclusion rules of the town only), ids `veg:<id>`. `src/world/vegetation/wind.js` (pure): `windOffset(x, z, t, { strength = 1, height = 1 })` returns `{ x, z }` metres = `strength * height^2 * 0.12 * (0.6 sin(1.1 t + 0.05 x + 0.04 z) + 0.4 sin(2.3 t + 0.11 z))` times the unit direction (0.8, 0.6), `t` in SECONDS from a vegetation clock `createVegetationClock()` that advances with the frame `dt` and ignores `?freeze=1` (which only stops the day clock); `windAmplitude({ reducedMotion, tier, windStrength })` is 0 when `reducedMotion` is true, or when `tier === "low"` and `windStrength < 0.5`, else 1; `windGlsl()` returns the GLSL of the same formula built from the same constants (injected in step 3; a test checks it contains the constants 0.12, 1.1, 2.3).
- Tests: determinism (same seed same list, seed 2 different); for EVERY instance of the full list the exclusions hold (road buffer, plots and anchors with the margins above, square, water or quay, slope for trees, and the local and harbour footprints: no tree-class centre inside any footprint rectangle or circle, point-in-rectangle after rotating into its frame;for avenue trees the plot margin 0.5) with the species exceptions as stated; counts: palms 80 to 400, avenue at least 20, forest trees plus understory at least 300, paddy rows at least 40, banana at least 5, reeds at least 8, rocks at least 10, total trees at most 1400, every `r` in [0, 1); tiers: medium count between 70 and 90 percent of high and low between 40 and 60 percent of high, and the low `id` set is a subset of the high `id` set; no two tree-class instances closer than 0.8 m; avenue trees are 4.7 to 5.3 m from the `main` centreline (this is consistent with the 4.7 m road buffer of main); colliders: only species with `collider > 0`, radius equals the table, ids unique and start with `veg:`; `windOffset` is 0 at `height` 0, bounded by `0.12 * strength * height^2`, not constant (differs between t = 0 and t = 0.6 at 10 points), `windAmplitude` truth table (reduced motion beats everything; low tier with a low strength is 0, palms at `windStrength` 1.0 still sway on low); `windGlsl` constants.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/vegetation/scatter.test.js tests/unit/vegetation/species.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/vegetation/scatter.js src/world/vegetation/wind.js`
- `node "{{runner}}/assert.mjs" has src/world/vegetation/scatter.js "scatterVegetation"`
- `node "{{runner}}/assert.mjs" has src/world/vegetation/wind.js "windAmplitude"`

### Step 3: Instanced rendering, wind shader, pooled grass

Deliver:
- `tests/unit/vegetation/render.test.js` first. `src/world/vegetation/render.js` exports `buildVegetation(scatter, { tier, getReducedMotion })` returning `{ root, update(dt, playerPos, camera), stats(), dispose() }`: instances are grouped by chunk (150 m cells, key `<cx>:<cz>`) and species and variant into `InstancedMesh`es named `veg:<cx>:<cz>:<species>:<variant>:<lod>`; both LOD versions are built lazily and only the active one is visible (`mesh.visible`); LOD per chunk from the distance of the chunk centre to the player (high under 110 m, low beyond, switch back only under 95 m: hysteresis 15 m); chunk visibility by a frustum test of the chunk box (`mesh.visible = false` when outside), `frustumCulled` false on the meshes (the update owns culling); shadows: `castShadow` only for species with `shadow` and only when `TIER_SETTINGS[tier].shadows` (high, medium), never `receiveShadow` on vegetation. `stats()` returns `{ instances, grass, chunks, meshes, drawCalls }` where `drawCalls` is the number of currently visible vegetation meshes counted once per material (a two-material high LOD mesh counts 2) plus 2 for the grass pool, `instances` counts only scattered instances (not grass).
- Wind (vertex shader via `onBeforeCompile` on the foliage materials, injected from `windGlsl()`): uniforms `uWindTime` (the vegetation clock, seconds), `uWindAmp` (`windAmplitude`, set per species material clone each frame), `uWindStrength` (per species); displacement `offset = windOffset(instanceTranslation.xz, uWindTime, strength, height01^2)` applied to the vertex by its height above the base (`position.y / speciesHeight`), phase from the instance translation (`instanceMatrix[3].xz`); amplitude 0 when `uWindAmp` is 0. Materials are cloned per species for the uniform, so at most 13 materials in the scene.
- Pooled grass: `GrassField` owns ONE `InstancedMesh` for tufts and ONE for flower patches (capacity high 6000/600, medium 4000/400, low 1500/150, flowers coloured with `instanceColor`). Cell size 20 m; cells within 60 m of the player are active (30 m on low; a cell is released beyond radius + 20 m, hysteresis); a cell is generated at most 2 per frame, deterministic: seed = `((cx * 73856093) ^ (cz * 19349663) ^ seed) >>> 0` into `createRng`, 60 tufts and 6 flower patches per cell scaled by `decorScale`, placed only where `surfaceAt(x, z)` (plan 034) is `grass`, height at least 0.6 and outside road buffers (half width + 0.5), plots grown by 1 m, anchors, water; written into free slots of the pool (released cells free their slots), `mesh.count` is the used high-water mark. Grass has no colliders, no shadows and wind amplitude by `windStrength` 0.3 (zero on low).
- Tests (Node, no GL): `buildVegetation` on the real town builds; mesh names follow the pattern; with the player far away every populated chunk is on `low`, with the player in a chunk that chunk is `high`, hysteresis: moving 100 m away and back at 100 m keeps the previous LOD; `drawCalls` on a crowded camera is at most 120 on high and 70 on low using the real data; `castShadow` is false for fern and grass and for every species on `low`; frustum culling hides a chunk behind the camera; the wind uniform `uWindAmp` is 0 with reduced motion; `GrassField` never exceeds capacity, releases slots when the player moves 80 m away (used slots drop), is deterministic per cell (same cell twice gives the same matrices), and generates at most 2 cells per `update`; no grass inside a road buffer, plot or water (sample 2000 instances); `dispose` frees geometries.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/vegetation/render.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/vegetation/render.js`
- `node "{{runner}}/assert.mjs" has src/world/vegetation/render.js "GrassField"`
- `node "{{runner}}/assert.mjs" has src/world/vegetation/render.js "onBeforeCompile"`

### Step 4: Integration, colliders, hook, Playwright, spots and a look

Deliver:
- Integration: delete the v1 `scatterProps`, `scatterTrees`, `scatterRocks`, `scatterGrass` and every helper only they used from `src/world/props.js` (keep the exclusion API `addExclusionRect`, `addExclusionPolygon`, `addExclusionPolyline`, `clearExclusionRects`, `isExcluded` of plans 029 and 033; plan 036 UNFREEZES `tests/unit/world/propsExclusion.test.js`: remove only its parts that call `scatterProps`) and the `scatterProps()` call in `main.js`/the `v1-world` load. In the `v1-world` load after `buildTerrain()`: `const scatter = scatterVegetation(loadTown(), game.heightField, { seed: getParams().seed, tier: getTier(), decorScale })`, `buildVegetation(scatter, ...)` added to `game.worldRoot`, every collider added with `game.collision.addCircle({ id, x, z, r })` (ground-anchored circles, ids `veg:<id>`), the `update(dt, player.position, camera)` registered in the per-frame list of `gameloop.js`, `GrassField` fed from the same update. On `onTierChange`: `game.collision.removeByPrefix("veg:")`, dispose and rebuild with the new tier.
- Hook (`src/dev/worldHook.js`): `vegetationStats()` (the `stats()` object plus `palms` count), `vegetationPalms()` returning `[{ x, y, z }]` of palm instances that have colliders, `windOffset(x, z)` returning `windOffset(x, z, vegetationTime, { strength: 1, height: 1 })` times the current amplitude (0 with reduced motion), `vegetationTime()`; `listObjects()` gains one `{ type: "vegetation-chunk", name, species, count }` per chunk mesh through `game.areaObjects`. `tests/unit/vegetation/integration.test.js` greps: `scatterProps`, `scatterTrees`, `scatterRocks`, `scatterGrass` do not occur under `src/`; `scatterVegetation` is called in `main.js` or the area load; `veg:` is used with `removeByPrefix`.
- Spots (ARCH 10.8: `y` is the absolute CAMERA height; add to `src/budgets.json` AND `src/shots.json` with identical `x, y, z, yaw, pitch`, append only; ids `beach`, `forest`, `avenue` are new; literal numbers computed once with a throwaway node script from the real data and `createTownHeightField`, with `yaw = atan2(-dx, -dz)` for a look direction `(dx, dz)`): `beach`: at the beach polygon centroid angle `theta` the radius where `shoreDistance` is 25, `y = heightAt + 1.8`, looking along the shore 30 degrees toward the sea from the outward direction, pitch -0.05; `forest`: the forest polygon centroid (or its nearest polygon vertex pulled 10 m inward when the centroid is outside), `y = heightAt + 1.7`, looking toward the origin, pitch 0; `avenue`: the point of `main` nearest to x -90, camera 8 m behind it along the east tangent `T`, `y = heightAt + 2.0`, `yaw = atan2(-T.x, -T.z)`, pitch -0.05. `tests/unit/vegetation/spots.test.js` asserts the ids exist in both files with equal numbers.
- `tests/e2e/vegetation.spec.js` (`?quality=high&time=0.4&freeze=1&seed=1337`, wait for `window.__world.ready`, every wait is `expect.poll(..., { timeout: 20000 })`, never a fixed delay): `vegetationStats().instances` is over 600 and `palms` over 60; no `scatterProps` objects remain (`listObjects()` has `vegetation-chunk` records); `vegetationStats().drawCalls` is at most 120 at the `beach`, `forest` and `avenue` spots (`teleport(x, z)` to the camera `x, z` of each spot; coordinates only, never a spot id, because the teleport targets are zone ids or coordinates) and `rendererInfo().calls` within the desktop `budgets.json` limit; palm collider: take the palm of `vegetationPalms()` nearest to the `beach` spot, `teleport` 3 m from it facing it, hold `w` and poll until the position stops changing (two polls 500 ms apart differ by less than 0.05 m): the final distance to the palm centre is between 0.50 and 0.60 m (collider 0.2 + player 0.35); wind: poll `windOffset(x, z)` until two samples taken 600 ms apart differ (the vegetation clock runs under `freeze=1`); a second page with `?quality=low` has `instances` between 40 and 60 percent of the high count (`vegetationStats().instances`), `drawCalls` at most 70 and `windOffset` of a palm still changes; zero console errors.
- Shots: `npm run shots -- --spots beach,forest,avenue --plan 036`; open each PNG in `docs/shots/036/` with the Read tool and fix floating trees (instance `y` from the field), palms inside buildings or on the road, flat colours, trunk rings that look like stacked discs (best effort, never fails; list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/vegetation/integration.test.js tests/unit/vegetation/spots.test.js tests/unit/world/propsExclusion.test.js`
- `node "{{runner}}/assert.mjs" none src/world/props.js "scatterProps"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "beach"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "forest"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "avenue"`
- `node "{{runner}}/assert.mjs" has src/shots.json "beach"`
- `node "{{runner}}/assert.mjs" has src/shots.json "forest"`
- `node "{{runner}}/assert.mjs" has src/shots.json "avenue"`
- `npx playwright test tests/e2e/vegetation.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/vegetation/species.test.js tests/unit/vegetation/scatter.test.js tests/unit/vegetation/render.test.js tests/unit/vegetation/integration.test.js tests/unit/vegetation/spots.test.js tests/unit/world/propsExclusion.test.js`
- `npx playwright test tests/e2e/vegetation.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): Look at the palms, forest and beach: do they feel like coastal Tamil Nadu?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
