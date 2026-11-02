# Requirements - realistic-world-overhaul

Feature (user, Tanglish, paraphrased): Make this portfolio work the way an elite expert's portfolio would be set up.
The current island "village" is very basic / crude. User wants in-depth detailing, very realistic, so a real person
feels they are experiencing a real world. Every building, hotel room, outside area, and every place and thing must have
natural, realistic detailing. (User also typed /grill-me and /goal: wants a hard interview and a clear goal.)

## Code findings
Repo: portfolio/ (git root). Only branch: main (remote origin/main). No CLAUDE.md (project or ~/.claude/CLAUDE.md - global file is empty). No .claude/rules. No docs/specs folder. No package.json, no tests, no CI file.
- Stack: Three.js r147 UMD from jsdelivr CDN (index.html:586), Howler 2.2.4 CDN, GLTFLoader + EffectComposer/Bloom/FXAA examples loaded as globals. ES-module sources in js/ are concatenated by build.mjs (regex strips import/export, fixed ORDER list) into dist/bundle.js (index.html:596). dist/bundle.js is committed (148K). Adding a file means adding it to ORDER in build.mjs.
- Hosting: static, GitHub Pages (README link https://kaviyarasu-dev.github.io/portfolio/).
- World: config.js WORLD_RADIUS 180, TERRAIN_SIZE 420, 160x160 heightmap, WATER_LEVEL -1.2. Terrain (js/world/terrain.js) = one PlaneGeometry with vertex colors only, 2 value-noise octaves, flat discs around zones, soft path tint along straight lines plaza->zone. No terrain textures used.
- engine/assets.js generates grass/stone/sand/noise canvas textures but only waterNormalTex is used (water.js). Grass/stone/sand textures are unused.
- 14 zones in js/world/zones.js (ZONE_LAYOUT: plaza, notice, forge, citadel, broadcast, gateway, transport, temple, workshop, freshnote, library, academy, lighthouse, milestones), each with x,z,r and a dialogue.
- Buildings: js/world/buildings.js (958 lines, 14 factories) built only from primitives via util/three.js makeBox/Cylinder/Cone/Sphere/Torus; e.g. library = stone box + dome + 4 wing boxes; academy = box + roof box + tower box + 3 window quads. No interiors, no doors you can enter (only buildingAnims makeDoorHinge swings a door when near), no furniture. Collision = circle list (collision.js addCollider(x,z,r)), no walls/floors/stairs, player height = terrain sampleHeight only.
- Props: js/world/props.js - 140 trees (pine/broadleaf instanced), 60 rocks, 400 grass cross-quads, all instanced; ~600 total props, seeded RNG. No water-edge features, flowers, bushes, fences, lamps, benches, wildlife, boats, etc.
- Sky/clock: world/sky.js (276 lines) + systems/clock.js - day/night, sun dir, fog colors; PALETTE flat colors in config.js. Lighting: 1 directional sun w/ PCFSoft shadow 2048 (1024 mobile), hemisphere light, procedural gradient env map (assets.js buildEnvMap), ACES tone mapping, bloom+FXAA composer. No point/spot lights for interiors or night.
- Player: js/entity/player.js loads Soldier.glb (base64 XBOT_MODEL_DATA from assets/models/Xbot.js - 2.9MB), idle/walk/run via AnimationMixer; third-person camera rig (engine/camera.js). Ybot.glb is a 14-byte stub.
- Content/UI: resume content in js/content/*.js, dialogues built with el() DOM helper (no innerHTML), shown in an HTML overlay HUD (ui/hud.js) when player is within zone radius + E; minimap canvas (ui/minimap.js). Notice board downloads the resume PDF.
- Audio: Howler, 6 music loops + 7 sfx in assets/audio (~1MB music; castle.ogg 519KB). Per-zone music by radius, footsteps grass/sand.
- Perf: perfMode normal/low/ultralow (renderer.js setPerfMode), touch mode detection (state.js initDomRefs), pixel ratio cap 2 desktop / 1.5 touch.
- Assets on disk 15MB total (assets/), dist 148K. Terrain/props/buildings generate at load, no external model downloads except player.
- js/content/contact.js holds name, location Erode Tamil Nadu, public email, phone +91 63839 64471, linkedin, github; all already public on the live Pages site. Education: BIT 2014-2017 Gobi Arts & Science College; PHP certificate 2018-2019.
- Tooling on this machine: node v20.19.5, npm 10.8.2, Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe, internet reachable (polyhaven.com 200). playwright/puppeteer NOT installed. No test framework.

## Decisions
D1 (Size): XL confirmed - rebuild the whole world: all 14 landmarks, terrain, vegetation, lighting, water, sky, props, audio, life. Question budget 45.
D2 (Realism approach): HYBRID - plan sessions download free CC0 assets (Poly Haven textures/HDRI, Quaternius/Kenney etc. models) and combine with code-built building shells and furniture. Download size must stay in a budget (budget still to be set).
D3 (World concept): Realistic coastal island TOWN - believable houses, hotel, library, harbour, lighthouse w/ keeper quarters, roads, beach, forest. Each resume/project landmark becomes a believable real building.
D4 (Interiors): ALL 14 landmarks are walk-in, seamless (no loading screen). Resume content lives inside as real objects (books, screens, boards).
D5 (Tech stack): UPGRADE to current Three.js + Vite build (package.json, npm). Output stays a static site deployable to GitHub Pages. A migration plan runs first; everything else builds on it. Replaces build.mjs/CDN globals/dist concat.
D6 (Targets): Desktop + phone with quality tiers. 60 fps on a normal laptop; phones get a lighter tier. World loads in parts (town centre first, interiors stream while walking). Total download budget about 60-80 MB.
D7 (Elite extras, all four IN): (a) fast-travel map + skip-to-resume text mode; (b) no-WebGL fallback HTML page + SEO and OpenGraph share tags; (c) guided first-visit tour; (d) rewrite and enrich resume content (needs real facts from user - source of facts still to be asked, never invent).
D8 (Life, all four IN): (a) NPC people in town and inside buildings (free rigged animated characters); (b) animals and nature motion (seagulls, birds, fish, crabs, butterflies, swaying trees/grass, waves); (c) moving things (boats, car/bus, flags, real-time clocks, ceiling fans, lighthouse beam); (d) weather and living light (clouds, mist, occasional rain, window/lamp/street lights switch on at dusk).
D9 (Building mapping, approved): plaza->Grand Hotel (lobby, restaurant, guest room, rooftop; intro hub; visitor starts here); notice->Post Office (counter; collect resume = resume download); forge->Engineering Workshop (tech skills); citadel->modern office tower GravityWrite HQ (newsroom floor, meeting room); broadcast->radio/TV station + antenna mast (studio, control room); gateway->security gatehouse + control office (GravityAuth); transport->harbour ferry terminal + bus stop (TransGenie); temple->community hall / open-source cafe (AI agent OSS); workshop->startup garage studio (1CLX); freshnote->design/note-taking studio; library->grand public library with archive stacks (experience timeline); academy->school/college (classroom, lab; education+certification); lighthouse->real lighthouse + keeper cottage, climb to top (contact); milestones->Town Hall / museum hall of achievements. Zone ids in ZONE_LAYOUT are kept so content/dialogue mapping is unchanged. Plus extras (non-resume): houses, cafe, shops, market, fishermen huts, boats.
D10 (Camera): third-person default with wall-aware camera collision + first-person toggle on key V.
D11 (Asset licences): CC0 only (Poly Haven, ambientCG, Quaternius, Kenney, KayKit etc). A licence ledger file records every asset (source URL, licence, author, file); a machine check fails if any asset is missing from the ledger.
D12 (Content facts): resume rewrite/enrichment uses ONLY the resume PDF and existing js/content/*.js. No new claims or numbers. A check/rule must forbid inventing facts.
D13 (Testing): Vitest for pure logic (collision, layout, ledger, content); Playwright driving the installed system Chrome for smoke/E2E (boots with zero console errors, walk through each door, every landmark dialogue opens, frame/triangle/draw-call budgets); node scripts for asset size and licence-ledger checks. How it looks = human check, screenshots saved for the user.
D14 (Layout): redesign and enlarge the island (radius about 300 m) as a real town plan: centre with streets + hotel, harbour, beach, forest, hill, farmland outskirts. Zone ids stay, positions change. Fast-travel keeps walking time fine.
D15 (Deploy): GitHub Actions workflow runs tests, builds with Vite, publishes to Pages. dist/ no longer committed. Human check: user must switch Pages source to GitHub Actions once in repo settings.
D16 (Avatar): replace Soldier with a rigged CC0 casual human (walk, run, idle, sit); if none passes the checks keep Soldier as fallback.
D17 (Order): VERTICAL SLICE FIRST. Epic 1 foundation (Vite migration, asset pipeline + ledger, materials, lighting, quality tiers, test harness). Epic 2 Grand Hotel + town square at full quality. Runner PAUSES for the user to review the look; the other 13 buildings follow only after approval.
D18 (Detail bar = Rich): each landmark has 3-6 rooms, 40+ distinct furniture/decor objects inside, exterior with windows, doors, signage, drainpipes, planters, bins, lamps. Hotel: lobby, restaurant + kitchen, 4+ guest rooms with bathrooms, corridors, rooftop. Counts declared in a per-building manifest and checked by a script.
D19 (Interactions, all four IN): (a) hinged doors open/close with E (animation + sound, some locked/decorative); (b) light switches and lamps, interior lights also auto-switch at dusk; (c) sit on chairs, sofas, beds (sit animation, camera adjusts); (d) read objects - books, screens, boards open the resume content, plus stairs and an elevator in the office tower.
D20 (Audio, all four IN): (a) footsteps by surface (grass, sand, gravel, wood, tile, carpet, stone, metal stairs); (b) positional ambience fading with distance and through walls; (c) interior acoustics (muffled outside, room echo); (d) new music per area (existing 6 loops stay where no new one exists). All audio CC0.
D21 (Town style): SOUTH INDIAN COASTAL TOWN (Tamil Nadu feel): pastel concrete buildings, coconut palms, tiled roofs, temple-style gate, fishing catamarans. RISK: far fewer CC0 assets than Mediterranean, so more must be built by code on top of generic CC0 PBR textures; look is riskier. (User chose this over the recommended Mediterranean.) Supersedes the style words in D3 (house/hotel/harbour stay).
D22 (Visual self-review): each building plan includes a best-effort visual self-review step: Playwright screenshots from fixed camera spots, the session views them and fixes obvious defects (floating objects, objects inside walls, flat/missing textures, black rooms). Never fails the run; screenshots saved for the user.
D23 (NPC depth): ambient only - they walk, sit, work on simple routines and path around the player. No conversations, no greeting lines.
D24 (Missing CC0 assets): user said: use /plan-research (research skill) for each South Indian element that lacks a CC0 model; if research finds nothing usable, BUILD IT BY CODE over CC0 textures. CC0-only (D11) stays; CC-BY is NOT allowed. NOTE: no /plan-research skill is available in this planner session, so this becomes an asset-research step inside the plans (web search of CC0 sources, record findings in the ledger, then fall back to code).
D25 (Local detail, all four IN): (a) temple gopuram-style gate + small temple at the entrance (oil lamps, stone steps, garlands); (b) street life - kolam at house doorsteps, tea stall, parked auto-rickshaw, town bus + bus stop; (c) fishing harbour - catamarans, nets, drying-fish racks, jetty, fish market; (d) Tamil + English signage using a Tamil web font. Tamil text correctness is a HUMAN CHECK.
D26 (Contact privacy): crawlable fallback page + SEO tags carry name, title, location, LinkedIn, GitHub; email only via click-to-reveal button (built by script, not plain text in HTML); phone number ONLY inside the 3D lighthouse (never in static HTML).
D27 (Live-site safety, reviewer F2): ALL work happens on branch world-v2. main and the live Pages site stay untouched until the user approves the result; merge to main only after approval. The Pages workflow is written early but deploys only from main.
D28 (Old non-CC0 assets, reviewer F1; verified in assets/audio/CREDITS.md): 5 sfx (footstep_grass, footstep_sand, interact, type_tick, scroll_pickup) are CC-BY-SA 3.0 and ocean_loop.ogg is CC-BY; Soldier.glb/Xbot.glb are Mixamo (not CC0). Epic 1 replaces ALL non-CC0 audio with CC0 and DROPS Soldier/Xbot. Avatar fallback becomes a CC0 Quaternius/Kenney character, not Soldier. Supersedes the Soldier-fallback part of D16 and the existing-loops note of D20 (the 6 music loops are CC0 and stay). The ledger check is then strict.
D29 (Phone tier, reviewer F6): phone tier is lighter than desktop: about half the decor objects, no point lights, 512 px textures, first-session download under 25 MB, interiors load only on entry and are hidden when the player is outside, per-building GPU memory cap. Desktop keeps Rich detail (D18). Overrides the 60-80 MB figure of D6 for phones (80 MB stays the total repo/asset ceiling).
D30 (Phone number, user said: remove it from the website): the phone number is REMOVED from the website entirely. It supersedes the lighthouse part of D26. contact.js phone field removed, lighthouse dialogue shows no phone, nothing in the bundle, fallback page, text mode or SEO tags. A script greps src/ and the build output for the digits 63839 64471 and fails if found. Email stays click-to-reveal, LinkedIn and GitHub stay. The resume PDF question is open (see Open questions).
D31 (Resume PDF, user chose: keep the current PDF as it is): the PDF (first line has +91 63839 64471 and the email, verified with pdftotext) stays unchanged and downloadable from the Post Office. So D30 applies to code, content, bundle, fallback page, text mode and SEO tags, NOT to the PDF; the D30 grep check must exclude the PDF. Human check: the downloadable PDF still contains the phone number (user choice).

## Assumptions
HIGH-RISK:
A1 (HIGH-RISK, security): plan sessions download assets from the internet unattended. Downloaded files are untrusted DATA: each goes in its own fresh folder, is never executed, zips are extracted into their own folder, the ledger records source URL, licence, author, sha256. Only well-known CC0 hosts (polyhaven.com, ambientcg.com, quaternius.com, kenney.nl, kaylousberg.com, opengameart.org CC0, freesound CC0). No login-gated sites.
A2 (HIGH-RISK, accuracy): Tamil signage text is drafted by the session (short, common shop words and place names) and flagged HUMAN CHECK; Tamil font must be OFL and self-hosted. Culture-specific items (gopuram, temple, kolam) are modelled respectfully; temple deity images/idols are NOT modelled, only architecture, lamps, garlands.
A3 (HIGH-RISK, facts): resume rewrite (D12) is checked by a script: every number, date, company, product name in new content must also occur in the source set (resume PDF text + existing js/content/*.js). PDF text is extracted with a dev-only node tool.
A4 (HIGH-RISK, scale): XL = roughly 40-60 plan files in about 8 epics, several days of unattended runs; the vertical-slice pause (D17) is the main cost control.

OTHER:
A5 Zone ids in ZONE_LAYOUT and the content mapping stay; dialogue overlay stays as the accessible HTML panel but opens from E on specific objects (books, screens, boards, reception desk) instead of auto-opening by radius. Zone name label + E prompt on entering a building stay. README controls table updated at the end.
A6 Hotel (zone id plaza) is the spawn point; the intro dialogue sits at the reception desk; the other 13 zone ids map per D9.
A7 Performance budgets (to be fixed in ARCHITECTURE.md, tuned by plan 001 measurement): desktop <= 600 draw calls and <= 3M visible triangles; phone <= 250 draw calls and <= 800k; textures 2K for hero surfaces, 1K default, 512 on phone tier; textures as KTX2 or WebP; models as compressed GLB (meshopt/draco). Checked by renderer.info counts at fixed camera spots, not fps (headless Chrome uses software GL so fps is not reliable).
A8 Assets are committed to git directly, no Git LFS; each file under 20 MB; total under 80 MB; raw downloads kept outside the repo.
A9 Dependencies pinned by lockfile: three (current stable), vite, vitest, @playwright/test (uses system Chrome, no browser download), howler (npm instead of CDN), a glTF optimisation tool (dev only), a PDF text tool (dev only). Fonts (Inter, Orbitron, Noto Sans Tamil, all OFL) self-hosted instead of Google Fonts CDN.
A10 Collision: circle list replaced by wall/box colliders + walkable floor heights + stairs, camera collision, and a simple nav grid for NPCs; collision data derived from each building manifest and unit-tested.
A11 Interior lighting: limited point/spot lights per room, culled by distance to the player, emissive fakes elsewhere, no baked lightmaps; optional SSAO on the high tier.
A12 Quality tiers low/medium/high auto-detected (extends existing perfMode) plus a settings menu to override and a reduced-motion option.
A13 Streaming: the world is split into areas; interiors and far areas load and unload by distance with no loading screen; first load shows town centre + hotel first, with progress UI.
A14 Terrain: textured splat blend (grass, sand, dirt road, rock) from CC0 PBR textures, roads as spline meshes with kerbs, shoreline foam and depth-coloured water shader, enlarged island ~300 m radius (D14).
A15 In-world signage uses real-business-style names tied to the resume section (e.g. GravityWrite HQ); the hotel name is a placeholder the user can change (HUMAN CHECK).
A16 Guided tour is skippable and shown once per browser (localStorage, wrapped in try/catch).
A17 Test determinism: seeded RNG everywhere; a dev/test-only hook (window.__world) lets Playwright teleport, list doors/objects and read renderer.info; it is stripped from the production build.
A18 Old code: v1 world code replaced during migration (git history keeps it); the 14-byte Ybot.glb stub removed; Xbot.js base64 model replaced by a normal GLB file load.
A19 Default time of day stays dayFraction 0.28 with ?time= and T key kept; weather is seeded and can be forced with ?weather= for tests.
A20 Epic order: E1 foundation; E2 vertical slice (hotel + town square + surrounding terrain) then PAUSE for user approval; E3 town plan, terrain, roads, harbour, beach, forest; E4 the other 13 buildings in groups (exterior + interior + objects); E5 life (NPCs, animals, moving things, weather, living light); E6 audio; E7 elite extras (map, text mode, fallback + SEO, tour, content rewrite); E8 polish, perf pass, CI + Pages deploy. Each epic ends with a milestone where the runner pauses.

A21 (reviewer F3; narrows A1) Unattended download hosts are ONLY those with direct scriptable CC0 downloads: Poly Haven (API), ambientCG (API), Kenney, Poly Pizza (CC0 items incl. Quaternius), OpenGameArt items tagged CC0 with direct links. Freesound (login needed), itch.io and Google-Drive hosted packs are dropped.
A22 (reviewer F5) The site stays a GitHub project page at /portfolio/ with no custom domain: Vite base is /portfolio/. The resume PDF is copied via public/ under a no-space name; the download filename used today (Kaviyarasu_Fullstack_Engineer_Resume.pdf) is kept.
A23 (reviewer F7) CI runs Vitest, ledger + size checks and a boot smoke test only. Full walk-through and budget tests run locally inside plan sessions (software WebGL in CI is slow).
A24 (reviewer F8) Content fact check: digits, years, % values and any capitalised word or phrase not in a small common-word allowlist must appear in the source text (resume PDF text + existing js/content files). Unknown tokens fail the check. Refines A3.
A25 (reviewer F9) Touch controls: on-screen joystick, a context action button (does E), buttons for camera toggle (V) and map. Playwright checks at a mobile viewport.
A26 (reviewer F10) Extra machine checks: grep build output for window.__world (must be absent); a ?time= test reads light intensity via __world to prove lights switch on at dusk; indoor muffling checked via an audio-filter state exposed by __world; tour shows once (localStorage test); Tamil font is OFL and self-hosted (file + licence text exist); streaming order test (town centre + hotel load before other areas).
A27 (reviewer F11) Indoor NPCs stay on ONE floor following waypoint loops per room; no NPCs on stairs or in the elevator. Outdoor NPCs use the nav grid.
A28 (reviewer F12) Browser matrix: latest Chrome, Edge, Firefox, Safari 16+, iOS Safari 16+. KTX2 and meshopt/draco decoders self-hosted, not from a CDN. WebGL context loss is handled (restore or friendly message). A failed streamed chunk shows a retry/error UI. No-WebGL detection routes to the plain fallback page. A credits/licences page is generated from the ledger and ships OFL licence texts.
A29 (reviewer F13) Raw downloads go to a fixed folder OUTSIDE the repo: ..portfolio-asset-cache<source><id> so fresh sessions can resume. Asset research per element tries at most 3 sources, then the item is built by code.
A30 (reviewer F14) Display names and prompts in zones.js, minimap labels and dialogue titles are renamed to the D9 building names; ids are kept; README and CREDITS.md updated.

## Out of scope
- Multiplayer or any server/backend, accounts, CMS, analytics, saving progress.
- VR/AR, voice, payments.
- Drivable vehicles and physics objects (cars, boats and buses move on fixed routes only).
- Languages beyond English UI + Tamil/English signage.
- NPC conversations (D23).
- CC-BY or any non-CC0 asset (D11, D24).
- Git LFS.
- Photoreal ray tracing, WebGPU-only features.

## N/A areas
- Users and roles: N/A, one anonymous visitor.
- Data tables/ids/joins: N/A, no database; only static JSON manifests, content files and the asset ledger.
- Backend API / API contracts: N/A, static site only.
- Auth: N/A, no login.
- Admin panel: N/A.
- Real-time and background jobs: N/A at runtime; in-world animation is client-side only.
- Notifications and side effects: N/A.
- Observability: N/A beyond dev counters (renderer.info), build/test logs and CI output; no analytics.

## Open questions
- User confirmed D1-D26 and A1-A20 at STEP 5 (batch 9). Reviewer round 1 done (F1-F14 handled: D27-D30, A21-A30).
- Reviewer round 2 skipped on purpose: round-1 changes were small and all handled (D27-D31, A21-A30); budget used 32 of 45.
