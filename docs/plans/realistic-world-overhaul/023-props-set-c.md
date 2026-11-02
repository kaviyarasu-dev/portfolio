# Plan 023: Prop set C: kitchen, dining, bathroom and hotel room items (48 types)

Epic E2. Estimated turns: 60.

## Goal

Third furniture set, for kitchens, restaurants, bathrooms and hotel rooms: 48 new types (kitchen 16, dining 12, bathroom 12, hotel room 8), with South Indian details (wet grinder, clay stove, bucket and mug, steel tumblers and davara, banana-leaf setting, thali). With plans 019 (40) and 022 (51) the catalog has 139 types. Same quality bar, metadata conventions (origin, `meta.mount`, `size[1]` = top of the geometry, wall and ceiling props never solid, `lightSockets`, `textSlots`, kept parts) and materials rules as plans 019 and 022: read plan 022 conventions in `docs/world-conventions.md` ("Prop metadata") first.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 10.5, 10.8 and decision D18, D21)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/index.js
- src/world/props/extraMaterials.js
- src/world/props/sets/tables.js
- src/world/props/sets/decor.js
- tests/unit/props/allProps.test.js
- tests/unit/props/catalogMeta.test.js
- src/engine/materials.js
- src/dev/fixtures/props.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Kitchen (16 types)

Deliver:
- Materials: steel = `metalBrushed`; ceramic and porcelain = `floorTile` with tint #f4f4f0; granite = `stoneRough` with tint #3a3a3a; clay = `stucco` with tint #b5603a; brass, plastic, rubber, paper come from `registerExtraMaterials()` (plan 022: `import "../extraMaterials.js"` at the top of every set file here); wood = `woodDark`; glass = `glass`. If you need a name that is not in `MATERIAL_NAMES`, append it to `src/world/props/extraMaterials.js` (flat colour, same spec shape) and test it in `tests/unit/props/setsC.test.js`; never invent a material inline.
- `src/world/props/sets/kitchen.js` (category `kitchen`). Table of `[w, h, d]`, `solid`, mount (the tests assert exactly this): `stove-gas` [0.6, 0.9, 0.6] solid, topY 0.9 (a freestanding cooker: hob with 4 burners `keep-burner-1`..`keep-burner-4` and 4 pan supports `pan-support-1`..`pan-support-4`, knobs, oven door); `stove-clay` [0.5, 0.55, 0.5] solid (a traditional clay chulha in `stucco` terracotta tint, a firewood opening, two pot rings `keep-burner-1`, `keep-burner-2`); `counter-kitchen-straight` [2.4, 0.9, 0.6] solid, topY 0.90 (base cabinets with 4 doors, `granite` top); `counter-kitchen-corner` [1.2, 0.9, 1.2] solid, topY 0.90 (an L of two 0.6 m arms; its collider is the bounding box); `sink-double` [1.2, 1.15, 0.6] solid, topY 0.9 (steel top with 2 basins `basin-1`, `basin-2` and a tap, cabinet below); `fridge` [0.75, 1.8, 0.75] solid (double door `door-l`, `door-r`, handles); `microwave` [0.5, 0.3, 0.4] not solid; `hood-chimney` [0.9, 3.0, 0.5] not solid, `mount: "wall"` (hood from 1.5 to 1.9 m and a flue up to 3.0 m); `grinder-wet` [0.4, 0.45, 0.4] not solid (a stone drum `drum` with radius 0.14 or more on a base, a motor housing, a lid); `rice-cooker` [0.3, 0.25, 0.3] not solid; `idli-steamer` [0.4, 0.4, 0.4] not solid (a pot with 4 stacked perforated steel plates `plate-1`..`plate-4` and a lid); `pot-set` [0.65, 0.3, 0.3] not solid (three pots `pot-1`..`pot-3` with distinct radii 0.14, 0.11, 0.08); `pan-hanging` [1.0, 1.8, 0.35] not solid, wall (a rail at 1.7 m with 4 hanging pans); `spice-rack` [0.6, 1.8, 0.12] not solid, wall (2 shelves at 1.4 to 1.8 m with 8 small jars); `shelf-utensils` [1.0, 1.6, 0.25] not solid, wall (a shelf at 1.5 m with steel tumblers and plates); `water-filter` [0.3, 1.5, 0.2] not solid, wall (a wall purifier at 1.2 to 1.5 m). Items that stand on other items (microwave, rice-cooker, grinder, idli-steamer, pot-set) are plain props with the origin at their own base; stacking with `on:<type>` is something building manifests do, not this plan.
- `tests/unit/props/kitchen.test.js` first: the exact list of 16 types; every row of the table equals `getPropMeta` (size, solid, mount); measured quantities: `topY` of `counter-kitchen-straight` and `counter-kitchen-corner` between 0.85 and 0.95; `size[2]` (depth) of `stove-gas` 0.6; `fridge` `size[1]` at least 1.7; `buildProp(type, { rawParts: true })` has exactly 4 `keep-burner-*` and 4 `pan-support-*` in `stove-gas`, 2 `keep-burner-*` in `stove-clay`, 2 `basin-*` in `sink-double`, `door-l` and `door-r` in `fridge`, `drum` with bounding radius at least 0.14 in `grinder-wet`, exactly 4 `plate-*` in `idli-steamer`, and 3 `pot-*` in `pot-set` whose bounding widths are pairwise different by at least 0.03 m; `keep-burner-*` nodes survive `finishProp` unmerged.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/kitchen.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/kitchen.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/kitchen"`

