# Plan 016: Wall, floor and stair collision, camera collision and the first-person toggle

Epic E2. Estimated turns: 60.

## Goal

Replace the v1 circle list with a real collision world: oriented wall boxes (with enable/disable for doors), walkable floors, stairs and ramps, island bounds and substepped movement so nothing tunnels. Add a camera solver that keeps the third-person camera out of walls, and the `V` first-person toggle. Everything in `src/systems/collision/` is pure, headless and unit tested; the v1 buildings keep working through an adapter (`addCollider` becomes a thin wrapper, `game.colliders` disappears).

Behaviour changes this plan makes on purpose (write them into the Collision section of `docs/world-conventions.md`): the player circle radius goes from 0.45 to 0.35 (ARCHITECTURE.md 10.4); the island clamp goes from the v1 radius 168 to `WORLD_RADIUS - 0.35`; the third-person camera pivot drops from 2.35 m to 1.55 m above the feet and the shoulder offset from 0.55 to 0.35 m; the camera can now be pushed in by walls.

Conventions used by every step (ARCHITECTURE.md 10.8): yaw 0 looks toward -z, the look direction is `(-sin yaw, -cos yaw)`, a positive yaw turns left; the camera sits behind the pivot at `pivot + d * (sin yaw * cos pitch, -sin pitch, cos yaw * cos pitch)`; pitch below 0 looks down; object rotation `rot` and stair `dir` are Three.js `rotation.y` (rotation 0 faces +z, a stair with `dir` 0 climbs toward +z, `dir` PI climbs toward -z (north), the climb vector is `(sin dir, cos dir)`). A box with `rot` is rotated about its own centre.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 10.4, 10.5, 10.8 and requirement R5, assumption A10)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/collision.js
- src/systems/controller.js
- src/engine/camera.js
- src/engine/scene.js
- src/systems/input.js
- src/state.js
- src/world/terrain.js
- src/config.js
- src/main.js
- src/dev/worldHook.js
- src/dev/fixtures/index.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Geometry helpers and the walls part of CollisionWorld

