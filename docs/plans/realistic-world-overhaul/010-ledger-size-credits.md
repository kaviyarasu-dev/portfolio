# Plan 010: Strict ledger check, size check and the generated credits page

Epic E1. Estimated turns: 45.

## Goal

Make the licence rules machine-enforced: `npm run check:ledger` fails on any shipped file without a proper CC0 (or OFL font, or the user's own PDF) entry, `npm run check:size` enforces the 80 MB total and 20 MB per file limits, and `scripts/generate-credits.mjs` writes `credits.html` and `CREDITS.md` from the ledger. At the end the whole `gates:full` group runs green for the first time.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3 (asset ledger) and 10.2, requirement R2)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/lib/ledgerRules.mjs
- scripts/lib/ledger.mjs
- assets/LEDGER.json
- vite.config.js
- scripts/run-gates.mjs
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: check-ledger

Deliver:
- `scripts/check-ledger.mjs` (export `checkLedger({ root })` returning `{ problems }`; the CLI exits 1 and prints every problem): walks `assets/`; every file for which `isLedgerExempt` (plan 005) is false needs exactly one entry (documentation and index files such as `CREDITS.md`, `INDEX.json`, `set.json` and the licence texts are exempt); every entry needs an existing file; each entry passes `validateEntry` from `ledgerRules.mjs` (licence rules, host rules, sha256 and bytes match); no duplicate `file`; no entry for a file outside `assets/`.
- `tests/unit/scripts/checkLedger.test.js` with temp trees (the exempt files are ignored; an entry whose `host` field differs from the hostname of `sourceUrl` is a problem; duplicate `file`; an entry for a file outside `assets/`): missing entry, extra entry, wrong sha, licence `CC-BY`, host `example.com`, OFL on a non-font, `OWN` on a non-PDF, a clean tree; plus one test that runs `checkLedger` on the real repo and expects no problems.
- Fix any real problem it reports on the current repo: a file whose real source is known gets its entry through `ledger-add`; a file with no known source or a non-CC0 licence is DELETED (never ledger a file with an invented source). Stray leftovers such as old `assets/models/*` files are deleted.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/checkLedger.test.js`
- `npm run check:ledger`

### Step 2: check-size

Deliver:
- `scripts/check-size.mjs` (export `checkSize({ root, totalMb = 80, fileMb = 20 })`, MB means 1048576 bytes): sums the bytes of every file under `assets/` (all files, exempt ones included); fails when the total exceeds the limit or any file is 20 MB or more; prints the five largest files and the total; options `--total-mb` and `--file-mb` override. Reserve the flag `--phone` (not implemented yet: it prints "phone budget arrives in plan 075" and exits 0).
- `tests/unit/scripts/checkSize.test.js`: temp trees at, below and above both limits (a file of exactly 20 MB fails, a total of exactly 80 MB passes), the `--total-mb` and `--file-mb` overrides, the five-largest list order and the `--phone` stub message with exit 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/checkSize.test.js`
- `npm run check:size`

### Step 3: Credits generator, credits.html in the build

Deliver:
- `scripts/generate-credits.mjs [--check]`: exports `renderCredits(ledger, licenseTexts)` where `licenseTexts` is an object `{ "<file name>": "<text>" }` of the files under `assets/licenses/`, returning `{ html, markdown }`, and `checkCredits({ root })` returning `{ ok, stale: [file...] }` (the `--check` logic); groups by source (host) then author, lists file counts and links; has a "Fonts" section that includes the full text of each `assets/licenses/OFL-*.txt` (HTML-escaped); has a CC0 notice. Writes `credits.html` and `CREDITS.md` at the repo root; with `--check` it exits 1 when either file is out of date and writes nothing. HTML uses the same dark theme colours as `index.html` (background `#05070c`, text `#f5f7fb`, accent `#7cc7ff`), no external resources (no `http` in any `src`, `href` or `url(` except the credited source links shown as plain `<a>` text links), `<meta name="viewport">`, a link back to `./`; the page shows a CC0 notice ("CC0 1.0 Universal, public domain dedication") and one section per source host with authors and file counts.
- `vite.config.js`: add `build.rollupOptions.input` with `main: 'index.html'` and `credits: 'credits.html'`. Add a small "Credits" link in a footer element `#credits-link` of `index.html` that is visible on every screen size (the `#help` panel is hidden under 800 px, so do not put it there) and opens `credits.html` in a new tab with `target="_blank" rel="noopener"`.
- `tests/unit/scripts/credits.test.js`: HTML-escaping of an author like `A <b>&"x`, OFL text included, the CC0 notice, one section per host, no external resource URLs, the viewport meta, deterministic output (two calls equal), `checkCredits` on a temp dir (fresh and stale). A second small test reads `index.html` and `vite.config.js`: the `#credits-link` has `rel="noopener"`, and `rollupOptions.input` names `credits.html`. Then generate the files for real.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/credits.test.js`
- `node scripts/generate-credits.mjs --check`
- `node "{{runner}}/assert.mjs" has vite.config.js "input"`
- `node "{{runner}}/assert.mjs" has index.html "id="credits-link""`

### Step 4: First green full gates run

Deliver:
- Run `npm run gates:full` for real. Entries whose script does not exist yet are SKIPPED (content, buildings, local detail); everything else must pass: lint, unit, build, no-cdn, prod-hook, phone, ledger, size, credits (read the output and confirm each of these nine says passed, none skipped). Fix a failure at its root by changing the code or data, never by weakening a check; if one cannot be fixed within this plan write BLOCKED.md naming the check.
- Add a section titled "Assets and ledger" to `docs/world-conventions.md` (how to add an asset: always through `packMaterial`, `packModel`, `synthSfx` or `ledger-add`; never by hand; what is exempt from the ledger; the 80 MB and 20 MB limits).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run gates:full`
- `node "{{runner}}/assert.mjs" has docs/world-conventions.md "Assets and ledger"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/checkLedger.test.js tests/unit/scripts/checkSize.test.js tests/unit/scripts/credits.test.js`
- `npm run gates:full`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
