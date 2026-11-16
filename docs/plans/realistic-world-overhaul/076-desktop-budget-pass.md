# Plan 076: Desktop performance pass: perf report tool, budgets at every spot, slimmer assets

Epic E8. Estimated turns: 60. Model: opus.

## Goal

The desktop tier must stay at or under 600 draw calls and 3 million triangles at every budget spot, and the shipped assets (the check-size measure, not the .git folder) under 80 MB with no file at or over 20 MB. Build a perf report tool that names the heaviest meshes and materials, delete the baseline allowances, add the missing spots, fix the offenders by a bounded procedure, remove unused assets (and their ledger entries), and record the final numbers. This plan is one block with three steps (the former 076a, 076b and 076c), est 60 and maxTurns 100; it is not split because the three steps share one budget table.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Performance budgets), 10.2 (ledger and INDEX), 10.8 (budget and spot convention) and requirement R3, R13, assumption A7, A8)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/plans/realistic-world-overhaul/ARCHITECTURE.md (sections 7, 10.2, 10.8)
- scripts/check-budget.mjs and src/budgets.json (plan 014: profiles desktop and phone, spot convention, baselineAllowance per profile and metric)
- src/shots.json (plan 014: shot spots; every budget spot needs a shot spot)
- scripts/lib/browser.mjs (ARCH 10.8: the shared browser setup used by check-budget and shots)
- src/dev/worldHook.js (plan 003 owns the hook; the hook is dev-only, window.__world)
- src/world/town/bakeStatic.js (plan 029: static mesh merge; NOT src/world/kit/bake.js)
- src/world/vegetation/render.js (vegetation renderer; confirm its owner plan and path in the ARCH module map before editing)
- scripts/check-size.mjs (plan 001/014: shipped asset total and per-file rule)
- assets/LEDGER.json and assets/INDEX.json (plans 005 and 010: ledger, set entries, exempt list)
- scripts/generate-credits.mjs (plan 013: credits.html and CREDITS.md)
- packTextureSet (the texture packer of plan 006, under scripts/)
- tests/e2e/world-tour.spec.js (plan 040; frozen; if it fails the fix is in code)
- docs/world-conventions.md (plan 014 documents the budget tools; this plan cannot edit it, see step 3)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Perf report tool and the unused-asset finder

