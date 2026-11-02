# Plan 017: Interaction registry, event bus, read objects and hinged doors

Epic E2. Estimated turns: 60.

## Goal

The generic way to act on the world with `E`: an interaction registry (nearest usable object in front of the player, one prompt), a tiny event bus for sound, toast and effect hooks, `read` objects that open the resume dialogue panel (A5), and animated hinged doors with colliders, locking and the edge cases a real door has. The v1 dialogue behaviour (press `E` within the zone radius) keeps working for zones not yet converted (ARCHITECTURE.md 10.7).

Contracts this plan fixes for plans 018, 021, 022, 026, 027 and later (put them in `docs/world-conventions.md` under "Interaction"): `game.interaction` is the one `InteractionRegistry`, created in `src/main.js` (controls step); events are the module functions of `src/systems/events.js`; headless modules never touch the DOM, so they emit `toast` with `{ text }` and `main.js` shows it; `game.doors` is an array of `Door` objects that the game loop updates; the interaction kinds are `read|sit|switch|door|elevator|talk` (`talk` is added by ARCHITECTURE.md 10.8: the registry and the manifest schema accept it; nothing implements it before the NPC plans).

Conventions (ARCHITECTURE.md 10.8): yaw 0 looks toward -z, look direction `(-sin yaw, -cos yaw)`; object rotation (`yaw` of a door, `rot`) is Three.js `rotation.y`: rotation `r` maps local +x to `(cos r, -sin r)` in (x, z) and local +z (the front) to `(sin r, cos r)`.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 4, 10.5, 10.7, 10.8, requirement R5, decisions D19, assumptions A5)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/interaction.js
- src/ui/hud.js
- src/content/dialogues.js
- src/world/zones.js
- src/world/buildings.js
- src/world/buildingAnims.js
- src/systems/input.js
- src/systems/gameloop.js
- src/main.js
- src/state.js
- src/systems/collision/world.js
- src/dev/worldHook.js
- src/dev/fixtures/index.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Event bus and interaction registry

