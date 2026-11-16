# Plan 070: Skippable first-visit tour shown once per browser

Epic E7. Estimated turns: 45.

## Goal

A short guided tour for first-time visitors: seven small steps that point at the controls and the idea of the world, skippable at any time with a button or Escape, never shown again in the same browser (localStorage in try/catch), keyboard and screen-reader friendly, different text for touch, and it never blocks movement. Key bindings agree with plans 067, 068 and 071: W A S D move, Shift sprint, E interact, V first-person toggle (plan 016), M map (plan 068), O settings (plan 011), N mute (plan 064), Shift+R text mode (plan 067), Escape closes the top overlay. The tour does not block M (decided here and in plan 068).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Accessibility), decision D7(c) in _planning/requirements.md, assumption A16)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/ui/settings.js (plan 011: #settings-btn, game.settingsOpen, getReducedMotion, the O key)
- src/ui/hud.js (plan 011: #settings-btn, #map-btn placement)
- src/ui/map.js (plan 068: game.mapOpen)
- src/ui/textMode.js (plan 067: game.textModeOpen)
- src/ui/emailReveal.js (plan 004)
- src/systems/input.js (plan 016: movement, sprint, V, E, Escape order)
- src/systems/interaction/registry.js (plan 016/017: #interact-prompt, dialogue flag game.dialogueOpen)
- src/main.js (plans 002/003: dispatches world:ready)
- src/util/urlParams.js (plan 003: getParams, gains tour)
- src/engine/quality.js (plan 003 or 011)
- src/dev/worldHook.js (plan 003)
- src/content/dialogues.js (plan 067 owner of the tour text table is tourState.js, not dialogues.js)
- tests/e2e/journey-1-arrive.spec.js (created by plan 031, slice-integration-review)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Tour state machine, storage and text table (pure)

Deliver:
- `tests/unit/ui/tour.test.js` first. `src/ui/tourState.js` (data and logic, no DOM) exports `TOUR_STEPS` (7 entries, the table below), `TOUR_KEY` = "portfolio.tour", and `createTour({ storage, touch, onDone, param, automated })`, which returns `{ steps, index, active, next(), skip(), shouldStart() }`. `touch` is a boolean read once at creation by `tour.js` from `matchMedia("(pointer: coarse)").matches`. `param` is the value of `getParams().tour` (plan 003 urlParams.js, gains `tour`: only "0" or "1" are meaningful). `automated` is `navigator.webdriver === true` read by `tour.js`. `tour.js` is the only module that touches `document`, `navigator` or `matchMedia`.
- `shouldStart()` rules in this order: (1) `param === "0"` returns false; (2) `param === "1"` returns true and ignores the done key and `automated`; (3) `automated` returns false; (4) a module variable `sessionStarted` (not sessionStorage) is true once a start has been granted in this session, and then returns false; (5) read `storage.getItem(TOUR_KEY)` inside try/catch: a throw, or `storage` undefined, is treated as "throws": return true on the first call and false afterwards in the same session (a broken storage shows the tour once, never loops); (6) if the value is `done` return false; (7) otherwise return true. A granted start sets `sessionStarted`.
- `onDone()` is called once when the tour ends: Next on step 7 (its button label is "Done"), Skip, or Escape. Ending writes `done` to `storage` inside try/catch; a throw there is a `console.warn` only. After ending `active` is false and `index` stays at the index where it ended. `next()` on step 7 ends the tour. `console.warn` is allowed for the storage-throw fallback; console errors are not.
- Text table `TOUR_STEPS` (desktop, touch). Steps 1, 5, 6 and 7 use one text per device class that names no keyboard key on touch. Step 1 both: "Welcome to the Grand Hotel. Everything here is about Kaviyarasu: walk around." Step 2 desktop: "Move with W A S D, hold Shift to run." touch: "Use the left joystick to move." Step 3 desktop: "Look with the mouse; press V for first person." touch: "Drag the right side to look; tap the camera button for first person." Step 4 desktop: "Press E near glowing objects: doors, desks, boards." touch: "Tap ACT near glowing objects: doors, desks, boards." Step 5 desktop: "Press M for the map and fast travel." touch: "Tap the map button for fast travel." Step 6 desktop: "Press O for settings: quality, sound, reduced motion." touch: "Tap the settings gear for quality, sound, reduced motion." Step 7 desktop: "Prefer plain text? Press Shift+R for the resume as a page." touch: "Prefer plain text? Tap Skip to resume to read the resume as a page." The word "ACT" is the touch context button label, defined once as `ACT_LABEL = "ACT"` in tourState.js; plan 071 uses the same label on `#act-btn` (cross-plan request to 071). Fixed UI strings: buttons "Next", "Done" (step 7 only) and "Skip tour"; counter format "N of 7". No resume facts in any text.
- Tests (`tests/unit/ui/tour.test.js`): `createTour` shape; the step count is 7; the step texts equal the table exactly for both device classes; touch differs from desktop only on steps 2, 3 and 4; first visit (storage empty) starts; after `skip()` a new `createTour` with the same storage does not start; after next to the end and onDone once; storage throwing starts once and does not throw; `storage` undefined behaves like a throw; `param` "0" false, "1" true even with the done key; `automated` true returns false unless param "1"; onDone is called exactly once for skip, for Escape path (skip), and for finishing.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/tour.test.js`
- `node "{{runner}}/assert.mjs" exists src/ui/tourState.js`
- `node "{{runner}}/assert.mjs" has src/util/urlParams.js "tour"`

### Step 2: Tour UI, the start rule, the pulse ring and Playwright

Deliver:
- `src/ui/tour.js` (DOM) renders the card in the static `index.html` (`<div id="tour" role="dialog" aria-label="Quick tour" hidden>`, CSS in the `index.html` style block): anchored bottom-centre with `bottom: max(16px, env(safe-area-inset-bottom))`, max-width 420 px, and `pointer-events: auto` only on the card, so the joystick, ACT and canvas stay usable on touch. Inside: `<p id="tour-text" aria-live="polite">` for the step text, `<span id="tour-count" aria-live="off">2 of 7</span>`, a `button#tour-next` ("Next" or "Done") and a `button#tour-skip` ("Skip tour"). The card does not auto-focus; Next is reached by Tab. `aria-live` is on the text element, not the dialog.
- Start rule: when `createTour().shouldStart()` is true, `tour.js` waits for the DOM event `world:ready` (dispatched on `document` by `src/main.js` after the first frame, plan 002/003; ARCH 10.5 gains it), then waits 1.5 s by `setTimeout`. While `game.dialogueOpen`, `game.settingsOpen` (plan 011; add if missing), `game.mapOpen` (plan 068) or `game.textModeOpen` (plan 067) is true it re-checks every 500 ms and starts when all are false; it never gives up. It sets `document.body.dataset.tourDecision` to "show" or "skip" when the decision is made, so e2e can poll the decision instead of waiting a fixed time.
- Steps and rings: the step text is from `TOUR_STEPS`. Pulse ring targets: step 4 `#interact-prompt` (plan 016/017 owner), step 5 `#map-btn` (plan 068), step 6 `#settings-btn` (plan 011). Steps 1, 2, 3 and 7 have no ring. The ring is a `div.tour-ring` placed over the target bounding rect; animation 1.6 s ease-in-out infinite, scale 1 to 1.12 and opacity 0.6 to 0.2; it is static (no animation) when `getReducedMotion()` (plan 011) is true. If the target element is missing the ring is skipped and the text still shows.
- Controls while shown: the tour is not modal (no `aria-modal`), so W A S D, arrows, Shift and E keep working (plan 016 blocks movement only for `aria-modal` overlays). `Escape` order: dialogue > settings > map > text mode > tour; The Escape dispatcher is created by plan 067 in `src/systems/input.js`; the tour registers its skip with it at the lowest priority, so Escape reaches the tour only when no other overlay is open, and then it skips. `M`, `O`, `N` and `Shift+R` are not handled by the tour, and the tour blocks no key (it is not modal; `M` works while it is shown, as plan 068 states).
- Automation: `tour.js` passes `automated = navigator.webdriver === true` to `createTour`. The automatic start is suppressed under automation unless `?tour=1`, so existing Playwright specs keep running unchanged. Playwright sets `navigator.webdriver` to true; the tour spec sets it to false with `context.addInitScript(() => Object.defineProperty(navigator, "webdriver", { get: () => false }))` for the real first-visit behaviour.
- `tests/e2e/tour.spec.js` (URL `/?time=0.5&freeze=1`; every wait is `expect` or `expect.poll` with a 15 s timeout, never a fixed delay): (a) fresh context with the webdriver init script: `#tour` visible with the step 1 text; `body` dataset `tourDecision` is "show"; ARIA: `#tour` role dialog, label "Quick tour", `#tour-text` aria-live "polite"; (b) one click on `#tour-next`: `#tour-count` reads "2 of 7" and the text is step 2; (c) click `#tour-next` until step 7, then click "Done": `#tour` hidden and `localStorage["portfolio.tour"]` is "done"; (d) reload in the same context: `expect.poll` for `body` dataset `tourDecision` to be "skip" and `#tour` count 0 (the decision signal is the positive control, so no fixed wait); (e) `?tour=0` in a fresh context: decision "skip", `#tour` count 0; (f) `?tour=1` with the done key set: `#tour` visible; (g) Escape on step 3 hides the card and stores "done"; (h) without the webdriver init script: decision "skip", `#tour` count 0; (i) movement: while the card is shown, holding `w` changes `playerState()` position (poll); (j) step 4 ring targets `#interact-prompt` and step 5 targets `#map-btn`; with `page.emulateMedia({ reducedMotion: "reduce" })` the ring has no animation; (k) `elementFromPoint` at the canvas centre is not inside `#tour`; (l) touch: with `hasTouch` context, step 2 text is "Use the left joystick to move."; (m) storage throwing: `addInitScript` makes `localStorage` getter throw: the tour still shows once; zero console errors (warnings allowed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/tour.spec.js`
- `node "{{runner}}/assert.mjs" exists src/ui/tour.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run test`
- `npx vitest run tests/unit/ui/tour.test.js`
- `npx playwright test tests/e2e/tour.spec.js`
- `npx playwright test tests/e2e/journey-1-arrive.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- Existing frozen specs must keep passing without edits: that is why the automatic start is suppressed under automation (see step 2).

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
