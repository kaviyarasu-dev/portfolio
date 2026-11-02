# Plan 027: Grand Hotel upper floors: corridor, four guest rooms with bathrooms, rooftop, and journey 5

Epic E2. Estimated turns: 55.

## Goal

Furnish the first floor and the roof terrace and finish the hotel so the full Rich bar passes: corridor with numbered doors, four guest rooms each with a real bed, wardrobe, desk, TV, minibar and a separate bathroom, a walkable rooftop with water tank and seating, the lift, switches and seats. Then prove journey 5 (sit on the bed, switch to first person, stand up) and the whole-building check.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.6 and decisions D18, D19, requirement R6, R7)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/buildings/plaza/manifest.json
- src/world/buildings/plaza/build.js
- docs/building-manifest.md
- src/world/props/sets/hotelRoom.js
- src/world/props/sets/bath.js
- src/world/kit/exterior.js
- scripts/check-buildings.mjs
- tests/e2e/hotel-public.spec.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Corridor and the four guest rooms

Deliver:
- `corridor-1` (floor `carpet`): `rug-rect` runners x3, `lamp-wall` x6, `plant-potted-large` x2, `bench-wood` x2, `console-table` x2 with `flower-vase`, `wall-clock`, `picture-frame-set` x4, `fan-ceiling` x2, `sign-board` text "FIRST FLOOR / முதல் தளம்" (add key `first-floor`), `room-number-plate` per guest door (101 to 104 as text slots); at least 14 distinct types. Lights group `corridor-1` auto dusk, a switch at each end.
- `guest-1` to `guest-4` (floor `woodPlanks`, carpet rug on top): `bed-king` with `pillow-stack` and `blanket-roll` placed `on:bed-king`, `table-bedside` x2 with `lamp-table` x2 placed `on:table-bedside`, `wardrobe`, `desk-wood` with `chair-office` and `lamp-table`, `tv-wall`, `tv-stand` in two rooms and `armchair` + `table-side` in the other two, `minibar`, `safe-box`, `luggage-rack`, `luggage-suitcase`, `kettle-tray` `on:desk-wood`, `curtain-pair`, `rug-rect`, `mirror-standing`, `fan-ceiling`, `ac-split`, `picture-frame-set`, `wall-clock`, `flower-vase`; each room at least 18 distinct types, and the four rooms differ in at least 4 types (vary the layout: mirror the plan in two of them and give one room a `sofa-2`). Lights: bedside lamps and a ceiling light, group `guest-N`, switch at the door; `bed-king` is a `sit` interactable ("lie down") with its seat; the desk chair is a seat.
- `bath-1` to `bath-4` (floor `floorTile`, walls use the new `wallMaterial` room field below): `toilet`, `washbasin-pedestal`, `mirror-bath`, `shower-cubicle`, `towel-rail`, `towel-stack`, `bucket-mug`, `geyser`, `trash-bin-small`, `bath-mat`, `tube-light`; at least 10 distinct types each; light switch outside the door.
- Doors: `guest-1` and `guest-2` unlocked; `guest-3` and `guest-4` locked (a door plate "Do not disturb" is a nice touch but not required). Add a `wallMaterial` (string) field to the room schema in `src/world/kit/schema.js`, `shell.js` and `docs/building-manifest.md` if it is not there yet (default `plaster`), with a unit test in a NEW file `tests/unit/kit/wallMaterial.test.js`; do not edit frozen kit tests.
- `tests/unit/buildings/plazaUpper.test.js`: rooms rule for `corridor-1,guest-1,guest-2,guest-3,guest-4,bath-1,bath-2,bath-3,bath-4` with `minTypes` 14 for corridor, 18 for guests, 10 for baths (call `checkBuilding` with those per-room thresholds); no placement problems; `guest-1` and `guest-2` reachable with doors open, `guest-3` and `guest-4` not reachable while locked; both beds are `sit` interactables.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/plazaUpper.test.js tests/unit/kit/wallMaterial.test.js`

### Step 2: Rooftop, rooftop props and the whole-building check

Deliver:
- `src/world/props/sets/rooftop.js` (category `rooftop`): `roof-water-tank` (black cylindrical tank on a brick stand with a float pipe), `solar-heater` (two panels on a tilted frame with a small tank), `satellite-dish`, `clothes-line` (two posts with a wire and a few hung cloths, `solid: false`), `roof-access-hut` (a small box room with a door, decorative). Add `tests/unit/props/rooftop.test.js` (exact list, heights, `clothes-line` not solid).
- `rooftop` room: `table-round` x3 with `chair-plastic` x12, `planter-brick` x6, `planter-box` x4, `lamp-wall` x4, `bench-wood` x2, `roof-water-tank` x2, `solar-heater`, `satellite-dish`, `clothes-line`, `fan-pedestal`, `flower-vase` x3 `on:table-round`, `lantern-hanging` x4 (outdoor lighting). At least 14 distinct types. The 1.0 m parapet comes from the shell. `rooftop` lights auto dusk.
- Run the whole check: `npm run check:buildings -- --only plaza` (stage `full` is the default) must pass: at least 40 distinct types in total, every type registered, reachability, exterior detail classes, hotel rules.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/rooftop.test.js`
- `node scripts/check-buildings.mjs --only plaza`

### Step 3: Journey 5 and shots

Deliver:
- `tests/e2e/journey-5-sit.spec.js` on `?fixture=building-plaza&time=0.5` (journey 5 of the spec): teleport into `guest-1` (through the corridor: use the lift or stairs by teleporting to the first floor corridor, open the `guest-1` door with `e`, walk in), `e` on the bed: `playerState().sitting` is true and `playerAnim()` is `sit`; press `v`: `cameraMode()` is `first` and the camera is lower than the standing eye height (1.62); press `w`: stands up (`sitting` false), camera returns to the previous mode after pressing `v` again; the two locked rooms refuse (`listDoors()` shows them locked). Zero console errors.
- `tests/e2e/hotel-upper.spec.js`: ride the lift to level 2 (rooftop): `playerState().y` is within 0.1 of 7.6 and the player can walk 3 m on the roof without falling (y stays within 0.1); the parapet blocks walking off the edge (hold `w` toward the edge for 4 s: y does not change by more than 0.1 and the player is still within the footprint).
- Shots: spots `hotel-corridor`, `hotel-guest-1`, `hotel-bath-1`, `hotel-rooftop` added to `src/shots.json`; run them with `--plan 027`, view, fix obvious defects (best effort). Add the guest room and the rooftop to `src/budgets.json` spots.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-5-sit.spec.js`
- `npx playwright test tests/e2e/hotel-upper.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/plazaUpper.test.js tests/unit/props/rooftop.test.js tests/unit/buildings/plaza.test.js`
- `node scripts/check-buildings.mjs --only plaza`
- `npx playwright test tests/e2e/journey-5-sit.spec.js`
- `npx playwright test tests/e2e/hotel-upper.spec.js`

Human check (goes in the report, never blocks): Walk the guest rooms and the rooftop; judge realism and the layout.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