### Step 2: Dining and restaurant (12 types)

Deliver:
- `src/world/props/sets/dining.js` (category `dining`). Table: `plate-set` [0.3, 0.06, 0.3] not solid (a plate, a bowl and a spoon); `thali-set` [0.4, 0.07, 0.4] not solid (a round steel plate `plate` with six small bowls `bowl-1`..`bowl-6` around it); `banana-leaf-setting` [0.5, 0.06, 0.4] not solid (a green leaf with five small food heaps as coloured blobs in different tints; it is wider than 0.35 on purpose); `glass-set` [0.25, 0.15, 0.2] not solid (two glasses); `tea-glass-set` [0.2, 0.1, 0.2] not solid (a small steel tumbler `tumbler` standing in a wider steel saucer-bowl `davara`); `water-jug` [0.15, 0.25, 0.15] not solid; `napkin-holder` [0.12, 0.12, 0.08] not solid; `menu-board` [0.55, 1.1, 0.12] SOLID (a flat board 0.45 x 0.7 m at 0.4 to 1.1 m on two legs, `textSlots: [{ id: "menu", x: 0, y: 0.75, z: 0.035, w: 0.4, h: 0.62 }]`); `buffet-counter` [3.0, 0.9, 0.8] solid, topY 0.90 (a long counter with a heated top and six steel pans `pan-1`..`pan-6` with lids); `bar-counter` [2.0, 1.05, 0.6] solid, topY 1.05 (a service counter with a brass foot rail); `cash-counter` [1.2, 1.05, 0.6] solid, topY 1.05 (a counter with a till and a bell); `condiment-tray` [0.3, 0.12, 0.2] not solid (a tray with 4 small bottles and jars).
- Small items are the eight types `plate-set`, `thali-set`, `banana-leaf-setting`, `glass-set`, `tea-glass-set`, `water-jug`, `napkin-holder`, `condiment-tray`: all `solid: false` and `size[1]` below 0.35 (the rule measures the HEIGHT only). Boards and counters are solid with the accurate sizes above (a building manifest places small items with `on:<table type>`, that is a manifest feature of plan 021; here they are plain props with origin at their own base).
- `tests/unit/props/dining.test.js`: the exact list of 12 types; every row equals `getPropMeta`; the eight small types are not solid and have `size[1] < 0.35`; `topY`: `buffet-counter` between 0.85 and 0.95, `bar-counter` and `cash-counter` between 1.0 and 1.1; `buffet-counter` `size[0]` between 2.8 and 3.2; `menu-board` has the `menu` textSlot whose rectangle lies inside its bounding box in x and y; `rawParts` has 6 `bowl-*` plus `plate` in `thali-set`, 6 `pan-*` in `buffet-counter`, and `tumbler` and `davara` in `tea-glass-set`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/dining.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/dining.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/dining"`

### Step 3: Bathroom and hotel room (20 types) and registration

