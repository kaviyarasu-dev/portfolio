# Plan 075: Phone tier: half the decor, interiors on entry, texture and GPU memory caps, first download under 25 MB

Epic E8. Estimated turns: 60. Model: opus.

## Goal

Make the `low` tier a real phone tier that meets D29: no point lights (already), 512 px textures (already), about half the decor objects, interiors built only when the player is near and released when far, a per-building and a total GPU memory cap, a first-session download under 25 MB, and the phone budget of 250 draw calls and 800k triangles at the spawn and at every phone budget spot. Download bytes are measured on the production preview; lights and draw calls are measured on the dev server (the dev hook exists only there). The work is one plan with three steps; no asset file under `assets/**` is edited, re-encoded or deleted.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6 (Streaming), 7 (Tiers, Performance), 10.5 and 10.8 and requirement R3 (phone tier), decision D29, assumption A7)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/plans/realistic-world-overhaul/ARCHITECTURE.md (sections 6, 7, 10.5, 10.8)
- src/engine/quality.js (plan 011: TIER_SETTINGS, decorScale and interiorsOnEntry per tier, and its frozen test; do not add keys to TIER_SETTINGS)
- src/engine/materials.js (plan 013: getMaterial registry, texture ids and sizes)
- src/world/kit/building.js (plan 021: BuildingInstance, listBuildings, ensureInterior/releaseInterior hooks)
- src/world/kit/place.js (plan 021: placeObjects)
- src/world/props/catalog.js and src/world/props/index.js (plans 023/041: prop metadata, allProps)
- src/world/props/sets/ (the set files that define the decor types)
- src/engine/streaming.js (plan 015: area loading, interior flag)
- src/world/areas/index.js (plan 040: ZONE_LAYOUT, area ids; centre and hotel always-on areas from plan 031)
- src/budgets.json and scripts/check-budget.mjs (plan 014: phone profile, spot list, baselineAllowance rule)
- src/dev/worldHook.js (plan 003 owns the hook: listLights, rendererInfo, quality, setTime, teleport; plan 012 extends the light records)
- the game loop file (its per-frame update; owner named in ARCH 10.8)
- docs/building-manifest.md, src/world/layout/town.json, src/world/buildings/plaza/manifest.json (hotel lobby), the library zone manifest
- the house archetype town-0 from plan 037

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Decor flags and decor halving in the kit

