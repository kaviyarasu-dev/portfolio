# Plan-auditor verdict: E4 (plans 041-057) - NEEDS FIXES (1 blocker, several major)

Coverage: every E4 item has an owner (all 13 buildings 043-056, citadel split 045/046; R6 shots; R8 zone test in 057; 14 dialogues in 057; journeys 2-4). Rules checked OK: E key only, freeze, no public/, Poly Haven only, MAX_PATH_METRES untouched, walkTo on roads only, 057 keeps v1-world, est 60 / maxTurns 85-100, all 14 buildings register via registerLandmarkArea, room bounds do not overlap per floor.

Findings:
1. [BLOCKER] 051-057: they say edit js/world/buildings.js, js/world/buildingAnims.js, js/world/collision.js, js/ui/minimap.js, but plan 002 deletes js/. Real files live under src/. Fix defs/e4c.mjs (051-057): change every js/ path to src/ (allowed_paths, none/absent asserts, v1 removal text).
2. [major] 043, 046, 047, 048: "check the removed v1 factory with none" is not in any verify; 047 and 048 lack createXArea in areas/index.js, stage full, dialogue rename, README asserts; 046 lacks createCitadelArea assert. Fix: add none('src/world/buildings.js', <factory>) and has/json asserts to verify4 in defs/e4a.mjs (043) and defs/e4b.mjs (046-048).
3. [major] 046-050: e2e never presses E away from the read object (would open radius-mode dialogue), so a zone never switched to mode 'object' is not caught. Fix defs/e4b.mjs: add the negative check (044 has it as the model).
4. [major] 051-057: tests/unit/world/zones.test.js is run from 051 but 057 step 1 says create it as new and freeze it; the fails-before claim is false. Fix defs/e4c.mjs: 051 creates it, or 051-056 stop running it; 057 extends.
5. [major] 055, 056: depends_on skips 043/044 and 051-054 though they use zoneExpect.json and forgeArea pattern, and edit shared files (areas/index.js, registry.js, zones.js, signage.js, README, budgets.json). Fix defs/e4c.mjs: depends_on ['054'] for 055 and ['055'] for 056 (or add 043/044 explicitly).
6. [minor] 054: verify runs tests/unit/props/school.test.js, which no plan creates (042 makes schoolPost.test.js). Fix defs/e4c.mjs.
7. [minor] 055: lighthouse.spec.js listed twice in freeze; "hold d for 2 s" is a timed hold. Fix defs/e4c.mjs: poll-only wording.
8. [minor] 046-050: e2e gives no URL, unlike others (?only=<id>&time=0.5&freeze=1&seed=1337). Fix defs/e4b.mjs.

Could not verify: assert.mjs none on a missing file (decides whether finding 1 fails falsely); loft (050) and archive-stacks (053) level; prop claimed by two rooms (room bounds only compared); ledger exempt notes absent in E4.
