# Plan 002: Port the v1 game to ES modules on Vite and the current Three.js

Epic E1. Estimated turns: 55. Model: opus.

## Goal

Move every v1 source file from `js/` to `src/` as normal ES modules, load Three.js, Howler and the post-processing passes from npm instead of CDN globals, remove `build.mjs`, `dist/`, `Xbot.js` and the 14-byte `Ybot.glb`, and prove the game still boots with zero console errors. The game must look and behave like v1 (boot, WASD and mouse, day/night clock, `?time=`, `T`, `E` near a landmark opens its dialogue, minimap).

The resume PDF moves into `assets/` under the no-space name; the download file name stays `Kaviyarasu_Fullstack_Engineer_Resume.pdf`.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 2, 9 and 10.2)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/index.html`
- `portfolio/build.mjs`
- `portfolio/README.md`
- `portfolio/js/main.js`
- `portfolio/js/state.js`
- `portfolio/js/config.js`
- `portfolio/js/engine/renderer.js`
- `portfolio/js/engine/assets.js`
- `portfolio/js/entity/player.js`
- `portfolio/js/systems/interaction.js`
- `portfolio/js/util/three.js`
- `portfolio/assets/audio/CREDITS.md`
- vite.config.js
- eslint.config.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Move js/ to src/ with a one-off codemod and add the module imports

Deliver:
- Write `scripts/dev/port-v1.mjs`: for every file under `js/` copy it to the same relative path under `src/` (`js/main.js` becomes `src/main.js`). Where a file uses `THREE.` add `import * as THREE from 'three';` at the top. Where it uses `Howl` or `Howler` add `import { Howl, Howler } from 'howler';`. Replace `THREE.GLTFLoader` with a named import from `three/addons/loaders/GLTFLoader.js`; `THREE.EffectComposer`, `THREE.RenderPass`, `THREE.UnrealBloomPass`, `THREE.ShaderPass`, `THREE.FXAAShader` with named imports from `three/addons/postprocessing/*.js` and `three/addons/shaders/FXAAShader.js`. Run it, check the result, then delete the script and the whole `js/` folder.
- Create `src/util/assetUrl.js` exporting `assetUrl(path)` = `import.meta.env.BASE_URL` + path with no double slash.
- Every relative import must still resolve (the old files used `.js` extensions already).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" exists src/main.js src/state.js src/config.js src/world/buildings.js src/world/terrain.js src/systems/gameloop.js src/entity/player.js src/util/assetUrl.js`
- `node -e "const fs=require('fs');process.exit(['js'].some(p=>fs.existsSync(p))?1:0)"`
- `node "{{runner}}/assert.mjs" has src/engine/renderer.js "from 'three'"`
- `node "{{runner}}/assert.mjs" has src/entity/player.js "GLTFLoader"`

### Step 2: Make the code valid for the current Three.js, Vite and Howler

Deliver:
- `tests/unit/migration/src.test.js` (write it first): scans every `.js` under `src/` and fails on: `window.THREE`, `XBOT_MODEL_DATA`, `THREE.GLTFLoader`, `THREE.EffectComposer`, `physicallyCorrectLights`, `.encoding =`, `sRGBEncoding`, `mergeBufferGeometries`, `THREE.Math.`, `window.Howl`, `window.Howler`, `atob(`; also fails when a file that contains `THREE.` has no `from 'three'` import, when a relative import specifier does not resolve to an existing file, and when `scripts/dev/port-v1.mjs` still exists. It also asserts that `src/config.js` exports `LIGHT_UNIT`, that `src/systems/clock.js` uses it, and that no source string starts with `./assets/`.
- Fix the API drift between r147 and the installed Three.js: `renderer.outputColorSpace = THREE.SRGBColorSpace`; delete `physicallyCorrectLights`; textures use `.colorSpace`; `mergeBufferGeometries` is `mergeGeometries`; `THREE.Math` is `THREE.MathUtils`. Since r155 light intensities are physical. Add `export const LIGHT_UNIT = Math.PI;` to `src/config.js` and multiply by it EVERY place that sets a sun, hemisphere or ambient intensity: the constructor values in `scene.js` and the per-frame targets that `src/systems/clock.js` writes into `game.sun.intensity` and `game.hemi.intensity`. For the animated PointLights in `src/world/buildings.js` and `src/world/buildingAnims.js` (decay 2 is physical now) multiply by `LIGHT_UNIT * 3` as a starting value and tune by looking at a screenshot so glows are about as strong as v1. Leave `THREE.ColorManagement` at its default (enabled) and give every `CanvasTexture` `colorSpace = THREE.SRGBColorSpace`. With `EffectComposer` the tone mapping and colour space need an `OutputPass` at the end of the chain in this order: `RenderPass`, `UnrealBloomPass` (same strength, radius and threshold as v1), `OutputPass`, then the FXAA `ShaderPass` with its `resolution` uniform set from the view size and pixel ratio exactly as v1 did. The old CopyShader and LuminosityHighPassShader scripts are not needed any more.
- `src/systems/audio.js`: import `Howl` and `Howler` from `howler` (drop the `window.` prefix) and set the audio base to `assetUrl('audio')` (the public dir is `assets/`, so audio is served at `<base>/audio/...`). `src/main.js`: remove the `window.THREE` and global checks; the `DOMContentLoaded` bootstrap stays. `src/entity/player.js`: load `assets/models/Soldier.glb` with `GLTFLoader.load(assetUrl('models/Soldier.glb'))` instead of the base64 string (plan 008 replaces this avatar; the v1 index-based clip selection stays as it is, plan 008 replaces the avatar).
- `src/config.js`: `WORLD_RADIUS` and the other constants stay as in v1 for now (plan 032 enlarges the world).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/migration/src.test.js`
- `npm run lint`

### Step 3: index.html, resume PDF, assets and cleanup

Deliver:
- `tests/unit/migration/site.test.js` (write it first): `index.html` has no `<script src="http`, no `cdn.jsdelivr`, `cdnjs`, no `fonts.googleapis` or `fonts.gstatic`, has `<script type="module" src="/src/main.js">` and `<link rel="icon" href="data:,">`; `src/config.js` sets `RESUME_HREF` with `assetUrl(`; the interaction code still uses the download name `Kaviyarasu_Fullstack_Engineer_Resume.pdf`; `docs/images/screenshot.png` exists, `assets/screenshot.png` does not, and README links `docs/images/screenshot.png`; README has a "Development" heading; the file `assets/models/Soldier.glb` is NOT asserted either way (plan 008 deletes it); `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` exists and its sha256 is `abfe286b1bbcf14a76585f5885a1a76414d9b2113ce1eb813ea99ebb5abf5d3f`; these paths do not exist: `build.mjs`, `dist`, `js`, `assets/models/Xbot.js`, `assets/models/Xbot.glb`, `assets/models/Ybot.glb`, `Kaviyarasu Full Stack Engineer Resume.pdf`; `README.md` does not mention `build.mjs`.
- `index.html`: remove every CDN `<script>` and the `Xbot.js`/`dist/bundle.js` scripts; add the module script; add `<link rel="icon" href="data:,">` so the browser does not request a missing favicon. Remove the three Google Fonts `<link>` tags (preconnects and stylesheet) now; the CSS font-family lists already fall back to system fonts and plan 009 adds the self-hosted fonts. All other CSS stays.
- Copy the PDF byte for byte (a node one-liner with `fs.copyFileSync`) to `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`, delete the original at the repo root, set `RESUME_HREF` in `src/config.js` to `assetUrl('Kaviyarasu_Fullstack_Engineer_Resume.pdf')`; the download attribute in the interaction code keeps `Kaviyarasu_Fullstack_Engineer_Resume.pdf`.
- Move `assets/screenshot.png` to `docs/images/screenshot.png` and fix the README image link. Delete `build.mjs`, `dist/`, `assets/models/Xbot.js`, `assets/models/Xbot.glb`, `assets/models/Ybot.glb`. Keep `assets/models/Soldier.glb` for now (plan 008 removes it); do not assert its presence in any test.
- Update the README "Notes" and add a short "Development" section: `npm ci`, `npm run dev`, `npm run build`, `npm test`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/migration/site.test.js`
- `npm run build`
- `node "{{runner}}/assert.mjs" exists dist/index.html`
- `node "{{runner}}/assert.mjs" none dist/index.html "cdn\.jsdelivr|cdnjs\.cloudflare"`

### Step 4: Boot smoke spec: zero console errors and a rendered canvas

Deliver:
- `tests/e2e/helpers/pixels.js`: `async function canvasLooksRendered(page)` takes `page.locator("#game-canvas").screenshot()` (a PNG of the WebGL canvas only, so HUD overlays cannot fake it), decodes it with `pngjs`, quantizes each pixel to 4 bits per channel and returns true when at least 12 distinct colours exist.
- `tests/e2e/smoke.spec.js`: collects `console` messages of type `error`, `pageerror` and `requestfailed`; opens the base URL; waits until `#loader` has class `hidden` (up to 90 s); waits 1.5 s; asserts the collected error list is empty and `canvasLooksRendered`. This is the boot smoke test of R4 and also runs in CI.
- Run it. Fix the root cause of every console error (a missing file, a bad import, a Three.js API change). Do not filter errors in the test.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" exists tests/e2e/smoke.spec.js tests/e2e/helpers/pixels.js`
- `npx playwright test tests/e2e/smoke.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/migration/src.test.js tests/unit/migration/site.test.js`
- `npm run build`
- `npx playwright test tests/e2e/smoke.spec.js`

Human check (goes in the report, never blocks): Open `npm run dev` and compare with https://kaviyarasu-dev.github.io/portfolio/ : same island, same look, you can walk and open dialogues.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- If the game cannot boot after fixing every console error, write BLOCKED.md with the last error and the file.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
