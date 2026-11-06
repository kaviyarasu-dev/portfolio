# Plan 039: Gopuram gate and small temple, street life, Tamil and English signage, local-detail manifest check

Epic E3. Estimated turns: 60.

## Goal

The identity of the town: a gopuram-style gate with a small temple at the west entrance (stepped tower with horizontal bands, red and white striped walls, stone steps, oil-lamp stand, flower garlands; NO idols or deity images, A2), street life (kolam patterns at doorsteps, two tea stalls, three parked auto-rickshaws, a town bus at a bus stop with the existing shelter prop, fruit carts, festival bunting across the main street) and Tamil plus English signs on shops and public places. A manifest check proves every required local item exists in the BUILT world (R9).

Contracts. Plan 032 allows the extra `local` object in `town.json` (`local.gate` and `local.temple`, each `{ x, z, rot }`, validated by `validateTown`, kept by `gen-town.mjs`), the closed-ring convention and the plot `facing` type (use its helper to get the facing vector of a plot; read `src/world/layout/town.js` and `plots.js`). Plan 038 provides the harbour objects named `harbour:<type>-<n>` and `areaObjects` records of types `jetty`, `fish-market`, `catamaran`, `net-rack`, `net-heap`, `fish-rack`. Plan 029 owns `src/world/props/sets/street.js` (types `bin-street`, `signpost`, `bus-shelter`, frozen exact TYPES test): this plan NEVER edits that file or those types and never edits plan 038 code; it tags what it needs by itself (step 3).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.5, 10.8 (props, streaming, spots) and requirement R9, decision D25, assumption A2, A15, A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/layout/town.json
- src/world/layout/town.js
- src/world/layout/plots.js
- src/world/layout/walk.js
- src/world/town/townBuilder.js
- src/world/town/harbour.js
- src/world/town/harbourProps.js
- src/world/town/square.js
- src/world/kit/exterior.js
- src/world/kit/signTexture.js
- src/world/kit/slotText.js
- src/content/signage.js
- src/world/props/index.js
- src/world/props/sets/street.js
- src/world/props/sets/outdoorSeating.js
- src/world/roads/surface.js
- tests/unit/roads/clear.test.js
- src/world/areas/townAreas.js
- src/world/areas/harbourAreas.js
- src/dev/worldHook.js
- src/systems/collision/world.js
- src/engine/quality.js
- src/budgets.json
- src/shots.json
- assets/fonts

High-risk assumptions that touch this plan (each has a step that checks it):
- A2 (HIGH-RISK): temple and kolam are modelled respectfully as architecture and pattern only; Tamil strings are drafts for a person to check. D21: more is built by code, so the look is the risk.

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Gopuram gate and temple builders

