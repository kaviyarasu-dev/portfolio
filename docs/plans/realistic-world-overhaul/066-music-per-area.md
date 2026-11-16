# Plan 066: Music per area: generated CC0 loops, crossfades, volume sliders

Epic E6. Estimated turns: 70.

## Goal

New music for the new places. No other music host is reachable, so a deterministic generator writes ten new ambient loops (a drone with a slow pentatonic melody in a South Indian flavour, a harbour piece, an office pulse, a cafe piece, a night piece and others). The six existing CC0 loops (`island_day`, `island_night`, `forge`, `library`, `lighthouse`, `castle`) stay where the table below uses them. A table maps every area and landmark to a track; tracks crossfade; music and effects have separate volume sliders in the settings panel. This plan owns the music module (`src/systems/audio/music.js`), the music tracks and the sliders; it replaces the v1 music trigger that plan 064 moved into the engine (`playMusic`) and deletes that code.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.1, 10.2, 10.5 (audioState) and requirement R11, decision D20(d), D28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/assets/synthSfx.mjs (plan 007; its WAV writer, renderRecipe; plan 064 exports)
- assets/LEDGER.json (plan 005; the exact author and licence strings of the synthesized SFX entries from plan 007)
- src/systems/audio/engine.js and src/systems/audio/bank.js (plan 064: Howler wrapper, playMusic to be removed, master, setMuted)
- src/systems/audio/ambience.js (plan 065: the sea/wind/rain and room loops, which use the sfx volume slider)
- src/ui/settings.js (plan 011: the settings panel and its localStorage keys)
- tests/e2e/settings.spec.js (plan 011, frozen; must still pass)
- src/world/areas/index.js (plan 040: createAllAreas; this plan creates and exports AREA_IDS here)
- src/world/weather/index.js (plan 062: weatherState().rain)
- src/world/layout/town.json (plan 032: areas, harbour quay points)
- src/world/roads/surface.js (plan 034)
- assets/audio/music (existing CC0 loops)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Music generator and loops

