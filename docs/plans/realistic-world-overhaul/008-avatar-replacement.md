# Plan 008: Replace Soldier with a code-built casual human avatar (idle, walk, run, sit) and a drop-in GLB path

Epic E1. Estimated turns: 55. Model: opus.

## Goal

Remove the Mixamo Soldier (not CC0) and give the game a casual human avatar with the clips `idle`, `walk`, `run` and `sit`. No CC0 rigged human is reachable unattended (ARCHITECTURE.md 10.1), so the default is a code-built articulated humanoid with procedural clips. If the user places a CC0 GLB at `..\portfolio-asset-cache\manual\avatar\avatar.glb` (with `meta.json`), a build script optimizes and uses it instead. The rest of the game only sees one API: `loadAvatar()`.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.1, 10.5 and decisions D16, D28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/entity/player.js
- src/state.js
- src/systems/controller.js
- scripts/assets/optimizeGlb.mjs
- scripts/lib/cache.mjs
- scripts/lib/ledger.mjs

High-risk assumptions that touch this plan (each has a step that checks it):
- D21/A2 style risk: the look of a code-built person is plain. This plan keeps proportions realistic (1.75 m) and gives NPC variants (plan 059) different clothes, but the person should judge it (human check).

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Humanoid builder and procedural clips (headless, unit tested)

