# Plan 023: Prop set C: kitchen, dining, bathroom and hotel room items (46 types)

Epic E2. Estimated turns: 55.

## Goal

Third furniture set, for kitchens, restaurants, bathrooms and hotel rooms, with South Indian details (wet grinder, clay stove, bucket and mug, brass tumblers, banana-leaf plates). Same quality bar and metadata rules as plan 019 and 022.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 10.5 and decision D18, D21)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/sets/tables.js
- tests/unit/props/allProps.test.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Kitchen (16 types)

Deliver:
- `src/world/props/sets/kitchen.js` (category `kitchen`): `stove-gas` (4 burners with pan supports), `stove-clay` (a traditional clay chulha with a firewood opening), `counter-kitchen-straight` (base cabinets with a stone top, 2.4 m), `counter-kitchen-corner`, `sink-double` (steel double sink with a tap), `fridge` (double door), `microwave`, `hood-chimney`, `grinder-wet` (South Indian wet grinder: stone drum on a base), `rice-cooker`, `idli-steamer` (stacked steel plates in a pot), `pot-set` (three pots of different sizes), `pan-hanging` (a rail with hanging pans), `spice-rack`, `shelf-utensils` (wall shelf with steel tumblers and plates), `water-filter` (wall purifier).
- `tests/unit/props/kitchen.test.js`: exact list; counter height 0.85 to 0.95 m; the stove has 4 burner parts (children named `burner-1`..`burner-4`); the fridge is at least 1.7 m high.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/kitchen.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/kitchen.js`

### Step 2: Dining and restaurant (12 types)

Deliver:
- `src/world/props/sets/dining.js` (category `dining`): `plate-set` (a plate, a bowl and a spoon, `solid: false`), `thali-set` (round steel plate with six small bowls), `banana-leaf-setting` (a leaf with small food heaps in colour blobs), `glass-set`, `tea-glass-set` (small steel tumbler and davara), `water-jug`, `napkin-holder`, `menu-board` (standing board with a text slot), `buffet-counter` (long heated counter with six steel pans), `bar-counter` (restaurant service counter with a rail), `cash-counter` (counter with a till and a bell), `condiment-tray`.
- Small items are `solid: false` and sit via `place: "on:<table type>"`; boards and counters are solid with accurate sizes (`buffet-counter` about 3.0 by 0.8 m).
- `tests/unit/props/dining.test.js`: exact list; small items not solid and under 0.35 m; `menu-board.userData.textSlots` exists.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/dining.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/dining.js`

### Step 3: Bathroom and hotel room (18 types)

Deliver:
- `src/world/props/sets/bath.js` (category `bath`): `toilet` (seat, lid, cistern), `washbasin-pedestal`, `washbasin-counter`, `bathtub`, `shower-cubicle` (glass panels, rose, fixed with a tray), `towel-rail`, `towel-stack`, `mirror-bath`, `bucket-mug` (plastic bucket with a mug, a very common bathroom pair in India), `geyser` (wall water heater cylinder), `trash-bin-small`, `bath-mat`.
- `src/world/props/sets/hotelRoom.js` (category `hotel`): `minibar` (small fridge with a glass door), `safe-box`, `luggage-suitcase`, `luggage-trolley` (brass trolley with a suitcase), `tv-wall` (flat panel on a wall bracket), `tv-stand`, `luggage-rack` (folding), `kettle-tray` (tray with kettle and two cups).
- `tests/unit/props/bath.test.js`: exact lists of both files; the toilet seat height 0.38 to 0.45 m; `bathtub` length 1.5 to 1.8 m; `bath-mat` not solid; the whole catalog now has at least 125 registered types (sets A, B, C): assert `listPropTypes().length >= 125` and no duplicate names.
- Run `npm run shots -- --fixture props --plan 023`, look at the PNG, fix obvious defects (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/bath.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/bath.js src/world/props/sets/hotelRoom.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/kitchen.test.js tests/unit/props/dining.test.js tests/unit/props/bath.test.js tests/unit/props/allProps.test.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
