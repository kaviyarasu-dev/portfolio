# Plan 016: Wall, floor and stair collision, camera collision and the first-person toggle

Epic E2. Estimated turns: 55.

## Goal

Replace the v1 circle list with a real collision world: oriented wall boxes (with enable/disable for doors), walkable floors, stairs and ramps, island bounds and substepped movement so nothing tunnels. Add a camera solver that keeps the third-person camera out of walls, and the `V` first-person toggle. Everything is pure, headless and unit tested; the v1 buildings keep working through an adapter.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 10.4, 10.5 and requirement R5, assumption A10)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/collision.js
- src/systems/controller.js
- src/engine/camera.js
- src/systems/input.js
- src/state.js
- src/world/terrain.js
- src/config.js
- src/dev/worldHook.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Geometry helpers and the walls part of CollisionWorld

Deliver:
- `tests/unit/collision/geometry.test.js` first. `src/systems/collision/geometry.js` (pure math, no Three.js): oriented box `{ cx, cz, hx, hz, rot, yMin, yMax }`; `circleVsBox(x, z, r, box)` returns `{ nx, nz, depth }` (push-out) or null, correct for rotated boxes, at edges and at corners; `segmentVsBox(ax, az, bx, bz, box)` returns the entry fraction t or null; `pointInBox(x, z, box)`.
- `tests/unit/collision/world.test.js` part 1, then `src/systems/collision/world.js` with `class CollisionWorld`: `addBox({ id, cx, cz, hx, hz, rot = 0, yMin, yMax, enabled = true, tag })`, `addCircle({ id, x, z, r, yMin = -Infinity, yMax = Infinity })`, `setEnabled(id, bool)`, `remove(id)`, `removeByPrefix(prefix)`, `has(id)`, `setBounds(radius)` (island edge), `setTerrainHeight(fn)`. Boxes and circles live in a uniform grid broadphase (cell 8 m, each shape registered in every cell it touches, `moveCircle`, `blockedAt`, `raycast2D` and `groundHeight` only look at nearby cells) so thousands of tree and prop colliders stay cheap.
- `moveCircle(pos, delta, radius, { stepUp = 0.45, height = 1.7 })` where `pos = { x, y, z }` and `delta = { dx, dz }`: split the move into sub-steps no longer than `radius * 0.5`; a box blocks only when `box.yMax > y + stepUp` and `box.yMin < y + height`; blocked sub-steps slide along the surface (resolve with up to 3 iterations, handling corners); the island bound pushes the circle back inside `radius_world - r`. Returns `{ x, y, z, blocked, hitId }` (floors and stairs arrive in step 2; until then `y` comes from `terrainHeight` or 0).
- Tests: straight wall stops the circle and leaves it not overlapping; sliding along a wall keeps the parallel component; a 1.2 m gap between two boxes lets radius 0.35 through and a 0.6 m gap does not; a disabled box (door open) lets it through, enabling it blocks again; a 6 m move in one call cannot tunnel through a 0.2 m wall; rotated (45 degree) wall; inside corner; the island bound holds for a 500 m walk outward; a box whose `yMax` is below the step height does not block (a low kerb); performance: with 6000 circles and 800 boxes spread over 600 m, 2000 `moveCircle` calls finish in under 150 ms.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/geometry.test.js tests/unit/collision/world.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/collision/geometry.js src/systems/collision/world.js`

### Step 2: Floors, stairs, ground height and ray queries

Deliver:
- `tests/unit/collision/floors.test.js` first. Add to `CollisionWorld`: `addFloor({ id, x0, z0, x1, z1, y, rot = 0, enabled = true })` (walkable rectangle at height y), `addStair({ id, x0, z0, x1, z1, rot = 0, dir, yLow, yHigh })` where `dir` is the angle (radians) pointing up the stairs inside the rectangle and the height is the linear ramp from `yLow` at the low edge to `yHigh` at the high edge, `setFloorY(id, y)` (moving platforms such as a lift cabin), `groundHeight(x, z, yRef, stepUp = 0.45)` returns `{ y, kind: 'terrain'|'floor'|'stair', id }` choosing the highest walkable surface not above `yRef + stepUp`, `blockedAt(x, z, y, r, height)` (true when a circle there would overlap an enabled box), `raycast2D(ax, az, bx, bz, y0, y1)` returning `{ t, id }` for the first enabled box hit.
- `moveCircle` now sets `y` from `groundHeight` after each sub-step. A ground more than `stepUp` above the current `y` acts as a wall (no climbing a 1 m ledge); a ground lower than `y` lets the player drop to it.
- Tests: walking up a stair (rise 3.4 m over a 6.8 m run, dir pointing along +z) reaches the top floor height within 0.05 m and keeps contact the whole way; the top floor lets you walk on; a 1.0 m high floor edge blocks from below but a 0.4 m one is stepped onto; a two-storey building: at y = 3.6 the ground-floor walls (yMax 3.4) do not block while the first-floor walls (yMin 3.4, yMax 6.8) do; walking off the edge of a floor drops to the terrain; `setFloorY` moves the ground under a standing player; `raycast2D` hits the nearest box and ignores disabled boxes; `blockedAt` agrees with `moveCircle`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/floors.test.js tests/unit/collision/world.test.js`