Deliver:
- `tests/unit/interaction/registry.test.js` first. `src/systems/events.js` (module singleton, headless): `on(name, fn)` returns an unsubscribe function, `off(name, fn)`, `emit(name, payload)`, `once(name, fn)`, and `clearAllListeners()` (tests only). A handler that throws is caught with `console.warn` and does not stop the others or the emitter. Event names used by this and later plans (payloads are plain objects): `toast` `{ text }`; `door:open`, `door:close`, `door:blocked`, `door:locked` `{ id }`; `interact:<kind>` `{ id, kind }`; later plans add `sfx:*` events with `{ id }`.
- `src/systems/interaction/registry.js` exports `class InteractionRegistry` (constructor option `{ events }`, default the events module; any object with `emit(name, payload)` works for tests). `register({ id, kind, x, y, z, radius = 1.6, prompt, enabled = () => true, onUse })`: `kind` is one of `read|sit|switch|door|elevator|talk` (anything else throws), `prompt` is a string or a function returning one, a duplicate id throws, `x, y, z` are the world position of the object (y about 1.0 for things you reach with a hand), `onUse(ctx)` receives `{ id, kind, player }`. Also `unregister(id)`, `unregisterByPrefix(prefix)`, `has(id)` and `move(id, { x, y, z })` (changes the stored position of an entry; used by the lift cabin buttons of plan 018, unknown id throws).
- `find(player, yaw)`, `use(player, yaw)`, `update(dt, player, yaw)`: `player` is anything with `position: { x, y, z }` (the `game.player` object works; `position.y` is the feet height) and `yaw` is the camera yaw. A candidate must be enabled and have `distance <= radius`, where `distance = hypot(dx, dy, dz)` with `dy = object.y - (player.y + 1.0)` (chest height as the reference, so a handle at y 1.0 counts as zero vertical distance) and the candidate must also satisfy `abs(dy) <= 1.6`, so objects on another floor (3.4 m up or down) are ignored. Score = `distance`, multiplied by 0.7 (a 30 percent bonus) when the horizontal direction to the object is within 60 degrees of the look direction `(-sin yaw, -cos yaw)` (an object at the exact player position counts as in front); the lowest score wins, ties broken by id. `find` returns the registry entry or null; `use` calls the best candidate `onUse`, emits `interact:<kind>` `{ id, kind }` and returns true, or returns false when nothing is in reach (the caller then falls back to the v1 zone logic); `update` stores the result in `this.current` (and returns it) so the HUD can show `resolvedPrompt`; `list()` returns plain data `[{ id, kind, prompt, x, y, z }]` with the prompt resolved to text.
- Tests: nearest wins; the one in front beats a slightly nearer one behind (and not a much nearer one: 0.7 factor); disabled and out-of-radius skipped; the other floor (object 3 m above) skipped, an object at y 1.0 with the player at y 0 found at horizontal distance 1.5; dynamic prompt function; duplicate id and bad kind throw; `unregisterByPrefix`; `use` returns false with nothing in reach and true otherwise and emits `interact:read` with the payload; events handler isolation, `once`, unsubscribe; `list()` shape.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/registry.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/events.js src/systems/interaction/registry.js`

### Step 2: Hinged doors

Deliver:
- `tests/unit/interaction/doors.test.js` first. `src/systems/interaction/doors.js` exports `createDoor({ id, hinge: { x, y, z }, yaw, width, height = 2.2, openAngle = 1.75, locked = false, decorative = false, leaf, world, registry, events, list })` returning a `Door`. `leaf` is the pivot `Object3D` (or any object with a `rotation.y` field in tests) at the hinge; `list` is an optional array (the caller passes `game.doors`): the door pushes itself in and `dispose()` removes it. `events` is any object with `emit` (default the events module).
- Geometry (all in the rotation convention above): `yaw` is the object rotation of the wall plane, local +z is the side the `from` room (the approaching player) is on, and the closed leaf extends along local +x from the hinge, so the closed leaf runs from the hinge to `hinge + width * (cos yaw, -sin yaw)` and its centre is `hinge + (width / 2) * (cos yaw, -sin yaw)`. A hinge on the left as seen by a player standing on the +z side looking toward -z is therefore the local -x end of the opening. Collider: box id `door:<id>`, centre = leaf centre, `hx = width / 2`, `hz = 0.06` (thickness 0.12 m), `rot = yaw`, `yMin = hinge.y`, `yMax = hinge.y + height`. Interactable (unless `decorative`): id `door:<id>`, kind `door`, position = leaf centre at y `hinge.y + 1.0`, prompt a function returning "open door" (closed), "close door" (open or opening), "locked" (locked and closed). Callers pass ids that are already unique (plan 021 passes `<building>:<doorId>`); the door never prefixes them.
- Motion: a linear time value `t` 0..1 changes by `dtMs / 600`; `progress = smoothstep(t)` (ease in and out) is public; `state` is `closed` (t 0), `opening`, `open` (t 1), `closing`. The leaf angle is `leaf.rotation.y = yaw + side * openAngle * progress` where `side` is +1 when the door was opened from the +z side (a positive `rotation.y` swings the leaf toward -z, away from that player) and -1 from the -z side; `side` is chosen when a door leaves `closed` (from the sign of `dot(player - leafCentre, (sin yaw, cos yaw))`) and kept until it is closed again; a closed leaf has `rotation.y = yaw`. The collider is enabled while `progress < 0.35` (both directions), disabled otherwise. `use(player)` (player = `{ position: { x, y, z } }`): closed -> opening; open -> closing; opening or closing -> reverses from the current `t` (so `progress` stays continuous). Events `door:open` or `door:close` `{ id }` are emitted whenever the motion starts or reverses.
- Edge cases: "the door line" means the player is within 0.9 m of the wall plane and within `width / 2 + 0.3` of the door centre along the wall (local coordinates relative to the leaf centre: `abs(lz) < 0.9 && abs(lx) < width / 2 + 0.3`). Any change toward closing (closing from open, or reversing from opening) is refused while the player is in the door line: the door stays as it is, emits `door:blocked` `{ id }` and `toast` `{ text: "SOMETHING IS IN THE WAY" }`. `update(dtMs, playerPos)` advances the motion and, when the door is `closing` and the player (position `{ x, y, z }`) steps into the door line, reverses it to `opening` and emits the same blocked event and toast (so the collider can never re-enable on top of the player). A locked closed door does not move, emits `door:locked` `{ id }` and `toast` `{ text: "LOCKED" }`. `lock()` on an open or moving door only sets the flag: it stays open and `use` can still close it, after which it stays shut; `unlock()` clears it. `decorative` doors never register an interactable, keep the closed collider enabled forever and ignore `use`. `dispose()` removes the collider, the interactable and the list entry (idempotent). `toData()` returns `{ id, state, open, locked, x, z }` with `open = state === "open"` and x, z the leaf centre (the hook `listDoors()` maps `game.doors` through it).
- Tests with fake time: 600 ms duration, `progress` monotonic and continuous, collider off at progress 0.35 and on again when closing passes it, reversal mid-swing keeps `progress` within 0.05 of the previous step, refusing to close with the player in the door line (event, toast and state unchanged), auto-reversal when the player walks into the doorway while closing, locked (events and toast, no motion), lock on an open door (stays open, `use` closes, then locked), unlock, decorative, dispose removes collider, interactable and list entry, swing direction by player side (leaf angle `yaw + openAngle` from +z, `yaw - openAngle` from -z), leaf centre and collider position for yaw 0 and yaw PI/2 and yaw PI (hinge (0.55, 0, -5), width 1.1, yaw PI puts the collider centre at x 0), `toData()` fields.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/interaction/doors.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/interaction/doors.js`

