# Plan 065: Positional ambience through walls and interior acoustics (muffling and room echo)

Epic E6. Estimated turns: 70.

## Goal

Sound that depends on where you are: sea and wind that fade with distance from the shore, gulls and harbour clatter at the harbour, town murmur at the square, forest birds, rain from the weather system, and in each room its own hum (fans, kitchen, server room, cafe, lift). Walls quiet the sounds that cross them. When the player is indoors the outdoor sounds are muffled by a low-pass filter and the room adds a short echo; an open door lets more through. The filter state is reported through the dev hook so a test can prove it. Plan 064 owns the engine, the bank and `engine.getContext()`; this plan owns the loops of this plan, the acoustics model and the ambience mixer.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 (audioState, window.__world), 10.8 and requirement R11, decision D20(b)(c), assumption A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/audio/engine.js (plan 064: getContext(), play, startLoop)
- src/systems/audio/bank.js (plan 064: SOUNDS, LOOPS ids)
- scripts/assets/synthSfx.mjs (plan 007 and 064: renderRecipe, LOOPS table, WAV writer)
- src/world/kit/building.js (plan 021: BuildingInstance with rooms, bounds, objects, insideRoom, lifts, placement transform)
- src/world/layout/town.json (plan 032: areas.harbour, areas.forest, areas.square {cx, cz}, areas.beach)
- src/world/terrain/townHeight.js (plan 033: heightAt, WATER_LEVEL from ARCHITECTURE.md 10.4)
- src/world/weather/index.js (plan 062: weatherState() with a rain field 0 to 1, which plan 062 adds)
- src/systems/audio/rooms.js (plan 064: resolveRoom)
- src/systems/collision/world.js (plan 016: raycast2D)
- src/systems/controller.js (plan 016) and src/dev/worldHook.js (plan 003)
- docs/world-conventions.md (plan 001)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Ambience loops and the pure acoustics model

