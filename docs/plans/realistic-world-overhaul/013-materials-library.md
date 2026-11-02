# Plan 013: Shared PBR material library from CC0 Poly Haven textures

Epic E1. Estimated turns: 60.

## Goal

Give every later plan a named set of realistic surfaces instead of flat vertex colours: 22 CC0 PBR texture sets from Poly Haven packed to WebP (512 for phones, 1k default, 2k only for the four hero sets), a `getMaterial(name, opts)` registry with 25 built-in names that picks the texture size from the quality tier, and metric UV mapping so walls and floors tile at a real-world scale. In Node (unit tests) materials work without textures.

Naming rule used by every file of this plan (so nothing clashes with the kebab-case regexes of plans 005 and 006): a material has a camelCase `name` (what manifests and plans write: `roofTile`, `woodDark`) and a kebab-case `set` (the folder under `assets/textures/`: `roof-tile`, `wood-dark`; it matches `/^[a-z][a-z0-9-]{1,40}$/`). The attempt-counter element for the CLIs is `mat-<set>` (for example `mat-roof-tile`). `set` is `null` in a spec when the material has no texture set.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 10.2, 10.5, 10.8 and requirement R3, decision D29)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/assets/packMaterial.mjs
- scripts/assets/packTextureSet.mjs
- scripts/assets/polyhaven.mjs
- scripts/search-assets.mjs
- scripts/lib/ledger.mjs
- scripts/lib/ledgerRules.mjs
- src/engine/quality.js
- src/engine/assets.js
- src/util/assetUrl.js
- src/dev/fixtures/index.js
- src/dev/fixtures/blank.js
- src/dev/worldHook.js
- src/state.js
- docs/world-conventions.md

High-risk assumptions that touch this plan (each has a step that checks it):
- D21 look risk: South Indian surfaces (pastel painted plaster, terracotta roof tile, red-oxide floors, coarse stucco) must come from generic CC0 textures plus a tint, so the registry stores a `tint` per material and callers may pass their own; the person judges the look (human check).
- Network: 22 Poly Haven downloads do not fit in one command; the batch tool is idempotent and is run in chunks (step 2).

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Material list and the batch packing tool (unit tested, no network)

