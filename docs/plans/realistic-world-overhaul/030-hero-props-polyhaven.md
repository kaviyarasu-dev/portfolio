# Plan 030: Replace selected code-built props with CC0 Poly Haven models where a good one exists

Epic E2. Estimated turns: 60.

## Goal

Raise realism of the most visible furniture: let the prop catalog use optimized GLB models from Poly Haven (CC0) for selected types, with the code-built version as the always-available fallback (phone tier, headless tests, failed downloads). Acquire what Poly Haven offers for 28 target types within the 3-source cap, optimize each (1k textures, meshopt), ledger it, and prove loading works. Success does not depend on how many are found; what is found must be correct.

Decisions fixed here. (1) Which types may be GLB-backed: only floor-mounted types without `animated` or `textSlots` metadata. Wall-mounted types (`mirror-wall`, `wall-clock`, `picture-frame-set`) are excluded, and so is every type that plan 061 or a building plan drives (`wall-clock` has hands driven by plan 061, `fan-ceiling` spins, `menu-board` and the signs carry text slots): `registerGlbOverrides` refuses them. Per-build data (tint, variant, text slots) is lost for GLB props, so types that depend on it are never in the list. `lamp-table` and `lamp-floor` keep their `lightSockets`, copied from the code-built metadata. (2) The GLB is placed so that, after scale, rotation `rotY` and `offset`, its bounding box centre in x and z is 0, its lowest y is 0 (origin = floor centre, the same convention as every prop) and its front looks toward +z. (3) In Node the GLB path never runs by accident: it runs only when a test passes `force: true` together with a fake `loader`; the real `GLTFLoader` (with `MeshoptDecoder`) is used only in the browser. (4) All 28 candidates come from ONE source, Poly Haven, so the 3-source cap of plan 005 does not apply per candidate; this plan has its own cap of 3 candidates per type.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 10.1, 10.2, 10.8 and decision D2, D11, A29)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/index.js
- src/world/kit/building.js
- src/dev/fixtures/props.js
- src/dev/worldHook.js
- src/engine/quality.js
- src/util/assetUrl.js
- scripts/assets/packModel.mjs
- scripts/assets/optimize.mjs
- scripts/search-assets.mjs
- scripts/assets/polyhaven.mjs
- scripts/lib/ledger.mjs
- scripts/ledger-add.mjs
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Catalog support for GLB-backed props

