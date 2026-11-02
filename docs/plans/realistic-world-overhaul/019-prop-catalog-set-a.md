# Plan 019: Prop catalog core and set A: seating, tables, beds (40 types)

Epic E2. Estimated turns: 55.

## Goal

Every landmark needs 40 or more distinct furniture and decor types. This plan builds the prop catalog (registration, metadata, headless-safe builders, merged meshes) and the first set of 40 well-detailed furniture types. Props are code-built from the shared material library (plan 013); a later plan swaps some for CC0 Poly Haven models without changing any type name.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 2, 10.5 and decision D18 (40+ distinct objects per building))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/engine/materials.js
- src/util/uv.js
- src/util/rng.js
- src/dev/fixtures/index.js
- src/dev/fixtures/materials.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Catalog core, builder helpers and the props fixture

Deliver:
- `tests/unit/props/catalog.test.js` first. `src/world/props/catalog.js`: `registerProp(type, { category, tags = [], size: [w, h, d], solid = true, seats = [], build(ctx) })` (types match `/^[a-z][a-z0-9-]*$/`; duplicate throws), `buildProp(type, { rng, tint, variant, tier } = {})` returning an `Object3D` with origin at floor centre, front toward +z, and `userData = { propType, size, solid, seats }`, `propExists(type)`, `getPropMeta(type)`, `listPropTypes()`, `listByCategory(cat)`. `ctx` passed to `build` has `{ m: getMaterial, box(w,h,d,mat,x,y,z), cyl(rTop,rBottom,h,mat,x,y,z,radial), sphere(...), rbox(w,h,d,radius,mat,x,y,z) (RoundedBoxGeometry), rng, tint, variant }`. Helper `finishProp(group)` merges all meshes that share a material into one mesh (`mergeGeometries`) so a prop has at most one mesh per material, applies `applyMetricUV` where the geometry has no uv, and sets `castShadow` and `receiveShadow`.
- `src/world/props/index.js` imports every set file (side-effect registration); `src/world/props/sets/` holds the set files. Sets must run in Node: no `document` access at import or build time (materials fall back to flat colours in Node).
- `src/dev/fixtures/props.js`: lays out every registered type on a grid, 3 m apart, rows per category; `listObjects()` (hook) returns the placed types; the fixture also logs nothing. Register it as `props`.
- Generic data-driven test `tests/unit/props/allProps.test.js` (written now, it keeps covering later sets automatically): for every `listPropTypes()` entry: `buildProp` returns an `Object3D` with at least 3 meshes before merging is NOT required, but after `finishProp` at most 12 meshes; bounding box height and footprint are each within 20 percent of the declared `size`; no NaN in positions; at least one mesh; `seats` positions lie inside the bounding box; building twice with different seeds gives the same size; type names unique.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/catalog.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/catalog.js src/world/props/index.js src/dev/fixtures/props.js`

### Step 2: Seating (14 types)

Deliver:
- Create `src/world/props/sets/seating.js` registering exactly these types (category `seating`): `chair-dining`, `chair-wooden`, `chair-cane` (woven seat, South Indian style), `chair-office` (5-star base, wheels), `chair-plastic` (moulded, stackable look), `chair-waiting` (a row of three joined seats), `armchair`, `sofa-2`, `sofa-3`, `stool`, `stool-bar`, `bench-wood`, `bench-park` (slatted, cast ends), `bench-stone` (granite slab on two legs).
- Quality bar for every type (this is what makes the world feel real, not a box with legs): at least 3 distinct parts with believable proportions (seat height 0.42 to 0.48 m, sofa depth 0.85 to 0.95 m), rounded cushions with `rbox`, visible legs or stretchers, different materials for frame and upholstery (`woodDark`, `fabric`, `metalBrushed`, `metalPainted`), a `variant` option for colour (the `tint` argument recolours the fabric). Seats: `chair-*`, `armchair`, `stool*`, `sofa-*` (one seat per 0.6 m of width), benches get one seat per 0.6 m, with `seats: [{ x, y, z, yaw }]` giving seat surface positions and facing (+z is the front).
- `tests/unit/props/seating.test.js`: the exact type list is registered; each seated type has seats with correct counts (`sofa-3` has 3, `chair-waiting` has 3, `stool` has 1, `bench-wood` has at least 2); seat heights between 0.38 and 0.55.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/seating.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/seating.js`

### Step 3: Tables and desks (14 types)

Deliver:
- Create `src/world/props/sets/tables.js` (category `tables`): `table-dining-4`, `table-dining-6`, `table-round`, `table-coffee`, `table-side`, `table-bedside` (with a drawer and a knob), `table-bar`, `table-folding`, `trestle-table`, `desk-wood` (with drawers), `desk-office` (metal legs, modesty panel), `console-table`, `table-tea-stall` (small low table with a tea glass rack), `counter-straight` (a 2 m service counter with a front panel and a top).
- Quality bar as in the previous step: table height 0.72 to 0.78 m (coffee 0.40 to 0.45, bar 1.05 to 1.1, counter 1.0 to 1.1), visible top thickness, legs or panels, a `woodDark` top with a slightly different `woodPlanks` apron or a `marble` top for two types. Tables are `solid`; `seats` empty. Declare `size` accurately because the building placement uses it for clearances.
- `tests/unit/props/tables.test.js`: exact type list; heights within the ranges above; `table-dining-6` footprint is larger than `table-dining-4`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/tables.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/tables.js`

### Step 4: Beds, bedding and outdoor seating (12 types)

Deliver:
- Create `src/world/props/sets/beds.js` (category `beds`): `bed-single`, `bed-double`, `bed-king` (headboard, mattress, base, two pillows, folded blanket), `charpai` (rope-strung cot with a wooden frame, local), `sleeping-mat` (rolled rattan mat), `pillow-stack`, `blanket-roll`, `luggage-bench` (low bench at the foot of a bed); and `src/world/props/sets/outdoorSeating.js` (category `outdoor`): `swing-bench` (hanging wooden bench on chains, a South Indian oonjal), `bench-bus-stop` (metal frame, three seats), `plastic-stool-set` (three stacked stools), `charpoy-low` (a low string stool).
- Beds: mattress top at 0.45 to 0.55 m; `seats` for `bed-single` (1), `bed-double` (2), `bed-king` (2), `charpai` (2) with the seat yaw facing +z and `y` at the mattress top; the `bed-king` size is about 2.0 by 2.1 m. `pillow-stack`, `blanket-roll`, `sleeping-mat` are small (`solid: false`) so they can sit on top of beds with `place: "on:bed-king"`.
- `tests/unit/props/beds.test.js`: exact type list; mattress heights; seats counts; the small items are not solid.
- Run the fixture once: `npm run shots -- --fixture props --plan 019` and open the PNG with the Read tool. Fix anything obviously wrong (floating parts, flipped normals, a type that looks like a single box). Best effort, never fails.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/beds.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/beds.js src/world/props/sets/outdoorSeating.js`
- `npx vitest run tests/unit/props`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/catalog.test.js tests/unit/props/allProps.test.js tests/unit/props/seating.test.js tests/unit/props/tables.test.js tests/unit/props/beds.test.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
