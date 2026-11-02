# Plan 026: Grand Hotel ground floor: lobby, restaurant, kitchen, stair hall

Epic E2. Estimated turns: 55.

## Goal

Furnish and light the public rooms of the hotel with real detail: reception with the intro reading object (A6), lounge, restaurant with tables and a buffet, kitchen with stoves and counters, stair hall with the staircase and the lift. All content is data in the manifest (types from the catalog), per-room lights and switches, seats, and a `read` interactable at the reception desk. Rooms must meet the per-room richness rule of `check:buildings` (at least 14 distinct types each).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.6 and decisions D18, D19, A5, A6)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/buildings/plaza/manifest.json
- docs/building-manifest.md
- src/world/kit/place.js
- src/world/props/catalog.js
- src/content/signage.js
- src/content/dialogues.js
- scripts/check-buildings.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Lobby and reception

Deliver:
- Fill `lobby` in `src/world/buildings/plaza/manifest.json` (floor `marble`, wall plaster, ceiling height 3.8): a reception desk (`counter-straight` or a custom `reception-desk` type added to `src/world/props/sets/hotelRoom.js` with a bell, key rack and monitor children), a wall behind it with `wall-clock`, `sign-board` text slot "RECEPTION / வரவேற்பு", `picture-frame-set`; a lounge with `sofa-3` x2, `armchair` x2, `table-coffee` x2, `rug-rect`, `plant-potted-large` x3, `lamp-floor` x2, `bench-wood`, `luggage-trolley`, `luggage-suitcase`, `magazine-rack`, `notice-board`, `fan-ceiling` x3, `lamp-pendant` x3, `mirror-wall`, `flower-vase` on `table-side`, `doormat` at the door, `brass-urn`, `oil-lamp-brass` pair at the entrance. At least 18 distinct types.
- Lights: 3 pendants and 2 floor lamps with `group` `lobby`, `auto: "dusk"`; light switch interactable beside the main door (group `lobby`). Interactables: `reception-intro` (kind `read`, at the desk, `dialogueKey` `intro`, prompt "check in"), seats on both sofas and armchairs (`kind: "sit"`, positions taken from the props `seats`).
- `tests/unit/buildings/plazaLobby.test.js`: `check:buildings --only plaza --stage rooms --rooms lobby --min-types-per-room 14` logic passes (call `checkBuilding`); the reception desk is within 6 m of the main door; no placement problems in the lobby; the intro interactable exists; walk graph reaches the desk from outside.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/plazaLobby.test.js`

### Step 2: Restaurant and kitchen

Deliver:
- `restaurant` (floor `woodPlanks`): 8 tables (`table-dining-4` in a `grid:2x4` and 2 `table-round`), 32 chairs placed beside tables (`chair-dining`, `chair-cane`; use explicit coordinates or a `grid` plus `place` rules that keep chair clearance), `buffet-counter`, `bar-counter`, `cash-counter` at the door, `menu-board` x2 with "MENU / உணவு பட்டியல்" (add the key `menu` to `signage.js` with Tamil `உணவுப் பட்டியல்`), table settings (`plate-set`, `glass-set`, `water-jug`, `condiment-tray`, `napkin-holder` placed `on:table-dining-4` and `on:table-round`), `plant-potted-small` x4, `lamp-pendant` x6, `fan-ceiling` x4, `curtain-pair` at windows, `wall-clock`, `picture-frame-set` x3. At least 18 distinct types; interactables: a seat per chair at two tables (not all), switch for group `restaurant`.
- `kitchen` (floor `floorTileDark`): `counter-kitchen-straight` x2, `counter-kitchen-corner`, `stove-gas` x2, `stove-clay`, `sink-double`, `fridge` x2, `hood-chimney`, `grinder-wet`, `idli-steamer`, `rice-cooker`, `pot-set` x2, `pan-hanging`, `spice-rack`, `shelf-utensils`, `water-filter`, `table-folding` as prep table, `trash-bin-small`, `tube-light` x3, `fan-pedestal`. At least 16 distinct types. The service door (`locked`) keeps the kitchen reachable only through the restaurant.
- Lights and switches per room; windows from the structure manifest stay as they are.
- `tests/unit/buildings/plazaRestaurant.test.js`: the rooms rule for `restaurant,kitchen` with 14 types each; at least 30 chair items in the restaurant; no overlaps or door clearance problems; every table has at least two chairs within 1.2 m; the kitchen is reachable only through the restaurant door with the service door locked.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/plazaRestaurant.test.js`

### Step 3: Stair hall, lift, public-room Playwright test and shots

Deliver:
- `stairhall` (floor `floorTile`): the staircase to the first floor is already in the manifest; add `plant-potted-large` x2, `lamp-wall` x4, `sign-board` with "STAIRS / LIFT" Tamil `படிக்கட்டு / மின்தூக்கி` (add key `stairs-lift`), `notice-board`, `bench-wood`, `wall-clock`, `lift` entry in the manifest `lifts` for levels 0, 1, 2 with call buttons; at least 12 distinct types.
- `tests/e2e/hotel-public.spec.js` on `?fixture=building-plaza&time=0.5`: walk in through the main door (teleport 2 m south of the door facing it, `e`, hold `w`); `listBuildings()[0].problems` is empty; teleport to the reception, press `e`: `#dialogue` is visible and contains the name of the person (the plaza dialogue content); press Escape closes it; the lobby switch toggles `listLights()` for group `lobby`; sit on a lobby sofa; ride the lift from ground to level 1; zero console errors; `rendererInfo().calls` stays under 400 in the lobby.
- Shots: add spots `hotel-reception`, `hotel-restaurant`, `hotel-kitchen`, `hotel-stairhall` to `src/shots.json` (and the lobby and restaurant to `src/budgets.json` spots); run `npm run shots -- --fixture building-plaza --plan 026 --spots hotel-reception,hotel-restaurant,hotel-kitchen,hotel-stairhall`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures or black rooms (best effort; list what you fixed).
- `npm run check:buildings -- --only plaza --stage rooms --rooms lobby,restaurant,kitchen,stairhall --min-types-per-room 12` must pass.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/hotel-public.spec.js`
- `node scripts/check-buildings.mjs --only plaza --stage rooms --rooms lobby,restaurant,kitchen,stairhall --min-types-per-room 12`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/plazaLobby.test.js tests/unit/buildings/plazaRestaurant.test.js tests/unit/buildings/plaza.test.js`
- `node scripts/check-buildings.mjs --only plaza --stage rooms --rooms lobby,restaurant,kitchen,stairhall --min-types-per-room 12`
- `npx playwright test tests/e2e/hotel-public.spec.js`

Human check (goes in the report, never blocks): Walk the lobby, restaurant and kitchen and judge whether they feel like a real hotel.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
