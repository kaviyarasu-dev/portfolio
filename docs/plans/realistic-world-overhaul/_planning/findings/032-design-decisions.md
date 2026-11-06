# Design decisions for the 032-037 fix (from the killed e3a fixer; NOT yet written into any defs)
town.json data keys (plan 032 must define them; 034/038/039 read them):
- top-level `harbour`: { quay: { points: [[x,z]...], width: 3 }, jetty: { x, z, rot, length: 55, width: 4 }, props: [] } (jetty x,z = landward start centre on the quay edge; rot = Three.js rotation.y, runs toward (sin rot, cos rot)); `areas.harbour` stays the water polygon.
- top-level `local`: { gate: { x, z, rot }, temple: { x, z, rot } } both optional; validateTown rejects unknown top-level keys except `harbour` and `local`.
- closed-ring convention: polygons and closed roads do NOT repeat the first point; looping roads carry `closed: true`.
- plot `rot` radians; `facing` = derived compass letter N|E|S|W consistent with rot.
- anchors carry optional `y` (plaza y 0, broadcast y 16 ...) so 033 can compute plateaus.
- boat records: { id, kind: catamaran|boat-fishing|boat-rowing, x, z, rot, place: beach|shallows|harbour|jetty }.
Other:
- 033 must unfreeze (state in plan) terrainBuild.test.js (028) and sliceAreas.test.js (031): they assert v1 heights / temporary zone relocations that 033 removes. slice.json data moves to square.json, loadSquare() composed from town.json, shape unchanged.
- v1 -0.5 y clamp is in js/systems/controller.js, plan 016 keeps it and says 033 replaces it with wading. Island bound already follows WORLD_RADIUS-0.35 (016), no 168 literal.
- Plan 029 creates BOTH src/world/layout/square.js (loadSquare) and src/world/town/square.js (buildSquare): 034/036 must name the first explicitly.
- Plan 029 also creates src/world/town/bakeStatic.js: duplicates 037's planned src/world/kit/bake.js -> 037 reuses it.
- ARCH 10.5 layout line: replace `generate.js nav.js` with `geometry.js town.js walk.js plots.js` (applied by lead). Plan 002 (e1a) remark 'plan 032 enlarges the world' should say 033.
- Each of 032-037 should get est <= 60 and maxTurns ~80-90.
