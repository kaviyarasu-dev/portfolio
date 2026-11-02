# Plan 022: Prop set B: storage, books, lighting fixtures, textiles, plants, decor, fans, signs (51 types)

Epic E2. Estimated turns: 55.

## Goal

Second furniture set: 51 new prop types (storage 10, books 6, lamps 9, textiles 5, plants 8, decor 6, air 3, signs 4). With sets A (40, plan 019) the catalog then has 91 types. The quality bar and rules are those of plan 019 (read `docs/world-conventions.md` and the existing sets first). This plan also extends the prop metadata mechanism: `registerProp(type, { ..., meta })` where `meta` may hold `lightSockets`, `animated`, `textSlots`, `parts`, `mount`, `topY`; `buildProp` copies every `meta` key into `userData` and `getPropMeta(type)` returns them too. Plan 023 and the building plans reuse all of it.

Conventions fixed here (also appended to ARCHITECTURE.md 10.8 by the plan writer and written into `docs/world-conventions.md` by this plan). (1) Origin: every prop has its origin at the centre of its own footprint on the floor, front toward +z. A prop with `meta.mount: "wall"` is modelled at its real mounting height on that footprint (its back face at `z = -d/2`, the geometry floating at its real height, wall clock centre at 2.2 m); a prop with `meta.mount: "ceiling"` hangs from `y = 3.0` (the ceiling of a 3.0 m room; the building placer shifts it for other ceiling heights, plan 021). `size[1]` is always the top of the geometry above the floor (bbox `max.y`), so for mounted props `size[1]` includes the mounting height; `userData.topY` is the height of the usable top surface (default `size[1]`). Every wall or ceiling mounted type is `solid: false`. (2) `lightSockets: [{ x, y, z }]` in prop-local metres: where a building light attaches (inside the bounding box). (3) `animated: { kind: "spin", axis: "y", speed }` (speed in rad/s) on the root `userData`; the spinning part is a child `Group` named `blades` whose origin is the rotation centre; plan 061 spins it. (4) Clock hands are child groups named `hand-hour` and `hand-minute`, each pivoting at the clock centre; rotation 0 points to 12 o'clock and the hand turns clockwise seen from the front with NEGATIVE `rotation.z` (to show h hours m minutes: `minute.rotation.z = -2*PI*m/60`, `hour.rotation.z = -2*PI*((h % 12) + m/60)/12`). (5) `textSlots: [{ id, x, y, z, w, h }]` in prop-local metres facing +z (a board a building writes text on, plans 023, 025, 026); `parts` lists the names of the named sub-parts. (6) `finishProp` keeps nodes whose name starts with `keep-` or `hand-` and nodes named exactly `blades` unmerged (plan 019); their contents count toward the 12-mesh limit of the generic test.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5, 10.8 and decision D18)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/index.js
- src/world/props/sets/seating.js
- src/world/props/sets/tables.js
- src/world/props/sets/beds.js
- tests/unit/props/allProps.test.js
- tests/unit/props/catalog.test.js
- src/engine/materials.js
- src/util/rng.js
- docs/world-conventions.md
- src/dev/fixtures/props.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Metadata mechanism and the extra materials

