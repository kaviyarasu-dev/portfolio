# Plan 079: CI workflow hardening, logging rule, dependency audit and the strict final gates

Epic E8. Estimated turns: 45.

## Goal

The last plan: the production-readiness items that can be checked by a machine. The Pages workflow is tightened and tested; no stray `console.log` ships; external links are safe; production dependencies have no known high or critical vulnerabilities; dist size is bounded; and both gate groups run in `--strict` mode with nothing skipped. Deploying itself is never a step: the person switches the Pages source and merges.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Logging, Dependencies), 9 and 10.3 and requirement R13, decision D15, D27)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- .github/workflows/pages.yml
- tests/unit/workflow.test.js
- scripts/run-gates.mjs
- eslint.config.js
- package.json
- `portfolio/index.html`
- docs/RUNBOOK.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Workflow hardening test and logging rule

Deliver:
- `tests/unit/workflowFinal.test.js` (new file; the plan 001 workflow test is frozen and stays green): the workflow triggers only on `push` to `main` (no `pull_request`, no `schedule`, no `workflow_dispatch` unless it is restricted to main by an `if`), has `concurrency` with group `pages` and `cancel-in-progress: false`, `permissions` limited to `contents: read`, `pages: write`, `id-token: write`, uses `actions/checkout`, `actions/setup-node` with `node-version: 20` and `cache: npm`, runs in order `npm ci`, `npm run gates:ci`, `npm run build`, uploads `dist`, the deploy job `needs: build` and uses environment `github-pages`, pins every action to a major version tag (no `@main`, no `@master`), contains no secret references (`secrets.` appears only for `GITHUB_TOKEN` if at all). Adjust `.github/workflows/pages.yml` until it passes (keep the frozen test green).
- Logging: change `eslint.config.js` so `no-console` is an error except `warn` and `error` (ARCHITECTURE.md 7: console.error only for real errors, console.warn for recoverable ones; no other console use) for `src/**`, and fix every violation by removing the call or switching to `warn` or `error` with a reason (dev-only `console.info` behind `import.meta.env.MODE !== 'production'` is also allowed through an `eslint-disable-next-line` with a comment). `tests/unit/lint/logging.test.js` scans `src/` for `console.log`, `console.debug` and `console.info` outside the allowed pattern and asserts none.
- External links: `tests/unit/security/links.test.js` scans `index.html` and `src/` for `target="_blank"` or `target: '_blank'` and asserts a `rel` with `noopener` is set on the same element or object; fix any miss.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/workflowFinal.test.js tests/unit/workflow.test.js tests/unit/lint/logging.test.js tests/unit/security/links.test.js`
- `npm run lint`

### Step 2: Dependency audit and bundle size

Deliver:
- `scripts/check-audit.mjs`: runs `npm audit --omit=dev --audit-level=high --json`, parses it, exits 1 when a high or critical advisory exists for a production dependency (three, howler) and prints it; exits 0 with a warning line when the registry cannot be reached (so the gate never fails because of the network). Unit test `tests/unit/scripts/checkAudit.test.js` with a fake runner function (exported `evaluateAudit(json)`): none, moderate only, high, critical, network error.
- `scripts/check-size.mjs --dist` (extend the existing script; its tests are frozen, add the tests in the new file `tests/unit/scripts/checkSizeDist.test.js`): after a build, the total JavaScript in `dist/` is at most 4 MB raw and at most 1.4 MB gzipped (compute with `zlib.gzipSync`), the largest single JS chunk at most 1.5 MB raw, and `dist/index.html` is under 120 KB. Run it after `npm run build`; if over, split with dynamic imports and manual chunks in `vite.config.js` (three in its own chunk).
- Add the two scripts to the `full` gate group? The `scripts/run-gates.mjs` list is frozen by plan 001: do NOT edit it. Instead add them to `package.json` as `check:audit` and `check:dist` and run them in the acceptance below and in `.github/workflows/pages.yml` as extra steps after `npm run gates:ci` (`npm run check:dist` after the build step; the audit step is `continue-on-error: false`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/checkAudit.test.js tests/unit/scripts/checkSizeDist.test.js`
- `npm run build`
- `node scripts/check-size.mjs --dist`
- `node scripts/check-audit.mjs`

### Step 3: Strict final gates

Deliver:
- Run `node scripts/run-gates.mjs full --strict`: every entry must run and pass (nothing SKIPPED): lint, unit, build, no-cdn, prod-hook, phone, ledger, size, credits, buildings (all 14 with `--all` in its own test; the gate runs the default), content, local detail. Run `node scripts/run-gates.mjs e2e --strict`: the full Playwright suite and the budget check pass. Fix real failures at their root; never edit a frozen test (a plan that must change one is listed in the manifest `unfreeze`; if you hit one, write BLOCKED.md with the file).
- Write `docs/review/final-report.md` for the person: what was built per epic, the final numbers (draw calls, triangles, repo size, first-session download on phone), the list of human checks (copied from `docs/RELEASE-CHECKLIST.md`), the known weaknesses you noticed, and the exact steps to merge (never perform them).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node scripts/run-gates.mjs full --strict`
- `node scripts/run-gates.mjs e2e --strict`
- `node "{{runner}}/assert.mjs" exists docs/review/final-report.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/workflowFinal.test.js tests/unit/workflow.test.js tests/unit/lint/logging.test.js tests/unit/security/links.test.js tests/unit/scripts/checkAudit.test.js tests/unit/scripts/checkSizeDist.test.js`
- `node scripts/run-gates.mjs full --strict`
- `node scripts/run-gates.mjs e2e --strict`

Human check (goes in the report, never blocks): FINAL: read `docs/review/final-report.md` and `docs/RELEASE-CHECKLIST.md`; switch Settings > Pages > Source to GitHub Actions once; approve and merge `world-v2` into `main` yourself (D27).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
