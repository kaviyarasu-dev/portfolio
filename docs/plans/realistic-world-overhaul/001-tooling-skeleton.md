# Plan 001: Tooling skeleton: package, Vite, Vitest, ESLint, Playwright, gates runner, CI workflow

Epic E1. Estimated turns: 45.

## Goal

Turn the repo into a Node project with every tool the later plans need, without touching the v1 game code yet: package.json with pinned dependencies, Vite config (base `/portfolio/`, public dir `assets/`), Vitest, ESLint, Playwright on the installed Chrome with a working WebGL check, the gates runner (`scripts/run-gates.mjs`) that every later plan relies on, the GitHub Pages workflow limited to `main`, and `docs/world-conventions.md`.

You are on branch `world-v2`. If `git branch --show-current` prints anything else, write BLOCKED.md saying "run: git switch -c world-v2 in portfolio, then run the runner again" and stop. Never switch branches yourself.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 2, 8, 9 and 10.3)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/README.md`
- `portfolio/index.html`
- `portfolio/js/config.js`
- `portfolio/docs/specs/2026-10-30-realistic-world-overhaul-design.md`

High-risk assumptions that touch this plan (each has a step that checks it):
- The machine has no Playwright browsers: tests use the installed Chrome (`channel: 'chrome'`) and software WebGL. Step 3 proves WebGL2 works with the chosen flags before anything depends on it.

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: package.json, dependencies, .gitignore, .env.example

Deliver:
- Check `git branch --show-current` is `world-v2` (see Goal).
- Create `package.json`: name `portfolio-world`, `private: true`, `type: "module"`, `engines.node` ">=20". Scripts: `dev` (vite), `build` (vite build), `preview` (vite preview), `test` (vitest run), `test:e2e` (playwright test --pass-with-no-tests), `lint` (eslint .), `gates:full` (node scripts/run-gates.mjs full), `gates:e2e` (node scripts/run-gates.mjs e2e), `gates:ci` (node scripts/run-gates.mjs ci), `check:ledger`, `check:size`, `check:budget`, `check:buildings`, `check:content`, `check:phone`, `check:prod-hook`, `check:no-cdn` (each `node scripts/check-<name>.mjs`), `credits` (node scripts/generate-credits.mjs), `shots` (node scripts/shots.mjs). The check scripts do not exist yet; later plans create them and the gates runner skips a missing one.
- Install exact versions (use `--save-exact`): dependencies `three` and `howler`; devDependencies `vite`, `vitest`, `@playwright/test`, `eslint`, `@eslint/js`, `globals`, `pngjs`. Use the latest releases that npm accepts without peer-dependency conflicts; ESLint and `@eslint/js` must be the same major version and flat config must work; never use `--force` or `--legacy-peer-deps`. Record the installed versions in your report. Run the install with the environment variable `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` so no browser is downloaded. Commit nothing; the lockfile `package-lock.json` is created by npm.
- Create `.gitignore`: `node_modules`, `dist`, `test-results`, `playwright-report`, `coverage`, `.vite`, `*.log`, `.env`, `.env.*` with `!.env.example`, `docs/shots/`.
- Create `.env.example` documenting the only variable: `E2E_PORT=4173` (the port Playwright and `npm run dev` use). No secrets exist in this project.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" exists package.json .gitignore .env.example node_modules/three/package.json node_modules/howler/package.json node_modules/vite/package.json node_modules/vitest/package.json node_modules/@playwright/test/package.json node_modules/eslint/package.json node_modules/pngjs/package.json`
- `node "{{runner}}/assert.mjs" json package.json type module`
- `node "{{runner}}/assert.mjs" has .gitignore "^node_modules"`
- `node "{{runner}}/assert.mjs" has package.json ""gates:full""`
- `node "{{runner}}/assert.mjs" has package.json ""engines""`
- `node "{{runner}}/assert.mjs" has .env.example "E2E_PORT=4173"`
- `node "{{runner}}/assert.mjs" has .gitignore "docs/shots"`

### Step 2: Vite, Vitest and ESLint configs plus the first unit test

