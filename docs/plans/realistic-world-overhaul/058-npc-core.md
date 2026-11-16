# Plan 058: NPC core: cheap skinned people, routines, path following and player avoidance

Epic E5. Estimated turns: 60.

## Goal

The engine of ambient people. A skinned single-mesh version of the procedural humanoid (about one draw call per person, vertex-coloured clothes), extra work and sit clips, an NPC state machine (walk a route, idle, sit on a seat, work), outdoor path following on the walk graph, indoor waypoint loops on one floor only (A27), soft avoidance of the player, and hard walls through the collision world. No conversations, no greetings (D23).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.5 and requirement R10, decision D8, D23, assumption A27)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/entity/avatar/humanoid.js
- src/entity/avatar/clips.js
- src/entity/avatar/loadAvatar.js
- src/systems/nav/walkGraph.js
- src/systems/collision/world.js
- src/systems/interaction/sit.js
- src/engine/quality.js
- src/world/kit/building.js
- src/state.js
- src/dev/worldHook.js
- src/fixtures/index.js
- src/systems/gameloop.js
- src/util/rng.js
- src/util/urlParams.js
- src/config.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Skinned humanoid with vertex colours and extra clips

Deliver:
- `tests/unit/npc/skinned.test.js` first. `src/entity/avatar/skinnedHumanoid.js`: `buildSkinnedHumanoid({ skin, shirt, trousers, shoes, hair, heightScale, seed })` builds the same body parts as `buildHumanoid`, merges all part geometries into one `BufferGeometry` with a `color` vertex attribute (skin, shirt, trousers, shoes, hair), `skinIndex` and `skinWeight` (each part rigidly weighted 1.0 to the bone of its joint; the part-to-joint map is the one `humanoid.js` already uses, read from that file), and returns `{ root, mesh (SkinnedMesh), bones: { <jointName>: Bone }, height }` with bone names exactly the joint-name keys of `humanoid.js` and the same rest pose, so `buildClips(bones)` from plan 008 works unchanged. SEED CLASSES: the seed picks a class `seed % 6`; the colours (skin, shirt, trousers, shoes, hair) are baked into the geometry per seed class, so there are at most 6 geometry variants, and the shirt palette has 12 colours spread over the 6 classes. `heightScale` is NOT baked: it is the root object scale, drawn from 0.94 to 1.06 per NPC, so the bind height 1.75 m times the scale stays in 1.65 to 1.85. PER-NPC RIG: each NPC gets its own bone hierarchy with `SkeletonUtils.clone` of the template root of its class (one bone per joint of `humanoid.js`), and the BufferGeometry is shared by reference. Material: one `MeshStandardMaterial` with `vertexColors`, shared by all NPCs; the mesh has at most 3500 triangles.
- `src/entity/avatar/clipsExtra.js`: `buildExtraClips(joints)` returns `work` (a 2.4 s loop: right forearm and hand move small circles as if writing or typing, head nods slightly) and `hammer` (1.2 s: right arm raise and strike), and `stand-talk` (3 s idle with small gestures but NO speech). Do not edit `clips.js`. Loop modes: `work`, `hammer` and `stand-talk` are LoopRepeat; the existing `sit` clip from `clips.js` (plan 008) is played by Npc as LoopOnce with `clampWhenFinished = true`, which Npc sets at play time, the clip itself is not edited. Clip names are the strings used in the NPC definitions of plan 059 (`walk|sit|work|hammer|stand-talk`).
- Tests: bone names equal the joint-name keys of `humanoid.js`; exactly one `SkinnedMesh` and one geometry per seed class; triangles at most 3500; bind pose height 1.65 to 1.85 for scales 0.94 and 1.06; every clip returned by `buildClips` plus the three new clips binds to the bones and rotates the right bone at t = 0.5 s (mixer test; the sit clip checked with clampWhenFinished); seeds in different classes (seed % 6 differs) have different vertex colours, seeds in the same class share one geometry; memory: building 50 NPCs creates at most 6 geometry buffers and one material; skinIndex and skinWeight are 1.0 for each vertex of its part.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/npc/skinned.test.js`
- `node "{{runner}}/assert.mjs" exists src/entity/avatar/skinnedHumanoid.js src/entity/avatar/clipsExtra.js`

### Step 2: NPC state machine and movement

Deliver:
- `tests/unit/npc/npc.test.js` first. `src/world/npc/npc.js`: `class Npc` with `constructor(def, ctx)` where `def` is the plan 059 definition shape (`id`, `area`, `kind`, `role`, `clip`, `seed`, `tierRank`, `night`, `look`, and one of `route` | `loop` | `seat` | `spot`) and `ctx = { world (the collision world, for moveCircle and blockedAt), findPath (the walk-graph search), walkGraph, rng (seed to rng of src/util/rng.js), getPlayer (returns { x, y, z }), heightField (terrainHeight), quality }`. The Npc OWNS its mesh (a SkinnedMesh from the seed class, see step 1), its mixer and its clip actions; the NpcManager owns the list only. Constants live in `src/config.js` under these keys: `NPC_HIDE_DISTANCE` 90, `NPC_HIDE_DISTANCE_LOW` 60, `NPC_MIXER_DISTANCE` 40, `NPC_CAP_BASE` 80 (visible cap is `ceil(NPC_CAP_BASE * npcScale)`), `NPC_SPEED_MIN` 1.0, `NPC_SPEED_MAX` 1.4, `NPC_AVOID_RANGE` 1.6, `NPC_AVOID_CONE_DEG` 35, `NPC_AVOID_WAIT_S` 3, `NPC_AVOID_SIDESTEP_M` 0.6. States `idle`, `walking`, `waiting`, `sitting`, `working` (the Npc maps `kind` and `clip` to these; `talk` is a no-op, see the hook note below). Routes: `{ type: "path", points: [[x, z], ...], loop: true|false, dwellMs: [min, max] }` (outdoor, each leg uses `findPath` from the walk graph, cached per leg) and `{ type: "loop", waypoints: [[x, z], ...] }` (indoor, straight legs, the NPC y stays constant: the loop is validated at construction; it is rejected when the ground height (`heightField`) differs by more than 0.1 m between consecutive waypoints, or when any sample along a leg at 0.25 m spacing lies in a collider whose id starts with `stair:` or `lift:` (the collision world ids; a sample on the ground height of a stair or lift footprint also counts). Outdoor legs: `findPath(from, to)` with the walk-graph cell size and NPC radius 0.3 m, bounded by the graph bounds, maxStates 400000; a null result (or a thrown error) drops that leg and the NPC takes the next leg; results are cached per leg with the key `${from}|${to}`). Blocked NPC: when `moveCircle` stops it, it retries the same waypoint for 2 s, then picks the next waypoint of the same leg; after 3 consecutive blocks it moves to the next leg.; `sitter` goes to its `seat` record `{ x, y, z, yaw }` in world coordinates (from the placed seat props, plans 019 and 021, their world position; the seat origin is the seat surface and the sitting hips sit about 0.5 m above it, the convention of plan 008). Entering a seat: the NPC walks the last 1.5 m without moveCircle (the chair collider is solid, so the entry bypasses collision by design), lerps to the seat over 1 s, plays `sit` (LoopOnce with clampWhenFinished, see step 1), stays seated 20 to 60 s, then walks a short loop and returns to the seat. Seat records are never player interactables (the player sit interaction is not used by NPCs). `worker` stands at its `spot` record and plays `work` (2.4 s loop) or `hammer` (1.2 s loop) clips.
- Movement: speed 1.0 to 1.4 m/s with the `walk` clip speed matched (time scale = speed / 1.2), turning smoothed, movement through `world.moveCircle` with radius 0.3 so walls and closed doors always stop an NPC (a blocked NPC waits 2 s, then picks the next waypoint); NPCs do not collide with each other (soft separation of 0.5 m by steering); avoidance of the player: "in front" means the player is within 1.6 m and within 35 degrees of the NPC heading; then the NPC waits up to 3 s, and if the player is still in front after the wait it steps aside 0.6 m to the right (perpendicular to its heading) and continues; NPCs never open doors by themselves (indoor routes stay inside their room or pass doors that are open or decorative gaps).
- Tests (`tests/unit/npc/npc.test.js`, fake time, real assertions): a loop route stays on the loop within 0.3 m; an indoor loop with a `stair:` collider sample is rejected, and a loop with a 0.15 m height step between waypoints is rejected (both cases tested, the stair case with a fake collision world that has the stair id); a path route follows the walk graph and never crosses a wall box (sample every 1/30 s of fake time in a simulated 120 s run); a leg that findPath cannot solve is skipped, not thrown; a blocked NPC recovers after 2 s on the same waypoint and after 3 blocks moves to the next leg; player avoidance waits then steps aside 0.6 m right then continues; a sitter enters the seat (lerp of 1 s), sits for 20 to 60 s and stands; worker clip names are `work` and `hammer` only; walk speed within 1.0 to 1.4 m/s and the time scale is speed / 1.2; deterministic with the same seed.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/npc/npc.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/npc/npc.js`

