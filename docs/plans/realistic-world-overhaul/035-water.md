# Plan 035: Sea and harbour water with depth colour, shoreline foam, waves and bobbing helpers

Epic E3. Estimated turns: 60.

## Goal

Replace the v1 water plane with a believable sea: depth-based colour from shallow turquoise to deep blue, animated waves and ripple normals, foam along the shore, calm water inside the harbour, Fresnel reflection of the sky and sun glint, correct fog. Wave height is a pure function (`waveHeightAt`) that the visible surface and the boats of epic 5 share. Simpler on the low tier.

Design decisions (fixed here): the water mesh is STATIC (centred on the world origin, it never follows the player, so there is no snapping and no swimming); shore depth comes from a baked depth TEXTURE sampled per fragment (not a per-vertex attribute, which would be too coarse for a 0.055 beach slope); waves are displaced in the vertex shader with the same formula as `waveHeightAt` (so boats and the surface agree) and fade to zero toward the mesh border so the outer ring has no seam; all time is in SECONDS from a water clock that advances with the frame `dt` (independent of `?freeze=1`, which only stops the day clock).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.5 (headless rule, URL params), 10.8 (Terrain API, Budget and shot spots, Town plan conventions) and requirement R9 (assumptions A7 and A14 are in requirements.md))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/water.js
- src/world/sky.js
- src/systems/clock.js
- src/systems/gameloop.js
- src/main.js
- src/world/terrain/townHeight.js
- src/world/layout/town.json
- src/world/layout/geometry.js
- src/engine/quality.js
- src/engine/assets.js
- src/engine/scene.js
- src/dev/worldHook.js
- src/config.js
- src/budgets.json
- src/shots.json

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Pure water functions and the depth data

