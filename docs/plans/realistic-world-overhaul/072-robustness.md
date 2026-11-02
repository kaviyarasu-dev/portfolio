# Plan 072: Robustness: context loss, failed chunk or area load, failed assets, global errors

Epic E7. Estimated turns: 50.

## Goal

The site must never end as a blank page. WebGL context loss shows a friendly message and restores the world when the browser gives the context back (or offers a reload); a failed chunk, area or model load shows the retry banner and recovers on retry; a failed texture or GLB falls back to flat materials and code-built props with one warning; an unexpected error shows a small notice instead of silence. Each case has a Playwright test.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6, 7 (Resilience) and requirement R12, assumption A28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/main.js
- src/engine/renderer.js
- src/engine/streaming.js
- src/ui/retryBanner.js
- src/engine/loader.js
- src/engine/materials.js
- src/world/props/glbProps.js
- src/systems/audio/engine.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Context loss and restore

Deliver:
- `src/engine/contextGuard.js`: listens to `webglcontextlost` on the canvas (`preventDefault()` so restoration is possible), pauses the render loop, shows `#context-lost` ("Graphics were interrupted. Restoring..." with a Reload button after 8 s), and on `webglcontextrestored` re-initialises the renderer state (`renderer.state.reset()`, composer targets re-created through the existing resize path, `needsUpdate` on textures and materials that Three does not recreate, shadow maps), hides the message and resumes. Everything through small functions with injectable canvas and callbacks so they can be unit tested (`tests/unit/engine/contextGuard.test.js`: lost then restored, lost for 8 s shows the reload button, repeated loss, listeners removed on dispose).
- `tests/e2e/context-loss.spec.js`: ready; get the `WEBGL_lose_context` extension in the page (`canvas.getContext("webgl2")` returns the same context), call `loseContext()`: `#context-lost` is visible within 1 s and the loop paused (the frame counter hook `frameCount()` stops); call `restoreContext()`: the message hides within 3 s, `frameCount()` advances again, `canvasLooksRendered` is true and there are no console errors other than the intentional `warn`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/contextGuard.test.js`
- `npx playwright test tests/e2e/context-loss.spec.js`
- `node "{{runner}}/assert.mjs" exists src/engine/contextGuard.js`

### Step 2: Failed chunks, areas and assets

Deliver:
- Code splitting: load heavy optional modules through a retry wrapper `loadChunk(importFn, name)` in `src/engine/chunks.js`: audio ambience (`src/systems/audio/ambience.js`), weather rendering, nature, NPC manager and the map UI are imported lazily (`import()`), each wrapped; a rejected import shows the retry banner with the name and `Retry` re-runs the import (up to 3 automatic tries with backoff 500 ms, 1500 ms, then waits for the user); the game starts without that module when it is optional (audio, nature, weather, NPC) and the module is attached later when the retry succeeds. Required modules (renderer, world areas) failing leave the retry banner and the already loaded world.
- Assets: `getMaterial` texture loader and `preloadProps` log one `console.warn` per asset and fall back (flat colour, code-built prop); `audio` failures are silent beyond one warn; the area loader of plan 015 already shows the banner. A global `window.addEventListener("error")` and `unhandledrejection` handler shows `#error-toast` ("Something went wrong. The world keeps running; reload if it looks wrong.") once per 30 s, never when the error comes from an extension (script URL not from this origin) and always calls `console.error` once.
- Tests: `tests/unit/engine/chunks.test.js` (a flaky import that fails twice then succeeds is attempted three times; a permanently failing one stops after 3 and reports; names in messages). `tests/e2e/chunk-fail.spec.js`: with `page.route` abort the request for `**/src/systems/audio/ambience.js` (and in the preview build the matching chunk if built; run against the dev server): the world still boots, the retry banner names the module, unroute and click Retry: banner hides and `audioState().ambience` appears; blocking a texture request (`**/textures/**/color.webp`) lets the world boot with flat materials (`listObjects()` flags `textureFallback`), no blank canvas, one warning; an `Error` thrown inside `setTimeout` shows the toast once.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/engine/chunks.test.js`
- `npx playwright test tests/e2e/chunk-fail.spec.js`
- `node "{{runner}}/assert.mjs" exists src/engine/chunks.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/engine/contextGuard.test.js tests/unit/engine/chunks.test.js`
- `npx playwright test tests/e2e/context-loss.spec.js`
- `npx playwright test tests/e2e/chunk-fail.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npm run build`
- `node scripts/check-prod-hook.mjs`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
