# Plan 039: Gopuram gate and small temple, street life, Tamil and English signage, local-detail manifest check

Epic E3. Estimated turns: 55.

## Goal

The identity of the town: a gopuram-style gate with a small temple at the west entrance (stepped tower with horizontal bands, red and white striped walls, stone steps, oil-lamp stand, flower garlands; NO idols or deity images, A2), street life (kolam patterns at doorsteps, two tea stalls, three parked auto-rickshaws, a town bus at a bus stop with shelter, fruit carts, festival bunting across the main street) and Tamil plus English signs on shops and public places. A manifest check proves every required local item exists in the built world (R9).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4 and requirement R9, decision D25, assumption A2, A15, A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/layout/town.json
- src/world/town/townBuilder.js
- src/world/kit/exterior.js
- src/world/kit/signTexture.js
- src/content/signage.js
- src/world/props/sets/harbour.js
- src/world/props/sets/outdoorSeating.js
- src/world/roads/surface.js
- assets/fonts

High-risk assumptions that touch this plan (each has a step that checks it):
- A2 (HIGH-RISK): temple and kolam are modelled respectfully as architecture and pattern only; Tamil strings are drafts for a person to check. D21: more is built by code, so the look is the risk.

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Gopuram gate and temple builders

Deliver:
- `tests/unit/local/gopuram.test.js` first. `src/world/local/gopuram.js`: `buildGopuram({ tiers = 5, baseW = 9, baseD = 6 })` (a gate with a central passage 3.5 m wide and 4.5 m high, a stone base, then 5 tiers each smaller than the last with horizontal moulding bands, small arched niches left EMPTY (no figures), vertical red and white stripes on the lower walls, a barrel-vault crown with a row of 7 kalasam finials in brass, total height 14 to 18 m); `buildSmallTemple()` (a square sanctum with a pyramidal vimana roof, an entrance mandapa on 8 pillars, a stone plinth and 5 steps, a flagpole (dhwajasthambam) and a stone oil-lamp pillar with 12 lamp cups, a perimeter wall with a gate; the sanctum interior is empty and its door is open but decorative). `buildGarland(path)` marigold strings as small orange and yellow bead meshes along a catenary between two points (instanced).
- Tests: gopuram height 14 to 18 m, 5 tiers (child groups named `tier-1`..`tier-5`) with decreasing widths, a passage that a 0.35 m circle can walk through (collider check with the walk graph on the generated colliders), 7 finials; the temple has an open entrance reachable from outside; no mesh or material in either builder is named with the words `idol`, `deity`, `statue` (a naming guard); garland points lie on a catenary (sag between 0.3 and 1.0 m for a 6 m span).
- Place the gopuram and temple at the west entrance on the main road (data in `town.json` `local.gate` and `local.temple`, regenerate with the script if needed) so the main road passes through the gate passage.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/local/gopuram.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/local/gopuram.js`

### Step 2: Street life props and placement

Deliver:
- `tests/unit/local/streetLife.test.js` first. `src/world/props/sets/street.js`, category `street`: `auto-rickshaw` (three-wheeler: yellow canopy, black lower body, one front wheel, open sides, driver seat and a rear bench; 2.7 m long), `bus-town` (a 10 m single-deck bus in two-tone paint with a destination board using a text slot, windows, wheels), `bus-stop-shelter` (roof, back wall, bench), `tea-stall` (a wooden kiosk with a tin roof, a counter, a kettle on a stove, glass jars of biscuits, a hanging banana bunch, a stool bench), `fruit-cart` (two-wheel pushcart with an awning and baskets of fruit blobs), `bunting` (a string of triangular flags between two poles with 12 flags), `kolam` (a flat decal mesh 1.6 m wide: in the browser a canvas texture of a dotted geometric pattern in white on a transparent background drawn with a seeded generator (4 pattern families); in Node a plain white disc), `water-pot-stand`, `scooter` (parked motorbike) and `cycle-parked`.
- `src/world/local/placeLocal.js`: places 25 or more kolam at house doorsteps (house plots, in front of the door), 2 tea stalls (one at the square, one at the harbour road), 3 auto-rickshaws (square, market, ferry terminal), the bus and its stop shelter near the ferry terminal anchor, 3 fruit carts on the main street, 6 bunting strings across the main street between poles every 30 m, scooters and cycles at shop rows. Data is deterministic from `town.json` and a seed; none overlap roads (carts and autos sit on the road edge or plot front) or other solid items.
- Tests: exact type list and sizes (auto 2.5 to 3.0 m long; bus 9 to 11 m); `kolam` is not solid and under 0.02 m high; placement counts and non-overlap with the clear-road rule of plan 034 (re-run the road clearance with these items as colliders: autos and carts must not block the main street centre lane); every placed item exists in the catalog.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/local/streetLife.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/street.js src/world/local/placeLocal.js`

