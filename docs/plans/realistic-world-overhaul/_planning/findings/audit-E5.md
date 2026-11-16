# Plan-auditor verdict: E5 (plans 058-063) - NEEDS FIXES (3 blockers, rest major/minor)

Coverage: every R10/D8/D23/A27/A26 item owned (NPCs 058-059; animals 060; boats/bus/flags/clocks/fans/beam 061; clouds/mist/rain/?weather= 062; dusk lights and ?time= proof 063). depends_on linear 057 -> 058 -> ... -> 063. est 60, maxTurns 90-100.

Findings (fix in defs/e5.mjs unless noted):
1. [BLOCKER] 058 npc-core e2e: isBlocked(0,0,1.7,0.25) asserted TRUE "inside the wall", but (0,0) is the gap (wall at z=0, gap at x=0). Use a wall point such as (5,0).
2. [BLOCKER] 062 continuity: test allows <= 0.05/s in any field; 20 s smoothstep peaks at 0.075/s, 3 s forced blend ~0.5/s, windSpeed (0..12) ~0.6/s. Frozen test fails. Fix 062: per-field limits and exclude forced blends.
3. [BLOCKER] 059 edits manifests hotel, post, town-hall, ferry-terminal; real ids are plaza, notice, milestones, transport. New folders would break 063's "exactly 14 manifests" test. Fix 059: use real ids.
4. [major] 059 e2e uses ?time=0.4 without &freeze=1 (fixed rule). Fix 059: add freeze, or drop time=.
5. [major] 059 low-tier count: expects 45 "hidden included" but the tier only hides, total is 89. Fix 059: count visible or rank-eligible NPCs; confirm gameClockSeconds() (ARCH has time()).
6. [major] 061 e2e expects hands equal game time after fastForward; spec requires real local time for hands. Fix the 061 e2e.
7. [major] 061 swing: takes {swingTarget, speed} from meta; ARCH 10.8 says root.userData.swingTarget (0..1) maps to min+(max-min)*t on node keep-boom. Fix 061.
8. [major] 061 step-1 test checks routes.js at import, but routes.js is created in step 2. Move check to step 2.
9. [major] 062 getWeatherState() lacks rain and cloudCover fields; 063 reads cloudCover, 065 reads weatherState().rain. Add both to 062.
10. [major, cross-epic] 063 finds street lamps by id prefix street-lamp-; 077 uses group 'street'; no producer (031/034/039/040) defines either. Align 063 and e8 077; name the producer.
11. [minor] 061 vehicle record {type,id,x,z,heading} has no dwelling, but e2e reads dwelling; "two samples 1.2 s apart" under freeze needs fastForward; hands matches hand-hour exactly so tower hand-hour-<f> is missed; no check:budget; no human_check. Fix 061.
12. [minor] 060 fish fallback "at least 3 schools" contradicts e2e 70 fish. Fix 060.
13. [minor] 063 asks 062 to import effectiveNight, but 062 already ran; inline copy stays. Gloom term not added to 061 beam (deferred to 062). Fix 063 text.

Not verified: producer hook names (time(), LightManager special light, useNearest), teleport ids square/hotel-lobby/hotel/library, particleScale values (out of scope).