Deliver:
- `tests/unit/props/glbProps.test.js` first. `src/world/props/glbProps.json` is created as `[]` in this step. Entry schema: `{ "type": "sofa-3", "file": "models/props/sofa-3.glb", "scale": 1.0, "rotY": 0, "offset": [0, 0, 0], "source": "https://polyhaven.com/a/<id>" }` where `file` is the path under `assets/` and the URL is `assetUrl(file)`; `scale` is a uniform factor applied to the raw GLB, `rotY` radians, `offset` metres added after centring (see decision 2). `src/world/props/glbProps.js` (a leaf module: it imports three, `GLTFLoader`, `MeshoptDecoder` from `three/addons`, `assetUrl` and the JSON, never the catalog) exports: `GLB_ENTRIES` (the parsed JSON), `validateGlbEntry(entry)` (returns an array of problems: `type` kebab case, `file` equal to `models/props/<type>.glb`, `scale` between 0.001 and 100, `rotY` finite, `offset` three finite numbers, `source` an https `polyhaven.com` URL), `glbEnabled({ tier, force = false })` (false when `tier === "low"`; false when `typeof document === "undefined"` unless `force`), `registerGlbOverrides(entries, { getMeta })` (stores the map type to entry; throws `Error("GLB override not allowed for <type>: <reason>")` for an unknown type, `mount` other than `floor`, or metadata with `animated` or `textSlots`), `hasOverride(type)`, `preloadProps(types, { loader, force = false, tier } = {})` returning `Promise<{ loaded: string[], failed: string[] }>`, `getGlbTemplate(type)`, `noteBuild(kind, type)`, `propsStats()` and `resetPropsStats()`.
- `preloadProps`: skips types without an override and types already cached; resolves immediately with empty lists when `glbEnabled({ tier, force })` is false; otherwise loads every needed GLB ONCE (the default `loader` is created lazily in the browser: `new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)`; any object with `loadAsync(url)` resolving to `{ scene }` is accepted, which is the seam for tests) and stores a prepared TEMPLATE: the loaded scene wrapped in a Group, scaled by `scale`, rotated by `rotY`, translated so the bounding box centre x and z is 0 and its lowest y is 0, then moved by `offset`. A load error or a thrown loader puts the type into `failed` (one `console.warn` naming the type, no throw) and the type stays code-built. `propsStats()` returns `{ glbBuilt, codeBuilt, fallbacks, entries, loaded, failed }`: `glbBuilt` counts `buildProp` calls served from a template, `codeBuilt` counts the other `buildProp` calls, `fallbacks` counts calls for a type that HAS an override but was served by code (low tier, failed or not yet loaded GLB), `entries` is the number of registered overrides, `loaded` the number of cached templates, `failed` the number of failed types (counts since page load, `resetPropsStats()` zeroes the three call counters).
- `src/world/props/catalog.js`: `buildProp(type, { rng, tint, variant = 0, tier, rawParts = false, glb } = {})` gets the extra option `glb` (`false` forces the code-built path; `{ force: true }` allows the GLB path in Node for tests). `tier` defaults to `getTier()` from `quality.js` (guarded so Node keeps working). When `hasOverride(type)`, `glbEnabled({ tier, force: glb && glb.force })` and a cached template exist, `buildProp` returns `template.clone(true)` (geometry and materials are shared) as a Group whose `userData` is copied from the code-built metadata (`propType`, `size`, `solid`, `seats`, `topY`, `mount`, `lightSockets`, and the rest of `meta`) plus `userData.glb = true`, WITHOUT running the code builder; otherwise the code-built path runs. Both paths call `noteBuild`. `src/world/props/index.js` calls `registerGlbOverrides(GLB_ENTRIES, { getMeta: getPropMeta })` once after all sets are imported. The module headless rule holds: importing these files in Node touches no `window`, `document` or WebGL.
- Preload wiring. `src/world/kit/building.js` (plan 021) exports `distinctPropTypes(manifest)` (sorted list of every `objects[].type` of all rooms) and `async preloadBuildingProps(manifest, ctx)` which awaits `preloadProps(distinctPropTypes(manifest), { tier: ctx.tier })`. `buildBuilding` itself stays synchronous: every caller that builds a building in the browser awaits `preloadBuildingProps` first, so edit the existing callers: the building fixtures under `src/dev/fixtures/` and `src/dev/fixtures/props.js` (which awaits `preloadProps(listPropTypes(), { tier })` before it lays the props out). Callers added by later plans (areas, streamer loaders) do the same (a convention noted in ARCHITECTURE 10.8). The real building context passes `tier` to `buildProp` (`ctx.tier`). Add the hook field `propsStats()` returning the object of `propsStats()` (`src/dev/worldHook.js`).
- Tests (write first). Use a fake scene built in the test (a Group with one Mesh of `BoxGeometry(2, 1, 1)` and a plain material) and a fake loader `{ loadAsync: async () => ({ scene }) }`; gltf-transform is not needed and `GLTFLoader` is never run in Node. Cases: `registerGlbOverrides` accepts a floor type and refuses `wall-clock` (animated or wall), a `mirror-wall` and a type with `textSlots`, and an unknown type; `validateGlbEntry` accepts a good entry and rejects each bad field; in Node without `force` `preloadProps` returns empty lists and `buildProp` returns the code-built object (`userData.glb` undefined); with `force: true` and the fake loader the override is applied: the template bounding box has centre x and z within 0.001 of `offset` x and z and min y within 0.001 of `offset` y, `scale` and `rotY` are applied (a `rotY` of PI / 2 swaps the x and z extents), `userData.seats`, `solid`, `lightSockets` equal the code-built metadata, geometry and material objects are shared between two builds (same instance); a loader that throws gives `failed` containing the type, no exception, and `buildProp` falls back to code; the loader is called exactly once for ten builds; `tier: "low"` with `force: true` still builds by code; `propsStats()` counts after a known sequence (for example 2 GLB builds, 1 code build, 1 fallback). `tests/unit/props/allProps.test.js` stays green with the empty `glbProps.json`. Static source check: `has src/world/props/glbProps.js "MeshoptDecoder"` and `"GLTFLoader"`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/glbProps.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/glbProps.js src/world/props/glbProps.json`
- `node "{{runner}}/assert.mjs" has src/world/props/glbProps.js "MeshoptDecoder"`
- `node "{{runner}}/assert.mjs" has src/world/props/glbProps.js "GLTFLoader"`
- `node "{{runner}}/assert.mjs" has src/world/kit/building.js "preloadBuildingProps"`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "propsStats"`
- `npm run lint`

