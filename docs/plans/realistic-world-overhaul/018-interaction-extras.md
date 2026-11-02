# Plan 018: Light switches, sitting, the elevator and stairs in the interactions fixture

Epic E2. Estimated turns: 55.

## Goal

The remaining reusable interactions: light switches (toggle a light group), sitting on chairs, sofas and beds (avatar sit clip, camera adjusts, stand up on movement), and an elevator with doors and a moving floor that carries the player. Stairs are collision stairs (plan 016) and are built here into the fixture so the Playwright tests prove them. Each system is a headless state machine with Vitest tests plus a fixture-based Playwright test.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 10.5, requirement R5, decision D19)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/interaction/registry.js
- src/systems/interaction/doors.js
- src/systems/lights/lightManager.js
- src/entity/player.js
- src/engine/camera.js
- src/systems/controller.js
- src/dev/fixtures/interactions.js
- src/systems/collision/world.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Light switch and the sit system

Deliver:
- `tests/unit/interaction/switch.test.js` and `tests/unit/interaction/sit.test.js` first.
- `src/systems/interaction/lightSwitch.js`: `createLightSwitch({ id, group, x, y, z, registry, lightManager, events })` registers a `switch` interactable (prompt "turn lights on" / "turn lights off" from `isGroupOn`), `onUse` calls `toggleGroup` and emits `sfx:switch`; returns a handle with `dispose()`.
- `src/systems/interaction/sit.js`: `createSeat({ id, kind: 'chair|sofa|bed', x, y, z, yaw, standOffset = 0.7, registry, world, events })` registers a `sit` interactable (prompt "sit" / "lie down" for beds). `SitController` (one per game) states `standing|moving|seated|standing-up`: on use the player moves to the seat in 300 ms (position and facing), the avatar plays `sit` (`playAvatarAnim`), `game.player.sitting = true` and the controller ignores movement keys; any movement key or `e` stands up: the player moves to the stand point (`x + standOffset` along the seat yaw direction) after checking `world.blockedAt` there (try left, right, back when blocked; if all are blocked stay seated and toast "no room to stand"), plays `idle`, and `sitting` becomes false. Camera while seated: distance 3.0 and pitch clamp -0.5..0.2 in third person; first person eye is 1.15 m above the seat. Beds use the same pose with the seat 0.1 m lower. Emits `sfx:sit` and `sfx:stand`.
- Tests: switch toggles the group and the prompt text flips; seat use sequence with fake time reaches `seated`; movement key stands up; blocked stand point tries alternatives and finally refuses; using another seat while seated is ignored; `dispose` unregisters.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/switch.test.js tests/unit/interaction/sit.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/interaction/lightSwitch.js src/systems/interaction/sit.js`

### Step 2: Elevator

Deliver:
- `tests/unit/interaction/elevator.test.js` first. `src/systems/interaction/elevator.js`: `createLift({ id, x, z, width = 2.0, depth = 2.0, floors: [y0, y1, ...], rot = 0, world, registry, events, group })` returns a `Lift` with `call(floorIndex)`, `update(dtMs, playerPos)`, `state` (`idle|doors-closing|moving|doors-opening|open`), `currentFloor`, `y`, `dispose()`.
- Behaviour: a cabin floor `lift:<id>:cabin` (`addFloor`, moved with `setFloorY`) and two door colliders per floor entrance that are enabled while the doors are not fully open; requests are queued (nearest in travel direction first, never reverse mid-trip); doors take 700 ms to open and close; the cabin moves at 1.6 m/s with a 0.4 s ease at each end; while `moving` and the player stands inside the cabin rectangle their `y` is set to the cabin floor `y` each frame (nobody is left behind or dropped); doors do not close while the player stands in the doorway; interactables: one "call lift" button per floor outside (prompt "call lift") and one button per floor inside the cabin (prompt "go to floor N"); emits `sfx:lift-ding` on arrival and `sfx:lift-move`.
- Tests with fake time: queue ordering, a call from the floor you are on just opens the doors, player carried to the target y within 0.05 m, door colliders toggle, the player in the doorway keeps the doors open, disposal removes everything, two calls while moving are both served.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/elevator.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/interaction/elevator.js`

### Step 3: Extend the interactions fixture: lamp, seats, bed, stairs and a three-level lift

Deliver:
- In `src/dev/fixtures/interactions.js` (extend by adding builder functions, do not rewrite): a lamp group `fixture-lamp` with a light and a wall switch next to the room door; a chair, a sofa and a bed inside the room (use plain box meshes now; the prop catalog arrives in plan 019); a two-flight staircase on the east side of the fixture floor going up to a platform at y = 3.4 (stairs via `addStair`, rails and walls as boxes); a three-level lift shaft (floors y = 0, 3.4, 6.8) with the lift and its call buttons.
- Hook additions: `playerState()` gains `sitting` and `seatId`; `liftState(id)` returns `{ state, currentFloor, y }`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/interactions.js "createLift"`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/interactions.js "createSeat"`
- `npm run lint`

### Step 4: Playwright: switch, sit, stairs and the lift

Deliver:
- `tests/e2e/interactions-extras.spec.js` on `?fixture=interactions&time=0.5`: press `e` at the wall switch and `listLights()` shows the `fixture-lamp` group on, again and off; `e` at the chair makes `playerState().sitting` true and `playerAnim()` `sit`; pressing `w` stands up (`sitting` false); sit on the bed then press `v`: first person works and the camera is lower than when standing; walk up the stairs by holding `w` from the bottom (teleport to the bottom facing up): `playerState().y` reaches 3.3 or more within 8 s of walking; ride the lift: call it at floor 0, step in, press the floor-2 button, `playerState().y` is within 0.1 m of 6.8 after at most 12 s and the lift state is `open`; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/interactions-extras.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/interaction/switch.test.js tests/unit/interaction/sit.test.js tests/unit/interaction/elevator.test.js`
- `npx playwright test tests/e2e/interactions-extras.spec.js`
- `npx playwright test tests/e2e/doors.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
