# Plan 067: Text mode: skip to the full resume as a normal page

Epic E7. Estimated turns: 60.

## Goal

A fast, accessible way to read the resume without walking: a "Skip to resume" link opens a full-page text view built from the same content files (name, title, location, links, summary, skills, experience, projects, education, certifications, milestones). It works with the keyboard and a screen reader, prints cleanly, and `?text=1` opens it directly without starting the 3D world. The email is a click-to-reveal button; there is no phone number. Key bindings used here (W A S D, Shift sprint, E interact, V camera, M map, O settings, N mute (plan 064), Shift+R text mode, Escape) are the shared set that plans 067, 068, 070 and 071 agree on.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Accessibility) and D7(a) in _planning/requirements.md (text-mode half of D7))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/content/contact.js
- src/content/projects.js
- src/content/experience.js
- src/content/education.js
- src/content/dialogues.js (ported to src/content/ by plan 002)
- src/ui/emailReveal.js (plan 004)
- src/ui/hud.js (plan 011)
- src/systems/input.js (plan 016)
- src/util/dom.js (plan 003)
- src/util/urlParams.js (plan 003)
- src/main.js (plans 002/003)
- `portfolio/index.html`
- scripts/check-phone.mjs (plan 004, run only, not imported)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Resume sections as data (no DOM in this step)

