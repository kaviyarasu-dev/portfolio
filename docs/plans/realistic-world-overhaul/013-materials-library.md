# Plan 013: Shared PBR material library from CC0 Poly Haven textures

Epic E1. Estimated turns: 50.

## Goal

Give every later plan a named set of realistic surfaces instead of flat vertex colours: about 22 CC0 PBR texture sets from Poly Haven packed to WebP (512 for phones, 1k default, 2k only for four hero sets), a `getMaterial(name, opts)` registry that picks the texture size from the quality tier, and metric UV mapping so walls and floors tile at a real-world scale. In Node (unit tests) materials work without textures.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 10.2 and requirement R3, decision D29)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/assets/packMaterial.mjs
- scripts/assets/polyhaven.mjs
- scripts/search-assets.mjs
- src/engine/quality.js
- src/engine/assets.js
- src/dev/fixtures/index.js
- docs/world-conventions.md

High-risk assumptions that touch this plan (each has a step that checks it):
- D21 look risk: South Indian surfaces (pastel painted plaster, terracotta roof tile, red-oxide floors, coarse stucco) must come from generic CC0 textures plus a tint, so the registry stores a `tint` per material; the person judges the look (human check).

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Batch tool and the texture sets

Deliver:
- `scripts/assets/packMaterialList.mjs <list.json>`: for each `{ name, queries: [..], tags: [..], hero }` search Poly Haven textures (`searchAssets`) with each query, and try up to 3 candidate ids in order through `packMaterial` (the attempt counter of plan 005 applies per element `mat-<name>`); print one JSON line per material with the chosen id, or `{ name, ok: false, reason }`; write the summary to `assets/textures/INDEX.json` (name, polyhavenId, sizes) and ledger it. Unit test with a fake search and fake pack function: first candidate fails, second succeeds; all three fail gives `ok:false`.
- Write `scripts/assets/materials.list.json` with these 22 names and search hints (queries are hints; choose by what the API returns): `plaster` (painted plaster wall, smooth), `stucco` (rough exterior plaster), `concrete`, `roofTile` (terracotta roof tiles), `floorTile` (ceramic floor tiles, hero), `floorTileDark`, `woodPlanks` (wooden floor, hero), `woodDark` (dark varnished wood), `brick`, `stoneRough`, `stonePaving` (cobbles or paving), `fabric`, `carpet`, `metalBrushed`, `metalPainted`, `marble` (hero), `gravel`, `sand`, `grass`, `dirtRoad` (dirt or mud ground), `rockCliff`, `thatch` (dry grass or straw if available; may fall back). `plaster` is also hero. Run the batch (network). Accept the result when at least 18 of the 22 packed; list the failed ones in your report.
- `tests/unit/materials/sets.test.js`: `assets/textures/INDEX.json` parses; at least 18 sets; for each set the `512` and `1k` folders each contain `color.webp`, `normal.webp`, `rough.webp`; the four hero sets also have `2k`; every file is in the ledger (read `assets/LEDGER.json` directly); total size of `assets/textures` is under 30 MB.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/materials/sets.test.js`
- `node "{{runner}}/assert.mjs" exists assets/textures/INDEX.json scripts/assets/packMaterialList.mjs`

### Step 2: Metric UVs and the material registry

Deliver:
- `tests/unit/materials/uv.test.js` and `tests/unit/materials/registry.test.js` first.
- `src/util/uv.js`: `applyMetricUV(geometry, metersPerTile = 2)` rewrites the `uv` attribute so one texture tile covers `metersPerTile` metres: for each vertex pick the dominant axis of its normal (x, y or z) and use the other two position components divided by `metersPerTile` (u horizontal, v vertical with y up for walls). Works on indexed and non-indexed geometry, on `BoxGeometry`, `PlaneGeometry` and custom geometry that has a normal attribute; throws a clear error when `normal` is missing. Test: a 4 m by 3 m by 0.2 m box has a front-face u range of 2 and v range of 1.5 for `metersPerTile` 2.
- `src/engine/materials.js`: `MATERIAL_SPECS` (name -> `{ set, tint, roughness, metalness, metersPerTile, normalScale, envMapIntensity }`; `set` is the folder name under `assets/textures/` or `null` for a flat fallback) for all 22 names plus non-textured `glass` (physical, transmission off, opacity 0.25, roughness 0.05), `emissiveWarm`, `emissiveCool`; `getMaterial(name, { tint, heroSize } = {})` returns a shared `MeshStandardMaterial` per (name, tint, size) key; `registerMaterial(name, spec)`; `MATERIAL_NAMES`; `disposeUnused()`. Textures load lazily with `TextureLoader` from `assetUrl('textures/<set>/<size>/color.webp')`, color map `SRGBColorSpace`, anisotropy 4 (8 on high), repeat wrapping; the size follows `TIER_SETTINGS[getTier()].textureSize` (or `heroTextureSize` for hero sets) and every live material swaps its maps when the tier changes, disposing the old textures.
- Headless rule: when `typeof document === 'undefined'` no texture is requested and the material keeps its flat `color` (tinted). Tests: same name and tint return the same instance; different tint returns a different one; unknown name throws; spec table covers every name in `INDEX.json`; a material in Node has `map === null`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/materials/uv.test.js tests/unit/materials/registry.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/materials.js src/util/uv.js`

### Step 3: Materials fixture and Playwright check

Deliver:
- `src/dev/fixtures/materials.js`: a grid of 1.2 m cubes, one per material name, 2 m apart in rows of 6, each on a pedestal, lit by the normal sun; each cube uses `applyMetricUV` with the spec scale. Register the fixture `materials` and set `listObjects()` (hook) to include `{ type: 'material-sample', name }` for each.
- `tests/e2e/materials.spec.js`: open `?fixture=materials&quality=medium`; wait for ready and 3 s; `listObjects()` has one sample per `MATERIAL_NAMES` entry; at least 15 distinct texture ids are reported by `rendererInfo().textures` or at least 15 (`textures` count) are loaded; zero console errors; then `?quality=low` loads fewer or smaller textures (compare `rendererInfo().textures` not larger than medium).
- Visual self-review (best effort): if `npm run shots` exists use it, otherwise take one Playwright screenshot of the fixture into `docs/shots/013/`, open it with the Read tool, and note flat or obviously wrong surfaces.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/materials.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/materials.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/materials/sets.test.js tests/unit/materials/uv.test.js tests/unit/materials/registry.test.js`
- `npx playwright test tests/e2e/materials.spec.js`
- `npm run check:size`

Human check (goes in the report, never blocks): Look at the materials fixture (`npm run dev`, open `?fixture=materials`): do the surfaces look like believable plaster, tile, wood, stone?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Fewer than 18 texture sets could be packed because Poly Haven was unreachable: BLOCKED.md.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