### Step 3: NPC manager, LOD and the hook

Deliver:
- `src/world/npc/manager.js`: `class NpcManager` with `add(npc)`, `update(dtMs, playerPos)`, `setTier`, `list()`. NPCs farther than 90 m (60 m on low) from the player are hidden (`visible = false`) and not stepped; when an NPC comes back into range it resumes at the point its route reaches after the elapsed game time: the cycle length is the route length plus the dwell times, and the position is the route point at `elapsed modulo cycle` (a loop or path route; a sitting NPC resumes seated; the position tolerance is 0.3 m, no findPath is run while hidden, the straight segments between the stored route points are used). When more than `ceil(NPC_CAP_BASE * npcScale)` NPCs are in range, the farthest ones are hidden first; `setTier` changes `npcScale` and the hide distance (90 m on high and medium, 60 m on low); animation mixers update only for visible NPCs within 40 m, farther ones freeze on the current pose. Positions are exposed through the hook `listNpcs()` as `[{ id, kind, state, x, y, z, visible }]` and `isBlocked(x, z, y, r)` (collision query, `world.blockedAt` at the height y with the radius r; the NPC height used by callers is 1.7 m). This is the only public hook for this query: plan 068 must not add a second one (its `blockedAt` is dropped). Both hooks are added to `src/dev/worldHook.js` in this plan (ARCH 10.8 additions). The NPC list is held in `game.npcs` (`src/state.js`); the `talk` interactable named in ARCH 10.8 is a deliberate no-op in this plan (decision D23: no conversations, no greetings), and the plan that adds it later owns it.
- `tests/unit/npc/manager.test.js`: far NPCs hidden and not stepped; the visible cap holds; resume point is on the route; tier change rescales the cap; `list()` plain data.
- Temporary fixture `?fixture=npcs` (registered in `src/fixtures/index.js`, a flat floor 40 m by 40 m, a wall 20 m long at z = 0 with a 3 m gap at x = 0, and 6 NPCs of each of the 4 kinds, 24 in total, all with `tierRank` 0 so all are shown). The fixture file is `src/fixtures/npcs.js`; it is temporary and stays in the repo, listed in the fixture registry. `tests/e2e/npc-core.spec.js` (`?fixture=npcs&quality=high`, no freeze, the NPCs move on the game clock): `listNpcs()` has 24 entries; `isBlocked(5, 0, 1.7, 0.25)` is TRUE at a point on the wall at z = 0 (x = 5 is outside the 3 m gap, so this is the assertion that the query works), and `isBlocked(0, 0, 1.7, 0.25)` is false in the gap at x = 0; with `expect.poll` until 20 s of game time have passed, sampling every game second, no NPC position satisfies `isBlocked(x, z, y, 0.25)` except the exempt sitters and workers at their seats; a walker moves at least 10 m in 20 s of game time (polled, not a fixed wait); a sitter becomes `sitting`; the draw calls of the fixture stay under 120 (`rendererInfo().calls`); NPC meshes in the scene are visible (`visible` count above 0) and the animation advances (a bone rotation of one walker changes between two polls); zero console errors. The fixture also checks the tier change (`setTier('low')` halves the visible cap to 40 at ceil(80 * 0.5)) and the mixer LOD (no mixer update beyond 40 m).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/npc/manager.test.js`
- `npx playwright test tests/e2e/npc-core.spec.js`
- `node "{{runner}}/assert.mjs" exists src/world/npc/manager.js src/fixtures/npcs.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run test`
- `npx vitest run tests/unit/npc/skinned.test.js tests/unit/npc/npc.test.js tests/unit/npc/manager.test.js tests/unit/avatar/humanoid.test.js`
- `npx playwright test tests/e2e/npc-core.spec.js`
- `node scripts/check-buildings.mjs --all`

Human check (goes in the report, never blocks): The people are simple figures; judge whether they read as people from a normal distance.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
