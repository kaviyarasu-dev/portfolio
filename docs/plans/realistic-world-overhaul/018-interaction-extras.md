# Plan 018: Light switches, sitting, the elevator and stairs in the interactions fixture

Epic E2. Estimated turns: 60.

## Goal

The remaining reusable interactions: light switches (toggle a light group), sitting on chairs, sofas and beds (avatar sit clip, camera adjusts, stand up on movement) and an elevator with doors and a moving floor that carries the player. Stairs are collision stairs (plan 016) and are built here into the fixture so the Playwright tests prove them. Each system is a headless state machine with Vitest tests plus a fixture-based Playwright test.

Wiring this plan owns (put it in `docs/world-conventions.md` under "Interaction"): `game.sit` is the single `SitController` (`new SitController({ game, events, registry: game.interaction, world: game.collision, avatar: { play, clear } })`, created in `src/main.js` right after `game.interaction`); `game.lifts` is an array of `Lift` objects that `gameloop.js` updates; a dev fixture `build(ctx)` may return `update?: (dtMs, playerPos) => void` besides `root`, `spawn` and `ready` (this plan wires it: `main.js` stores it as `game.fixtureUpdate`, the loop calls it every frame; plan 012 documented only the first three fields). Events are the module functions of `src/systems/events.js` (plan 017); headless modules report to the player by emitting `toast` `{ text }`; texts are upper case like v1.

Conventions (ARCHITECTURE.md 10.8): object rotation `rot` and seat `yaw` are Three.js `rotation.y`: front = `(sin r, cos r)`, local +x = `(cos r, -sin r)`; compass N = -z, S = +z, E = +x, W = -x. Camera yaw 0 looks toward -z, look direction `(-sin yaw, -cos yaw)`. A seated player faces the seat front, so the camera yaw while seated is `seat.yaw + PI`.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 10.5, 10.8, requirement R5, decision D19)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/interaction/registry.js
- src/systems/interaction/doors.js
- src/systems/events.js
- src/systems/lights/lightManager.js
- src/entity/player.js
- src/engine/camera.js
- src/systems/controller.js
- src/systems/interaction.js
- src/systems/gameloop.js
- src/main.js
- src/state.js
- src/dev/fixtures/interactions.js
- src/systems/collision/world.js
- src/dev/worldHook.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Light switch and the sit system

