# Plan 069: No-WebGL fallback, static resume HTML for crawlers, SEO and share tags, journey 8

Epic E7. Estimated turns: 60.

## Goal

A visitor without WebGL, a crawler and a share preview must all get the person: name, title, location, LinkedIn, GitHub, an email reveal button and the resume text. The built `index.html` carries a static copy of the full resume (all 8 sections, generated at build time from the content files by a Vite plugin) that stays hidden when the 3D world runs and shows when WebGL is missing or the world fails to start. SEO and OpenGraph tags, a Person JSON-LD block and a share image are added. No phone number anywhere; the email is never plain text. Text-mode rules (plan 067) and the boot split (plan 067 `startWorld()`) are reused, not redefined.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Resilience, Privacy) and D7(b) in _planning/requirements.md, D26, D30, assumption A28)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- index.html (plans 002/067: skip link, canvases removed by 067)
- vite.config.js (plans 001/002)
- src/main.js (plans 002/003/067)
- src/content/resumeText.js (plan 067, buildResumeSections)
- src/content/contact.js (plan 004: name, title, location fields, LinkedIn and GitHub URLs, email)
- src/content/dialogues.js (plan 067: PLAZA_INTRO, SKILLS)
- src/content/milestones.js (plan 067)
- src/ui/textMode.js (plan 067)
- src/ui/emailReveal.js (plan 004: createEmailReveal)
- scripts/check-phone.mjs (plan 004)
- scripts/check-no-cdn.mjs (plans 001/004)
- scripts/shots.mjs (plan 014)
- scripts/generate-credits.mjs (plan 013)
- scripts/ledger-add.mjs (plan 005)
- docs/world-conventions.md (plan 001)
- playwright.config.js (plans 001/002)
- src/world/zones.js (plan 031: shot spot square-night)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Renderer, Node-safe data and the Vite plugin

