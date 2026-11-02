# Plan 074: Rewrite and enrich the content from existing facts only

Epic E7. Estimated turns: 50.

## Goal

Make the words as good as the world: clearer, more vivid, better structured text for the hotel reception introduction, the skills board, the experience timeline, the project dialogues, the milestones plaque and the text mode summary, using ONLY facts that are in the resume PDF text and the pre-rewrite content files. No new numbers, companies, products, technologies, titles or claims. `npm run check:content` is the judge and must pass; the structure facts (stack lists, metrics, periods) stay exactly as they are.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 7 (Facts) and decision D12, assumption A3, A24)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/content/dialogues.js
- src/content/projects.js
- src/content/experience.js
- src/content/education.js
- src/content/resumeText.js
- tests/fixtures/content/resume-source.txt
- tests/fixtures/content/v1/dialogues.js.txt
- scripts/check-content.mjs
- tests/fixtures/zoneExpect.json

High-risk assumptions that touch this plan (each has a step that checks it):
- A3 and A24 (HIGH-RISK, facts): a rewrite may drift into invented claims. The checker catches new numbers and new proper nouns, but not a wrong sentence; the person must read the result (human check).

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Rewrite guard tests first

Deliver:
- `tests/unit/content/rewriteGuard.test.js` first (it must pass on the current content, and keeps passing after the rewrite): the stack arrays of every project and experience entry are set-equal to the v1 snapshot (parse the arrays out of the `.txt` snapshots with a regex per `stack: [...]`); every `metrics` entry (`num` and `caption`) of the projects equals the v1 set; every `period` string equals v1; the `SKILLS` names and percentages equal v1; the number of experience entries, project entries and bullets per entry is not lower than v1 (enrichment may add bullets only if each new bullet passes `check:content`); contact links equal v1; the `zoneExpect.json` strings still occur; no dialogue builder output text exceeds 1800 characters before the lists.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/rewriteGuard.test.js`

### Step 2: Rewrite the content

Deliver:
- Rewrite for clarity and voice, in plain direct English, active verbs, short sentences, first person where the text speaks as the person (reception intro) and neutral elsewhere: `plaza` intro (a warm two-paragraph welcome that says who the person is and what the visitor can find in the town; only the facts of the current intro), skills board lead-in, each experience bullet (tighten, keep every fact and number; you may reorder), project summaries and bullets, milestones plaque, education and certification lines, the text-mode `about` paragraph. Keep the dialogue structure (titles with the building display names, chips, metric grids, closing hint) so the builders and tests keep working.
- Enrichment means better explanation of facts that exist (for example saying what a multi-provider LLM stack means in one clause, using words already in the sources), never adding a fact. Do not add skill percentages, user counts, client names, dates or links that are not already present.
- Run `npm run check:content` after each file you edit. Any failure is a signal that you added a fact: fix the text.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run check:content`
- `npx vitest run tests/unit/content/rewriteGuard.test.js tests/unit/ui/resumeText.test.js tests/unit/content/zoneExpect.test.js`

### Step 3: Browser proof and the review list

Deliver:
- Run the full dialogue journey `tests/e2e/dialogues-all.spec.js` and `tests/e2e/text-mode.spec.js`: all 14 dialogues still open with their expected strings, the text mode shows all sections, no console errors, `npm run check:phone` passes.
- Write `docs/review/content-changes.md`: for each changed content item the old line and the new line side by side (read the v1 snapshot), so the person can approve the wording quickly.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/dialogues-all.spec.js`
- `npx playwright test tests/e2e/text-mode.spec.js`
- `node scripts/check-phone.mjs`
- `node "{{runner}}/assert.mjs" exists docs/review/content-changes.md`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run check:content`
- `npx vitest run tests/unit/content/rewriteGuard.test.js tests/unit/ui/resumeText.test.js tests/unit/content/zoneExpect.test.js`
- `npx playwright test tests/e2e/dialogues-all.spec.js`
- `npx playwright test tests/e2e/text-mode.spec.js`
- `node scripts/check-phone.mjs`

Human check (goes in the report, never blocks): MILESTONE of epic 7: read `docs/review/content-changes.md` and approve every sentence; the checker cannot judge meaning.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
