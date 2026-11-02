# Plan 076: Desktop performance pass: perf report tool, budgets at every spot, slimmer assets

Epic E8. Estimated turns: 55. Model: opus.

## Goal

The desktop tier must stay at or under 600 draw calls and 3 million triangles at every budget spot, and the repo under 80 MB with no file over 20 MB. Build a perf report tool that names the heaviest meshes and materials, run the full desktop budget across all spots (the day and the night, with NPCs, nature, weather rain), fix the offenders, remove unused assets, and record the final numbers.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Performance budgets) and requirement R3, R13, assumption A7, A8)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/check-budget.mjs
- src/budgets.json
- src/dev/worldHook.js
- scripts/check-size.mjs
- assets/LEDGER.json
- src/world/kit/bake.js
- src/world/vegetation/render.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Perf report tool and the unused-asset finder

Deliver:
- `tests/unit/scripts/perfReport.test.js` first. Hook `topMeshes(n)`: returns the n heaviest visible meshes by triangle count with `{ name, area, material, triangles, instances, castShadow }` and `drawCalls` grouped by material name; `scripts/perf-report.mjs [--spot id] [--profile desktop|phone] [--weather rain] [--time 0.75]` runs the same browser setup as `check-budget`, prints the table and writes `docs/perf/report-<spot>.json`; pure helper `summarize(rows)` exported and tested (grouping, ordering, totals).
- `scripts/find-unused-assets.mjs`: lists every ledger file that no source file under `src/`, `scripts/` or `index.html` references by path, name or texture-set name (textures are referenced by the set name from `materials.js`; models by `glbProps.json`; audio by the bank and music tables); prints them and exits 1 when any exist unless listed in `scripts/unused-allow.json` with a reason. Unit test with a temp tree: a referenced file passes, an orphan fails, an allowlisted orphan passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/perfReport.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/perf-report.mjs scripts/find-unused-assets.mjs`

### Step 2: Run the full budget, fix, slim the assets

Deliver:
- Add the missing spots to `src/budgets.json`: every landmark outside and inside (28), the square at day and night, harbour, beach, forest, main street, west gate, the rooftop views (hotel and tower), the top of the lighthouse looking over the town (the worst case for view distance), and rain and night variants for three of them. Run `npm run check:budget` for the desktop profile and the phone profile. For each spot over a limit run `perf-report` and fix the cause (merge static meshes per material per area, instance repeated props, cut triangle counts of the heaviest vegetation or prop, tighten shadow casters, hide far interiors, limit view distance by tier). Never raise a limit. Keep a short log of the biggest wins in `docs/perf/desktop-final.md` with the final numbers per spot.
- Remove unused assets: run `find-unused-assets` and delete (or ledger-allow with a reason) each orphan; then `check:ledger`, `check:size` (total under 80 MB, no file at or over 20 MB) and `generate-credits` (regenerate `credits.html` and `CREDITS.md`) pass. If the repo is still over 70 MB, re-pack the biggest textures at a lower WebP quality (`packTextureSet` quality 76) or drop the 2k hero sets that are barely visible.
- Final check: `npm run check:budget` passes at every spot for both profiles, and `tests/e2e/world-tour.spec.js` (plan 040) still passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run check:budget`
- `node scripts/find-unused-assets.mjs`
- `npm run check:ledger`
- `npm run check:size`
- `node scripts/generate-credits.mjs --check`
- `node "{{runner}}/assert.mjs" exists docs/perf/desktop-final.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/perfReport.test.js`
- `npm run check:budget`
- `node scripts/find-unused-assets.mjs`
- `npm run check:ledger`
- `npm run check:size`
- `npx playwright test tests/e2e/world-tour.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