### Step 3: Read objects and wiring into the game loop, the HUD and the old interaction code

Deliver:
- `src/content/dialogues.js`: export `resolveDialogue(zoneId, key = "main", table = DIALOGUES)` returning the builder function or null. A `DIALOGUES[zoneId]` entry may be a builder function (the v1 shape: the `key` is ignored) or a map `{ main: builder, <key>: builder }`; an unknown key falls back to `main`; an unknown zone returns null. `tests/unit/content/resolveDialogue.test.js` first covers all four cases with a small table (headless: dialogues.js only builds DOM inside the builders).
- `src/ui/hud.js`: `openDialogue(zoneId, key = "main")` uses `resolveDialogue`; v1 callers `openDialogue(z.id)` are unchanged. `src/systems/interaction/read.js` stays headless (it must not import `src/ui/hud.js`, which pulls in audio): it exports `setReadHandlers({ open, close })` (called once from `main.js` with `openDialogue` and `closeDialogue`; unset handlers only `console.warn`), and `registerReadObject({ id, zoneId, key = "main", x, y = 1.0, z, radius = 1.6, prompt = "read", registry = game.interaction })` which registers a `read` interactable whose `onUse` calls `open(zoneId, key)` and remembers `game.activeRead = { id, x, z }`; using it again while that dialogue is open calls `close()` and clears `activeRead`. `closeReadDialogue()` (same file) closes it too; it is called by `Esc` (new `Input.escapeCallback`, see below) and by `updateInteraction` when the player is more than 3 m (horizontal) from `activeRead`. A read dialogue never sets `game.activeZone`.
- `src/main.js` (controls step): create `game.interaction = new InteractionRegistry()` and `game.doors = []` (add `interaction: null` and `doors: []` to `src/state.js`) subscribe the toast: `on("toast", (t) => showToast(t.text))` and call `setReadHandlers({ open: openDialogue, close: closeDialogue })`. `src/systems/input.js`: the `e` keydown handler ignores `e.repeat` (holding E must not toggle repeatedly) and `escape` also calls `Input.escapeCallback` when set (`interaction.js` sets it to `closeReadDialogue`).
- `src/world/zones.js`: every one of the 14 `ZONE_LAYOUT` entries gets `mode: "radius"` (the v1 behaviour, ARCHITECTURE.md 10.7). `src/world/buildings.js` `placeBuildings()` rebuilds `game.zones` entry by entry: copy `mode: zone.mode` into each placed entry (it currently copies only id, name, x, z, r, group, prompt).
- `src/systems/interaction.js`: `tryAction()` first calls `game.interaction.use(game.player, game.camRig.yaw)` and returns when it handled the press; only when it returns false does the v1 logic run (notice-board download, dialogue toggle). `updateInteraction(dt)` is restructured (no early return when `game.zones` is empty, because fixtures have no zones): (1) `game.interaction.update(dt, game.player, game.camRig.yaw)`; (2) the nearest zone is computed over zones whose `mode` is not `object` (`game.nearestZone` is null for object zones); (3) prompt: when the registry has a current candidate show its resolved prompt with `showPrompt`, else when a zone is nearest show the v1 prompt (same rule as v1: not while its dialogue is open), else `hidePrompt()`; the v1 zone label and the 350 ms walk-away close stay for radius zones; (4) the 3 m read-dialogue distance check. Each frame `src/systems/gameloop.js` also runs `for (const d of game.doors) d.update(dt, game.player.position)` (dt is milliseconds, as everywhere in the loop).
- Hook (`src/dev/worldHook.js`, extend only): `listDoors()` returns `game.doors.map(d => d.toData())`, `listInteractables()` returns `game.interaction.list()`, `useNearest()` returns the boolean of `game.interaction.use(game.player, game.camRig.yaw)`. (`teleport` already accepts a yaw since plan 003.) Add the contract text from the goal to `docs/world-conventions.md`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/resolveDialogue.test.js`
- `node "{{runner}}/assert.mjs" has src/systems/interaction/read.js "setReadHandlers"`
- `node "{{runner}}/assert.mjs" has src/main.js "setReadHandlers[(]"`
- `node "{{runner}}/assert.mjs" count src/world/zones.js "mode: 'radius'" 14`
- `node "{{runner}}/assert.mjs" has src/world/buildings.js "mode: zone[.]mode"`
- `node "{{runner}}/assert.mjs" has src/main.js "new InteractionRegistry[(]"`
- `node "{{runner}}/assert.mjs" has src/systems/interaction.js "interaction[.]use[(]"`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npm run lint`

