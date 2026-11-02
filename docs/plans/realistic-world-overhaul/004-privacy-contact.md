# Plan 004: Remove the phone number and add the email click-to-reveal

Epic E1. Estimated turns: 35.

## Goal

The phone number must disappear from the website code, content, pages and build (the resume PDF is the one exception and stays untouched, D31). The email becomes a click-to-reveal button built by script so it never appears as plain text in HTML. LinkedIn and GitHub stay.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 7 (Privacy) and decisions D26, D30, D31)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/content/contact.js
- src/content/dialogues.js
- src/ui/hud.js
- src/util/dom.js
- `portfolio/README.md`
- `portfolio/index.html`

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Phone check script and phone removal

Deliver:
- `scripts/check-phone.mjs` (exports `scanForPhone(rootDir)` and runs it from the CLI): scans text files (`.js .mjs .json .html .css .md .txt .svg .xml`) under `src/`, `assets/`, `dist/` (when it exists), plus `index.html` and `README.md`; skips the resume PDF by name; fails (exit 1, prints file:line) on a match of the digits `63839 64471` in any spacing or punctuation (regex `6\D{0,2}3\D{0,2}8\D{0,2}3\D{0,2}9\D{0,3}6\D{0,2}4\D{0,2}4\D{0,2}7\D{0,2}1`), on `tel:` when not preceded by a letter (regex `(?<![A-Za-z])tel:`, so `hotel:` is fine) and on the literal email `kaviyarasu.m.dev@gmail.com`. The scope is exactly `src/`, `assets/` (text files only), `dist/` when present (a missing `dist/` is not an error), `index.html` and `README.md`; never `tests/`, `docs/` or the PDF. Export `scanForPhone(rootDir)` returning `[{ file, line, rule }]`.
- `tests/unit/scripts/phone.test.js`: builds temp folders to prove the scanner flags `+91 63839 64471`, `6383964471`, `63839-64471`, `tel:+91...` and the plain email, ignores a `.pdf` file, and passes a clean folder.
- Remove the `phone` field from `src/content/contact.js` and the Phone row (the `tel:` link) from the lighthouse dialogue in `src/content/dialogues.js`; remove "phone" from the README zone table. Search the whole repo (not docs/plans) for any other copy and remove it.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/phone.test.js`
- `node scripts/check-phone.mjs`
- `node "{{runner}}/assert.mjs" none src/content/contact.js "phone" i`
- `node "{{runner}}/assert.mjs" none README.md "phone" i`
- `node "{{runner}}/assert.mjs" none src/content/dialogues.js "Phone" i`

### Step 2: Email click-to-reveal component

Deliver:
- `tests/unit/ui/emailReveal.test.js` first. `src/ui/emailReveal.js` exports `buildEmail(parts)` (joins the pieces) and `createEmailReveal({ label = 'Show email', parts = contact.emailParts }, doc = document)` (so a test passes a fake `doc` that implements only `createElement`, `createTextNode`, and on elements `appendChild`, `setAttribute`, `addEventListener`, `replaceWith`, `textContent`; `buildEmail(parts)` is `parts.join('@')`) returning a `<button class="email-reveal" type="button">` DOM node; on click it replaces itself with `<a href="mailto:...">address</a>` (rel noopener, text set with `textContent`, never `innerHTML`). It must run in Vitest: use a minimal fake `document` object passed in, or `jsdom` is NOT available, so the module takes `doc = document` as an optional argument.
- `src/content/contact.js` stores the address as two parts, `emailParts: ['kaviyarasu.m.dev', 'gmail.com']`; there is no field containing the full address. Update every dialogue that showed `contact.email` (plaza "Reach" row and the lighthouse contact dialogue) to use the reveal button instead. Add a button style to the dialogue CSS in `index.html` that matches the existing `.chip` look.
- Unit test also scans `src/` and `index.html` and fails when the contiguous string `kaviyarasu.m.dev@gmail.com` or `mailto:kaviyarasu` appears.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/ui/emailReveal.test.js`
- `node "{{runner}}/assert.mjs" has src/content/contact.js "emailParts"`
- `node "{{runner}}/assert.mjs" none src/content/contact.js "email:"`

### Step 3: Playwright: reveal works and no phone is visible

Deliver:
- `tests/e2e/email-reveal.spec.js`: `teleport('lighthouse')` (so the v1 distance close logic keeps the dialogue open) then `openDialogue('lighthouse')`; the dialogue text does not match the phone regex and has no `a[href^="tel:"]`; it contains LinkedIn and GitHub links; there is a `button.email-reveal`; after clicking it a link whose `href` is `mailto:kaviyarasu.m.dev@gmail.com` appears. Same for the `plaza` dialogue.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/email-reveal.spec.js`
- `npm run build`
- `node scripts/check-phone.mjs`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).
- The resume PDF in `assets/` (must stay byte-identical).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/phone.test.js tests/unit/ui/emailReveal.test.js`
- `npm run build`
- `node scripts/check-phone.mjs`
- `npx playwright test tests/e2e/email-reveal.spec.js`

Human check (goes in the report, never blocks): The downloadable resume PDF still contains your phone number (your choice, D31). Replace the PDF yourself if that changes.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