Deliver:
- `tests/unit/water/waves.test.js` first. `src/world/water/waves.js` (pure, no three, no `window`). Constants exported: `WATER_COLORS = { deep: "#0b3d66", shallow: "#3fc7c0", foam: "#ffffff" }`, `WAVES = [{ dirDeg: 20, wavelength: 63, amp: 0.06, period: 12 }, { dirDeg: -35, wavelength: 47, amp: 0.05, period: 6 }, { dirDeg: 75, wavelength: 31, amp: 0.04, period: 4 }, { dirDeg: 140, wavelength: 24, amp: 0.03, period: 3 }]` (the amplitudes sum to 0.18 m; the periods divide 12, so the whole function repeats every 12 s), `WAVE_PERIOD = 12`, `CALM_RESIDUAL = 0.15`, `FOAM = { dryEdge: 0.02, rise: 0.08, fall0: 0.25, fall1: 0.7 }`, `DEPTH_RANGE = 6` (the baked depth maximum in metres), `EDGE_FADE = [280, 340]`. A wave is `amp * sin(k * (dx * x + dz * z) - 2 PI t / period)` with `k = 2 PI / wavelength`, `(dx, dz) = (cos dir, sin dir)` and `t` in SECONDS.
- Functions: `waveHeightAt(x, z, t, { calm = 0 } = {})` = (sum of the four waves) * `(1 - (1 - CALM_RESIDUAL) * calm)` * `edgeFade(x, z)`, where `edgeFade = 1 - smoothstep(EDGE_FADE[0], EDGE_FADE[1], max(|x|, |z|))` (zero amplitude at the mesh border: this is what removes ring seams); the result is added to `WATER_LEVEL` by callers (boats use `WATER_LEVEL + waveHeightAt(...)`; the visible surface is displaced by exactly this in the vertex shader). `waveNormalAt(x, z, t, opts)` returns a plain `{ x, y, z }` unit vector from the ANALYTIC gradient (`n = normalize(-dh/dx, 1, -dh/dz)`; the edge fade derivative may be ignored inside radius 280). `depthAt(x, z, heightField)` = `max(0, waterLevel - heightAt(x, z)) + extra` with `extra = min(DEPTH_RANGE, 0.05 * max(0, r - heightField.radius))` for `r = hypot(x, z)` (the sea floor beyond the island is only 1.8 m below the water, so this deepens the colour to the deep blue far out), `heightField` = the plan 033 field (`{ heightAt, radius, waterLevel }`; `waterLevel` is `WATER_LEVEL` = -1.2 from `src/config.js`). `shallowFactor(depth)` = `1 - smoothstep(0, 2, depth)` (1 at depth 0, 0 at depth 2 and deeper, monotonic). `foamAmount(depth, t, x, z)` = `band(depth) * (0.35 + 0.65 * noise01(x, z, t))` with `band(d) = smoothstep(FOAM.dryEdge, FOAM.rise, d) * (1 - smoothstep(FOAM.fall0, FOAM.fall1, d))` (0 at the dry edge `d <= 0.02`, full between 0.08 and 0.25, 0 from 0.7) and `noise01 = 0.5 + 0.25 sin(0.8 x + 1.2 t) + 0.25 sin(0.6 z - 0.9 t + 0.3 x)`. `harbourCalm(x, z, town)` uses `town.areas.harbour` (`loadTown()` data, closed ring without repeated first point: close it with the first point when calling `distanceToPolyline` from `geometry.js`): 1 inside (`polygonContains`), `1 - smoothstep(0, 12, distance)` outside. `createWaterClock()` returns `{ t: 0, advance(dt, { reducedMotion }) }` with `t += dt * (reducedMotion ? 0.2 : 1)`. `foamGlsl()` and `waveGlsl()` return the GLSL source built from the SAME constants above (step 2 injects them).
- `src/world/water/depthData.js` (pure): `buildDepthData(heightField, { size = 512, extent = 340 } = {})` returns `{ data: Uint8Array(size * size), size, extent }` with `data[j * size + i] = round(255 * min(1, depthAt(x, z, heightField) / DEPTH_RANGE))` at the texel centre (`x = (i + 0.5) / size * 2 extent - extent`, same for z; one texel is 1.33 m); `decodeDepth(data, size, extent, x, z)` bilinear. The three module wraps it in a `DataTexture` (`RedFormat`, `UnsignedByteType`, linear filter, clamp to edge) in step 2.
- Tests: `waveHeightAt` is bounded by 0.19 at open sea (scan 200 points x 40 times) and its maximum over the scan exceeds 0.1 (not a constant 0); periodic: `waveHeightAt(x, z, t) == waveHeightAt(x, z, t + 12)` within 1e-9; not static: differs between t = 0 and t = 1 at 10 points; zero beyond the edge fade (`|x| = 340`) and `calm = 1` shrinks the amplitude to at most 0.16 of the open sea value (0.15 plus tolerance) while `calm = 0` is untouched; `waveNormalAt` has unit length and matches the finite-difference normal of `waveHeightAt` (step 0.01) within 1e-3; `shallowFactor` is 1 at 0, 0 at 2 and 3, monotonic non-increasing over 100 points; `foamAmount` is 0 for depth 0, for depth over 0.7 and (exactly) at depth 0.8, is positive somewhere in depth 0.08 to 0.25 for some t, never leaves 0..1; `depthAt` never negative, equals `waterLevel - h` for a stub field at depth 1, and reaches `DEPTH_RANGE` far outside the radius (`depthAt(900, 0)`); `harbourCalm` is 1 at the harbour polygon centroid, 0 at (0, 0), strictly between 0 and 1 6 m outside the polygon; `createWaterClock` after 10 s of `advance(0.05)` is 10 normally and 2 with `reducedMotion`; `foamGlsl()` and `waveGlsl()` contain every constant value; `buildDepthData` on the REAL town field: the plaza texel is 0, a texel at (320, 0) is 255 (deep), the depth along a beach ray from 240 m to 300 m is non-decreasing, and `decodeDepth` agrees with `depthAt` within 0.05 m at 30 points inside the island.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/water/waves.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/water/waves.js src/world/water/depthData.js`
- `node "{{runner}}/assert.mjs" has src/world/water/waves.js "waveHeightAt"`
- `node "{{runner}}/assert.mjs" has src/world/water/waves.js "harbourCalm"`

### Step 2: Water mesh, shader and boot wiring

Deliver:
- `tests/unit/water/waterMesh.test.js` first. `src/world/water/waterMesh.js` exports `waterGridCells(tier)` (cells per side over the square `-340..340`: high 170 = 4 m, medium 114 = 6 m, low 85 = 8 m; this is the ONLY place for the per-tier count and `TIER_SETTINGS` gets no new key), `buildWaterMeshes(town, heightField, { tier, getReducedMotion })` returning `{ group, near, ring, uniforms, stats }`: `near` is the grid (a flat grid at y 0 whose vertices carry the attribute `calm` = `harbourCalm` at the vertex, baked once; triangles `2 * cells^2`: 57.8k high, 26k medium, 14.5k low), `ring` is one 8-triangle frame from `|x|,|z| = 340` out to 1400 (so the sea reaches the sky dome at 850 m; it is flat because the edge fade makes the waves zero there; both meshes share ONE material, so 2 draw calls). The material is a `MeshStandardMaterial` (`roughness 0.12`, `metalness 0`, `transparent`, `depthWrite false`, `fog` true, `renderOrder 1`) patched with `onBeforeCompile` (decided: not a `ShaderMaterial`), so lights, the sun glint (the real `game.sun` directional light), fog and the Fresnel environment reflection (`scene.environment`; when it is null set `material.envMap = game.envTexture` if present, else nothing) come from three itself.
- Shader (all injected strings come from `waveGlsl()`, `foamGlsl()` and `WATER_COLORS`): uniforms `uTime` (seconds), `uMotion` (1, or 0.2 for the speed of the ripples), `uDepth` (the baked `DataTexture`), `uExtent` (340), `uDeep`, `uShallow`, `uFoam`, `uWaves[4]`; VERTEX: `y = waveHeight(position.xz, uTime) * (1 - 0.85 * calm) * edgeFade` (the same formula as the CPU, `calm` from the attribute), the analytic wave normal as a varying; FRAGMENT: depth from `texture2D(uDepth, (worldXZ + uExtent) / (2 * uExtent)).r * 6.0`, `shallow = 1 - smoothstep(0.0, 2.0, depth)`, `diffuseColor.rgb = mix(uDeep, uShallow, shallow)`, `diffuseColor.a = mix(0.92, 0.55, shallow)` (alpha 0.55 in the shallows, 0.92 deep), ripple normals = the wave normal plus two scrolling procedural layers (layer A: wavelength 2.3 m, direction (0.8, 0.6), speed 0.6; layer B: wavelength 1.1 m, direction (-0.5, 0.85), speed -0.9; each adds `strength * (cos(...) * dir)` to the xz normal, strength 0.12 and 0.08; no textures, no canvas), foam added as `diffuseColor.rgb = mix(diffuseColor.rgb, uFoam, foam)` and `diffuseColor.a = max(diffuseColor.a, foam)` using `foamGlsl()` and the sampled depth; the `#include <fog_fragment>` chunk stays. Tiers: low tier has no layer B and a constant 0.65 foam factor instead of the noise; reduced motion (`getReducedMotion()` from `quality.js`, sampled each frame) sets `uMotion` to 0.2 and the water clock advances at 0.2.
- `src/world/water.js` (the v1 file keeps its name and exports so `main.js` and `gameloop.js` keep their imports): `buildWater()` reads `game.heightField` (plan 033) and `loadTown()`, builds the group with `getTier()`, adds it to `game.worldRoot`, sets `game.waterMesh = group`, pushes `{ type: "water", name: "water", x: 0, y: WATER_LEVEL, z: 0, triangles }` into `game.areaObjects`, and is called in the `v1-world` load right after `buildTerrain()` (v1 order, never before it). `updateWater(dt, time)` keeps its signature (`dt` seconds, `time` milliseconds as in v1; `time` is ignored, the module owns a `createWaterClock()` and advances it with `dt`), writes `uTime` and `uMotion`, and exports `waterTime()`. The v1 plane and the use of `Assets.waterNormalTex` are removed: delete the `waterNormalTex` field and its generation (`dataNormalMap` call) from `src/engine/assets.js` if nothing else uses it, and `src/dev/worldHook.js` gains `waveHeight(x, z, t = waterTime())` (returns `waveHeightAt(x, z, t, { calm: harbourCalm })`) and `waterTime()`.
- Tests (`waterMesh.test.js`, Node, no GL): `waterGridCells` is 170, 114, 85 and strictly increasing; `buildWaterMeshes` builds at all three tiers, `near` triangle count equals `2 * cells^2` (high 57800), the low tier triangle count is below 30 percent of high, the `calm` attribute is finite, 1 at the harbour centroid and 0 at (0, 0), the `ring` has 8 triangles and starts at 340; the group has exactly 2 meshes sharing one material; `material.fog` is true and `transparent` true; running `material.onBeforeCompile` on a copy of `THREE.ShaderLib.standard` shader source (`{ uniforms: {}, vertexShader, fragmentShader }`) leaves `#include <fog_fragment>` in the fragment, injects the uniforms `uDepth`, `uTime`, `uDeep`, `uShallow`, `uFoam`, includes `foam` and the 0.55 and 0.92 alphas, and the low tier fragment does NOT contain `layerB` while high does; `updateWater(0.05, 0)` advances `waterTime()` by 0.05 and by 0.01 with reduced motion and does not throw; `buildWater` pushes one `water` record to `game.areaObjects`; none of `waterNormalTex` remains in `src/world/water.js`; the v1 `PlaneGeometry(TERRAIN_SIZE * 1.6` text no longer exists.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/water/waterMesh.test.js tests/unit/water/waves.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/water/waterMesh.js`
- `node "{{runner}}/assert.mjs" has src/world/water/waterMesh.js "onBeforeCompile"`
- `node "{{runner}}/assert.mjs" none src/world/water.js "waterNormalTex"`
- `node "{{runner}}/assert.mjs" none src/world/water.js "PlaneGeometry"`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "waveHeight"`
- `npm run lint`

