# Plan 058: NPC core: cheap skinned people, routines, path following and player avoidance

Epic E5. Estimated turns: 55.

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

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Skinned humanoid with vertex colours and extra clips

Deliver:
- `tests/unit/npc/skinned.test.js` first. `src/entity/avatar/skinnedHumanoid.js`: `buildSkinnedHumanoid({ skin, shirt, trousers, shoes, hair, heightScale, seed })` builds the same body parts as `buildHumanoid`, merges all part geometries into one `BufferGeometry` with a `color` vertex attribute (skin, shirt, trousers, shoes, hair), `skinIndex` and `skinWeight` (each part rigidly weighted 1.0 to the bone of its joint), and returns `{ root, mesh (SkinnedMesh), bones: { <jointName>: Bone }, height }` with bone names exactly the joint names of the existing humanoid and the same rest pose, so `buildClips(bones)` from plan 008 works unchanged. Material: one `MeshStandardMaterial` with `vertexColors`, shared by all NPCs; the mesh has at most 3500 triangles.
- `src/entity/avatar/clipsExtra.js`: `buildExtraClips(joints)` returns `work` (a 2.4 s loop: right forearm and hand move small circles as if writing or typing, head nods slightly) and `hammer` (1.2 s: right arm raise and strike), and `stand-talk` (3 s idle with small gestures but NO speech). Do not edit `clips.js`.
- Tests: bone names equal the joint names list; exactly one `SkinnedMesh` and one geometry; triangles at most 3500; bind pose height 1.65 to 1.85 with `heightScale`; the existing four clips and the new three bind to the bones and rotate the right bone at t = 0.5 s (mixer test); two NPCs with different seeds have different vertex colours; memory: building 50 NPCs shares one geometry buffer per seed class (at most 6 geometry variants) and one material.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/npc/skinned.test.js`
- `node "{{runner}}/assert.mjs" exists src/entity/avatar/skinnedHumanoid.js src/entity/avatar/clipsExtra.js`

### Step 2: NPC state machine and movement

Deliver:
- `tests/unit/npc/npc.test.js` first. `src/world/npc/npc.js`: `class Npc` with `id`, `home`, `kind` (`walker|sitter|worker|loop`), `update(dtMs, ctx)`. States `idle`, `walking`, `waiting`, `sitting`, `working`. Routes: `{ type: "path", points: [[x, z], ...], loop: true|false, dwellMs: [min, max] }` (outdoor, each leg uses `findPath` from the walk graph, cached per leg) and `{ type: "loop", waypoints: [[x, z], ...] }` (indoor, straight legs, the NPC y stays constant: a loop whose waypoints differ in ground height by more than 0.1 m is rejected at construction, and a loop never contains a stair or lift cell); `sitter` goes to a seat (`seats` of the placed prop, uses the `sit` clip, stays seated for 20 to 60 s then walks a short loop and returns); `worker` stands at a spot and plays `work` or `hammer` clips.
- Movement: speed 1.0 to 1.4 m/s with the `walk` clip speed matched (time scale = speed / 1.2), turning smoothed, movement through `world.moveCircle` with radius 0.3 so walls and closed doors always stop an NPC (a blocked NPC waits 2 s, then picks the next waypoint); NPCs do not collide with each other (soft separation of 0.5 m by steering); avoidance of the player: when the player is within 1.6 m and in front, the NPC waits (or steps aside 0.6 m to the right) for up to 3 s; NPCs never open doors by themselves (indoor routes stay inside their room or pass doors that are open or decorative gaps).
- Tests: a loop route stays on the loop within 0.3 m; an indoor loop with a stair cell is rejected; a path route follows the walk graph and never crosses a wall box (sample every frame in a simulated 120 s run with fake time); blocked NPC recovers; player avoidance waits then continues; sitter seats and stands; worker clip names; speed within range; deterministic with the same seed.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/npc/npc.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/npc/npc.js`

### Step 3: NPC manager, LOD and the hook

Deliver:
- `src/world/npc/manager.js`: `class NpcManager` with `add(npc)`, `update(dtMs, playerPos)`, `setTier`, `list()`. NPCs farther than 90 m (60 m on low) from the player are hidden (`visible = false`) and not updated except for a cheap time-skip when they come back (they resume at a point along their route computed from elapsed time); at most `ceil(80 * npcScale)` NPCs visible at once; animation mixers update only for visible NPCs within 40 m, farther ones freeze on the current pose. Positions are exposed through the hook `listNpcs()` as `[{ id, kind, state, x, y, z, visible }]` and `isBlocked(x, z, y, r)` (collision query).
- `tests/unit/npc/manager.test.js`: far NPCs hidden and not stepped; the visible cap holds; resume point is on the route; tier change rescales the cap; `list()` plain data.
- Temporary fixture `?fixture=npcs`: a flat floor with 6 NPCs of each kind and a wall with a gap so the avoidance and walls can be seen. `tests/e2e/npc-core.spec.js`: `listNpcs()` has 18 entries; over 20 s of sampling every second no NPC position satisfies `isBlocked(x, z, y, 0.25)` (nobody inside a wall); a walker moves at least 10 m in 20 s; a sitter becomes `sitting`; zero console errors; draw calls of the fixture stay under 120.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/npc/manager.test.js`
- `npx playwright test tests/e2e/npc-core.spec.js`
- `node "{{runner}}/assert.mjs" exists src/world/npc/manager.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/npc/skinned.test.js tests/unit/npc/npc.test.js tests/unit/npc/manager.test.js tests/unit/avatar/humanoid.test.js`
- `npx playwright test tests/e2e/npc-core.spec.js`

Human check (goes in the report, never blocks): The people are simple figures; judge whether they read as people from a normal distance.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