Deliver:
- `vite.config.js`: `base: '/portfolio/'`, `publicDir: 'assets'`, `build.target: 'es2022'`, `build.chunkSizeWarningLimit: 900`, `server.port` from `E2E_PORT` (default 4173). Default export. The folder `assets/` already exists and holds v1 files; it is the public dir from now on (ARCHITECTURE.md 10.2).
- `vitest.config.js`: node environment, `include: ['tests/unit/**/*.test.js']`, `testTimeout: 20000`.
- `eslint.config.js` (flat config): `@eslint/js` recommended; `no-undef` is an error; `no-unused-vars` is a warning with `argsIgnorePattern: '^_'`; browser globals for `src/**/*.js`, node globals for `scripts/**`, `tests/**`, `*.config.js` and `*.mjs` files in the repo root, browser plus node globals for `tests/e2e/**` (page code runs in the browser); ignore `dist`, `node_modules`, `assets`, `docs`, `test-results`, `playwright-report`, the legacy `js/` folder and the root `build.mjs` (plan 002 deletes both). `npm run lint` must exit 0 on the current repo.
- `scripts/lib/paths.mjs`: exports `repoRoot` (derived from `import.meta.url`, the folder that holds package.json), `fromRoot(...parts)` and `toPosix(p)`.
- `tests/unit/tooling.test.js`: asserts `repoRoot` contains `package.json`, that `vite.config.js` text contains the base and public dir values above, and that `toPosix` converts backslashes.
- Create empty folders by adding a `.gitkeep` only where a folder is otherwise empty: `tests/unit`, `tests/e2e`, `scripts`. Do not create `src/` yet (plan 002 does).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/tooling.test.js`
- `npm run lint`
- `node "{{runner}}/assert.mjs" has vite.config.js "base: '/portfolio/'"`
- `node "{{runner}}/assert.mjs" has vite.config.js "publicDir: 'assets'"`
- `node "{{runner}}/assert.mjs" has vitest.config.js "tests/unit"`

### Step 3: Playwright on the installed Chrome with a WebGL2 environment spec

Deliver:
- `playwright.config.js`: `testDir: 'tests/e2e'`, one worker, `fullyParallel: false`, `timeout: 120000`, `expect.timeout: 15000`, reporter `list`. `use`: `baseURL` `http://localhost:${E2E_PORT||4173}/portfolio/`, `channel: 'chrome'`, `headless: true`, viewport 960x540, `launchOptions.args`: `--use-angle=swiftshader`, `--use-gl=angle`, `--enable-unsafe-swiftshader`, `--ignore-gpu-blocklist`. `webServer`: command `npm run dev -- --port <port> --strictPort`, url = baseURL, `reuseExistingServer: true`, timeout 120000.
- `tests/e2e/environment.spec.js`: opens `about:blank`, creates a canvas, asserts `getContext('webgl2')` is not null and that `gl.getParameter(gl.VERSION)` is a non-empty string.
- If WebGL2 is not available with these flags, find flags that work (for example `--use-gl=angle --use-angle=swiftshader-webgl`, `--enable-features=Vulkan`, `--disable-gpu-sandbox`), change the config, and keep the working flags and the reason in a comment at the top of `playwright.config.js`; step 4 copies them into `docs/world-conventions.md`.
- Do not run `npx playwright install`. If Chrome is missing at `C:\Program Files\Google\Chrome\Application\chrome.exe`, write BLOCKED.md.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" exists playwright.config.js tests/e2e/environment.spec.js`
- `npx playwright test tests/e2e/environment.spec.js`
- `node "{{runner}}/assert.mjs" has playwright.config.js "channel: 'chrome'"`

### Step 4: Gates runner, Pages workflow, conventions doc

Deliver:
- `scripts/run-gates.mjs <group> [--strict] [--dry-run]`. Export `GATES` (object of groups, each an ordered array of `{ name, file, cmd }`) exactly as ARCHITECTURE.md 10.3 lists them (same names, same order), plus pure helpers: `selectGates(group, existsFn, { strict })` returning `[{ name, cmd, action: "run"|"skip"|"fail-missing" }]` (a missing file is `skip`, or `fail-missing` in strict mode) and `summarize(results)` where results are `{ name, status: "passed"|"failed"|"skipped" }` returning `{ passed, failed, skipped, ok }` (`ok` is false when anything failed or, in strict mode, anything was skipped). Behaviour: runs each entry in order with `child_process.spawnSync(cmd, { shell: true, stdio: 'inherit' })`; if `file` does not exist the entry is SKIPPED (printed); `--strict` makes a skip a failure; `--dry-run` prints one line `RUN <name>: <cmd>` or `SKIP <name>` per entry, then the final line, and exits 0 without running anything (strict plus dry-run exits 1 when a file is missing); the first failing command stops the run with its exit code; final line `GATES <group>: <n> passed, <n> skipped`.
- `tests/unit/run-gates.test.js`: tests `selectGates` (skips missing files, strict turns skips into failures), `summarize`, and that the group lists contain every name from ARCHITECTURE.md 10.3 (for example `ledger`, `phone`, `buildings`, `playwright`, `budget`, `smoke`).
- `.github/workflows/pages.yml`: name `pages`; trigger only `push` with `branches: [main]` (no pull_request, no schedule, no workflow_dispatch of other branches); permissions `contents: read`, `pages: write`, `id-token: write`; job `build`: `actions/checkout@v4`, `actions/setup-node@v4` with node 20 and npm cache, `npm ci`, `npm run gates:ci`, `npm run build`, `actions/upload-pages-artifact@v3` with path `dist`; job `deploy` needs build, environment `github-pages`, `actions/deploy-pages@v4`.
- `tests/unit/workflow.test.js`: reads the YAML as text and asserts: triggers only on `main` pushes, contains `npm ci`, `npm run gates:ci`, `upload-pages-artifact`, `deploy-pages`, and does not contain `pull_request`.
- `docs/world-conventions.md` (repo working copy of ARCHITECTURE.md section 10, short; include the Playwright flags that work): script table, folder map, the headless rule, URL params, `__world` fields, test layout, asset rules (hosts, TLS, cache, manual drop-in, ledger), how screenshots work (`npm run shots`, available after plan 014), the rule that each plan creates new test files and freezes them.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/run-gates.test.js tests/unit/workflow.test.js`
- `node scripts/run-gates.mjs full --dry-run`
- `node "{{runner}}/assert.mjs" exists .github/workflows/pages.yml docs/world-conventions.md`
- `node "{{runner}}/assert.mjs" has .github/workflows/pages.yml "branches: \[main\]"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).
- `js/`, `index.html`, `assets/` (plan 002 migrates them).

## Acceptance

Run every command below before the final report. All must exit 0.

- `node -e "process.exit(require('child_process').execSync('git branch --show-current').toString().trim()==='world-v2'?0:1)"`
- `npm run lint`
- `npx vitest run tests/unit/tooling.test.js tests/unit/run-gates.test.js tests/unit/workflow.test.js`
- `npx playwright test tests/e2e/environment.spec.js`
- `node scripts/run-gates.mjs ci --dry-run`

Human check (goes in the report, never blocks): Run the Pages workflow check once on GitHub after the first merge to main; switch Settings > Pages > Source to GitHub Actions (only after you approve the final result).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Not on branch `world-v2`, Chrome not installed, or `npm install` cannot reach the registry: BLOCKED.md.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
