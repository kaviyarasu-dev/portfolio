# Plan 078: README, CREDITS, the credits page and the runbook

Epic E8. Estimated turns: 40.

## Goal

Documentation that matches the finished world: the README (what it is, controls for keyboard, mouse and touch, the 14 buildings, development commands, how to add a building or an asset, the rules for assets and facts), the credits files regenerated from the ledger, and a runbook for the person who deploys: switching the Pages source, the merge from `world-v2` to `main`, what to check after deploy, how to roll back, how to update the resume or content, known limits. Tests check that the docs say the right things. This plan runs before plan 079 (deps: 077 only, earlier-only order). It writes the Deploy order that plan 079 sets; plan 079 checks that the runbook order matches the workflow, so the workflow order is not asserted here.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 9, section 10.2 (resume file name), requirement R13, assumption A28, decision D15, D27, D31)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/plans/realistic-world-overhaul/ARCHITECTURE.md (sections 7, 9, 10.2)
- docs/specs/2026-10-30-realistic-world-overhaul-design.md (section 6: release checks; check the heading numbering first and cite the real number)
- README.md, docs/world-conventions.md (plan 001), docs/building-manifest.md (plan 020), docs/review/slice-review.md (plan 031)
- package.json (plan 001: the scripts the README may name), scripts/generate-credits.mjs (plans 010/013), scripts/check-phone.mjs (plan 004: the phone matcher, copied into the test), scripts/ledger-add.mjs (plan 005), tests/fixtures/content/resume-source.txt (plan 073)
- src/world/zones.js (plan 031: export ZONES, the 14 display names), src/ui/settings.js (plan 011: key O), src/ui/map.js (plan 068: key M), src/ui/textMode.js (plan 067: Shift+R), the touch layer (plan 071: six part ids), the clock (plan 031: key T)
- .github/workflows/pages.yml (current state from plan 001/002; plan 079 rewrites it to the step order given in its step 1, which the runbook copies)
- docs/images/screenshot.png (plan 002), docs/shots/ (plan 014 output folder)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: README and credits

