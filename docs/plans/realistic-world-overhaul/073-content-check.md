# Plan 073: Content fact check: resume text fixture and the A24 token rule

Epic E7. Estimated turns: 45.

## Goal

Before any wording is rewritten, build the guard that forbids invented facts: `npm run check:content` extracts the facts from two trusted sources (the resume PDF text and the pre-rewrite content files) and fails when the current content contains a digit, year or percent token, or a capitalised word or phrase outside a small allowlist, that is not in the sources.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Facts) and requirement R12, decision D12, assumption A3, A24)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf
- src/content/contact.js
- src/content/dialogues.js
- src/content/projects.js
- src/content/experience.js
- src/content/education.js
- src/content/resumeText.js
- src/content/signage.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Source fixtures

Deliver:
- `scripts/dev/extract-resume.mjs` (dev only, uses `pdftotext` when it is on the PATH or at `C:\Program Files\Git\mingw64\bin\pdftotext.exe`) writes `tests/fixtures/content/resume-source.txt`: first line `# source-pdf-sha256: abfe286b1bbcf14a76585f5885a1a76414d9b2113ce1eb813ea99ebb5abf5d3f`, then the extracted text with `-layout` off. Run it once. The checker never needs `pdftotext` at test time.
- Copy the current content files (after plan 004, before any rewrite) to `tests/fixtures/content/v1/` with the extension `.txt`: `contact.js.txt`, `projects.js.txt`, `experience.js.txt`, `education.js.txt`, `dialogues.js.txt`. These are text snapshots, not code.
- `tests/unit/content/fixtures.test.js`: the first line sha equals the sha256 of `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`; the resume text contains the name, `GravityWrite`, `300,000` and the company names from `experience.js`; the snapshots exist and are non-empty; the snapshot of `contact.js` has no phone digits.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/fixtures.test.js`
- `node "{{runner}}/assert.mjs" exists tests/fixtures/content/resume-source.txt tests/fixtures/content/v1/dialogues.js.txt scripts/dev/extract-resume.mjs`

### Step 2: The checker (A24 rule)

Deliver:
- `tests/unit/scripts/checkContent.test.js` first. `scripts/check-content.mjs` exports `extractTokens(text)`, `buildSourceSet(files)` and `checkContent({ root })`; the CLI exits 1 and prints every offending token with its file and line. Rules: (1) every number token (digits with optional commas, dots, plus signs and percent signs, years `19xx` `20xx`) in the scanned content must occur in the source text; (2) every capitalised word and every run of capitalised words (and all-caps acronyms of 2 or more letters, camel-case product names such as `GravityWrite`) must occur in the source text (case sensitive, matched on the normalized text), unless it is in `scripts/content-allowlist.json`; (3) scanned files: `src/content/{contact,projects,experience,education,dialogues,resumeText}.js` (string literals only: extract with a small tokenizer that handles single, double and backtick strings and ignores code), but NOT `signage.js` (place names are placeholders, A15) and NOT `tests/`. The allowlist holds interface words and common sentence starters (`The`, `A`, `An`, `In`, `On`, `At`, `Of`, `For`, `And`, `With`, `From`, `To`, `I`, `It`, `Is`, `This`, `That`, `Press`, `Walk`, `Click`, `Tap`, `Download`, `Resume`, `Close`, `Show`, `Email`, `Back`, `Skip`, `Next`, `Welcome`, `Open`, `Hotel`, `Grand`, `Skills`, `Experience`, `Projects`, `Education`, `Certifications`, `Milestones`, `Contact`, and month names); the file is documented and covered by a test that fails when it contains a digit token or a proper noun from the resume (so the allowlist cannot be abused).
- Tests: a clean sample passes; a new company name fails; a new number `500K` fails; a changed percentage fails; an allowlisted word passes; tokens inside a code identifier are ignored but inside a string are checked; the real current content passes; `buildSourceSet` reads both sources; lines in the failure message.
- `npm run check:content` passes on the current content. If it fails on real text (for example a word that is a legitimate variant), fix by adding the exact token to the allowlist only when it is not a fact (a UI word), otherwise change the content; list every allowlist addition in the report.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/checkContent.test.js`
- `npm run check:content`
- `node "{{runner}}/assert.mjs" exists scripts/check-content.mjs scripts/content-allowlist.json`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).
- `src/content/**` (this plan only reads it).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/content/fixtures.test.js tests/unit/scripts/checkContent.test.js`
- `npm run check:content`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
