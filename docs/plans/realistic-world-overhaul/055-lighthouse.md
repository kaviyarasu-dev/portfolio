# Plan 055: Lighthouse and keeper cottage (zone lighthouse): climb to the top, contact board, journey 4

Epic E4. Estimated turns: 55. Model: opus.

## Goal

Build a real lighthouse with its keeper cottage on the north-east headland. The tower is climbed by stairs through three landings to the lamp room with a rotating Fresnel lens and a gallery walkway with a rail; the contact board in the lamp room opens the contact dialogue (LinkedIn, GitHub, email click-to-reveal; no phone number). The keeper cottage at the foot has a living room, bedroom and kitchen. The tower looks round from outside: a tapered cylinder skin over a square structural shell. Also prove journey 4 (walk the road from the harbour, climb, read the board).

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only lighthouse`).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.6 and requirement R6, R8, decision D4, D9, D18, A5, A30)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/building-manifest.md
- src/world/buildings/plaza/manifest.json
- src/world/buildings/plaza/build.js
- src/world/kit/exterior.js
- src/world/kit/building.js
- src/world/layout/town.json
- src/world/zones.js
- src/content/dialogues.js
- src/content/signage.js
- scripts/check-buildings.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Lighthouse

Deliver:
- Create `src/world/buildings/lighthouse/manifest.json` (schema of `docs/building-manifest.md`): `id: "lighthouse"`, `displayName: "Lighthouse"`, `prompt: "signal"`, footprint taken from the `lighthouse` anchor in `src/world/layout/town.json` (tower 7 by 7 m plus a cottage 10 by 7 m attached on the west side (one manifest, footprint about 18 by 8 m)), floors level 0 (y 0, h 5.0), level 1 (y 5.2, h 5.0), level 2 (y 10.4, h 5.0), level 3 lamp room (y 15.6, h 4.0), level 4 `rooftop: true` gallery (y 19.8); the cottage has only level 0 (h 3.2), style: plaster wall tint `#f3f1ec`, `cone` roof over the lamp room, trim `metalPainted` red; the exterior of the tower is a tapered cylinder skin with red and white bands.
- Rooms (ids fixed): `cottage-living` (keeper living room, 5 by 5 m); `cottage-bedroom` (keeper bedroom, 5 by 4 m); `cottage-kitchen` (keeper kitchen, 5 by 3 m); `tower-base` (tower ground room, 6 by 6 m with the first flight); `tower-landing` (mid landing room (level 1 and level 2 share the landing treatment; the room is level 1), 6 by 6 m); `lamp-room` (lamp room at the top (level 3), 6 by 6 m, glazed on all sides, with the lens). Room count between 3 and 6.
- Doors: a heavy main door at the foot of the tower facing the road (width 1.4, exterior, unlocked), a cottage front door (width 1.2, exterior, unlocked), a door between the cottage living room and the tower base (interior), `cottage-living` to `cottage-bedroom` and `cottage-kitchen` (interior), a door from `lamp-room` to the gallery (width 1.0, interior to the `rooftop` floor). At least one unlocked exterior door that is not decorative. Windows: at least 10 small round-look windows in the tower and 4 in the cottage. Stairs and lifts: four flights inside the tower: ground to level 1 (rise 5.2), level 1 to 2 (rise 5.2), level 2 to 3 (rise 5.2), level 3 to gallery by a short stair (rise 4.2); switchback layout with intermediate landings; no lift (the plan check treats the lamp-room room as reachable by stairs only).
- `exteriorDetails` counts (all seven classes, window at least 4): window 14, door 3, signage 2, drainpipe 2, planter 3, bin 2, lamp 6; the tower skin, gallery rail, a fog horn, a flagpole on the cottage and a low stone wall. `interactables`: declare only `contact-board` now (kind `read`, room `lamp-room`, `dialogueKey` `main`, prompt "signal").
- `tests/unit/buildings/lighthouse.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the lamp room and the gallery are reachable only through three flights; the rooftop gallery is walkable and its edge blocks; the tower door faces the road side of the anchor rotation; the CLI `check:buildings --only lighthouse --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/lighthouse.test.js`
- `node scripts/check-buildings.mjs --only lighthouse --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/lighthouse/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/lighthouse/build.js` exports `decorateLighthouse(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): the tower skin: a tapered cylinder (radius 4.3 at the base to 3.1 at the top) in 6 alternating red and white bands built as `CylinderGeometry` pieces with an arc gap at the door, small porthole windows, a gallery ring with a handrail and balusters, a lamp-room glass lantern with a cone cap and a weather vane, the cottage with a hip tile roof and a stone chimney, a flagpole, a stone wall, a lit sign "LIGHTHOUSE / கலங்கரை விளக்கம்" (key `lighthouse`).
- Signage from `src/content/signage.js`: add the keys `lighthouse`, `contact` (CONTACT / தொடர்புக்கு) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/lighthouseExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/lighthouseExterior.test.js`
- `node scripts/check-buildings.mjs --only lighthouse --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/lighthouse/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- New props first (category `nautical`, file `src/world/props/sets/nautical.js`, same quality bar and metadata rules as plans 019 and 022): `lens-fresnel`, `telescope-brass`, `chart-table`, `ship-wheel`, `lantern-storm`, `barometer`, `signal-flag-set`, `life-ring-wall`. `lens-fresnel` is a tall glass lens built from stacked prism rings with a bright emissive core and `animated: { kind: "spin", speed: 0.6 }`, 1.8 to 2.4 m high. Register them in `src/world/props/index.js` and add `tests/unit/props/nautical.test.js` (exact list, sizes within 20 percent of the bounding box, categories, lens height 1.8 to 2.4 m with the spin metadata, telescope length 0.6 to 1.2 m).
- Room `cottage-living` (floor material `woodPlanks`): `sofa-2`, `armchair` x2, `table-coffee`, `bookshelf-tall` x2, `lamp-table` x2, `lamp-floor`, `rug-round`, `picture-frame-set` x3, `wall-clock`, `chair-wooden` x2, `plant-potted-small` x2, `curtain-pair` x2, `telescope-brass`, `ship-wheel`, `barometer`, `fan-ceiling`, `cushion-set`, `table-side`, `brass-urn`, `lantern-storm` x2. Lights: lamps group `cottage-living` auto dusk.
- Room `cottage-bedroom` (floor material `woodPlanks`): `bed-double`, `table-bedside` x2, `lamp-table` x2, `wardrobe`, `drawer-chest`, `mirror-standing`, `rug-rect`, `curtain-pair`, `pillow-stack` x1 `on:bed-double`, `blanket-roll` `on:bed-double`, `picture-frame-set`, `chair-wooden`, `luggage-suitcase`, `wall-clock`, `fan-ceiling`, `signal-flag-set`. Lights: group `cottage-bedroom`.
- Room `cottage-kitchen` (floor material `floorTileDark`): `stove-clay`, `counter-kitchen-straight`, `sink-double`, `shelf-utensils`, `pot-set` x2, `table-dining-4`, `chair-wooden` x4, `fridge`, `water-filter`, `spice-rack`, `plate-set` x2 `on:table-dining-4`, `lantern-hanging`, `trash-bin-small`, `rice-cooker`, `tube-light`. Lights: group `cottage-kitchen`.
- Room `tower-base` (floor material `stoneRough`): `chart-table`, `chair-wooden`, `lantern-storm` x2, `rope-coil` x2, `life-ring-wall` x2, `shelf-wall`, `oil-lamp-brass`, `signal-flag-set`, `bench-stone`, `picture-frame-set`, `plaque-wall`, `locker-bank`, `notice-board`, `wall-clock`. Lights: wall lamps group `tower-base`.
- Room `tower-landing` (floor material `stoneRough`): `bookshelf-low`, `table-side`, `chair-wooden` x2, `telescope-brass`, `lantern-storm`, `lamp-wall` x2, `rug-round`, `picture-frame-set`, `signal-flag-set`, `flower-vase`, `wall-clock`. Lights: group `tower-mid`.
- Room `lamp-room` (floor material `metalBrushed`): `lens-fresnel` (centre, rotating), `telescope-brass`, `chart-table`, `stool`, `lantern-storm`, `sign-board` (the contact board: text slot "CONTACT / தொடர்புக்கு", key `contact`), `lamp-wall` x2, `barometer`, `table-side`. Lights: the beam lamp (emissive plus a spotlight in the pool), group `lamp-room`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. The lens beam: add a hook field `listObjects()` entry `lighthouse-beam` with its current angle so epic 5 can test it.
- Interactables: contact-board (`read`, the object is the contact board in the lamp room); light switches per room; seats the cottage sofa, armchairs and kitchen chairs.
- `tests/unit/buildings/lighthouseInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the contact board is within 4 m of the stair top and clear; the contact dialogue content (read `src/content/dialogues.js` and `contact.js`) has LinkedIn, GitHub, an email reveal button and no phone (the unit test renders the builder with a minimal fake DOM or inspects the content structure).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/lighthouseInterior.test.js tests/unit/props/nautical.test.js tests/unit/props/allProps.test.js`
- `node scripts/check-buildings.mjs --only lighthouse`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `lighthouse` becomes `name: "Lighthouse"`, `prompt: "signal"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `lighthouse` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `lighthouse` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `lighthouse` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the contact board in the lamp room) so `E` opens the existing dialogue for `lighthouse` (A5); the dialogue is the contact content as in v1 minus the phone (plan 004) with the email click-to-reveal.
- Add `lighthouse` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/lighthouse.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `lighthouse` with `interiorVisible` true and empty `problems`; walk to the the contact board in the lamp room and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[lighthouse].mustInclude` and the display name; Escape closes; journey 4 of the spec: from the harbour quay `walkTo` the lighthouse door along the road (timeout 90 s), `e` opens the door, climb the three flights with `walkTo` the stair foot targets (the stairs are climbed by holding `w` along each flight; use `teleport` with yaw to line up at each flight start if needed), reach the lamp room (`playerState().y` within 0.2 of 15.6), `e` on the contact board: `#dialogue` shows the LinkedIn and GitHub links and a `button.email-reveal`, and the page text contains no phone number (the regex of `check:phone`); walk out to the gallery and the rail blocks the edge; zero console errors.
- Add budget spots `lighthouse-outside` and `lighthouse-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 055 --spots lighthouse-outside,lighthouse-inside,lighthouse-top,lighthouse-cottage`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/lighthouse.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only lighthouse`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/lighthouse.test.js tests/unit/buildings/lighthouseExterior.test.js tests/unit/buildings/lighthouseInterior.test.js`
- `node scripts/check-buildings.mjs --only lighthouse`
- `npx playwright test tests/e2e/lighthouse.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the lighthouse silhouette and the view from the top.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
