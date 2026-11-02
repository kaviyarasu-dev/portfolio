import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 016
  {
    id: '016', name: 'collision-and-camera', title: 'Wall, floor and stair collision, camera collision and the first-person toggle', epic: 'E2', est: 55,
    arch: 'sections 4, 10.4, 10.5 and requirement R5, assumption A10',
    goal: [
      'Replace the v1 circle list with a real collision world: oriented wall boxes (with enable/disable for doors), walkable floors, stairs and ramps, island bounds and substepped movement so nothing tunnels. Add a camera solver that keeps the third-person camera out of walls, and the `V` first-person toggle. Everything is pure, headless and unit tested; the v1 buildings keep working through an adapter.',
    ],
    read: ['src/world/collision.js', 'src/systems/controller.js', 'src/engine/camera.js', 'src/systems/input.js', 'src/state.js', 'src/world/terrain.js', 'src/config.js', 'src/dev/worldHook.js'],
    steps: [
      {
        title: 'Geometry helpers and the walls part of CollisionWorld',
        items: [
          '`tests/unit/collision/geometry.test.js` first. `src/systems/collision/geometry.js` (pure math, no Three.js): oriented box `{ cx, cz, hx, hz, rot, yMin, yMax }`; `circleVsBox(x, z, r, box)` returns `{ nx, nz, depth }` (push-out) or null, correct for rotated boxes, at edges and at corners; `segmentVsBox(ax, az, bx, bz, box)` returns the entry fraction t or null; `pointInBox(x, z, box)`.',
          '`tests/unit/collision/world.test.js` part 1, then `src/systems/collision/world.js` with `class CollisionWorld`: `addBox({ id, cx, cz, hx, hz, rot = 0, yMin, yMax, enabled = true, tag })`, `addCircle({ id, x, z, r, yMin = -Infinity, yMax = Infinity })`, `setEnabled(id, bool)`, `remove(id)`, `removeByPrefix(prefix)`, `has(id)`, `setBounds(radius)` (island edge), `setTerrainHeight(fn)`. Boxes and circles live in a uniform grid broadphase (cell 8 m, each shape registered in every cell it touches, `moveCircle`, `blockedAt`, `raycast2D` and `groundHeight` only look at nearby cells) so thousands of tree and prop colliders stay cheap.',
          '`moveCircle(pos, delta, radius, { stepUp = 0.45, height = 1.7 })` where `pos = { x, y, z }` and `delta = { dx, dz }`: split the move into sub-steps no longer than `radius * 0.5`; a box blocks only when `box.yMax > y + stepUp` and `box.yMin < y + height`; blocked sub-steps slide along the surface (resolve with up to 3 iterations, handling corners); the island bound pushes the circle back inside `radius_world - r`. Returns `{ x, y, z, blocked, hitId }` (floors and stairs arrive in step 2; until then `y` comes from `terrainHeight` or 0).',
          'Tests: straight wall stops the circle and leaves it not overlapping; sliding along a wall keeps the parallel component; a 1.2 m gap between two boxes lets radius 0.35 through and a 0.6 m gap does not; a disabled box (door open) lets it through, enabling it blocks again; a 6 m move in one call cannot tunnel through a 0.2 m wall; rotated (45 degree) wall; inside corner; the island bound holds for a 500 m walk outward; a box whose `yMax` is below the step height does not block (a low kerb); performance: with 6000 circles and 800 boxes spread over 600 m, 2000 `moveCircle` calls finish in under 150 ms.',
        ],
        verify: [vt('tests/unit/collision/geometry.test.js', 'tests/unit/collision/world.test.js'), exists('src/systems/collision/geometry.js', 'src/systems/collision/world.js')],
      },
      {
        title: 'Floors, stairs, ground height and ray queries',
        items: [
          '`tests/unit/collision/floors.test.js` first. Add to `CollisionWorld`: `addFloor({ id, x0, z0, x1, z1, y, rot = 0, enabled = true })` (walkable rectangle at height y), `addStair({ id, x0, z0, x1, z1, rot = 0, dir, yLow, yHigh })` where `dir` is the angle (radians) pointing up the stairs inside the rectangle and the height is the linear ramp from `yLow` at the low edge to `yHigh` at the high edge, `setFloorY(id, y)` (moving platforms such as a lift cabin), `groundHeight(x, z, yRef, stepUp = 0.45)` returns `{ y, kind: \'terrain\'|\'floor\'|\'stair\', id }` choosing the highest walkable surface not above `yRef + stepUp`, `blockedAt(x, z, y, r, height)` (true when a circle there would overlap an enabled box), `raycast2D(ax, az, bx, bz, y0, y1)` returning `{ t, id }` for the first enabled box hit.',
          '`moveCircle` now sets `y` from `groundHeight` after each sub-step. A ground more than `stepUp` above the current `y` acts as a wall (no climbing a 1 m ledge); a ground lower than `y` lets the player drop to it.',
          'Tests: walking up a stair (rise 3.4 m over a 6.8 m run, dir pointing along +z) reaches the top floor height within 0.05 m and keeps contact the whole way; the top floor lets you walk on; a 1.0 m high floor edge blocks from below but a 0.4 m one is stepped onto; a two-storey building: at y = 3.6 the ground-floor walls (yMax 3.4) do not block while the first-floor walls (yMin 3.4, yMax 6.8) do; walking off the edge of a floor drops to the terrain; `setFloorY` moves the ground under a standing player; `raycast2D` hits the nearest box and ignores disabled boxes; `blockedAt` agrees with `moveCircle`.',
        ],
        verify: [vt('tests/unit/collision/floors.test.js', 'tests/unit/collision/world.test.js')],
      },
      {
        title: 'Camera solver',
        items: [
          '`tests/unit/collision/cameraSolver.test.js` first. `src/systems/collision/cameraSolver.js` exports `solveCamera({ target: { x, y, z }, yaw, pitch, distance, shoulder = 0, minDistance = 0.4, radius = 0.25 }, world, { terrainHeight = () => 0, minAboveGround = 0.3 })` returning `{ position: { x, y, z }, distance, blocked }`. The wanted position is behind the target along `yaw` and `pitch` (the same convention as v1 `camera.js`), shifted sideways by `shoulder`. Walk from the target to the wanted position in small steps; the camera stops at the last position where a circle of `radius` does not overlap any enabled box (`blockedAt`) and never gets closer than `minDistance`; the result is lifted to `terrainHeight + minAboveGround`.',
          'Tests: free space returns the full distance and `blocked` false; a wall 2 m behind returns about 2 minus radius; a camera inside a closed 3 m room with the wall 0.2 m behind returns `minDistance`; shoulder offset applies when free and shrinks with the wall; a camera over a hill is lifted above the ground; yaw rotates the result correctly (a quarter turn moves it from the +z side to the +x side).',
        ],
        verify: [vt('tests/unit/collision/cameraSolver.test.js'), exists('src/systems/collision/cameraSolver.js')],
      },
      {
        title: 'Integration: controller, legacy adapter, camera modes, hook',
        items: [
          'Create one `CollisionWorld` in `src/engine/scene.js` as `game.collision` (bounds `WORLD_RADIUS`, terrain height from the v1 `sampleHeight`). `src/systems/collision/legacy.js` exports `installLegacyColliders(world, list)`; the v1 `addCollider(x, z, r)` in `src/world/collision.js` now also calls `world.addCircle` so the 14 v1 buildings and rocks still block. Keep the old `game.colliders` array only if something else still reads it; otherwise remove it.',
          '`src/systems/controller.js`: movement goes through `game.collision.moveCircle(pos, delta, 0.35)`; the player `y` follows the result (v1 used terrain only). Spawn safety uses `blockedAt`.',
          '`src/engine/camera.js`: third person uses `solveCamera` every frame (target = player position + 1.55 m up); `game.camRig.mode` is `\'third\'` or `\'first\'`; key `V` (in `src/systems/input.js`) toggles it; first person puts the camera at the player eye (1.62 m), uses the same yaw and pitch, clamps pitch to +-1.35, hides `game.player.body`; leaving first person shows it again. The camera override of plan 014 still wins.',
          'Hook: `cameraMode()`, `setCameraMode(m)`, `collisionStats()` returns `{ boxes, circles, floors, stairs }`.',
          '`tests/e2e/camera-mode.spec.js`: `cameraMode()` is `third`; press `v` and it becomes `first` with the camera within 0.3 m of the player eye position and the player body hidden; press `v` again and it is `third` and the body is visible; `collisionStats().circles` is at least 14 (the v1 buildings are still solid).',
        ],
        verify: [pw('tests/e2e/camera-mode.spec.js', 10), npm('lint'), has('src/systems/controller.js', 'moveCircle')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/collision/geometry.test.js', 'tests/unit/collision/world.test.js', 'tests/unit/collision/floors.test.js', 'tests/unit/collision/cameraSolver.test.js'), pw('tests/e2e/camera-mode.spec.js', 10), pw('tests/e2e/v1-behaviour.spec.js', 15), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/collision/*.test.js', 'portfolio/tests/e2e/camera-mode.spec.js'],
  },

  // ---------------------------------------------------------------- 017
  {
    id: '017', name: 'interaction-core-doors', title: 'Interaction registry, event bus, read objects and hinged doors', epic: 'E2', est: 50,
    arch: 'sections 4 and 10.5, requirement R5, decisions D19, assumptions A5',
    goal: [
      'The generic way to act on the world with `E`: an interaction registry (nearest usable object in front of the player, one prompt), a tiny event bus for sound and effect hooks, `read` objects that open the resume dialogue panel (A5), and animated hinged doors with colliders, locking and the edge cases a real door has. the v1 dialogue behaviour (press `E` within the zone radius) keeps working for zones not yet converted (ARCHITECTURE.md 10.7).',
    ],
    read: ['src/systems/interaction.js', 'src/ui/hud.js', 'src/world/zones.js', 'src/world/buildingAnims.js', 'src/systems/input.js', 'src/systems/collision/world.js', 'src/dev/worldHook.js', 'src/dev/fixtures/index.js'],
    steps: [
      {
        title: 'Event bus and interaction registry',
        items: [
          '`tests/unit/interaction/registry.test.js` first. `src/systems/events.js`: `on(name, fn)` (returns unsubscribe), `off`, `emit(name, payload)`, `once`; a handler that throws is caught with `console.warn` and does not stop the others.',
          '`src/systems/interaction/registry.js` exports `class InteractionRegistry`: `register({ id, kind, x, y, z, radius = 1.6, prompt, enabled = () => true, onUse, facing })` (`kind` is one of `read|sit|switch|door|elevator|talk`; `prompt` is a string or a function returning one; duplicate id throws), `unregister(id)`, `unregisterByPrefix(prefix)`, `find(playerPos, playerYaw)` returning the best candidate: enabled, within `radius` (3D distance, with the vertical difference at most 1.6 m so objects on another floor are ignored), and among those the one with the best score = distance, minus a bonus when it lies within 60 degrees of the player facing; `use(playerPos, playerYaw)` calls `onUse` of the found object and emits `interact:<kind>`; `list()` returns plain data.',
          'Tests: nearest wins; the one in front beats a slightly nearer one behind; disabled and out-of-radius are skipped; other floor (dy 3 m) is skipped; dynamic prompt; duplicate id throws; unregisterByPrefix; events handler isolation.',
        ],
        verify: [vt('tests/unit/interaction/registry.test.js'), exists('src/systems/events.js', 'src/systems/interaction/registry.js')],
      },
      {
        title: 'Hinged doors',
        items: [
          '`tests/unit/interaction/doors.test.js` first. `src/systems/interaction/doors.js` exports `createDoor({ id, hinge: { x, y, z }, yaw, width, height = 2.2, openAngle = 1.75, locked = false, decorative = false, leaf, world, registry, events })` returning a `Door` with `use(player)`, `update(dtMs, playerPos)`, `state` (`closed|opening|open|closing`), `progress` (0..1), `lock()`, `unlock()`, `dispose()`. `leaf` is the pivot `Object3D` that rotates about y at the hinge; the door adds a closed-leaf collider box `door:<id>` to `world` and an interactable `door:<id>` (prompt "open door" / "close door" / "locked") to `registry` unless `decorative`.',
          'Behaviour: opening takes 600 ms with ease-in-out; the swing direction is away from the side the player is on; the collider is enabled while `progress < 0.35`, disabled after; `use` while opening reverses the motion smoothly; closing is refused (stays open) while the player is within 0.9 m of the door line or in the doorway (`update` receives the player position), with a toast "something is in the way" (emit `door:blocked`); a locked door does not move, emits `door:locked` and shows the toast "locked"; `decorative` doors never register an interactable and keep their collider; events `door:open`, `door:close` (with the door id) are emitted when the motion starts.',
          'Tests with fake time: durations, easing monotonic, collider toggling, reversal mid-swing, refusing to close on the player, locked, unlock, decorative, dispose removes collider and interactable, swing direction by player side.',
        ],
        verify: [vt('tests/unit/interaction/doors.test.js'), exists('src/systems/interaction/doors.js')],
      },
      {
        title: 'Read objects and wiring into the game loop and the old interaction code',
        items: [
          '`src/systems/interaction/read.js`: `registerReadObject({ id, zoneId, key, x, y, z, radius, prompt })` registers a `read` interactable whose `onUse` calls `openDialogue(zoneId, key)` from `src/ui/hud.js` (extend `openDialogue(zoneId, key = \'main\')`; v1 `DIALOGUES[zoneId]` stays the default builder so existing content is unchanged).',
          '`src/world/zones.js`: every zone entry gets `mode: \'radius\'` (v1 behaviour). `src/systems/interaction.js` keeps the v1 logic (nearest zone within its radius, `E` opens or closes the dialogue, walking away closes it) for zones with `mode: \'radius\'` and skips `mode: \'object\'` zones. The `E` key first asks the registry (`game.interaction.use(...)`); only when it finds nothing does the v1 logic run. The prompt shows the registry prompt (with the `E` key cap) when a candidate exists.',
          'Each frame `gameloop.js` calls `game.interaction.update` (prompt) and every door `update(dt, playerPos)`; a `game.doors` list keeps them. Hook: `listDoors()` returns `[{ id, state, open, locked, x, z }]`, `listInteractables()`, `useNearest()`; `teleport(x, z, y, yaw)` accepts a yaw that sets player facing and camera yaw.',
        ],
        verify: [has('src/systems/interaction/read.js', 'openDialogue'), has('src/world/zones.js', "mode: 'radius'"), npm('lint')],
      },
      {
        title: 'Interactions fixture and Playwright door tests',
        items: [
          '`src/dev/fixtures/interactions.js`: a flat floor with a closed room 8 m wide and 6 m deep whose south wall has a doorway of 1.1 m with a working door (hinge on the left), a second locked door in the east wall, and a read desk inside at the north wall (`registerReadObject` with zone `plaza`). Other plans extend this fixture with a switch, seats and a lift; keep its builder as a list of small functions so they can add parts.',
          '`tests/e2e/doors.spec.js`: `?fixture=interactions`; teleport 1.3 m south of the door facing it; press `e`; after 900 ms `listDoors()[0].state` is `open`; hold `w` for 1.2 s and `playerState().z` is beyond the wall line; face back and press `e` from inside to close it after stepping out of the doorway; the locked door stays `closed`, `locked` true, and shows the toast; at the desk `e` makes `#dialogue` visible; zero console errors.',
        ],
        verify: [pw('tests/e2e/doors.spec.js', 10), exists('src/dev/fixtures/interactions.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/interaction/registry.test.js', 'tests/unit/interaction/doors.test.js'), pw('tests/e2e/doors.spec.js', 10), pw('tests/e2e/v1-behaviour.spec.js', 15), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/interaction/registry.test.js', 'portfolio/tests/unit/interaction/doors.test.js', 'portfolio/tests/e2e/doors.spec.js'],
  },

  // ---------------------------------------------------------------- 018
  {
    id: '018', name: 'interaction-extras', title: 'Light switches, sitting, the elevator and stairs in the interactions fixture', epic: 'E2', est: 55,
    arch: 'sections 4, 10.5, requirement R5, decision D19',
    goal: [
      'The remaining reusable interactions: light switches (toggle a light group), sitting on chairs, sofas and beds (avatar sit clip, camera adjusts, stand up on movement), and an elevator with doors and a moving floor that carries the player. Stairs are collision stairs (plan 016) and are built here into the fixture so the Playwright tests prove them. Each system is a headless state machine with Vitest tests plus a fixture-based Playwright test.',
    ],
    read: ['src/systems/interaction/registry.js', 'src/systems/interaction/doors.js', 'src/systems/lights/lightManager.js', 'src/entity/player.js', 'src/engine/camera.js', 'src/systems/controller.js', 'src/dev/fixtures/interactions.js', 'src/systems/collision/world.js'],
    steps: [
      {
        title: 'Light switch and the sit system',
        items: [
          '`tests/unit/interaction/switch.test.js` and `tests/unit/interaction/sit.test.js` first.',
          '`src/systems/interaction/lightSwitch.js`: `createLightSwitch({ id, group, x, y, z, registry, lightManager, events })` registers a `switch` interactable (prompt "turn lights on" / "turn lights off" from `isGroupOn`), `onUse` calls `toggleGroup` and emits `sfx:switch`; returns a handle with `dispose()`.',
          '`src/systems/interaction/sit.js`: `createSeat({ id, kind: \'chair|sofa|bed\', x, y, z, yaw, standOffset = 0.7, registry, world, events })` registers a `sit` interactable (prompt "sit" / "lie down" for beds). `SitController` (one per game) states `standing|moving|seated|standing-up`: on use the player moves to the seat in 300 ms (position and facing), the avatar plays `sit` (`playAvatarAnim`), `game.player.sitting = true` and the controller ignores movement keys; any movement key or `e` stands up: the player moves to the stand point (`x + standOffset` along the seat yaw direction) after checking `world.blockedAt` there (try left, right, back when blocked; if all are blocked stay seated and toast "no room to stand"), plays `idle`, and `sitting` becomes false. Camera while seated: distance 3.0 and pitch clamp -0.5..0.2 in third person; first person eye is 1.15 m above the seat. Beds use the same pose with the seat 0.1 m lower. Emits `sfx:sit` and `sfx:stand`.',
          'Tests: switch toggles the group and the prompt text flips; seat use sequence with fake time reaches `seated`; movement key stands up; blocked stand point tries alternatives and finally refuses; using another seat while seated is ignored; `dispose` unregisters.',
        ],
        verify: [vt('tests/unit/interaction/switch.test.js', 'tests/unit/interaction/sit.test.js'), exists('src/systems/interaction/lightSwitch.js', 'src/systems/interaction/sit.js')],
      },
      {
        title: 'Elevator',
        items: [
          '`tests/unit/interaction/elevator.test.js` first. `src/systems/interaction/elevator.js`: `createLift({ id, x, z, width = 2.0, depth = 2.0, floors: [y0, y1, ...], rot = 0, world, registry, events, group })` returns a `Lift` with `call(floorIndex)`, `update(dtMs, playerPos)`, `state` (`idle|doors-closing|moving|doors-opening|open`), `currentFloor`, `y`, `dispose()`.',
          'Behaviour: a cabin floor `lift:<id>:cabin` (`addFloor`, moved with `setFloorY`) and two door colliders per floor entrance that are enabled while the doors are not fully open; requests are queued (nearest in travel direction first, never reverse mid-trip); doors take 700 ms to open and close; the cabin moves at 1.6 m/s with a 0.4 s ease at each end; while `moving` and the player stands inside the cabin rectangle their `y` is set to the cabin floor `y` each frame (nobody is left behind or dropped); doors do not close while the player stands in the doorway; interactables: one "call lift" button per floor outside (prompt "call lift") and one button per floor inside the cabin (prompt "go to floor N"); emits `sfx:lift-ding` on arrival and `sfx:lift-move`.',
          'Tests with fake time: queue ordering, a call from the floor you are on just opens the doors, player carried to the target y within 0.05 m, door colliders toggle, the player in the doorway keeps the doors open, disposal removes everything, two calls while moving are both served.',
        ],
        verify: [vt('tests/unit/interaction/elevator.test.js'), exists('src/systems/interaction/elevator.js')],
      },
      {
        title: 'Extend the interactions fixture: lamp, seats, bed, stairs and a three-level lift',
        items: [
          'In `src/dev/fixtures/interactions.js` (extend by adding builder functions, do not rewrite): a lamp group `fixture-lamp` with a light and a wall switch next to the room door; a chair, a sofa and a bed inside the room (use plain box meshes now; the prop catalog arrives in plan 019); a two-flight staircase on the east side of the fixture floor going up to a platform at y = 3.4 (stairs via `addStair`, rails and walls as boxes); a three-level lift shaft (floors y = 0, 3.4, 6.8) with the lift and its call buttons.',
          'Hook additions: `playerState()` gains `sitting` and `seatId`; `liftState(id)` returns `{ state, currentFloor, y }`.',
        ],
        verify: [has('src/dev/fixtures/interactions.js', 'createLift'), has('src/dev/fixtures/interactions.js', 'createSeat'), npm('lint')],
      },
      {
        title: 'Playwright: switch, sit, stairs and the lift',
        items: [
          '`tests/e2e/interactions-extras.spec.js` on `?fixture=interactions&time=0.5`: press `e` at the wall switch and `listLights()` shows the `fixture-lamp` group on, again and off; `e` at the chair makes `playerState().sitting` true and `playerAnim()` `sit`; pressing `w` stands up (`sitting` false); sit on the bed then press `v`: first person works and the camera is lower than when standing; walk up the stairs by holding `w` from the bottom (teleport to the bottom facing up): `playerState().y` reaches 3.3 or more within 8 s of walking; ride the lift: call it at floor 0, step in, press the floor-2 button, `playerState().y` is within 0.1 m of 6.8 after at most 12 s and the lift state is `open`; zero console errors.',
        ],
        verify: [pw('tests/e2e/interactions-extras.spec.js', 15)],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/interaction/switch.test.js', 'tests/unit/interaction/sit.test.js', 'tests/unit/interaction/elevator.test.js'), pw('tests/e2e/interactions-extras.spec.js', 15), pw('tests/e2e/doors.spec.js', 10)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/interaction/switch.test.js', 'portfolio/tests/unit/interaction/sit.test.js', 'portfolio/tests/unit/interaction/elevator.test.js', 'portfolio/tests/e2e/interactions-extras.spec.js'],
  },

  // ---------------------------------------------------------------- 019
  {
    id: '019', name: 'prop-catalog-set-a', title: 'Prop catalog core and set A: seating, tables, beds (40 types)', epic: 'E2', est: 55,
    arch: 'sections 2, 10.5 and decision D18 (40+ distinct objects per building)',
    goal: [
      'Every landmark needs 40 or more distinct furniture and decor types. This plan builds the prop catalog (registration, metadata, headless-safe builders, merged meshes) and the first set of 40 well-detailed furniture types. Props are code-built from the shared material library (plan 013); a later plan swaps some for CC0 Poly Haven models without changing any type name.',
    ],
    read: ['src/engine/materials.js', 'src/util/uv.js', 'src/util/rng.js', 'src/dev/fixtures/index.js', 'src/dev/fixtures/materials.js', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'Catalog core, builder helpers and the props fixture',
        items: [
          '`tests/unit/props/catalog.test.js` first. `src/world/props/catalog.js`: `registerProp(type, { category, tags = [], size: [w, h, d], solid = true, seats = [], build(ctx) })` (types match `/^[a-z][a-z0-9-]*$/`; duplicate throws), `buildProp(type, { rng, tint, variant, tier } = {})` returning an `Object3D` with origin at floor centre, front toward +z, and `userData = { propType, size, solid, seats }`, `propExists(type)`, `getPropMeta(type)`, `listPropTypes()`, `listByCategory(cat)`. `ctx` passed to `build` has `{ m: getMaterial, box(w,h,d,mat,x,y,z), cyl(rTop,rBottom,h,mat,x,y,z,radial), sphere(...), rbox(w,h,d,radius,mat,x,y,z) (RoundedBoxGeometry), rng, tint, variant }`. Helper `finishProp(group)` merges all meshes that share a material into one mesh (`mergeGeometries`) so a prop has at most one mesh per material, applies `applyMetricUV` where the geometry has no uv, and sets `castShadow` and `receiveShadow`.',
          '`src/world/props/index.js` imports every set file (side-effect registration); `src/world/props/sets/` holds the set files. Sets must run in Node: no `document` access at import or build time (materials fall back to flat colours in Node).',
          '`src/dev/fixtures/props.js`: lays out every registered type on a grid, 3 m apart, rows per category; `listObjects()` (hook) returns the placed types; the fixture also logs nothing. Register it as `props`.',
          'Generic data-driven test `tests/unit/props/allProps.test.js` (written now, it keeps covering later sets automatically): for every `listPropTypes()` entry: `buildProp` returns an `Object3D` with at least 3 meshes before merging is NOT required, but after `finishProp` at most 12 meshes; bounding box height and footprint are each within 20 percent of the declared `size`; no NaN in positions; at least one mesh; `seats` positions lie inside the bounding box; building twice with different seeds gives the same size; type names unique.',
        ],
        verify: [vt('tests/unit/props/catalog.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/catalog.js', 'src/world/props/index.js', 'src/dev/fixtures/props.js')],
      },
      {
        title: 'Seating (14 types)',
        items: [
          'Create `src/world/props/sets/seating.js` registering exactly these types (category `seating`): `chair-dining`, `chair-wooden`, `chair-cane` (woven seat, South Indian style), `chair-office` (5-star base, wheels), `chair-plastic` (moulded, stackable look), `chair-waiting` (a row of three joined seats), `armchair`, `sofa-2`, `sofa-3`, `stool`, `stool-bar`, `bench-wood`, `bench-park` (slatted, cast ends), `bench-stone` (granite slab on two legs).',
          'Quality bar for every type (this is what makes the world feel real, not a box with legs): at least 3 distinct parts with believable proportions (seat height 0.42 to 0.48 m, sofa depth 0.85 to 0.95 m), rounded cushions with `rbox`, visible legs or stretchers, different materials for frame and upholstery (`woodDark`, `fabric`, `metalBrushed`, `metalPainted`), a `variant` option for colour (the `tint` argument recolours the fabric). Seats: `chair-*`, `armchair`, `stool*`, `sofa-*` (one seat per 0.6 m of width), benches get one seat per 0.6 m, with `seats: [{ x, y, z, yaw }]` giving seat surface positions and facing (+z is the front).',
          '`tests/unit/props/seating.test.js`: the exact type list is registered; each seated type has seats with correct counts (`sofa-3` has 3, `chair-waiting` has 3, `stool` has 1, `bench-wood` has at least 2); seat heights between 0.38 and 0.55.',
        ],
        verify: [vt('tests/unit/props/seating.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/seating.js')],
      },
      {
        title: 'Tables and desks (14 types)',
        items: [
          'Create `src/world/props/sets/tables.js` (category `tables`): `table-dining-4`, `table-dining-6`, `table-round`, `table-coffee`, `table-side`, `table-bedside` (with a drawer and a knob), `table-bar`, `table-folding`, `trestle-table`, `desk-wood` (with drawers), `desk-office` (metal legs, modesty panel), `console-table`, `table-tea-stall` (small low table with a tea glass rack), `counter-straight` (a 2 m service counter with a front panel and a top).',
          'Quality bar as in the previous step: table height 0.72 to 0.78 m (coffee 0.40 to 0.45, bar 1.05 to 1.1, counter 1.0 to 1.1), visible top thickness, legs or panels, a `woodDark` top with a slightly different `woodPlanks` apron or a `marble` top for two types. Tables are `solid`; `seats` empty. Declare `size` accurately because the building placement uses it for clearances.',
          '`tests/unit/props/tables.test.js`: exact type list; heights within the ranges above; `table-dining-6` footprint is larger than `table-dining-4`.',
        ],
        verify: [vt('tests/unit/props/tables.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/tables.js')],
      },
      {
        title: 'Beds, bedding and outdoor seating (12 types)',
        items: [
          'Create `src/world/props/sets/beds.js` (category `beds`): `bed-single`, `bed-double`, `bed-king` (headboard, mattress, base, two pillows, folded blanket), `charpai` (rope-strung cot with a wooden frame, local), `sleeping-mat` (rolled rattan mat), `pillow-stack`, `blanket-roll`, `luggage-bench` (low bench at the foot of a bed); and `src/world/props/sets/outdoorSeating.js` (category `outdoor`): `swing-bench` (hanging wooden bench on chains, a South Indian oonjal), `bench-bus-stop` (metal frame, three seats), `plastic-stool-set` (three stacked stools), `charpoy-low` (a low string stool).',
          'Beds: mattress top at 0.45 to 0.55 m; `seats` for `bed-single` (1), `bed-double` (2), `bed-king` (2), `charpai` (2) with the seat yaw facing +z and `y` at the mattress top; the `bed-king` size is about 2.0 by 2.1 m. `pillow-stack`, `blanket-roll`, `sleeping-mat` are small (`solid: false`) so they can sit on top of beds with `place: "on:bed-king"`.',
          '`tests/unit/props/beds.test.js`: exact type list; mattress heights; seats counts; the small items are not solid.',
          'Run the fixture once: `npm run shots -- --fixture props --plan 019` and open the PNG with the Read tool. Fix anything obviously wrong (floating parts, flipped normals, a type that looks like a single box). Best effort, never fails.',
        ],
        verify: [vt('tests/unit/props/beds.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/beds.js', 'src/world/props/sets/outdoorSeating.js'), { cmd: 'npx vitest run tests/unit/props', timeout_min: 10 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/catalog.test.js', 'tests/unit/props/allProps.test.js', 'tests/unit/props/seating.test.js', 'tests/unit/props/tables.test.js', 'tests/unit/props/beds.test.js')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/**'],
    freeze: ['portfolio/tests/unit/props/catalog.test.js', 'portfolio/tests/unit/props/allProps.test.js', 'portfolio/tests/unit/props/seating.test.js', 'portfolio/tests/unit/props/tables.test.js', 'portfolio/tests/unit/props/beds.test.js'],
  },

  // ---------------------------------------------------------------- 020
  {
    id: '020', name: 'kit-shell', title: 'Building kit shell: manifest schema, walls with openings, floors, roofs and colliders', epic: 'E2', est: 55, model: 'opus',
    arch: 'sections 3, 10.4, 10.6 and requirement R6, decision D18',
    goal: [
      'Build the generator that turns a building manifest into a walkable building shell: validated schema, wall segments with door and window openings, floor slabs, ceilings, five roof types, perimeter walls split from interior partitions, merged meshes (draw-call budget) and colliders. Everything runs headless so `check:buildings` can build and walk a building in Node. This plan covers geometry and collision only; rooms content, doors, lights and props come in plan 021.',
    ],
    read: ['docs/plans/realistic-world-overhaul/ARCHITECTURE.md', 'src/systems/collision/world.js', 'src/engine/materials.js', 'src/util/uv.js', 'src/world/props/catalog.js', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'Manifest schema, the manifest doc and fixtures',
        items: [
          '`tests/unit/kit/schema.test.js` first. `src/world/kit/schema.js` exports `validateManifest(m)` returning an array of `{ path, message }` (empty means valid). Implement the format of ARCHITECTURE.md 10.6 exactly and add: top-level `lifts: [{ id, x, z, width, depth, floors: [levelIndex...], rot }]` and per-floor `rooftop: true` (a flat roof level that is walkable and gets a 1.0 m parapet). Checks: required fields and types; unique ids (rooms, doors, windows, stairs, interactables, lifts); every room `floor` exists in `floors`; room `bounds` are `[x0, z0, x1, z1]` with `x1 > x0` and `z1 > z0`, inside `footprint` (centre origin, so x in [-w/2, w/2], z in [-d/2, d/2]); rooms on the same floor do not overlap by more than 0.05 m2; each door `from` and `to` is a room id or `outside`, and the wall of the door lies on the shared boundary of the two rooms (or on the footprint edge for `outside`) within 0.05 m; door and window `at` positions plus half widths stay inside the wall length with 0.3 m margin; `kind` is one of `exterior|interior|decorative`; stairs `from` and `to` are rooms on adjacent floors; interactable `room` exists; `exteriorDetails.class` is one of `window|door|signage|drainpipe|planter|bin|lamp`; `style.roof.type` is one of `hip|gable|flat|dome|cone`.',
          '`docs/building-manifest.md` documents the schema with one full example and the rules (the next plans and every building plan read it). Create fixtures `tests/fixtures/manifests/cottage.json` (footprint 10 by 8, two rooms `hall` and `bedroom` on floor 0, an exterior door on the south wall, an interior door, two windows, flat roof with parapet, no objects) and `tests/fixtures/manifests/twoStorey.json` (footprint 12 by 10, two floors, stairs, hip roof).',
          'Tests: the fixtures validate; one test per rule that mutates a valid manifest and expects a message with the right `path`.',
        ],
        verify: [vt('tests/unit/kit/schema.test.js'), exists('src/world/kit/schema.js', 'docs/building-manifest.md', 'tests/fixtures/manifests/cottage.json', 'tests/fixtures/manifests/twoStorey.json')],
      },
      {
        title: 'Wall segments with openings',
        items: [
          '`tests/unit/kit/walls.test.js` first. `src/world/kit/walls.js` exports `buildWallPlan(manifest)` returning `{ boxes, openings }`: for each floor, perimeter walls (thickness 0.3, along the footprint edge, flush inside it) and interior partition walls (thickness 0.15, centred on the shared room edges, de-duplicated so a shared edge yields one wall) from the room bounds; every door and window cuts an opening: a door gives a full-height gap plus a lintel box above `door.height`, a window gives a box below the sill and a box above `sill + height`. Each box is `{ id, cx, cz, hx, hz, rot, yMin, yMax, side: \'perimeter\'|\'interior\', floor }` in building-local coordinates (rotation 0; the world rotation is applied later). Segments shorter than 0.05 m are dropped. A door between a room and `outside` is cut in the perimeter wall; a door between two rooms in the partition.',
          'Tests on the fixtures: the south door gap is exactly `width` wide; wall plus gaps cover the whole edge length (no leaks, no overlaps beyond 1 mm); a window leaves a sill box and a header box with the right heights; two adjacent rooms share one partition; a door at the very end of a wall (within margin) is rejected by the schema, not by this module; a two-storey manifest yields boxes with `yMin` equal to each floor `y`.',
        ],
        verify: [vt('tests/unit/kit/walls.test.js'), exists('src/world/kit/walls.js')],
      },
      {
        title: 'Shell meshes: walls, floors, ceilings, roofs, merged by material',
        items: [
          '`tests/unit/kit/shell.test.js` first. `src/world/kit/shell.js` exports `buildShell(manifest, ctx)` returning `{ exterior: Group, interior: Group, stats }`. `exterior` holds perimeter walls (outside face uses `style.wall` with `wallTint`, inside face the room wall material, default `plaster`), roof, parapets, window glass (`glass` material); `interior` holds partition walls, room floors (slab 0.2 m thick, `room.floorMaterial`), ceilings, stair bodies are NOT here. Use `applyMetricUV` with the spec tile size so textures tile at real scale. Merge all geometry that shares a material and a group into one mesh (`mergeGeometries`), so the shell of any building uses at most 8 meshes in `exterior` and 10 in `interior` for the fixtures.',
          'Roofs from `style.roof`: `flat` (slab, parapet 0.9 m high all around, a thin cornice), `hip` and `gable` (pitched prism over the top floor with `overhang`, `pitch` as rise over run, tile material, gable end walls), `dome` (hemisphere on a drum) and `cone` (for towers); the roof sits on the top `floors` entry; a floor marked `rooftop: true` is a flat walkable level with a parapet. Roof geometry covers the whole footprint (bounding box check).',
          'Tests: every roof type builds with finite geometry whose bounding box covers the footprint plus overhang; mesh counts under the limits; triangle count of the `twoStorey` shell under 6000; `userData.layer` is `exterior` or `interior`; tinting changes the wall material instance but not the texture set; building the same manifest twice gives equal stats.',
        ],
        verify: [vt('tests/unit/kit/shell.test.js'), exists('src/world/kit/shell.js')],
      },
      {
        title: 'Collision wiring and the walk-through test',
        items: [
          '`src/world/kit/collide.js` exports `addShellColliders(world, manifest, plan, placement)` where `placement = { x, z, rot, y }` is the world placement: every wall box becomes `addBox` with id `<building>:wall:<n>` transformed to world coordinates (rotation supported); every room floor becomes `addFloor` at its floor `y`; stairs become `addStair` with rails; rooftop floors become `addFloor`; returns the list of ids so the building can remove them. Roofs of pitched types are not walkable.',
          '`tests/unit/kit/collide.test.js`: with the `cottage` fixture placed at (20, -15) rotated 30 degrees: a circle walks from outside through the south door into `hall`, through the interior door into `bedroom`, is blocked by every other wall, cannot walk through a window opening (the sill box blocks), and can stand on the floor at `y` 0; with `twoStorey`: walks up the stairs to floor 1 and the ground-floor walls do not block there.',
        ],
        verify: [vt('tests/unit/kit/collide.test.js', 'tests/unit/kit/shell.test.js', 'tests/unit/kit/walls.test.js'), exists('src/world/kit/collide.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/kit/schema.test.js', 'tests/unit/kit/walls.test.js', 'tests/unit/kit/shell.test.js', 'tests/unit/kit/collide.test.js')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/building-manifest.md'],
    freeze: ['portfolio/tests/unit/kit/schema.test.js', 'portfolio/tests/unit/kit/walls.test.js', 'portfolio/tests/unit/kit/shell.test.js', 'portfolio/tests/unit/kit/collide.test.js', 'portfolio/tests/fixtures/manifests/cottage.json', 'portfolio/tests/fixtures/manifests/twoStorey.json'],
  },
];