Deliver:
- `tests/unit/props/catalogMeta.test.js` first (a NEW file; `catalog.test.js` is frozen by plan 019). Extend `src/world/props/catalog.js`: `registerProp` accepts `meta` (an object; only the keys `lightSockets`, `animated`, `textSlots`, `parts`, `mount`, `topY` are allowed, any other key throws), `buildProp` copies them into the result `userData` (deep copy, so a caller cannot mutate the registered data), `getPropMeta(type)` returns `{ size, solid, seats, category, topY, mount, lightSockets, animated, textSlots, parts }` with `topY` defaulting to `size[1]` and `mount` to `"floor"`; `mount` must be `floor|wall|ceiling` (else throw). If plan 019 already added some of this (read the file first), only add what is missing. Make sure the helper `ctx.box/cyl/sphere/rbox` accept `opts.name` (the mesh name) and that `finishProp` keeps nodes named `blades`, `keep-*`, `hand-*` unmerged; `buildProp(type, { rawParts: true })` returns the pre-merge group so tests can find parts by name (plan 019). Add what is missing and test it.
- Tests: a test type registered with `meta` shows the keys in `buildProp().userData` and in `getPropMeta`; defaults (`topY`, `mount`); an unknown meta key throws; bad `mount` throws; the copy is deep; a child named `blades` and one named `keep-x` survive `finishProp` as separate nodes while two plain meshes of one material merge into one.
- `src/world/props/extraMaterials.js` exports `registerExtraMaterials()` (idempotent: skip a name already in `MATERIAL_NAMES`) and calls it once at import time; every set file of this plan and of plan 023 starts with `import "../extraMaterials.js"`. It calls `registerMaterial(name, spec)` (plan 013) for the eight names that plan 013 does not have, all flat colour (no texture set, `set: null`): `brass` (color #b08d3c, roughness 0.35, metalness 0.9), `cork` (#b98d5b, 0.9, 0), `paper` (#f2eee3, 0.95, 0), `leather` (#5a3a24, 0.6, 0), `foliage` (#3f7d3a, 0.85, 0), `rubber` (#2a2a2a, 0.9, 0), `plastic` (#d8d8d8, 0.5, 0; always used with a `tint`), `wicker` (#b38b4d, 0.85, 0); `metersPerTile` 1, `normalScale` 1, `envMapIntensity` 0.6 for all. Brass is NEVER made from `metalBrushed` with a tint. Test (`catalogMeta.test.js`): after importing the module all eight names are in `MATERIAL_NAMES` and `getMaterial("brass").metalness` is 0.9.
- Index and conventions: `src/world/props/index.js` imports `extraMaterials.js` first and then every new set file of this plan (`storage`, `books`, `lamps`, `textiles`, `plants`, `decor`, `air`, `signs`; add each import as you create the file). `docs/world-conventions.md` gets a section "Prop metadata" documenting conventions (1) to (6) above, the eight extra materials, and the rule that mounted props are never solid.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/catalogMeta.test.js tests/unit/props/catalog.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/extraMaterials.js`
- `node "{{runner}}/assert.mjs" has src/world/props/catalog.js "lightSockets"`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "lightSockets"`

### Step 2: Storage and books (16 types)

Deliver:
- Sizes `[w, h, d]` in metres, `solid`, mount (every type below must be registered with exactly these `size`, `solid` and `meta.mount`; the test asserts this table). Storage (category `storage`, `src/world/props/sets/storage.js`): `wardrobe` [1.2, 2.0, 0.6] solid (two doors named `door-l`, `door-r`, handles, plinth); `bookshelf-tall` [0.9, 2.0, 0.35] solid (5 shelves, 4 of them filled with spines); `bookshelf-low` [1.0, 0.9, 0.35] solid (3 shelves, 2 filled); `cabinet-glass` [0.9, 1.8, 0.4] solid (glass doors `glass-l`, `glass-r` in `glass`, 3 shelves inside); `cabinet-low` [1.2, 0.85, 0.45] solid; `drawer-chest` [0.9, 1.0, 0.45] solid (3 drawers `drawer-1`..`drawer-3` with knobs); `shoe-rack` [0.8, 0.7, 0.3] solid; `filing-cabinet` [0.45, 1.3, 0.6] solid (3 drawers `drawer-1`..`drawer-3`); `locker-bank` [1.2, 1.8, 0.45] solid (4 metal lockers `locker-1`..`locker-4` in `metalPainted` tinted #4a6a8a); `shelf-wall` [1.0, 1.5, 0.25] NOT solid, `mount: "wall"` (board at 1.4 m top, two brackets).
- Books (category `books`, `src/world/props/sets/books.js`): `book-stack` [0.25, 0.2, 0.2] not solid; `book-row` [0.45, 0.3, 0.2] not solid (exactly 12 spines); `magazine-rack` [0.45, 0.85, 0.3] solid (a floor rack with 4 magazines); `notice-board` [1.2, 1.9, 0.06] not solid, `mount: "wall"`, cork board (`cork`) from 1.0 to 1.9 m with 6 pinned `paper` rectangles named `paper-1`..`paper-6`, `textSlots: [{ id: "header", x: 0, y: 1.8, z: 0.035, w: 1.0, h: 0.12 }]`; `whiteboard` [1.5, 1.9, 0.08] not solid, `mount: "wall"`, frame, marker tray and a marker (board from 1.0 to 1.9 m), `textSlots: [{ id: "board", x: 0, y: 1.45, z: 0.03, w: 1.3, h: 0.8 }]`; `paper-tray` [0.3, 0.12, 0.25] not solid (two stacked trays with paper).
- Spines: put the shared helper in `src/world/props/spines.js`: `addSpines(ctx, { count, x, y, z, maxWidth })` adds `count` book spines in a row (box per spine, seeded by `ctx.rng`: height 0.22 to 0.30 m, width 0.02 to 0.04 m, depth 0.18 m; colour picked from the 6-colour list `#7a2e2e #2e4a7a #2f6b4a #8a6a2a #5a3a6a #3a3a3a`); all spines use ONE material (a module-level clone of `getMaterial("paper")` with `vertexColors: true`, each spine geometry given a `color` attribute of its colour; no new material per colour, so the prop stays under the one-mesh-per-material limit). `book-row`, `bookshelf-*` and `book-stack` use it. Shelves visibly carry content: `bookshelf-tall` and `-low` call `addSpines` for 3 to 5 rows in total (tall 4 rows, low 2) with the row widths of the shelf.
- `tests/unit/props/storage.test.js`: the exact type lists of `storage.js` (10) and `books.js` (6); for each of the 16 types `getPropMeta` equals the table above (size, solid, mount); `buildProp(type, { rawParts: true })` contains the named parts listed above (`door-l`, `door-r`, `glass-l`, `glass-r`, `drawer-1..3`, `locker-1..4`, `paper-1..6`); `bookshelf-tall` total triangle count over 200 (sum over meshes of `index ? index.count / 3 : position.count / 3`); the merged spine mesh of `book-row` has a `color` attribute with at least 4 distinct colours and exactly 12 spine boxes in `rawParts`; the same `variant` gives identical output; `book-stack`, `book-row`, `paper-tray` are not solid and the other 13 follow the table.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/storage.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/storage.js src/world/props/sets/books.js src/world/props/spines.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/storage"`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/books"`

### Step 3: Lighting fixtures and textiles (14 types)

Deliver:
- Lamps (category `lighting`, `src/world/props/sets/lamps.js`; `size`, `solid`, `mount`, first `lightSockets` entry): `lamp-table` [0.3, 0.55, 0.3] not solid, socket (0, 0.42, 0); `lamp-floor` [0.4, 1.6, 0.4] solid, socket (0, 1.45, 0); `lamp-pendant` [0.45, 3.0, 0.45] not solid, `mount: "ceiling"` (cord from 3.0 down to the shade, shade bottom at 2.2), socket (0, 2.3, 0); `lamp-ceiling-flush` [0.5, 3.0, 0.5] not solid, `mount: "ceiling"` (a disc 0.08 thick at 2.92 to 3.0), socket (0, 2.9, 0); `lamp-wall` [0.2, 2.05, 0.25] not solid, `mount: "wall"` (bracket and shade at 1.9 m), socket (0, 1.95, 0.08); `lamp-street` [1.0, 4.5, 0.4] solid (cast pole 4.5 m, curved arm to +x, lamp head), socket (0.4, 4.3, 0); `lantern-hanging` [0.3, 3.0, 0.3] not solid, `mount: "ceiling"` (brass lantern on a chain, bottom at 2.3), socket (0, 2.45, 0); `oil-lamp-brass` [0.45, 1.2, 0.45] solid (a tall standing brass `kuthuvilakku`-style oil lamp: stem, tiered discs, a small flame; no deity imagery), socket (0, 1.05, 0); `tube-light` [1.25, 3.0, 0.12] not solid, `mount: "ceiling"` (a fluorescent tube in a batten, 1.2 m long, hanging 0.1 m from the ceiling), socket (0, 2.9, 0). Each lamp needs its socket inside its bounding box.
- Textiles (category `textiles`, `src/world/props/sets/textiles.js`), all not solid: `rug-rect` [2.0, 0.02, 3.0] (a border and a field in two `carpet` tints); `rug-round` [1.8, 0.02, 1.8]; `curtain-pair` [2.0, 2.4, 0.15] `mount: "wall"` (rod at 2.35 m, two curtains hanging to 0.1 m above the floor, each made of exactly 5 fold boxes named `fold-1`..`fold-5` whose heights are the curtain height times `[1.00, 0.92, 0.97, 0.92, 1.00]`); `doormat` [0.7, 0.02, 0.45] (`rubber` base with a `fabric` top); `cushion-set` [0.5, 0.2, 0.5] (three rounded cushions in three tints, small enough to sit on a sofa). Rugs and the doormat are at most 0.03 m thick (declared `size[1]` 0.02).
- `tests/unit/props/lamps.test.js`: exact lists of `lamps.js` (9) and `textiles.js` (5); every row of both tables above equals `getPropMeta` (size, solid, mount); every lamp has at least one `lightSockets` entry and every socket lies inside the prop bounding box (1e-3 tolerance); `lamp-street` size[1] between 4.0 and 5.0; rugs and doormat have bbox height at most 0.03; `curtain-pair` has 10 `fold-*` parts in `rawParts` and the fold height ratio min/max is 0.92 (within 0.005); `lamp-pendant` and `lantern-hanging` have `mount === "ceiling"` and bbox max y of 3.0 (within 0.02); the oil lamp has no part whose name contains a deity word (`ganesh`, `shiva`, `idol`, `deity`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/lamps.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/lamps.js src/world/props/sets/textiles.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/lamps"`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/textiles"`

### Step 4: Plants, decor, fans, AC and signs (21 types) and the registration test

Deliver:
- Plants (category `plants`, `src/world/props/sets/plants.js`): `plant-potted-large` [0.7, 1.8, 0.7] solid (a pot 0.4 m high, a trunk, 60 leaf quads); `plant-potted-small` [0.3, 0.5, 0.3] not solid; `fern-pot` [0.5, 0.7, 0.5] not solid; `money-plant-jar` [0.2, 0.4, 0.2] not solid (a glass jar with trailing vine); `planter-box` [1.0, 0.6, 0.35] SOLID (a wooden planter with a bushy plant); `planter-brick` [1.2, 0.9, 0.5] SOLID (a masonry planter with a shrub); `planter-hanging` [0.35, 3.0, 0.35] not solid, `mount: "ceiling"` (a pot hung on three chains, pot bottom at 2.2); `flower-vase` [0.2, 0.4, 0.2] not solid (vase with 7 stems and small flower heads). Leaves: the set builds ONE leaf material per module by cloning `getMaterial("foliage")` (named `foliage-leaf`), `side = DoubleSide`, `alphaTest = 0.5`, and only when `typeof document !== "undefined"` a 64x64 canvas leaf-shape texture (an ellipse with a midrib on a transparent background) as `map`; in Node the quads stay flat green. Leaf quads are `PlaneGeometry(0.16, 0.28)` rotated and placed on a shell of radius 0.35 m around the crown centre with `ctx.rng` (seeded, so the same variant is identical). `fern-pot` uses 30 quads, `plant-potted-small` 24, planters 40.
- Decor (category `decor`, `src/world/props/sets/decor.js`): `wall-clock` [0.4, 2.4, 0.06] not solid, `mount: "wall"` (round clock, 0.4 m diameter, centre at 2.2 m; hands as the child groups `hand-hour` (length 0.10) and `hand-minute` (length 0.15) pivoting at the centre, `parts: ["hand-hour", "hand-minute"]`); `picture-frame-set` [1.2, 1.9, 0.04] not solid, wall (three frames of different size between 1.4 and 1.9 m); `mirror-wall` [0.7, 1.8, 0.04] not solid, wall (mirror from 1.0 to 1.8 m, frame in `woodDark`); `mirror-standing` [0.6, 1.7, 0.4] solid (a tilted floor mirror on a frame with feet); `vase-floor` [0.4, 0.9, 0.4] solid; `brass-urn` [0.45, 0.8, 0.45] solid (`brass` material, no imagery). Air (category `air`, `src/world/props/sets/air.js`): `fan-ceiling` [1.3, 3.0, 1.3] not solid, `mount: "ceiling"`, `animated: { kind: "spin", axis: "y", speed: 6 }`, a downrod from 3.0, a motor housing, and a child group `blades` (centre at y 2.75) of 4 blade boxes in `woodDark`; `fan-pedestal` [0.45, 1.3, 0.45] solid; `ac-split` [0.95, 2.45, 0.25] not solid, `mount: "wall"` (a white split unit 0.9 x 0.3 m with a grille, bottom at 2.15 m).
- Signs (category `signs`, `src/world/props/sets/signs.js`), all with a `textSlots` entry: `sign-hanging` [0.8, 3.0, 0.06] not solid, `mount: "ceiling"` (a board hung by two chains, board from 2.3 to 2.8 m), slot `{ id: "main", x: 0, y: 2.55, z: 0.035, w: 0.7, h: 0.4 }`; `sign-door-plate` [0.25, 1.6, 0.02] not solid, wall (a plate 0.25 x 0.12 at 1.55 m), slot `{ id: "main", x: 0, y: 1.55, z: 0.012, w: 0.2, h: 0.08 }`; `sign-board` [1.6, 2.0, 0.1] SOLID (two posts and a board 1.4 x 0.6 m at 1.3 to 1.9 m), slot `{ id: "main", x: 0, y: 1.6, z: 0.055, w: 1.4, h: 0.6 }`; `room-number-plate` [0.18, 1.8, 0.02] not solid, wall (a plate 0.18 x 0.1 m at 1.7 m), slot `{ id: "number", x: 0, y: 1.7, z: 0.012, w: 0.15, h: 0.07 }`. The text itself is drawn by plan 025 onto the slot rectangle.
- `tests/unit/props/setsB.test.js`: the constant list of all 51 names of this plan (storage 10, books 6, lamps 9, textiles 5, plants 8, decor 6, air 3, signs 4) is contained in `listPropTypes()`, with no duplicates in the catalog and `listPropTypes().length >= 91`; each name builds with `buildProp` without throwing. `tests/unit/props/decor.test.js`: exact lists of `plants.js` (8), `decor.js` (6), `air.js` (3), `signs.js` (4); every row of the tables above equals `getPropMeta`; `fan-ceiling.userData.animated` equals `{ kind: "spin", axis: "y", speed: 6 }` and `rawParts` has a group `blades` with exactly 4 child meshes; `wall-clock` has `hand-hour` and `hand-minute` groups that survive `finishProp`; rotating `hand-minute` by `-PI/2` (rotation.z, after `updateMatrixWorld`) moves the centre of its bounding box to positive x with the same y as the clock centre (clockwise to 3 o'clock), and rotation 0 puts it above the centre; `plant-potted-large` has at least 120 triangles in the mesh whose material is named `foliage-leaf`, that material is `DoubleSide` with `alphaTest` 0.5, and building it twice with the same variant gives identical positions; planters and signs declare `solid` as in the table; each sign has a `textSlots` entry whose rectangle lies inside the bounding box in x and y; the 21 types of this step have `getPropMeta().mount` as in the table.
- Visual self-review (best effort, never a gate): the props fixture lays types in rows per category (plan 019); for each category of this plan run `npm run shots -- --fixture props --plan 022 --pose <x>,2.0,<z+5>,0,-0.25 --out docs/shots/022/<category>` with x, z the centre of that category row (read `src/dev/fixtures/props.js` for the layout), open the PNGs with the Read tool and fix floating parts, wrong proportions or flipped normals. `docs/shots` is written by the tool (git-ignored); a refused write there never fails the step. Run `npx vitest run tests/unit/props` at the end: all prop tests of plans 019, 022 must pass.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/decor.test.js tests/unit/props/setsB.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/plants.js src/world/props/sets/decor.js src/world/props/sets/air.js src/world/props/sets/signs.js`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/signs"`
- `node "{{runner}}/assert.mjs" has src/world/props/index.js "sets/air"`
- `npx vitest run tests/unit/props`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props`
- `npx vitest run tests/unit/props/catalogMeta.test.js tests/unit/props/storage.test.js tests/unit/props/lamps.test.js tests/unit/props/decor.test.js tests/unit/props/setsB.test.js tests/unit/props/allProps.test.js`

Human check (goes in the report, never blocks): Open the shots of this set: judge that wardrobes, shelves, lamps, plants and fans look like real objects (not boxes), that the oil lamp and urn carry no religious imagery, and that the wall clock, fan and signs sit at believable heights. Visual realism cannot be machine-checked.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
