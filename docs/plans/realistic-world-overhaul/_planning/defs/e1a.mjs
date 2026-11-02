import { has, none, exists, json, absent, vt, pw, npm, node, BRANCH } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 001
  {
    id: '001', name: 'tooling-skeleton', title: 'Tooling skeleton: package, Vite, Vitest, ESLint, Playwright, gates runner, CI workflow', epic: 'E1', est: 45,
    arch: 'sections 1, 2, 8, 9 and 10.3',
    goal: [
      'Turn the repo into a Node project with every tool the later plans need, without touching the v1 game code yet: package.json with pinned dependencies, Vite config (base `/portfolio/`, public dir `assets/`), Vitest, ESLint, Playwright on the installed Chrome with a working WebGL check, the gates runner (`scripts/run-gates.mjs`) that every later plan relies on, the GitHub Pages workflow limited to `main`, and `docs/world-conventions.md`.',
      'You are on branch `world-v2`. If `git branch --show-current` prints anything else, write BLOCKED.md saying "run: git switch -c world-v2 in portfolio, then run the runner again" and stop. Never switch branches yourself.',
    ],
    read: ['README.md', 'index.html', 'js/config.js', 'docs/specs/2026-10-30-realistic-world-overhaul-design.md'],
    risks: ['The machine has no Playwright browsers: tests use the installed Chrome (`channel: \'chrome\'`) and software WebGL. Step 3 proves WebGL2 works with the chosen flags before anything depends on it.'],
    steps: [
      {
        title: 'package.json, dependencies, .gitignore, .env.example',
        items: [
          'Check `git branch --show-current` is `world-v2` (see Goal).',
          'Create `package.json`: name `portfolio-world`, `private: true`, `type: "module"`, `engines.node` ">=20". Scripts: `dev` (vite), `build` (vite build), `preview` (vite preview), `test` (vitest run), `test:e2e` (playwright test --pass-with-no-tests), `lint` (eslint .), `gates:full` (node scripts/run-gates.mjs full), `gates:e2e` (node scripts/run-gates.mjs e2e), `gates:ci` (node scripts/run-gates.mjs ci), `check:ledger`, `check:size`, `check:budget`, `check:buildings`, `check:content`, `check:phone`, `check:prod-hook`, `check:no-cdn` (each `node scripts/check-<name>.mjs`), `credits` (node scripts/generate-credits.mjs), `shots` (node scripts/shots.mjs). The check scripts do not exist yet; later plans create them and the gates runner skips a missing one.',
          'Install exact versions (use `--save-exact`): dependencies `three` and `howler`; devDependencies `vite`, `vitest`, `@playwright/test`, `eslint`, `@eslint/js`, `globals`, `pngjs`. Use the latest releases that npm accepts without peer-dependency conflicts; ESLint and `@eslint/js` must be the same major version and flat config must work; never use `--force` or `--legacy-peer-deps`. Record the installed versions in your report. Run the install with the environment variable `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` so no browser is downloaded. Commit nothing; the lockfile `package-lock.json` is created by npm.',
          'Create `.gitignore`: `node_modules`, `dist`, `test-results`, `playwright-report`, `coverage`, `.vite`, `*.log`, `.env`, `.env.*` with `!.env.example`, `docs/shots/`.',
          'Create `.env.example` documenting the only variable: `E2E_PORT=4173` (the port Playwright and `npm run dev` use). No secrets exist in this project.',
        ],
        verify: [
          exists('package.json', '.gitignore', '.env.example', 'node_modules/three/package.json', 'node_modules/howler/package.json', 'node_modules/vite/package.json', 'node_modules/vitest/package.json', 'node_modules/@playwright/test/package.json', 'node_modules/eslint/package.json', 'node_modules/pngjs/package.json'),
          json('package.json', 'type', 'module'),
          has('.gitignore', '^node_modules'),
          has('package.json', '"gates:full"'),
          has('package.json', '"engines"'),
          has('.env.example', 'E2E_PORT=4173'),
          has('.gitignore', 'docs/shots'),
        ],
      },
      {
        title: 'Vite, Vitest and ESLint configs plus the first unit test',
        items: [
          '`vite.config.js`: `base: \'/portfolio/\'`, `publicDir: \'assets\'`, `build.target: \'es2022\'`, `build.chunkSizeWarningLimit: 900`, `server.port` from `E2E_PORT` (default 4173). Default export. The folder `assets/` already exists and holds v1 files; it is the public dir from now on (ARCHITECTURE.md 10.2).',
          '`vitest.config.js`: node environment, `include: [\'tests/unit/**/*.test.js\']`, `testTimeout: 20000`.',
          '`eslint.config.js` (flat config): `@eslint/js` recommended; `no-undef` is an error; `no-unused-vars` is a warning with `argsIgnorePattern: \'^_\'`; browser globals for `src/**/*.js`, node globals for `scripts/**`, `tests/**`, `*.config.js` and `*.mjs` files in the repo root, browser plus node globals for `tests/e2e/**` (page code runs in the browser); ignore `dist`, `node_modules`, `assets`, `docs`, `test-results`, `playwright-report`, the legacy `js/` folder and the root `build.mjs` (plan 002 deletes both). `npm run lint` must exit 0 on the current repo.',
          '`scripts/lib/paths.mjs`: exports `repoRoot` (derived from `import.meta.url`, the folder that holds package.json), `fromRoot(...parts)` and `toPosix(p)`.',
          '`tests/unit/tooling.test.js`: asserts `repoRoot` contains `package.json`, that `vite.config.js` text contains the base and public dir values above, and that `toPosix` converts backslashes.',
          'Create empty folders by adding a `.gitkeep` only where a folder is otherwise empty: `tests/unit`, `tests/e2e`, `scripts`. Do not create `src/` yet (plan 002 does).',
        ],
        verify: [
          vt('tests/unit/tooling.test.js'),
          npm('lint'),
          has('vite.config.js', "base: '/portfolio/'"),
          has('vite.config.js', "publicDir: 'assets'"),
          has('vitest.config.js', 'tests/unit'),
        ],
      },
      {
        title: 'Playwright on the installed Chrome with a WebGL2 environment spec',
        items: [
          '`playwright.config.js`: `testDir: \'tests/e2e\'`, one worker, `fullyParallel: false`, `timeout: 120000`, `expect.timeout: 15000`, reporter `list`. `use`: `baseURL` `http://localhost:${E2E_PORT||4173}/portfolio/`, `channel: \'chrome\'`, `headless: true`, viewport 960x540, `launchOptions.args`: `--use-angle=swiftshader`, `--use-gl=angle`, `--enable-unsafe-swiftshader`, `--ignore-gpu-blocklist`. `webServer`: command `npm run dev -- --port <port> --strictPort`, url = baseURL, `reuseExistingServer: true`, timeout 120000.',
          '`tests/e2e/environment.spec.js`: opens `about:blank`, creates a canvas, asserts `getContext(\'webgl2\')` is not null and that `gl.getParameter(gl.VERSION)` is a non-empty string.',
          'If WebGL2 is not available with these flags, find flags that work (for example `--use-gl=angle --use-angle=swiftshader-webgl`, `--enable-features=Vulkan`, `--disable-gpu-sandbox`), change the config, and keep the working flags and the reason in a comment at the top of `playwright.config.js`; step 4 copies them into `docs/world-conventions.md`.',
          'Do not run `npx playwright install`. If Chrome is missing at `C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe`, write BLOCKED.md.',
        ],
        verify: [
          exists('playwright.config.js', 'tests/e2e/environment.spec.js'),
          pw('tests/e2e/environment.spec.js', 10),
          has('playwright.config.js', "channel: 'chrome'"),
        ],
      },
      {
        title: 'Gates runner, Pages workflow, conventions doc',
        items: [
          '`scripts/run-gates.mjs <group> [--strict] [--dry-run]`. Export `GATES` (object of groups, each an ordered array of `{ name, file, cmd }`) exactly as ARCHITECTURE.md 10.3 lists them (same names, same order), plus pure helpers: `selectGates(group, existsFn, { strict })` returning `[{ name, cmd, action: "run"|"skip"|"fail-missing" }]` (a missing file is `skip`, or `fail-missing` in strict mode) and `summarize(results)` where results are `{ name, status: "passed"|"failed"|"skipped" }` returning `{ passed, failed, skipped, ok }` (`ok` is false when anything failed or, in strict mode, anything was skipped). Behaviour: runs each entry in order with `child_process.spawnSync(cmd, { shell: true, stdio: \'inherit\' })`; if `file` does not exist the entry is SKIPPED (printed); `--strict` makes a skip a failure; `--dry-run` prints one line `RUN <name>: <cmd>` or `SKIP <name>` per entry, then the final line, and exits 0 without running anything (strict plus dry-run exits 1 when a file is missing); the first failing command stops the run with its exit code; final line `GATES <group>: <n> passed, <n> skipped`.',
          '`tests/unit/run-gates.test.js`: tests `selectGates` (skips missing files, strict turns skips into failures), `summarize`, and that the group lists contain every name from ARCHITECTURE.md 10.3 (for example `ledger`, `phone`, `buildings`, `playwright`, `budget`, `smoke`).',
          '`.github/workflows/pages.yml`: name `pages`; trigger only `push` with `branches: [main]` (no pull_request, no schedule, no workflow_dispatch of other branches); permissions `contents: read`, `pages: write`, `id-token: write`; job `build`: `actions/checkout@v4`, `actions/setup-node@v4` with node 20 and npm cache, `npm ci`, `npm run gates:ci`, `npm run build`, `actions/upload-pages-artifact@v3` with path `dist`; job `deploy` needs build, environment `github-pages`, `actions/deploy-pages@v4`.',
          '`tests/unit/workflow.test.js`: reads the YAML as text and asserts: triggers only on `main` pushes, contains `npm ci`, `npm run gates:ci`, `upload-pages-artifact`, `deploy-pages`, and does not contain `pull_request`.',
          '`docs/world-conventions.md` (repo working copy of ARCHITECTURE.md section 10, short; include the Playwright flags that work): script table, folder map, the headless rule, URL params, `__world` fields, test layout, asset rules (hosts, TLS, cache, manual drop-in, ledger), how screenshots work (`npm run shots`, available after plan 014), the rule that each plan creates new test files and freezes them.',
        ],
        verify: [
          vt('tests/unit/run-gates.test.js', 'tests/unit/workflow.test.js'),
          node('scripts/run-gates.mjs full --dry-run'),
          exists('.github/workflows/pages.yml', 'docs/world-conventions.md'),
          has('.github/workflows/pages.yml', 'branches: \\[main\\]'),
        ],
      },
    ],
    accept: [
      BRANCH,
      npm('lint'),
      vt('tests/unit/tooling.test.js', 'tests/unit/run-gates.test.js', 'tests/unit/workflow.test.js'),
      pw('tests/e2e/environment.spec.js', 10),
      node('scripts/run-gates.mjs ci --dry-run'),
    ],
    allowed: ['portfolio/package.json', 'portfolio/package-lock.json', 'portfolio/.gitignore', 'portfolio/.env.example', 'portfolio/vite.config.js', 'portfolio/vitest.config.js', 'portfolio/eslint.config.js', 'portfolio/playwright.config.js', 'portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/.github/workflows/pages.yml', 'portfolio/docs/world-conventions.md', 'portfolio/node_modules/**'],
    freeze: ['portfolio/vitest.config.js', 'portfolio/playwright.config.js', 'portfolio/scripts/run-gates.mjs', 'portfolio/tests/unit/tooling.test.js', 'portfolio/tests/unit/run-gates.test.js', 'portfolio/tests/unit/workflow.test.js', 'portfolio/tests/e2e/environment.spec.js'],
    donttouch: ['`js/`, `index.html`, `assets/` (plan 002 migrates them).'],
    blocked: ['Not on branch `world-v2`, Chrome not installed, or `npm install` cannot reach the registry: BLOCKED.md.'],
    human: 'Run the Pages workflow check once on GitHub after the first merge to main; switch Settings > Pages > Source to GitHub Actions (only after you approve the final result).',
  },

  // ---------------------------------------------------------------- 002
  {
    id: '002', name: 'port-v1-to-vite', title: 'Port the v1 game to ES modules on Vite and the current Three.js', epic: 'E1', est: 55, model: 'opus',
    arch: 'sections 1, 2, 9 and 10.2',
    goal: [
      'Move every v1 source file from `js/` to `src/` as normal ES modules, load Three.js, Howler and the post-processing passes from npm instead of CDN globals, remove `build.mjs`, `dist/`, `Xbot.js` and the 14-byte `Ybot.glb`, and prove the game still boots with zero console errors. The game must look and behave like v1 (boot, WASD and mouse, day/night clock, `?time=`, `T`, `E` near a landmark opens its dialogue, minimap).',
      'The resume PDF moves into `assets/` under the no-space name; the download file name stays `Kaviyarasu_Fullstack_Engineer_Resume.pdf`.',
    ],
    read: ['index.html', 'build.mjs', 'README.md', 'js/main.js', 'js/state.js', 'js/config.js', 'js/engine/renderer.js', 'js/engine/assets.js', 'js/entity/player.js', 'js/systems/interaction.js', 'js/util/three.js', 'assets/audio/CREDITS.md', 'vite.config.js', 'eslint.config.js'],
    steps: [
      {
        title: 'Move js/ to src/ with a one-off codemod and add the module imports',
        items: [
          'Write `scripts/dev/port-v1.mjs`: for every file under `js/` copy it to the same relative path under `src/` (`js/main.js` becomes `src/main.js`). Where a file uses `THREE.` add `import * as THREE from \'three\';` at the top. Where it uses `Howl` or `Howler` add `import { Howl, Howler } from \'howler\';`. Replace `THREE.GLTFLoader` with a named import from `three/addons/loaders/GLTFLoader.js`; `THREE.EffectComposer`, `THREE.RenderPass`, `THREE.UnrealBloomPass`, `THREE.ShaderPass`, `THREE.FXAAShader` with named imports from `three/addons/postprocessing/*.js` and `three/addons/shaders/FXAAShader.js`. Run it, check the result, then delete the script and the whole `js/` folder.',
          'Create `src/util/assetUrl.js` exporting `assetUrl(path)` = `import.meta.env.BASE_URL` + path with no double slash.',
          'Every relative import must still resolve (the old files used `.js` extensions already).',
        ],
        verify: [
          exists('src/main.js', 'src/state.js', 'src/config.js', 'src/world/buildings.js', 'src/world/terrain.js', 'src/systems/gameloop.js', 'src/entity/player.js', 'src/util/assetUrl.js'),
          absent('js'),
          has('src/engine/renderer.js', "from 'three'"),
          has('src/entity/player.js', 'GLTFLoader'),
        ],
      },
      {
        title: 'Make the code valid for the current Three.js, Vite and Howler',
        items: [
          '`tests/unit/migration/src.test.js` (write it first): scans every `.js` under `src/` and fails on: `window.THREE`, `XBOT_MODEL_DATA`, `THREE.GLTFLoader`, `THREE.EffectComposer`, `physicallyCorrectLights`, `.encoding =`, `sRGBEncoding`, `mergeBufferGeometries`, `THREE.Math.`, `window.Howl`, `window.Howler`, `atob(`; also fails when a file that contains `THREE.` has no `from \'three\'` import, when a relative import specifier does not resolve to an existing file, and when `scripts/dev/port-v1.mjs` still exists. It also asserts that `src/config.js` exports `LIGHT_UNIT`, that `src/systems/clock.js` uses it, and that no source string starts with `./assets/`.',
          'Fix the API drift between r147 and the installed Three.js: `renderer.outputColorSpace = THREE.SRGBColorSpace`; delete `physicallyCorrectLights`; textures use `.colorSpace`; `mergeBufferGeometries` is `mergeGeometries`; `THREE.Math` is `THREE.MathUtils`. Since r155 light intensities are physical. Add `export const LIGHT_UNIT = Math.PI;` to `src/config.js` and multiply by it EVERY place that sets a sun, hemisphere or ambient intensity: the constructor values in `scene.js` and the per-frame targets that `src/systems/clock.js` writes into `game.sun.intensity` and `game.hemi.intensity`. For the animated PointLights in `src/world/buildings.js` and `src/world/buildingAnims.js` (decay 2 is physical now) multiply by `LIGHT_UNIT * 3` as a starting value and tune by looking at a screenshot so glows are about as strong as v1. Leave `THREE.ColorManagement` at its default (enabled) and give every `CanvasTexture` `colorSpace = THREE.SRGBColorSpace`. With `EffectComposer` the tone mapping and colour space need an `OutputPass` at the end of the chain in this order: `RenderPass`, `UnrealBloomPass` (same strength, radius and threshold as v1), `OutputPass`, then the FXAA `ShaderPass` with its `resolution` uniform set from the view size and pixel ratio exactly as v1 did. The old CopyShader and LuminosityHighPassShader scripts are not needed any more.',
          '`src/systems/audio.js`: import `Howl` and `Howler` from `howler` (drop the `window.` prefix) and set the audio base to `assetUrl(\'audio\')` (the public dir is `assets/`, so audio is served at `<base>/audio/...`). `src/main.js`: remove the `window.THREE` and global checks; the `DOMContentLoaded` bootstrap stays. `src/entity/player.js`: load `assets/models/Soldier.glb` with `GLTFLoader.load(assetUrl(\'models/Soldier.glb\'))` instead of the base64 string (plan 008 replaces this avatar; the v1 index-based clip selection stays as it is, plan 008 replaces the avatar).',
          '`src/config.js`: `WORLD_RADIUS` and the other constants stay as in v1 for now (plan 032 enlarges the world).',
        ],
        verify: [
          vt('tests/unit/migration/src.test.js'),
          npm('lint'),
        ],
      },
      {
        title: 'index.html, resume PDF, assets and cleanup',
        items: [
          '`tests/unit/migration/site.test.js` (write it first): `index.html` has no `<script src="http`, no `cdn.jsdelivr`, `cdnjs`, no `fonts.googleapis` or `fonts.gstatic`, has `<script type="module" src="/src/main.js">` and `<link rel="icon" href="data:,">`; `src/config.js` sets `RESUME_HREF` with `assetUrl(`; the interaction code still uses the download name `Kaviyarasu_Fullstack_Engineer_Resume.pdf`; `docs/images/screenshot.png` exists, `assets/screenshot.png` does not, and README links `docs/images/screenshot.png`; README has a "Development" heading; the file `assets/models/Soldier.glb` is NOT asserted either way (plan 008 deletes it); `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` exists and its sha256 is `abfe286b1bbcf14a76585f5885a1a76414d9b2113ce1eb813ea99ebb5abf5d3f`; these paths do not exist: `build.mjs`, `dist`, `js`, `assets/models/Xbot.js`, `assets/models/Xbot.glb`, `assets/models/Ybot.glb`, `Kaviyarasu Full Stack Engineer Resume.pdf`; `README.md` does not mention `build.mjs`.',
          '`index.html`: remove every CDN `<script>` and the `Xbot.js`/`dist/bundle.js` scripts; add the module script; add `<link rel="icon" href="data:,">` so the browser does not request a missing favicon. Remove the three Google Fonts `<link>` tags (preconnects and stylesheet) now; the CSS font-family lists already fall back to system fonts and plan 009 adds the self-hosted fonts. All other CSS stays.',
          'Copy the PDF byte for byte (a node one-liner with `fs.copyFileSync`) to `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`, delete the original at the repo root, set `RESUME_HREF` in `src/config.js` to `assetUrl(\'Kaviyarasu_Fullstack_Engineer_Resume.pdf\')`; the download attribute in the interaction code keeps `Kaviyarasu_Fullstack_Engineer_Resume.pdf`.',
          'Move `assets/screenshot.png` to `docs/images/screenshot.png` and fix the README image link. Delete `build.mjs`, `dist/`, `assets/models/Xbot.js`, `assets/models/Xbot.glb`, `assets/models/Ybot.glb`. Keep `assets/models/Soldier.glb` for now (plan 008 removes it); do not assert its presence in any test.',
          'Update the README "Notes" and add a short "Development" section: `npm ci`, `npm run dev`, `npm run build`, `npm test`.',
        ],
        verify: [
          vt('tests/unit/migration/site.test.js'),
          npm('build', 15),
          exists('dist/index.html'),
          none('dist/index.html', 'cdn\\.jsdelivr|cdnjs\\.cloudflare'),
        ],
      },
      {
        title: 'Boot smoke spec: zero console errors and a rendered canvas',
        items: [
          '`tests/e2e/helpers/pixels.js`: `async function canvasLooksRendered(page)` takes `page.locator("#game-canvas").screenshot()` (a PNG of the WebGL canvas only, so HUD overlays cannot fake it), decodes it with `pngjs`, quantizes each pixel to 4 bits per channel and returns true when at least 12 distinct colours exist.',
          '`tests/e2e/smoke.spec.js`: collects `console` messages of type `error`, `pageerror` and `requestfailed`; opens the base URL; waits until `#loader` has class `hidden` (up to 90 s); waits 1.5 s; asserts the collected error list is empty and `canvasLooksRendered`. This is the boot smoke test of R4 and also runs in CI.',
          'Run it. Fix the root cause of every console error (a missing file, a bad import, a Three.js API change). Do not filter errors in the test.',
        ],
        verify: [
          exists('tests/e2e/smoke.spec.js', 'tests/e2e/helpers/pixels.js'),
          pw('tests/e2e/smoke.spec.js', 15),
        ],
      },
    ],
    accept: [
      npm('lint'),
      vt('tests/unit/migration/src.test.js', 'tests/unit/migration/site.test.js'),
      npm('build', 15),
      pw('tests/e2e/smoke.spec.js', 15),
    ],
    allowed: ['portfolio/src/**', 'portfolio/js/**', 'portfolio/index.html', 'portfolio/assets/**', 'portfolio/build.mjs', 'portfolio/dist/**', 'portfolio/README.md', 'portfolio/docs/images/**', 'portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/Kaviyarasu Full Stack Engineer Resume.pdf'],
    freeze: ['portfolio/tests/unit/migration/src.test.js', 'portfolio/tests/unit/migration/site.test.js', 'portfolio/tests/e2e/smoke.spec.js', 'portfolio/tests/e2e/helpers/pixels.js'],
    human: 'Open `npm run dev` and compare with https://kaviyarasu-dev.github.io/portfolio/ : same island, same look, you can walk and open dialogues.',
    blocked: ['If the game cannot boot after fixing every console error, write BLOCKED.md with the last error and the file.'],
  },

  // ---------------------------------------------------------------- 003
  {
    id: '003', name: 'world-hook-and-params', title: 'URL params, seeded RNG, the dev-only window.__world hook and v1 behaviour tests', epic: 'E1', est: 45,
    arch: 'sections 4, 7 and 10.5',
    goal: [
      'Create the test seams every later plan uses: one URL-parameter parser, a seeded random generator used everywhere instead of `Math.random`, the dev-only `window.__world` hook, a production check that the hook is absent from the build, and Playwright tests that lock in the v1 behaviours that must survive (boot, WASD, `?time=`, `T`, `E` dialogue).',
    ],
    read: ['src/main.js', 'src/state.js', 'src/util/rng.js', 'src/systems/clock.js', 'src/systems/input.js', 'src/systems/interaction.js', 'src/ui/hud.js', 'src/world/zones.js', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'URL parameter parser',
        items: [
          '`tests/unit/util/urlParams.test.js` first. `src/util/urlParams.js` exports `parseParams(search)` returning `{ time, weather, seed, quality, only, fixture, debug, freeze }`: `time` a float clamped to 0..1 or `null` when missing or not a number; `weather` one of `clear|cloudy|mist|rain` else `null`; `seed` an integer, default 1337; `quality` one of `low|medium|high` else `null`; `only` an array of ids from a comma list (empty array when missing, ids trimmed, only `[a-z0-9-]` kept); `fixture` a string matching `[a-z0-9-]+` else `null`; `debug` boolean. Also exports `getParams()` that caches `parseParams(window.location.search)` and works when `window` is undefined (returns defaults).',
          'Edge cases to test and their defined results: `?time=abc` and `?time=` give null; `?time=-1` and `?time=2` clamp to 0 and 1 (v1 ignored out-of-range values; the clamp is the new rule); `?seed=12.7` floors to 12; a negative or non-numeric seed gives 1337; `?only=a,,b%20` gives `["a","b"]` (ids are trimmed, lower-cased, an id that contains a character outside `[a-z0-9-]` is dropped); `?weather=snow` null; duplicate keys: the first wins; empty string gives all defaults; `debug` and `freeze` are true for `?debug`/`?freeze`, `=1` and `=true`, false for `=0`, `=false` and absence.',
          'Replace the ad-hoc `URLSearchParams` use for `time` in `src/systems/clock.js` with `getParams().time`, and make `freeze` real: when `getParams().freeze` is true `updateClock` keeps `dayFraction` at the start value plus the `T` presses (the real-time part is not added). Add `tests/unit/systems/clockFreeze.test.js` for the pure helper you extract (`dayFractionAt({ nowMs, offsetMs, advance, frozen, startFraction })`): frozen ignores `nowMs`, unfrozen wraps at 1, `T` advance of 0.07 applies in both.',
        ],
        verify: [vt('tests/unit/util/urlParams.test.js'), has('src/systems/clock.js', 'getParams')],
      },
      {
        title: 'Seeded RNG everywhere',
        items: [
          '`tests/unit/util/rng.test.js` first: same seed gives the same sequence; different seeds differ; values are in [0,1); `rngFor(name)` is stable per name and differs between names; and a scan test that fails when any file under `src/` (except `src/util/rng.js`) contains `Math.random`.',
          '`src/util/rng.js` keeps the existing `rand(seed)` export and adds `createRng(seed)` (mulberry32 returning a function) and `rngFor(name, seed = getParams().seed)` = `createRng(fnv1a(name) ^ seed)` (pass the seed explicitly in tests; do not depend on the cached params).',
          'Replace all 36 `Math.random` uses under `src/` with a generator from `rngFor(\'<module name>\')` created once per module (not per call).',
        ],
        verify: [vt('tests/unit/util/rng.test.js')],
      },
      {
        title: 'Dev-only world hook and the production check',
        items: [
          '`src/dev/worldHook.js` exports `installWorldHook({ game, clock, openDialogue })` (`game` is the shared state object, `clock` is `{ getTime, setTime }` that you add to `src/systems/clock.js` as exports, `openDialogue` from `src/ui/hud.js`) and defines `window.__world` with the fields listed in ARCHITECTURE.md 10.5 that can exist now: `ready`, `teleport(zoneIdOrX, z, y, yaw)` (a zone id puts the player 2 m south, +z, of the zone position; `y` is optional and defaults to the terrain height; `yaw` is optional and sets the player facing and the camera yaw; the velocity and the movement keys are reset), `playerState()` (`{x,y,z,yaw,moving,sprinting}`), `setTime(f)`, `time()`, `quality()` (returns `\'high\'` until plan 011), `listDoors()`, `listLights()`, `listObjects()`, `listNpcs()` (all return `[]` for now), `rendererInfo()` (reads `renderer.info.render.calls`, `.triangles`, `memory.textures`, `memory.geometries`; because the effect composer renders several passes per frame, set `renderer.info.autoReset = false` in `initRenderer` and call `renderer.info.reset()` once at the start of `renderFrame`, and keep a copy of the last complete frame so `rendererInfo()` returns the whole frame, not the last pass), `audioState()` (`{}`), `openDialogue(zoneId, key)` (the key is ignored until plan 017; the hook may skip the interaction radius close logic by setting `game.activeZone`), `cameraMode()` (`\'third\'`), `setWeather()` (no-op), `setCamera()` (no-op).',
          'In `src/main.js` install it only inside `if (import.meta.env.MODE !== \'production\') { ... await import(\'./dev/worldHook.js\') ... }` after the loop starts, and set `ready` true after the first frame. The production build must not contain the string `__world`.',
          '`scripts/check-prod-hook.mjs`: scans `dist/` (every file with the extension `.js .mjs .css .html .json .map .txt`) for `__world` and `worldHook`; exports `checkProdHook(distDir)` returning `{ ok, hits: [file...], missing }`; the CLI part only runs when the file is executed directly (compare `import.meta.url` with `process.argv[1]`) and exits 1 with the file list when found, 2 when `dist/` is missing, else 0. Write `tests/unit/scripts/prodHook.test.js` that runs the exported check function against a temp folder with and without the string.',
        ],
        verify: [
          vt('tests/unit/scripts/prodHook.test.js'),
          exists('src/dev/worldHook.js', 'scripts/check-prod-hook.mjs'),
          npm('build', 15),
          node('scripts/check-prod-hook.mjs'),
        ],
      },
      {
        title: 'Playwright: the hook and the v1 behaviours that must survive',
        items: [
          '`tests/e2e/world-hook.spec.js`: wait for `window.__world.ready`; `teleport(\'library\')` puts the player within 12 m of the library zone; `playerState()` has numeric fields; `rendererInfo().calls` is a number greater than 0; `openDialogue(\'plaza\')` makes `#dialogue` get class `visible`.',
          '`tests/e2e/v1-behaviour.spec.js`: holding `w` for 800 ms moves the player at least 1 m (compare `playerState()` before and after); holding `Shift`+`w` moves farther than `w` alone over the same time; opening with `?time=0.75&freeze=1` gives `time()` within 0.001 of 0.75 and still within 0.001 after 3 s; pressing `t` changes `time()` by at least 0.07 within 1 s (read `time()` right before and after); `teleport("library")` then `e` makes `#dialogue` visible within 2 s (v1 opens the dialogue only on `E`), and teleporting 15 m away hides it within 1.5 s (v1 closes it by distance). Start every movement test with `teleport(0, 20, undefined, 0)` on open ground at the old plaza area facing +z, wait for `ready` first and read `time()` immediately after `ready`; hold keys with `page.keyboard.down` and poll `playerState()` until the distance moved is at least 1 m or 10 s pass (software WebGL is slow, so assert on distance reached, not on elapsed time); sprint must reach the same distance in less poll time than walking.',
        ],
        verify: [pw('tests/e2e/world-hook.spec.js', 15), pw('tests/e2e/v1-behaviour.spec.js', 15)],
      },
    ],
    accept: [
      npm('lint'),
      vt('tests/unit/util/urlParams.test.js', 'tests/unit/util/rng.test.js', 'tests/unit/scripts/prodHook.test.js'),
      npm('build', 15),
      node('scripts/check-prod-hook.mjs'),
      pw('tests/e2e/world-hook.spec.js', 15),
      pw('tests/e2e/v1-behaviour.spec.js', 15),
    ],
    allowed: ['portfolio/src/**', 'portfolio/scripts/check-prod-hook.mjs', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/util/urlParams.test.js', 'portfolio/tests/unit/util/rng.test.js', 'portfolio/tests/unit/scripts/prodHook.test.js', 'portfolio/tests/e2e/world-hook.spec.js', 'portfolio/tests/e2e/v1-behaviour.spec.js'],
  },

  // ---------------------------------------------------------------- 004
  {
    id: '004', name: 'privacy-contact', title: 'Remove the phone number and add the email click-to-reveal', epic: 'E1', est: 35,
    arch: 'sections 3, 7 (Privacy) and decisions D26, D30, D31',
    goal: [
      'The phone number must disappear from the website code, content, pages and build (the resume PDF is the one exception and stays untouched, D31). The email becomes a click-to-reveal button built by script so it never appears as plain text in HTML. LinkedIn and GitHub stay.',
    ],
    read: ['src/content/contact.js', 'src/content/dialogues.js', 'src/ui/hud.js', 'src/util/dom.js', 'README.md', 'index.html'],
    steps: [
      {
        title: 'Phone check script and phone removal',
        items: [
          '`scripts/check-phone.mjs` (exports `scanForPhone(rootDir)` and runs it from the CLI): scans text files (`.js .mjs .json .html .css .md .txt .svg .xml`) under `src/`, `assets/`, `dist/` (when it exists), plus `index.html` and `README.md`; skips the resume PDF by name; fails (exit 1, prints file:line) on a match of the digits `63839 64471` in any spacing or punctuation (regex `6\\D{0,2}3\\D{0,2}8\\D{0,2}3\\D{0,2}9\\D{0,3}6\\D{0,2}4\\D{0,2}4\\D{0,2}7\\D{0,2}1`), on `tel:` when not preceded by a letter (regex `(?<![A-Za-z])tel:`, so `hotel:` is fine) and on the literal email `kaviyarasu.m.dev@gmail.com`. The scope is exactly `src/`, `assets/` (text files only), `dist/` when present (a missing `dist/` is not an error), `index.html` and `README.md`; never `tests/`, `docs/` or the PDF. Export `scanForPhone(rootDir)` returning `[{ file, line, rule }]`.',
          '`tests/unit/scripts/phone.test.js`: builds temp folders to prove the scanner flags `+91 63839 64471`, `6383964471`, `63839-64471`, `tel:+91...` and the plain email, ignores a `.pdf` file, and passes a clean folder.',
          'Remove the `phone` field from `src/content/contact.js` and the Phone row (the `tel:` link) from the lighthouse dialogue in `src/content/dialogues.js`; remove "phone" from the README zone table. Search the whole repo (not docs/plans) for any other copy and remove it.',
        ],
        verify: [vt('tests/unit/scripts/phone.test.js'), node('scripts/check-phone.mjs'), none('src/content/contact.js', 'phone', 'i'), none('README.md', 'phone', 'i'), none('src/content/dialogues.js', 'Phone', 'i')],
      },
      {
        title: 'Email click-to-reveal component',
        items: [
          '`tests/unit/ui/emailReveal.test.js` first. `src/ui/emailReveal.js` exports `buildEmail(parts)` (joins the pieces) and `createEmailReveal({ label = \'Show email\', parts = contact.emailParts }, doc = document)` (so a test passes a fake `doc` that implements only `createElement`, `createTextNode`, and on elements `appendChild`, `setAttribute`, `addEventListener`, `replaceWith`, `textContent`; `buildEmail(parts)` is `parts.join(\'@\')`) returning a `<button class="email-reveal" type="button">` DOM node; on click it replaces itself with `<a href="mailto:...">address</a>` (rel noopener, text set with `textContent`, never `innerHTML`). It must run in Vitest: use a minimal fake `document` object passed in, or `jsdom` is NOT available, so the module takes `doc = document` as an optional argument.',
          '`src/content/contact.js` stores the address as two parts, `emailParts: [\'kaviyarasu.m.dev\', \'gmail.com\']`; there is no field containing the full address. Update every dialogue that showed `contact.email` (plaza "Reach" row and the lighthouse contact dialogue) to use the reveal button instead. Add a button style to the dialogue CSS in `index.html` that matches the existing `.chip` look.',
          'Unit test also scans `src/` and `index.html` and fails when the contiguous string `kaviyarasu.m.dev@gmail.com` or `mailto:kaviyarasu` appears.',
        ],
        verify: [vt('tests/unit/ui/emailReveal.test.js'), has('src/content/contact.js', 'emailParts'), none('src/content/contact.js', 'email:')],
      },
      {
        title: 'Playwright: reveal works and no phone is visible',
        items: [
          '`tests/e2e/email-reveal.spec.js`: `teleport(\'lighthouse\')` (so the v1 distance close logic keeps the dialogue open) then `openDialogue(\'lighthouse\')`; the dialogue text does not match the phone regex and has no `a[href^="tel:"]`; it contains LinkedIn and GitHub links; there is a `button.email-reveal`; after clicking it a link whose `href` is `mailto:kaviyarasu.m.dev@gmail.com` appears. Same for the `plaza` dialogue.',
        ],
        verify: [pw('tests/e2e/email-reveal.spec.js', 10), npm('build', 15), node('scripts/check-phone.mjs')],
      },
    ],
    accept: [
      npm('lint'),
      vt('tests/unit/scripts/phone.test.js', 'tests/unit/ui/emailReveal.test.js'),
      npm('build', 15),
      node('scripts/check-phone.mjs'),
      pw('tests/e2e/email-reveal.spec.js', 10),
    ],
    allowed: ['portfolio/src/**', 'portfolio/index.html', 'portfolio/README.md', 'portfolio/scripts/check-phone.mjs', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/scripts/phone.test.js', 'portfolio/tests/unit/ui/emailReveal.test.js', 'portfolio/tests/e2e/email-reveal.spec.js'],
    donttouch: ['The resume PDF in `assets/` (must stay byte-identical).'],
    human: 'The downloadable resume PDF still contains your phone number (your choice, D31). Replace the PDF yourself if that changes.',
  },
];
