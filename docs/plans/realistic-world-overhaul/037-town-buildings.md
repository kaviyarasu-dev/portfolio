# Plan 037: Houses, shop rows, cafe and market from archetype manifests, baked per block

Epic E3. Estimated turns: 55.

## Goal

Fill the plots of the town plan with believable buildings. Six archetypes (house-a: single-storey tiled-roof house with a pillared front veranda; house-b: two-storey flat-roof house with a water tank; shop-row: a row of three shops with roll-down shutters and signboards; cafe: an enterable tea and snack cafe; market: an open pillared market hall with stalls; hut: a small thatched fisherman hut) are manifests with parameters, built by the kit, tinted in pastel colours, and baked into merged meshes per 80 m block so 60 buildings cost few draw calls. Extras are not Rich-bar buildings: only the cafe is enterable, the rest have decorative doors and curtain-filled windows.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.6 and requirement R9, decision D3, D21, assumption A15)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/layout/town.json
- src/world/layout/plots.js
- src/world/kit/building.js
- src/world/kit/exterior.js
- src/world/kit/shell.js
- docs/building-manifest.md
- src/content/signage.js
- src/world/props/catalog.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Archetype manifests and the parameterized instance

Deliver:
- `tests/unit/town/archetypes.test.js` first. `src/world/buildings/_archetypes/` holds `house-a.json`, `house-b.json`, `shop-row.json`, `cafe.json`, `market.json`, `hut.json` (manifests in the standard schema with `id: "archetype-<name>"`). `src/world/town/archetype.js` exports `instantiate(archetypeId, plot, { seed })` returning a manifest copy fitted to the plot (`footprint` from `plot.w` and `plot.d`, rooms scaled proportionally, door on the wall facing `plot.facing`, wall tint chosen from a pastel palette by seed: cream `#f1dfb0`, mint `#b9dccb`, sky `#b8d5e6`, rose `#e8c1bd`, ochre `#e3b869`, white `#f3efe6`; roof material variants; window counts from the footprint).
- Details per archetype: house-a gets a veranda (`portico` with 2 to 4 pillars, the thinnai bench `bench-wood` fixed in the veranda, a doorstep with 2 steps), a tiled gable or hip roof, 2 to 3 windows, a water pot stand beside the door; house-b gets a flat roof with parapet, `waterTank`, a balcony, an outside staircase; shop-row three bays each with a `rolling-shutter` mesh (ribbed box, half open on some), a `signboard` with a key from `signage.js` shop names, an awning; cafe has a counter, 4 tables and 12 chairs inside (`counter-straight`, `table-round`, `chair-wooden`, a `fan-ceiling`, `tea-glass-set`, `menu-board`, `lamp-pendant`) and a seat; market is an open hall (roof on 12 pillars, no walls) with 8 stalls of `table-folding` with `crate-fish`-free produce (use `basket-wicker` if present, otherwise `pot-set`); hut uses `thatch` roof, bamboo walls (`woodPlanks` tinted) and a stool.
- Tests: `instantiate` for every archetype and a sample plot validates (`validateManifest`), the door faces the plot facing, fits inside the plot, colours come from the palette, the cafe passes `checkBuilding` structure stage with at least 20 distinct types (a small rule: pass `--min-types` 20 in the test call, not the 40 rule), all non-cafe doors are `decorative`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/town/archetypes.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/town/archetype.js src/world/buildings/_archetypes/house-a.json src/world/buildings/_archetypes/cafe.json`

### Step 2: Baking static geometry per block

Deliver:
- `tests/unit/kit/bake.test.js` first. `src/world/kit/bake.js` exports `bakeStatic(group, { exclude })`: for the world-space static meshes under `group` that are not flagged `userData.dynamic` (doors, lamps with emissive toggles, signs that animate), merge geometry per material into one mesh per material (world matrices applied), dispose the originals, keep colliders and interactables untouched, and return `{ meshesBefore, meshesAfter }`. Windows of buildings without an interior get `curtain` fill planes (flat dark `fabric` quads inset 0.12 m with a warm emissive tint toggled by the light manager group `town-windows` at night).
- `src/world/town/townBuilder.js`: `buildTown(town, ctx)` groups plots by 80 m grid block, `buildBuilding` each (interior props only for the cafe), `bakeStatic` per block, returns `{ blocks: [{ id, root, bounds }], instances }` so the streamer can register each block as an area (`interior` of the cafe handled by the building itself).
- Tests: baking 10 cottage instances reduces mesh count to at most the number of distinct materials times 2; world positions of vertices are unchanged within 1e-4; flagged dynamic meshes survive; `buildTown` on the real `town.json` in Node returns the plot count and every block has at most 40 meshes after baking.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/bake.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/bake.js src/world/town/townBuilder.js`

### Step 3: Integrate and verify in the browser

Deliver:
- Register each town block as a streamed area (priority 80 for blocks within 100 m of the square, 40 otherwise, `loadRadius` 160, `unloadRadius` 220) in `src/world/areas/townAreas.js`; remove v1 generic houses if any exist. Plot colliders come from the shell (walls) so you cannot walk through houses; the doors are decorative and closed.
- `tests/e2e/town-buildings.spec.js`: boot, ready; `listBuildings()` after teleporting to the main street shows at least 8 buildings loaded; the player cannot walk through a house wall (teleport 2 m in front of a house door, hold `w` for 3 s: the player stays outside the footprint); the cafe door opens and the player can enter (`e`); the cafe has `problems` empty; zero console errors; `check:budget` with new spots `main-street` and `harbour-road` still passes (if over budget raise the baking or reduce details, not the limit).
- Shots: `npm run shots -- --spots main-street,house-row --plan 037` (add `house-row`); view and fix (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/town-buildings.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/town/archetypes.test.js tests/unit/kit/bake.test.js`
- `npx playwright test tests/e2e/town-buildings.spec.js`

Human check (goes in the report, never blocks): Shop and house names are placeholders (A15); judge whether the street feels real.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
