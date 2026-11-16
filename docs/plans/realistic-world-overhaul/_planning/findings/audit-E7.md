# Plan-auditor verdict: E7 (plans 067-074) - NEEDS FIXES (4 blockers, rest major/minor). Fix in defs/e7.mjs.

Coverage complete (R12, journey 8 owned). Order linear, 074 in pause_after. Fixed rules hold.

Findings:
1. [BLOCKER] 069 step 3 switches Playwright webServer to build + vite preview: playwright.config.js is frozen by 001 and not in 069 allowed_paths; specs waiting on __world.ready break in production (hook stripped; 074 repeats the assumption). Keep the dev server (transformIndexHtml runs in dev too).
2. [BLOCKER] 069 make-og-image.mjs waits for window.__world.ready on a production preview where the hook does not exist. Use dev server, or wait for world:ready event or non-blank canvas.
3. [BLOCKER] 069 staticResume.test.js fails when dist/ is missing; unit tests run before build in 069 acceptance, gates:full and ci; reset deletes dist/. Move dist assertions into a separate test run after the build.
4. [BLOCKER] Map button contract inconsistent: 068 builds #map-open (aria-label "Open map"); 070 ring targets #map-btn; 071 reuses #map-btn with aria-label "Map" but frozen map.spec (f) clicks "Open map"; 071 puts #camera-btn in the same spot as 068's map button (no-overlap test fails). Fix: one id, one label; move camera button.
5. [major] 071 uses teleport("hotel") and fastTravelPoint("harbour"): not zone ids. Use plaza and lighthouse (or real ids).
6. [major] 073 git show HEAD:js/content/... cannot work (002 deletes js/; runner snapshots world-v2). Use git show main:js/content/<file>.
7. [major] 067/068/070 route Escape through a dispatcher "owned by 011", which has none (Escape lives in settings.js). 067 creates the dispatcher in input.js; 068 and 070 register with it.
8. [major] 072: showRetry({name,onRetry}) vs 015's showRetry(areaId, onRetry); assumes main.js owns world imports (069 moved them to src/boot/world.js); test (c) aborts renderer.js which is a static import so no banner; 071 imports map.js statically (defeats lazy load).
9. [major] 071 step 2 check is greps + lint only (passes with stubs). Add a behavioural test or move the step 3 e2e into step 2.
10. [major, A24] 074 content-allowlist.json is not frozen and no test enforces "sentence starter only". Freeze 073's allowlist as a fixture; add a test that each new entry has reason "sentence starter".
11. [minor] 068 e2e (i) focuses list on open then presses Tab (leaves list); 068 says M ignored while tour open, but 070 says tour does not block M.
12. [minor] 069 marker placed "before #game-canvas", which 067 removes from index.html.
13. [minor] 072 assert has dist/assets "ambience" may match a string inside the main bundle; context-loss "skip if missing" passes trivially.
14. [minor] Shared key list in 067/068/070/071 omits N (mute, plan 064).

Could not verify: "3" in 069 banner vs resume text (check:content); contact.js title vs 069 hard-coded title; 065 static ambience import.
