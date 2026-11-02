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