Deliver:
- `scripts/assets/materials.list.json` is a JSON array of `{ name, set, queries, hero, required }`, exactly these 22 entries (`name`, `set`, `queries` in the order they are tried, flags). `plaster`, `plaster`, [plaster, painted wall, stucco smooth], hero, required. `stucco`, `stucco`, [stucco, rough plaster, plaster rough], required. `concrete`, `concrete`, [concrete, concrete wall, cement], required. `roofTile`, `roof-tile`, [roof tiles, roof_tiles, terracotta], required. `floorTile`, `floor-tile`, [floor tiles, tiles, ceramic], hero, required. `floorTileDark`, `floor-tile-dark`, [dark tiles, floor tiles dark, slate tiles]. `woodPlanks`, `wood-planks`, [wood floor, wood planks, planks], hero, required. `woodDark`, `wood-dark`, [dark wood, wood table, varnished wood, walnut], required. `brick`, `brick`, [brick, red brick, brick wall], required. `stoneRough`, `stone-rough`, [rock wall, rough stone, stone wall]. `stonePaving`, `stone-paving`, [cobblestone, paving stones, stone floor, pavement], required. `fabric`, `fabric`, [fabric, cloth, upholstery, canvas]. `carpet`, `carpet`, [carpet, rug]. `metalBrushed`, `metal-brushed`, [brushed metal, metal plate, steel]. `metalPainted`, `metal-painted`, [painted metal, metal, corrugated]. `marble`, `marble`, [marble], hero, required. `gravel`, `gravel`, [gravel, pebbles]. `sand`, `sand`, [sand, beach sand], required. `grass`, `grass`, [grass, lawn, grass ground], required. `dirtRoad`, `dirt-road`, [dirt, mud, dirt road, soil], required. `rockCliff`, `rock-cliff`, [rock, cliff, rock face, rocky terrain], required. `thatch`, `thatch`, [thatch, straw, dry grass] (not required, may fail). `hero: true` on exactly four entries (plaster, floorTile, woodPlanks, marble: 2k is packed for these), `required: true` on exactly 14 (plaster, stucco, concrete, roofTile, floorTile, woodPlanks, woodDark, brick, stonePaving, marble, sand, grass, dirtRoad, rockCliff). Queries are hints: they only matter as search words.
- `tests/unit/scripts/packMaterialList.test.js` first. `scripts/assets/packMaterialList.mjs` exports: `loadList(path)` (validates: names unique camelCase `/^[a-z][A-Za-z0-9]{1,30}$/`, `set` matches the kebab regex above, 4 heroes, 14 required); `pickCandidates(entry, searchResults, usedIds)` (searchResults = array of arrays of `{ id }`, one per query in order; concatenate in query order, drop duplicates and every id in `usedIds` (ids already chosen for another material in this run or in INDEX.json), keep the first 3); `packMaterialList({ entries, only = null, force = false, search, pack, assetsRoot, indexPath })` and `main(argv)`. `search(query)` returns `[{ id }]` and `pack({ id, name, set, element, hero })` returns `{ ok, reason? }`; both are injected in tests. The defaults are `defaultSearch(query)` = `searchAssets({ type: 'textures', query, limit: 10 })` from `scripts/assets/polyhaven.mjs`, and `defaultPack` = run `node scripts/assets/packMaterial.mjs <id> <set> --element mat-<set> [--hero] [--assets-root ..] [--ledger ..]` as a child process with `child_process.execFileSync(process.execPath, [...])` (so it does not matter how plan 006 exported its main), ok when the exit code is 0, otherwise `ok:false` with the last stderr line as reason.
- Behaviour of `packMaterialList`: process `entries` in list order (only those named in `only`, an array, when given). For each entry: when `INDEX.json` already has the entry and every `<assetsRoot>/textures/<set>/<size>/{color,normal,rough}.webp` exists for its sizes, return `{ name, set, ok: true, skipped: true, polyhavenId }` without searching (so the tool is idempotent and can be run in chunks; `force` re-packs). Otherwise search each query in order, `pickCandidates`, then try the candidates in order with `pack` (element `mat-<set>`, `hero` from the entry). A candidate counts as packed only when `pack` says ok AND the three files `color.webp`, `normal.webp`, `rough.webp` exist in `512` and `1k` (and `2k` for a hero); otherwise delete the folder `<assetsRoot>/textures/<set>/`, remove every ledger entry whose `file` starts with `assets/textures/<set>/` (load and rewrite `assets/LEDGER.json` the same way `addEntry` writes it: sorted by `file`, pretty JSON) and try the next candidate. All candidates fail gives `{ name, set, ok: false, reason }`. After every successful material write `INDEX.json` immediately: `{ "version": 1, "sets": [ { "name", "set", "polyhavenId", "sizes": ["512","1k"] (plus "2k" for heroes), "hero": true|false } ] }` sorted by `name` (merge with the existing file, never drop an entry). The attempt counter of plan 005 is per element and per source; every candidate here comes from the single source `polyhaven`, so it never reaches 3 sources and never blocks: do not add code for it. `INDEX.json` is NOT ledgered (it is exempt through `isLedgerExempt`); only the image files are.
- CLI: `node scripts/assets/packMaterialList.mjs scripts/assets/materials.list.json [--only a,b,c] [--force] [--assets-root dir] [--ledger file]` prints one JSON line per material (`{ name, set, ok, skipped?, polyhavenId?, reason? }`) and a last line `{ summary: true, packed, skipped, failed: [names] }`; exit code 0 even when some materials failed, 2 on bad arguments or a bad list. The CLI part only runs when the file is executed directly (compare `import.meta.url` with `process.argv[1]`).
- Unit tests (fake `search`, fake `pack` that writes the files into a temp assets root): first candidate fails and the second succeeds (the failed candidate's folder and ledger entries are gone, the index names the second id); all three fail gives `ok:false` and no index entry; a pack that says ok but leaves `normal.webp` missing counts as failed; an already packed entry is skipped (search and pack are not called); `--only` runs just the named entries; `pickCandidates` dedupes, honours `usedIds` and keeps 3; `loadList` rejects a duplicate name, a bad set name, 3 heroes; the real `materials.list.json` loads (22 entries, 4 heroes, 14 required); `INDEX.json` is written sorted and merged.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/packMaterialList.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/packMaterialList.mjs scripts/assets/materials.list.json`

### Step 2: Run the batch in chunks (network) and check the sets

Deliver:
- Run the batch as separate Bash calls (one command per call, each under the tool timeout), a few names at a time: `node scripts/assets/packMaterialList.mjs scripts/assets/materials.list.json --only plaster,stucco,concrete,roofTile`, then `--only floorTile,floorTileDark,woodPlanks,woodDark`, `--only brick,stoneRough,stonePaving,fabric`, `--only carpet,metalBrushed,metalPainted,marble`, `--only gravel,sand,grass,dirtRoad`, `--only rockCliff,thatch`. Re-running a chunk is safe (finished materials are skipped). Accept the result when at least 18 of the 22 are packed AND all 14 `required` ones are packed; list the failed ones in your report (a failed non-required material keeps `set: null` and its flat colour in step 4). If a required one fails, try again with `--force --only <name>` once, then write BLOCKED.md.
- Then run `node scripts/generate-credits.mjs` (the new texture files are now in the ledger and the credits page must not be stale) and `npm run check:ledger`. Never add a ledger entry for `INDEX.json` or any `set.json`.
- `tests/unit/materials/sets.test.js`: `assets/textures/INDEX.json` parses with `version` 1; at least 18 sets and every `required` entry of `materials.list.json` is in it; `hero` in the index equals `hero` in the list; for each set the `512` and `1k` folders each contain `color.webp`, `normal.webp`, `rough.webp`, and exactly the hero sets also have `2k`; every file under `assets/textures` is in `assets/LEDGER.json` EXCEPT files for which `isLedgerExempt` (from `scripts/lib/ledgerRules.mjs`, argument is the repo-relative path such as `assets/textures/INDEX.json`) is true, and every ledger entry under `assets/textures/` has an existing file, licence `CC0` and a `polyhaven.com` sourceUrl; the total size of `assets/textures` is under 40 MB (the global limit is 80 MB for all assets).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/materials/sets.test.js`
- `node "{{runner}}/assert.mjs" exists assets/textures/INDEX.json`
- `npm run check:ledger`
- `node scripts/generate-credits.mjs --check`
- `npm run check:size`

### Step 3: Metric UVs

Deliver:
- `tests/unit/materials/uv.test.js` first. `src/util/uv.js` exports `applyMetricUV(geometry, metersPerTile = 2)`: rewrites the `uv` attribute (creates it when missing) so one texture tile covers `metersPerTile` metres. Per vertex pick the dominant axis of its normal by the largest absolute component (ties prefer y, then x, then z) and use: x-dominant `(u, v) = (z, y) / m`; y-dominant (floors, ceilings, roofs) `(u, v) = (x, z) / m`; z-dominant `(u, v) = (x, y) / m` (positions are the geometry's local positions; the sign of the normal is ignored, so a back face may mirror the texture, which is accepted). Works on indexed and non-indexed geometry (the vertex count is unchanged), on `BoxGeometry`, `PlaneGeometry` and custom geometry that has a `normal` attribute; throws `Error('applyMetricUV: geometry has no normal attribute')` when `normal` is missing and `RangeError` when `metersPerTile` is not a positive finite number. The material texture `repeat` stays `(1, 1)` and the wrapping is `RepeatWrapping`: the tiling is baked into the UVs and nowhere else.
- Tests: a 4 m by 3 m by 0.2 m `BoxGeometry` with `metersPerTile` 2: the front (+z) face has u range 2 and v range 1.5, a side (+x) face has u range 0.1 (z extent 0.2) and v range 1.5, the top face has u range 2 and v range 0.1; a `PlaneGeometry(6, 4)` rotated with `rotateX(-Math.PI / 2)` has u range 3 and v range 2; the same box converted with `toNonIndexed()` gives identical ranges; a geometry without normals throws; `metersPerTile` 0 and NaN throw; calling it twice gives the same attribute values (it reads positions, never the old uv).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/materials/uv.test.js`
- `node "{{runner}}/assert.mjs" exists src/util/uv.js`

### Step 4: The material registry

Deliver:
- `tests/unit/materials/registry.test.js` first. `src/engine/materials.js` exports `MATERIAL_SPECS` (object name -> spec), `MATERIAL_NAMES` (a LIVE array of all registered names: `registerMaterial` appends to it, plan 020 validates manifests against it), `getMaterial(name, { tint, size } = {})`, `registerMaterial(name, spec, { replace = false } = {})`, `releaseMaterial(material)`, `disposeUnused()`, `getMaterialStats()`, `textureSizeFor(spec, tierSettings, sizeOverride)` (pure, exported for tests). Spec fields: `set` (kebab folder or `null`), `color` (flat fallback hex string), `tint` (hex string multiplier, default `'#ffffff'`), `roughness`, `metalness`, `metersPerTile`, `normalScale`, `envMapIntensity`, `hero` (boolean); `registerMaterial` fills missing fields with set `null`, tint `'#ffffff'`, roughness 0.9, metalness 0, metersPerTile 2, normalScale 1, envMapIntensity 0.3, hero false, throws on an unknown field type, on a bad hex string, or on a duplicate name unless `replace` is true (plan 022 registers `brass`, `cork` and others through it).
- The 25 built-in specs (all tints `#ffffff`, hex colour = flat fallback; format name: set, colour, roughness, metalness, metersPerTile, normalScale, envMapIntensity). plaster: plaster, #e8dcc4, 0.9, 0, 2.0, 0.6, 0.4, hero. stucco: stucco, #d9c9a8, 0.95, 0, 2.0, 0.8, 0.3. concrete: concrete, #9a9a96, 0.9, 0, 2.0, 0.7, 0.3. roofTile: roof-tile, #b5532f, 0.85, 0, 1.5, 1.0, 0.3. floorTile: floor-tile, #c9bfae, 0.45, 0, 1.0, 0.5, 0.6, hero. floorTileDark: floor-tile-dark, #5a4a44, 0.5, 0, 1.0, 0.5, 0.5. woodPlanks: wood-planks, #a07850, 0.65, 0, 2.0, 0.8, 0.4, hero. woodDark: wood-dark, #4a3420, 0.6, 0, 1.5, 0.8, 0.5. brick: brick, #a0553a, 0.9, 0, 1.5, 1.0, 0.3. stoneRough: stone-rough, #8a8478, 0.95, 0, 2.0, 1.0, 0.3. stonePaving: stone-paving, #8f8b82, 0.9, 0, 2.0, 1.0, 0.3. fabric: fabric, #8a7a68, 0.95, 0, 0.8, 0.6, 0.2. carpet: carpet, #7a3b3b, 1.0, 0, 1.5, 0.6, 0.1. metalBrushed: metal-brushed, #b0b4b8, 0.4, 0.6, 1.0, 0.6, 1.0. metalPainted: metal-painted, #5a6a7a, 0.5, 0.3, 1.0, 0.6, 0.8 (metalness stays at or under 0.6 because the scene has no environment map and a fully metallic surface would render black). marble: marble, #e6e2dc, 0.2, 0, 2.0, 0.4, 0.9, hero. gravel: gravel, #8c8678, 1.0, 0, 2.0, 1.0, 0.2. sand: sand, #dcc690, 1.0, 0, 3.0, 0.5, 0.2. grass: grass, #5f8f3f, 1.0, 0, 3.0, 0.8, 0.2. dirtRoad: dirt-road, #8a6a45, 1.0, 0, 3.0, 0.8, 0.2. rockCliff: rock-cliff, #6d6a64, 0.95, 0, 4.0, 1.2, 0.3. thatch: thatch, #b59a5a, 1.0, 0, 1.5, 0.8, 0.2 (set `null` when it was not packed: then it is a flat tinted material). Three untextured specials (set `null`): `glass` is a `MeshPhysicalMaterial`, colour #cfe6ee, opacity 0.25, `transparent: true`, `depthWrite: false`, roughness 0.05, metalness 0, transmission 0 (off), front side only; `emissiveWarm` and `emissiveCool` are `MeshStandardMaterial` with colour and `emissive` #ffd9a0 and #cfe6ff, `emissiveIntensity` 1.2, roughness 0.6 (the light manager of plan 012 clones these per light and switches `emissiveIntensity` between 0 and 1.2). For any of the 22 whose set was not packed, set `set: null` in the table (the flat colour then shows).
- `getMaterial(name, { tint, size })`: `tint` is a `#rrggbb` string (anything else throws `Error` naming the value); `size` optionally pins the texture folder to `'512'|'1k'|'2k'` (a pinned material never swaps on a tier change); the cache key is `name|tint|size` (missing parts empty), so the same arguments return the SAME instance and a different tint or size a different one; an unknown name throws an error that lists the known names. Each call increments `material.userData.refs`. The material is a `MeshStandardMaterial` (the specials above excepted) with `roughness`, `metalness`, `envMapIntensity` from the spec. Colour rule: without a loaded map `material.color` = flat `color` multiplied by `tint`; once the colour map has loaded `material.color` = `tint` alone (a white tint shows the texture unchanged) and `needsUpdate` is set. Map roles: colour map `SRGBColorSpace`; normal map and roughness map stay linear (`NoColorSpace`); when a roughness map is present `material.roughness` is set to 1 (three multiplies it by the map); `normalMap` with `normalScale` = `Vector2(s, s)`; the `ao` map is never loaded. All maps use `RepeatWrapping`, `repeat` (1,1), `flipY` default, anisotropy 8 on the high tier and 4 otherwise, read when the texture is created (and again on a tier change).
- Texture size and loading: `textureSizeFor(spec, tierSettings, sizeOverride)` returns `sizeOverride` when given, else `tierSettings.heroTextureSize` for a spec with `hero: true`, else `tierSettings.textureSize`; if the chosen folder is `2k` and the spec is not a hero it falls back to `1k`. Textures load lazily on `getMaterial` in the browser only (`typeof document !== 'undefined'`, never in Node) with `THREE.TextureLoader` from `assetUrl('textures/<set>/<size>/<role>.webp')` for roles `color`, `normal`, `rough`; a texture is shared by every material that uses the same set, size and role (cache key `set/size/role`), is tagged `texture.userData.size` and `userData.loaded` and counted as loaded only after its `onLoad` fired; a load error logs ONE `console.warn` naming the file and the material keeps its flat colour. Tier change: the module subscribes to `onTierChange` at its first browser use; for every live material that is not pinned it loads the textures of the new size, swaps the maps when they have loaded (the old maps stay until then, so there is no flash), then disposes every texture no live material uses any more.
- `getMaterialStats()` returns `{ materials: <live count>, textures: { '512': n, '1k': n, '2k': n } }` counting only LOADED textures that are currently held by the cache (zeros in Node). Release rules: `releaseMaterial(material)` decrements `userData.refs` (never below 0); `disposeUnused()` disposes every cached material whose refs are 0 or less together with the textures that no remaining material uses, removes them from the cache and returns the number of materials disposed. `MATERIAL_NAMES` has 25 entries at the start. The module must import in Node without touching `window`, `document` or WebGL.
- Tests (all in Node, no textures): same name and tint return the same instance, different tint or size a different one, refs count up; unknown name throws and the message lists known names; bad tint throws; `MATERIAL_NAMES` has the 25 names; `registerMaterial('testBrass', {...})` adds a name and `getMaterial` returns it, a duplicate throws, `{ replace: true }` works, defaults are filled; a material in Node has `map === null` and the flat colour (`plaster` with tint `#ffffff` has colour #e8dcc4; with tint `#808080` the channels are halved: assert the rgb values); `glass` has opacity 0.25 and `transparent`; `emissiveWarm` has `emissiveIntensity` 1.2; `textureSizeFor` for the three tiers of `TIER_SETTINGS` (low gives 512 for hero and normal, medium gives 1k, high gives 2k for a hero and 1k otherwise; a pinned size wins); `releaseMaterial` and `disposeUnused` (a material with refs 0 is removed and the next `getMaterial` makes a new one; a material with refs 1 survives); `getMaterialStats()` is zeros in Node; the consistency of specs and files: every spec with a non-null `set` has that set in `assets/textures/INDEX.json`, every set in the index belongs to exactly one spec name, and the 22 names of `materials.list.json` plus `glass`, `emissiveWarm`, `emissiveCool` are all in `MATERIAL_NAMES`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/materials/registry.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/materials.js`
- `node "{{runner}}/assert.mjs" has src/engine/materials.js "export function getMaterialStats"`
- `node "{{runner}}/assert.mjs" has src/engine/materials.js "export function releaseMaterial"`

### Step 5: Materials fixture, hook extras and the Playwright check

Deliver:
- `src/state.js`: add `game.fixtureObjects = []` (ARCHITECTURE 10.8; plans 019 and 023 push to it too). `src/dev/worldHook.js`: `listObjects()` returns a copy of `game.fixtureObjects` (plus the objects of real areas, none yet); new field `materialStats()` returns `getMaterialStats()` from `src/engine/materials.js`. Both are dev-only and extend the hook object, nothing is renamed.
- `src/dev/fixtures/materials.js` (register it, and add its import line to `src/dev/fixtures/index.js`): a flat grey floor (`PlaneGeometry(40, 40)` rotated flat, own `MeshStandardMaterial`, centred at x 0, z -4, so it spans z -24 to 16) and one 1.2 m cube per name of `MATERIAL_NAMES` at the time the fixture is built (25 now), ordered as listed in `MATERIAL_NAMES`, in rows of 6: column `i = n % 6`, row `r = floor(n / 6)`, cube centre `x = (i - 2.5) * 2`, `z = -6 - r * 2`, `y = 1.2` on a grey `BoxGeometry(1.4, 0.6, 1.4)` pedestal (own flat material, not from the registry) whose top is at y 0.6. Every cube calls `applyMetricUV(geometry, spec.metersPerTile)` and uses `getMaterial(name)`. For each cube push `{ type: 'material-sample', name }` to `game.fixtureObjects`. `build` returns `{ root, spawn: { x: 0, y: 0, z: 10, yaw: 0 } }` (the player stands behind the overview camera, outside the frame). The scene sun lights the fixture.
- `tests/e2e/materials.spec.js` (every URL has `&freeze=1&time=0.4`; every test collects `page.on('console')` errors and `pageerror` and asserts there are none; the overview camera is `setCamera({ x: 0, y: 4.5, z: 6, yaw: 0, pitch: -0.35 })`, which sees all 25 cubes; no fixed waits, use `expect.poll(..., { timeout: 60000 })`). Test 1, `?fixture=materials&quality=medium`: wait for `ready`, set the camera; `listObjects()` has exactly 25 `material-sample` records whose names equal the 22 names of the list plus `glass`, `emissiveWarm`, `emissiveCool` (hard-code that expected array); poll until `materialStats().textures['1k']` is at least 30, then assert `['512']` and `['2k']` are both 0 (medium uses 1k for hero sets too); poll until `rendererInfo().textures` is at least 30 (GPU uploads, only counted because the camera sees all cubes). Test 2, `quality=high`: poll until `textures['2k']` is at least 9 (four hero sets, three maps each, minus missing ones) and `textures['1k']` at least 30. Test 3, `quality=low`: poll until `textures['512']` is at least 30, then `textures['1k']` and `textures['2k']` are 0. Test 4, tier swap: open with `quality=medium`, wait for 1k at least 30, call `setQuality('low')`, poll until `textures['1k']` is 0 and `['512']` at least 30 (the old textures were disposed). Test 5, screenshot: open medium, set the camera, wait for 1k at least 30, save `page.screenshot({ path: 'docs/shots/013/materials-medium.png' })` and assert the file is larger than 20 KB.
- Visual self-review (best effort, never a gate): open `docs/shots/013/materials-medium.png` with the Read tool and note flat or obviously wrong surfaces (a cube with the flat fallback colour, mirrored or hugely stretched textures, black metal) in your report. Add a short "Materials" section to `docs/world-conventions.md`: the naming rule (name vs set vs element), `getMaterial(name, { tint, size })`, `registerMaterial`, `releaseMaterial`/`disposeUnused`, `applyMetricUV`, that texture `repeat` stays 1, how to run `packMaterialList` in chunks, and the `materials` fixture.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/materials.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/materials.js docs/shots/013/materials-medium.png`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/index.js "materials"`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "materialStats"`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "Materials"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/packMaterialList.test.js tests/unit/materials/sets.test.js tests/unit/materials/uv.test.js tests/unit/materials/registry.test.js`
- `npx playwright test tests/e2e/materials.spec.js`
- `npm run check:ledger`
- `node scripts/generate-credits.mjs --check`
- `npm run check:size`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

Human check (goes in the report, never blocks): Look at the materials fixture (`npm run dev`, open `?fixture=materials`) or `docs/shots/013/materials-medium.png`: do the surfaces look like believable plaster, tile, wood, stone?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Fewer than 18 texture sets, or any of the 14 required sets, could not be packed because Poly Haven was unreachable or returned no usable texture: BLOCKED.md.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
