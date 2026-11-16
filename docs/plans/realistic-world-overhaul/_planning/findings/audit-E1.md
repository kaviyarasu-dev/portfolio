# Plan-auditor verdict: E1 (plans 001-015) - NEEDS FIXES

Coverage: every E1 deliverable has an owner. Phone-tier download (<25 MB) and the per-building GPU cap are owned by 075 (E8); 010 keeps a --phone stub. Fixed rules hold.

Findings (fix in the defs file named):
1. [blocker] 009: `@fontsource/*` install changes package.json, package-lock.json and node_modules but none are in allowed_paths. Fix defs/e1b.mjs 009: add those three paths (as 001 and 006 do).
2. [major, order] 013: materials.spec.js uses setCamera, a no-op until 014 adds camRig.override. Fix defs/e1c.mjs: move 014's cameraOverride and setCamera/cameraState hook into 013 step 5, or before it.
3. [major, frozen test breaks] 015: streaming.spec.js test 4 expects areas exactly [v1-world]; 031 force-loads centre and hotel. Fix defs/e1c.mjs 015: assert v1-world is loaded and loadOrder[0] === 'v1-world'.
4. [major, frozen test likely breaks] 013: materials fixture asserts exactly 25 built-in names from live MATERIAL_NAMES; 022 adds names. Fix defs/e1c.mjs 013: export a fixed list of the 25 built-in names and build the fixture from it.
5. [major, scope unverified] 005, 006, 008 (defs/e1b.mjs) and 013 (defs/e1c.mjs) write to ../portfolio-asset-cache outside the repo, but allow_extra is empty. Fix: allow that folder (or record the sandbox limit).
6. [minor] 005: isLedgerExempt also exempts *.md and assets/licenses/**; ARCH 10.8 lists only LEDGER.json, INDEX.json, set.json. Fix defs/e1b.mjs 005: align or record the difference.
7. [minor] 011: applyTier.test.js not frozen, not in acceptance; nextAutoTier test file never named. Fix defs/e1c.mjs.
8. [minor] 007: audio-assets.spec.js uses a fixed 4 s wait; poll for the .wav response instead. Fix defs/e1b.mjs.
9. [minor] 004: phone-copy search reaches docs/, outside allowed paths. Fix defs/e1a.mjs: limit to the check-phone scope.

Could not verify: whether frozen 003 v1-behaviour.spec.js still passes after E4 zone object mode (runtime, 053/057); whether teleport(250,0) works in fixture mode (012/015); runner sandbox writes outside repo (finding 5).
