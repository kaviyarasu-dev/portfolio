# Plan 074: Rewrite and enrich the content from existing facts only

Epic E7. Estimated turns: 50.

## Goal

Make the words as good as the world: clearer, more vivid, better structured text for the hotel reception introduction, the skills board lead-in, the experience bullets, the project dialogues, the milestones plaque, the education and certification lines and the text-mode about paragraph, using ONLY facts that are in the resume PDF text (tests/fixtures/content/resume-source.txt) and the frozen v1 snapshots (tests/fixtures/content/v1/). No new numbers, companies, products, technologies, titles or claims. `npm run check:content` (plan 073) is the judge and must pass; the structure facts (stack lists, metrics, periods, skill percentages, contact links) stay exactly as they are.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Facts), decision D12 in _planning/requirements.md, assumptions A3 and A24)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/content/dialogues.js (plan 002 port; PLAZA_INTRO, SKILLS and the plaza, skills and milestones builders, plan 067 exports)
- src/content/milestones.js (plan 067: MILESTONES)
- src/content/projects.js
- src/content/experience.js
- src/content/education.js
- src/content/resumeText.js (plan 067: reads PLAZA_INTRO; rewrites nothing itself)
- src/content/contact.js (plan 004: read only)
- tests/fixtures/content/resume-source.txt (plan 073)
- tests/fixtures/content/v1/*.txt (plan 073)
- scripts/check-content.mjs and scripts/content-allowlist.json (plan 073)
- tests/fixtures/zoneExpect.json (plan 043)
- tests/e2e/dialogues-all.spec.js (plan 057)
- tests/e2e/text-mode.spec.js (plan 067)
- scripts/check-phone.mjs (plan 004)

High-risk assumptions that touch this plan (each has a step that checks it):
- A3 and A24 (HIGH-RISK, facts): a rewrite may drift into invented claims. The checker catches new numbers and new proper nouns, not a wrong sentence; the person must read the result (human check).

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Rewrite guard tests first

Deliver:
- Content locations (what may change, and where): plaza intro = the `PLAZA_INTRO` export of `src/content/dialogues.js` (also the source of the text-mode `about` paragraph through resumeText.js, so it is rewritten once); skills board lead-in = the lead-in string of the skills builder in `dialogues.js` (the `SKILLS` data is not rewritten); milestones plaque = the `MILESTONES` array of `src/content/milestones.js` and its plaque builder in `dialogues.js`; experience bullets = `src/content/experience.js`; project summaries and bullets = `src/content/projects.js`; education and certification lines = `src/content/education.js`. OUT OF SCOPE: `contact.js` (fixed links and email) and `signage.js` (placeholders, A15), and `resumeText.js` (no new prose). Keep the dialogue structure (titles with building display names, chips, metric grids, closing hint) so the builders and tests keep working.
- `tests/unit/content/rewriteGuard.test.js` first (it must pass on the current content and keeps passing after the rewrite). The parse rule for the v1 snapshot: a token scan over the whole snapshot text (not line-based), `name:\s*'([^']+)'` and `pct:\s*(\d+)` in order for SKILLS, and `stack:\s*\[([^\]]*)\]` for each stack array. Checks: the stack arrays of every project and experience entry are set-equal to the v1 snapshot; every `metrics` entry (`num` and `caption`) of the projects equals the v1 set; every `period` string equals v1; the SKILLS names and percentages equal v1; the number of experience entries, project entries and bullets per entry is not lower than v1 (enrichment may add bullets only when the new bullet passes `check:content`); contact links equal v1; the `zoneExpect.json` required strings still occur; the length of `dialogues.js` is at most 1.5 times the length of `tests/fixtures/content/v1/dialogues.js.txt`. Negative test (proves the guard can fail): an in-memory copy of the parsed data with one changed stack entry, one changed period, or one changed percentage makes the guard fail.
- `tests/unit/content/allowlistStarters.test.js` (A24 guard, frozen by this plan): loads `tests/fixtures/content/allowlist-v0.json` (plan 073, frozen) and `scripts/content-allowlist.json` (current). Every fixture entry is still present with the same token and reason (nothing removed or changed). Every NEW entry (not in the fixture) has `reason` exactly "sentence starter", its token matches `/^[A-Z][a-z]+$/` (a capitalised word, never a number, acronym or camel-case name), and the token does not occur in `tests/fixtures/content/proper-nouns.json`. Negative test: an in-memory list with a new entry "Acme" (reason "UI heading") or a new number token fails the test.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/rewriteGuard.test.js tests/unit/content/allowlistStarters.test.js`

### Step 2: Rewrite the content and prove the change

Deliver:
- Rewrite for clarity and voice, plain direct English, active verbs, short sentences; first person where the text speaks as the person (the reception intro, a warm two-paragraph welcome that says who the person is and what the visitor can find in the town; only facts of the current intro), neutral elsewhere. Items to rewrite (N = 6, the keys used by the change test): `intro` (PLAZA_INTRO), `skillsLead` (skills lead-in), `milestonePlaque` (MILESTONES plaque text), `education` (education lines), `experience[0].bullets` (the first experience entry bullets, tightened, every fact and number kept, reorder allowed), `projects[0].summary` (the first featured project summary). Further rewrites of other entries are allowed by the same rules.
- Enrichment means better explanation of facts that exist (for example saying what a multi-provider LLM stack means in one clause, with words already in the sources; the entries whose stack includes an LLM provider name are in `projects.js` and `experience.js`), never a new fact. Do not add skill percentages, user counts, client names, dates or links that are not already present.
- Sentence starters: the checker (plan 073) rejects capitalised words not in its allowlist, so this plan may add ONLY sentence-starter words (for example "My", "Every", "Each", "Here", "You", "Explore", "Visit") to `scripts/content-allowlist.json`, each with `reason` "sentence starter". This plan may write that one file (added to its allowed paths for this purpose only). Proper nouns, numbers and acronyms are never added. Every addition is listed in `docs/review/content-changes.md`.
- Lowercase claims: `tests/unit/ui/claimWords.test.js` fails when the content (`src/content/*.js` scanned by plan 073 rules) contains one of these words, unless the word occurs in `resume-source.txt`: "award", "award-winning", "leading", "best", "world-class", "millions", "thousands", "expert", "guru", "years of experience". The human check remains the final review.
- Run `npm run check:content` after each file you edit. A failure means a fact was added or a starter was missing: fix the text (a missing starter goes to the allowlist with a reason; a new fact is removed).
- `tests/unit/content/rewriteDiff.test.js` proves the change happened: for each of the 6 keys, the current text differs from the v1 snapshot text (read from `tests/fixtures/content/v1/*.txt`), and `docs/review/content-changes.md` has one entry per key containing the old text and the new text. It fails before the rewrite and passes after it. `tests/fixtures/zoneExpect.json` `mustInclude` strings are changed ONLY when a rewrite removes a required phrase; each such edit is listed in `content-changes.md`; otherwise the file is untouched.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run check:content`
- `npx vitest run tests/unit/content/rewriteGuard.test.js tests/unit/content/rewriteDiff.test.js tests/unit/ui/claimWords.test.js tests/unit/ui/resumeText.test.js tests/unit/content/zoneExpect.test.js`

### Step 3: Browser proof and the review list

Deliver:
- Run `tests/e2e/dialogues-all.spec.js` (all 14 dialogues still open with their expected strings) and `tests/e2e/text-mode.spec.js` (the text mode shows all sections). The Playwright server is the dev server of the `webServer` in `playwright.config.js` (frozen by plan 001; not `vite preview`, because these specs wait on `window.__world`, which the prod build strips). No console errors. `npm run check:phone` passes. The pw timeouts are kept (dialogues-all opens 14 dialogues in one run).
- Write `docs/review/content-changes.md`: one entry per changed item (the 6 keys and any others), with the old line from the v1 snapshot and the new line side by side, and any allowlist starter or zoneExpect edit. This is written by hand from the snapshot and the diff; it is the document the person approves.
- If blocked (a fact cannot be kept, or the checker rejects a legitimate word): the step stops and the report says so. Exception to the plan-folder rule: write `BLOCKED.md` in the plan folder (INSTRUCTIONS rule 2) and nothing else there.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/dialogues-all.spec.js`
- `npx playwright test tests/e2e/text-mode.spec.js`
- `npm run check:phone`
- `node "{{runner}}/assert.mjs" exists docs/review/content-changes.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run check:content`
- `npx vitest run tests/unit/content/rewriteGuard.test.js tests/unit/content/allowlistStarters.test.js tests/unit/content/rewriteDiff.test.js tests/unit/ui/claimWords.test.js tests/unit/ui/resumeText.test.js tests/unit/content/zoneExpect.test.js`
- `npx playwright test tests/e2e/dialogues-all.spec.js`
- `npx playwright test tests/e2e/text-mode.spec.js`
- `npm run check:phone`

Human check (goes in the report, never blocks): MILESTONE of epic 7: read `docs/review/content-changes.md` and approve every sentence; the checker cannot judge meaning.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