Deliver:
- `tests/unit/kit/phoneTier.test.js` first (new file, frozen by this plan). Prop metadata gets a boolean `decor`, set to true on these optional types in the set file that defines each (grep the type id under `src/world/props/sets/`): rugs, pictures, posters, vases, pot-plants, plants, flowers, cushions, books, plates, glasses, plaques, banners, small-signs, bunting. Never set on: sit, read, switch, door and structural categories, beds, tables, counters, machines, doors, stairs, lifts, interactable objects, anything with `seats`. Solid furniture is never decor.
- `placeObjects(..., { decorScale })` in `src/world/kit/place.js` (plan 021 owner): a decor item is kept when `fnv1a32(buildingId + ':' + type + ':' + index) % 100 < Math.round(decorScale * 100)` (FNV-1a 32-bit, unsigned). `decorScale` is READ from `TIER_SETTINGS[tier].decorScale` (plan 011, frozen; this plan does not set or change it: the 011 values are high 1, medium 0.8, low 0.5). Protected items (sit, read, switch, door, structural, seats, and any object a manifest marks required) are never dropped, and no placement problem is introduced by dropping items.
- Test sample: three manifests, the hotel lobby (`src/world/buildings/plaza/manifest.json`, hotel area per plan 031), the library zone manifest and the house `town-0` archetype (plan 037). They must hold at least 40 decor items in total; if fewer, the test fails with a message and the fix is to add decor items to the set files, never to tune the hash. The kept share is asserted against the value read from TIER_SETTINGS: between 45 and 55 percent on low, between 75 and 85 percent on medium, and exactly 100 percent on high.
- Named tests in `tests/unit/kit/phoneTier.test.js`: "decor flag is set on at least 8 real types" (reads the `allProps` catalogue); "decor ratio is 45 to 55 percent on low for the three sample manifests"; "decor ratio is 75 to 85 percent on medium"; "high keeps every decor item"; "protected categories are never dropped"; "dropping decor creates no placement problem". Non-regression: `has src/world/kit/building.js ensureInterior` stays as a string check only.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/phoneTier.test.js tests/unit/props/allProps.test.js tests/unit/kit/building.test.js`
- `node "{{runner}}/assert.mjs" has src/world/kit/building.js "ensureInterior"`

### Step 2: Interior budget constants, memory estimate and the interior manager

Deliver:
- `src/world/kit/interiorBudget.js` (new; contract 10.5 addition): `export const INTERIOR_MEMORY_MB = { low: 18, medium: 36, high: 72 }` (total cap) and `export const INTERIOR_BUILDING_MB = { low: 6, medium: 12, high: 24 }` (per-building cap), and `estimateBuildingMemory(building)`: the sum over the UNIQUE textures of the building (texture id from the `getMaterial` registry of plan 013) of `width * height * 4 * 1.33` bytes, converted to MB with 1 MB = 1,048,576 bytes. A texture used by two meshes of one building is counted once. The scene total is the union over all built interiors, so a texture shared by two buildings is counted once. `TIER_SETTINGS` is NOT changed (plan 011 frozen test fixes its keys).
- `src/world/kit/interiors.js` (new; contract 10.5 addition): `createInteriorManager({ buildings, tier, budgetMb, now })` returns `{ update(playerPos, dt), stats() }`. `buildings` are the landmark buildings whose area has `interior: true` (plan 015 flag); `budgetMb` defaults to `INTERIOR_MEMORY_MB[tier]`; `now` is an injected clock used only to time `update` in `stats()`. Driven once per frame from the game loop's per-frame update (075 calls it; if the loop has no per-frame call, the loop owner adds `onFrame(fn)`, a cross-plan request listed in ARCH 10.8). Tier rule: the manager is active when `TIER_SETTINGS[tier].interiorsOnEntry` is true (read the 011 value, never hardcode a tier name; with the 011 values this is low and medium); when it is false, interiors stay built while the area is loaded and no release happens.
- Relation to the streamer and always-on areas: the manager builds an interior when the player is within 14 m of the building footprint or inside it, and releases it when the player is beyond 45 m. The streamer `interior` flag (plan 015) still controls visibility. The manager never touches the always-on areas `centre` and `hotel` (plan 031, no interior flag) or any area without `interior: true`; these are the exempt list.
- Update order inside one `update(playerPos, dt)`: advance the game clock by `Math.min(dt, 0.1)`; (1) release built interiors beyond 45 m, farthest first; (2) while the total memory is above `budgetMb`, release the farthest built interior (a building over the per-building cap counts as over the cap); (3) build at most ONE interior per call (`buildInterior` called at most once per `update`), the nearest unbuilt building within 14 m that fits both caps; a building over the per-building cap is built only when it is the only one built, and it is released first when another building needs memory. Release happens before build in the same update. Every build or release starts a 3 s lock on that building (game clock), so a released building is not rebuilt until the lock ends. No other slice concept exists.
- Build and release use `BuildingInstance.ensureInterior()` and `releaseInterior()` in `src/world/kit/building.js` (plan 021, extended here): release disposes the interior geometry and light registrations, removes the colliders of props, keeps shell colliders and doors, and removes the interior interactables (sit, read, switch, door) from the interaction registry; build re-registers them. Shared textures come from `getMaterial` and are not disposed on release. The `read` target (reception desk) need not exist while the player is 45 m or more away: the test checks only the released-state record.
- World hook (plan 003 owns the hook; these are requested additions, listed in ARCH 10.8 and 10.5): `interiorState()` returns `{ built: [ids], totalMb }`; `listBuildings()` records (plan 021) gain `interiorBuilt: boolean`; the phone profile uses the `pooled` field of `listLights()` (plan 012) and asserts no pooled light. ARCH notes for the architecture owner (this plan does not edit ARCH): 10.5 and 10.8 must list `interiorState()` and the `pooled` light field.
- `tests/unit/kit/interiors.test.js` (new, frozen): named tests: "interiors are not built at 60 m on low and are built within 14 m" (fake clock); "release is farthest-first"; "3 s cooldown holds with a fake clock" (no rebuild before 3 s of game time); "at most one buildInterior call per update"; "on high interiors stay built while the area is loaded"; "memory total never exceeds the cap in a simulated visit of all 14 buildings"; "colliders of props are removed on release and shell colliders are kept"; "textures are shared through getMaterial and survive release"; "always-on centre and hotel areas are never touched".

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/interiors.test.js tests/unit/kit/building.test.js`
- `node scripts/check-buildings.mjs --all`

### Step 3: Preload manifest, download test, phone budget and the bounded tuning loop

