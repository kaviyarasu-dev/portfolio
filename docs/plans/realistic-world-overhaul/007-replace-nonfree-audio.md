# Plan 007: Replace the non-CC0 sound effects with generated CC0 ones and ledger the legacy music

Epic E1. Estimated turns: 45.

## Goal

The 5 CC-BY-SA effects (`footstep_grass`, `footstep_sand`, `interact`, `type_tick`, `scroll_pickup`) and the CC-BY `ocean_loop.ogg` must leave the repo (D28). No other audio host is reachable unattended (ARCHITECTURE.md 10.1), so a deterministic synthesizer script writes the replacements as WAV files that the project owns (ledger licence CC0, source `generated:scripts/assets/synthSfx.mjs`). The 6 CC0 music loops and `wind_loop.ogg` stay and get ledger entries. Plan 064 extends the synthesizer with the per-surface footsteps.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: decision D28 (requirements.md) and section 10.1, 10.2)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/assets/audio/CREDITS.md`
- src/systems/audio.js
- scripts/lib/ledger.mjs
- scripts/ledger-add.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Synthesizer with deterministic recipes

Deliver:
- `scripts/assets/synthSfx.mjs`: exports `RECIPES` (name -> `{ seconds, sampleRate, render(rng) }` returning a `Float32Array`), `renderRecipe(name, seed = 1)` and `writeWav(file, samples, sampleRate)` (16-bit PCM mono WAV with a correct 44-byte header). Recipes now: `footstep_grass` (0.18 s noise burst, low-passed near 1.8 kHz, 4 ms attack, exponential decay), `footstep_sand` (0.24 s, softer, low-pass near 900 Hz), `interact` (0.4 s two-note chime, sine plus a quiet harmonic), `type_tick` (0.03 s click), `scroll_pickup` (0.5 s paper rustle then a soft chime), `ocean_loop` (20 s, 22050 Hz, brown noise shaped by two slow swells; the last 1.5 s are cross-faded into the first so the loop is seamless). Peak level of every recipe is at most 0.8.
- `tests/unit/scripts/synthSfx.test.js` (write first): same seed gives byte-identical samples; every recipe has finite samples within [-1, 1]; lengths equal `seconds * sampleRate`; `ocean_loop` first and last samples differ by less than 0.02; `writeWav` header fields (RIFF, fmt, data sizes) are right when parsed back.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/synthSfx.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/synthSfx.mjs`

### Step 2: Generate the files, replace the old ones, ledger everything that stays

Deliver:
- CLI: `node scripts/assets/synthSfx.mjs --all` writes `assets/audio/sfx/<name>.wav` for every recipe and calls `addEntry` with `sourceUrl generated:scripts/assets/synthSfx.mjs`, author `project (generated)`, licence `CC0`. Run it.
- Delete `assets/audio/sfx/footstep_grass.ogg`, `footstep_sand.ogg`, `interact.ogg`, `type_tick.ogg`, `scroll_pickup.ogg`, `ocean_loop.ogg`.
- Ledger the files that stay with `scripts/ledger-add.mjs`: the six `assets/audio/music/*.ogg` (author `garsipal`, source `https://github.com/redeclipse/base/discussions/1347`, notes `legacy-v1: Red Eclipse ambience pack, CC0`) and `assets/audio/sfx/wind_loop.ogg` (author `felix.blume`, source `https://github.com/Muges/ambientsounds`, notes `legacy-v1: wind.ogg, CC0`). The resume PDF `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` gets licence `OWN`, author `Kaviyarasu M`, source `https://github.com/kaviyarasu-dev/portfolio` and notes `legacy-v1: the user own resume`.
- Update `src/systems/audio.js` (and any other file that names a replaced sound): replace the v1 name concatenation with one table `AUDIO_FILES` of full relative paths (for example `sfx: { footstep_grass: "sfx/footstep_grass.wav", ... }`, `music: { island_day: "music/island_day.ogg", ... }`), loaded through `assetUrl("audio/" + path)`; music stays `.ogg`, replaced effects become `.wav`; drop the `.mp3` fallback attempts. Rewrite `assets/audio/CREDITS.md` to describe the new set (generated sounds, the CC0 music and wind sources); remove every CC-BY and CC-BY-SA mention.
- `tests/unit/audio/files.test.js`: imports `AUDIO_FILES` from `src/systems/audio.js` (export it) and asserts every path in it exists under `assets/audio/`; ignores non-audio files such as `CREDITS.md` and `LEDGER.json` when checking ledger coverage; asserts none of the six removed files exist; asserts `assets/LEDGER.json` has an entry for every `.ogg`/`.wav`/`.mp3` file under `assets/audio` and none for a missing file, that the resume PDF entry has licence `OWN`, and that `assets/audio/CREDITS.md` contains neither `CC-BY` nor `CC BY` and does contain `generated`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/audio/files.test.js`
- `node "{{runner}}/assert.mjs" exists assets/audio/sfx/footstep_grass.wav assets/audio/sfx/ocean_loop.wav assets/LEDGER.json`
- `node -e "const fs=require('fs');process.exit(['assets/audio/sfx/ocean_loop.ogg','assets/audio/sfx/footstep_grass.ogg','assets/audio/sfx/interact.ogg'].some(p=>fs.existsSync(p))?1:0)"`

### Step 3: Playwright: no failed requests

Deliver:
- `tests/e2e/audio-assets.spec.js`: wait for `window.__world.ready`; click the canvas and press `Shift` to unlock audio; wait 4 s; assert no response had status 400 or higher and no `requestfailed` happened except an aborted media request (`ERR_ABORTED` on a `.ogg`, which streaming music can cause); log offending URLs in the assertion message; assert at least one `.wav` request returned 200 and at least one `.ogg` request returned 200 or 206.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/audio-assets.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/synthSfx.test.js tests/unit/audio/files.test.js`
- `npx playwright test tests/e2e/audio-assets.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`

Human check (goes in the report, never blocks): Listen to the generated effects (footsteps, chime, ocean) once; they are simple on purpose and plan 064 improves the footsteps.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