Deliver:
- `tests/unit/interaction/switch.test.js` and `tests/unit/interaction/sit.test.js` first.
- `src/systems/interaction/lightSwitch.js`: `createLightSwitch({ id, group, x, y, z, radius = 1.2, registry, lightManager, events })` registers a `switch` interactable (prompt function: "turn lights off" when `lightManager.isGroupOn(group)` else "turn lights on"); `onUse` calls `lightManager.toggleGroup(group)` and emits `sfx:switch` `{ id }`; returns `{ dispose() }` (unregisters).
- `src/systems/interaction/sit.js` exports `createSeat` and `SitController`. `createSeat({ id, kind, x, y, z, yaw, standOffset = 0.7, registry, world, controller })`: `kind` is `chair`, `sofa` or `bed`; `y` is the seat SURFACE height (cushion or mattress top); it registers a `sit` interactable at (x, y, z) (prompt "sit", "lie down" for beds) whose `onUse` calls `controller.sitAt(seat)`; returns `{ id, dispose() }`. `SitController` constructor `{ game, events, registry, world, avatar, keys = game.keys }` (`avatar` is `{ play(name), clear() }`; `sit.js` never imports `src/entity/player.js` so it stays headless, `main.js` passes `{ play: playAvatarAnim, clear: clearAvatarAnim }` from plan 008; tests pass fakes); it only touches `game.player` (`position`, `facing`, `targetFacing`, `sitting`, `seatId`) and `game.camRig`, never the DOM. States: `standing`, `moving`, `seated`, `standing-up`; `state`, `seat` readable.
- Behaviour. `sitAt(seat)` is ignored unless `state` is `standing`. Sit: state `moving` for 300 ms (linear lerp of the player x, z and y to the seat, of `facing` and `targetFacing` to `seat.yaw` and of `camRig.yaw` to `seat.yaw + PI`, shortest way round); the target player y is `seat.y` for chairs and sofas and `seat.y - 0.1` for beds; `player.sitting = true` and `player.seatId = id` from the start of `moving` until standing is complete; `avatar.play("sit")` at the start; emits `sfx:sit` `{ id }`; then `seated`. The camera while sitting is set through rig overrides that `camera.js` reads (added in step 3), all null when standing: `distanceOverride` 3.0, `pitchMinOverride` -0.5, `pitchMaxOverride` 0.2 (pitch is clamped into that range immediately), `pivotHeightOverride` 1.0 (third person pivot = player y + 1.0 instead of 1.55) and `eyeHeightOverride` 1.15 (first person eye = player y + 1.15, so 1.15 m above the seat surface). `update(dtMs)` advances the timers and, while `seated`, stands the player up when any of `w a s d arrowup arrowdown arrowleft arrowright` is down in `keys` (Shift is not a movement key); `handleAction()` is called by the `E` handler BEFORE the registry and returns true whenever `state` is not `standing` (consuming the press: `seated` -> stand up, other states ignore it), so using another seat while seated is impossible.
- Standing up: candidate stand points are `seat + standOffset * dir` for `dir` in this order: front `(sin yaw, cos yaw)`, left `(cos yaw, -sin yaw)`, right `(-cos yaw, sin yaw)`, back `(-sin yaw, -cos yaw)`; the point is accepted when `world.blockedAt(px, pz, standY, 0.35, 1.7)` is false where `standY = world.groundHeight(px, pz, seat.y, 0.45).y`. When none is free: stay `seated`, emit `toast` `{ text: "NO ROOM TO STAND" }` once and ignore movement keys for 1000 ms (no toast spam). When one is found: state `standing-up` for 300 ms (lerp x, z, y to the point), emits `sfx:stand` `{ id }`, `avatar.clear()` (back to idle), then `standing`, `sitting` false, `seatId` null and all rig overrides back to null. Sits and stands are dispose-safe: `dispose()` of a seat unregisters its interactable and, if it is the current seat, stands the player at the front point without checks.
- Tests (fake time and fake avatar): switch toggles the group and the prompt text flips, emits `sfx:switch`, dispose unregisters; seat use sequence reaches `moving` then `seated` after 300 ms with position within 0.001 of the seat (bed y is seat y minus 0.1) and `sitting` true, `seatId` set, overrides set, `sfx:sit` emitted, `avatar.play` called with `sit`; camera yaw ends at `seat.yaw + PI` (also from a start yaw near -PI: shortest way); a movement key stands up (and a Shift-only press does not); `handleAction` returns true while seated and stands up, returns false when standing; blocked front point tries left, right, back (check the chosen point for each blocked case with real `CollisionWorld` boxes); all four blocked: stays seated, one toast, keys ignored for 1000 ms; using another seat while seated is ignored; standing-up ends with overrides null, `avatar.clear` called, `sfx:stand` emitted; `dispose` unregisters.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/switch.test.js tests/unit/interaction/sit.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/interaction/lightSwitch.js src/systems/interaction/sit.js`
- `node "{{runner}}/assert.mjs" has src/systems/interaction/sit.js "class SitController"`

### Step 2: Elevator

Deliver:
- `tests/unit/interaction/elevator.test.js` first. `src/systems/interaction/elevator.js`: `createLift({ id, x, z, rot = 0, floors, width = 2.0, depth = 2.0, world, registry, events, list })` returns a `Lift`. `floors` is an ascending array of floor surface heights `[y0, y1, ...]` (at least 2, at least 1.0 m apart, else throws); a floor is ALWAYS addressed by its 0-based index in that array (the prompt shows the index plus one). `(x, z)` is the cabin centre, the cabin interior is `width` (local x) by `depth` (local z); the entrance faces local +z (front at `rot` 0 faces +z, so a lift with `rot` 0 is entered from the south); local axes follow the object rotation convention. `list` (optional array, callers pass `game.lifts`): the lift pushes itself and `dispose()` removes it.
- Parts it builds (`lift.root`, a `THREE.Group` made of plain box meshes, headless safe; the shaft walls with their openings are NOT built here: plan 021 `buildLifts` and the fixture build them): the cabin group `lift.cabin` (floor panel, back and side panels 0.05 thick, a ceiling at 2.3 m, a handrail, three button plates), moved to `lift.y` every update, and per floor i two door panels (each `width / 2` wide, 2.2 m high, at the entrance plane) that slide apart with the door progress. Colliders, ids prefixed `lift:<id>:` and removed on dispose: the cabin floor `lift:<id>:cabin` (`addFloor`, rectangle centred on (x, z), rotated by `rot`, moved with `setFloorY`); static shaft boxes 0.1 m thick on the back and both sides outside the cabin rectangle from `y0` to `y_top + 2.4` (`lift:<id>:wall:back|left|right`); the front plane is closed over the whole travel height: per floor i a door box `[y_i, y_i + 2.2]` (`lift:<id>:door:<i>`, enabled except while that floor doors are more than half open) and between floors static wall boxes `[y_i + 2.2, y_(i+1)]` (`lift:<id>:fwall:<i>`) plus one above the top floor (`[y_top + 2.2, y_top + 3.0]`).
- Interactables (kind `elevator`, registered through `registry`, removed on dispose). Outside call button per floor i: id `<liftId>-call-<i>`, prompt "call lift", position local (width / 2 + 0.6, floor y + 1.1, depth / 2 + 0.1) (0.6 m to the right of the entrance as seen by someone facing the lift), radius 1.4. Cabin buttons per floor i: id `<liftId>-btn-<i>`, prompt function "go to floor <i + 1>", on the cabin back wall at local x = `(i - (n - 1) / 2) * 0.5`, local z = `-depth / 2 + 0.05`, y = `lift.y + 1.1`, radius 1.2; a button is nearest only for a player standing in front of it, so choosing a floor means walking to its button. The cabin button y follows the cabin: every update calls `registry.move(id, { x, y, z })` (added to the registry by plan 017) so the 1.6 m vertical filter keeps working while the lift moves.
- Behaviour. `state` is `idle` (parked, doors closed), `doors-opening`, `open`, `doors-closing`, `moving`; `currentFloor` (becomes the arrival floor when `doors-opening` starts), `y`, `targetFloor`, `doorProgress` (0..1). Door panels take 700 ms (smoothstep) to open or close; once fully open the lift holds 3000 ms and then closes; the hold is extended (timer reset) while the player is in the doorway region (local z from `depth / 2 - 0.5` to `depth / 2 + 0.9`, local |x| < `width / 2`, vertical difference under 1.6 m), and a call for the floor you are on while the doors are closing reverses them to opening. `request(floorIndex)` (used by every button; `call(floorIndex)` is an alias): on the current floor with state `idle` it opens the doors, with `open` it just resets the hold; otherwise it adds the floor: while `idle` or `open` or `doors-closing` the lift starts the trip (first closing the doors) toward the nearest requested floor; while `moving` a floor that lies ahead in the travel direction is inserted in the `queue` (sorted by distance) and served as a stop on the way, any other floor goes to `pending` and is served after the queue is empty (nearest first); duplicates are ignored; the lift never reverses mid-trip. Travel: speed 1.6 m/s with the speed eased by smoothstep over 0.4 s at both ends of every leg (leg time = length / 1.6 + 0.4 s), the cabin stops exactly on the floor height; every stop opens the doors, holds, closes, and continues. Events: `sfx:lift-move` `{ id }` when a leg starts, `sfx:lift-ding` `{ id }` on arrival at a stop.
- `update(dtMs, playerPos)` (`playerPos` is the live `game.player.position`, mutated): advances everything; while the state is `moving` and the player stands inside the cabin rectangle (inset 0.05 m) with `abs(player.y - lift.y) < 0.6`, it sets `playerPos.y = lift.y` each update (the player is carried, nobody is left behind or dropped; outside travel the controller regrounding on the cabin floor does the same). `toData()` returns `{ id, state, currentFloor, targetFloor, y, doorProgress }`.
- Tests with fake time and a real `CollisionWorld`, `InteractionRegistry` and an event recorder: a lift with floors `[0, 3.4, 6.8]`: colliders list (`world.list("lift:<id>:")`) has cabin floor, 3 walls, 3 door boxes, 3 floor walls plus the top one; the front plane blocks a circle walking in at floor 0 while parked closed and lets it in after the doors have been opening for 700 ms; a request for floor 2 closes doors, travels (cabin y monotonic, speed never above 1.6 * 1.01, first 0.4 s slower than cruise) and ends with `y` exactly 6.8 and `currentFloor` 2; the player standing inside is carried (y within 0.05 of the cabin at every sampled step, final 6.8); a player standing outside the rectangle is not changed; request from the floor you are on only opens the doors; queue ordering (floors 1 and 2 requested while moving up from 0 are both served, floor 1 first, with a stop at 1); a request behind the travel direction goes to `pending` and is served after; the player in the doorway keeps the doors open (still `open` after 10 s, closes within 800 ms after leaving); a call while `doors-closing` on the same floor reopens; door collider toggling at the half-open point; cabin button y follows the cabin (`registry.list()`); prompts ("call lift", "go to floor 3"); ids exactly as specified; `sfx:lift-move` once per leg and `sfx:lift-ding` once per stop; `dispose` removes every collider (`list` is empty), every interactable and the list entry; `floors` of 1 entry or 0.5 m apart throw.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/elevator.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/interaction/elevator.js`
- `node "{{runner}}/assert.mjs" has src/systems/interaction/elevator.js "registry[.]move[(]"`

