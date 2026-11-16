# Plan 071: Touch controls: joystick, action, camera, map, run, tested at a phone viewport

Epic E7. Estimated turns: 55.

## Goal

A phone visit works: a left joystick to move, a drag area on the right to look, an ACT button that does what E does (its label shows the current prompt verb), buttons for the camera mode (V), the map (M, reusing the plan 068 map button), run (hold to sprint), and settings, safe-area aware, never overlapping the dialogue, with multi-touch (move and look together). Tests drive real touch events at a 390 by 844 portrait viewport and an 844 by 390 landscape viewport. Key bindings agree with plans 067, 068 and 070 (the shared set includes N mute, plan 064).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Touch) and assumption A25 in _planning/requirements.md)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/state.js (plan 002 base; plan 071 adds game.touchMode here, plan 003 does not)
- src/systems/input.js (plan 016: movement, sprint flag, V, E, Escape order)
- src/systems/controller.js (plans 003/016)
- index.html (plan 002: v1 touch elements #joystick, #look-pad, #action-btn, #run-btn)
- src/ui/hud.js (plans 011/013: #settings-btn, #map-btn from plan 068, .kbd-hint)
- src/ui/map.js (plan 068: openMap, game.mapOpen)
- src/ui/settings.js (plan 011: game.settingsOpen)
- src/systems/interaction/registry.js (plans 016/017: prompt strings, useNearest, #dialogue.visible, .hint-close)
- src/dev/worldHook.js (plan 003: sprinting, cameraMode added; plan 071 adds touchMode)
- tests/e2e/v1-behaviour.spec.js (plan 003)
- tests/e2e/map.spec.js (plan 068)
- src/world/zones.js (plan 031: zone ids plaza and lighthouse are used here; teleport targets are zone ids only)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Touch input model (pure)

Deliver:
- `tests/unit/input/touch.test.js` first. `src/systems/touchModel.js` (new, no DOM) exports `createJoystick({ radius = 56, deadZone = 0.15 })` with `start(id, x, y)`, `move(id, x, y)`, `end(id)`, returning `{ x, y }` (y up is forward). Rules: the vector is measured from the base centre, y is inverted so up is positive; magnitude m is the length divided by radius, clamped to 1 (circular clamp, so the output never exceeds unit length); if m is at most `deadZone` the output is 0, otherwise the magnitude is rescaled to (m - deadZone) / (1 - deadZone) and the direction is kept. `start` with a second identifier while the first is held returns null and is ignored; `move` and `end` ignore identifiers they do not own; `end` returns `{ x: 0, y: 0 }` and frees the identifier. The identifier is `Touch.identifier` from the event.
- `createLookPad({ sensitivity = 0.0035 })` with `start(id, x, y)`, `move(id, x, y)` and `end(id)`. `move` returns `{ yaw, pitch }` deltas in radians for the movement since the last call: `yaw = -dx * sensitivity` (dragging right turns the view right, so the yaw delta is negative, per the ARCH 10.8 sign convention, positive is left), `pitch` follows the mouse-look sign of plan 016 (drag up raises the view). No invert option. The pitch clamp to [-1.2, 1.2] belongs to the camera (plan 016), not to this model. Same identifier isolation as the joystick.
- `labelFor(prompt)`: the prompt string format is "Press E to <verb>" (plan 017 prompt strings; the verb is the text after "Press E to "). It returns the verb in upper case when the verb length is 8 characters or fewer, otherwise "ACT". No match returns "ACT".
- Tests (`tests/unit/input/touch.test.js`, exact values): joystick radius 56 and dead zone 0.15; a normalized magnitude of 0.575 rescales to 0.5; inside the dead zone returns 0; a point 2 times the radius below the base returns (0, -1); a diagonal (56, 56) gives |v| at most 1 (about 0.707 on each axis); the second identifier on the joystick returns null; `end` resets to 0; look pad with dx 100 and sensitivity 0.0035 gives yaw -0.35 radians; `labelFor("Press E to open door")` gives "ACT" (9 characters), `labelFor("Press E to sit")` gives "SIT", `labelFor("Press E to open")` gives "OPEN", `labelFor("Press E to stand up")` gives "STAND UP" (exactly 8), `labelFor("nothing")` gives "ACT".

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/input/touch.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/touchModel.js`

### Step 2: The touch HUD and the shared input path

Deliver:
- `game.touchMode` is a field of `src/state.js` added by this plan (071), not by plan 003. It is set once at boot to `matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0` and re-evaluated on `resize` and `orientationchange`. The width rule is removed. It is also exposed on the dev hook (`src/dev/worldHook.js`, a plan 003 file, addition only, made by this plan).
- Markup in `index.html` (plan 002 v1 elements reworked): `<div id="touch-layer" hidden>` with a `padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)` rule in the style block; inside it `#joystick` (base, bottom-left 16 px from the edges), `#look-pad` (bottom-right), `#action-btn` (text from `labelFor`, aria-label "ACT", right, 16 px above the look pad), `#run-btn` (aria-label "Run", left of ACT), `#camera-btn` (aria-label "Camera", new, top-left, 16 px from the left and top safe-area edges, so it is in a different place from the map button). The map button is NOT in `#touch-layer`: `#map-btn` stays the plan 068 HUD button (id `#map-btn`, aria-label "Open map", top-right under the settings gear), visible on desktop and touch; this plan only sets its touch size under `body.touch-mode`. There is no second map button. Sizes: at least 48 by 48 CSS px in portrait, 52 by 52 in landscape. The `.kbd-hint` elements (owner plan 011 `src/ui/hud.js`) are hidden by the CSS rule `body.touch-mode .kbd-hint { display: none }`; `touch-mode` is a class added to `body` when `game.touchMode` is true.
- Visibility: `#touch-layer` is shown only when `game.touchMode` is true. It hides while `#dialogue.visible` (plan 017) is true, except the dialogue close control `#dialogue .hint-close`, and while `game.mapOpen` (068), `game.settingsOpen` (011) or `game.textModeOpen` (067) is true. The tour (plan 070) does NOT hide the touch layer, because the tour is not modal and its card does not cover the controls. The joystick base fades to opacity 0.35 after 1.2 s without touch, with a 300 ms transition; it stays fixed in position.
- Touch behaviour: `touch-action: none` on `#joystick`, `#look-pad` and the canvas (CSS). `overscroll-behavior: none` on `body`. A `touchmove` listener with `{ passive: false }` calls `preventDefault` only when the target is the canvas or one of the pads. The viewport meta keeps `user-scalable=no`.
- Shared path in `src/systems/input.js` (plan 016): the joystick output sets the movement axes of the existing input state; `#look-pad` yaw and pitch deltas go to the camera rig (plan 016); holding `#run-btn` sets the sprint flag (the plan 016 sprint input) and releasing clears it (hold to sprint, no toggle); `#action-btn` calls `useNearest`, the same function as E; `#camera-btn` toggles `camRig.mode` as V does; `#map-btn` calls `openMap()` (068), which is reached through a lazy `await import("../ui/map.js")` inside the click handler (the plan 072 lazy module); input.js and the touch code never import map.js statically, so the map chunk stays lazy. The keyboard and touch share one path. `createJoystick(` and `createLookPad(` are called from `src/systems/input.js`.
- The ACT button text is `labelFor(prompt)` of the current prompt from `showPrompt` (plan 017); on touch the E key cap is not shown.
- Behavioural visibility rule (no DOM, checked by unit test): `touchLayerVisible({ touchMode, dialogueVisible, mapOpen, settingsOpen, textModeOpen })`, a pure export of `src/systems/touchModel.js`, returns true only when `touchMode` is true and none of the other four flags is true. The tour is not an input, so it is not a parameter. The dialogue close control `#dialogue .hint-close` is shown by its own rule, not by this function. `tests/unit/input/touchVisibility.test.js` checks: desktop (touchMode false) is false; touch with nothing open is true; each of dialogueVisible, mapOpen, settingsOpen and textModeOpen alone makes it false; the call with no tour argument is true when nothing else is open. The step 3 e2e then checks the same rule in a browser.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" has src/systems/input.js "createJoystick[(]"`
- `node "{{runner}}/assert.mjs" has src/systems/input.js "createLookPad[(]"`
- `node "{{runner}}/assert.mjs" has index.html "id="touch-layer""`
- `npx vitest run tests/unit/input/touchVisibility.test.js`
- `npm run lint`

### Step 3: Playwright with touch events at phone viewports

Deliver:
- Helper `tests/e2e/helpers/touch.js` exports `touchStart(page, id, x, y)`, `touchMove(page, id, x, y)` and `touchEnd(page, id)`. Each one dispatches a CDP `Input.dispatchTouchEvent` (`touchStart`, `touchMove`, `touchEnd`) through a CDP session kept per page in a WeakMap; each event lists ALL currently active touch points, so a held finger stays down while a second finger moves. Owned by plan 071.
- `tests/e2e/touch.spec.js` (journey 7, first half): `test.use({ hasTouch: true, isMobile: true, deviceScaleFactor: 2, viewport: { width: 390, height: 844 } })` in this spec only (the frozen `playwright.config.js` is not changed). URL `/?quality=low&time=0.5&freeze=1`. Every wait is `expect.poll` with a 15 s timeout or a locator assertion with a timeout; no fixed delay. Assertions: (a) `hook.touchMode` is true, `#touch-layer` visible, `.kbd-hint` elements hidden; (b) holding the joystick up (drag from the base centre by 56 px upward, held) moves `playerState()` by at least 2 m (poll), then release; (c) dragging the look pad right by 100 px changes yaw by a negative value of magnitude at least 0.1 rad (poll), the sign matching the unit test; (d) with the joystick held, a second finger on the look pad also changes yaw while the position keeps moving (both change); (e) standing 2 m from the hotel door (`teleport("plaza", { entrance: true })` puts the player 3 m outside the hotel door, then a 2 m joystick forward move), tapping `#action-btn` opens that hotel door (its `listDoors()` record state `open`, poll); (f) tapping `#camera-btn` changes `cameraMode()` (poll); (g) tapping `#map-btn` opens `#map`, and tapping the marker for zone `lighthouse` teleports the player within 6 m of `fastTravelPoint("lighthouse", { entrance })` with the same entrance flag the marker used (plan 068), and `isBlocked(x, z, y, 0.35)` is false at the player position; (h) holding `#run-btn` makes `playerState().sprinting` true, releasing makes it false (poll); (i) aria-labels exact: "ACT", "Camera", "Open map" (the plan 068 map button, same label as the frozen map.spec), "Run", "Settings"; (j) the minimum size: each touch button bounding box is at least 48 by 48; (k) `getComputedStyle(canvas).touchAction` and the pads are "none"; (l) `touchmove` dispatched on the canvas has `defaultPrevented` true; (m) the joystick computed opacity is 0.35 after 1.2 s idle (poll); (n) zero console errors.
- Layout test (same spec, a second `test.describe` with `test.use` for landscape viewport 844 by 390): bounding boxes of `#joystick`, `#look-pad`, `#action-btn`, `#run-btn`, `#camera-btn` and `#map-btn` are inside the viewport in both portrait (390 by 844) and landscape (844 by 390), no two of them intersect (pairwise rectangle test), and each is at least 48 by 48 (52 by 52 landscape). Desktop case: a context with width 1280, no touch: `hook.touchMode` is false and `#touch-layer` is hidden. Dialogue case: with the dialogue open (`teleport` next to a desk, press E in the test), `#touch-layer` is hidden except `#dialogue .hint-close`. Human check: the real phone (iOS Safari and Android Chrome), landscape, moving, looking, doors, map and text mode (not automated).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/touch.spec.js`
- `node "{{runner}}/assert.mjs" exists tests/e2e/helpers/touch.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run test`
- `npx vitest run tests/unit/input/touch.test.js`
- `npx playwright test tests/e2e/touch.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`
- `npx playwright test tests/e2e/map.spec.js`

Human check (goes in the report, never blocks): Try it on a real phone (iOS Safari and Android Chrome): moving, looking, doors, the map and the text mode, in portrait and landscape.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
