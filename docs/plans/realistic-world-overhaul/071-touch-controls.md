# Plan 071: Touch controls: joystick, action, camera, map, run, tested at a phone viewport

Epic E7. Estimated turns: 50.

## Goal

A phone visit works: a left joystick to move, a drag area on the right to look, an ACT button that does what `E` does (its label shows the current prompt), buttons for the camera mode (V), the map (M), run, and settings, safe-area aware, never overlapping the dialogue, with multi-touch (move and look together). Tests drive real touch events at a 390 by 844 viewport.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Touch) and requirement R12, assumption A25)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/systems/input.js
- src/state.js
- `portfolio/index.html`
- src/ui/hud.js
- src/ui/map.js
- src/ui/settings.js
- src/systems/interaction/registry.js
- src/systems/controller.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Touch input model (pure)

Deliver:
- `tests/unit/input/touch.test.js` first. `src/systems/touchModel.js`: `createJoystick({ radius = 56, deadZone = 0.15 })` with `start(id, x, y)`, `move(id, x, y)`, `end(id)` returning `{ x, y }` in -1..1 (clamped to the radius, dead-zone rescaled, y up is forward), and `createLookPad({ sensitivity })` returning yaw and pitch deltas; both track their own touch identifiers so a second finger does not disturb the first; `labelFor(prompt)` returns the ACT button label (`ACT`, or the prompt verb when short). Tests: dead zone, clamping at the radius, identifier isolation, end resets, label rules, diagonal normalization (|v| at most 1).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/input/touch.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/touchModel.js`

### Step 2: The touch HUD

Deliver:
- Rework the v1 touch elements (`#joystick`, `#look-pad`, `#action-btn`, `#run-btn`) in `index.html` and `src/systems/input.js` to use the model: show them only when `game.touchMode` is true (touch capable device or width under 800); layout for portrait and landscape with `env(safe-area-inset-*)`; buttons at least 48 by 48 CSS px with `aria-label`s: ACT (right, lower), camera toggle (V), map, run toggle, settings gear (already); the joystick base fades to 35 percent when idle; the buttons do not overlap the dialogue panel (the dialogue panel is scrollable and the touch buttons hide while it is open except Close); the page uses `touch-action: none` on the canvas and the pads and prevents the browser zoom and pull-to-refresh; the prompt label shows "ACT" instead of the "E" key cap (already in `showPrompt`).
- The ACT button calls the same function as the `E` key (`useNearest`) and sits above the look pad; holding RUN toggles sprint; the camera button toggles `camRig.mode`; the map button opens the map; all dispatch through the existing input state so the keyboard and touch share one path.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has index.html "safe-area-inset"`
- `node "{{runner}}/assert.mjs" has src/systems/input.js "touchModel"`
- `npm run lint`

### Step 3: Playwright with touch events at a phone viewport

Deliver:
- `tests/e2e/touch.spec.js` (journey 7 first half): context `{ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }` with `?quality=low`; helper `touchSequence(page, id, points)` using a CDP session (`Input.dispatchTouchEvent` start, move, end) in `tests/e2e/helpers/touch.js`. Assertions: the touch controls are visible and the keyboard-only hints hidden; dragging the joystick up for 1 s moves the player forward at least 2 m (`playerState()`); dragging the look pad right changes the camera yaw; a second finger on the look pad while the joystick is held works (both change); standing at a door (`teleport` with yaw) and tapping ACT opens it (`listDoors()` state `open`); tapping the camera button flips `cameraMode()`; tapping the map button opens `#map` and tapping a marker teleports; the touch HUD elements stay inside the viewport (bounding boxes within 390 by 844); zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/touch.spec.js`
- `node "{{runner}}/assert.mjs" exists tests/e2e/helpers/touch.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/input/touch.test.js`
- `npx playwright test tests/e2e/touch.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/map.spec.js`

Human check (goes in the report, never blocks): Try it on a real phone (iOS Safari and Android Chrome): moving, looking, doors, the map and the text mode.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