### Step 3: Wiring: game.sit, game.lifts, controller, camera, E precedence, hook

Deliver:
- `src/state.js`: add `sit: null`, `lifts: []`, `fixtureUpdate: null`, and `player.sitting = false`, `player.seatId = null`, and the camera rig overrides `camRig.distanceOverride`, `pitchMinOverride`, `pitchMaxOverride`, `pivotHeightOverride`, `eyeHeightOverride` (all `null`). `src/main.js` (controls step, after `game.interaction` exists): `game.sit = new SitController({ game, events, registry: game.interaction, world: game.collision, avatar: { play: playAvatarAnim, clear: clearAvatarAnim } })` (events = the module namespace); when a fixture is active store `built.update` as `game.fixtureUpdate`.
- `src/systems/gameloop.js` per frame, in this order before `updateController`: `game.sit.update(dt)`; `for (const l of game.lifts) l.update(dt, game.player.position)`; `if (game.fixtureUpdate) game.fixtureUpdate(dt, game.player.position)`. `src/systems/controller.js`: when `game.player.sitting` is true it returns right after setting the speed to 0 and `moving` false (no `moveCircle`, no regrounding, the position belongs to `SitController`). `src/systems/interaction.js` `tryAction()`: first `if (game.sit && game.sit.handleAction()) return;`, then the registry (plan 017), then v1.
- `src/engine/camera.js`: the effective distance is `rig.distanceOverride ?? rig.distance`; `applyLookInput` clamps pitch to `rig.pitchMinOverride ?? CameraRig.pitchMin` and `rig.pitchMaxOverride ?? CameraRig.pitchMax` (the first person limits of plan 016 are used when no override is set); the third person pivot height is `rig.pivotHeightOverride ?? CAMERA_HEIGHT`; the first person eye height is `rig.eyeHeightOverride ?? PLAYER_EYE_HEIGHT`. Nothing else changes.
- Hook (`src/dev/worldHook.js`, extend only): `playerState()` gains `sitting` and `seatId`; `liftState(id)` returns `game.lifts.find(l => l.id === id).toData()` or null. Document the wiring contract of the goal (and `registry.move`) in `docs/world-conventions.md`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/systems/gameloop.js "game[.]sit[.]update"`
- `node "{{runner}}/assert.mjs" has src/systems/gameloop.js "fixtureUpdate"`
- `node "{{runner}}/assert.mjs" has src/systems/interaction.js "handleAction[(]"`
- `node "{{runner}}/assert.mjs" has src/engine/camera.js "distanceOverride"`
- `node "{{runner}}/assert.mjs" has src/main.js "new SitController[(]"`
- `node "{{runner}}/assert.mjs" has src/systems/controller.js "sitting"`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/camera-mode.spec.js`
- `npm run lint`

