# Plan 069: No-WebGL fallback, static resume HTML for crawlers, SEO and share tags, journey 8

Epic E7. Estimated turns: 55.

## Goal

A visitor without WebGL, a crawler and a share preview must all get the person: name, title, location, LinkedIn, GitHub, an email reveal button and the resume text. The built `index.html` carries a static copy of the resume (generated at build time from the content files by a Vite plugin) that stays hidden when the 3D world runs and shows when WebGL is missing or scripts fail. SEO and OpenGraph tags, a Person JSON-LD block and a share image are added. No phone number anywhere; the email is never plain text.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Resilience, Privacy) and requirement R12, decision D7(b), D26, D30, assumption A28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- `portfolio/index.html`
- vite.config.js
- src/main.js
- src/content/resumeText.js
- src/ui/textMode.js
- src/ui/emailReveal.js
- scripts/check-phone.mjs
- scripts/check-no-cdn.mjs
- scripts/shots.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Static resume HTML at build time

Deliver:
- `tests/unit/build/staticResume.test.js` first. `scripts/vite-plugin-static-resume.mjs`: a Vite plugin (`transformIndexHtml`) that imports `src/content/resumeText.js` (pure data, no DOM) and injects into `index.html`, inside `<div id="static-resume" hidden>`, the HTML of `renderResumeHtml(sections)` (string renderer in the same module with escaping of `& < > " '`), plus a `<noscript>` message. The email appears only as an empty `<button class="email-reveal" type="button">Show email</button>` (wired by script). Export `renderResumeHtml` for the test.
- Tests: escaping (`<script>` in a text node is escaped); every experience company and every project name is in the output; no `@` and no `tel:` and no phone digits; the h1 is the name; the plugin function applied to a sample `index.html` string inserts exactly one `static-resume` block; running the real Vite build (`npm run build`) makes `dist/index.html` contain it (a test that reads `dist/index.html` is allowed to be skipped when `dist` is missing but the acceptance below runs the build first).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/build/staticResume.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/vite-plugin-static-resume.mjs`
- `node "{{runner}}/assert.mjs" has vite.config.js "static-resume"`

### Step 2: WebGL detection, fallback view, SEO tags and the share image

Deliver:
- `src/boot/webglCheck.js`: `hasWebGL()` creates a throwaway canvas and requests `webgl2` then `webgl` (and `experimental-webgl`), returns false when none is available or the context is lost immediately, and never throws. `src/main.js` calls it first: when false, skip the world, un-hide `#static-resume` (class `fallback-visible`, a simple readable light style), show a short banner "Your browser could not start the 3D world. Here is the resume as text.", wire the email reveal button, and stop. No console errors in this path (use `console.warn` once).
- `index.html` head: `<title>Kaviyarasu M - Senior Full Stack Engineer</title>`, `<meta name="description" content="...">` (one sentence made from the existing intro text, no new facts), canonical `https://kaviyarasu-dev.github.io/portfolio/`, Open Graph (`og:title`, `og:description`, `og:type` website, `og:url`, `og:image` absolute URL to `assets/og-image.jpg`, `og:image:width` 1200, `og:image:height` 630, `og:locale`), Twitter `summary_large_image`, `<meta name="theme-color">`, and a JSON-LD `Person` block (name, jobTitle, address locality and country, `sameAs` LinkedIn and GitHub; NO telephone and NO email). `scripts/make-og-image.mjs` captures the square at dusk (1200 by 630) with the shots machinery, writes `assets/og-image.jpg` (quality 82, at most 250 KB, use `sharp`) and adds the ledger entry (source `generated:scripts/make-og-image.mjs`). Run it.
- `tests/unit/build/seo.test.js`: reads `index.html`: title, description, canonical, the five OG tags, the Twitter card, JSON-LD parses as JSON and has no `telephone` and no `email` key, `og:image` file exists and is under 250 KB and ledgered; no `<script src="http`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/build/seo.test.js`
- `node "{{runner}}/assert.mjs" exists src/boot/webglCheck.js scripts/make-og-image.mjs assets/og-image.jpg`
- `npm run check:ledger`

### Step 3: Journey 8 and the build checks

Deliver:
- `tests/e2e/journey-8-no-webgl.spec.js` (journey 8): `context.addInitScript` replaces `HTMLCanvasElement.prototype.getContext` so that `webgl`, `webgl2` and `experimental-webgl` return null; open the base URL: `#static-resume` is visible, shows the h1 name, the LinkedIn and GitHub links and a `button.email-reveal`; clicking the button reveals a `mailto:` link; the page HTML (`page.content()`) contains no phone number match and no `kaviyarasu.m.dev@gmail.com` string; no `canvas#game-canvas` rendering was attempted (`window.__world` undefined); zero console errors; with WebGL available the static block is hidden (`display: none`) and the loader runs as usual.
- `npm run build`, then `node scripts/check-phone.mjs` and `node scripts/check-no-cdn.mjs` pass (the static block and the JSON-LD are scanned too); a unit test or script check that `dist/index.html` contains `og:image` and the static resume text of the first experience company.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/journey-8-no-webgl.spec.js`
- `npm run build`
- `node scripts/check-phone.mjs`
- `node scripts/check-no-cdn.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/build/staticResume.test.js tests/unit/build/seo.test.js`
- `npm run build`
- `node scripts/check-phone.mjs`
- `node scripts/check-no-cdn.mjs`
- `npx playwright test tests/e2e/journey-8-no-webgl.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npm run check:ledger`
- `npm run check:size`

Human check (goes in the report, never blocks): Paste the live URL into a link preview tool after deploy to check the share card.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
