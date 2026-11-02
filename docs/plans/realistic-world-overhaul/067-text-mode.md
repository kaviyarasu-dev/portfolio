# Plan 067: Text mode: skip to the full resume as a normal page

Epic E7. Estimated turns: 45.

## Goal

A fast, accessible way to read the resume without walking: a "Skip to resume" control opens a full-page text view built from the same content files (name, title, location, links, summary, skills, experience, projects, education, certifications, milestones). It works with the keyboard and a screen reader, prints cleanly, and `?text=1` (or `#text`) opens it directly without starting the 3D world. The email is a click-to-reveal button; there is no phone number.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Accessibility) and requirement R12, decision D7(a))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/content/contact.js
- src/content/projects.js
- src/content/experience.js
- src/content/education.js
- src/content/dialogues.js
- src/ui/emailReveal.js
- src/ui/hud.js
- src/main.js
- src/util/urlParams.js
- `portfolio/index.html`

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Resume sections as data and a DOM builder

Deliver:
- `tests/unit/ui/resumeText.test.js` first. `src/content/resumeText.js`: `buildResumeSections()` returns an ordered array of `{ id, heading, blocks }` built ONLY from the existing content modules (no new text): `about` (name, title, location, the intro paragraph that the plaza dialogue shows), `contact` (LinkedIn and GitHub links, the email reveal), `skills` (every skill name and percentage from the dialogue skills list; export that list from `dialogues.js` as `SKILLS` if it is private), `experience` (every entry: company, title, period, location, stack, bullets), `projects` (featured plus others: name, tagline, period, company, summary, stack, bullets, metrics, url), `education`, `certifications`, `milestones` (the milestone facts shown by the milestones dialogue). `src/ui/textMode.js`: `renderResume(doc, sections)` builds a semantic tree with the `el()` helper (no `innerHTML`): one `h1` (the name), `main` with `section` elements each with an `h2` and lists, links with `rel="noopener"`, no inline styles except through classes.
- Tests: the section ids in order; the experience section has exactly as many entries as `experience.js` and the same company names in the same order; every project name from `projects.js` appears; skills include all 8 skills with their percentages; the text contains no digit sequence matching the phone regex (reuse `scanForPhone` text matcher) and no `@` character (the email is a button); heading levels never skip (an h3 only under an h2); every link has an `href` starting with `https://`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/resumeText.test.js`
- `node "{{runner}}/assert.mjs" exists src/content/resumeText.js src/ui/textMode.js`

### Step 2: The overlay, the route and the entry controls

Deliver:
- `src/ui/textMode.js`: `openTextMode()` shows `#text-mode` (role `dialog`? no: a full-page region, `role="document"` inside `<div id="text-mode" aria-label="Resume as text">`): a sticky top bar with a "Back to the 3D world" button, a "Download resume (PDF)" link (`assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` with the download name unchanged), the print button, then the sections. Focus moves to the heading; `Escape` and the back button close it and return focus; scrolling is native; styles in `index.html` use the same colour tokens with a light high-contrast variant when the user prefers `prefers-color-scheme: light` and print CSS (white background, black text, hides the bar).
- Entry: a visible "Skip to resume" link in the top-left of the HUD (first in tab order, also focusable by Tab as the very first stop on the page) and key `Shift+T`... NO: use key `X`? Use the key `Shift+R`; pick `Shift+R` and list it in the help panel. `?text=1` or `#text` in the URL opens the text mode at boot BEFORE the 3D world starts: `src/main.js` checks the flag, renders the text view, and starts the world only when the user presses "Back to the 3D world" (or never, when WebGL is unavailable: plan 069).
- `tests/e2e/text-mode.spec.js`: from the world press `Shift+R`: `#text-mode` visible, the h1 is the name, there is one `h2` per section, the number of experience entries equals the content file (import it in the test), a `button.email-reveal` exists and no `a[href^="tel:"]`; `Escape` closes it; the Tab key from page load reaches the "Skip to resume" link first; opening `?text=1` shows the text without a WebGL canvas element being created (`document.querySelector("canvas")` is null) and no console errors; `page.emulateMedia({ media: "print" })` hides the bar (computed display none).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/text-mode.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/ui/resumeText.test.js`
- `npx playwright test tests/e2e/text-mode.spec.js`
- `npm run build`
- `node scripts/check-phone.mjs`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
