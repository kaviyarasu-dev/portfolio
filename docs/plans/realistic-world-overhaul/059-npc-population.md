# Plan 059: Populate the town and the buildings with ambient people

Epic E5. Estimated turns: 60.

## Goal

Place the people: pedestrians on the streets, shoppers, a tea vendor and fruit seller at work, fishermen mending nets, children in the school yard, people waiting at the bus stop and on benches in the square, and indoors the receptionist, waiters, cooks, office workers, clerks, students, readers. Each building manifest gets `npcLoops`. Counts follow the tier. At night fewer people are outside.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.5, 10.6 (npcLoops) and 10.8 (hooks), requirement R10 (in _planning/requirements.md), decisions D8 and D23, assumption A27; depends on plan 058 (Npc constructor, NpcManager, isBlocked, loop validation, seat records))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/npc/npc.js
- src/world/npc/manager.js
- src/world/layout/town.json
- src/world/layout/walk.js
- src/world/layout/square.js
- src/world/buildings/plaza/manifest.json
- src/world/buildings/broadcast/manifest.json
- src/world/areas/index.js
- src/world/props/sets/street.js
- src/main.js
- src/systems/gameloop.js
- src/state.js
- src/dev/worldHook.js
- src/world/kit/building.js
- src/world/kit/headlessContext.js
- src/world/kit/schema.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Population data and generator

