# Plan 042: Prop set E: library, museum, school, post office, security and transport (49 types)

Epic E4. Estimated turns: 55.

## Goal

Fifth furniture set for the library, the town hall, the academy, the post office, the gatehouse and the ferry terminal. Same quality bar and metadata rules as before. Items that show text (plaques, boards, departure board) carry `userData.textSlots`.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 10.5 and decision D18)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/sets/seating.js
- src/world/props/sets/storage.js
- tests/unit/props/allProps.test.js
- src/engine/materials.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Library and museum (20 types)

Deliver:
- `src/world/props/sets/library.js` (category `library`): `library-stack` (a tall double-sided book stack 2.4 m high, 2 m long, 6 shelf levels filled with varied spines), `reading-desk` (long desk with two lamps), `card-catalog` (a wall of small drawers with brass pulls), `reading-lamp-green` (bankers lamp), `book-cart`, `ladder-library` (rolling ladder on a rail), `globe` (a globe on a wooden stand, spins as metadata), `map-table` (a table with a large map on top), `archive-box`, `scroll-case`.
- `src/world/props/sets/museum.js` (category `museum`): `display-case-glass` (a glass-topped case with a lit base, items slot), `plaque-wall` (wall plate with text slot), `podium`, `rope-barrier` (two posts with a rope, not solid), `award-wall` (a wall panel with 9 framed certificates), `trophy-cup`, `flag-stand`, `timeline-wall` (a long wall panel 6 m with year marks and 8 text slots), `bust-abstract` (an abstract geometric head on a pedestal, no real person), `banner-hanging` (a hanging cloth banner with a text slot).
- `tests/unit/props/libraryMuseum.test.js`: exact lists; `library-stack` height 2.2 to 2.6 m with at least 40 book parts before merging NOT required, but a triangle count over 600; `rope-barrier` not solid; `timeline-wall` has 8 text slots; `globe` has animated metadata kind `spin` (slow).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/libraryMuseum.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/library.js src/world/props/sets/museum.js`

### Step 2: School and post office (17 types)

Deliver:
- `src/world/props/sets/school.js` (category `school`): `desk-school` (a two-seat bench desk with a slanted top), `blackboard` (a wall board 3.6 m wide with a chalk tray, text slot), `teacher-desk`, `lab-bench` (a long bench with a sink and gas taps), `microscope`, `beaker-set` (glassware group, not solid), `wall-chart` (a framed chart with a text slot), `school-bell` (a brass hand bell).
- `src/world/props/sets/post.js` (category `post`): `post-box-red` (a round-top red pillar box with a slot and a plate), `parcel-shelf`, `scale-parcel`, `stamp-desk` (a slanted desk with a stamp pad and an ink pot), `counter-grille` (a service counter 3 m wide with a brass grille window and a ledge), `queue-rope` (stanchions with a belt, not solid), `sorting-rack` (a wall of pigeonholes 4 by 6), `mail-sack`, `parcel-stack`.
- `tests/unit/props/schoolPost.test.js`: exact lists; `desk-school` seats 2; `sorting-rack` has 24 holes; `post-box-red` height 1.4 to 1.7 m; `blackboard` has a text slot; small items not solid.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/schoolPost.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/school.js src/world/props/sets/post.js`

### Step 3: Security and transport (12 types)

Deliver:
- `src/world/props/sets/security.js` (category `security`): `barrier-gate` (a striped boom barrier on a housing, `animated: { kind: "swing" }`), `security-desk` (a console desk with a monitor bank), `cctv-bank` (a wall of 6 small screens, slots), `key-cabinet` (wall cabinet with hooks and keys), `turnstile` (tripod turnstile, solid), `guard-stool`.
- `src/world/props/sets/transport.js` (category `transport`): `ticket-counter` (a counter with two windows and a queue rail), `ticket-machine` (a kiosk with a screen), `departure-board` (a large board, 8 text rows, text slots, emissive), `luggage-scale`, `route-map-board` (a board with a coloured line map), `life-jacket-rack` (a rack with 8 orange life jackets).
- `tests/unit/props/securityTransport.test.js`: exact lists; the barrier has swing metadata and a boom 3 to 4.5 m long; the departure board has 8 text slots; the catalog now has at least 260 registered types.
- Look at `npm run shots -- --fixture props --plan 042` (best effort) and fix obvious defects.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/securityTransport.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/security.js src/world/props/sets/transport.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/libraryMuseum.test.js tests/unit/props/schoolPost.test.js tests/unit/props/securityTransport.test.js tests/unit/props/allProps.test.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
