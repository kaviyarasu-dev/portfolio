# Plan 017: Interaction registry, event bus, read objects and hinged doors

Epic E2. Estimated turns: 50.

## Goal

The generic way to act on the world with `E`: an interaction registry (nearest usable object in front of the player, one prompt), a tiny event bus for sound and effect hooks, `read` objects that open the resume dialogue panel (A5), and animated hinged doors with colliders, locking and the edge cases a real door has. the v1 dialogue behaviour (press `E` within the zone radius) keeps working for zones not yet converted (ARCHITECTURE.md 10.7).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4 and 10.5, requirement R5, decisions D19, assumptions A5)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/interaction.js
- src/ui/hud.js
- src/world/zones.js
- src/world/buildingAnims.js
- src/systems/input.js
- src/systems/collision/world.js
- src/dev/worldHook.js
- src/dev/fixtures/index.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Event bus and interaction registry

Deliver:
- `tests/unit/interaction/registry.test.js` first. `src/systems/events.js`: `on(name, fn)` (returns unsubscribe), `off`, `emit(name, payload)`, `once`; a handler that throws is caught with `console.warn` and does not stop the others.
- `src/systems/interaction/registry.js` exports `class InteractionRegistry`: `register({ id, kind, x, y, z, radius = 1.6, prompt, enabled = () => true, onUse, facing })` (`kind` is one of `read|sit|switch|door|elevator|talk`; `prompt` is a string or a function returning one; duplicate id throws), `unregister(id)`, `unregisterByPrefix(prefix)`, `find(playerPos, playerYaw)` returning the best candidate: enabled, within `radius` (3D distance, with the vertical difference at most 1.6 m so objects on another floor are ignored), and among those the one with the best score = distance, minus a bonus when it lies within 60 degrees of the player facing; `use(playerPos, playerYaw)` calls `onUse` of the found object and emits `interact:<kind>`; `list()` returns plain data.
- Tests: nearest wins; the one in front beats a slightly nearer one behind; disabled and out-of-radius are skipped; other floor (dy 3 m) is skipped; dynamic prompt; duplicate id throws; unregisterByPrefix; events handler isolation.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/registry.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/events.js src/systems/interaction/registry.js`

### Step 2: Hinged doors

Deliver:
- `tests/unit/interaction/doors.test.js` first. `src/systems/interaction/doors.js` exports `createDoor({ id, hinge: { x, y, z }, yaw, width, height = 2.2, openAngle = 1.75, locked = false, decorative = false, leaf, world, registry, events })` returning a `Door` with `use(player)`, `update(dtMs, playerPos)`, `state` (`closed|opening|open|closing`), `progress` (0..1), `lock()`, `unlock()`, `dispose()`. `leaf` is the pivot `Object3D` that rotates about y at the hinge; the door adds a closed-leaf collider box `door:<id>` to `world` and an interactable `door:<id>` (prompt "open door" / "close door" / "locked") to `registry` unless `decorative`.
- Behaviour: opening takes 600 ms with ease-in-out; the swing direction is away from the side the player is on; the collider is enabled while `progress < 0.35`, disabled after; `use` while opening reverses the motion smoothly; closing is refused (stays open) while the player is within 0.9 m of the door line or in the doorway (`update` receives the player position), with a toast "something is in the way" (emit `door:blocked`); a locked door does not move, emits `door:locked` and shows the toast "locked"; `decorative` doors never register an interactable and keep their collider; events `door:open`, `door:close` (with the door id) are emitted when the motion starts.
- Tests with fake time: durations, easing monotonic, collider toggling, reversal mid-swing, refusing to close on the player, locked, unlock, decorative, dispose removes collider and interactable, swing direction by player side.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/doors.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/interaction/doors.js`

### Step 3: Read objects and wiring into the game loop and the old interaction code

Deliver:
- `src/systems/interaction/read.js`: `registerReadObject({ id, zoneId, key, x, y, z, radius, prompt })` registers a `read` interactable whose `onUse` calls `openDialogue(zoneId, key)` from `src/ui/hud.js` (extend `openDialogue(zoneId, key = 'main')`; v1 `DIALOGUES[zoneId]` stays the default builder so existing content is unchanged).
- `src/world/zones.js`: every zone entry gets `mode: 'radius'` (v1 behaviour). `src/systems/interaction.js` keeps the v1 logic (nearest zone within its radius, `E` opens or closes the dialogue, walking away closes it) for zones with `mode: 'radius'` and skips `mode: 'object'` zones. The `E` key first asks the registry (`game.interaction.use(...)`); only when it finds nothing does the v1 logic run. The prompt shows the registry prompt (with the `E` key cap) when a candidate exists.
- Each frame `gameloop.js` calls `game.interaction.update` (prompt) and every door `update(dt, playerPos)`; a `game.doors` list keeps them. Hook: `listDoors()` returns `[{ id, state, open, locked, x, z }]`, `listInteractables()`, `useNearest()`; `teleport(x, z, y, yaw)` accepts a yaw that sets player facing and camera yaw.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/systems/interaction/read.js "openDialogue"`
- `node "{{runner}}/assert.mjs" has src/world/zones.js "mode: 'radius'"`
- `npm run lint`

### Step 4: Interactions fixture and Playwright door tests

Deliver:
- `src/dev/fixtures/interactions.js`: a flat floor with a closed room 8 m wide and 6 m deep whose south wall has a doorway of 1.1 m with a working door (hinge on the left), a second locked door in the east wall, and a read desk inside at the north wall (`registerReadObject` with zone `plaza`). Other plans extend this fixture with a switch, seats and a lift; keep its builder as a list of small functions so they can add parts.
- `tests/e2e/doors.spec.js`: `?fixture=interactions`; teleport 1.3 m south of the door facing it; press `e`; after 900 ms `listDoors()[0].state` is `open`; hold `w` for 1.2 s and `playerState().z` is beyond the wall line; face back and press `e` from inside to close it after stepping out of the doorway; the locked door stays `closed`, `locked` true, and shows the toast; at the desk `e` makes `#dialogue` visible; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/doors.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/interactions.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/interaction/registry.test.js tests/unit/interaction/doors.test.js`
- `npx playwright test tests/e2e/doors.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
