/plan-split realistic-world-overhaul

Idhu already half-done. Chat memory illa, files la irundhu continue pannu.

1. Muthalla ippadi read pannu: portfolio/docs/plans/realistic-world-overhaul/_planning/STATE.md (kadaisi "RESUME HERE" section romba mukkiyam), _planning/split-review.md, EPICS.md, ARCHITECTURE.md (section 10 + 10.8 final), INSTRUCTIONS.md. Pinnaadi _planning/findings/ folder la irukkura brief files paaru (013-030 + 076.md). Adhu thaan fix spec.

2. 79 plans (001-079, 8 epics) written. Validator VALID. Plans-a naan ezhudha vendam. NNN-*.md and manifest.json-a kaiyala edit panna koodathu. Plan sources: _planning/defs/e*.mjs and _planning/buildingPlan.mjs. Edit pannina piragu: node docs/plans/realistic-world-overhaul/_planning/gen.mjs, then node $HOME/.claude/tools/plan-runner/validate.mjs docs/plans/realistic-world-overhaul. defs la single-quote string, so inner quote escape pannu, node --check run pannu. (Ellaa commands portfolio folder la irundhu run pannu.)

3. Ippo irukkura nilai (STATE.md la detail irukku):
   - Cold readers done: 001-030. Innum cold-read pannala: 031-079 (031-033 half la nirutha pattu, thirumba run pannu).
   - Round-1 fixes DONE: 001-019. NOT done: 020, 026-030 (briefs irukku). 021-025 fixer kill aanadhunaala partial, findings/NNN.md-oda compare pannitu missing items-a mudi (findings/024.md, 026.md, 027.md la cross-plan requests irukku).
   - Cold-reader report message ah thaan varum (output file empty). Ovvoru report vandhadhum udane findings/NNN.md brief + split-review.md la oru line ezhudhu.
