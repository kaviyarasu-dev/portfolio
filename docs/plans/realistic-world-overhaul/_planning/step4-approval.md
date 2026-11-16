# Step 4: plan approval table (realistic-world-overhaul)

Generated from manifest.json and NNN-*.md headings. Cold-reader verdict = split-review.md (all 79 said NEEDS FIXES at cold read; round-1 and round-2 fixes applied per the log, no further audit rounds). Verify = number of verify commands in the manifest.

| id | epic | name | repo | depends on | est_turns | verify | cold-reader verdict | milestone |
|---|---|---|---|---|---|---|---|---|
| 001 | E1 | Tooling skeleton: package, Vite, Vitest, ESLint, Playwright, gates runner, CI workflow | portfolio | - | 45 | 5 | NEEDS FIXES, fixed per log | E1 Foundation |
| 002 | E1 | Port the v1 game to ES modules on Vite and the current Three.js | portfolio | 001 | 55 | 4 | NEEDS FIXES, fixed per log | E1 Foundation |
| 003 | E1 | URL params, seeded RNG, the dev-only window.__world hook and v1 behaviour tests | portfolio | 002 | 45 | 6 | NEEDS FIXES, fixed per log | E1 Foundation |
| 004 | E1 | Remove the phone number and add the email click-to-reveal | portfolio | 003 | 35 | 5 | NEEDS FIXES, fixed per log | E1 Foundation |
| 005 | E1 | Asset fetch tooling: host allowlist, untrusted cache, Poly Haven client, ledger writer | portfolio | 004 | 55 | 3 | NEEDS FIXES, fixed per log | E1 Foundation |
| 006 | E1 | Asset optimize tooling: GLB optimizer, texture packer, material and model pack CLIs | portfolio | 005 | 50 | 3 | NEEDS FIXES, fixed per log | E1 Foundation |
| 007 | E1 | Replace the non-CC0 sound effects with generated CC0 ones and ledger the legacy music | portfolio | 006 | 45 | 4 | NEEDS FIXES, fixed per log | E1 Foundation |
| 008 | E1 | Replace Soldier with a code-built casual human avatar (idle, walk, run, sit) and a drop-in GLB path | portfolio | 007 | 55 | 5 | NEEDS FIXES, fixed per log | E1 Foundation |
| 009 | E1 | Self-host Inter, Orbitron and Noto Sans Tamil (OFL) and drop Google Fonts | portfolio | 008 | 40 | 5 | NEEDS FIXES, fixed per log | E1 Foundation |
| 010 | E1 | Strict ledger check, size check and the generated credits page | portfolio | 009 | 45 | 3 | NEEDS FIXES, fixed per log | E1 Foundation |
| 011 | E1 | Quality tiers low/medium/high, auto detection and the settings menu | portfolio | 010 | 45 | 5 | NEEDS FIXES, fixed per log | E1 Foundation |
| 012 | E1 | Dev fixtures framework and the light manager (pooled interior lights, switches, dusk) | portfolio | 011 | 50 | 6 | NEEDS FIXES, fixed per log | E1 Foundation |
| 013 | E1 | Shared PBR material library from CC0 Poly Haven textures | portfolio | 012 | 60 | 8 | NEEDS FIXES, fixed per log | E1 Foundation |
| 014 | E1 | Budgets file, budget checker and the screenshot tool | portfolio | 013 | 55 | 8 | NEEDS FIXES, fixed per log | E1 Foundation |
| 015 | E1 | Streaming core: areas that load by priority and distance, retry on failure | portfolio | 014 | 55 | 7 | NEEDS FIXES, fixed per log | E1 Foundation (PAUSE after this plan) |
| 016 | E2 | Wall, floor and stair collision, camera collision and the first-person toggle | portfolio | 015 | 60 | 6 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 017 | E2 | Interaction registry, event bus, read objects and hinged doors | portfolio | 016 | 60 | 5 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 018 | E2 | Light switches, sitting, the elevator and stairs in the interactions fixture | portfolio | 017 | 60 | 7 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 019 | E2 | Prop catalog core and set A: seating, tables, beds (40 types) | portfolio | 018 | 60 | 3 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 020 | E2 | Building kit shell: manifest schema, walls with openings, floors and stairs, roofs and colliders | portfolio | 019 | 60 | 5 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 021 | E2 | Building kit part 2: walk graph, object placement, doors, lights, lifts and the BuildingInstance | portfolio | 012, 016, 017, 018, 019, 020 | 60 | 5 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 022 | E2 | Prop set B: storage, books, lighting fixtures, textiles, plants, decor, fans, signs (51 types) | portfolio | 021 | 55 | 3 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 023 | E2 | Prop set C: kitchen, dining, bathroom and hotel room items (48 types) | portfolio | 022 | 60 | 3 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 024 | E2 | check:buildings and the Grand Hotel structure manifest | portfolio | 023 | 60 | 6 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 025 | E2 | Shared exterior detail kit, signage and the Grand Hotel facade | portfolio | 024 | 60 | 6 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 026 | E2 | Grand Hotel ground floor: lobby, restaurant, kitchen, stair hall | portfolio | 025 | 60 | 8 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 027 | E2 | Grand Hotel upper floors: corridor, four guest rooms with bathrooms, rooftop, and journey 5 | portfolio | 026 | 60 | 8 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 028 | E2 | Textured terrain: heightfield module and a four-layer splat material | portfolio | 027 | 60 | 5 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 029 | E2 | Town square in front of the hotel: paving, banyan platform, clock tower, street furniture | portfolio | 028 | 60 | 7 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 030 | E2 | Replace selected code-built props with CC0 Poly Haven models where a good one exists | portfolio | 029 | 60 | 6 | NEEDS FIXES, fixed per log | E2 Vertical slice |
| 031 | E2 | Vertical slice integration: streamed hotel and square, spawn in the lobby, journey 1, review pack | portfolio | 030 | 60 | 8 | NEEDS FIXES, fixed per log | E2 Vertical slice (PAUSE after this plan) |
| 032 | E3 | Town plan data: roads, areas, landmark anchors, plots, and the layout tests | portfolio | 031 | 60 | 3 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 033 | E3 | Terrain built from the town plan; world enlarged to 300 m; v1 landmarks moved to their anchors | portfolio | 032 | 60 | 6 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 034 | E3 | Road meshes with kerbs, junctions, surface lookup and clear-road checks | portfolio | 033 | 60 | 4 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 035 | E3 | Sea and harbour water with depth colour, shoreline foam, waves and bobbing helpers | portfolio | 034 | 60 | 4 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 036 | E3 | Coconut palms, trees, shrubs, grass and crops: instanced, wind-swayed, placed by area | portfolio | 035 | 60 | 5 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 037 | E3 | Houses, shop rows, cafe and market from archetype manifests, baked per block | portfolio | 036 | 60 | 4 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 038 | E3 | Fishing harbour: jetty, quay, boats, nets, fish racks, fish market, beach details | portfolio | 037 | 60 | 4 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 039 | E3 | Gopuram gate and small temple, street life, Tamil and English signage, local-detail manifest check | portfolio | 038 | 60 | 5 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour |
| 040 | E3 | World integration: areas, minimap, fog, tour of every area, budgets, review pack | portfolio | 039 | 60 | 8 | NEEDS FIXES, fixed per log | E3 Town plan/terrain/harbour (PAUSE after this plan) |
| 041 | E4 | Prop set D: office, technology and broadcast studio (44 types) | portfolio | 040 | 60 | 3 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 042 | E4 | Prop set E: library, museum, school, post office, security and transport (49 types) | portfolio | 041 | 60 | 3 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 043 | E4 | Post Office (zone notice): resume at the counter, journey 2 | portfolio | 042 | 60 | 8 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 044 | E4 | Engineering Workshop (zone forge): tools, electronics and the skills board | portfolio | 043 | 60 | 8 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 045 | E4 | GravityWrite HQ tower (zone citadel), part 1: structure, glass facade, lobby, lift and stairs | portfolio | 044 | 60 | 7 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 046 | E4 | GravityWrite HQ (zone citadel), part 2: newsroom, meeting room, executive office, server room, rooftop | portfolio | 045 | 60 | 6 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 047 | E4 | Radio and TV station (zone broadcast): studio, control room and the mast | portfolio | 046 | 60 | 6 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 048 | E4 | Security gatehouse and control office (zone gateway) | portfolio | 047 | 60 | 6 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 049 | E4 | Harbour ferry terminal and bus stop (zone transport) | portfolio | 048 | 60 | 6 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 050 | E4 | Community hall and open-source cafe (zone temple) | portfolio | 049 | 60 | 6 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 051 | E4 | Startup garage studio (zone workshop): 1CLX | portfolio | 050, 044 | 60 | 9 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 052 | E4 | Design and note-taking studio (zone freshnote) | portfolio | 051 | 60 | 9 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 053 | E4 | Grand public library with archive stacks (zone library) | portfolio | 052 | 60 | 10 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 054 | E4 | School and college (zone academy): classroom, labs, staff room | portfolio | 053 | 60 | 10 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 055 | E4 | Lighthouse and keeper cottage (zone lighthouse): climb to the top, contact board, journey 4 | portfolio | 054 | 60 | 10 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 056 | E4 | Town hall and hall of achievements (zone milestones) | portfolio | 055 | 60 | 10 | NEEDS FIXES, fixed per log | E4 Landmarks |
| 057 | E4 | All 14 landmarks: v1 building code removed, consistency checks, dialogues and journeys 2 to 4 | portfolio | 051, 052, 053, 054, 055, 056 | 60 | 10 | NEEDS FIXES, fixed per log | E4 Landmarks (PAUSE after this plan) |
| 058 | E5 | NPC core: cheap skinned people, routines, path following and player avoidance | portfolio | 057 | 60 | 5 | NEEDS FIXES, fixed per log | E5 Life |
| 059 | E5 | Populate the town and the buildings with ambient people | portfolio | 058 | 60 | 5 | NEEDS FIXES, fixed per log | E5 Life |
| 060 | E5 | Seagulls, crows, forest birds, fish, crabs and butterflies | portfolio | 059 | 60 | 4 | NEEDS FIXES, fixed per log | E5 Life |
| 061 | E5 | Boats on routes, the bus, flags, real-time clocks, ceiling fans, lighthouse beam, blinking lights | portfolio | 060 | 60 | 4 | NEEDS FIXES, fixed per log | E5 Life |
| 062 | E5 | Weather: clouds, mist, rain and wet ground, seeded and forceable with ?weather= | portfolio | 061 | 60 | 4 | NEEDS FIXES, fixed per log | E5 Life |
| 063 | E5 | Living light: windows, signs, facades, street lights and the sky at dusk, with machine proof | portfolio | 062 | 60 | 5 | NEEDS FIXES, fixed per log | E5 Life (PAUSE after this plan) |
| 064 | E6 | Audio core: sound bank, event sounds and footsteps by surface | portfolio | 063 | 75 | 6 | NEEDS FIXES, fixed per log | E6 Audio |
| 065 | E6 | Positional ambience through walls and interior acoustics (muffling and room echo) | portfolio | 064 | 70 | 5 | NEEDS FIXES, fixed per log | E6 Audio |
| 066 | E6 | Music per area: generated CC0 loops, crossfades, volume sliders | portfolio | 065 | 70 | 7 | NEEDS FIXES, fixed per log | E6 Audio (PAUSE after this plan) |
| 067 | E7 | Text mode: skip to the full resume as a normal page | portfolio | 066 | 60 | 9 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 068 | E7 | Fast-travel map with keyboard and touch access | portfolio | 067 | 60 | 12 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 069 | E7 | No-WebGL fallback, static resume HTML for crawlers, SEO and share tags, journey 8 | portfolio | 068 | 60 | 11 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 070 | E7 | Skippable first-visit tour shown once per browser | portfolio | 069 | 45 | 5 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 071 | E7 | Touch controls: joystick, action, camera, map, run, tested at a phone viewport | portfolio | 070 | 55 | 6 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 072 | E7 | Robustness: context loss, failed chunk or area load, failed assets, global errors | portfolio | 071 | 60 | 9 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 073 | E7 | Content fact check: resume text fixture and the A24 token rule | portfolio | 072 | 50 | 3 | NEEDS FIXES, fixed per log | E7 Elite extras |
| 074 | E7 | Rewrite and enrich the content from existing facts only | portfolio | 073 | 50 | 6 | NEEDS FIXES, fixed per log | E7 Elite extras (PAUSE after this plan) |
| 075 | E8 | Phone tier: half the decor, interiors on entry, texture and GPU memory caps, first download under 25 MB | portfolio | 074 | 60 | 7 | NEEDS FIXES, fixed per log | E8 Polish/prod |
| 076 | E8 | Desktop performance pass: perf report tool, budgets at every spot, slimmer assets | portfolio | 075 | 60 | 10 | NEEDS FIXES, fixed per log | E8 Polish/prod |
| 077 | E8 | All eight journeys in one command, journey 3 by the map, journey 6 at night, streaming order with real areas | portfolio | 076 | 50 | 4 | NEEDS FIXES, fixed per log | E8 Polish/prod |
| 078 | E8 | README, CREDITS, the credits page and the runbook | portfolio | 077 | 40 | 7 | NEEDS FIXES, fixed per log | E8 Polish/prod |
| 079 | E8 | CI workflow hardening, logging rule, dependency audit and the strict final gates | portfolio | 078 | 60 | 5 | NEEDS FIXES, fixed per log | E8 Polish/prod (PAUSE after this plan) |

