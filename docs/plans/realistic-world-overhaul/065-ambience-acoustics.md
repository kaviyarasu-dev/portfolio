# Plan 065: Positional ambience through walls and interior acoustics (muffling and room echo)

Epic E6. Estimated turns: 55.

## Goal

Sound that depends on where you are: sea and wind that fade with distance from the shore, gulls and harbour clatter at the harbour, town murmur around the square, rain from the weather system, and in each room its own hum (fans, kitchen, server room, lift). Walls quiet the sounds that cross them. When the player is indoors the outdoor sounds are muffled by a low-pass filter and the room adds a short echo; an open door lets more through. The filter state is exposed in `audioState()` so a test can prove it.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5 (audioState) and requirement R11, decision D20(b)(c), assumption A26)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/audio/engine.js
- src/systems/audio/bank.js
- src/world/kit/building.js
- src/world/weather/index.js
- src/world/terrain/townHeight.js
- src/world/layout/town.json
- scripts/assets/synthSfx.mjs
- src/systems/collision/world.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Ambience loops and the pure acoustics model

Deliver:
- New synthesized loops in `synthSfx.mjs` (seamless, 12 to 20 s, 22050 Hz mono, ledgered): `amb_town_hum` (distant crowd murmur and a moped), `amb_birds` (random chirps of two species), `amb_gulls`, `amb_harbour` (a slow diesel put-put, water slap, rope creak), `amb_fan` (a steady whir), `amb_kitchen` (sizzle and clatter), `amb_server` (a hum with fan noise), `amb_lift_shaft`, `amb_rain` (dense hiss with drops), `amb_cafe` (soft murmur and cups). Existing `ocean_loop` and `wind_loop` are reused. The earlier test files are frozen, so add the new file `tests/unit/audio/ambienceSfx.test.js` with the loop seam check and a total size under 6 MB for these.
- `tests/unit/audio/acoustics.test.js` first. `src/systems/audio/acoustics.js` (pure): `ambienceGain(emitter, listener, world)` (inverse distance falloff to the emitter `radius`, times 0.35 per wall box crossed by `world.raycast2D` between the two points, times 0.7 for each closed door crossed, capped), `acousticsTarget({ insideRoom, room, doorOpenness })` returning `{ outdoorCutoff, outdoorGain, reverbMix, reverbDecay }`: outdoors 20000 Hz, gain 1, reverb 0; indoors with closed doors 1100 Hz, gain 0.35, reverb mix from 0.15 to 0.45 and decay 0.3 to 1.6 s growing with the room volume (bounds area times floor height); nearest exterior door within 4 m open by openness 0..1 interpolates the cutoff between 1100 and 9000 Hz; `smooth(current, target, dtMs)` with a 0.25 s time constant.
- Tests: gain falls with distance and is zero past the radius; two walls give 0.35 squared; a closed door attenuates more than an open door; target cutoff outdoors 20000 and indoors at most 2500; open door raises it; larger room gives longer decay; smoothing converges without overshoot.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/ambienceSfx.test.js tests/unit/audio/acoustics.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/audio/acoustics.js`

### Step 2: Ambience mixer with outdoor and indoor buses

Deliver:
- `src/systems/audio/ambience.js`: `AmbienceMixer` uses the Howler audio context (`Howler.ctx`) and its own `AudioBufferSourceNode` loops (decode with `fetch` plus `decodeAudioData`): an `outdoorBus` (gain then `BiquadFilterNode` low-pass then a mixer gain), an `indoorBus` (gain, then a small `ConvolverNode` reverb built from a generated noise impulse response of the room decay, wet and dry mix) and the master. Emitters from data: sea along the shore (the position is the nearest shore point to the player, found from the height field sampled on a 12 m grid, radius 90 m), wind (volume by height above sea and openness), gulls and harbour at the harbour polygon centre (radius 80 m), town hum at the square (radius 70 m), birds in the forest polygon (radius 60 m), rain from the weather state (global, louder outdoors), and room emitters from manifests: objects with ambience metadata (`fan-ceiling` and `fan-pedestal` -> `amb_fan` at 0.15 within 6 m, `stove-gas` and `stove-clay` -> `amb_kitchen`, `server-rack` -> `amb_server`, the cafe room -> `amb_cafe`, lift shafts -> `amb_lift_shaft`) which go to the indoor bus when the player is in that room and are attenuated through the wall rule otherwise.
- Each frame (every 100 ms) compute emitter gains with `ambienceGain`, the acoustics target with `insideRoom` and the nearest exterior door openness, smooth, and apply to the nodes with `setTargetAtTime`. If `Howler.ctx` is missing or suspended nothing throws. `audioState()` gains `filter: { insideRoom, outdoorCutoff, outdoorGain, reverbMix }` and `ambience: [{ id, gain }]`.
- Unit test `tests/unit/audio/mixer.test.js` with a fake `AudioContext` (a minimal stub class with `createGain`, `createBiquadFilter`, `createConvolver`, `createBufferSource`) asserting the bus wiring and that gains are applied for a sample listener position.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/mixer.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/audio/ambience.js`

### Step 3: Playwright: the filter changes at the door

Deliver:
- `tests/e2e/acoustics.spec.js` (journey 6 audio part): unlock audio with a key press; outdoors on the square `audioState().filter.outdoorCutoff` is at least 15000 and `insideRoom` null; teleport inside the hotel lobby with the main door closed: after 1 s the cutoff is at most 2500 and `reverbMix` over 0.1 and `insideRoom` is `lobby`; open the main door and stand 2 m inside: the cutoff is between the two values; walk out: cutoff back above 15000 within 2 s; the sea emitter gain at the beach is higher than in the square (compare `ambience` entries); in the lobby with the door closed the sea gain is lower than outdoors at an equal distance; `?weather=rain` adds an `amb_rain` entry outdoors and a lower one indoors; zero console errors (suspended audio context warnings are `console.warn`, not errors).
- Document the emitters table and the acoustics rules in `docs/world-conventions.md`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/acoustics.spec.js`

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

Human check (goes in the report, never blocks): Walk through a door with headphones: the outside should dull and the room should have a little echo.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