Deliver:
- `tests/unit/scripts/perfReport.test.js` first (frozen). Hook `topMeshes(n)` in `src/dev/worldHook.js` (plan 003 hook; dev only, on `window.__world`) returns the n heaviest visible meshes by triangle count, rows `{ name, area, material, triangles, instances, castShadow }`: `area` = the streamer area id (plan 015), `instances` = `InstancedMesh.count` (1 for a plain mesh), `material` = the material name from `getMaterial` (plan 013). The hook also returns `drawCalls` grouped by material name (count of render calls per material).
- `scripts/perf-report.mjs --spot <id> --profile desktop|phone --weather <w> --time <t>` reuses `scripts/lib/browser.mjs`, prints the table and writes `docs/perf/report-<spot>.json` = `{ spot, profile, weather, time, drawCalls, triangles, totals, groups }`. Pure helper `summarize(rows)` is exported and tested: `summarize(rows)` returns `{ groups: [{ key, drawCalls, triangles, instances }], totals: { drawCalls, triangles, instances } }`; groups are keyed by material name and ordered by triangles descending; totals are sums. The unit test asserts order and sums on a fixed input. Step 1 verify runs the CLI once on one spot (`--spot square-day --profile desktop`), not only the existence check.
- `scripts/find-unused-assets.mjs`: a file under `assets/` is REFERENCED when its basename without extension appears in any file under `src/` or `scripts/`, or as a `set` name in `assets/LEDGER.json`; `assets/INDEX.json` (10.2) and `glbProps.json` count as references. It prints the unreferenced files and exits 1 when any is not allowlisted. Allowlist `scripts/unused-allow.json` = array of `{ "file": "<path under assets>", "reason": "<text>" }`. Unit test `tests/unit/perf/findUnused.test.js` (new, frozen) on a temp tree: a referenced file passes, an orphan fails, an allowlisted orphan passes.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/perfReport.test.js tests/unit/perf/findUnused.test.js`
- `node scripts/perf-report.mjs --spot square-day --profile desktop`
- `node "{{runner}}/assert.mjs" exists scripts/perf-report.mjs scripts/find-unused-assets.mjs`

### Step 2: Baseline allowances, the missing spots and the bounded fix loop

Deliver:
- Delete every `baselineAllowance` entry in `src/budgets.json` (both profiles, every metric): this is ARCH 10.8 and the plan 014 rule. After this step `check:budget` must pass against the real limits with no WARN.
- Spot list (exact ids, added to BOTH `src/budgets.json` and `src/shots.json`, the 014 consistency rule): the 14 landmark spots `<zone>-outside` and `<zone>-inside` (28 total, zone ids from plan 040 ZONE_LAYOUT); `square-day`, `square-night` (time 0.75; plan 031); `harbour`; `beach`; `forest`; `main-street`; `west-gate`; `hotel-roof`; `tower-roof`; `lighthouse-top` (looks over the town, the worst case for view distance). Variants: `square-rain` (weather rain), `harbour-night` (time 0.75), `hotel-roof-night` (time 0.75). NPCs and nature are on by default in every spot (no URL switch). Camera x, y, z, yaw and pitch per spot come from the spot convention in ARCH 10.8 and the anchor in plan 040; write them into `src/shots.json`. Night = `time 0.75`.
- Add `--list` to `scripts/check-budget.mjs`: it prints every spot id and fails when an id is missing from either `src/budgets.json` or `src/shots.json`. Step 2 verify runs it. Run `npm run check:budget` for BOTH profiles (desktop and phone; the phone limits are owned by plan 075, and a fix must not regress phone).
- Fix loop (ordered, per spot over a limit; stop as soon as `check:budget` passes for that spot): (1) merge static meshes per material per area with `bakeStatic` (plan 029); (2) instance repeated props (plans 019 and 023); (3) cap the view distance by tier (plan 015 streamer); (4) re-pack textures with `packTextureSet` at quality 76 (plan 006); (5) drop a 2k hero set only if its set name is unreferenced. Cut triangle counts of the heaviest vegetation or prop and tighten shadow casters where the report names them. At most 5 iterations per spot; a spot still over after 5 is listed as `not_met` in `docs/perf/desktop-final.md` and a human_check is raised. Never raise a limit.
- Every fix is recorded in `docs/perf/desktop-final.md`: the spot, the report file, the change and the before and after draw calls and triangles. The file lists the final numbers per spot for both profiles. Real frame times are NOT measured here (SwiftShader gives draw calls and triangles only): that is the human check.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" none src/budgets.json "baselineAllowance"`
- `node scripts/check-budget.mjs --list`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/perf/desktop-final.md`

### Step 3: Remove unused assets, slim the assets and the final checks

Deliver:
- Remove unused assets: run `node scripts/find-unused-assets.mjs`. A file is deleted only when it is unreferenced AND not allowlisted in `scripts/unused-allow.json` AND not in the ledger exempt list; otherwise it is allowlisted with a reason. Delete one file per call with Bash `rm`, after listing it in the session (no bulk delete). In the same call, remove that file's entry from `assets/LEDGER.json` (and from `assets/INDEX.json` if listed there), so no stale ledger entry remains; `npm run check:ledger` runs only after every deletion. Record every deletion and ledger edit in `docs/perf/desktop-final.md`.
- Then `npm run check:ledger`, `npm run check:size` (the shipped asset total under 80 MB and no file at or over 20 MB) and `node scripts/generate-credits.mjs` followed by `node scripts/generate-credits.mjs --check` (regenerates `credits.html` and `CREDITS.md`) must all pass. If the shipped total is still over 70 MB after the deletions, re-pack the biggest textures at WebP quality 76 with `packTextureSet`; the 70 MB figure is a target recorded in `desktop-final.md`, and if it is still above 70 MB the file says so and a human_check is raised.
- Final check: `npm run check:budget` passes at every spot for both profiles, and `tests/e2e/world-tour.spec.js` (plan 040, frozen) still passes. If the tour fails, the fix is in code; the frozen test is not edited.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node scripts/find-unused-assets.mjs`
- `npm run check:ledger`
- `npm run check:size`
- `node scripts/generate-credits.mjs --check`
- `npx playwright test tests/e2e/world-tour.spec.js`
- `npm run check:budget`
- `node "{{runner}}/assert.mjs" exists docs/perf/desktop-final.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/perfReport.test.js tests/unit/perf/findUnused.test.js`
- `node "{{runner}}/assert.mjs" none src/budgets.json "baselineAllowance"`
- `node scripts/check-budget.mjs --list`
- `npm run check:budget`
- `node scripts/find-unused-assets.mjs`
- `npm run check:ledger`
- `npm run check:size`
- `node scripts/generate-credits.mjs --check`
- `npx playwright test tests/e2e/world-tour.spec.js`

Human check (goes in the report, never blocks): Real desktop frame times at the heaviest spots (the tool measures draw calls and triangles only). Read docs/perf/desktop-final.md for not_met spots and the 70 MB status.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