Deliver:
- `tests/unit/ui/resumeText.test.js` first. `src/content/resumeText.js` exports `buildResumeSections()`, which returns an ordered array of `{ id, heading, blocks }` built ONLY from the existing content modules (no new prose). Section order and headings: `about` "About", `skills` "Skills", `experience` "Experience", `projects` "Projects", `education` "Education", `certifications` "Certifications", `milestones` "Milestones", `contact` "Contact". Heading levels: the name is the only `h1` (rendered by step 2, not stored); each section heading is an `h2`; an experience entry and a project entry are `h3`. Block types (typed objects, the only ones allowed): `{ type: "p", text }`, `{ type: "ul", items: [string] }`, `{ type: "dl", rows: [[term, value]] }`, `{ type: "link", label, href }`, `{ type: "email" }` (renders the email reveal button; the address itself is never in the section data), and `{ type: "entry", title, blocks }` (one experience or project entry, rendered as an `article` with an `h3`).
- Data sources: `about` takes name, title and location from `src/content/contact.js` and the intro paragraphs from the plaza intro strings, which are moved unchanged out of the plaza function into a named export `PLAZA_INTRO` in `src/content/dialogues.js`. `skills` takes the skill list (name and percentage for all 8 skills), moved unchanged to a named export `SKILLS` in `src/content/dialogues.js`. `experience` takes every entry from `src/content/experience.js`, `projects` takes every entry from `src/content/projects.js` (featured first, then the others, in file order), `education` and `certifications` take their arrays from `src/content/education.js` (read the file for its export names and use them as-is, do not rename), and `milestones` takes the inline milestone array at `dialogues.js` (about lines 222-231) moved unchanged into `src/content/milestones.js` as the named export `MILESTONES`. `contact` takes LinkedIn and GitHub links from `src/content/contact.js`, plus one `email` block. Export names not listed here must be read from the producing file at run time and reported, never guessed.
- Tests (data only, `tests/unit/ui/resumeText.test.js`): the section ids in the order above; the experience section has exactly as many `entry` blocks as `experience.js` has entries, with the same company names in the same order; every project name from `projects.js` appears; `SKILLS` has 8 entries, each with a name and numeric percentage; the phone check uses a regex copied into the test file (documented as a copy of the plan 004 pattern; it is NOT imported from `scripts/`), and it must find no match in the section text; no `@` character in the section text; every `link` block href starts with `https://` (the PDF download link lives in the top bar and is not in section data, so it is excluded by name); each project `url`, if present, starts with `https://` (projects without a url render without a link); per-section content assertions: about (name, title, location non-empty, at least one intro paragraph), contact (LinkedIn and GitHub link blocks present, one email block), skills (8 entries), experience (each entry has a company, title, period and non-empty bullets), projects (each has name, summary and non-empty bullets), education, certifications and milestones (non-empty, count equal to the source array length). Each assertion must fail if the source item is dropped.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/resumeText.test.js`
- `node "{{runner}}/assert.mjs" exists src/content/resumeText.js src/content/milestones.js`

### Step 2: The overlay, the route, the key, the boot split and the e2e

Deliver:
- `src/ui/textMode.js` renders with the `el()` helper from `src/util/dom.js` (plan 003, global `document`, no `innerHTML`; jsdom is not used). `renderResume(sections)` returns the node tree; `openTextMode(opts)` and `closeTextMode()` show and hide it. Exact markup: `<div id="text-mode" role="region" aria-label="Resume as text" hidden>` containing `<header class="tm-bar">` (a `button#tm-back` labelled "Back to the 3D world", an `a#tm-pdf` with `href` from `assetUrl("Kaviyarasu_Fullstack_Engineer_Resume.pdf")` (the `assetUrl` helper of ARCH 10.2; the href is never a literal `assets/` path) and `download="Kaviyarasu Full Stack Engineer Resume.pdf"`, and a `button#tm-print` that calls `window.print()`), then exactly one `<main>` containing `<h1 tabindex="-1">` (the name), then one `<section data-section="{id}">` per section with its `h2`, and `article` elements for entries with `h3`. External links get `target="_blank" rel="noopener"`. The `email` block renders `button.email-reveal` and calls the reveal function exported by `src/ui/emailReveal.js` (plan 004). The PDF: if `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` is missing when this step starts, copy the v1 root file "Kaviyarasu Full Stack Engineer Resume.pdf" to that name in `assets/` (plain copy, no build step) and note it in the step report.
- Focus: `openTextMode` stores `document.activeElement` as the return target when opened from the world, then moves focus to the h1. Back and Escape call `closeTextMode()`, which returns focus to the stored target if it is still connected, else to `document.body`. Opened at boot (`?text=1`) there is no return target. Escape closes text mode only when it is open; the shared Escape order is dialogue > settings > map (plan 068) > text mode > tour (plan 070). This plan CREATES the single Escape dispatcher in `src/systems/input.js`: a small registry, `registerEscape(name, priority, isOpen, close)`, where Escape calls `close` of the highest-priority overlay whose `isOpen()` is true and does nothing otherwise. This plan registers text mode; plan 068 (map), plan 070 (tour) and plan 011 (settings, dialogue) register their own close functions with it, and 011 is asked to register settings and not to create a second dispatcher.
- Key: in the `src/systems/input.js` keydown handler (plan 016), `Shift+R` means `e.key.toLowerCase() === "r" && e.shiftKey`. It is ignored while focus is in an `input`, `textarea`, `select` or contenteditable element, and while a dialogue is open. It opens text mode and sets `game.textModeOpen = true`; while that flag is set, movement keys are ignored (same rule as `game.mapOpen` in plan 068). Help: add the row "Shift+R  Resume as text" to the controls list in `src/ui/hud.js` (plan 011 owner); a grep check confirms the row exists.
- URL: `src/util/urlParams.js` `getParams()` gains `text` (true when `?text=1`). The `#text` hash is dropped. Boot: `src/main.js` moves the existing world boot into an exported function `startWorld()` with no behaviour change. On load, if `getParams().text` is set, `main.js` calls `openTextMode({ fromBoot: true })` and does NOT call `startWorld()`; otherwise it calls `startWorld()` as before. Back, when the world is not started, calls `startWorld()` and removes `text=1` from the URL with `history.replaceState` (other params kept); when the world is already running, Back only hides the overlay. Canvases: the static `<canvas id="game-canvas">` (index.html line 551) and the minimap `<canvas>` (index.html line 557) are removed from `index.html`, and `startWorld()` creates them before any module looks them up (if plan 002 creates them elsewhere, move that code into `startWorld()`; report it). Under `?text=1` no canvas exists at all. The e2e waits for `#text-mode` to be visible, not for `window.__world.ready`, which is never set in that mode.
- Skip link: the first element in `<body>` in `index.html`, before any other focusable element: `<a id="skip-to-resume" class="skip-link" href="?text=1">Skip to resume</a>`. It is visually hidden until focused and then shows at the top-left. A click handler calls `openTextMode()` and prevents the default; without JS the href opens `?text=1`. Print CSS in the `index.html` style block: `@media print` hides `.tm-bar`, `#hud`, the minimap canvas and the game canvas, with white background and black text. The text view uses the same colour tokens as the page; contrast in light and dark is a human check.
- `tests/e2e/text-mode.spec.js` (URLs: `/?time=0.5&freeze=1` for the world, `/?text=1&freeze=1` for boot): (a) from the world, wait with `expect.poll` for `window.__world.ready`, press `Shift+R`, then `#text-mode` is visible, the h1 text equals the name from `contact.js`, there are 8 `h2` elements, the `article` count under `[data-section="experience"]` equals the length of `experience.js`, a `button.email-reveal` exists, no `a[href^="tel:"]` exists, `Escape` hides `#text-mode`, and `document.activeElement` is the element focused before opening; (b) on page load the first Tab focus is `#skip-to-resume`; (c) `/?text=1&freeze=1`: `#text-mode` visible within an `expect` timeout of 15 s, `document.querySelector("canvas")` is null, `#game-canvas` is null, console errors are empty; clicking `#tm-back` starts the world and `page.url()` no longer contains `text=1` (checked with `expect.poll`); (d) `#tm-pdf` has the href ending in `/Kaviyarasu_Fullstack_Engineer_Resume.pdf`, the expected `download` attribute, and `page.request` on that href returns 200; (e) the h1 has `tabindex="-1"` and is the focused element after opening; (f) `page.emulateMedia({ media: "print" })`: `.tm-bar`, `#hud`, the minimap canvas and the game canvas have computed display none, and the body background is white; (g) every `a[target="_blank"]` in `#text-mode` has `rel` containing `noopener`. Human checks: light and dark contrast, and screen reader reading order.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/text-mode.spec.js`
- `node "{{runner}}/assert.mjs" none src/ui/textMode.js "innerHTML"`
- `node "{{runner}}/assert.mjs" none src/content/resumeText.js "innerHTML"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run test`
- `npm run check:ledger`
- `npm run check:size`
- `npx vitest run tests/unit/ui/resumeText.test.js`
- `npx playwright test tests/e2e/text-mode.spec.js`
- `npm run build`
- `node scripts/check-phone.mjs`
- `node "{{runner}}/assert.mjs" has src/ui/hud.js "Shift[+]R"`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
