# Plan-auditor verdict: E6 (plans 064-066) - NEEDS FIXES (1 blocker, several major)

Coverage complete: 064 footsteps and surface map (R11); 065 ambience falloff, walls, muffling, echo, __world filter, door test; 066 music per area, 6 legacy loops, sliders. Order 063->064->065->066, caps, freeze lists, pause_after, mute key N (no clash with M map) fine.

Findings (fix in defs/e6.mjs):
1. [BLOCKER] 064 step 2 deletes src/systems/audio.js, but frozen 007 tests/unit/audio/files.test.js imports AUDIO_FILES from it and 064's acceptance runs it. Keep audio.js as a re-export of AUDIO_FILES; drop the must-not-exist check in step 2 verify.
2. [major] 066 "audioState() gains music" breaks frozen 064 engine.test.js (exact key set). Merge music at the hook level, as 065 does.
3. [major] 017 toData() returns {id,state,open,locked,x,z}; kind, progress and pos needed by 064 door e2e and 065 mixer do not exist. Add these to door data in 064 step 2, with a unit test.
4. [major] 018 emits sfx:lift-move and sfx:lift-ding with {id} only; sfx:lift-move-start/-stop never fire; no event carries pos. Map the real event names in 064.
5. [major] events.js mappings and footstep cadence, round-robin and wading rules have no verify; empty stubs pass. Add events.test.js and footsteps.test.js with fakes (064).
6. [major] 065/064 assume BuildingInstance.rooms are objects with bounds, floorY, height, surface; 021 gives room id strings and insideRoom() returns an id. Name a helper that resolves room data from manifest plus placement.
7. [major] 066 AREA_IDS is not exported by 040. Create and export it in src/world/areas/index.js (066).
8. [major] 065/066 weather hook (062 getWeatherState) has no rain field. Add rain to state (065).
9. [major] Freeze conflict: 065 says game time stops under ?freeze=1, but 064 footsteps e2e and 066 crossfade (time=0.75&freeze=1) need dt to run. Audio uses the game-loop dt (not frozen).
10. [major] 007 frozen audio-assets.spec.js unlocks with Shift, which 064 excludes. Let Shift unlock, or preload before unlock.
11. [minor] Effects slider has no observable state or check. Report sfx and assert it (066).
12. [minor] /audio/sfx/ URLs ignore /portfolio/ base; inLift has no source; splash_rain comes after 062; renderRecipe cannot see LOOPS; import check covers only src/systems (064).
13. [minor] Ledger fields should be sourceUrl and host local, not source (066).

Could not verify: exact toData shape in frozen 017 tests; Howler requests before unlock; total asset size vs 80 MB.