Deliver:
- `tests/unit/local/gopuram.test.js` first. `src/world/local/gopuram.js` exports `buildGopuram({ tiers = 5, baseW = 9, baseD = 6 })`, `buildSmallTemple()` and `buildGarland(path)`; each returns `{ root, colliders, objects }` like plan 029 `buildSquare` (colliders are plain descriptors, the builder never touches `game`). Gopuram: a gate whose passage runs along its local z axis (the passage is 3.5 m wide and 4.5 m high), a stone base, then 5 tiers (child groups `tier-1` to `tier-5`, each smaller than the last, each with a horizontal moulding band) and at least 4 small arched niches per tier named `niche-<tier>-<n>` that are LEFT EMPTY (no mesh inside), vertical red and white stripes on the lower walls (at least 12 boxes named `stripe-<n>`, alternating red `#b3342a` and white), a barrel-vault crown (a mesh named `crown-vault` at least 0.6 times `baseW` wide) with a row of 7 brass finials named `kalasam-1` to `kalasam-7`, total height 14 to 18 m. Temple: a square sanctum with a pyramidal vimana roof, an entrance mandapa on 8 pillars (`pillar-1` to `pillar-8`), a stone plinth 0.75 m high reached by a 5-step stair (a stair collider, steps `step-1` to `step-5`), a flagpole named `dhwajasthambam` 8 to 10 m high, a stone oil-lamp pillar with 12 lamp cups (`lamp-cup-1` to `lamp-cup-12`), a perimeter wall with a gate; the sanctum interior is empty and its door is open but decorative. `buildGarland(path)`: marigold strings of orange and yellow bead meshes (ONE `InstancedMesh` named `garland-beads`, at least 30 beads) along a catenary between two points.
- Data: author `local: { gate: { x, z, rot }, temple: { x, z, rot } }` in `town.json` (an authored field, `gen-town.mjs` keeps it). `gate` lies on the `main` road polyline (within 0.5 m) about 20 m east of the `gateway` anchor edge, with `rot` so the passage axis `(sin rot, cos rot)` runs along the road tangent; `temple` lies 18 m to the north side of the gate, facing the road, clear of every plot, anchor, road buffer and the water (test). The main road passes through the passage.
- Tests: gopuram height 14 to 18 m; 5 tiers with strictly decreasing widths; at least 4 empty niches per tier; at least 12 stripes with alternating colours; `crown-vault` width; exactly 7 `kalasam-*`; a passage that a 0.35 m circle can walk through (`new CollisionWorld()` from plan 016, add the gopuram colliders, `moveCircle` in 0.1 m steps from 6 m before to 6 m after the gate along the passage axis is never blocked) and a circle 2.0 m off the axis is blocked at the gate line; temple: the entrance is reachable from outside (walk from a point 6 m in front of the plinth up the stair to the mandapa, `y` ends within 0.05 of 0.75), 8 pillars, 5 steps, 12 lamp cups, flagpole height, the sanctum has no interior meshes; naming guard: no mesh, group or material in any builder has a name containing `idol`, `deity` or `statue`; garland: bead count at least 30, points on a catenary (sag between 0.3 and 1.0 m for a 6 m span); `town.json` `local.gate` is on the main road and `local.temple` clear (`validateTown` still has no problems).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/local/gopuram.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/local/gopuram.js`
- `node "{{runner}}/assert.mjs" has src/world/layout/town.json "gate"`

### Step 2: Street life props and placement

Deliver:
- `tests/unit/local/streetLife.test.js` first. NEW file `src/world/props/sets/streetLife.js` (category `street`, exports `TYPES`; ONE added import line in `src/world/props/index.js`; `street.js` is never touched). Reuse the existing `bus-shelter` prop of plan 029 (no new shelter type). Table (size bbox front toward +z, `mount: "floor"`, `seats: []`, no unknown `meta` keys): `auto-rickshaw` [1.4, 1.7, 2.7] solid (three-wheeler: yellow canopy, black lower body, one front wheel, open sides, driver seat and a rear bench); `bus-town` [2.5, 3.0, 10.0] solid (two-tone single-deck bus, windows, wheels, destination board; `meta.textSlots: [{ id: "board", x, y, z, w: 1.4, h: 0.35 }]`); `tea-stall` [2.2, 2.6, 1.8] solid (wooden kiosk with a tin roof, counter, kettle on a stove, glass jars of biscuits, a banana bunch, a stool bench; `textSlots` one slot `sign`); `fruit-cart` [1.0, 1.6, 1.8] solid (two-wheel pushcart with an awning and baskets of fruit blobs); `bunting` [8.0, 4.8, 0.2] NOT solid (two thin poles 0.12 m and a string of 12 triangular flags between them across a road: non-solid so it can never block the street); `kolam` [1.6, 0.01, 1.6] NOT solid (flat decal: in the browser a canvas texture of white dotted geometric lines on a transparent background from the pure generator `kolamPoints(seed, family)` in `src/world/local/kolam.js` with 4 families; in Node a plain white disc); `water-pot-stand` [0.5, 0.9, 0.5] solid; `scooter` [0.7, 1.1, 1.9] solid; `cycle-parked` [0.5, 1.0, 1.7] solid.
- `src/world/local/placeLocal.js`: `placeLocal(town, seed)` (pure, deterministic) returns `[{ type, x, z, rot, area }]` and `buildLocal(town, ctx)` returns `{ root, colliders, objects, ... }` like `buildSquare`. Rules: kolam at the doorstep of 25 or more house plots (`house-a`, `house-b`; position = plot centre + facing vector times `d/2 + 1.1`, `y` = terrain + 0.01 with polygon offset, one of the 4 families chosen by seed); 2 `tea-stall` (one at the square edge, one on the harbour road near the jetty root); 3 `auto-rickshaw` (square, market plot, ferry terminal); the `bus-town` and one `bus-shelter` near the `transport` anchor beside the road, the shelter 4 m before the bus; 3 `fruit-cart` on the main street edge; 6 `bunting` strings across the main street at arc length 25 + 30 * i metres along the `main` polyline (i = 0 to 5), each perpendicular to the road tangent with span road width plus 1.0 m (shift a string by 2, -2, 4, -4 m along the road until its poles are clear of every plot and anchor); 6 `scooter` and 4 `cycle-parked` in front of shop-row plots. Autos and carts sit at the road edge or plot front (never within 1.5 m of a road centre line). Each item gets the `area` of the nearest of the three local area centres of step 3 (`west-gate`, `street-life-centre`, `street-life-harbour`).
- Tests: exact `TYPES` list and sizes within 2 percent; auto 2.5 to 3.0 m long, bus 9 to 11 m, `kolam` not solid and under 0.02 m high, `bunting` not solid; `kolamPoints` deterministic and the 4 families differ; placement counts (kolam at least 25, tea-stall 2, auto 3, bus 1, bus-shelter 1, fruit-cart 3, bunting 6 with consecutive spacing 30 m plus or minus 5 m, scooter at least 6, cycle at least 4), determinism for seed 1337, no item inside a plot, anchor or water and no two items overlapping; the clear-road rule of plan 034 re-run: build the same headless world as `tests/unit/roads/clear.test.js` (anchors, plots, square furniture) PLUS the colliders of the street-life items and of the gopuram and temple, and sampling every 1 m along every road centreline gives `blockedAt` false at radius 0.35; every placed type exists in the catalog and `allProps` passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/local/streetLife.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/streetLife.js src/world/local/placeLocal.js src/world/local/kolam.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "streetLife"`