Deliver:
- `src/world/props/sets/bath.js` (category `bath`, 12 types). Table: `toilet` [0.4, 0.8, 0.7] solid, topY 0.42 (a western toilet: bowl, seat `seat`, lid `lid`, cistern `cistern`; the seat top is `topY`); `washbasin-pedestal` [0.55, 0.9, 0.45] solid, topY 0.85; `washbasin-counter` [0.9, 0.9, 0.5] solid, topY 0.85; `bathtub` [0.75, 0.55, 1.7] solid, topY 0.55 (the rim; its LENGTH is `size[2]`); `shower-cubicle` [0.9, 2.1, 0.9] solid (a tray, two glass panels `glass-1`, `glass-2` in `glass`, a rain shower rose); `towel-rail` [0.6, 1.2, 0.1] not solid, wall (two bars at 1.0 and 1.2 m); `towel-stack` [0.35, 0.3, 0.25] not solid; `mirror-bath` [0.6, 1.8, 0.04] not solid, wall (mirror from 1.1 to 1.8 m); `bucket-mug` [0.4, 0.35, 0.35] not solid (a plastic bucket with a mug, the common Indian pair); `geyser` [0.4, 2.0, 0.4] not solid, wall (a water heater cylinder `tank`, 0.35 m diameter and 0.55 m high, at 1.45 to 2.0 m); `trash-bin-small` [0.25, 0.3, 0.25] not solid; `bath-mat` [0.6, 0.02, 0.4] not solid.
- `src/world/props/sets/hotelRoom.js` (category `hotel`, 8 types). Table: `minibar` [0.5, 0.8, 0.5] solid (a small fridge with a glass door `glass-door`); `safe-box` [0.4, 0.35, 0.35] not solid; `luggage-suitcase` [0.7, 0.25, 0.45] not solid (a suitcase lying flat with a handle and two latches); `luggage-trolley` [0.6, 1.5, 0.9] solid (a brass `brass` bellhop trolley with a suitcase on it); `tv-wall` [1.0, 1.6, 0.1] not solid, wall (a flat panel and bracket at 1.0 to 1.6 m); `tv-stand` [1.4, 0.5, 0.4] solid, topY 0.5; `luggage-rack` [0.8, 0.55, 0.5] not solid (a folding rack: two X-shaped leg pairs `leg-x-1`, `leg-x-2` and webbing straps); `kettle-tray` [0.3, 0.2, 0.2] not solid (a tray with a kettle and two cups).
- `src/world/props/index.js` imports all four new set files (`kitchen`, `dining`, `bath`, `hotelRoom`) next to the earlier ones (add each import when you create the file). `tests/unit/props/setsC.test.js`: the constant list of all 48 names (16 + 12 + 12 + 8) is contained in `listPropTypes()`; `listPropTypes().length` is at least 139 (later sets only add) and has no duplicate names; every one of the 48 builds with `buildProp` without throwing; every wall or ceiling mounted type of this plan is not solid.
- `tests/unit/props/bath.test.js`: the exact lists of `bath.js` (12) and `hotelRoom.js` (8); every row of both tables equals `getPropMeta`; `toilet` `topY` between 0.38 and 0.45; `bathtub` `size[2]` between 1.5 and 1.8; `bath-mat` is not solid; `rawParts`: `seat`, `lid`, `cistern` in `toilet`; `glass-1`, `glass-2` in `shower-cubicle`; `tank` in `geyser` is a cylinder (bounding box width and depth within 5 percent of each other, between 0.3 and 0.4); `glass-door` in `minibar`; `leg-x-1`, `leg-x-2` in `luggage-rack`.
- Visual self-review (best effort, never a gate): run `npm run shots -- --fixture props --plan 023 --pose <x>,2.0,<z+5>,0,-0.25 --out docs/shots/023/<category>` for each of the four categories (x, z = centre of the category row in the props fixture, see `src/dev/fixtures/props.js`), open the PNGs with the Read tool, fix floating parts, wrong proportions, flipped normals. `docs/shots` is written by the tool and git-ignored. Run `npx vitest run tests/unit/props` at the end.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/bath.test.js tests/unit/props/setsC.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/bath.js src/world/props/sets/hotelRoom.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/bath"`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/hotelRoom"`
- `npx vitest run tests/unit/props`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props`
- `npx vitest run tests/unit/props/kitchen.test.js tests/unit/props/dining.test.js tests/unit/props/bath.test.js tests/unit/props/setsC.test.js tests/unit/props/allProps.test.js`

Human check (goes in the report, never blocks): Open the shots of this set: judge that the stoves, wet grinder, clay chulha, thali and banana-leaf setting look recognisably South Indian and that bathroom and hotel items have believable proportions. Visual realism and cultural accuracy cannot be machine-checked.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