### Step 4: Interactions fixture and Playwright door tests

Deliver:
- `src/dev/fixtures/interactions.js` (register as `interactions`, add the import to `src/dev/fixtures/index.js`). The builder is a list of small part functions so later plans add parts: `export const parts = [partFloor, partRoom, partDoors, partDesk]`; each part is `(f) => void` where `f = { game, THREE, root, world: game.collision, registry: game.interaction, events, updaters: [] }` (`updaters` is an array of `(dtMs) => void` that plan 018 wires into the frame loop), and `build(ctx)` runs all parts in order and returns `{ root, spawn: { x: 0, y: 0, z: -9, yaw: Math.PI } }`. Room layout (world coordinates, metres): a flat 60 m square floor (no collider needed, terrain height is 0); a room with interior x -6..6 and z -5..5 (a 12 by 10 m floor centred on the origin), walls 0.3 m thick centred on those edges and 3.0 m high (`addBox`, ids `fixture:wall-<n>`, yMin 0, yMax 3.0, plus matching box meshes). North wall (z = -5): a 1.1 m doorway centred at x 0 (wall boxes x -6.15..-0.55 and 0.55..6.15, a lintel box x -0.55..0.55 with yMin 2.2). East wall (x = 6): a 1.1 m doorway centred at z 0 (boxes z -5.15..-0.55 and 0.55..5.15, lintel as above).
- Doors (both through `createDoor`, `list: game.doors`, leaf = a pivot `Group` holding a 1.1 by 2.2 by 0.08 m box mesh offset +0.55 in local x, `woodDark` colour): `fixture-north` with `hinge (0.55, 0, -5)` and `yaw Math.PI` (local +z faces north, the outside, so the hinge is on the left as seen from outside) and `fixture-east` with `hinge (6, 0, 0.55)`, `yaw Math.PI / 2`, `locked: true`. Desk: a box mesh 1.6 by 0.8 m, top at 0.75 m, centred (0, 0, 4.4), and `registerReadObject({ id: "desk-intro", zoneId: "plaza", key: "main", x: 0, y: 1.0, z: 3.7, prompt: "read intro" })`. Keep the part functions exported by name so plans 018 and 021 extend `parts` without rewriting.
- `tests/e2e/doors.spec.js` (URLs end in `&time=0.5&freeze=1`; every wait is `expect.poll(..., { timeout: 15000 })`, never a fixed sleep). Test 1, `?fixture=interactions`: teleport to (0, 0, -6.3, yaw PI) (1.3 m outside the north door, looking at it) and press `e`; poll until `listDoors()` entry `fixture-north` has state `open`; hold `w` until `playerState().z` is greater than -4.2 (inside the room) and release; teleport to (0, 0, -3.5, yaw 0) (inside, 1.5 m from the wall plane, outside the 0.9 m door line, looking north at the open door), press `e` and poll for state `closed`; then teleport to (0, 0, -4.4, yaw 0) (0.6 m from the wall plane, inside the door line), press `e` to open it (poll for `open`), press `e` again: the state stays `open` and `#toast` has the text `SOMETHING IS IN THE WAY`. Test 2: teleport to (7.3, 0, 0, yaw PI/2) (outside the east door), press `e`: `fixture-east` stays `closed` with `locked` true and `#toast` has the text `LOCKED`. Test 3: teleport to (0, 0, 2.6, yaw PI) and press `e`: `#dialogue` has the class `visible`; press `e` again and poll until it is gone; open it again and press `Escape`: gone. Test 4 (registry first, then the v1 fallback): `?fixture=interactions`: `useNearest()` is false at (0, 0, -9); next to the desk it is true. Test 5, plain `/?time=0.5&freeze=1` (no fixture, the registry is empty): `teleport("plaza")` then press `e`: `#dialogue` is visible (v1 radius behaviour); `e` again closes it. Zero console errors in every test.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/doors.spec.js`
- `node "{{runner}}/assert.mjs" exists src/dev/fixtures/interactions.js`
- `node "{{runner}}/assert.mjs" has src/dev/fixtures/index.js "interactions"`
- `npm run lint`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/interaction/registry.test.js tests/unit/interaction/doors.test.js tests/unit/content/resolveDialogue.test.js`
- `npx playwright test tests/e2e/doors.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
