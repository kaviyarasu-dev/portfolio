# Plan 059: Populate the town and the buildings with ambient people

Epic E5. Estimated turns: 55.

## Goal

Place the people: pedestrians on the streets, shoppers, a tea vendor and fruit seller at work, fishermen mending nets, children in the school yard, people waiting at the bus stop and on benches in the square, and indoors the receptionist, waiters, cooks, office workers, clerks, students, readers. Each building manifest gets `npcLoops`. Counts follow the tier. At night fewer people are outside.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.6 (npcLoops) and requirement R10, decision D8, D23, assumption A27)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/npc/npc.js
- src/world/npc/manager.js
- src/world/layout/town.json
- src/world/layout/walk.js
- src/world/layout/square.js
- src/world/buildings
- src/world/areas/index.js
- src/world/props/sets/street.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Population data and generator

Deliver:
- `tests/unit/npc/population.test.js` first. `src/world/npc/population.js` exports `buildPopulation({ town, manifests, seed, tier, nightFactor })` returning NPC definitions `{ id, kind, seed, look: { skin, shirt, trousers, hair, heightScale }, route | loop | seat | spot }`. Outdoor (high tier targets): 14 pedestrians walking road-to-road loops of 80 to 300 m between landmarks and plots (using the road graph; never inside the square platform), 4 shoppers lingering at shop rows, 2 vendors (`worker` at the tea stalls and 1 at a fruit cart), 5 fishermen (`worker` with `work` at nets and racks, 2 sitting at the jetty edge), 4 children running short loops in the academy yard, 4 people waiting at the bus stop and the ferry terminal (`sitter` on shelter benches), 4 sitters on square benches, 1 watchman at the gatehouse. Indoor: from each manifest `npcLoops` and seats: hotel receptionist (`worker` at the desk), 2 waiters on loops in the restaurant, 2 cooks (`worker` at stoves), 3 guests sitting in the lobby, post clerk at the counter and a customer waiting, office workers at the newsroom desks (4 `worker`), meeting-room 4 sitters, studio presenter at the news desk (`worker` while ON AIR), lab students (4 `sitter`), classroom 8 students sitting and a teacher at the blackboard (`worker`), library readers 5 (`sitter`) and the librarian, cafe 6 (`sitter` and a barista `worker`), workshop 3 workers (`hammer`), studio 3 designers, lighthouse keeper in the cottage living room, town hall clerk, ferry terminal counter clerk. Indoor NPCs never use stairs or lifts (A27).
- Edit the manifests (`src/world/buildings/*/manifest.json`) to add `npcLoops` and extra `npcSeats` references; manifest schema already allows `npcLoops` (extend `schema.js` only if it rejects them; add the test in a NEW file `tests/unit/kit/npcLoops.test.js`).
- Rules and tests: every outdoor route point is on a walkable cell reachable from the nearest road (walk graph); every indoor loop waypoint is inside its room bounds, on the right floor y, at least 0.5 m from walls and not on a stair or lift footprint; loop legs do not cross solid props (raycast in the headless building); every seat id used exists as a seat interactable; totals: high tier at least 60 and at most 90 NPCs, low tier between 40 and 60 percent of high; at night (`nightFactor` 1) outdoor pedestrians and shoppers are at most 40 percent; determinism; unique ids; looks vary (at least 8 distinct shirt colours).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/npc/population.test.js tests/unit/kit/npcLoops.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/npc/population.js`

### Step 2: Spawn through the streamed areas and Playwright

Deliver:
- Each streamed area (town blocks, harbour, hotel and the landmark areas) registers its NPCs with the `NpcManager` when it loads and removes them on unload (`areaNpcs(areaId)`); the global `NpcManager` is created in `main.js` and updated from the game loop; the tier and night factor re-run `buildPopulation` filters (hide or show NPCs, no rebuild of meshes).
- `tests/e2e/npc-population.spec.js`: boot with `?quality=high&time=0.4`: after `walkTo` the square `listNpcs()` has at least 8 visible NPCs within 60 m; teleport into the hotel lobby: at least 3 NPCs visible there and the receptionist is `working`; sample all visible NPC positions every 1.5 s for 45 s: none is inside a wall (`isBlocked` false for radius 0.25) and none changes height by more than 0.2 m while indoors (A27); with `?quality=low` the total listed NPCs are between 40 and 60 percent of the high count; `check:budget` spots pass with NPCs present (they add draw calls: if over, raise instancing efficiency, never the limit); zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/npc-population.spec.js`
- `npm run check:budget`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/npc/population.test.js tests/unit/kit/npcLoops.test.js`
- `npx playwright test tests/e2e/npc-population.spec.js`
- `node scripts/check-buildings.mjs --all`

Human check (goes in the report, never blocks): Walk the town: do the people feel natural, or do they look robotic or in the way?

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