### Step 3: Signage, tagging, the local-detail manifest check and areas

Deliver:
- Signage keys. Plan 025 already has `welcome`, `harbour`, `fish-market`, `bus-stand`, `tea`, `temple` (its 21 starter entries are frozen exact): reuse them, do NOT add `bus-stop`. Append to `src/content/signage.js` (never change an existing key) these 8 new keys with drafted Tamil (A15): `kumar-stores` Kumar Stores / குமார் கடை, `anbu-tea` Anbu Tea Stall / அன்பு தேநீர் கடை, `selvi-tailors` Selvi Tailors / செல்வி தையல், `tn-bakery` Tamilnadu Bakery / தமிழ்நாடு பேக்கரி, `fresh-fish` Fresh Fish / புதிய மீன், `medical` Medical Shop / மருந்தகம், `provision` Provision Store / மளிகை கடை, `barber` Barber Shop / முடிதிருத்தகம். A NEW test file `tests/unit/content/signageLocal.test.js` asserts these 8 keys with exact `en` and `ta` strings and that every `ta` has a character in U+0B80 to U+0BFF (the frozen plan 025 test is not edited and keeps passing).
- `src/world/local/placeSigns.js`: `buildSigns(town, ctx)` creates the sign boards with the `signboard` builder of plan 025 (style `board`, 1.6 m by 0.5 m, on two short posts, face at 1.6 m height, standing 1.2 m in front of the facade; they never touch the baked buildings of plan 037) and registers a record `{ type: "signboard", key, name: "local:sign-<key>", x, y, z }` in `objects`. Mapping rule (13 signs): the 7 shop keys `kumar-stores selvi-tailors tn-bakery medical provision barber` go to `shop-row` plots in plot id order, one per plot (the plot nearest the jetty root takes `fresh-fish`, then the remaining keys follow in that order); `anbu-tea` stands at the square tea stall, `fish-market` at the fish market (record `harbour:fish-market`), `harbour` at the jetty root, `bus-stand` at the bus stop shelter, `welcome` at the gopuram, `temple` at the temple gate. At least 7 `shop-row` plots exist (plan 032 gives 8 or more); fewer is a test failure.
- Local items and tagging, by this plan only. `src/world/local/tagLocal.js`: `tagLocalItem(object, key)` sets `object.userData.localItem = key`; `tagHarbour(root)` walks the harbour root and tags by name prefix `harbour:<type>` (types `catamaran`, `net-rack`, `net-heap`, `fish-rack`, `jetty`, `fish-market`) so plan 038 code needs no change; the builders of this plan tag their own objects (`gopuram`, `temple`, `kolam`, `tea-stall`, `auto-rickshaw`, `bus-town`, `bus-shelter`, `fruit-cart`, `bunting`, `scooter`, `cycle-parked`, `signage-tamil` for every sign board whose material `userData.text.ta` has a Tamil character).
- `src/world/layout/localDetail.json` lists the required items and minimum counts: `gopuram` 1, `temple` 1, `kolam` 25, `tea-stall` 2, `auto-rickshaw` 3, `bus-town` 1, `bus-shelter` 1, `fruit-cart` 3, `bunting` 6, `scooter` 4, `cycle-parked` 2, `catamaran` 10, `net-rack` 4, `net-heap` 2, `fish-rack` 4, `jetty` 1, `fish-market` 1, `signage-tamil` 12.
- `scripts/check-local-detail.mjs` (exports `checkLocalDetail({ root })`; CLI exit 1 on a miss; `package.json` script `check:local`): it builds in Node the REAL objects (`buildHarbour` with `placeHarbourProps`, `buildLocal`, `buildSigns`, `buildGopuram`, `buildSmallTemple`, `loadTown()` data) and counts each key as the number of Object3D with `userData.localItem` equal to the key after `tagHarbour` (counts come from the built objects, never from data files), and also checks the Tamil font file `assets/fonts/noto-sans-tamil-tamil-400.woff2` and `assets/licenses/OFL-noto-sans-tamil.txt` exist (A26). `tests/unit/local/localDetail.test.js` runs it on the real data and on a trimmed data set (one building list emptied) that must fail naming the missing key.
- `src/world/areas/localAreas.js` exports `createLocalAreas(game, town)` returning three area definitions (radii rule of ARCH 10.8: `unloadRadius > loadRadius`): `west-gate` (centre `local.gate`, priority 50, `loadRadius` 150, `unloadRadius` 200; gopuram, temple, garlands, the bunting nearest to it), `street-life-centre` (centre the square centre, priority 50, `loadRadius` 130, `unloadRadius` 180) and `street-life-harbour` (centre the jetty root, priority 50, `loadRadius` 130, `unloadRadius` 180); each item and sign belongs to the area named in its `area` field. `load` adds root, colliders (ids prefixed `local:`) and `objects` into `game.areaObjects`; `dispose` removes them. Register in `src/main.js` (plan 040 later wraps this). Test `tests/unit/local/localAreas.test.js`: radii rule, every item lies within the `loadRadius` of its own area, every item belongs to exactly one area.
- `src/dev/worldHook.js`: add `listSigns()` returning `game.areaObjects` records of type `signboard` as `[{ key, en, ta, mounted: true, x, z }]` (`en`, `ta` from `signText(key)`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/signageLocal.test.js tests/unit/content/signage.test.js tests/unit/local/localDetail.test.js tests/unit/local/localAreas.test.js`
- `node scripts/check-local-detail.mjs`
- `node "{{runner}}/assert.mjs" exists src/world/layout/localDetail.json scripts/check-local-detail.mjs src/world/local/tagLocal.js src/world/local/placeSigns.js src/world/areas/localAreas.js`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "listSigns"`

### Step 4: Spots, Playwright and shots

Deliver:
- Spots: append to `src/budgets.json` AND `src/shots.json` (identical `x, y, z, yaw, pitch`, never change an existing one) the ids `gopuram`, `temple`, `street-life`, `tea-stall`, `shop-signs`, as literal numbers computed from the real data: with `G` = `local.gate`, `P` = `local.temple` and the look direction `(-sin yaw, -cos yaw)`: `gopuram` camera 22 m west of the gate on the road, `y` = ground + 2.5, looking east at the gate (yaw -1.5708 when the road runs east), pitch -0.05; `temple` camera 20 m from `P` toward the road, `y` = ground + 2.5, looking at `P`, pitch -0.1; `street-life` camera on the `main` road 40 m east of the square edge looking east, pitch -0.1; `tea-stall` camera 7 m from the square tea stall looking at it, `y` = ground + 1.8, pitch -0.1; `shop-signs` camera 10 m in front of the plot with the sign `kumar-stores`, `y` = ground + 2.2, looking at it, pitch -0.05. Every spot within `WORLD_RADIUS - 5`. Plan 036 owns `beach` and `forest`, plan 034 `main-street`: do not reuse those ids.
- `tests/e2e/local-detail.spec.js` (`?time=0.4&freeze=1`, wait for `ready`, every wait is `expect.poll(..., { timeout: 20000 })`, never a fixed delay): read the `gopuram` record of `listObjects()` (`x`, `z`, `rot`; the passage axis `t = (sin rot, cos rot)`, negated if needed so it points east); teleport 12 m before the gate along `-t` (`teleport(x, z, undefined, yaw)` with `yaw = atan2(-t.x, -t.z)`), hold `w` and poll until the player is at least 3 m past the gate line (dot of the offset with `t`), not blocked and `y` within 0.15 of the terrain height; `listObjects()` contains the local items with counts at or above `localDetail.json` (for every key but `signage-tamil`, which is counted from `listSigns()`); `listSigns()` has at least 12 entries and every `ta` has a Tamil character; zero console errors; `check:budget` with the five new spots passes.
- Shots: `npm run shots -- --spots gopuram,temple,street-life,tea-stall,shop-signs --plan 039`; open each PNG in `docs/shots/039/` with the Read tool and fix obvious defects (floating items, items inside walls, missing signs); do not add deity imagery (best effort, never fails; list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/budgets.json "gopuram"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "street-life"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "shop-signs"`
- `node "{{runner}}/assert.mjs" has src/shots.json "gopuram"`
- `node "{{runner}}/assert.mjs" has src/shots.json "temple"`
- `node "{{runner}}/assert.mjs" has src/shots.json "tea-stall"`
- `node "{{runner}}/assert.mjs" has src/shots.json "shop-signs"`
- `npx playwright test tests/e2e/local-detail.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/local/gopuram.test.js tests/unit/local/streetLife.test.js tests/unit/local/localDetail.test.js tests/unit/local/localAreas.test.js tests/unit/content/signage.test.js tests/unit/content/signageLocal.test.js tests/unit/props/allProps.test.js tests/unit/props/street.test.js tests/unit/layout/townSchema.test.js tests/unit/budgets/budgets.test.js`
- `node scripts/check-local-detail.mjs`
- `npx playwright test tests/e2e/local-detail.spec.js`
- `npm run check:budget`

Human check (goes in the report, never blocks): A person from Tamil Nadu should check the gopuram, temple, kolam, catamaran and every Tamil string (D25, A2).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
