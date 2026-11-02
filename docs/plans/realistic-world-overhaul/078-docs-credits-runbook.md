# Plan 078: README, CREDITS, the credits page and the runbook

Epic E8. Estimated turns: 40.

## Goal

Documentation that matches the finished world: the README (what it is, controls for keyboard, mouse and touch, the 14 buildings, development commands, how to add a building or an asset, the rules for assets and facts), the credits files regenerated from the ledger, and a runbook for the person who deploys: switching the Pages source, the merge from `world-v2` to `main`, what to check after deploy, how to roll back, how to update the resume or content, known limits. Tests check that the docs say the right things.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 9 and requirement R13, assumption A28, decision D15, D27)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/README.md`
- docs/world-conventions.md
- docs/building-manifest.md
- src/world/zones.js
- src/ui/settings.js
- src/ui/map.js
- src/ui/textMode.js
- scripts/generate-credits.mjs
- docs/review/slice-review.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: README and credits

Deliver:
- `tests/unit/docs/readme.test.js` first: README contains the live URL, a controls table with the rows `W A S D`, `Shift`, `Mouse`, `E`, `V`, `M`, `O`, `T`, `Shift+R`, `Shift+M`, `Esc` and a touch section (joystick, look pad, ACT, camera, map, run), a zone table with the 14 display names read from `src/world/zones.js` and the section each shows, the URL parameters (`time`, `weather`, `seed`, `quality`, `tour`, `text`), the commands `npm ci`, `npm run dev`, `npm run build`, `npm test`, `npm run test:e2e`, `npm run test:journeys`, `npm run check:budget`, `npm run check:ledger`, `npm run check:buildings`, `npm run check:content`, `npm run check:phone`, a link to `credits.html` and `CREDITS.md`, a section "Adding a building" pointing to `docs/building-manifest.md`, a section "Assets and licences" (CC0 only, the ledger, never add files by hand), a section "Privacy" (no phone number on the site, the email is revealed on click, the PDF is the person's own choice), and no mention of `build.mjs`, `dist/bundle.js`, CDN, `Soldier` or the old plaza names.
- Rewrite `README.md` accordingly (keep the screenshot link to `docs/images/screenshot.png`; replace the screenshot with a new one made by `npm run shots -- --spots square-day --plan 078` copied to `docs/images/screenshot.png` if the shot exists). Run `node scripts/generate-credits.mjs` to regenerate `credits.html` and `CREDITS.md` and make `--check` pass.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/docs/readme.test.js`
- `node scripts/generate-credits.mjs --check`

### Step 2: Runbook and release checklist

Deliver:
- `docs/RUNBOOK.md` with these sections (the test checks the headings): "Deploy" (what the workflow does on push to `main`; the ONE-TIME setting Settings > Pages > Build and deployment > Source = GitHub Actions; the merge steps from `world-v2` to `main` and that nothing is merged before the person approves), "Verify after deploy" (open the URL, the console has no errors, the hotel lobby loads first, the map works, the text mode works, the resume downloads with the right file name, no phone number in the page source: how to search for it), "Roll back" (revert the merge commit on `main`, or re-run the workflow of the last good commit; Pages keeps the previous deployment until a new one succeeds), "Update the resume" (replace the PDF only through `assets/` with the same name, update the sha in the tests and ledger via the documented commands, note that D31 keeps the PDF unchanged unless the person says so), "Update the content" (edit `src/content`, run `npm run check:content`), "Assets" (how to add through the packers, never by hand), "Troubleshooting" (no WebGL, black screen on a phone, audio blocked until the first tap, slow on integrated graphics: quality settings), "Known limits" (browser matrix: latest Chrome, Edge, Firefox, Safari 16+, iOS Safari 16+; NPCs are ambient only; Tamil signage is a draft until a person checks it; hotel and shop names are placeholders).
- `docs/RELEASE-CHECKLIST.md`: the human checks of the spec section 6 as a checklist with checkboxes (look and feel of buildings, Tamil text, gopuram and temple respect, hotel name placeholders, the PDF with phone number by choice, switch Pages source, approve the merge, real phone test iOS and Android).
- `tests/unit/docs/runbook.test.js`: the headings above exist, the checklist has at least 8 checkbox lines, both files mention `world-v2` and `main`, and no file under `docs/` (except `docs/plans`, `docs/specs`) contains the phone number (reuse the phone matcher).

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

Human check (goes in the report, never blocks): Read README.md, docs/RUNBOOK.md and docs/RELEASE-CHECKLIST.md once.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