Deliver:
- `tests/unit/docs/readme.test.js` first (new, frozen). It asserts: README contains the Pages URL given in ARCH 10.2; a controls table whose key list is exactly this set: `W A S D` (move), `Shift` (sprint), `Mouse` (look), `E` (interact), `V` (camera), `M` (map), `O` (settings), `N` (mute), `T` (advance time, plan 031), `Shift+R` (text mode), `Escape` (close overlay). The test reads the key column of the controls table and asserts it equals this set (no extra rows, no `Shift+M`). Grep check: each key appears in the source file of its owner (W A S D and Shift in the input module of plan 016, E in plan 017, V in plan 016, M in plan 068, O in plan 011, N in plan 064, T in plan 031, Shift+R in plan 067, Escape in the overlay order of plan 068/070). A touch section with the six parts and the ids of plan 071 (joystick, look pad, ACT, run, camera, map). A zone table with 14 rows: the display names are imported from the `ZONES` export of `src/world/zones.js` (plan 031), each appears once; the section column uses the section names written in this README (not from zones.js). URL parameters: `time`, `freeze`, `weather`, `seed`, `quality`, `only`, `tour`, `text`, `fixture`; `debug` is marked dev-only. Commands: `npm ci`, `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:journeys`, `npm run check:budget`, `npm run check:ledger`, `npm run check:buildings`, `npm run check:content`; every `npm run X` in README must exist as a script in package.json. A link to `credits.html` and `CREDITS.md`. Sections "Adding a building" (links `docs/building-manifest.md`), "Assets and licences" (CC0 only, the ledger, never add files by hand), "Privacy". Banned text (case-insensitive): `build.mjs`, `dist/bundle.js`, `cdn` (the word is banned entirely; write "no external hosts"), `Soldier`, `Plaza of Kaviyarasu`, `Skill Forge`, `Notice Board`, `GravityWrite Citadel`.
- The phone matcher: the regex from plan 004 is copied into the test as a named constant `PHONE_PATTERN`, with a comment pointing to plan 004. The test scans README.md, docs/RUNBOOK.md and docs/RELEASE-CHECKLIST.md with it. The README never contains a phone number, an email address or `tel:`. Privacy wording (exact): "No contact number is printed on the site. The email is revealed on click, not printed on the page. The PDF is the person's own choice." The word "phone" is not used in README (plan 004 check `none README.md "phone"` holds; this supersedes the earlier wording).
- Rewrite `README.md` to satisfy the test (keep the screenshot link as `docs/images/screenshot.png`). Run `npm run shots -- --spots square-day --plan 078` unconditionally, then copy `docs/shots/078/square-day-high.png` to `docs/images/screenshot.png` (one Bash `cp`). Run `node scripts/generate-credits.mjs` to regenerate `credits.html` and `CREDITS.md`, then `node scripts/generate-credits.mjs --check` must pass (the regeneration is the proof). Resume file name in README: `Kaviyarasu_Fullstack_Engineer_Resume.pdf` (ARCH 10.2); the v1 name is not used.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/docs/readme.test.js`
- `node scripts/generate-credits.mjs`
- `node scripts/generate-credits.mjs --check`
- `node "{{runner}}/assert.mjs" exists docs/images/screenshot.png`

### Step 2: Runbook and release checklist

Deliver:
- `docs/RUNBOOK.md` with these sections (the test checks the headings and that each has at least one bullet): "Deploy" (what `.github/workflows/pages.yml` does on push to `main`, with the step order that plan 079 sets, exactly: npm ci, gates:ci, check:audit, build, check:dist, upload dist, deploy; the ONE-TIME setting Settings > Pages > Build and deployment > Source = GitHub Actions; the merge steps from `world-v2` to `main`, and nothing is merged before the person approves); "Verify after deploy" (open the URL, the console has no errors, the hotel lobby loads first, the map works, the text mode works, the resume downloads with the name `Kaviyarasu_Fullstack_Engineer_Resume.pdf`, no contact number in the page source: how to search for it); "Roll back" (revert the merge commit on `main`, or re-run the workflow of the last good commit; Pages keeps the previous deployment until a new one succeeds); "Update the resume" (replace the PDF only through `assets/` with the same name; update the sha in the tests and the ledger with `scripts/ledger-add.mjs` (plan 005) and `tests/fixtures/content/resume-source.txt` (plan 073), in that order; D31 keeps the PDF unchanged unless the person says so); "Update the content" (edit `src/content`, run `npm run check:content`); "Assets" (add only through the packers, never by hand); "Troubleshooting" (no WebGL, black screen on a phone, audio blocked until the first tap, slow on integrated graphics: the quality settings); "Known limits" (browser matrix as ARCH section 7 states it; if ARCH 7 does not list Safari 16+ and iOS Safari 16+, this plan records them as the decision: latest Chrome, Edge, Firefox, Safari 16+, iOS Safari 16+; NPCs are ambient only; Tamil signage is a draft until a person checks it; hotel and shop names are placeholders).
- `docs/RELEASE-CHECKLIST.md`: the human checks of spec section 6 (the number is verified in the spec file first) as a checklist with checkboxes, at least 8 lines: look and feel of buildings; Tamil text checked by a person; gopuram and temple respect; hotel name placeholders replaced or accepted; the PDF with the phone number by the person's choice; switch the Pages source; approve the merge; real phone test on iOS and Android.
- `tests/unit/docs/runbook.test.js` (new, frozen): the headings above exist; the checklist has at least 8 checkbox lines; both files mention `world-v2` and `main`; no file under `docs/` except `docs/plans` and `docs/specs` contains a contact number (the plan 004 pattern, the same constant as readme.test.js). The Deploy step order is NOT asserted here: `check:audit` and `check:dist` are added by plan 079, so plan 079 (`tests/unit/workflowFinal.test.js`) asserts that the Deploy section and the workflow list the same steps in the same ascending order.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/docs/runbook.test.js`
- `node "{{runner}}/assert.mjs" exists docs/RUNBOOK.md docs/RELEASE-CHECKLIST.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/docs/readme.test.js tests/unit/docs/runbook.test.js`
- `node scripts/generate-credits.mjs --check`
- `node scripts/check-phone.mjs`
- `npm run check:content`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Read README.md, docs/RUNBOOK.md and docs/RELEASE-CHECKLIST.md once.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
