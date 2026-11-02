# Plan 070: Skippable first-visit tour shown once per browser

Epic E7. Estimated turns: 40.

## Goal

A short guided tour for first-time visitors: seven small steps that point at the controls and the idea of the world, skippable at any time with a button or `Escape`, never shown again in the same browser (localStorage in try/catch), keyboard and screen-reader friendly, different text for touch, and it never blocks movement.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Accessibility) and requirement R12, decision D7(c), assumption A16)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/ui/settings.js
- src/ui/hud.js
- src/ui/map.js
- src/ui/textMode.js
- src/main.js
- src/util/urlParams.js
- src/engine/quality.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Tour state machine and storage (pure)

Deliver:
- `tests/unit/ui/tour.test.js` first. `src/ui/tourState.js`: `createTour({ storage, touch })` returns `{ steps, index, active, next(), skip(), shouldStart() }`; `shouldStart()` is true only when the storage key `portfolio.tour` is missing, and false when storage throws (private mode) AFTER one successful start in the session (so a broken storage never loops); `skip()` and finishing write `done` inside try/catch; steps (desktop text, with touch variants): 1 "Welcome to the Grand Hotel. Everything here is about Kaviyarasu: walk around." 2 "Move with W A S D, hold Shift to run." (touch: "Use the left joystick to move.") 3 "Look with the mouse; press V for first person." (touch: "Drag the right side to look; use the camera button.") 4 "Press E near glowing objects: doors, desks, boards." (touch: "Tap ACT.") 5 "Press M for the map and fast travel." 6 "Press O for settings: quality, sound, reduced motion." 7 "Prefer plain text? Press Shift+R for the resume as a page." Only text from this list; no resume facts.
- Tests: first visit starts, after `skip` or `next` to the end it never starts again with the same storage; a throwing storage still allows one start and does not throw; touch variants differ from desktop; the step count is 7; reaching the end calls the done callback once.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/tour.test.js`
- `node "{{runner}}/assert.mjs" exists src/ui/tourState.js`

### Step 2: Tour UI and Playwright

Deliver:
- `src/ui/tour.js`: a card (`role="dialog"`, `aria-live="polite"`, labelled "Quick tour") anchored bottom-centre, with the step text, "Next" and "Skip tour" buttons, a step counter "2 of 7", a gentle pulse ring on the relevant HUD control (settings gear, map button, the E prompt) that is static when reduced motion is on; it starts 1.5 s after the world is ready and not while a dialogue or the settings or map are open; movement keys still work while it is shown (it does not trap focus) and `Escape` skips. `?tour=1` forces it (dev and production), `?tour=0` suppresses it. The automatic start is also suppressed when `navigator.webdriver` is true (automation) unless `?tour=1` is present, so every earlier Playwright spec keeps running unchanged; the tour spec uses `addInitScript` to make `navigator.webdriver` false for the real first-visit behaviour.
- `tests/e2e/tour.spec.js`: a fresh browser context shows `#tour` within 6 s of ready with the text of step 1; clicking Next 6 times then finishing hides it and `localStorage["portfolio.tour"]` is `done`; reload: `#tour` never appears (wait 4 s); a new context with `?tour=0` never shows it; skipping with Escape on step 3 stores `done`; with `context.addInitScript` that makes `localStorage` throw the tour still shows once and the page has no console errors; the touch variant text appears with `hasTouch`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/tour.spec.js`
- `node "{{runner}}/assert.mjs" exists src/ui/tour.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/ui/tour.test.js`
- `npx playwright test tests/e2e/tour.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Existing frozen specs must keep passing without edits: that is why the automatic start is suppressed under automation (see step 2).

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
