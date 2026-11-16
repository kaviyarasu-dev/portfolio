# Plan-auditor verdict: E2 (plans 016-031) - NEEDS FIXES (3 blockers, rest major/minor)

Coverage: every E2 item has an owner; depends_on earlier only. Fixed rules hold (freeze, expect.poll, Poly Haven only in 030, v1-world priority 100, E key only).

Findings:
1. [BLOCKER] 031 sets plaza to mode 'object', but frozen 024 zonesDisplayName.test.js asserts all 14 zones are mode 'radius'. Fix defs/e2b.mjs (024): allow radius|object, or assert radius only for not-yet-converted zones.
2. [BLOCKER] After 031, teleport('plaza') lands at lobby spawn 5 m from the desk and plaza has no radius fallback; frozen 017 doors.spec.js test 5 (teleport plaza, press E, dialogue shows) fails. Fix defs/e2a.mjs (017): use a zone that stays radius until E4, or the interactions fixture.
3. [BLOCKER] Frozen 024 plaza-shell.spec.js requires rendererInfo().calls < 150 with interior visible; 021 clones props per item, 025/026 add details. 026's own test allows < 400 but 026 still runs plaza-shell. Fix defs/e2b.mjs (024): read the limit from src/budgets.json (600); or 021 merges or instances props per room.
4. [major] 029 banyan platform and trunk colliders sit at (0,20), where frozen 003 v1-behaviour.spec.js and 008 avatar.spec.js teleport the player. 029 does not run those specs. Fix defs/e2c.mjs (029): move platform off (0,20), update ARCH 10.8, add both specs to 029 verify.
5. [major] 019 catalog.test.js checks meta keys land on userData without naming a key; 022 makes unknown meta keys throw. Fix defs/e2a.mjs (019): test with lightSockets or parts only.
6. [minor] 027 step 1 checks docs/building-manifest.md has wallMaterial (true after 020); 031 step 1 checks zones.js has Grand Hotel (true after 024). Replace these checks in defs/e2c.mjs.
7. [minor] 031 text says 024 handles interior hiding and interiorsOnEntry; 024 does neither (021 hides; nothing applies the tier setting). Fix text in defs/e2c.mjs (031).
8. [minor] maxTurns below 85 in 016, 019, 020, 025, 030 (80), 017, 023, 028 (75), 022 (70); rule is 85-100 for est > 60 only. Confirm or raise in defs/e2a.mjs, e2b.mjs, e2c.mjs (est is 60, so the rule as written allows it; decide and note).
9. [minor] ARCH 10.8 spot-id list omits square and the fixture hotel-* spots (hotel-front, hotel-lobby, hotel-corner, hotel-reception, hotel-restaurant, hotel-kitchen, hotel-stairhall, hotel-corridor, hotel-guest-1, hotel-bath-1, hotel-rooftop). Add to ARCH 10.8 (lead edit).

Not verified: no tests run; draw-call and teleport-in-collider failures are estimates; 018, 020, 022, 023 step bodies not read in full.
