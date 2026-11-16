# Plan 079: CI workflow hardening, logging rule, dependency audit and the strict final gates

Epic E8. Estimated turns: 60.

## Goal

The last plan: the production-readiness items that can be checked by a machine. The Pages workflow is tightened and tested, and its step order is checked against the Deploy section of the runbook written by plan 078; no stray `console.log` ships in `src/`; external links are safe; production dependencies have no known high or critical vulnerabilities (or the audit is reported as unavailable); dist size is bounded; both gate groups run in `--strict` mode with nothing skipped; and a final report records the honest state. Deploying itself is never a step: the person switches the Pages source and merges. This plan does NOT depend on plan 078 (plan 078 runs before this plan; this plan is last).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Logging, Dependencies, Performance checks), 8, 9 and 10.3 and requirement R13, decision D15, D27)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/plans/realistic-world-overhaul/ARCHITECTURE.md (sections 7, 8, 9, 10.3)
- docs/specs/2026-10-30-realistic-world-overhaul-design.md (section 6: release checks, the human checks list)
- .github/workflows/pages.yml (plan 001/002; rewritten here), tests/unit/workflow.test.js (plan 001, frozen: the workflow must not contain the word pull_request as raw text)
- docs/RUNBOOK.md (plan 078: its Deploy section is checked against the workflow here)
- scripts/run-gates.mjs (plan 001, frozen: do NOT edit the gate list), scripts/check-size.mjs (plans 001/014), scripts/check-phone.mjs (plan 004)
- eslint.config.js (plan 001, not frozen), vite.config.js (plans 001/002), package.json (plan 001: scripts), index.html
- src/**: the console calls (the streamer load log of plan 015 is the known case: plan 015 owns its fix; if 015 is not done, this plan changes that call to the dev-only pattern)
- the link-producing modules of plans 068, 069 and 070 (generated fallback HTML)
- docs/perf/phone-final.json (plan 075) and docs/perf/desktop-final.md (plan 076): numbers for the final report

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Workflow hardening, logging rule and external links

Deliver:
- `tests/unit/workflowFinal.test.js` first (new, frozen; plan 001 workflow test stays green). The workflow file `.github/workflows/pages.yml` must satisfy: the only trigger is `push` on `main` (no `pull_request`, no `schedule`; `workflow_dispatch` is REMOVED, and if present it must have an `if:` line containing `refs/heads/main` within 6 lines, checked by a text match); `concurrency` with group `pages` and `cancel-in-progress: false`; `permissions` limited to `contents: read`, `pages: write`, `id-token: write`; `actions/checkout`, `actions/setup-node` with `node-version: 20` and `cache: npm`, `actions/upload-pages-artifact` and `actions/deploy-pages`, every action pinned to a major version tag (no `@main`, no `@master`); the build job runs these steps in exactly this order (the test asserts ascending index): `npm ci`, `npm run gates:ci`, `npm run check:audit`, `npm run build`, `npm run check:dist`, upload `dist`; the deploy job `needs: build` and uses environment `github-pages`; `pages.yml` does not contain the word `pull_request` anywhere (comments included); the only `secrets.` reference allowed is `secrets.GITHUB_TOKEN` (or none). The same test asserts the Deploy-order check moved from plan 078: the step names in the `Deploy` section of `docs/RUNBOOK.md` appear in the same ascending order as the workflow steps above. Adjust `.github/workflows/pages.yml` until the test passes.
- Logging: `eslint.config.js` sets, for `src/**` only, the rule `'no-console': ['error', { allow: ['warn', 'error'] }]` (ARCHITECTURE 7: console.error for real errors, console.warn for recoverable ones). `scripts/**`, `tests/**` and config files are exempt. The one allowed exception is the dev-only pattern: `// eslint-disable-next-line no-console -- dev only` on the line directly above a line that reads `if (import.meta.env.MODE !== 'production') console.info(...)`. Fix every violation in `src/**` by removing the call or switching to `warn` or `error` with a reason. `tests/unit/lint/logging.test.js` (new, frozen) scans `src/**` and the inline scripts of `index.html` for `console.log`, `console.debug` and `console.info` and passes only when each hit is the dev-only pattern. Obfuscated access such as `window['console']` is out of scope. A second assertion in the same test reads `eslint.config.js` and checks the rule text above, so the config change is proven without relying on `npm run lint`.
- External links: `tests/unit/security/links.test.js` (new, frozen) scans `index.html`, `src/**` and the generated fallback HTML of plan 069 (under `src/` or `dist/`). Every `target="_blank"` attribute and every `target = '_blank'` or `target: '_blank'` DOM assignment must have a `rel` containing `noopener` on the same element or object, or, for a DOM property assignment, a `rel` assignment within 5 lines after it. Fix any miss.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/workflowFinal.test.js tests/unit/workflow.test.js tests/unit/lint/logging.test.js tests/unit/security/links.test.js`
- `npm run lint`

### Step 2: Dependency audit, bundle size and the package scripts

Deliver:
- Add to `package.json` (owner plan 001; this plan adds these two scripts only): `"check:audit": "node scripts/check-audit.mjs"` and `"check:dist": "node scripts/check-size.mjs --dist"`. The workflow runs them as the steps named above.
- `scripts/check-audit.mjs`: `runAudit(runner = defaultRunner)` runs `npm audit --omit=dev --json` through the injectable runner, which returns `{ stdout, code }`; the check covers ALL production dependencies, transitive ones included. Pure `evaluateAudit(json)` returns exit 1 when any high or critical advisory exists and prints each one; moderate or lower passes. A network failure (`error.code` in `ENOTFOUND`, `EAI_AGAIN`, `ECONNREFUSED`) prints the line `audit: network unavailable` and exits 0. Any other error exits 1. Unit test `tests/unit/scripts/checkAudit.test.js` (new, frozen) with a fake runner: none, moderate only, high (exit 1), critical (exit 1), clean JSON with exit 0, and network error (exit 0 with the unavailable line). A network-failed audit does not prove the audit ran, so the final report states the audit result (step 3).
- `scripts/check-size.mjs --dist` (extend the existing script; its existing `--total-mb` and `--file-mb` asset checks keep running together with it). It scans `dist/` recursively with these limits: total dist size 4 MB; total JavaScript (all `*.js` and `*.mjs` under `dist/`, workers included) 4 MB raw; the same JavaScript gzipped with zlib level 9 at most 1.4 MB; the largest single JS chunk at most 1.5 MB raw; `dist/index.html` at most 120 KB. `vite.config.js` puts `three` in its own manual chunk `vendor-three`; the check fails when no chunk whose name matches `vendor-three` exists in `dist/`. That vendor-three rule and the limits are checked on the real `dist/` only by `check-size --dist` (run after `npm run build` in the step verify and in the workflow), never by a unit test. `tests/unit/scripts/checkSizeDist.test.js` (new, frozen) does not need `dist/`: it runs the pure limit function on a fake tree in a temp directory (passes under every limit, fails over each limit, fails when no vendor-three chunk exists), so `npm test` never depends on a build. If a limit is exceeded, split with dynamic imports and manual chunks in `vite.config.js`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/checkAudit.test.js tests/unit/scripts/checkSizeDist.test.js`
- `npm run build`
- `node scripts/check-size.mjs --dist`
- `node scripts/check-audit.mjs`

### Step 3: Strict final gates and the final report

Deliver:
- Run in this order: `npm run build`, then `node scripts/run-gates.mjs full --strict` (timeout 60 min; every entry must run and pass, nothing SKIPPED: lint, unit, build, no-cdn, prod-hook, phone, ledger, size, credits, buildings, content, local detail), then `node scripts/run-gates.mjs e2e --strict` (timeout 120 min; the full Playwright suite and the budget check). The gate list is frozen (plan 001) and is not edited.
- Bounded fixing: this plan does NOT loop on failures. A failing gate stops the run with `not_done`; its command output is recorded in `docs/review/final-report.md` under the gate name, and the root-cause fix goes to a fixup plan or to `BLOCKED.md` (the one write allowed in the plan folder, the INSTRUCTIONS rule 2 exception). A frozen test that must change is also written to `BLOCKED.md` with the file name, never edited here.
- Write `docs/review/final-report.md` with these required headings (the test checks each heading exists and each numeric line parses): "Per epic" (one line per epic E1 to E8); "Numbers" (desktop draw calls and triangles per spot from `docs/perf/desktop-final.md` (plan 076), phone draw calls, triangles, bundle bytes and first-session asset bytes from `docs/perf/phone-final.json` (plan 075), repo shipped size from `check-size`); "Gates" (the result of each gate run above, pass or not_done, with the command); "Audit" (the `check:audit` result line, including `audit: network unavailable` if it happened); "Human checks" (copied from spec section 6, not from docs/RELEASE-CHECKLIST.md, which plan 078 writes earlier); "Known weaknesses" (at least 3 items, each with a file path or plan id); "Merge steps" (switch Settings > Pages > Source to GitHub Actions once; read this report; approve and merge `world-v2` into `main` yourself; this run never performs them).
- Only after `docs/review/final-report.md` is written, create `tests/unit/docs/finalReport.test.js` (new, frozen) as the last write of this plan. It asserts that each required heading exists and that each numeric line parses. It must not exist before the report, otherwise the gates above would run it against no report.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run build`
- `node scripts/run-gates.mjs full --strict`
- `node scripts/run-gates.mjs e2e --strict`
- `node "{{runner}}/assert.mjs" exists docs/review/final-report.md`
- `npx vitest run tests/unit/docs/finalReport.test.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/workflowFinal.test.js tests/unit/workflow.test.js tests/unit/lint/logging.test.js tests/unit/security/links.test.js tests/unit/scripts/checkAudit.test.js tests/unit/scripts/checkSizeDist.test.js tests/unit/docs/finalReport.test.js`
- `npm run build`
- `node scripts/run-gates.mjs full --strict`
- `node scripts/run-gates.mjs e2e --strict`

Human check (goes in the report, never blocks): FINAL: read docs/review/final-report.md for the honest state of the gates and the audit, and the spec section 6 checks; switch Settings > Pages > Source to GitHub Actions once; approve and merge world-v2 into main yourself (D27).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
