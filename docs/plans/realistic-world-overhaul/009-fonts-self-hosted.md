# Plan 009: Self-host Inter, Orbitron and Noto Sans Tamil (OFL) and drop Google Fonts

Epic E1. Estimated turns: 40.

## Goal

No font request may leave the site: Inter, Orbitron and Noto Sans Tamil (all OFL) are copied from the `@fontsource` packages into `assets/fonts/` with their licence texts, declared by `@font-face`, and the Google Fonts links disappear. A script checks that no CDN is used anywhere in the page or the build.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1, 10.2 and assumptions A9, A26, A28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/index.html`
- src/main.js
- scripts/lib/ledger.mjs
- scripts/lib/ledgerRules.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Install the packages and sync the font files

Deliver:
- Install with `--save-dev --save-exact`: `@fontsource/inter`, `@fontsource/orbitron`, `@fontsource/noto-sans-tamil` (a source for the copy script only; this npm install is the one permitted non-asset-script download, like plan 001).
- `scripts/sync-fonts.mjs`: copies from `node_modules/@fontsource/<pkg>/files/<pkg>-<subset>-<weight>-normal.woff2` exactly these 14 files to `assets/fonts/<family>-<subset>-<weight>.woff2`: Inter latin 400, 500, 600, 700, 800; Orbitron latin 500, 700, 900; Noto Sans Tamil latin 400, 600, 700 and tamil 400, 600, 700; copies each package `LICENSE` to `assets/licenses/OFL-<family>.txt`; writes ledger entries through `addEntry` of `scripts/lib/ledger.mjs` (licence `OFL`, source `https://www.npmjs.com/package/@fontsource/<name>`, author = the text after `Copyright` on the first copyright line of the copied licence file, for example `The Inter Project Authors`, notes `font <family> <weight>`). Idempotent.
- Run it. `tests/unit/fonts/files.test.js`: all 14 font files exist, the OFL text for Noto Sans Tamil exists and contains `SIL OPEN FONT LICENSE`, all three family licence files exist, every font file has a ledger entry with licence `OFL` and a non-empty author, total font bytes are under 1.5 MB.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/fonts/files.test.js`
- `node "{{runner}}/assert.mjs" exists assets/fonts/noto-sans-tamil-tamil-400.woff2 assets/licenses/OFL-noto-sans-tamil.txt scripts/sync-fonts.mjs`

### Step 2: @font-face, index.html and the no-CDN check

Deliver:
- `src/styles/fonts.css` with one `@font-face` per file (`font-display: swap`, `unicode-range` for the Tamil subset U+0B80-0BFF), urls like `/fonts/inter-latin-400.woff2` (Vite rewrites them with the base). Import it from `src/main.js`.
- Google Fonts links are already gone (plan 002); make sure `index.html` has none. Add `"Noto Sans Tamil"` to the CSS `font-family` stacks of the body text and of the Orbitron headings after the Latin family, so Tamil text uses it. Each `@font-face` has `font-display: swap`; the Tamil faces carry `unicode-range: U+0B80-0BFF` and the Latin Noto faces `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`; urls look like `/fonts/inter-latin-400.woff2` (Vite rewrites them with the base).
- `scripts/check-no-cdn.mjs`: scans `index.html`, `credits.html` when present, `src/` and `dist/` (only these exact hosts are flagged; other URLs inside the bundled libraries are ignored) for the hosts `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com`, `ajax.googleapis.com`, `kit.fontawesome.com`; exit 1 with file:line on a hit, exit 0 otherwise. Export `scanForCdn(root)` returning `[{ file, line, host }]`; `tests/unit/scripts/noCdn.test.js` covers each of the seven hosts, the CLI exit code and the `file:line` output, `credits.html`, a clean folder and ignoring `docs/`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/noCdn.test.js`
- `node "{{runner}}/assert.mjs" exists src/styles/fonts.css scripts/check-no-cdn.mjs`
- `node "{{runner}}/assert.mjs" none index.html "fonts\.googleapis|fonts\.gstatic"`

### Step 3: Playwright: fonts load locally

Deliver:
- `tests/e2e/fonts.spec.js`: record all request hosts during load: none other than the dev server host; `await document.fonts.load('700 16px Orbitron')` resolves with at least one face and `await document.fonts.load('400 16px "Noto Sans Tamil"', 'தமிழ்')` (pass Tamil text, otherwise the Tamil unicode-range face is not selected) resolves with a face whose `status` is `loaded` and whose `unicodeRange` includes `U+0B80`; `document.fonts.check` is true for both with the Tamil sample text; zero console errors.
- Run `npm run build` and `node scripts/check-no-cdn.mjs`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/fonts.spec.js`
- `npm run build`
- `node scripts/check-no-cdn.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/fonts/files.test.js tests/unit/scripts/noCdn.test.js`
- `npm run build`
- `node scripts/check-no-cdn.mjs`
- `npx playwright test tests/e2e/fonts.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
