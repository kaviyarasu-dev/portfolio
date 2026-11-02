# Plan 030: Replace selected code-built props with CC0 Poly Haven models where a good one exists

Epic E2. Estimated turns: 50.

## Goal

Raise realism of the most visible furniture: let the prop catalog use optimized GLB models from Poly Haven (CC0) for selected types, with the code-built version as the always-available fallback (phone tier, headless tests, failed downloads). Acquire what Poly Haven offers for about 28 target types within the 3-source cap, optimize each (1k textures, meshopt), ledger it, and prove loading works. Success does not depend on how many are found; what is found must be correct.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 10.1, 10.2 and decision D2, D11, A29)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- scripts/assets/packModel.mjs
- scripts/search-assets.mjs
- scripts/assets/polyhaven.mjs
- src/dev/fixtures/props.js
- src/engine/quality.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Catalog support for GLB-backed props

Deliver:
- `tests/unit/props/glbProps.test.js` first. `src/world/props/glbProps.js`: reads `src/world/props/glbProps.json` (array of `{ type, file, scale, rotY, offset: [x, y, z], source }`); `registerGlbOverrides(catalog, entries)` marks catalog types as GLB-backed; `preloadProps(types, { loader })` loads the needed GLBs once (GLTFLoader with `MeshoptDecoder`), caches the parsed scene and returns a promise; `buildProp` clones the cached scene (shared geometry and materials), applies scale, rotation and offset so the result has the same origin convention and fits the declared `size` within 15 percent, and copies `userData` (`seats`, `solid`, `lightSockets`) from the code-built meta. When `typeof document === 'undefined'`, when the tier is `low`, when a GLB is missing or failed to load, `buildProp` silently uses the code-built builder.
- Tests with a GLB fixture created in the test with gltf-transform (a box with a texture): override applied, size fit scaling, userData copied, fallback in Node, fallback after a failed preload (loader throws), cache loads once for ten builds.
- Extend the building context so `buildBuilding` awaits `preloadProps(distinct types of the manifest)` before building when running in the browser (it is async anyway through the streamer); headless tests are unchanged.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/glbProps.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/glbProps.js`

### Step 2: Acquire hero models from Poly Haven

Deliver:
- Write `scripts/assets/packModelList.mjs <list.json>` (like `packMaterialList`): for each target `{ type, queries, categories, tags, maxTriangles }` search Poly Haven models, try up to 3 candidates (attempt cap per element `model-<type>`), run `packModel` into `assets/models/props/<type>.glb`, measure the bounding box with `readGlbInfo`, compute `scale` so the model height matches the declared catalog height, write the entry into `src/world/props/glbProps.json`. A candidate is rejected when it is over 1.5 MB, over 25000 triangles, or its aspect (width to height) differs from the declared size by more than 45 percent. Unit test with fake search and pack functions: reject by size, reject by aspect, accept the second candidate.
- Write `scripts/assets/heroProps.list.json` with these 28 targets (type: search hints): sofa-3 (sofa), armchair (armchair), chair-dining (dining chair), chair-wooden (wooden chair), table-coffee (coffee table), table-dining-4 (dining table), table-side (side table), table-bedside (nightstand), bookshelf-tall (bookshelf), cabinet-low (cabinet, sideboard), drawer-chest (drawers), lamp-table (table lamp), lamp-floor (floor lamp), plant-potted-large (potted plant, ficus), plant-potted-small (plant pot), fern-pot (fern), flower-vase (vase), vase-floor (large vase), mirror-wall (mirror), wall-clock (clock), picture-frame-set (picture frame), bed-king (bed), toilet (toilet), washbasin-pedestal (sink), bathtub (bathtub), tv-stand (tv cabinet), rug-rect (carpet), brass-urn (brass pot or urn). Run it. Poly Haven only has some of them; the rest keep the code-built version.
- `tests/unit/props/glbProps.assets.test.js`: every entry in `glbProps.json` has an existing file under `assets/models/props/`, a ledger entry (read `assets/LEDGER.json`), a catalog type that exists, a `scale` between 0.001 and 100, file size at most 1.5 MB, the sum of all GLBs at most 20 MB, `source` an https Poly Haven URL.
- A type without a model is not a failure: put the list of found and not-found types in the final report under `context`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/glbProps.assets.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/packModelList.mjs scripts/assets/heroProps.list.json src/world/props/glbProps.json`
- `npm run check:ledger`

### Step 3: Browser check, budget and a look

Deliver:
- `tests/e2e/glb-props.spec.js`: `?fixture=props&quality=high`: all registered types appear in `listObjects()`; the number of GLB-backed props loaded (`__world.propsStats()` returns `{ glb, code, failed }`) equals the entries of `glbProps.json` whose file loads, `failed` is 0; with `?quality=low` `glb` is 0 and `code` equals the full count; zero console errors. Add `propsStats()` to the hook.
- `npm run check:size` (total under 80 MB) and `npm run check:budget` still pass. `npm run shots -- --fixture props --plan 030`, view the PNG, note which props look better and which look wrong (wrong scale, rotated, flipped); fix by editing the entry (`scale`, `rotY`, `offset`) or remove an entry whose model looks bad (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/glb-props.spec.js`
- `npm run check:size`
- `npm run check:ledger`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/glbProps.test.js tests/unit/props/glbProps.assets.test.js tests/unit/props/allProps.test.js`
- `npx playwright test tests/e2e/glb-props.spec.js`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Check the props fixture: do the Poly Haven models look right in place (scale, orientation)?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Poly Haven unreachable for all candidates: do not block; finish with an empty `glbProps.json` array and say so in the report. Block only when the code itself cannot be made to work.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
