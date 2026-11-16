# Plan 073: Content fact check: resume text fixture and the A24 token rule

Epic E7. Estimated turns: 50.

## Goal

Before any wording is rewritten, build the guard that forbids invented facts: `npm run check:content` extracts the facts from two trusted sources (the resume PDF text, and the v1 content files as they were on git branch main before the E7 plans) and fails when the current content contains a number token, or a capitalised word, acronym or camel-case name outside a small allowlist, that is not in the sources.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Facts), decision D12, assumptions A3 and A24 in _planning/requirements.md and ARCHITECTURE.md)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf (produced by plan 002)
- src/content/contact.js (plan 004)
- src/content/dialogues.js (plan 002 port, plan 067 exports)
- src/content/projects.js (plan 006 or content plan)
- src/content/experience.js
- src/content/education.js
- src/content/milestones.js (plan 067)
- src/content/resumeText.js (plan 067)
- src/content/signage.js (plan 025, excluded from scanning)
- package.json (check:content wired by plan 001; this plan does not edit it)

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Source fixtures

Deliver:
- `scripts/dev/extract-resume.mjs` (dev only, run once and committed) writes `tests/fixtures/content/resume-source.txt`. It runs `pdftotext -enc UTF-8 <pdf> -` (no `-layout`) with the pdf path `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`, reads stdout, and writes the file itself (no shell redirect). The first line is `# source-pdf-sha256: <sha of the pdf>`, then the extracted text. `pdftotext` is found on PATH only; if it is missing the step stops as not done and reports it, and no hand-written resume-source.txt is created. The checker never needs `pdftotext` at test time.
- The v1 baseline: copy the v1 content files from git branch main (`git show main:js/content/<file>`, the pre-E7 content the facts came from; the sha of main is written in the first line of each snapshot as `# baseline-commit: <sha>`; HEAD is not used, because plan 002 deletes `js/` and the runner snapshots `world-v2`) to `tests/fixtures/content/v1/<file>.txt` for `contact.js`, `projects.js`, `experience.js`, `education.js` and `dialogues.js`. These are text snapshots, not code. Plans 004 to 072 changes are not blessed by the snapshots. Freeze `tests/fixtures/content/v1/*.txt` and `resume-source.txt` so that plan 074 cannot edit the facts to pass.
- Proper-noun list: `tests/fixtures/content/proper-nouns.json` is written once by hand from the resume text and the v1 files: employer names, product names, the person name, locations and project names. It is frozen. The allowlist abuse test (step 2) reads it.
- `tests/unit/content/fixtures.test.js`: the first line sha equals the sha256 of `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`; the resume text contains the name, `GravityWrite`, `300,000` and every company name in `experience.js`; all five snapshots exist, are non-empty and have a `# baseline-commit:` line; positive control: the v1 `contact.js` snapshot matches the phone regex (the regex copied from plan 004, documented as a copy), which proves the regex can fire (no phone value is written into any fixture).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/fixtures.test.js`
- `node "{{runner}}/assert.mjs" exists tests/fixtures/content/resume-source.txt tests/fixtures/content/proper-nouns.json tests/fixtures/content/v1/contact.js.txt tests/fixtures/content/v1/projects.js.txt tests/fixtures/content/v1/experience.js.txt tests/fixtures/content/v1/education.js.txt tests/fixtures/content/v1/dialogues.js.txt scripts/dev/extract-resume.mjs`

### Step 2: The checker (A24 rule)

Deliver:
- `tests/unit/scripts/checkContent.test.js` first. `scripts/check-content.mjs` exports `normalize(text)`, `extractTokens(text) -> [{ token, kind }]` (kind is one of `number`, `word`, `acronym`, `camel`), `buildSourceSet(files) -> Set<string>` where `files` is an array of `{ path, text }` (the caller reads the files), and `checkContent({ root }) -> [{ file, line, token }]`. The CLI prints `file:line token` for each failure and exits 1; it exits 0 when the list is empty. The test spawns the CLI in a temp root with one bad token (exit 1) and in a clean temp root (exit 0).
- Normalisation: curly quotes (U+2018, U+2019, U+201C, U+201D) become straight quotes; en dash, em dash and the middle dot become a space; NFKC is applied (ligatures); all whitespace, including PDF line wraps, collapses to one space. Matching is done only on normalised text. Tokenizer scope: single, double and backtick strings are checked; code outside strings is ignored; comments are ignored; backtick `${...}` expressions are skipped; escapes such as `\u2019` are decoded before checking; strings that look like CSS (a `:`-separated declaration such as `margin-top:14px`, or a custom property such as `--pct:`), URLs, email addresses and attribute values (`mailto:`, `_blank`, `noopener`) are skipped; URLs and email addresses are checked by the contact and phone tests instead.
- Token regexes: number `\d[\d,]*(\.\d+)?[+%]?`, where a sentence-final period is not part of the token (it is stripped first); so `300K+` and `300,000+` are different tokens, and each must occur in the source set built with the same tokenizer. Years `19xx` and `20xx` are number tokens. Acronym `[A-Z]{2,}`. Camel-case product name `[A-Z][a-z]+[A-Z]\w*`. Capitalised word `[A-Z][a-z]+`. Slashes and digits split tokens (`CI/CD` gives `CI` and `CD`). Lowercase tokens are not checked. Single letters are not checked.
- The rule: every number token, acronym, camel-case name and capitalised word in the scanned content must occur as a whole token in the source set (per token, not as a contiguous phrase), unless the token is in `scripts/content-allowlist.json`. Scanned files: `src/content/contact.js`, `projects.js`, `experience.js`, `education.js`, `dialogues.js`, `milestones.js` and `resumeText.js`. `signage.js` is EXCLUDED because its place names are placeholders (A15). `tests/` is not scanned. The allowlist file is `{ "doc": "...", "words": [ { "token": "Resume", "reason": "UI heading" } ] }`; every entry needs a non-empty `reason`. It holds interface words and sentence starters: `The`, `A`, `An`, `In`, `On`, `At`, `Of`, `For`, `And`, `With`, `From`, `To`, `I`, `It`, `Is`, `This`, `That`, `Press`, `Walk`, `Click`, `Tap`, `Download`, `Resume`, `Close`, `Show`, `Email`, `Back`, `Skip`, `Next`, `Done`, `Welcome`, `Open`, `Hotel`, `Grand`, `Skills`, `Experience`, `Projects`, `Education`, `Certifications`, `Milestones`, `Contact`, `ACT`, `Quick`, `Tour`, and the month names: January to December and Jan to Dec, including May (reason "month name"). Abuse test: no allowlist entry is a number token, and no allowlist entry appears in `tests/fixtures/content/proper-nouns.json`.
- Non-circular proof (mutation tests, in the same unit test file): copy `src/content/dialogues.js` into a temp root and append a new fact with a company name that is not in the resume (for example "Acme Corp"): `checkContent` fails with that token. Copy it again and change the number `300,000` to `350,000`: `checkContent` fails with `350,000`. Both failures must be reported with file and line. The snapshots alone cannot make these pass.
- Other tests: a clean sample passes; a new number `500K` fails; a changed percentage fails; an allowlisted word passes; a token inside a code identifier is ignored but the same token inside a string is checked; `buildSourceSet` reads both sources; the real current content passes.
- Allowlist fixture: when the allowlist is final for this plan, copy `scripts/content-allowlist.json` byte for byte to `tests/fixtures/content/allowlist-v0.json` (frozen). Plan 074 may only ADD entries with `reason` "sentence starter" on top of it. `tests/unit/scripts/checkContent.test.js` asserts that every entry of the fixture is still in `scripts/content-allowlist.json` with the same token and reason.
- `npm run check:content` must pass on the current content. If it fails on a real token that is a UI word, add the exact token to the allowlist with a reason, and list that addition in the report. If it fails on a token that is a fact, the step stops as not done and reports the token; this plan does not edit `src/content/**`. Human check: approve every new allowlist word.

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