Deliver:
- `tests/unit/collision/geometry.test.js` first. `src/systems/collision/geometry.js` (pure math, no Three.js): oriented box `{ cx, cz, hx, hz, rot, yMin, yMax }`; `circleVsBox(x, z, r, box)` returns `{ nx, nz, depth }` (unit push-out normal and penetration depth) or null, correct for rotated boxes, at edges and at corners; `segmentVsBox(ax, az, bx, bz, box)` returns the entry fraction t in 0..1 or null (a segment that starts inside returns 0); `pointInBox(x, z, box)`.
- `src/config.js`: add (only when missing) `PLAYER_RADIUS = 0.35`, `PLAYER_HEIGHT = 1.7`, `PLAYER_EYE_HEIGHT = 1.62`, `PLAYER_STEP_UP = 0.45`; the collision module never imports config.js (it takes values as arguments) so it stays pure.
- `tests/unit/collision/world.test.js` part 1, then `src/systems/collision/world.js` with `class CollisionWorld`. Ids share ONE namespace across boxes, circles, floors and stairs; adding an id that exists throws `Error("collision id exists: <id>")`. API: `addBox({ id, cx, cz, hx, hz, rot = 0, yMin, yMax, enabled = true, tag })`, `addCircle({ id, x, z, r, yMin = -Infinity, yMax = Infinity, enabled = true })` (a circle is a ground-anchored column by default: v1 trees, rocks and buildings must block on hills too; explicit `yMin`/`yMax` follow the box rule below), `setEnabled(id, bool)`, `remove(id)`, `removeByPrefix(prefix)` (returns how many were removed), `has(id)`, `list(prefix?)` (returns the ids of ALL colliders, boxes, circles, floors and stairs, sorted alphabetically, optionally only those that start with `prefix`; plan 021 relies on it), `setBounds(radius)` (island edge: the circle centre is kept within `radius - r`), `setTerrainHeight(fn)` (default `() => 0`), `queryStats()` (returns `{ cellsVisited, shapesTested }` accumulated since `resetStats()`; used by the broadphase test). Boxes and circles live in a uniform grid broadphase (cell 8 m, each shape registered in every cell it touches); `moveCircle`, `blockedAt`, `raycast2D` and `groundHeight` only look at the cells their query touches, so thousands of tree and prop colliders stay cheap.
- The blocking rule (one rule for everything, used by `moveCircle`, `blockedAt` and the camera solver): a box or circle with an enabled flag blocks a circle standing at height `y` with body height `height` and step-up `stepUp` when `shape.yMax > y + stepUp && shape.yMin < y + height` and the footprints overlap.
- `moveCircle(pos, delta, radius, { stepUp = 0.45, height = 1.7 } = {})` where `pos = { x, y, z }` and `delta = { dx, dz }`: split the move into sub-steps no longer than `radius * 0.5` (0.175 m for the player); each sub-step moves the circle, then resolves overlaps with blocking shapes with up to 3 iterations (push out along the normal, which makes it slide; handles inside corners); then the island bound pushes the centre back inside. Returns `{ x, y, z, blocked, hitId }` where `blocked` is true when any sub-step was pushed and `hitId` is the id of the FIRST shape that pushed (null when none). A zero delta is allowed and just re-grounds `y` (the controller calls it every frame while standing so a rising lift carries the player). Until step 2 `y` comes from `terrainHeight`; floors and stairs arrive in step 2.
- Tests: straight wall stops the circle and leaves it not overlapping; sliding along a wall keeps the parallel component; a 1.2 m gap between two boxes lets radius 0.35 through and a 0.6 m gap does not; a disabled box (door open) lets it through, enabling it blocks again; a 6 m move in one call cannot tunnel through a 0.2 m wall; a 45 degree rotated wall; an inside corner (two walls, a diagonal push does not escape); the island bound holds for a 500 m walk outward (final radius <= `radius - r`); a box whose `yMax` is below `y + stepUp` does not block (a 0.3 m kerb); a box with `yMin` above `y + height` does not block (a lintel); circles default to a ground-anchored column; duplicate id throws; `list()` returns every id sorted and `list("a:")` only the matching ones; `removeByPrefix` returns the count and `list` shrinks accordingly; `hitId` is the first shape hit; a zero delta returns the same x and z.
- Broadphase test (deterministic, not a timer): with 6000 circles and 800 boxes spread over a 600 m square (seeded rng), call `resetStats()` then one `moveCircle` of 5 m; assert `queryStats().cellsVisited <= 4 * 29` (at most 4 cells per sub-step, 29 sub-steps) and `shapesTested < 400` (a naive loop would test 6800 per sub-step). Also assert that on a 200-move random walk the result equals a brute-force reference that tests every shape (same final x and z within 1e-6) so the grid never loses a shape that spans cells.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/geometry.test.js tests/unit/collision/world.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/collision/geometry.js src/systems/collision/world.js`
- `node "{{runner}}/assert.mjs" has src/systems/collision/world.js "list[(]prefix"`

### Step 2: Floors, stairs, ground height and ray queries

Deliver:
- `tests/unit/collision/floors.test.js` first. Add to `CollisionWorld`: `addFloor({ id, x0, z0, x1, z1, y, rot = 0, enabled = true })` (a walkable rectangle at height `y`; `x0 < x1`, `z0 < z1` describe it before rotation, `rot` rotates it about its own centre), `addStair({ id, x0, z0, x1, z1, rot = 0, dir, yLow, yHigh, enabled = true })` (same rectangle rules; `dir` is the WORLD climb direction in the object-rotation convention, the climb vector is `(sin dir, cos dir)`; the ramp height at a point is `yLow + t * (yHigh - yLow)` with `t = clamp(dot(p - centre, climb) / L + 0.5, 0, 1)` where `L` is the extent of the rectangle along the climb vector (for a rectangle aligned with `dir` that is its length)), `setFloorY(id, y)` (moving platforms such as a lift cabin; works for floors only), `groundHeight(x, z, yRef, stepUp = 0.45)` returns `{ y, kind: terrain|floor|stair, id }` choosing the highest enabled walkable surface (terrain included, `id` null for terrain) that is not above `yRef + stepUp`; on an exact tie (within 1e-6) a stair beats a floor and a floor beats the terrain; `blockedAt(x, z, y, r, height = 1.7, stepUp = 0.45)` (true when a circle there would be pushed by an enabled box or circle under the blocking rule above; the camera solver calls it with `y` = camera y, `height` 0.3 and `stepUp` 0), `raycast2D(ax, az, bx, bz, y0, y1)` returning `{ t, id }` for the first enabled box or circle whose y range overlaps `[y0, y1]` (null when none).
- `moveCircle` now sets `y` from `groundHeight(x, z, currentY, stepUp)` after each sub-step. A surface more than `stepUp` above the current `y` acts as a wall for that sub-step (the move is undone along the offending axis, so you cannot climb a 1 m ledge); a surface lower than `y` lets the player drop to it at once (no gravity, as in v1 where the player is glued to the ground). The returned `hitId` is the floor or stair id when a too-high edge stopped the move.
- Tests: walking up a stair (rise 3.4 m over a 6.8 m run, `dir` PI so it climbs toward -z) in 0.1 m deltas reaches the top within 0.05 m of 3.4 and `y` never jumps by more than 0.1 per call; a rotated stair (`rot` 0.6, `dir` 0.6) works the same; the top floor lets you walk on; a 1.0 m high floor edge blocks from below but a 0.4 m one is stepped onto; a two-storey building: at `y` 3.6 the ground-floor walls (yMax 3.4) do not block while first-floor walls (yMin 3.4, yMax 6.8) do; walking off the edge of a floor drops to the terrain; stair beats terrain on a tie; `setFloorY` moves the ground under a standing player (zero-delta `moveCircle` returns the new `y`); disabling a floor removes it from `groundHeight`; `raycast2D` hits the nearest box and ignores disabled boxes and boxes whose y range is outside; `blockedAt` agrees with `moveCircle` (for 200 random positions, `blockedAt` is true exactly when a zero-delta `moveCircle` would be pushed); `list()` includes floor and stair ids.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/floors.test.js tests/unit/collision/world.test.js`
- `node "{{runner}}/assert.mjs" has src/systems/collision/world.js "groundHeight[(]"`

