# Plan 011: Quality tiers low/medium/high, auto detection and the settings menu

Epic E1. Estimated turns: 45.

## Goal

Replace the v1 `perfMode` with the three tiers of the spec. `low` is the phone tier (D29: no point lights, 512 px textures, half the decor, interiors load only on entry). The tier is detected automatically, can be forced with `?quality=`, can be changed in a keyboard-operable settings panel, and a reduced-motion switch exists. Other plans read `getTier()` and `TIER_SETTINGS`; they never read the device themselves.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Tiers, Accessibility) and requirement R3, decision D29)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/engine/renderer.js
- src/systems/gameloop.js
- src/state.js
- src/engine/scene.js
- src/ui/hud.js
- `portfolio/index.html`
- src/dev/worldHook.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Tier settings, detection and persistence (pure, unit tested)

Deliver:
- `tests/unit/engine/quality.test.js` first. `src/engine/quality.js` exports `TIER_SETTINGS` with, per tier, these keys: `pixelRatioCap`, `shadows`, `shadowMapSize`, `bloom`, `fxaa`, `ssao`, `textureSize` (`'512'|'1k'`), `heroTextureSize` (`'512'|'1k'|'2k'`), `decorScale`, `maxPointLights`, `npcScale`, `particleScale`, `viewDistance`, `interiorsOnEntry`. Values: low = 1, false, 512, false, false, false, '512', '512', 0.5, 0, 0.4, 0.4, 220, true; medium = 1.5, true, 1024, true, true, false, '1k', '1k', 0.8, 4, 0.7, 0.7, 400, true; high = 2, true, 2048, true, true, true, '1k', '2k', 1, 8, 1, 1, 700, false.
- `detectTier({ isTouch, width, deviceMemory, cores, rendererName })` pure function (`main.js` calls it before `initRenderer` with `rendererName` undefined, then once the GL context exists calls `refineTier(rendererName)` which may only lower an auto tier, for a software renderer): touch device or width under 800 gives `low`; a software renderer name (contains `SwiftShader`, `llvmpipe` or `Software`) gives `medium`; deviceMemory 4 or less or cores 4 or less gives `medium`; else `high`. Missing inputs are treated as unknown, never as a failure.
- `getTier()`, `setTier(tier, { persist = true })`, `getAutoTier()`, `isAuto()`, `onTierChange(fn)` (returns an unsubscribe function), `getReducedMotion()`, `setReducedMotion(bool)`. Resolution order for the tier: `?quality=` param, stored choice (localStorage key `portfolio.quality`), detected tier, implemented as the pure `resolveTier({ param, stored, detected })` (the unit test calls it directly; module state has a `resetQualityForTests()` helper and `matchMedia` or `localStorage` being undefined never throws). `setTier(null)` means Auto (clears the stored value). While a URL param forces a tier, the panel shows that tier selected with the note "set by the page address" and panel changes apply for the session only (nothing is stored). Every storage access is wrapped in try/catch and works when `localStorage` throws or is undefined. Reduced motion defaults to the `prefers-reduced-motion: reduce` media query, overridable and stored under `portfolio.reducedMotion`.
- Test table: touch 390 wide gives low; 1920 wide with 8 cores and 16 GB gives high; SwiftShader gives medium; param beats stored beats detected; a throwing storage object does not break anything; `onTierChange` fires once per change and not for the same value.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/quality.test.js`
- `node "{{runner}}/assert.mjs" exists src/engine/quality.js`

### Step 2: Apply the tier to the renderer and replace perfMode

Deliver:
- Remove `game.perfMode`, `setPerfMode` and the `perfWatch` branches that use it (search `src/` for every `perfMode` and `ultralow` use; none may remain). `src/engine/renderer.js` gets `applyTier(tier)`: pixel ratio `min(devicePixelRatio, pixelRatioCap)` (also `composer.setPixelRatio` and the FXAA `resolution` uniform), `renderer.shadowMap.enabled`, `game.sun.shadow.mapSize` and disposal of `game.sun.shadow.map` when the size changes, bloom pass `enabled`, FXAA pass `enabled` (the OutputPass of plan 002 stays on). It runs at boot and on every tier change. `tests/unit/engine/applyTier.test.js` drives it with plain fake objects (renderer, composer, passes, sun) and asserts each setting for the three tiers.
- The frame-time watcher in `src/systems/gameloop.js` now lowers the tier one step (high to medium to low) through `setTier(t, { persist: false, auto: true })` (the tier stays auto) when the average frame time over 180 frames exceeds 33 ms, at most once every 8 seconds, and only when the tier is auto (`isAuto()`), the URL has no `quality` param and `navigator.webdriver` is not true (so tests are never changed under them). Extract the rule as the pure `nextAutoTier({ tier, avgMs, sinceLastMs, auto })` with unit tests for the 33 ms and 8 s thresholds and the one-step rule. Replace the other v1 `perfMode` readers: `src/entity/player.js` head look-at runs unless the tier is `low`, and `src/world/buildings.js` smoke effects use `TIER_SETTINGS[getTier()].particleScale` (skip when it is under 0.5).
- Extend `src/dev/worldHook.js`: `quality()` returns the real tier, `setQuality(t)`, `pixelRatio()`, `reducedMotion()`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `node "{{runner}}/assert.mjs" none src/state.js "perfMode"`
- `node "{{runner}}/assert.mjs" none src/entity/player.js "perfMode"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "perfMode"`
- `npx vitest run tests/unit/engine/applyTier.test.js`
- `node "{{runner}}/assert.mjs" has src/engine/renderer.js "applyTier"`

### Step 3: Settings panel

Deliver:
- `src/ui/settings.js`: `initSettings()` adds a gear button `#settings-btn` (aria-label "Settings") and builds `#settings` (role `dialog`, `aria-modal="true"`, labelled by its heading) with a radio group "Quality" (Auto, Low, Medium, High) and a checkbox "Reduce motion", plus a Close button. Key `O` toggles it; `Esc` closes it; opening it releases pointer lock and sets `game.uiBlocking = true` (the input code ignores movement, look and action keys while it is true, so arrow keys on the radios do not move the player; `main.js` calls `initSettings()`; the `O` listener lives in `settings.js`); focus moves into the panel and returns to the previous element on close; Tab stays inside while open. All DOM is built with the existing `el()` helper (no `innerHTML`). Choosing a radio calls `setTier` (Auto clears the stored choice). Styles go next to the other HUD CSS in `index.html`, same glass look as `#prompt`.
- `tests/e2e/settings.spec.js`: press `o` (panel visible, focus inside); choose Low with the keyboard (arrow keys on the radio group); `quality()` is `low` and `pixelRatio()` is 1 or less (also assert the radio checked state and `game.sun.shadow.mapSize` through the hook `tierSettings()` which returns the applied values); tick Reduce motion and `reducedMotion()` is true; press `Escape` (panel hidden); reload the page: both choices persist; open with `?quality=high` and the URL wins over the stored `low`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/settings.spec.js`
- `node "{{runner}}/assert.mjs" exists src/ui/settings.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/engine/quality.test.js`
- `npx playwright test tests/e2e/settings.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npx playwright test tests/e2e/v1-behaviour.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