Deliver:
- New synthesized loops, added to the `LOOPS` table of `scripts/assets/synthSfx.mjs` (created by plan 064; not in `RECIPES`): exactly 12.0 s each, 22050 Hz mono 16-bit, seamless: `amb_town_hum` (distant crowd murmur and a moped), `amb_birds` (random chirps of two species), `amb_gulls`, `amb_harbour` (a slow diesel put-put, water slap, rope creak), `amb_fan` (a steady whir), `amb_kitchen` (sizzle and clatter), `amb_server` (a hum with fan noise), `amb_lift_shaft` (a hollow cable hum), `amb_rain` (dense hiss with drops), `amb_cafe` (soft murmur and cups). Each is rendered with `renderRecipe(name, seed)` (seed = FNV-1a hash of the name, as plan 064). The seam method is the same as plan 064 (last 50 ms equal-power crossfaded into the first 50 ms). Existing `ocean_loop` and `wind_loop` from plan 007 are reused unchanged. Run `node scripts/assets/synthSfx.mjs --all` (it writes the WAVs and ledger entries) and then `npm run check:ledger` and `npm run check:size`. Size: 10 loops x 12 s x 44100 bytes per second = 5.29 MB, under the 6,000,000 byte cap of this plan (the cap is separate from the 3 MB cap of plan 064).
- `tests/unit/audio/ambienceSfx.test.js` (a NEW file, reads `assets/LEDGER.json` and the WAV files): each of the 10 loops exists on disk and has a ledger entry; each is 22050 Hz, mono, 16-bit, and exactly 264600 samples (12.0 s); the seam is closed: `|first - last| < 0.02` (the same rule as `ocean_loop`); the sum of the 10 file sizes is under 6,000,000 bytes; the files are finite and within [-1, 1].
- `tests/unit/audio/acoustics.test.js` first (a NEW file). `src/systems/audio/acoustics.js` is pure (no Howler, no DOM). Constants: `CUTOFF_OUTDOOR = 20000`, `CUTOFF_CLOSED = 1100` (indoors, all doors closed), `CUTOFF_OPEN = 9000` (indoors with the nearest exterior door fully open), `GAIN_INDOOR = 0.35`, `WALL_FACTOR = 0.35` per wall box, `DOOR_CLOSED_FACTOR = 0.7` per closed door, `REF_DIST = 4`, `RAY_Y_MIN = 0.5`, `RAY_Y_MAX = 2.5`, `MAX_RAY_HITS = 8`, `SMOOTH_MS = 250`. Functions: (1) `ambienceGain(emitter, listener, world, doors)`: `emitter = { x, z, radius, gain, id, kind }`, `listener = { x, z, y }`; `d` = distance in 2D; if `d >= radius` the result is 0; otherwise `g = (1 - d / radius)^2 * emitter.gain`; then the wall rule: count the hits along the segment from listener to emitter (see step 2 for the loop), each non-door hit multiplies by `WALL_FACTOR`, each door hit (id starting with `door:`) multiplies by `DOOR_CLOSED_FACTOR` when the door progress is below 0.5 and by 1 when it is 0.5 or more; the result is capped at 1. (2) `acousticsTarget({ insideRoom, room, doorOpenness })` returns `{ outdoorCutoff, outdoorGain, reverbMix, reverbDecay }`. Outdoors (`insideRoom` null): cutoff 20000, gain 1, reverbMix 0, reverbDecay 0.3. Indoors: `room = { id, bounds: { x0, z0, x1, z1 }, floorY, height }`; `volume = (x1 - x0) * (z1 - z0) * height`; `k = clamp(volume / 400, 0, 1)`; `reverbMix = 0.15 + 0.3 * k` (0.15 to 0.45); `reverbDecay = 0.3 + 1.3 * k` (0.3 to 1.6 s); `outdoorCutoff = 1100 + (9000 - 1100) * doorOpenness` where `doorOpenness` is the `progress` (0 to 1) of the nearest exterior door within 4 m of the listener, or 0 when there is none; `outdoorGain = 0.35`. (3) `smooth(current, target, dtMs) = current + (target - current) * (1 - Math.exp(-dtMs / 250))`.
- Tests in `acoustics.test.js`: gain falls with distance and is 0 at and beyond the radius; a point behind two walls gives `0.35 * 0.35` times the open gain; a closed door attenuates more than an open door (0.7 against 1.0); the outdoor target is cutoff 20000 and reverbMix 0; the indoor target with all doors closed has cutoff 1100 (at most 2500); an open door (`doorOpenness` 1) gives cutoff 9000 and a cutoff above the closed one; a larger room gives a longer decay and a higher mix; `smooth` converges to the target and never overshoots (check 200 steps of 100 ms).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/ambienceSfx.test.js tests/unit/audio/acoustics.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/audio/acoustics.js`
- `node "{{runner}}/assert.mjs" has scripts/assets/synthSfx.mjs "LOOPS"`

### Step 2: Ambience mixer with outdoor and indoor buses

Deliver:
- `src/systems/audio/ambience.js`: `class AmbienceMixer` constructed as `new AmbienceMixer({ ctx, world, buildings, doors, weather, heightAt, town, quality })`. Inputs and where they come from: `ctx` = `engine.getContext()` from plan 064 (the Howler audio context, or null; the mixer must tolerate null and still update its state); `world` = the collision world of plan 016 (`raycast2D`, read `src/systems/collision/world.js` for the signature; the rays use the y range `RAY_Y_MIN` to `RAY_Y_MAX`); `buildings` = `game.buildings` (the list of BuildingInstance from plan 021; each has its rooms (read through `resolveRoom` of plan 064, which gives `id`, `bounds`, `floorY`, `height` and `surface` in world coordinates), `objects` with `type`, `x`, `y`, `z`, `lifts` with `x`, `z`, and the placement transform); `doors` = `listDoors()` from plan 017, entries with `id`, `kind` (`exterior` or `interior`), `progress` (0 to 1, smoothstep) and `pos` (`{x, y, z}`; plan 064 step 2 adds these fields to the plan 017 door data); `weather` = `weatherState()` from plan 062 (`rain` 0 to 1; plan 062 adds this field); `heightAt` from plan 033; `town` = the town.json data of plan 032; `quality` = `quality()` of plan 011 (`tier`).
- Buses (Web Audio graph built once in the constructor when `ctx` exists): `outdoorBus` = emitter GainNode, then a `BiquadFilterNode` low-pass (`type` lowpass, `frequency` = the outdoor cutoff), then the outdoor gain, then the master; `indoorBus` = emitter GainNode, then a `ConvolverNode` (`buffer` = the generated impulse response, see below), then a wet gain (`reverbMix`) and a dry gain (`1 - reverbMix`), then the master. A room emitter goes to `indoorBus` when the listener is in that room (same room id) and to `outdoorBus` otherwise. Every emitter loop is an `AudioBufferSourceNode` with `loop = true` (buffer decoded from the bank url with `fetch` and `decodeAudioData`). The impulse response is one noise buffer per decay value, rounded to 0.1 s, cached (at most 14); length = decay, exponential envelope. Convolver created once per mixer; on `quality().tier` `low` the ConvolverNode is not created and `reverbMix` is reported as 0.
- Emitters (data, fixed in this plan; `id`, `kind`, `x`, `z`, `radius`, `gain`). Sea: `id` `sea`, position = the nearest shore point to the listener: sample `heightAt` on a 12 m grid within 150 m of the listener and pick the cell whose height is within 0.3 m of WATER_LEVEL (-1.2 m) with the smallest distance; if there is none, the world edge point at radius 295 m in the direction of the listener from the island centre; `radius` 90, `gain` 0.8. Wind: `id` `wind`, position = listener, global (radius 1e9), gain `(0.1 + 0.3 * clamp((listener.y - WATER_LEVEL) / 20, 0, 1)) * openness`, openness 1 outdoors and 0.35 indoors. Gulls: `id` `gulls`, position = centroid of `areas.harbour` polygon, radius 80, gain 0.4. Harbour: `id` `harbour`, same position, radius 80, gain 0.45. Town hum: `id` `town`, position = `areas.square` `{cx, cz}`, radius 70, gain 0.4. Birds: `id` `birds`, position = nearest point of the `areas.forest` polygon to the listener (clamped to the polygon), radius 60, gain 0.3. Rain: `id` `rain`, position = listener, global, gain `weather.rain * 0.5` outdoors and `weather.rain * 0.15` indoors (read from `weatherState().rain` each tick; no event). Room emitters: found from the BuildingInstance objects and lifts by a type-to-loop table keyed by the prop type (no ARCHITECTURE change): `fan-ceiling` and `fan-pedestal` to `amb_fan` (gain 0.15, radius 6); `stove-gas` and `stove-clay` to `amb_kitchen` (gain 0.25, radius 6); `server-rack` to `amb_server` (gain 0.3, radius 8); each lift in `buildings[].lifts` to `amb_lift_shaft` at the cabin centre (gain 0.25, radius 6, world position from the placement transform); the cafe: the town plot of plan 037 whose archetype is `cafe` (plot centre, `amb_cafe`, gain 0.3, radius 10). The room of an object is the room whose bounds contain its position.
- Every 100 ms of frame time (accumulated from the frame dt that the game loop passes to `mixer.update(dtMs)`, not `setInterval`; the frame dt keeps running under `?freeze=1`, because freeze stops the world clock and not the audio update), the mixer: computes the listener room (`insideRoom` is the room id string, or `<bldId>:<roomId>` when two buildings share a room id, or null outdoors), the nearest exterior door within 4 m (its `progress`, or 0 when none), and `acousticsTarget`; smooths the outdoor cutoff and gain, the reverb mix and the decay with `smooth` (250 ms); computes every emitter gain with `ambienceGain` (rays: from the listener to the emitter, step 2 wall loop); and applies them with `setTargetAtTime` to the nodes. Under `?freeze=1` the world clock stops, but the audio update keeps running on the frame dt, so the mixer state still changes; the acoustics e2e uses no `?time=`. Wall loop: repeated rays from the listener to the emitter (`world.raycast2D` returns only the first hit): each hit is counted, and the next ray restarts 0.05 m beyond the hit point, up to `MAX_RAY_HITS` rays; a hit whose collider id starts with `door:` is a door (the door id is `door:<bldId>:<doorId>`, plan 021; confirm the prefix in plan 021), any other hit is a wall. Nothing throws when `ctx` is null or suspended. `window.__world.audioState()` (in `src/dev/worldHook.js`) returns the plan 064 engine state merged with `filter: { insideRoom, outdoorCutoff, outdoorGain, reverbMix }` and `ambience: [{ id, gain }]` (merged at the hook level; `engine.audioState()` itself is not changed by this plan).
- Unit test `tests/unit/audio/mixer.test.js` with a fake `AudioContext` (a stub class with `createGain`, `createBiquadFilter`, `createConvolver`, `createBufferSource`, `destination`; each node records its `connect` calls, its `gain.value` or `frequency.value` and the `setTargetAtTime` calls). Assertions: (a) every emitter in the table is created with the right bus (sea, wind, gulls, harbour, town, birds and rain on the outdoor bus; each room emitter on the indoor bus when the listener is in its room, outdoor otherwise); (b) the cutoff is changed with `setTargetAtTime` at the 100 ms cadence and only then; (c) the low-pass node `frequency` target equals the reported `filter.outdoorCutoff` in the same tick; (d) the type-to-loop table maps each listed prop type to its loop id and the lift and cafe emitters are present; (e) the mixer with `ctx` null updates `audioState` and throws nothing.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/mixer.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/audio/ambience.js`