### Step 3: Camera solver

Deliver:
- `tests/unit/collision/cameraSolver.test.js` first. `src/systems/collision/cameraSolver.js` exports `solveCamera({ target: { x, y, z }, yaw, pitch, distance, shoulder = 0, minDistance = 0.4, radius = 0.25 }, world, { terrainHeight = () => 0, minAboveGround = 0.3, step = 0.1 } = {})` returning `{ position: { x, y, z }, distance, blocked }`. `target` is the pivot WITHOUT the shoulder offset. The shoulder shifts the pivot sideways exactly as v1 does: `(shoulder * cos yaw, 0, -shoulder * sin yaw)`; if the shifted pivot is itself blocked, try 0.75, 0.5, 0.25 and 0 times the shoulder and take the first free one. The wanted position is `pivot + distance * (sin yaw * cos pitch, -sin pitch, cos yaw * cos pitch)`. Walk from the pivot toward it in steps of `step` (0.1 m); the camera stops at the last distance where `world.blockedAt(x, z, y, radius, 0.3, 0)` is false and never gets closer than `minDistance`; `blocked` is true when the resulting distance is less than `distance - 0.05`. The final y is raised to `terrainHeight(x, z) + minAboveGround` when lower.
- Tests: free space returns the full distance and `blocked` false; a wall 2 m behind returns about 2 minus the radius (within `step`); a camera inside a closed 3 m room with the wall 0.2 m behind returns `minDistance`; shoulder offset applies when free and shrinks when a wall is next to the pivot; a camera over a hill (`terrainHeight` returning 4) is lifted to 4.3; yaw rotates the result correctly (yaw 0 puts the camera on the +z side of the target, yaw PI/2 on the +x side); pitch below 0 puts the camera above the pivot; a wall whose yMax is below the camera y minus 0.15 does not block (low wall).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/cameraSolver.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/collision/cameraSolver.js`

### Step 4: Wiring: the world object, the legacy adapter, the controller and spawn safety

Deliver:
- `tests/unit/collision/legacy.test.js` first (headless: it sets `game.collision = new CollisionWorld()` itself; `src/state.js` has no DOM access at import). `src/systems/collision/legacy.js` exports `installLegacyColliders(world, list)` where `list` is an array of v1 style entries `{ x, z, r }`; it adds one circle per entry with ids `legacy:<n>` (n counts up from the number of `legacy:` ids already in the world, never reused while they exist) and returns the number added; and `clearLegacyColliders(world)` which is `world.removeByPrefix("legacy:")`. A function `findFreeSpot` lives on the world: `world.findFreeSpot(x, z, y, r, { maxRadius = 6, step = 0.5, height = 1.7 } = {})` returns `{ x, z }` (the input when it is not blocked, otherwise the first free point on rings of radius `step`, `2 step`, ... around it, sampled every `step` along each ring, nearest ring first) or null; test it (free spot unchanged, inside a 3 m circle moves out by at most 3.5 m, fully enclosed returns null).
- World object: create ONE `CollisionWorld` in `buildScene()` in `src/engine/scene.js` (main.js runs `buildScene` before terrain and before the landmark step, so it exists before the first `addCollider`) and store it as `game.collision`; call `world.setBounds(WORLD_RADIUS)` (from `src/config.js`; v1 value 180) and `world.setTerrainHeight(sampleTerrainHeight)` using the v1 function exported by `src/engine/camera.js`, which already returns 0 until `game.terrainMesh` exists, so it is lazy and needs no re-wiring. `src/state.js`: add `collision: null` and `camRig.mode: "third"`, and DELETE `colliders: []` (only `src/world/collision.js` read it).
- `src/world/collision.js` becomes the thin v1 wrapper (keep its file and export names that other files import): `addCollider(x, z, r)` calls `installLegacyColliders(game.collision, [{ x, z, r }])`; `clearColliders()` calls `clearLegacyColliders(game.collision)` (main.js already calls it before `placeBuildings()`); delete `resolveCollision` and `pointInsideCollider` (nothing else uses them; check with grep before deleting). So the 14 v1 buildings and rocks keep blocking through ids `legacy:<n>`.
- `src/systems/controller.js`: replace `resolveCollision` and the 168 clamp: movement goes through `game.collision.moveCircle(p.position, { dx, dz }, PLAYER_RADIUS)` with `dx = nx * speed * dtS`; the result sets `p.position.x`, `z` and `y`. While not moving it still calls `moveCircle` with a zero delta every frame so the player follows moving floors. Keep `p.position.y = Math.max(y, -0.5)` (the v1 water clamp; plan 033 replaces it with wading). Footstep surface still uses the terrain height `h`.
- Spawn safety (v1 has none): in `main.js`, right after `buildPlayer()` (the step labelled Summoning traveler), call `world.findFreeSpot(x, z, y, PLAYER_RADIUS)` for the spawn point and move the player there when the result differs (log `console.warn` with the distance moved); a null result keeps the spawn. `teleport()` in the hook never nudges (tests need exact spots).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/legacy.test.js tests/unit/collision/world.test.js tests/unit/collision/floors.test.js`
- `node "{{runner}}/assert.mjs" has src/systems/controller.js "moveCircle[(]"`
- `node "{{runner}}/assert.mjs" none src/state.js "colliders"`
- `node "{{runner}}/assert.mjs" none src/world/collision.js "game[.]colliders"`
- `node "{{runner}}/assert.mjs" has src/engine/scene.js "new CollisionWorld[(]"`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`

### Step 5: Camera modes, the collision fixture, the hook and Playwright

Deliver:
- `src/config.js`: change `CAMERA_HEIGHT` from 2.35 to 1.55 and `CAMERA_SHOULDER` from 0.55 to 0.35 (same names, new values). `src/engine/camera.js` `updateCamera`: in third person compute the pivot target `player.position + (0, CAMERA_HEIGHT, 0)` and call `solveCamera({ target, yaw, pitch, distance: rig.distance, shoulder: CAMERA_SHOULDER }, game.collision, { terrainHeight: sampleTerrainHeight })` instead of the old heuristic; the camera position still eases toward the solved position with `damp(..., 14, dtS)` and snaps (no easing) on the frame after a mode change, a teleport or a camera override ends; `lookAt` keeps the v1 target (pivot minus 0.25 m). The v1 zoom easing (`distance`, `targetDistance`) is unchanged.
- Modes: `game.camRig.mode` is `third` or `first`. `toggleCameraMode()` and `setCameraMode(m)` are exported from camera.js. `src/systems/input.js`: the `keydown` handler for key `v` ignores `e.repeat` and calls `Input.viewCallback` (same pattern as `Input.actionCallback`); `main.js` assigns `Input.viewCallback = toggleCameraMode` in the controls step. First person: camera position = player position + (0, `PLAYER_EYE_HEIGHT`, 0) exactly, rotation order `YXZ` with `rotation.y = yaw` and `rotation.x = pitch`, `CameraRig.pitchMin/pitchMax` widened to -1.35/+1.35 and the stored third-person limits (-0.85/0.45) restored when going back (pitch is re-clamped to them, yaw is kept); the switch is instant (no blend); `game.player.body.visible = false` in first person and true again in third. The camera override of plan 014 still wins over both modes.
- `src/dev/fixtures/collision.js` (register as `collision` and add the import to `src/dev/fixtures/index.js`): a flat 60 m square floor centred at the origin, spawn (0, 0, 0) yaw 0; a room with interior x -4..4, z -14..-6, walls 0.3 m thick centred on those edges, 3.0 m high (`addBox`, yMin 0, yMax 3.0), with a 1.2 m doorway centred at x = 0 in the south wall (z = -6; two boxes x -4.15..-0.6 and 0.6..4.15); a 1.0 m high ledge box at centre (11, 0), half sizes 1 by 3 (blocks walking east); a stair with `x0 -12.7, x1 -11.3, z0 -14.8, z1 -8.0, dir PI, yLow 0, yHigh 3.4` (climbs toward -z) plus a platform floor `x -14..-10, z -20.8..-14.8, y 3.4`; matching visual meshes with plain boxes (a sloped box for the stair). Prefix every collider id with `fixture:`.
- Hook (`src/dev/worldHook.js`, extend only): `cameraMode()`, `setCameraMode(m)`, `collisionStats()` returns `{ boxes, circles, floors, stairs }` (counted from the world), `playerState()` gains `bodyVisible`. Document the collision API (the class methods, the blocking rule, the id prefix `legacy:`, the yaw and rot conventions) in a "Collision" section of `docs/world-conventions.md`.
- `tests/e2e/camera-mode.spec.js` (URL `/?time=0.5&freeze=1`, wait for `__world.ready`): `cameraMode()` is `third`; press `v`, then poll until it is `first` and `cameraState()` is within 0.3 m of (player x, player y + 1.62, player z) and `playerState().bodyVisible` is false; press `v` again and poll for `third` and `bodyVisible` true; `collisionStats().circles` is at least 14 (the v1 buildings are still solid); zero console errors.
- `tests/e2e/collision.spec.js` (URL `/?fixture=collision&time=0.5&freeze=1`, every wait is `expect.poll(..., { timeout: 15000 })`, keys held with `page.keyboard.down` and released afterwards): (1) hold `w` from the spawn: the player passes the doorway and ends with z between -13.9 and -13.0 (stopped by the north wall); (2) teleport to (-2, 0, -3, yaw 0) and hold `w`: z stops between -5.6 and -5.3 (the solid part of the south wall); (3) teleport to (6, 0, 0, yaw -PI/2) and hold `w`: x stops between 9.0 and 9.7 (1.0 m ledge); (4) teleport to (0, 0, -13, yaw PI) (facing the room centre, camera behind toward the north wall): the horizontal distance between `cameraState()` and the player is below 1.0, and after teleporting to (0, 0, 8, yaw PI) it is above 3.5; (5) teleport to (-12, 0, -6, yaw 0) and hold `w`: `playerState().y` reaches 3.3 or more and z goes below -15 (onto the platform); zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/camera-mode.spec.js`
- `npx playwright test tests/e2e/collision.spec.js`
- `npm run lint`
- `node "{{runner}}/assert.mjs" has src/engine/camera.js "solveCamera[(]"`
- `node "{{runner}}/assert.mjs" has src/systems/input.js "viewCallback"`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/collision.js`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "CollisionWorld"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/collision/geometry.test.js tests/unit/collision/world.test.js tests/unit/collision/floors.test.js tests/unit/collision/cameraSolver.test.js tests/unit/collision/legacy.test.js`
- `npx playwright test tests/e2e/camera-mode.spec.js`
- `npx playwright test tests/e2e/collision.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