Deliver:
- `src/preload.json` (new) = `{ "version": 1, "critical": [ "relative/path" ], "lazy": [ "relative/path" ] }`, every path relative to `assets/`. It is generated by `scripts/make-preload.mjs` (new): a Playwright run against the production preview (started the same way as in the download test below, never the dev server) at 390 by 844 with `?quality=low&freeze=1` records every response URL under `assets/` from page start until the `#loader` element carries the class `hidden` (plan 002; the DOM ready signal; the script does not use `window.__world`); those are `critical`; the lazy ambience loops and non-start tracks are `lazy`. The critical set covers center and hotel areas, the 512 textures of their materials, the avatar, the fonts, the start music track and the start sound files. Code chunks are not listed; they are measured in `bundleBytes`.
- Consumer: `src/boot/preload.js` (new) imports `src/preload.json` and adds one `<link rel="preload" as="fetch" crossorigin>` per `critical` file at boot; `lazy` files get no link. `tests/unit/build/preload.test.js` (new, frozen): every file in `src/preload.json` exists under `assets/` (not stale); the consumer exists; the boot function adds exactly one `<link>` per critical file (DOM stub); the shape of `docs/perf/phone-bytes.json` and `docs/perf/phone-final.json` is checked.
- `tests/e2e/phone-download.spec.js` (journey 7, second half; frozen): runs against `vite preview` of the production build (run `npm run build` first; not the dev server). The spec starts `vite preview --port 4173 --strictPort` itself and fails if the port is busy, so a running dev server cannot be reused. Context 390 by 844 with `hasTouch` and `isMobile`, URL `/?quality=low&freeze=1`. Records `response` events from page start until the `#loader` element has the class `hidden` (`expect.poll`, no fixed wait); bytes = sum of `await response.body()` lengths for JS and asset responses; when `body()` throws the `content-length` header is counted; the test fails if neither is available. Asserts: total under 25 * 1024 * 1024 bytes, top 10 files printed; no GLB prop fetched (hero props skipped on low); no file whose name contains `_1k` or `_2k` fetched before ready; no `amb_*` loop (plan 065, 12 s each) larger than 600 KB fetched before ready (the test requires plan 065 done and fails if the amb_* files are absent). It writes `docs/perf/phone-bytes.json` = `{ "version": 1, "bundleBytes": n, "assetBytes": n }` (bundleBytes = the JS response bytes, assetBytes = the asset response bytes). It uses no `window.__world`.
- `tests/e2e/phone-world.spec.js` (new, frozen; the DEV server, which is the default webServer of the Playwright config, because `window.__world` exists only in dev, plan 003): at 390 by 844 with `?quality=low&freeze=1`, `expect.poll` until `__world.ready`; asserts `quality()` is `low`; `listLights()` has no record with `pooled: true`; `rendererInfo().calls` at most 250 and triangles at most 800000 at the spawn AND at each of the 14 landmark `<zone>-outside` spots (teleport by zone id, then `expect.poll` until ready at each spot). It reads `docs/perf/phone-bytes.json` (written by the download spec, so the download spec runs first) and writes `docs/perf/phone-final.json` = `{ "version": 1, "bundleBytes": n, "assetBytes": n, "drawCalls": { "<spot>": n }, "triangles": { "<spot>": n }, "notMet": [ ] }`.
- Phone budget: `npm run check:budget` runs the `phone` profile of `src/budgets.json` (plan 014). 075 APPENDS phone spot limits only and never changes an existing limit. 075 adds no `baselineAllowance`; a WARN from `baselineAllowance` counts as a FAIL for the phone profile (plan 076 deletes existing allowances). Phone spot list (exact ids): `spawn`, the 14 `<zone>-outside` spots (plan 040 ZONE_LAYOUT), `square-day`, `harbour`, `beach`, `forest`. A spot id missing from `src/budgets.json` or `src/shots.json` is added with the 014 spot convention.
- Bounded tuning: at most 3 tuning passes. Each pass runs `npm run check:budget`, takes the heaviest unmet phone spot and fixes its cause with the tools below: fewer decor items (the `decor` flag), hidden interiors (the manager), shadow settings, lower vegetation density (plan 036 owner), merging and instancing. Never raise a limit. After pass 3, unmet spots are written to `notMet` in `docs/perf/phone-final.json` and a human_check is raised; the run does not loop further.
- If the download test fails, reduce first-load size WITHOUT editing assets: move the non-start music tracks to lazy load after ready (plan 066 owner), lazy-load the ambience loops after ready (plan 065 owner), defer the credits and text-mode modules with dynamic import. If still over 25 MB, the test stays failing and a human_check is raised. Record what was moved in the report. 075 does NOT re-encode, delete or resize any file under `assets/**` (outside allowed_paths).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run build`
- `node scripts/make-preload.mjs`
- `npx playwright test tests/e2e/phone-download.spec.js`
- `npx playwright test tests/e2e/phone-world.spec.js`
- `npx vitest run tests/unit/build/preload.test.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists src/preload.json docs/perf/phone-bytes.json docs/perf/phone-final.json`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/kit/phoneTier.test.js tests/unit/kit/interiors.test.js tests/unit/build/preload.test.js tests/unit/props/allProps.test.js tests/unit/kit/building.test.js`
- `npm run build`
- `npx playwright test tests/e2e/phone-download.spec.js`
- `npx playwright test tests/e2e/phone-world.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --all`

Human check (goes in the report, never blocks): Run the site on a real phone: does it start quickly, move smoothly and not crash? (D29). If phone-final.json has notMet entries, decide on them.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