### Step 3: Signage placement and the local-detail manifest check

Deliver:
- Extend `src/content/signage.js` with shop and place names (placeholders per A15, English and Tamil drafts): `kumar-stores` Kumar Stores / குமார் கடை, `anbu-tea` Anbu Tea Stall / அன்பு தேநீர் கடை, `selvi-tailors` Selvi Tailors / செல்வி தையல், `tn-bakery` Tamilnadu Bakery / தமிழ்நாடு பேக்கரி, `fresh-fish` Fresh Fish / புதிய மீன், `medical` Medical Shop / மருந்தகம், `provision` Provision Store / மளிகை கடை, `barber` Barber Shop / முடிதிருத்தகம், `fish-market` Fish Market / மீன் சந்தை, `bus-stop` Bus Stop / பேருந்து நிலையம், `harbour` Harbour / துறைமுகம், `welcome` Welcome / நல்வரவு. Each shop row bay and each public place gets a `signboard` with its key (at least 12 signs with both scripts in the town). The existing signage test of plan 025 keeps passing.
- `src/world/layout/localDetail.json` lists the required items and minimum counts: `gopuram` 1, `temple` 1, `kolam` 20, `tea-stall` 2, `auto-rickshaw` 3, `bus-town` 1, `bus-stop-shelter` 1, `fruit-cart` 3, `bunting` 6, `catamaran` 10, `net-rack` 4 (nets in total at least 6 with heaps), `fish-rack` 4, `jetty` 1, `fish-market` 1, `signage-tamil` 12.
- `scripts/check-local-detail.mjs` (exports `checkLocalDetail({ root })`; CLI exit 1 on a miss; add it to `package.json` as `check:local`): builds the placement lists headless (`placeLocal`, harbour, `buildTown`) and counts each item by `userData.localItem` (every builder and placement sets it); also checks the Tamil font file `assets/fonts/noto-sans-tamil-tamil-400.woff2` and `assets/licenses/OFL-noto-sans-tamil.txt` exist (A26). `tests/unit/local/localDetail.test.js` runs it on the real data and on a trimmed data set that must fail.
- Register the gate and temple as an area `west-gate` (priority 50), street life items inside the `centre`, `harbour` and town block areas as appropriate.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/local/localDetail.test.js`
- `node scripts/check-local-detail.mjs`
- `node "{{runner}}/assert.mjs" exists src/world/layout/localDetail.json scripts/check-local-detail.mjs`

### Step 4: Playwright and shots

Deliver:
- `tests/e2e/local-detail.spec.js`: boot; walk through the gate passage along the main road (teleport 12 m west of the gate facing east, hold `w` for 8 s: the player passes the gate line x and is not blocked); `listObjects()` contains the local items with counts at or above `localDetail.json`; the sign material text contains a Tamil character for at least 12 signs (hook `listSigns()` returning `[{ key, en, ta }]`); zero console errors; `check:budget` passes.
- Shots: `gopuram`, `temple`, `street-life`, `tea-stall`, `shop-signs` spots; `npm run shots --plan 039`; view and fix obvious defects (best effort). Do not add deity imagery.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/local-detail.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/local/gopuram.test.js tests/unit/local/streetLife.test.js tests/unit/local/localDetail.test.js tests/unit/content/signage.test.js`
- `node scripts/check-local-detail.mjs`
- `npx playwright test tests/e2e/local-detail.spec.js`

Human check (goes in the report, never blocks): A person from Tamil Nadu should check the gopuram, temple, kolam, catamaran and every Tamil string (D25, A2).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