### Step 4: Extend the interactions fixture: lamp, seats, bed, stairs and a three-level lift

Deliver:
- In `src/dev/fixtures/interactions.js` extend by adding part functions and appending them to the exported `parts` array (plan 017 layout: room interior x -6..6, z -5..5, door in the north wall at x 0, desk at z 4.4). Every collider id is prefixed `fixture:`. Plain box meshes only (the prop catalog arrives in plan 019). Parts: (a) lamp: `game.lightManager.registerLight({ id: "fixture-lamp-1", x: -3, y: 2.7, z: 0, color: "#ffd9a0", intensity: 18, distance: 10, group: "fixture-lamp", room: "fixture" })` (no `auto`, so the group starts off) plus a wall switch `createLightSwitch({ id: "switch-lamp", group: "fixture-lamp", x: 0.85, y: 1.2, z: -4.8 })` on the inner face of the north wall, 0.3 m beside the doorway edge (x 0.55); (b) seats, each a plain mesh plus a solid box collider and a `createSeat` with `controller: game.sit`: chair `chair-1` (kind chair, x -4, y 0.45, z -2, yaw PI/2 so it faces east), sofa `sofa-1` (kind sofa, 1.8 m wide, x -3.5, y 0.45, z 3.6, yaw PI, faces north), bed `bed-1` (kind bed, 1.0 by 2.0 m, centre x 4.2, z -1.5, mattress top 0.5, seat at x 4.2, y 0.5, z -1.0, yaw 0); (c) stairs east of the room: one straight flight of 12 steps (visual step boxes 0.2833 m rise and 0.5 m run) with `addStair({ id: "fixture:stair", x0: 9.3, x1: 10.7, z0: -3.0, z1: 3.0, dir: Math.PI, yLow: 0, yHigh: 3.4 })` (rise 3.4 over run 6.0, width 1.4, climbs toward -z, bottom end at z = 3), a platform `addFloor({ x0: 8.5, x1: 11.5, z0: -9, z1: -3, y: 3.4 })`, side barrier boxes (yMin 0, yMax 4.6) along both sides of the flight at x 9.25 and 10.75 from z -3 to 3 and platform edge barrier boxes (yMin 3.4, yMax 4.4) on the three open edges; (d) a three-level lift at (x -12, z 0), `rot` 0 (entered from the south), `floors: [0, 3.4, 6.8]`, `list: game.lifts`, shaft walls as visual boxes with an opening on the south side, and for levels 1 and 2 a landing floor `addFloor` (x -15..-9, z 1..5, y 3.4 and 6.8) with 1.0 m edge barriers on its west, east and south edges.
- Hook: nothing new (the earlier step added `liftState` and `playerState().sitting`). The fixture builder returns `update` that runs the `f.updaters` functions (empty for now; plan 021 uses it).
- `tests/unit/dev/interactionsFixture.test.js` (headless: build `new CollisionWorld()`, an `InteractionRegistry`, a `LightManager`, a `SitController` with a fake avatar into a fake `game` object, call the fixture `build` from `getFixture("interactions")` with `scene: new THREE.Scene()`): the registry list contains exactly these ids among others: `desk-intro`, `door:fixture-north`, `door:fixture-east`, `switch-lamp`, `chair-1`, `sofa-1`, `bed-1`, `lift-call-0`, `lift-call-1`, `lift-call-2`, `lift-btn-0`, `lift-btn-1`, `lift-btn-2`; the light manager has the group `fixture-lamp` off; `game.lifts` has one lift and `game.doors` two doors; `world.list("fixture:")` is not empty and the world has at least one stair and 4 floors (cabin, platform, two landings); every `fixture:` collider id and registry id is unique (no throw). This is the check that the fixture really builds; the browser behaviour is checked in the next step.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/dev/interactionsFixture.test.js`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/interactions.js "createLift[(]"`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/interactions.js "createSeat[(]"`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/interactions.js "createLightSwitch[(]"`