Deliver:
- `tests/unit/build/staticResume.test.js` first. `src/content/resumeText.js` (plan 067 owner; this step adds to it) exports `renderResumeHtml(sections)`, a PURE string renderer with no DOM use, next to `buildResumeSections()`. It also exports `FALLBACK_BANNER` (the string "Your browser could not start the 3D world. Here is the resume as text.") and `META_DESCRIPTION` (the first sentence of the first paragraph of `PLAZA_INTRO`, no new facts). The renderer accepts the same typed blocks as plan 067 (`{ type: "p", text }`, `{ type: "ul", items }`, `{ type: "dl", rows }`, `{ type: "link", label, href }`, `{ type: "email" }`, `{ type: "entry", title, blocks }`) and outputs `<h1>` for the name, `<section data-section="{id}">` with `<h2>`, `<article>` with `<h3>` for entries, links as `<a href rel="noopener" target="_blank">`, and the email block as the empty `<button class="email-reveal" type="button">Show email</button>` (the address never appears in the output). It escapes all five characters `&`, `<`, `>`, `"` and the single quote through one escape function.
- Node rule: `resumeText.js` and every module it imports must be importable in plain Node (no top-level `document`, `window`, `import.meta.env` or Three.js import). If a content module is not Node-safe, step 1 moves its plain data (PLAZA_INTRO, SKILLS, MILESTONES) into `src/content/textData.js`, which has no imports, and both modules import from there. The test imports `resumeText.js` in Node and must pass.
- Vite plugin `scripts/vite-plugin-static-resume.mjs`: default export `staticResume()` returns `{ name: "static-resume", transformIndexHtml(html) }`. It replaces the single marker `<!-- static-resume -->` (added to `index.html` body in this step, immediately before the `<div id="text-mode">` overlay of plan 067, the first static body element that plan 067 keeps; plan 067 removes `#game-canvas`, so it is not used as an anchor) with `<div id="static-resume" hidden>` + `renderResumeHtml(buildResumeSections())` + `</div>`. If the marker count is not exactly one, it throws. It is registered in `vite.config.js` `plugins`.
- Tests (`tests/unit/build/staticResume.test.js`): the five-character escaping (each of `& < > " '` is escaped; a `<script>` text node is escaped); every experience company and every project name is in the output; every section heading is in the output with at least one entry per section; no `@`, no `tel:` and no phone-regex match in the output (regex copied into the test, documented as a copy of plan 004, not imported from `scripts/`); the h1 text equals the name in `contact.js`; the plugin applied to a sample HTML string inserts exactly one `static-resume` block; `vite.config.js` imported in Node has a plugin named `static-resume` in its `plugins` array (a real check, not a string search). The dist assertions are NOT in this file: they live in `tests/dist/staticResume.dist.test.js` (step 3), run only after the build.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/build/staticResume.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/vite-plugin-static-resume.mjs src/content/resumeText.js`

### Step 2: WebGL detection, boot order, fallback view, SEO tags and the share image

Deliver:
- `src/boot/webglCheck.js`: `hasWebGL()` creates a canvas with `document.createElement("canvas")` and calls `getContext` for `webgl2`, `webgl` and `experimental-webgl` inside try/catch each; it returns true as soon as one returns a non-null value and false otherwise. It never throws. Context loss is not checked here (journey test only). `tests/unit/boot/webglCheck.test.js` sets `globalThis.document` to a fake whose `getContext` returns null (expect false), throws (expect false), returns an object for `webgl2` (expect true). The null case fails any implementation that always returns true.
- Boot order (`src/main.js`, plan 067 `startWorld()` is moved, not changed): the body of `startWorld()` moves to `src/boot/world.js` as an exported function with no behaviour change; plan 067 owns that behaviour, this plan owns the move (report the move to plans 003 and 067). `main.js` first checks the text flag (plan 067), then calls `hasWebGL()`. When it is false, `main.js` does NOT import `src/boot/world.js`; it un-hides `#static-resume` by adding class `fallback-visible`, sets `#static-banner` to `FALLBACK_BANNER` and unhides it, replaces the static `button.email-reveal` node with the node from `createEmailReveal({ label, parts }, document)` (plan 004 API, one code path), and calls `console.warn` once. When WebGL is available, `main.js` runs `const { startWorld } = await import("./boot/world.js")` and calls it inside try/catch; on error it runs the same fallback path. When the world starts successfully, `main.js` sets `#static-resume` hidden.
- Static fallback CSS in `index.html`: `#static-resume[hidden]` stays hidden while the world runs; `.fallback-visible` shows it as a simple light readable layout (same colour tokens as the page). `<noscript><style>#static-resume{display:block}</style><p>Enable JavaScript to use the interactive map. The resume is below.</p></noscript>` in `index.html` shows the static block with JavaScript off (author CSS overrides the UA hidden style). `#static-banner` is `<div id="static-banner" role="status" hidden>` at the top, full width, below the plan 067 bar if present.
- `index.html` head: `<title>` "Kaviyarasu M - Senior Full Stack Engineer" (name and title must equal `contact.js`, tested in step 2), `<meta name="description">` equal to `META_DESCRIPTION`, canonical `https://kaviyarasu-dev.github.io/portfolio/`, Open Graph: `og:title` (same as title), `og:description` (same as description), `og:type` "website", `og:url` (canonical), `og:image` = `https://kaviyarasu-dev.github.io/portfolio/og-image.jpg` (absolute, built from the Vite base `/portfolio/` of ARCH 10.2; `publicDir` is `assets/`, so the file is served at the site root and the test maps this URL back to `assets/og-image.jpg`), `og:image:width` 1200, `og:image:height` 630, `og:locale` "en_US"; Twitter `summary_large_image`; `<meta name="theme-color">` equal to the page background colour token defined in plan 002 `:root` (read its name in `index.html`). A JSON-LD `Person` block: `name`, `jobTitle` (from `contact.js` title), `address` with `addressLocality` and `addressCountry` (the locality and country fields of `contact.js`), `sameAs` with the LinkedIn and GitHub URLs from `contact.js`; NO `telephone` and NO `email`.
- `scripts/make-og-image.mjs`: serves the site with the DEV server, the same base URL that the frozen `playwright.config.js` webServer uses (`base` `/portfolio/`; the script reads the URL from that config, it does not start `vite preview`, because the world hook is stripped from prod builds), launches Chromium through Playwright with its own viewport 1200 by 630 at device scale 1 (no change to `shots.mjs`), opens `/?time=0.8&freeze=1` at the spot `square-night` from plan 031 shot list in `shots.json`, waits with `expect.poll` until an init script listener (added before navigation) has seen the `world:ready` DOM event and the canvas centre sample is not blank (the same 100 by 100 grid rule as plan 068), screenshots the canvas, and encodes JPEG with `sharp` at quality 82. If the output is over 250 KB it retries at 78, then 74; if still over 250 KB it fails with a message. It writes `assets/og-image.jpg`. Ledger: `node scripts/ledger-add.mjs` with `file` "og-image.jpg" (relative to `assets/`), host local, the licence ARCH 10.1 gives for generated images, source `generated:scripts/make-og-image.mjs`; then `node scripts/generate-credits.mjs` (plan 013 rule) so `gates:full` stays current. Run the script once and commit the output.
- `tests/unit/build/seo.test.js` reads `index.html` and `contact.js`: title, meta description (equal to `META_DESCRIPTION`), canonical, the Open Graph set (`og:title`, `og:description`, `og:type`, `og:url`, `og:image`, `og:image:width` 1200, `og:image:height` 630, `og:locale`), Twitter card, theme-color; the og:image URL maps to `assets/og-image.jpg`, which exists, is under 250 KB and is in the ledger; JSON-LD parses as JSON, `@type` is Person, `name`, `jobTitle`, `address` locality and country, `sameAs` contains the LinkedIn and GitHub URLs, and no `telephone` or `email` key; `index.html` has no `<script src="http` tag; `index.html` name and title equal `contact.js`. Each assertion must fail when its item is missing.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/boot/webglCheck.test.js`
- `npx vitest run tests/unit/build/seo.test.js`
- `node "{{runner}}/assert.mjs" exists src/boot/webglCheck.js src/boot/world.js scripts/make-og-image.mjs assets/og-image.jpg`
- `npm run check:ledger`

### Step 3: Journey 8, the dist checks and the build gates

Deliver:
- Playwright keeps the DEV server: the `webServer` of `playwright.config.js` (frozen by plan 001, not edited here, and not in this plan's allowed paths) stays as it is. The static block is injected by `transformIndexHtml`, which runs in dev too, so journey 8 tests the same static markup in dev. Specs that wait for `window.__world` never run against `vite preview`, because the hook is stripped from prod builds. The BUILT output is checked only by the dist tests of step 3, run after `npm run build`. `baseURL` includes `/portfolio/`.
- `tests/e2e/journey-8-no-webgl.spec.js` (journey 8): (a) `context.addInitScript` replaces `HTMLCanvasElement.prototype.getContext` so `webgl`, `webgl2` and `experimental-webgl` return null and other context types (for example `2d`) delegate to the original. Open the base URL: `#static-resume` is visible, its h1 equals the name in `contact.js`, the LinkedIn and GitHub links have the `contact.js` hrefs, `#static-banner` is visible with `FALLBACK_BANNER`, `button.email-reveal` is visible; before the click `page.content()` contains no phone-regex match and does not contain the email address string read from `contact.js`; clicking the button shows an `a[href^="mailto:"]` link; `window.__world` is undefined; console errors are empty. (b) Same context with no override and WebGL available: after `expect.poll`, `#static-resume` is `display: none`, and the loader element of plan 003 (read its id there) is visible then hidden. (c) `browser.newContext({ javaScriptEnabled: false })`: `#static-resume` is visible and the `<noscript>` text is shown. Context loss after start is covered by the journey only, not by unit tests.
- Dist checks: `tests/dist/staticResume.dist.test.js` reads `dist/index.html` and FAILS (it does not skip) when the file is missing. It is a separate test run, `vitest run tests/dist` (or the equivalent command listed in package.json), that runs only after `npm run build`; it is NOT part of `npm test`, so unit tests and gates that run before the build never see a missing dist. It asserts the static block exists, every section heading and at least one entry per section are present (first experience company, first project name), the og:image tag is present, and the static block and JSON-LD have no `@`, no `tel:`, no phone match. It also asserts `dist/assets/*.js` contains no `__world` and no `fastTravelPoint` (the prod-hook rule of plan 068).
- Human check: paste the deployed URL into a link preview tool to check the share card (not automated). Screen reader reading of the static block (not automated).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run build`
- `npx vitest run tests/dist/staticResume.dist.test.js`
- `npx playwright test tests/e2e/journey-8-no-webgl.spec.js`
- `node scripts/check-phone.mjs`
- `node scripts/check-no-cdn.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/build/staticResume.test.js tests/unit/build/seo.test.js tests/unit/boot/webglCheck.test.js`
- `npm run build`
- `node scripts/check-phone.mjs`
- `node scripts/check-no-cdn.mjs`
- `npx playwright test tests/e2e/journey-8-no-webgl.spec.js`
- `npx playwright test tests/e2e/smoke.spec.js`
- `npm run check:ledger`
- `npm run check:size`
- `node "{{runner}}/assert.mjs" none dist/assets "__world"`
- `node "{{runner}}/assert.mjs" none dist/assets "fastTravelPoint"`

Human check (goes in the report, never blocks): Paste the live URL into a link preview tool after deploy to check the share card.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