## Human checks (from manifest, 57 plans)

- 001: Run the Pages workflow check once on GitHub after the first merge to main; switch Settings > Pages > Source to GitHub Actions (only after you approve the final result).
- 002: Open `npm run dev` and compare with https://kaviyarasu-dev.github.io/portfolio/ : same island, same look, you can walk and open dialogues.
- 004: The downloadable resume PDF still contains your phone number (your choice, D31). Replace the PDF yourself if that changes.
- 007: Listen to the generated effects (footsteps, chime, ocean) once; they are simple on purpose and plan 064 improves the footsteps.
- 008: Judge the avatar look. To use a nicer CC0 person: download Quaternius "Universal Base Characters" (CC0) from itch.io yourself, save the GLB as `..\portfolio-asset-cache\manual\avatar\avatar.glb` with a `meta.json` ({"sourceUrl": "...", "author": "Quaternius", "licence": "CC0"}), then run `node scripts/assets/buildAvatar.mjs` and the tests.
- 013: Look at the materials fixture (`npm run dev`, open `?fixture=materials`) or `docs/shots/013/materials-medium.png`: do the surfaces look like believable plaster, tile, wood, stone?
- 014: Open `docs/shots/014/spawn-high.png` once to see what the tool produces: the plaza should be ahead of the camera, the avatar must not be in the frame.
- 022: Open the shots of this set: judge that wardrobes, shelves, lamps, plants and fans look like real objects (not boxes), that the oil lamp and urn carry no religious imagery, and that the wall clock, fan and signs sit at believable heights. Visual realism cannot be machine-checked.
- 023: Open the shots of this set: judge that the stoves, wet grinder, clay chulha, thali and banana-leaf setting look recognisably South Indian and that bathroom and hotel items have believable proportions. Visual realism and cultural accuracy cannot be machine-checked.
- 024: Walk the empty hotel shell once in `?fixture=building-plaza` to judge the proportions and room layout before furniture goes in (the guest rooms are large suites, the corridor is a 28 x 6 m hall, the lift cabin passes visually through the slabs: decide whether that is acceptable).
- 025: Have a Tamil reader check every string in `src/content/signage.js` (starter vocabulary, zone names and room plates) and the hotel and shop names (A2, A15). Then look at the facade shots: portico, balconies, shutters and the lit signboard at dusk.
- 026: Walk the lobby, restaurant, kitchen and stair hall and judge whether they feel like a real South Indian hotel (proportions, clutter, lighting at dusk). Have a Tamil reader check the three new sign strings (reception, menu, stairs and lift). Check the lift ride and the seats by hand once.
- 027: Walk the corridor, the four guest rooms, a bathroom and the rooftop in `?fixture=building-plaza` and judge realism and layout (the guest rooms are large suites; pillows sit centred on the mattress; the lift cabin passes visually through the slabs, accepted in plan 024). Have a Tamil reader check the `first-floor` sign.
- 028: Look at docs/shots/028/spawn-high.png: grass, sand and dirt must be visible and not stretched.
- 029: Judge the square: does it feel like a real town centre? Tamil signposts (draft text in signage.js) need a reader.
- 030: Check the props fixture: do the Poly Haven models look right in place (scale, orientation)?
- 031: MILESTONE: the runner pauses after this plan. Open `docs/review/slice-review.md` and the screenshots, walk the hotel and square with `npm run dev`, and approve the look (or tell the planner what to change) before epic 3 starts (D17). Run `/plan-replan realistic-world-overhaul` for changes.
- 032: Open `src/world/layout/town.json` in a viewer or look at the minimap later; judge whether the town plan feels right.
- 034: Judge whether the main street, junctions and lanes look like a real South Indian coastal town road network (kerbs, gutters, materials), not flat ribbons.
- 035: Look at docs/shots/035: judge the depth gradient, foam line, calm harbour and the horizon blend with the sky.
- 036: Look at the palms, forest and beach: do they feel like coastal Tamil Nadu?
- 037: Shop and house names are placeholders (A15); judge whether the street feels real.
- 038: Catamaran and net detail must look right to someone who knows the coast (D25).
- 039: A person from Tamil Nadu should check the gopuram, temple, kolam, catamaran and every Tamil string (D25, A2).
- 040: Milestone of epic 3: walk the town, harbour, beach and forest and tell the planner what to change before epic 4. Check by eye that nothing pops in closer than about 150 m and that fog looks right at dusk.
- 041: Open the shots of this set: judge that the monitors, desks, server racks, vending machine, mixing console, studio camera and ON AIR sign look like real objects (not boxes), that the L-shaped desk and the boat-shaped conference table read correctly, and that wall and ceiling items (TV, panels, par rig, exit sign) sit at believable heights. Visual realism cannot be machine-checked.
- 042: Open the shots of this set: judge that the library stack, card catalog, globe, display case, school desk, blackboard, post box, counter grille, sorting rack, boom barrier, cctv bank and departure board look like real objects (not boxes), that wall items (plaques, charts, boards, banner) sit at believable heights, and that the boom barrier rests horizontal with its hinge at the housing. Visual realism cannot be machine-checked.
- 043: Walk the Post Office and compare with a real Indian post office; check the Tamil sign (the Tamil of every sign is a draft); check that the README zone table and the minimap label now say Post Office (the README is edited by this plan).
- 044: Walk the Engineering Workshop inside and out and judge whether it reads as a real small engineering works (lathes, drill presses, welding bay, lab, roller shutter, chimney, tin roof). Check the Tamil of the two signs (the Tamil of every sign is a draft: பொறியியல் பணிமனை, திறன்கள்). Check that the README zone table and the minimap label now say Engineering Workshop (the README is edited by this plan).
- 045: Judge the tower facade at dusk and from the street. The Tamil of the two new signs (`கிராவிட்டிரைட்`, `நல்வரவு`) is a draft: review it. Note for plan 046: the executive office is 10 by 18 m and the meeting room 12 by 18 m because every level must tile the footprint with at most six rooms.
- 046: Judge the newsroom, the meeting room and the rooftop. The Tamil of the four floor words is a draft: review it. The tower facade is judged in plan 045.
- 047: Judge the mast and the studio from the street and inside. The Tamil of the three keys (ஒளிபரப்பு நிலையம், ஒளிபரப்பு, ஒளிபரப்பில்) is a draft: review it.
- 048: Judge the gatehouse and the barrier. The Tamil of the two keys (பாதுகாப்பு, பார்வையாளர்கள்) is a draft: review it.
- 049: Judge the terminal against a real ferry jetty and the gangway slope. The Tamil of the two keys (படகுத்துறை, கால அட்டவணை) is a draft: review it.
- 050: The building must read as a community cafe and civic hall, not a temple. The Tamil of the two signs is a draft: review it.
- 051: Does it look like a real startup garage?
- 052: Does the studio feel like a real design studio? Also check the Tamil of the signs (ஃபிரெஷ்நோட் and திறந்திருக்கிறது are drafts).
- 053: Judge the library atmosphere. Also check the Tamil of the signs (பொது நூலகம், நூலகம், காப்பகம், அமைதி) which are drafts for the person.
- 054: Judge the school look. Also check the Tamil of the sign (கல்விக்கழகம் is a draft) for the person; the Tamil review is a human check, not a test.
- 055: Judge the lighthouse silhouette and the view from the top. Also check the Tamil of the signs (கலங்கரை விளக்கம் and தொடர்புக்கு are drafts) for the person; the Tamil review is a human check, not a test.
- 056: Judge the hall of achievements and the look of the Town Hall. Also check the Tamil of the signs (நகர மன்றம் is a draft) for the person; the Tamil review is a human check, not a test.
- 057: Milestone of epic 4: walk every landmark and approve before life, audio and extras are added.
- 058: The people are simple figures; judge whether they read as people from a normal distance.
- 059: Walk the town: do the people feel natural, or do they look robotic or in the way?
- 060: Look at the harbour, beach and forest: do the gulls, crabs and butterflies read as living things, without looking like a swarm or sliding over the ground?
- 061: Watch the harbour, the bus stop and the lighthouse at dusk: do the boats, the bus and the beam move believably, and do the wall clocks show the real time?
- 063: Walk the town at dusk (`?time=0.72&freeze=1`): is it beautiful or garish?
- 064: Walk over grass, sand, gravel, stone, wood, carpet and the lighthouse stairs with sound on and judge the footsteps; listen to the sand and gravel steps (not asserted by the test) and to the lift_move loop seam.
- 065: Walk through a door with headphones: the outside should dull and the room should have a little echo. Also judge the ten new loops for seams and level.
- 066: Listen to each generated track (all ten, with headphones, checking the loop seam and the level). They are simple and ambient; say if you want different moods, or drop in your own CC0 tracks later.
- 069: Paste the live URL into a link preview tool after deploy to check the share card.
- 071: Try it on a real phone (iOS Safari and Android Chrome): moving, looking, doors, the map and the text mode, in portrait and landscape.
- 074: MILESTONE of epic 7: read `docs/review/content-changes.md` and approve every sentence; the checker cannot judge meaning.
- 075: Run the site on a real phone: does it start quickly, move smoothly and not crash? (D29). If phone-final.json has notMet entries, decide on them.
- 076: Real desktop frame times at the heaviest spots (the tool measures draw calls and triangles only). Read docs/perf/desktop-final.md for not_met spots and the 70 MB status.
- 078: Read README.md, docs/RUNBOOK.md and docs/RELEASE-CHECKLIST.md once.
- 079: FINAL: read docs/review/final-report.md for the honest state of the gates and the audit, and the spec section 6 checks; switch Settings > Pages > Source to GitHub Actions once; approve and merge world-v2 into main yourself (D27).