### Step 2: Acquire hero models from Poly Haven

Deliver:
- Ledger removal (plan 005 provides it): `scripts/lib/ledger.mjs` exports `removeEntry(file, { ledgerPath })` and `node scripts/ledger-add.mjs --remove <assets/file>` removes one ledger entry (it never deletes the file). This plan uses `removeEntry` when a packed candidate is rejected. Read both files first. If `removeEntry` is somehow missing, add it (it is small) and a case in a NEW test file `tests/unit/scripts/ledger-remove.test.js`; do not edit the frozen ledger test.
- Write `scripts/assets/heroProps.list.json`: an array of `{ "type", "queries": [...], "category": "<poly haven model category or null>", "maxTriangles": 25000 }` with exactly these 28 targets (type: queries, category): sofa-3: sofa, couch (furniture); sofa-2: sofa, loveseat (furniture); armchair: armchair, lounge chair (furniture); chair-dining: dining chair, chair (furniture); chair-wooden: wooden chair, chair (furniture); table-coffee: coffee table (furniture); table-dining-4: dining table (furniture); table-side: side table, end table (furniture); table-bedside: nightstand, bedside table (furniture); bookshelf-tall: bookshelf, bookcase, shelf (furniture); cabinet-low: sideboard, cabinet (furniture); drawer-chest: drawers, chest of drawers, dresser (furniture); wardrobe: wardrobe, closet (furniture); desk-wood: desk, writing desk (furniture); lamp-table: table lamp, desk lamp (lighting); lamp-floor: floor lamp, standing lamp (lighting); plant-potted-large: potted plant, ficus, houseplant (plants); plant-potted-small: plant pot, succulent (plants); fern-pot: fern (plants); flower-vase: vase, flower vase (decorative); vase-floor: large vase, floor vase (decorative); bed-king: bed, double bed (furniture); toilet: toilet (bathroom); washbasin-pedestal: sink, wash basin (bathroom); bathtub: bathtub (bathroom); tv-stand: tv stand, tv cabinet, media console (furniture); rug-rect: rug, carpet (decorative); brass-urn: brass pot, urn, brass vase (decorative). The category names are best guesses: first list the real ones with a throwaway script under `scripts/dev/` that calls `fetchJson("https://api.polyhaven.com/categories/models")` from `scripts/lib/net.mjs` (delete it afterwards) and correct the names; a search with a category that returns nothing is repeated without the category.
- `scripts/assets/packModelList.mjs` exports `packModelList({ list, search, pack, readInfo, getMeta, only, log, glbPropsPath, rejectedPath, ledgerPath, assetsRoot, root })` (every dependency injectable so the unit test needs no network; defaults are the real `searchAssets` of `scripts/assets/polyhaven.mjs`, a wrapper around the `packModel` function or `main(argv)` export of `scripts/assets/packModel.mjs` (read it; add a named export if there is none), `readGlbInfo` and `getPropMeta`) and a CLI `node scripts/assets/packModelList.mjs scripts/assets/heroProps.list.json [--only a,b]`. Exported constants `MAX_CANDIDATES = 3`, `PRE_ASPECT_TOL = 0.45`, `FIT_TOL = 0.25`, `MAX_MB = 1.5`. Algorithm per target (skip targets not in `only`; IDEMPOTENT: skip a type that already has an entry in `glbProps.json` whose file exists, and a type with 3 or more ids in `scripts/assets/heroProps.rejected.json`, a file created as `{}`): (1) candidates = the union, in Poly Haven API order, of `search({ type: "models", query, category })` for each query, without duplicates, minus ids already rejected for this type, minus candidates whose API `polycount` is over `maxTriangles`; (2) take at most `MAX_CANDIDATES` candidates for this run; for each: run `pack` with the id, name `props/<type>` (output `assets/models/props/<type>.glb`; if packModel rejects a name with a slash, relax its name check to allow a single `props/` prefix, with a case in a NEW test file), element `model-<type>`, `--max-mb 1.5 --max-tris 25000` (packModel defaults are 3 MB and 60000); `pack` writes the file and its ledger entry; (3) `readInfo(file)` gives `size [x, y, z]`; PRE-check: raw aspect `max(x, z) / y` against the declared `max(w, d) / h` of `getMeta(type).size` must be within `PRE_ASPECT_TOL` (relative); (4) scale: `scale = declaredHeight / y`; for flat types (declared height under 0.1, `rug-rect`) `scale = declared max(w, d) / max(x, z)`; (5) try `rotY` 0 and PI / 2, the dimensions after scale being `(x * scale, z * scale)` or swapped; pick the rotation with the smaller `max(abs(sx / w - 1), abs(sz / d - 1))`; REJECT when that error is over `FIT_TOL` (width and depth within 25 percent of the declared size after scaling by height); (6) on reject: delete the output GLB (`fs.rm`), call `removeEntry` for its ledger entry, append the id to `heroProps.rejected.json` under the type and try the next candidate; on accept write the entry `{ type, file, scale (rounded to 5 decimals), rotY, offset: [0, 0, 0], source: "https://polyhaven.com/a/<id>" }` into `glbProps.json` (kept sorted by type) and stop for this type. `log` receives one line per decision. The function returns `{ found: [types], notFound: [types], rejected: { type: [ { id, reason } ] } }` and the CLI prints that as one JSON line.
- `tests/unit/scripts/packModelList.test.js` first, with fake `search`, `pack` (writes a tiny file and records ledger add calls), `readInfo`, `getMeta` and temp folders: a candidate over the size or triangle limit (the fake `pack` throws) is skipped and the next one is used; reject by pre-aspect; reject by fit (after scaling the depth is off by more than 25 percent); accept the second candidate (the first one is deleted from disk, its ledger entry removed, its id written to the rejected file); at most 3 candidates are tried per run even when 10 exist; a rerun skips a type that is already in `glbProps.json` with its file present and skips ids in the rejected file; `only` limits the types; a flat type scales by width; `rotY` PI / 2 is chosen when the model is turned; `glbProps.json` stays sorted; and the list file `scripts/assets/heroProps.list.json` has exactly the 28 types above, each with at least one query, each registered in the catalog (`listPropTypes()`), none wall-mounted or animated.
- Run it in chunks, ONE command per call (rule 14), `timeout_min` 20 each: `node scripts/assets/packModelList.mjs scripts/assets/heroProps.list.json --only sofa-3,sofa-2,armchair,chair-dining,chair-wooden,table-coffee,table-dining-4`, then `--only table-side,table-bedside,bookshelf-tall,cabinet-low,drawer-chest,wardrobe,desk-wood`, then `--only lamp-table,lamp-floor,plant-potted-large,plant-potted-small,fern-pot,flower-vase,vase-floor`, then `--only bed-king,toilet,washbasin-pedestal,bathtub,tv-stand,rug-rect,brass-urn`. Poly Haven only has some of them; the rest keep the code-built version. If Poly Haven cannot be reached at all, finish with `glbProps.json` as `[]` and say so in the report (do not block).
- `tests/unit/props/glbProps.assets.test.js` (passes with an empty array): for every entry of `glbProps.json`: `validateGlbEntry` has no problems, the file exists under `assets/models/props/`, `assets/LEDGER.json` has an entry for `assets/<file>` with licence `CC0` and a `sourceUrl` equal to the entry `source`, the catalog type exists and is accepted by `registerGlbOverrides` rules, the file is at most 1.5 MB, the sum of all GLBs is at most 20 MB, and the fit rule holds again on the real file (`readGlbInfo` size, `scale` and `rotY` applied: width and depth within `FIT_TOL + 0.01` of the declared size, height within 0.02 of the declared height, flat types by width); every `.glb` under `assets/models/props/` has an entry (no orphan files). The test prints the number of entries with `console.info` but does not require a minimum.
- Report: put the lists of found and not-found types in the final report under `context`. If FEWER THAN 12 of the 28 types were found, add "only N of 28 hero models found" to `not_done` (the run stops so a person can decide); the acceptance commands still pass in that case.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/packModelList.test.js tests/unit/props/glbProps.assets.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/packModelList.mjs scripts/assets/heroProps.list.json scripts/assets/heroProps.rejected.json src/world/props/glbProps.json`
- `npm run check:ledger`

### Step 3: Browser check, budget and a look

Deliver:
- `tests/e2e/glb-props.spec.js` (collect `console` errors and `pageerror`, assert none; no fixed waits): test 1 `?fixture=props&quality=high&time=0.4&freeze=1`: wait for `ready`; read `n = listObjects().length` (every registered type once) and `s = propsStats()` (poll until `s.loaded + s.failed === s.entries`, timeout 60000); `s.glbBuilt + s.codeBuilt === n`; `s.failed === 0`; `s.glbBuilt === s.loaded`; when `s.entries >= 1` then `s.glbBuilt >= 1` (the GLB path really ran, not a tautology); `s.fallbacks === 0`. Test 2 `?fixture=props&quality=low&time=0.4&freeze=1`: `s.glbBuilt === 0`, `s.codeBuilt === n`, `s.fallbacks === s.entries`. Test 3 (only when `entries >= 1`, otherwise `test.skip`): on high the first entry type appears in `listObjects()` and `rendererInfo().triangles` is a number.
- `npm run check:size` (total under 80 MB), `npm run check:ledger` and `npm run check:budget` must pass (run all three; ledger must show no entry for a deleted GLB). `npm run shots -- --fixture props --plan 030`, open the PNGs with the Read tool, and note which props look better and which look wrong (wrong scale, rotated, flipped, floating or sunk): fix by editing the entry in `glbProps.json` (`scale`, `rotY`, `offset`), or REMOVE a bad model entirely: delete its entry in `glbProps.json`, delete the file `assets/models/props/<type>.glb`, and run `node scripts/ledger-add.mjs --remove assets/models/props/<type>.glb` (best effort, the unit tests must stay green).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/glb-props.spec.js`
- `npm run check:size`
- `npm run check:ledger`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/glbProps.test.js tests/unit/props/glbProps.assets.test.js tests/unit/scripts/packModelList.test.js tests/unit/props/allProps.test.js`
- `npx playwright test tests/e2e/glb-props.spec.js`
- `npm run check:ledger`
- `npm run check:size`
- `npm run check:budget`

Human check (goes in the report, never blocks): Check the props fixture: do the Poly Haven models look right in place (scale, orientation)?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Poly Haven unreachable for all candidates: do not block; finish with an empty `glbProps.json` array and say so in the report. Block only when the code itself cannot be made to work.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