Deliver:
- `scripts/assets/synthMusic.mjs` exports `renderTrack(name, seed)` (a mono `Float32Array` loop of 28 to 32 s at 22050 Hz; each track length is in its table row), `renderComponent(kind, seed, tonic)` (the single components used by the component tests), `trackNotes(name, seed)` (the pitch classes the track uses), and the table `TRACKS`. Size: 22050 Hz mono 16-bit is 44100 bytes per second, so 32 s is 1.41 MB per track; 10 tracks at 32 s total 14.1 MB, under the 15,000,000 byte cap (this plan), and the 10 tracks use at most 32 s each. The CLI `node scripts/assets/synthMusic.mjs --all` writes `assets/audio/music/<name>.wav` (mono 16-bit, via the WAV writer of plan 007 or 064; export it from synthSfx.mjs if it is not exported yet, without changing the output of its recipes) and one ledger entry per track: `sourceUrl` `generated:scripts/assets/synthMusic.mjs` and `host` `local` (the ledger field names of plan 005), and the author and licence strings copied from the plan 007 synthesized entries in `assets/LEDGER.json`. Seed per track = 1337 + its index in `TRACKS`. If `node scripts/generate-credits.mjs --check` (when that script exists) fails for the new tracks, regenerate `assets/audio/CREDITS.md` (`assets/**` is in the allowed paths).
- Tracks (name, key and scale, tempo, length, character). All melody, chord and drone pitches of a track are taken from its own scale (the pitch classes of the scale only; this is what `trackNotes` returns and the test checks): `music_town_day` (D major pentatonic: D E F# A B; 96 BPM; 32 s; warm, mid tempo); `music_town_night` (A minor pentatonic: A C D E G; 60 BPM; 28 s; sparse, slow); `music_harbour` (D major pentatonic; 88 BPM; 32 s; open fifths D and A as drone, rolling pulse); `music_beach` (D major pentatonic; 72 BPM; 30 s; airy, high pads, no drums); `music_forest` (G minor pentatonic: G Bb C D F; 66 BPM; 32 s; low drone, bird-like high plucks); `music_hotel` (D major pentatonic; 80 BPM; 32 s; soft lounge chords built from pentatonic chord tones); `music_cafe` (G major pentatonic: G A B D E; 104 BPM; 28 s; light and rhythmic); `music_office` (A minor pentatonic; 90 BPM; 28 s; quiet pulse and pads); `music_studio` (E minor pentatonic: E G A B D; 84 BPM; 28 s; minimal); `music_hall` (D major pentatonic; 70 BPM; 32 s; stately).
- DSP (fixed numbers): drone = three detuned sine and triangle oscillators per chord root (detune 3 cents, each amplitude 0.12) through a one-pole low-pass whose cutoff moves between 400 and 1200 Hz on a 0.05 Hz LFO; pluck = triangle oscillator with an exponential decay (time constant 0.6 s) plus a 10 ms filtered noise attack (amplitude 0.15), so its peak is within the first 10 ms; grace note = a 60 ms pitch slide from 2 semitones below the note to the note, before the pluck; hand drum (optional, per track) = sine from 90 Hz down to 60 Hz over 80 ms with an exponential decay of 80 ms; reverb = three delay taps at 80, 130 and 210 ms with feedback 0.3 and a wet mix of 0.2; rhythm and melody use the seeded RNG (plan 003 style, seed from the table). Seamless loop: the render is longer than the loop by 0.5 s, and the last 0.5 s is equal-power crossfaded into the first 0.5 s before the file is written.
- `tests/unit/audio/synthMusic.test.js` (a NEW file, all 10 tracks, each test runs on all of them): (1) deterministic: rendering twice gives identical samples; (2) committed files: the SHA-256 of each committed WAV data chunk equals the SHA-256 of the samples rendered from its name and seed (so the committed files are the generator output); (3) format: 22050 Hz, mono, 16-bit, length 28 to 32 s; finite; within [-1, 1]; peak at most 0.7; (4) seam: the sample-wise RMS of (last 50 ms minus first 50 ms) is at most 0.03 of full scale, AND `|first sample - last sample|` is at most 1.5 times the largest adjacent-sample difference observed in the middle of the track (between 1 s and length minus 1 s); (5) notes: `trackNotes(name, seed)` contains only pitch classes of the track scale in the table; (6) tracks differ: the normalised cross-correlation of the 1 s mono envelopes (RMS per 10 ms window, mean removed) of any two tracks is below 0.9; (7) components: `renderComponent("drone", seed, tonic)` has its strongest bin (Goertzel scan 40 to 400 Hz) within 3 Hz of the tonic; `renderComponent("pluck", ...)` has its peak within 10 ms of the onset; `renderComponent("grace", ...)` has a pitch that moves monotonically across its 60 ms; `renderComponent("drum", ...)` drops below 10 percent of its peak within 0.5 s; (8) sizes: the sum of the 10 committed WAV file sizes is under 15,000,000 bytes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/synthMusic.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/synthMusic.mjs assets/audio/music/music_town_day.wav assets/audio/music/music_town_night.wav assets/audio/music/music_harbour.wav assets/audio/music/music_beach.wav assets/audio/music/music_forest.wav assets/audio/music/music_hotel.wav assets/audio/music/music_cafe.wav assets/audio/music/music_office.wav assets/audio/music/music_studio.wav assets/audio/music/music_hall.wav`
- `npm run check:ledger`
- `npm run check:size`

### Step 2: Area-to-track table, crossfading, sliders and settings

Deliver:
- `tests/unit/audio/music.test.js` first (Vitest with `vi.mock("howler")`: a fake `Howl` class that records `play`, `fade`, `volume`, `unload` and the `loop` flag). `src/systems/audio/music.js` exports `TRACK_FOR` (keys to track ids): `town-day` to `music_town_day`; `town-night` to `music_town_night`; `harbour` to `music_harbour`; `beach` to `music_beach`; `forest` to `music_forest`; `hotel` to `music_hotel`; `west-gate` to `island_day` by day and `island_night` by night (uses the legacy night loop); inside a building (key is the building zone id from `insideBuildingId`): `plaza` to `music_hotel`, `notice` to `music_hall`, `forge` to `forge` (existing), `citadel` to `music_office`, `broadcast` to `music_studio`, `gateway` to `music_office`, `transport` to `music_harbour`, `temple` to `music_cafe`, `workshop` to `music_studio`, `freshnote` to `music_cafe`, `library` to `library` (existing), `academy` to `library` (existing), `lighthouse` to `lighthouse` (existing), `milestones` to `music_hall`, the cafe plot of plan 037 (archetype `cafe`) to `music_cafe`. The existing `castle` loop is used only on the rooftop of the tower (zone `broadcast`, the tower of plan 047; confirm the id at build time): `onRooftop` (the floor has `rooftop: true`, plan 020) with `insideBuildingId` `broadcast` gives `castle`.
- `pickTrack({ areaId, insideBuildingId, onRooftop, nightFactor, weather, prevTrack })` returns `{ track, volumeScale }`. Inside a building it uses that building entry (rooftop first); outdoors it uses the area table by `areaId` (an id from `AREA_IDS`, see the AREA_IDS item of step 2): `harbour`, `beach`, `west-gate` as above, and `forest`, which the caller passes when the listener is inside the town.json `areas.forest` polygon (plan 040 creates no `forest` area, so `forest` is not in `AREA_IDS`; the polygon test is done in `music.js`); `v1-world`, `centre` and every town block id `town-<ix>-<iz>` (and any other area id) use town day or night by `nightFactor`. Night hysteresis: a night track is kept while `nightFactor` is above 0.45, a day track is kept while it is below 0.55. `volumeScale` is 0.7 when `weather.rain` (plan 062 `weatherState()`, 0 to 1) is at least 0.5, else 1. A track change is applied at most once every 6 seconds: a new choice made earlier waits (the update function in `music.js` holds it as pending). `pickTrack` is deterministic (same input, same output) and returns the same track for the same inputs (hysteresis is tested by a sequence of nightFactor values).
- Crossfade (`music.js`): 2.5 s between tracks, two `Howl` instances (`loop: true`), the outgoing one fades out and the incoming one fades in. At most two Howls exist at any time; the outgoing one is unloaded when its fade completes. A change during a fade unloads the outgoing (fading) Howl at once and starts the new fade from the current levels. A choice equal to the current track does nothing (no restart). The music volume is `0.35 * musicSlider * master * volumeScale` (sliders are 0 to 1). The hook `window.__world.audioState` (in `src/dev/worldHook.js`, merged at the hook level as plan 065 does; `engine.audioState()` is NOT changed, because the frozen plan 064 engine test checks its exact key set) gains `music: { track, volume, playing, howls }` and `sfx: { volume }`: `track` is the chosen track even before unlock (not playing yet), `volume` is the effective music volume, `playing` is a boolean, `howls` is the live Howl count, and `sfx.volume` is the effective effects volume (the Effects slider times master, 0 to 1). `master` stays a top-level key (plan 064). No `volumes` object.
- AREA_IDS (created by this plan): `src/world/areas/index.js` (plan 040 file) gains `export const AREA_IDS = Object.freeze([...])`, the list of the area ids that plan 040 `createAllAreas()` creates. Plan 040 does not export it. `tests/unit/audio/music.test.js` checks that AREA_IDS equals the keys of `createAllAreas()`, so the two cannot drift.
- Remove the v1 music trigger: plan 064 moved it into `engine.playMusic`; this plan deletes `playMusic` and the call sites, so that after load exactly one music Howl plays (`music.howls` is 1 after the first fade). Unit tests in `music.test.js`: the 2.5 s fade with two Howls; no restart on the same track; default volume 0.35 times the slider; heavy rain gives 0.7 times; the castle rooftop mapping; `audioState().music.volume`; `TRACK_FOR` keys all point to a file in `assets/audio/music` or `assets/audio/` with a ledger entry of licence `CC0` (the ledger author and licence strings as in plan 007); every area id in `AREA_IDS` (exported by this plan from `src/world/areas/index.js`) is covered by `pickTrack` with a track that exists.
- Settings (`src/ui/settings.js`, plan 011): four controls: "Master" (`#vol-master`), "Music" (`#vol-music`), "Effects" (`#vol-sfx`; scales the sfx and the plan 065 ambience buses) as range inputs 0 to 100, and a "Mute" checkbox (`#mute`) that mirrors the mute key `N` of plan 064 (plan 068 keeps `M` for the map). Values are stored as `portfolio.volume.master`, `portfolio.volume.music`, `portfolio.volume.sfx` and `portfolio.muted` in localStorage, each read and written in try/catch (the defaults are 100 and false when storage fails). Keyboard: the sliders are native range inputs, so arrow keys change them; the controller (plan 016) ignores key events whose target is an input element, so the arrow keys do not move the player (the e2e checks it). New file `tests/e2e/audio-settings.spec.js`: the Master and Music sliders change `audioState().master` and `audioState().music.volume`, and the Effects slider changes `audioState().sfx.volume` (both reported by the hook, see the crossfade item); the values persist across reload; mute via `N` and via the checkbox give `audioState().muted` true. The frozen settings spec of plan 011 must still pass (step verify).
- `tests/e2e/music.spec.js` (URL without `?time=` unless stated; `expect.poll` with a 15 s timeout; no fixed waits): (a) harbour: `teleport` to the midpoint of the first `harbour.quay.points` segment of town.json (plan 032): `music.track` is `music_harbour`; (b) library: `teleport("library")`, then to the centre of the main room of the library manifest: `library`; (c) cafe: `teleport` to the centre of the cafe plot (plan 037, archetype `cafe`; the coordinates are read from the town plan by the test, the cafe plot id is pinned at build time), then into its main room: `music_cafe`; (d) square at `/?time=0.75&freeze=1`: `music_town_night`; (e) after each change `music.howls` becomes 1 again and `volume` moves over 2.5 s (poll twice); (f) zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/music.test.js`
- `npx playwright test tests/e2e/music.spec.js`
- `npx playwright test tests/e2e/audio-settings.spec.js`
- `npx playwright test tests/e2e/settings.spec.js`

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

Human check (goes in the report, never blocks): Listen to each generated track (all ten, with headphones, checking the loop seam and the level). They are simple and ambient; say if you want different moods, or drop in your own CC0 tracks later.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
