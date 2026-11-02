# Plan 066: Music per area: generated CC0 loops, crossfades, volume sliders

Epic E6. Estimated turns: 50.

## Goal

New music for the new places. No other music host is reachable, so a deterministic generator writes new ambient loops (a drone with a slow pentatonic melody in a South Indian flavour, a harbour piece, an office pulse, a cafe piece, a night piece) and the 6 existing CC0 loops stay where no new loop exists. A table maps every area and landmark to a track; tracks crossfade; music and effects have separate volume sliders in the settings panel.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.1, 10.2 and requirement R11, decision D20(d), D28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/assets/synthSfx.mjs
- src/systems/audio/engine.js
- src/systems/audio/bank.js
- src/ui/settings.js
- src/world/areas/index.js
- src/world/buildings/plaza/manifest.json
- assets/audio/music

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Music generator and loops

Deliver:
- `scripts/assets/synthMusic.mjs`: `renderTrack(name, seed)` returns a stereo or mono `Float32Array` loop of 32 to 48 s at 22050 Hz built from: a detuned sine/triangle drone pad with slow filter motion, a plucked melody (decaying triangle plus a soft filtered noise attack) walking a pentatonic scale (for example D E G A B, with grace-note slides) with seeded rhythm, optional soft hand-drum pulses (low noise bursts), a gentle reverb tail (a few delay taps), and a seamless loop (the tail is mixed into the start). Tracks: `music_town_day` (warm, mid tempo), `music_town_night` (sparse, slow), `music_harbour` (open fifths, rolling pulse), `music_beach` (airy), `music_forest` (low drone, bird-like high plucks), `music_hotel` (soft lounge chords), `music_cafe` (light and rhythmic), `music_office` (quiet pulse and pads), `music_studio` (minimal), `music_hall` (stately). Write them as `assets/audio/music/<name>.wav` (mono 16-bit) with ledger entries (source `generated:scripts/assets/synthMusic.mjs`), total under 12 MB (about 1.3 MB each).
- `tests/unit/audio/synthMusic.test.js`: deterministic; finite and within [-1, 1] with peak at most 0.7; loop seam (first and last 50 ms differ by at most 0.03 in RMS); length within 32 to 48 s; tracks differ from each other (cross-correlation or RMS difference over 5 percent); the pitch content is pentatonic: an FFT-free check on the generator: the note list it used (return it from a helper `trackNotes(name, seed)`) contains only scale degrees.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/synthMusic.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/synthMusic.mjs assets/audio/music/music_town_day.wav`
- `npm run check:ledger`
- `npm run check:size`

### Step 2: Area-to-track table, crossfading and sliders

Deliver:
- `tests/unit/audio/music.test.js` first. `src/systems/audio/music.js`: `TRACK_FOR` maps keys to track ids: `town-day` -> `music_town_day`, `town-night` -> `music_town_night`, `harbour` -> `music_harbour`, `beach` -> `music_beach`, `forest` -> `music_forest`, `hotel` -> `music_hotel`, `west-gate` -> `island_day`, and per landmark when the player is INSIDE: `plaza` -> `music_hotel`, `notice` -> `music_hall`, `forge` -> `forge` (existing), `citadel` -> `music_office`, `broadcast` -> `music_studio`, `gateway` -> `music_office`, `transport` -> `music_harbour`, `temple` -> `music_cafe`, `workshop` -> `music_studio`, `freshnote` -> `music_cafe`, `library` -> `library` (existing), `academy` -> `library` (existing), `lighthouse` -> `lighthouse` (existing), `milestones` -> `music_hall`; the existing `castle` loop is used for the tower rooftop only. `pickTrack({ areaIds, insideBuildingId, nightFactor, weather })`: inside a building uses its entry; outdoors picks by the nearest of harbour, beach, forest, west gate, else town day or night by `nightFactor` (hysteresis 0.45 to 0.55); heavy rain lowers the volume by 30 percent.
- Crossfade 2.5 s between tracks (two Howl instances, fade out and in), no restart when the same track is chosen, volume 0.35 by default times the music slider; a new key table test: every key of `TRACK_FOR` points to an existing file that has a ledger entry with licence `CC0`; every zone id and every area id of `createAllAreas` (plan 040) is covered by `pickTrack` (no area falls through to nothing); `pickTrack` is deterministic and hysteretic.
- `src/ui/settings.js`: add two sliders "Music" and "Effects" (0 to 100, stored in localStorage in try/catch, keyboard operable with arrow keys) and a mute checkbox that mirrors `Shift+M`; `audioState()` gains `music: { track, volume }` and `volumes: { music, sfx, master }`. The settings spec of plan 011 is frozen, so add the new file `tests/e2e/audio-settings.spec.js`: the sliders change `audioState().volumes` and persist across reload; mute works with `Shift+M`.
- `tests/e2e/music.spec.js`: teleport to the harbour quay: `audioState().music.track` is `music_harbour` within 4 s; into the library: `library`; into the cafe building: `music_cafe`; at `?time=0.75&freeze=1` on the square: `music_town_night`; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/music.test.js`
- `npx playwright test tests/e2e/music.spec.js`
- `npx playwright test tests/e2e/audio-settings.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/audio/synthMusic.test.js tests/unit/audio/music.test.js`
- `npx playwright test tests/e2e/music.spec.js`
- `npx playwright test tests/e2e/audio-settings.spec.js`
- `npx playwright test tests/e2e/settings.spec.js`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Listen to each generated track. They are simple and ambient; say if you want different moods, or drop in your own CC0 tracks later.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