Deliver:
- `tests/unit/npc/population.test.js` first. `src/world/npc/population.js` exports `buildPopulation({ town, manifests, seed, tier, nightFactor })`: `town` is the parsed `src/world/layout/town.json` object (not the result of `loadTown()`), `manifests` is an object keyed by building id holding each parsed `src/world/buildings/<id>/manifest.json`, `tier` is `high|medium|low`, `nightFactor` a number 0 to 1. It returns NPC definitions `{ id, area, kind, role, clip, seed, tierRank, night, look: { skin, shirt, trousers, shoes, hair, heightScale }, route | loop | seat | spot }` (the full field list is in the EXACT COUNTS paragraph). Area registration uses `areaNpcs(areaId)` exported by `src/world/npc/population.js`, which returns the definitions owned by that area id. EXACT COUNTS, high tier (total 89, inside 60 to 90). Outdoor (37): 12 pedestrians walking road-to-road loops of 80 to 300 m between landmarks and plots (using the walk graph of plan 058, never inside the square platform rectangle from `loadSquare()` of plan 031 with a 2 m margin), 4 shoppers lingering at shop rows, 3 vendors (2 `worker` at the tea stalls and 1 `worker` at the fruit cart, all with the `work` clip), 5 fishermen (3 `worker` with the `work` clip at nets and racks, 2 `sitter` at the jetty edge), 4 children running short loops in the academy yard, 4 people waiting (3 `sitter` on the bus stop benches and 1 `sitter` on a ferry terminal bench), 4 `sitter` on square benches, 1 watchman `worker` at the gatehouse. Medium tier is round(0.8 * high) = 71 NPCs and low tier is round(0.5 * high) = 45 NPCs (50.6 percent of high, inside 40 to 60 percent); each NPC has an integer `tierRank` from 0 to 88 drawn from the seed, medium shows ranks below 71 and low shows ranks below 45, so the tier filter is a rank threshold, not a rebuild. Indoor (52): listed below. Each NPC definition has `id` = `<area>:<role>:<n>` (for example `plaza:receptionist:0`, so the e2e finds the receptionist by id), `area` (the owning area id from the area files), `kind` (`walker|sitter|worker|loop`), `clip` (`walk|sit|work|hammer|stand-talk`), `seed`, `tierRank`, `night` (true when the NPC is shown at night), `look` (`{ skin, shirt, trousers, shoes, hair, heightScale }`, shoes included as 058 needs it), and exactly one of `route` (`{ type: "path", points, loop, dwellMs }`), `loop` (`{ type: "loop", waypoints }`), `seat` (a record `{ x, y, z, yaw }` in world coordinates, NOT a player interactable: NPC seats are never registered as player sit interactables), or `spot` (`{ x, y, z, yaw }`). Indoor (52), by building: plaza 8 (`plaza:receptionist:0` `worker` at the desk; 2 waiters `walker` on `loop` routes in the restaurant; 2 cooks `worker` with `work` at the stoves; 3 guests `sitter` in the lobby); notice (post office) 2 (1 clerk `worker` at the counter, 1 customer `sitter` waiting); broadcast building newsroom 4 (4 `worker` at the desks with `work`); meeting room 4 (`sitter`, the room id is named in the broadcast manifest); studio 4 (presenter 1 `worker` at the news desk, `work` while the ON AIR light of plan 041 is on and `sitter` otherwise; 3 designers `worker`); lab 4 (`sitter`; no lab id is among the 14 landmark ids, so its building id must be fixed before this step runs); academy classroom 8 (7 `sitter` students and 1 teacher `worker` at the blackboard); library 6 (5 `sitter` readers and 1 librarian `worker`); cafe 6 (5 `sitter` and 1 barista `worker`; the cafe is a town plot archetype of plan 037, not a manifest, so its NPCs are defined in population.js by the plot id from town.json); workshop 3 (`worker` with `hammer`); lighthouse keeper 1 (`worker` in the cottage living room of the lighthouse manifest); milestones (town hall) clerk 1 (`worker`); transport (ferry terminal) counter clerk 1 (`worker`). Manifests that gain `npcLoops` (the field is `[{ room, waypoints }]`, plan 058 contract): plaza, notice, broadcast, academy, library, workshop, lighthouse, milestones and transport (the real manifest ids of the 14 landmarks, plans 024 and 032; the ids hotel, post, town-hall and ferry-terminal do not exist). The `npcSeats` field is NOT used: seats are read from the placed seat props of each room (`seats` of the placed prop record, plan 019 and 021 contracts), so no new manifest key is needed. Indoor NPCs never use stairs or lifts (A27).
- Edit the nine manifests named in the indoor list (`src/world/buildings/<id>/manifest.json`) to add `npcLoops` only; the field `npcSeats` is NOT used, because it is defined nowhere, and seats come from the placed seat props of each room. The manifest schema (`src/world/kit/schema.js`) is extended in this plan only if it rejects `npcLoops` (allowed by src/**), and its test lives in the NEW file `tests/unit/kit/npcLoops.test.js`, which also checks that every manifest with `npcLoops` passes the schema.
- Rules and tests (`tests/unit/npc/population.test.js` and `tests/unit/kit/npcLoops.test.js`, real assertions). Outdoor: every route point is a node of the walk graph of plan 058 (`src/systems/nav/walkGraph.js`), and `findPath` from the graph node nearest the point to the nearest road node (the road centrelines of town.json, within 30 m) is not null. Indoor: every `npcLoops` waypoint is inside its room rectangle (the room bounds in the building manifest, transformed by the building anchor), at the floor y of its floor, at least 0.5 m from every wall box of the headless building context (`createHeadlessContext()` of plan 037), and not on a stair or lift footprint (the footprints of the floor plan of that context). Loop legs do not cross solid props: the raycast of the headless building context is run on each leg at 0.25 m height. Seats: each `seat` record in the population exists in the placed seat props of its room (by id, read from the headless context), and NPC seat records are not registered as player interactables. Counts: total 89 at high (sum of the EXACT COUNTS above), 71 at medium and 45 at low (rank thresholds); a role table in population.test.js gives the count per area and per role and must equal the EXACT COUNTS list, so a missing role fails the test. At night (`nightFactor` 1, the function `nightFactor(dayFraction)` of plan 012) at most 6 of the 16 outdoor pedestrians and shoppers have `night: true`; the night flag switches on at nightFactor above 0.55 and off below 0.45 (hysteresis, so the filter does not flicker). Determinism for the same seed; unique ids (a Set of the ids has the same size as the list); looks vary: at least 8 distinct shirt colours in the DATA (the rendered look is limited to the 6 seed classes of plan 058, which is accepted).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/npc/population.test.js tests/unit/kit/npcLoops.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/npc/population.js`

### Step 2: Spawn through the streamed areas and Playwright

Deliver:
- Each streamed area registers its NPCs when it loads and removes them on unload. The area loader calls `npcManager.add(npc)` for each definition returned by `areaNpcs(areaId)` (exported by `src/world/npc/population.js`, returns the definitions whose `area` field equals the area id), and `npcManager.remove(id)` on unload. `remove(id)` is a NEW method of the plan 058 NpcManager added in this plan: plan 058 freezes its manager test, so the test for `remove` is a NEW file, `tests/unit/npc/manager.remove.test.js`. The areas that register NPCs are the town block areas, the harbour area, the plaza area (the Grand Hotel) and the landmark areas, all read from `src/world/areas/index.js`; an outdoor loop belongs to the area that holds its first route point. The global NpcManager is created in the scene boot in `src/main.js` (attached as `game.npcs` in `src/state.js`, as plan 058 does for the fixture) and updated once per frame from `src/systems/gameloop.js`. Tier and night: `setTier(tier)` on the manager and the per-NPC `night` flag from `nightFactor` with the hysteresis of step 1; both only hide or show NPCs (the visible flag and the rank threshold), never rebuild meshes.
- `tests/e2e/npc-population.spec.js` (every URL pins the tier; `time=` always comes with `&freeze=1`, so NPCs move only when the spec calls `fastForward(45)` (the plan 061 hook, extended there to step the NpcManager in 50 ms steps), and the wall check runs while that fake game time passes). Walking is road-graph only (plan 040), so the square is reached with `teleport(cx, cz)` at the square centre `areas.square` (`cx`, `cz`) of town.json, and the hotel lobby with the zone id `teleport('plaza')`, not `walkTo`. With `?quality=high&time=0.4&freeze=1`: on the square `listNpcs()` has at least 8 visible NPCs within 60 m of the player; `teleport('plaza')`: at least 3 visible NPCs with `area` `plaza`, and the NPC `plaza:receptionist:0` has state `working` (poll with `expect.poll`). Sampling: `fastForward(45)`, then `expect.poll` (no fixed wait) until `time()` (plan 003 hook; the wall clock is not used) has advanced 45 s, sample the visible NPC positions at every game second change: none is inside a wall (`isBlocked(x, z, y, 0.25)` false) EXCEPT sitters and workers at their seats, which are exempt because their chair collider is intended (the exemption list is `kind` sitter or worker with state sitting or working); walkers and loop NPCs indoors never change height by more than 0.2 m (indoors = the NPC area is a building room, the rule applies to walkers and loops only). With `?quality=low` the count of NPCs with `tierRank` below 45 is 45 (`listNpcs()` entries carry `tierRank`, one field added to the 058 hook in this plan; hidden entries count, so the low tier is measured by rank, not by the visible cap of 40). Read after `loadAllAreas()` (a NEW hook in worldHook.js that streams every area and resolves when done, awaited with `expect.poll`), the same spec with `?quality=high` counts 89 entries, and 45 is between 40 and 60 percent of 89. `npm run check:budget` passes with NPCs present (the spots are measured with the NPC meshes in the scene): if a spot is over its limit, the fix is a lower visible cap (`npcScale` in src/config.js), never a higher limit; on the phone-class low tier the visible cap is 40. Zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npm run lint`
- `npx vitest run tests/unit/npc/manager.remove.test.js`
- `npx playwright test tests/e2e/npc-population.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/npc/population.test.js tests/unit/kit/npcLoops.test.js tests/unit/npc/manager.remove.test.js`
- `npx playwright test tests/e2e/npc-population.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --all`

Human check (goes in the report, never blocks): Walk the town: do the people feel natural, or do they look robotic or in the way?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
