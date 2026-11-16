# Plan-auditor verdict: E3 (plans 032-040) - NEEDS FIXES (no blockers, 6 major)

Coverage: every R9/E3 deliverable has an owner. Fixed rules hold. Depends_on chain linear and correct. One fixed wait (037).

Findings (fix in the defs file named):
1. [major] 040: day-shots names spot `hotel-front`; plan 031 calls it `slice-hotel-front`. shots.mjs throws on unknown spot. Fix defs/e3b.mjs 040.
2. [major] 039: gopuram passage 3.5 m wide but the 7 m `main` road (kerbs about +-3.7 m) is routed through it; clear-road check samples only the centreline. Fix defs/e3b.mjs 039: passage at least 8 m; sample at +-(width/2 - 0.5) as 034 does.
3. [major] 036 vs 038/039: vegetation not checked against objects placed later (fish market vs palms behind quay strip; gate and temple inside open-ground palm zone). Fix defs/e3b.mjs 038 and 039: add scatterVegetation colliders to clear and overlap tests, or exclude local/harbour footprints in 036 (defs/e3a.mjs).
4. [major, fixed wait] 037 test 2: hold w released after 3 s. Fix defs/e3b.mjs 037: poll until position stops changing between two samples.
5. [major] 032/038: moored boat-fishing hull 2.6 m wide sits 2.5 m beside the jetty; overlaps 4 m deck. Fix defs/e3a.mjs 032: offset at least 3.9 m from the axis; test boat rectangles against jetty rectangle.
6. [major] 037: verify `none js/world/buildings.js` targets a folder plan 002 deletes (meaningless). Fix defs/e3b.mjs 037: point to src/world/buildings.js.
7. [minor] 036: vegetation is all code-built; Poly Haven never tried, though R9 says CC0 trees/plants. Fix defs/e3a.mjs 036: add Poly Haven attempt or explicit justification.
8. [minor] 040: text says vegetation uses 100 m chunks; 036 fixes 150 m. Fix defs/e3b.mjs 040.
9. [minor] 035/036: `has budgets.json ""shore""` quoting lost in shell; 039 step 1 `has town.json "gate"` already passes before work ("gateway" contains it). Fix defs/e3a.mjs and defs/e3b.mjs (cosmetic).
10. [minor] 037: manifest has no human_check though the plan text has one. Fix defs/e3b.mjs 037.

Could not check: assert.mjs handling of none on a missing file (finding 6); controller.js -0.5 literals vs 033 none check; exact catalog prop names (table-folding, stool) matched only by grep in 019/023.
