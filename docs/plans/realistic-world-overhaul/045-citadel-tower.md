# Plan 045: GravityWrite HQ tower (zone citadel), part 1: structure, glass facade, lobby, lift and stairs

Epic E4. Estimated turns: 55. Model: opus.

## Goal

The modern office tower of GravityWrite (zone `citadel`): five levels, a lift and a staircase, glass curtain-wall facade with steel mullions and lit floor bands, a street-level lobby with reception. This plan builds the structure, the facade and the lobby; plan 046 furnishes the upper floors and converts the zone. Six rooms: `lobby` (level 0), `newsroom` (level 1), `meeting-room` and `executive-office` (level 2), `server-room` (level 3), `rooftop` (level 4, walkable roof terrace).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.6 and requirement R6, R8, decision D9, D18, D19)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/building-manifest.md
- src/world/buildings/plaza/manifest.json
- src/world/buildings/plaza/build.js
- src/world/kit/exterior.js
- src/world/kit/building.js
- src/world/kit/lifts.js
- src/world/layout/town.json
- src/content/dialogues.js
- scripts/check-buildings.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the tower

Deliver:
- `src/world/buildings/citadel/manifest.json`: `id "citadel"`, `displayName "GravityWrite HQ"`, `prompt "enter HQ"`, footprint from the `citadel` anchor (about 22 by 18 m), floors level 0 (y 0, h 4.6), level 1 (y 4.8, h 4.0), level 2 (y 9.0, h 4.0), level 3 (y 13.2, h 4.0), level 4 `rooftop: true` (y 17.4). Style: wall `concrete` tint `#d8dde3`, roof `flat`, trim `metalBrushed`.
- Rooms: `lobby` (whole ground floor), `newsroom` (whole level 1), `meeting-room` (level 2, 12 by 9 m, east part) and `executive-office` (level 2, west part), `server-room` (level 3, 10 by 8 m in the west with a corridor-like open area east counted as part of the room), `rooftop`. Stairs: a staircase core in the north-east corner linking every level (4 flights, rise 4.8, 4.2, 4.2, 4.2), and one lift in the same core serving levels 0 to 4. Doors: a revolving-look double entrance door south into `lobby` (width 2.4, `exterior`, unlocked), a service door (locked, exterior), `meeting-room` and `executive-office` doors to the stair core landing (the landing is part of the room that owns it; place the dividing wall so both rooms touch the stairs), `server-room` door (interior, unlocked).
- Windows: at least 30 large glass windows (sill 0.3, height 3.0) so the facade reads as curtain wall. `exteriorDetails`: window 30, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8. Interactable declared now: `meeting-screen` (kind `read`, room `meeting-room`, `dialogueKey` `main`, prompt "view project").
- `tests/unit/buildings/citadel.test.js` first: structure stage passes; five floors, the rooftop floor flagged; the lift serves levels 0 to 4; the stair core reaches every level (walk graph from outside to the rooftop with doors open); the service door is locked and the main door not; `check:buildings --only citadel --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadel.test.js`
- `node scripts/check-buildings.mjs --only citadel --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/citadel/manifest.json`

### Step 2: Glass curtain-wall facade and exterior details

Deliver:
- Add `curtainWall({ w, h, floors, mullionEvery = 1.5 })` to `src/world/kit/exterior.js` (with `userData.detailClass: "window"` counted per pane group): steel mullions and transoms in `metalBrushed`, tinted `glass` panes (blue-green tint, opacity 0.35), spandrel strips at each floor line with an emissive band that glows at night (group `citadel-bands`, registered with the light manager as an `auto: "dusk"` emissive-only light), a projecting entrance canopy with slim columns, a rooftop parapet with a glass rail. Test in a NEW file `tests/unit/kit/curtainWall.test.js` (finite geometry, pane count equals rows times columns, merged mesh count at most 6, the band is an emissive material).
- `src/world/buildings/citadel/build.js` `decorateCitadel`: apply `curtainWall` on the south, east and west facades (the north facade is a solid core wall in `concrete` with the stair tower look), the entrance canopy over the main door, a large lit signboard "GRAVITYWRITE" with a smaller Tamil caption (key `gravitywrite`, Tamil `கிராவிட்டிரைட்`, a draft), planters at the base, bins, wall lamps, rooftop water tank and a rooftop antenna pair (kit builders), a flagpole.
- `tests/unit/buildings/citadelExterior.test.js` first: counts at least the manifest, canopy leaves the entrance clear (walk graph reaches `lobby`), the tower height from the ground to the parapet is 17 to 19 m, draw-call friendly (exterior group at most 14 meshes).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/curtainWall.test.js tests/unit/buildings/citadelExterior.test.js`
- `node scripts/check-buildings.mjs --only citadel --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/citadel/build.js`

### Step 3: Lobby interior, lift check and shots

Deliver:
- `lobby` (floor `marble`): `reception-desk-modern` with a logo slot "GRAVITYWRITE", `sofa-3` x2, `armchair` x3, `table-coffee` x2, `plant-office` x4, `plant-potted-large` x2, `wall-tv-large` x2 (a screen glow), `sign-board` "WELCOME / நல்வரவு", `water-dispenser`, `coffee-machine`, `vending-machine`, `bench-wood` x2, `rug-rect` x2, `lamp-floor` x2, `ceiling-panel-light` x8, `ac-split` x2 (the lobby is air-conditioned), `exit-sign` x2, `fire-extinguisher` x2, `wall-clock`, `magazine-rack`, `notice-board`, `trash-bin-small` x2, `flower-vase` x2 `on:table-coffee`. At least 22 distinct types.
- Lights group `lobby` (panels, auto dusk) with a switch; the lift call button in the lobby and inside the cabin buttons for levels 0 to 4 (from the manifest `lifts`).
- `tests/unit/buildings/citadelLobby.test.js` first: rooms rule for `lobby` with 14 types; no placement problems; the lift cabin reaches level 4 in the headless simulation (`createLift` update loop with fake time) and the walk graph treats the cabin floor as reachable.
- `tests/e2e/citadel-lift.spec.js` on `?fixture=building-citadel` (extend the fixture generator: plan 024 created `building-plaza`; add a generic fixture `building-<id>` that builds any manifest by id, registered in `src/dev/fixtures/building.js`, and keep the old name working): ride the lift from the lobby to level 4: `playerState().y` within 0.1 of 17.4; walk 3 m on the roof; the parapet blocks the edge; zero console errors. Shots `citadel-outside`, `citadel-lobby` (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/citadelLobby.test.js`
- `npx playwright test tests/e2e/citadel-lift.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/building.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/citadel.test.js tests/unit/kit/curtainWall.test.js tests/unit/buildings/citadelExterior.test.js tests/unit/buildings/citadelLobby.test.js`
- `node scripts/check-buildings.mjs --only citadel --stage structure`
- `npx playwright test tests/e2e/citadel-lift.spec.js`

Human check (goes in the report, never blocks): Judge the tower facade at dusk and from the street.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- The kit cannot express the level layout: describe the limitation in BLOCKED.md instead of working around it with fake geometry.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
