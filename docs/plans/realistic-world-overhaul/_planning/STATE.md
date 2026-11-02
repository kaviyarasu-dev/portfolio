phase: splitting
slug: realistic-world-overhaul
repo: C:\xampp-8.2\htdocs\kavi\New folder\portfolio  (git root; branch main only so far; remote origin kaviyarasu-dev/portfolio; all plan work goes on branch world-v2)
Size: XL
Spec: docs/specs/2026-10-30-realistic-world-overhaul-design.md
Architecture: docs/plans/realistic-world-overhaul/ARCHITECTURE.md
Questions asked: 33 of 45
Batches: 13
Epics: E1 foundation; E2 vertical slice (hotel + square) then PAUSE; E3 town/terrain; E4 other 13 buildings; E5 life; E6 audio; E7 elite extras; E8 polish + deploy

Split progress: ALL epics written (plans 001-079, validator VALID). REVIEW PHASE (Step 3): cold readers DONE and fixed for 001-012 (see split-review.md). Cold readers for 013-017 were started but their results were not recorded: re-run them. TODO: cold readers 013-079 (5 at a time, plan-cold-reader subagent, give folder path + plan id), then plan-auditor per epic E1..E8 + one cross-epic (architecture and contracts only), record each verdict in split-review.md, fix, max 2 rounds, validator VALID, then show the table (STEP 4) and ask approval, then set phase: plans-approved and give the STEP 5 run text (user must first create branch world-v2 in portfolio and commit docs/specs; docs/plans is ignored by the dirty check).
Plan sources: _planning/defs/*.mjs (data), _planning/gen.mjs (renders NNN-*.md and manifest.json). Re-run: node docs/plans/realistic-world-overhaul/_planning/gen.mjs

How to edit plans: NEVER edit NNN-*.md or manifest.json by hand. Edit _planning/defs/e*.mjs (and _planning/buildingPlan.mjs for 043-044,046-048..056), then run: node docs/plans/realistic-world-overhaul/_planning/gen.mjs and node $HOME/.claude/tools/plan-runner/validate.mjs docs/plans/realistic-world-overhaul. Inside defs, strings are single-quoted JS: escape inner single quotes as backslash-quote or use double quotes; run node --check on each defs file after edits. Safest patch method: a small .cjs script with string replace pairs.
Known global rules already decided: v1 opens dialogues only on E; tests with ?time= add &freeze=1; ledger exempt files (isLedgerExempt); manual-drop-in ledger notes; MAX_PATH_METRES 460; check:local gate; publicDir is assets/.

## Review progress (updated 2026-11-02; resume from here)
- Cold readers DONE (verdict logged in split-review.md): 001-025, 027. Re-run needed: 026, 028-079 (026 and 028-031 were cut off by an API rate limit).
- Reader reports are NOT kept anywhere except as briefs in _planning/findings/NNN.md (013-025, 027). Fixers read those briefs, edit defs, run node --check only; the lead runs gen.mjs + validator.
- Fix status: fixers for e1c (013-015), e2a (016-020), e2b (021-025) launched 2026-11-02; e2c (027, with 028-031) not yet. Round 1 ends when all defs are fixed and the validator says VALID.
- Global additions: ARCHITECTURE.md section 10.8 (angles: yaw 0 looks -z; object rot = rotation.y; hook extras; urlParams-only; ledger exempt; poll instead of fixed waits). gen.mjs supports `maxTurns` (-> manifest max_turns) and `deps`. est must stay <= 60 (validator warns above), use maxTurns for heavier plans.
- Then: plan-auditor per epic E1..E8 + one cross-epic (architecture and contracts only), record verdicts in split-review.md, max 2 rounds, STEP 4, approval, "phase: plans-approved", STEP 5.

## RESUME HERE (written 2026-11-02 when conversation 1 ran out of context; all subagents were stopped)
State of the defs right now: all defs files pass node --check, gen.mjs ran, validator says VALID (79 plans).
Cold-reader verdicts logged in split-review.md for 001-030 (all NEEDS FIXES except 001-012 which are already fixed). NOT yet cold-read: 031 and 032-079 (031-033 readers were stopped half way, read them again).
Findings briefs (paraphrased reader reports) are in _planning/findings/NNN.md for 013-030 (+ 076.md note). They are the fix spec.
Round-1 fix status (defs edited by fixers):
- DONE: 013, 014, 015 (e1c.mjs), 016, 017, 018, 019 (e2a.mjs; each got maxTurns).
- NOT done: 020 (e2a.mjs, brief findings/020.md).
- TOUCHED but a fixer was killed mid-run: 021, 022, 023, 024, 025 (e2b.mjs). Re-check each against its findings/NNN.md (and the cross-plan requests inside findings/024.md, 026.md, 027.md) and finish the missing items. 026 (e2b.mjs) has a brief but no fix. 027-030 (e2c.mjs) have briefs but no fix.
- ARCHITECTURE.md section 10.8 holds all global conventions added so far (yaw, object rot, hook extras, urlParams-only, ledger exempt, poll not wait, plus fixer bullets). INSTRUCTIONS rule 12 now says "the plan folder's manifest.json".
- Global policy decided: est <= 60 always; heavier plans get `maxTurns` (gen.mjs emits max_turns, runner honours it). Mention in STEP 4 as an open item that several plans are heavy (021, 024, 026, 027, 029 estimated 75-110 turns by readers).
- Rate limit warning: running ~8 subagents at once hit the 5-hour limit. Use at most 3-4 agents at a time. Plan-cold-reader agents sometimes stop at a 15-turn limit without a report: send them a message to deliver the report or re-run them.
- Cold-reader output files are empty; the report only arrives as a message, so after each report write a findings brief (findings/NNN.md) and one line in split-review.md right away.
Next steps in order: (1) finish round-1 fixes for 020-030 (fixers per defs file, max 3 at once, read findings briefs); (2) cold-read 031-079 in batches of 3-4, write briefs, fix; (3) run gen.mjs + validator after each batch; (4) plan-auditor per epic E1..E8 + one cross-epic (architecture and contracts only), spec docs/specs/2026-10-30-realistic-world-overhaul-design.md; record verdicts; max 2 rounds; (5) STEP 4 table + approval; (6) phase: plans-approved; (7) STEP 5 run instructions (branch world-v2 + commit docs/specs first, never run the runner yourself).