### Step 3: Playwright, spots and a look

Deliver:
- Spots (ARCH 10.8: `y` is the absolute CAMERA height; add to `src/budgets.json` AND `src/shots.json` with identical `x, y, z, yaw, pitch`; append only; both ids are new; compute literal numbers once with a throwaway node script using `createTownHeightField(loadTown())`): `shore`: take the beach polygon centroid angle `theta`, outward unit vector `(dx, dz) = (cos theta, sin theta)`, scan outward from radius 240 for the first radius `Rw` where `heightAt <= -1.2`; camera at radius `Rw - 14`, `y = heightAt + 2.0`, `yaw = atan2(-dx, -dz)`, pitch -0.12. `harbour-water`: `Q` = the midpoint of `harbour.quay.points`, camera at `Q` moved 2 m landward (-x), `y = 0.4 + 2.2`, looking east over the basin (yaw -1.5708, pitch -0.2). A unit test `tests/unit/water/spots.test.js` asserts both ids exist in both files with equal numbers and the `shore` camera is on land (`heightAt` above 0).
- `tests/e2e/water.spec.js` (`?quality=high&time=0.4&freeze=1&seed=1337`, wait for `window.__world.ready`, every wait is `expect.poll(..., { timeout: 20000 })`): `listObjects()` has exactly one `water` record and no object named like the v1 plane; `waveHeight(x, z)` stays within 0.19 over 30 points and is not the same at two `waterTime()` values 1 s apart (poll until `waterTime()` has advanced by 1 s; the water clock runs under `freeze=1`); the harbour is calmer: the maximum `|waveHeight|` over 20 points inside the harbour polygon is at most 0.05 and over 20 open-sea points at least 0.05; `rendererInfo().triangles` includes the water (at the `shore` spot the water adds at least 40000 triangles on high; read `budgets.json` and assert `calls` within the desktop limit); zero console errors (a shader compile failure shows up here); `canvasLooksRendered`; a second run with `?quality=low` boots without errors and `rendererInfo().triangles` is lower than the high run (reduced motion is covered by the unit test of the clock).
- Shots: `npm run shots -- --spots shore,harbour-water --plan 035`; open each PNG in `docs/shots/035/` with the Read tool and fix a missing depth gradient (flat colour), no foam at the shoreline, a hard seam where the near grid meets the ring, wave displacement cracks or floating boats (best effort, never fails; list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/water/spots.test.js`
- `node "{{runner}}/assert.mjs" has src/budgets.json "harbour-water"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "shore"`
- `node "{{runner}}/assert.mjs" has src/shots.json "harbour-water"`
- `node "{{runner}}/assert.mjs" has src/shots.json "shore"`
- `npx playwright test tests/e2e/water.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/water/waves.test.js tests/unit/water/waterMesh.test.js tests/unit/water/spots.test.js`
- `npx playwright test tests/e2e/water.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): Look at docs/shots/035: judge the depth gradient, foam line, calm harbour and the horizon blend with the sky.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