### Step 5: Playwright: switch, sit, stairs and the lift

Deliver:
- `tests/e2e/interactions-extras.spec.js`, every URL `/?fixture=interactions&time=0.5&freeze=1`, every wait `expect.poll(..., { timeout: 20000 })` (game time can run slower than wall time on software WebGL), keys held with `page.keyboard.down` and released afterwards, a zero-console-errors check at the end of each test. Test 1 switch: teleport to (0.85, 0, -4.0, yaw 0), `useNearest()` is true and the `fixture-lamp` entries of `listLights()` are `on`; again and they are off. Test 2 chair: teleport to (-3.3, 0, -2, yaw PI/2) (the camera snaps on teleport), read the standing third-person `cameraState().y`, press `e`: poll `playerState().sitting` true, `seatId` `chair-1`, `playerAnim()` `sit`; `cameraState().y` is lower than the standing value; press `w` (hold): poll `sitting` false, release, poll `playerAnim()` back to `idle`. Test 3 sofa: teleport to (-3.5, 0, 2.6, yaw 0), `e`: `seatId` `sofa-1`; press `e` again: stands up. Test 4 bed: teleport to (4.2, 0, 0, yaw 0), `e`: `seatId` `bed-1`, `playerState().y` is 0.4 (within 0.02); press `v`: `cameraMode()` is `first` and `cameraState().y` is within 0.05 of 0.4 + 1.15 and lower than 1.62; press `v` again, then `d` stands up. Test 5 stairs: teleport to (10, 0, 4.5, yaw 0) (bottom of the flight, looking up it) and hold `w`: `playerState().y` reaches 3.3 or more and z is below -3 (on the platform). Test 6 lift: teleport to (-10.4, 0, 2.2, yaw 0), `useNearest()` (the call button `lift-call-0`): poll `liftState("lift").state` `open` (the lift is already at floor 0, so this only opens the doors); teleport to (-11.5, 0, -0.4, yaw 0) (inside the cabin in front of button 2) and `useNearest()`; then sample `playerState().y` with `expect.poll` every 300 ms into an array until `liftState("lift").state` is `open` and `currentFloor` is 2: the final y is within 0.1 of 6.8, the samples never decrease and at least three samples lie between 0.5 and 6.3 (a ride, not a teleport), and the whole ride takes at most 25 s of wall time from the button press.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/interactions-extras.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/interaction/switch.test.js tests/unit/interaction/sit.test.js tests/unit/interaction/elevator.test.js tests/unit/dev/interactionsFixture.test.js`
- `npx playwright test tests/e2e/interactions-extras.spec.js`
- `npx playwright test tests/e2e/doors.spec.js`
- `npx playwright test tests/e2e/camera-mode.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