### Step 3: Camera solver

Deliver:
- `tests/unit/collision/cameraSolver.test.js` first. `src/systems/collision/cameraSolver.js` exports `solveCamera({ target: { x, y, z }, yaw, pitch, distance, shoulder = 0, minDistance = 0.4, radius = 0.25 }, world, { terrainHeight = () => 0, minAboveGround = 0.3 })` returning `{ position: { x, y, z }, distance, blocked }`. The wanted position is behind the target along `yaw` and `pitch` (the same convention as v1 `camera.js`), shifted sideways by `shoulder`. Walk from the target to the wanted position in small steps; the camera stops at the last position where a circle of `radius` does not overlap any enabled box (`blockedAt`) and never gets closer than `minDistance`; the result is lifted to `terrainHeight + minAboveGround`.
- Tests: free space returns the full distance and `blocked` false; a wall 2 m behind returns about 2 minus radius; a camera inside a closed 3 m room with the wall 0.2 m behind returns `minDistance`; shoulder offset applies when free and shrinks with the wall; a camera over a hill is lifted above the ground; yaw rotates the result correctly (a quarter turn moves it from the +z side to the +x side).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/collision/cameraSolver.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/collision/cameraSolver.js`

### Step 4: Integration: controller, legacy adapter, camera modes, hook

Deliver:
- Create one `CollisionWorld` in `src/engine/scene.js` as `game.collision` (bounds `WORLD_RADIUS`, terrain height from the v1 `sampleHeight`). `src/systems/collision/legacy.js` exports `installLegacyColliders(world, list)`; the v1 `addCollider(x, z, r)` in `src/world/collision.js` now also calls `world.addCircle` so the 14 v1 buildings and rocks still block. Keep the old `game.colliders` array only if something else still reads it; otherwise remove it.
- `src/systems/controller.js`: movement goes through `game.collision.moveCircle(pos, delta, 0.35)`; the player `y` follows the result (v1 used terrain only). Spawn safety uses `blockedAt`.
- `src/engine/camera.js`: third person uses `solveCamera` every frame (target = player position + 1.55 m up); `game.camRig.mode` is `'third'` or `'first'`; key `V` (in `src/systems/input.js`) toggles it; first person puts the camera at the player eye (1.62 m), uses the same yaw and pitch, clamps pitch to +-1.35, hides `game.player.body`; leaving first person shows it again. The camera override of plan 014 still wins.
- Hook: `cameraMode()`, `setCameraMode(m)`, `collisionStats()` returns `{ boxes, circles, floors, stairs }`.
- `tests/e2e/camera-mode.spec.js`: `cameraMode()` is `third`; press `v` and it becomes `first` with the camera within 0.3 m of the player eye position and the player body hidden; press `v` again and it is `third` and the body is visible; `collisionStats().circles` is at least 14 (the v1 buildings are still solid).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/camera-mode.spec.js`
- `npm run lint`
- `node "{{runner}}/assert.mjs" has src/systems/controller.js "moveCircle"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/collision/geometry.test.js tests/unit/collision/world.test.js tests/unit/collision/floors.test.js tests/unit/collision/cameraSolver.test.js`
- `npx playwright test tests/e2e/camera-mode.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
