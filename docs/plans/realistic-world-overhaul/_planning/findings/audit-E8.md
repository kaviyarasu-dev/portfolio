# Plan-auditor verdict: E8 (plans 075-079) - NEEDS FIXES (2 blockers, 6 major, 2 minor). Fix in defs/e8.mjs.

Coverage complete (R3, R13, journeys 1-8, section 5). Order: earlier-only deps, 079 last, pause_after 079.

Findings:
1. [BLOCKER] 075 phone-download.spec.js runs on vite preview (production); window.__world is dev-only (003 prod-hook check), so ready, listLights, rendererInfo, quality fail there. Port 4173 clashes with dev webServer (reuseExistingServer). make-preload.mjs same. Fix: measure bytes on preview from network events + DOM ready only; move lights and draw-call checks to a dev-server spec.
2. [BLOCKER] 078 frozen runbook.test.js needs pages.yml to contain check:audit and check:dist, which only 079 adds; 078 runs before 079. Move the Deploy-order assertion into 079; correct order prose in 078 and 079.
3. [major] 075 sets decorScale 0.5 on medium and tests 45-55 percent; frozen TIER_SETTINGS (011) has medium 0.8 and 036/038 read it. Read TIER_SETTINGS[tier].decorScale and interiorsOnEntry; assert medium 75-85 percent.
4. [major] 077 journey-6: ?time=0.75&freeze=1 but 065 audio filter stops under freeze (cutoff asserts cannot pass). Open without ?time and call setTime(0.75). Also group 'street' vs 063's id prefix street-lamp- plus auto 'dusk': use the 063 rule.
5. [major] 078 frozen readme test requires npm run check:phone in README; 004 requires no "phone" in README (case-insensitive). Drop check:phone from README command list.
6. [major] 079 checkSizeDist.test.js needs dist/ but runs inside npm test, before build in full and ci gates; reset deletes dist/. Put dist assertion in check-size --dist only, or build first.
7. [major] 079 finalReport.test.js is frozen and verified but no step creates it; if it exists before the report it breaks the step-3 strict full gate. Create it explicitly after the report.
8. [major] 076 est_turns 60 but goal text says about 120 turns (above maxTurns 100). Split or justify.
9. [minor] 076 deleting assets can leave stale ledger entries. Remove each deleted file's LEDGER entry before check:ledger.
10. [minor] 077 names fastTravelPoint in src/systems/teleport.js and .map-marker[data-zone]; neither exported by src/ui/map.js as stated. interiorState, pooled not in ARCH 10.5/10.8: add.

Could not verify: whether 040 creates the 14 <zone>-outside spot ids; how check-budget exits on WARN; full requirements.md.