### Step 3: Playwright: the filter changes at the door

Deliver:
- `tests/e2e/acoustics.spec.js` (journey 6 audio part; URL without `?time=`). Spots (literal numbers in the test; each taken from the named source): square: centre of `areas.square` (town.json, `{cx, cz}`), expected `insideRoom` null; beach: a literal point inside `areas.beach` above the waterline, chosen at build time (as in plan 064); hotel lobby: the centre of the `lobby` room of the `plaza` manifest (teleport to the plaza zone first, then to that point at the room floor y); main door: the exterior door of the `plaza` manifest found by its id from `listDoors()` (the door id is copied from the manifest). Steps: (1) press `Escape` (not Shift) to unlock; `expect.poll` until `audioState().unlocked` is true. (2) On the square: `expect.poll` until `filter.insideRoom` is null and `filter.outdoorCutoff` is 20000 (or at least 15000 after the smoothing). (3) Teleport inside the lobby with the main door closed: `expect.poll` until `filter.insideRoom` is `lobby` (or the `<bldId>:lobby` form the mixer reports, pinned in the test), `filter.outdoorCutoff` is at most 2500 and `filter.reverbMix` equals the value from the formula `0.15 + 0.3 * clamp(V / 400, 0, 1)` with `V` = the lobby bounds area times the room height from the manifest (pinned literal). (4) Open the main door (`e` at 1.5 m outside it) and stand 2 m inside (teleport): `expect.poll` until the cutoff is greater than 1100 and at most 9000 (the open door is 9000 exactly when fully open, so the upper bound is inclusive). (5) Walk out: teleport to the outside point of the door: `expect.poll` until the cutoff is above 15000. (6) Equal distance: teleport to a point A on the open beach 15 m from a shore point P, and to a point B in the lobby 15 m from P with a wall between A and B (both literal, chosen at build time); `ambience` entry `sea` gain at B is lower than at A. (7) `?weather=rain` (a second page load): an `ambience` entry `rain` exists outdoors with gain above the indoor value. (8) zero console errors, and `unlocked` still true at the end (a muted mixer cannot pass).
- Document the emitter table (the rows above) and the acoustics rules (the constants and the formulas) in `docs/world-conventions.md` under a heading "Emitters" (the file is in allowed paths), and check it with `has`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/acoustics.spec.js`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "Emitters"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/audio/acoustics.test.js tests/unit/audio/mixer.test.js tests/unit/audio/ambienceSfx.test.js`
- `npx playwright test tests/e2e/acoustics.spec.js`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Walk through a door with headphones: the outside should dull and the room should have a little echo. Also judge the ten new loops for seams and level.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
