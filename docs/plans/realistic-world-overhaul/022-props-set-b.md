# Plan 022: Prop set B: storage, books, lighting fixtures, textiles, plants, decor, fans, signs (46 types)

Epic E2. Estimated turns: 55.

## Goal

Second furniture set. The quality bar and metadata rules are those of plan 019 (read `docs/world-conventions.md` and the existing sets first). New metadata used here: `lightSockets: [{ x, y, z }]` on lamps (where a building light is attached), `animated: { kind: 'spin', axis: 'y', speed }` on fans (plan 061 animates them), `text` slots on signs (the sign texture is added by the building).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 10.5 and decision D18)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/sets/seating.js
- src/world/props/sets/tables.js
- tests/unit/props/allProps.test.js
- src/engine/materials.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Storage and books (16 types)

Deliver:
- `src/world/props/sets/storage.js` (category `storage`): `wardrobe` (two doors, handles, plinth), `bookshelf-tall`, `bookshelf-low`, `cabinet-glass` (glass doors, shelves inside), `cabinet-low`, `drawer-chest`, `shoe-rack`, `filing-cabinet`, `locker-bank` (a row of 4 metal lockers), `shelf-wall`. `src/world/props/sets/books.js` (category `books`): `book-stack`, `book-row` (a row of 12 varied spines, used to fill shelves, `solid: false`), `magazine-rack`, `notice-board` (cork with pinned papers), `whiteboard` (frame, tray, marker), `paper-tray`.
- Shelves must carry their contents visually: `bookshelf-*` include 3 to 5 rows of `book-row` style spines merged into the prop. Heights: wardrobe 1.9 to 2.2 m, bookshelf-tall 1.9 to 2.2 m, cabinet-low 0.8 to 0.9 m.
- `tests/unit/props/storage.test.js`: exact type lists of both files; heights in range; books are not solid; `bookshelf-tall` has more than 4 distinct meshes before merging is not required, but its triangle count is over 200 (not an empty box).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/storage.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/storage.js src/world/props/sets/books.js`

### Step 2: Lighting fixtures and textiles (14 types)

Deliver:
- `src/world/props/sets/lamps.js` (category `lighting`, each with `lightSockets`): `lamp-table`, `lamp-floor`, `lamp-pendant` (cord, shade; socket under the shade), `lamp-ceiling-flush`, `lamp-wall`, `lamp-street` (cast pole 4.5 m, curved arm, lamp head), `lantern-hanging` (brass hanging lantern), `oil-lamp-brass` (a tall standing brass oil lamp, no deity imagery), `tube-light` (a fluorescent tube in a batten, common in Indian shops).
- `src/world/props/sets/textiles.js` (category `textiles`): `rug-rect`, `rug-round`, `curtain-pair` (hung from a rod, folds as a few thin boxes with different heights), `doormat`, `cushion-set`. Rugs are 0.02 m thick and `solid: false`.
- `tests/unit/props/lamps.test.js`: every lamp has at least one `lightSockets` entry inside its bounding box; the street lamp is 4 to 5 m high; rugs are not solid and at most 0.03 m high; exact type lists.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/lamps.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/lamps.js src/world/props/sets/textiles.js`

### Step 3: Plants, decor, fans, AC and signs (16 types)

Deliver:
- `src/world/props/sets/plants.js` (category `plants`): `plant-potted-large` (ficus-like, 60 leaf quads on a trunk), `plant-potted-small`, `fern-pot`, `money-plant-jar` (glass jar with trailing vine), `planter-box`, `planter-brick` (masonry planter with a shrub), `planter-hanging`, `flower-vase`. Foliage uses double-sided alpha-tested leaf geometry (a procedural leaf shape in a small canvas texture only in the browser; flat green quads in Node).
- `src/world/props/sets/decor.js` (category `decor`): `wall-clock` (the minute and hour hands are separate named children `hand-hour` and `hand-minute` so plan 061 can drive them), `picture-frame-set`, `mirror-wall`, `mirror-standing`, `vase-floor`, `brass-urn`. `src/world/props/sets/air.js` (category `air`): `fan-ceiling` (animated metadata), `fan-pedestal`, `ac-split` (wall unit with a grille). `src/world/props/sets/signs.js` (category `signs`): `sign-hanging`, `sign-door-plate`, `sign-board` (large board on posts), `room-number-plate`.
- `tests/unit/props/decor.test.js`: exact lists; `fan-ceiling.userData.animated.kind === "spin"`; `wall-clock` has the two hand children; planters declare `solid`; signs have a `text` slot (`userData.textSlots` with width and height in metres).
- Total types in sets B: 46. Run `npx vitest run tests/unit/props` and `npm run shots -- --fixture props --plan 022` and look at the PNG (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/decor.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/plants.js src/world/props/sets/decor.js src/world/props/sets/air.js src/world/props/sets/signs.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/storage.test.js tests/unit/props/lamps.test.js tests/unit/props/decor.test.js tests/unit/props/allProps.test.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