Deliver:
- `tests/unit/avatar/humanoid.test.js` first. `src/entity/avatar/humanoid.js` exports `buildHumanoid({ skin, shirt, trousers, shoes, hair, heightScale = 1 })` returning `{ root, joints, height }`. `joints` is a name -> `Object3D` map for: `hips, spine, chest, neck, head, shoulderL, shoulderR, upperArmL, upperArmR, lowerArmL, lowerArmR, handL, handR, upperLegL, upperLegR, lowerLegL, lowerLegR, footL, footR`. Joint names are unique and used verbatim by the clips. Parts are `CapsuleGeometry`, `SphereGeometry` and `BoxGeometry` meshes with `MeshStandardMaterial` (roughness 0.7 to 0.9, no textures): pelvis, torso with a shirt, neck, head with hair cap and two small dark eyes, upper and lower arms with hands, upper and lower legs with trousers, shoes. Standing height is `1.75 * heightScale` metres (bounding box checked), feet at y = 0, front is +z. `castShadow` true on all meshes.
- `src/entity/avatar/clips.js` exports `buildClips(joints)` returning `{ idle, walk, run, sit }` as `AnimationClip`s using `QuaternionKeyframeTrack` on `<joint>.quaternion` and a `VectorKeyframeTrack` on `hips.position`. Walk: 1.0 s loop, 16 keys, hip swing +-0.5 rad, knees flex only backward (the shin folds behind the thigh, a positive x rotation of the lower leg), arms swing opposite the legs, small torso counter-rotation, vertical bob 0.03 m. Run: 0.7 s loop, hip swing +-0.9 rad, elbows bent 1.4 rad, forward lean 0.15 rad, bob 0.06 m. Idle: 3.2 s loop, chest and shoulders breathe by +-0.01 rad, arms hang slightly forward. Sit: 0.5 s clip that ends in a held seated pose (hips lowered to about 0.5 m above the seat origin, upper legs -1.55 rad about x so the thighs point forward (+z), lower legs +1.5 rad so the shins hang down again, spine leans back 0.05 rad, hands on thighs; with the front at +z a negative x rotation of a hanging leg moves the foot forward), loop off, `clampWhenFinished` is set by the player code.
- Tests: every clip track targets an existing joint; names are exactly `idle walk run sit`; walk duration 1.0 +- 0.01, run 0.7 +- 0.01; sampled with an `AnimationMixer` at t = 0.25 s the right and left upper-leg rotations differ; sit pose lowers `hips.position.y` by at least 0.3 m below idle and the ankles end at least 0.3 m in front (+z) of the hips; walk keeps the knees bending backward only (the lower leg x rotation is never negative); height within 1.70 to 1.80; two humanoids built with different colours do not share material instances.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/avatar/humanoid.test.js`
- `node "{{runner}}/assert.mjs" exists src/entity/avatar/humanoid.js src/entity/avatar/clips.js`

### Step 2: loadAvatar, the optional GLB path, player integration, remove Soldier

Deliver:
- `scripts/assets/buildAvatar.mjs` (`buildAvatar({ root, assetsRoot, ledgerPath, repoRoot, sourceFile })`, `root` is the cache root as in plan 005 and `readManualMeta("avatar", root)` is used): when `<root>/manual/avatar/avatar.glb` and a valid `meta.json` exist, run `optimizeGlb` into `assets/models/avatar.glb`, require animations whose names contain `idle`, `walk` and `run` (add the `sit` clip from the procedural clip names mapping when missing: record `sit: "procedural"`), `addEntry` for the file from `meta.json` with notes starting `manual-drop-in` (so any https source host is accepted by the ledger rules), and write `src/entity/avatar/avatarSource.json` = `{ "source": "glb", "file": "models/avatar.glb", "clipMap": { "idle": "<name>", ... } }`. When no manual file exists write `{ "source": "procedural" }` and exit 0. Run it now (expected: procedural).
- `tests/unit/scripts/buildAvatar.test.js`: with a generated fixture GLB (gltf-transform: a bone chain plus animations `Idle`, `Walk`, `Run`) in a temp manual folder, the function writes the source JSON with `source: glb` and the clip map and adds a ledger entry; with an empty folder it writes `procedural`; with a `meta.json` whose licence is not CC0 it throws and writes nothing (no file, no ledger entry, no source json change); a GLB larger than 6 MB is also refused.
- `src/entity/avatar/loadAvatar.js`: `async loadAvatar({ variant } = {})` where `variant` is `{ skin, shirt, trousers, shoes, hair, heightScale }` (defaults for the player: shirt `#2f6fb0`, trousers `#2b2f3a`, skin `#c68642`, hair `#1b1b1b`, shoes `#222222`, heightScale 1) returns `{ root, mixer, actions: { idle, walk, run, sit }, clips, source, headJoint }`. Procedural: `buildHumanoid` plus `buildClips` plus an `AnimationMixer`. GLB: `GLTFLoader` with `MeshoptDecoder` from `three/addons/libs/meshopt_decoder.module.js`, mapping clip names through `clipMap`. Same shape either way. GLB details: the model is scaled so its bounding box is 1.75 m high with feet at y 0 and turned so its forward axis (`meta.json.forwardAxis`, default `+z`) is +z; `headJoint` is the first bone whose name matches /head/i and not /top|end/i; the `sit` action of a GLB without a `sit` clip is a fallback that plays `idle` and lowers the model root by 0.35 m (stated in `source` details), so sitting still works; `actions.sit` always exists.
- Rewrite `src/entity/player.js` to use `loadAvatar()`: crossfade idle/walk/run as v1 did (0.35 s); keep the head look-at toward the nearest zone using `headJoint`, applied AFTER the mixer update each frame so animation tracks never fight it; expose `playAvatarAnim(name)` (sets `game.player.animOverride = name` and plays that action once, clamped; while an override is set `animatePlayer` does not crossfade to the base actions), `clearAvatarAnim()` (removes the override and crossfades back to idle) and `getAvatarState()` (`{ current, clips: [...], hipsY }`); `game.player.avatar = { actions, clips, getState }` so the dev hook can reach it. The player root keeps `game.player.*` fields as in v1. Default player look: see `loadAvatar`.
- Delete `assets/models/Soldier.glb`. `tests/unit/avatar/noSoldier.test.js` asserts no file under `src/` mentions `Soldier` or `Xbot` and that no `.glb` named Soldier or Xbot exists in `assets/`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/buildAvatar.test.js tests/unit/avatar/noSoldier.test.js`
- `node "{{runner}}/assert.mjs" exists src/entity/avatar/loadAvatar.js src/entity/avatar/avatarSource.json`
- `node "{{runner}}/assert.mjs" has src/entity/avatar/avatarSource.json "procedural"`
- `node -e "const fs=require('fs');process.exit(['assets/models/Soldier.glb'].some(p=>fs.existsSync(p))?1:0)"`

### Step 3: Hook fields and Playwright: four clips exist and play

Deliver:
- Extend `src/dev/worldHook.js`: `avatarClips()` returns the clip names of the player avatar; `playerAnim()` returns the name of the action with the highest weight (not the requested name); `avatarPose()` returns `{ hipsY }`; `setPlayerAnim(name)` calls `playAvatarAnim` (and `clearAvatarAnim()` for `idle`, `walk`, `run` after `setPlayerAnim`) for tests. The hook reads `game.player.avatar`.
- `tests/e2e/avatar.spec.js`: start with `teleport(0, 20, undefined, 0)`; `avatarClips()` equals `['idle','run','sit','walk']` when sorted; walking with `w` makes `playerAnim()` become `walk` (poll up to 4 s), with Shift `run`, after releasing the keys `idle`; record `avatarPose().hipsY` when idle, then `setPlayerAnim('sit')`: `playerAnim()` becomes `sit` (poll up to 4 s) and `hipsY` is at least 0.3 m lower than the idle value, and `setPlayerAnim('idle')` brings it back. Also assert zero console errors.
- Visual self-review (best effort, never fails): run `npm run shots` if it exists (it arrives in plan 014; otherwise skip and say so) and note how the avatar looks.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/avatar.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/avatar/humanoid.test.js tests/unit/scripts/buildAvatar.test.js tests/unit/avatar/noSoldier.test.js`
- `npm test`
- `npx playwright test tests/e2e/avatar.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

Human check (goes in the report, never blocks): Judge the avatar look. To use a nicer CC0 person: download Quaternius "Universal Base Characters" (CC0) from itch.io yourself, save the GLB as `..\portfolio-asset-cache\manual\avatar\avatar.glb` with a `meta.json` ({"sourceUrl": "...", "author": "Quaternius", "licence": "CC0"}), then run `node scripts/assets/buildAvatar.mjs` and the tests.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
