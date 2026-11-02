# Realistic World Overhaul - Design Spec

Date: 2026-10-30 · Slug: realistic-world-overhaul · Size: XL
Source of truth: `docs/plans/realistic-world-overhaul/_planning/requirements.md` (decision ids D#, assumption ids A#). This spec adds no new facts.

## 1. Goal

Turn the basic low-poly island (14 box-and-cylinder landmarks, no interiors) into a realistic, walk-in **South Indian coastal town** that a visitor experiences as a real world: every building, room, street, harbour and outdoor area has natural, in-depth detail (D1, D3, D18, D21). The resume content stays the point of the portfolio and lives inside the world as real objects (D4).

Success = all of these hold on branch `world-v2` (D27):
- All 14 landmarks are enterable seamlessly and meet the Rich detail bar, checked by manifest counts.
- The town, harbour, beach, forest, roads, water, sky, weather and light are textured and alive.
- Desktop and phone tiers meet their budgets; every machine check below passes.
- The user approves the vertical slice (epic 2) and the final result before anything merges to `main`.

## 2. Scope

**IN (all from requirements.md)**
- Tech: current Three.js + Vite, Vitest, Playwright on system Chrome, GitHub Actions to Pages (D5, D13, D15).
- Hybrid realism: CC0 assets + code, licence ledger, research-then-code fallback (D2, D11, D24, A21, A29).
- World: enlarged island of about 300 m radius with a real town plan (D14, A14).
- Buildings per D9, all walk-in, Rich detail (D4, D18); zone ids kept, names and prompts renamed (A30).
- Interactions: doors, light switches, sitting, reading objects, stairs, elevator (D19). Camera: third person + V first person (D10).
- Life: NPCs (ambient only), animals, moving things, weather and living light (D8, D23, A27).
- Audio: surface footsteps, positional ambience, interior acoustics, new music, all CC0 (D20, D28).
- Local detail: gopuram gate and small temple, street life, fishing harbour, Tamil + English signage (D25).
- Elite extras: fast-travel map, text mode, no-WebGL fallback + SEO, guided tour, content rewrite from existing facts only (D7, D12, A3, A24).
- Avatar: CC0 casual human; Soldier and Xbot dropped (D16, D28).
- Privacy: phone number removed from the website code, content and pages (D30); email click-to-reveal (D26).
- Safety: branch `world-v2`, no main until approval (D27).

**Epics (each ends at a milestone where the runner pauses; E2 is the review pause, D17, A20)**
E1 Foundation · E2 Vertical slice (Grand Hotel + town square + surrounding terrain) → **PAUSE for user approval** · E3 Town plan, terrain, roads, harbour, beach, forest · E4 The other 13 buildings in groups · E5 Life · E6 Audio · E7 Elite extras · E8 Polish, performance, CI + Pages deploy.

**OUT** (requirements.md "Out of scope" and "N/A")
Multiplayer, backend, accounts, CMS, analytics, saved progress, VR/AR, voice, payments, drivable vehicles and physics objects, NPC conversations, languages beyond English UI + Tamil/English signage, CC-BY or any non-CC0 asset, Git LFS, ray tracing, WebGPU-only features. No database, API, auth, admin, notifications or runtime background jobs exist in this static site.

No research.md or audit exists for this feature, so there are no research feature ids or audit finding ids.

## 3. Requirements

Script names below are proposals; ARCHITECTURE.md fixes the final names. Each criterion is a command a machine can run.

### R1 Foundation: build, branch, deploy path (E1) - D5, D15, D27, A9, A18, A22
- Work is on branch `world-v2`. `git branch --show-current` returns `world-v2` in every plan; no plan touches `main`.
- `npm ci && npm run build` exits 0 and writes a static site with Vite `base` `/portfolio/`; no CDN `<script>` tags remain in the built `index.html` (grep); three, howler and fonts come from the bundle or self-hosted files.
- `build.mjs`, `dist/bundle.js` tracking, `Xbot.js` and the 14-byte `Ybot.glb` stub are removed; the player loads a normal GLB file.
- A GitHub Actions workflow runs tests, builds and publishes to Pages and is limited to `main` pushes (`grep` of the workflow file); the user switches the Pages source once (human check).
- Existing behaviour that still has to work after migration: boot, WASD/mouse movement, day/night clock, `?time=`, `T` key.

### R2 Assets, licence ledger, old-asset replacement (E1) - D2, D11, D24, D28, A1, A21, A29
- `assets/LEDGER.json` has one entry per shipped asset file: source URL, licence `CC0`, author, sha256, file path. `npm run check:ledger` fails if any shipped asset file is missing, any licence is not CC0, any source host is outside the A21 list, or a sha256 mismatches.
- The 5 CC-BY-SA sfx, `ocean_loop.ogg` (CC-BY) and Soldier/Xbot (Mixamo) are gone from the repo; replacements are CC0 and in the ledger. The 6 existing music loops (CC0) stay.
- Downloads are untrusted data: each goes into its own folder under `..\portfolio-asset-cache\<source>\<id>\`, nothing downloaded is executed, at most 3 sources are tried per element before building it by code.
- Total shipped asset size `<= 80 MB`, each file `< 20 MB` (`npm run check:size`).
- A credits/licences page is generated from the ledger and includes OFL licence texts for fonts (A28).

### R3 Materials, lighting, quality tiers (E1) - D6, A7, A11, A12, A13
- Shared PBR material library from CC0 textures (plaster, concrete, tile, wood, stone, cloth, metal); textures at 2K hero / 1K default / 512 phone, as KTX2 or WebP; models as compressed GLB (A7). KTX2 and meshopt/draco decoders are self-hosted (A28).
- Quality tiers `low | medium | high` auto-detected with a settings menu to override and a reduced-motion option (A12).
- Interior lights are point/spot lights culled by distance to the player (A11).
- Budgets read from `renderer.info` at fixed camera spots (A7, to be tuned by the first measurement plan): desktop `<= 600` draw calls and `<= 3M` triangles; phone `<= 250` draw calls and `<= 800k`. `npm run check:budget` fails above them.
- Phone tier (D29): first-session download `< 25 MB`, no point lights, 512 px textures, about half the decor objects, interiors load only on entry and are hidden when the player is outside, per-building GPU memory cap.

### R4 Test harness and CI (E1) - D13, A17, A23, A26
- `npm test` (Vitest) covers collision, layout, ledger, content-fact check, manifests. `npm run test:e2e` (Playwright, system Chrome) runs the world with seeded RNG.
- A dev/test-only `window.__world` hook lets tests teleport, list doors/objects/lights and read `renderer.info`. `grep -r "__world" <build output>` returns nothing in the production build.
- CI runs Vitest, ledger and size checks and a boot smoke test; the full walk-through and budget tests run locally in plan sessions (A23).
- Boot smoke test: page loads, zero console errors, canvas renders non-blank.

### R5 Collision, camera, avatar, interaction systems (E2) - D10, D16, D19, A10
- Wall/box colliders, walkable floor heights and stairs replace the circle list; data is derived from each building manifest. Vitest proves: the player cannot pass through a wall, can pass through an open door, can walk up a staircase, and cannot leave the island.
- Camera collision keeps the third-person camera out of walls (Vitest on the camera solver). `V` toggles first person; a Playwright test asserts the camera mode flips.
- Avatar is a rigged CC0 casual human with idle, walk, run, sit; a Playwright test asserts all four clips exist and play. Fallback is a CC0 Quaternius/Kenney character (D28).
- Reusable interaction systems, each with a Vitest + Playwright test: hinged doors (open/close with `E`, animated, some locked), light switches (toggle lights; interior lights auto-on at dusk), sit (chair, sofa, bed), read objects (book, screen, board, desk open the resume dialogue panel, A5), stairs, elevator in the office tower.

### R6 Building manifest and Rich detail bar (E2 and E4) - D18
- Each building has a manifest (rooms, object list, doors, lights, interactables). `npm run check:buildings` fails if a landmark has `< 3` or `> 6` rooms, `< 40` distinct furniture/decor object types, no enterable door, an unreachable room (nav check), or a missing exterior detail class (windows, doors, signage, drainpipes, planters, bins, lamps). The Grand Hotel additionally needs lobby, restaurant + kitchen, `>= 4` guest rooms with bathrooms, corridors and a rooftop.
- Each building plan ends with a best-effort visual self-review (D22): Playwright screenshots from fixed camera spots saved under the plan's output folder, viewed and defects fixed. This step never fails the run.

### R7 Vertical slice: Grand Hotel + town square (E2) - D9, D17, A6
- Zone id `plaza` is the spawn point inside/at the Grand Hotel; the intro dialogue opens from the reception desk (A6).
- Hotel and square pass R5 and R6 checks; the surrounding terrain is textured (R9).
- Milestone: runner pauses; human check: user reviews screenshots and approves the look before E3 starts (D17).

### R8 The other 13 buildings (E4) - D9, D4, D25, A30
Per zone id the building and its resume content object:
`notice` Post Office (resume download at the counter) · `forge` Engineering Workshop (skills) · `citadel` GravityWrite HQ office tower (newsroom floor, meeting room, stairs, elevator) · `broadcast` radio/TV station + mast · `gateway` security gatehouse · `transport` ferry terminal + bus stop · `temple` community hall / open-source cafe · `workshop` startup garage · `freshnote` design studio · `library` public library with archive stacks (experience timeline) · `academy` school/college · `lighthouse` lighthouse + keeper cottage, climb to top (contact) · `milestones` Town Hall / hall of achievements.
- Every building passes R5 and R6. Zone names and prompts in `zones.js`, minimap labels and dialogue titles use the new names; ids unchanged (A30); a Vitest test checks id/name consistency.
- Each zone's dialogue opens from its object via `E` and shows the same content as today (Playwright: all 14 dialogues open).
- Extras (houses, cafe, shops, market, fishermen huts, boats) are placed by the town plan (R9).

### R9 Town plan, terrain, water, sky, vegetation (E2 slice part, E3) - D14, A14
- Island radius about 300 m with a town plan: centre with streets and the hotel, harbour, beach, forest, hill, farmland outskirts. A layout Vitest checks no building overlaps another, each landmark is reachable from the spawn by a road/path (nav check), and walk time spawn → farthest landmark is within a limit set in ARCHITECTURE.md.
- Terrain is textured splat (grass, sand, dirt road, rock); roads are spline meshes with kerbs; water has shoreline foam and depth colouring; vegetation uses CC0 trees/plants with wind sway.
- Local detail (D25): gopuram-style gate + small temple (no idols or deity images, A2), kolam at house doorsteps, tea stall, parked auto-rickshaw, town bus + stop, catamarans, nets, drying-fish racks, jetty, fish market, Tamil + English signage. Items without a CC0 model go through the research-then-code rule (R2). A manifest check proves each item exists in the world.
- Tamil font is OFL and self-hosted: a test checks the font file and its licence text exist (A26).

### R10 Life (E5) - D8, D23, A27
- NPCs ambient only: walk, sit, work on routines. Outdoor NPCs use the nav grid; indoor NPCs stay on one floor on waypoint loops, never on stairs or the elevator (A27). Vitest proves NPC paths stay on walkable cells; Playwright proves they do not walk through walls.
- Animals and nature motion: seagulls, birds, fish, crabs, butterflies, swaying trees/grass, waves.
- Moving things: boats on fixed routes, a car/bus, flags, clocks showing real time, ceiling fans, lighthouse beam.
- Weather and living light: clouds, mist, occasional rain (seeded; `?weather=` forces it), window/lamp/street lights on at dusk. Playwright with `?time=` reads light intensity via `__world` and proves lights are on at night and off at noon (A26).

### R11 Audio (E6) - D20, D28
- Footsteps by surface (grass, sand, gravel, wood, tile, carpet, stone, metal stairs): a test maps each walkable surface type to a sound and fails on an unmapped surface.
- Positional ambience with distance falloff; interior acoustics (muffled outside sound + room echo): `__world` exposes the audio-filter state and a Playwright test proves it changes at the door.
- New music per area; all audio files are in the ledger as CC0.

### R12 Elite extras (E7) - D7, D12, D26, D30, A3, A13, A16, A24, A25, A28
- Fast-travel map (key + touch button): Playwright proves it teleports to each of the 14 zones.
- Text mode ("skip to resume") shows the full resume as a normal page.
- No-WebGL fallback page and SEO/OpenGraph tags: with WebGL disabled the fallback is served (Playwright); title, description and OG tags exist (grep). It contains name, title, location, LinkedIn, GitHub and an email click-to-reveal built by script, never plain text.
- Phone number: `npm run check:phone` greps `src/` and the build output (excluding the resume PDF, D31) for `63839 64471` and `6383964471` and fails on any hit.
- Guided first-visit tour: skippable, shown once per browser (localStorage in try/catch); a Playwright test proves it shows on the first visit and not on the second.
- Content rewrite: new wording in the content files passes `npm run check:content` using the A24 rule: every digit/year/% token and every capitalised word or phrase outside a small allowlist must occur in the source text (resume PDF via `pdftotext`-style extraction + the pre-rewrite `js/content/*.js`). Unknown tokens fail.
- Touch controls (A25): joystick, context action button (`E`), camera-toggle and map buttons; Playwright at a mobile viewport proves each works.
- Robustness (A28): WebGL context loss does not leave a blank page; a failed chunk load shows a retry UI (Playwright with a blocked request).

### R13 Polish, performance, release (E8) - D6, D15, D27, A7, A22
- Final budget run passes both tiers; streaming order test proves town centre + hotel load before other areas.
- README controls table, zone table and CREDITS.md updated; credits page regenerated.
- CI workflow green (Vitest, ledger, size, boot smoke). Merge to `main` happens only after the user approves (D27), a human step.

## 4. User journeys (each becomes an end-to-end Playwright test)

1. **Arrive and check in:** open the site → load progress → spawn at the Grand Hotel → walk to the reception desk → `E` → intro dialogue opens → close it.
2. **Walk through a door:** walk to the Post Office → press `E` on the door → it opens → step inside without a loading screen → counter → `E` → resume downloads (file name unchanged).
3. **Read the experience:** travel to the library via the fast-travel map → enter → `E` on the archive book → experience timeline dialogue opens → the listed roles equal the content file.
4. **Climb the lighthouse:** walk the road from the harbour → enter → climb the stairs → top room → `E` on the contact board → LinkedIn, GitHub and click-to-reveal email show; no phone number.
5. **Sit and look around:** inside the hotel guest room → `E` on the bed → sit animation → press `V` → first-person view → stand up.
6. **Night in town:** open with `?time=0.75` → street, window and interior lights are on → walk inside a building → outside sound is muffled → walk out.
7. **Phone visit:** mobile viewport → joystick moves → action button opens a door → map button teleports → first-session download under the phone limit.
8. **No-WebGL visitor:** WebGL disabled → fallback page shows the resume content and email reveal button → no phone number in the HTML.

## 5. Production readiness

- **Logging/monitoring:** no runtime analytics (out of scope). Dev counters from `renderer.info`; build, test and CI logs. Console errors fail the smoke test.
- **Rate limits / audit log / backups:** N/A, static site with no backend. Backups: git history plus branch `world-v2` (D27).
- **CI and deploy:** GitHub Actions: `npm ci`, Vitest, ledger + size checks, build, boot smoke, publish to Pages from `main` only. The Pages source setting is a one-time human step.
- **Secrets:** none required. No tokens are committed; downloaded assets are data only (A1).
- **Compatibility:** latest Chrome, Edge, Firefox, Safari 16+, iOS Safari 16+ (A28).
- **Dependencies:** pinned by lockfile; fonts self-hosted; howler from npm (A9).
- **Resilience:** WebGL context loss handling; chunk-load retry UI; no-WebGL fallback routing (A28).
- **Security/privacy:** untrusted-download rules (A1, A21); phone number removed from the site except the PDF (D30, D31); email click-to-reveal (D26).

## 6. Human checks (go to the final report, never block a run)

- Look and feel of every building, street and the harbour (only the user can judge realism); screenshots are saved by the visual self-review steps (D22).
- **Epic 2 review pause:** approve the vertical slice look before E3 (D17).
- Tamil signage text is correct and respectful (A2); hotel and shop names are acceptable placeholders (A15).
- Gopuram, temple, kolam and catamaran detail are accurate and respectful (D25).
- The resume PDF still contains the phone number and email, by the user's choice (D31); replace it if that changes.
- Switch the Pages source to GitHub Actions once in repo settings (D15); approve the merge from `world-v2` to `main` (D27).
- Check on a real phone (iOS Safari and Android) that it runs and does not crash (D29).

## 7. Assumptions (HIGH-RISK first)

**HIGH-RISK**
- A1 Unattended asset downloads are untrusted data: separate folders, never executed, ledger with sha256. Narrowed by A21 to direct-download CC0 hosts only.
- A2 Tamil signage text is drafted by the session and is a human check; no idols or deity images are modelled.
- A3 + A24 Content rewrite is checked by a script against the resume PDF text and existing content; unknown tokens fail.
- A4 XL means roughly 40-60 plan files in 8 epics and days of unattended runs; the slice pause (D17) is the cost control.
- D21 South Indian style has few CC0 assets: more items are built by code (D24), so the look is riskier than a Mediterranean town.

**OTHER**
A5 dialogues open from objects, not by radius · A6 hotel is spawn, intro at reception · A7 budgets by counts, tuned by the first measurement · A8 assets committed to git, no LFS, `< 80 MB` · A9 pinned dependencies, self-hosted fonts · A10 wall/box colliders + floors + nav grid · A11 interior light culling · A12 quality tiers + settings · A13 streaming without a loading screen · A14 textured terrain, spline roads, foam water · A15 business-style names, hotel name is a placeholder · A16 skippable tour once per browser · A17 seeded tests, dev-only `__world` · A18 v1 code replaced · A19 time defaults kept, seeded weather · A20 epic order · A21 allowed download hosts · A22 base `/portfolio/` · A23 CI scope · A25 touch controls · A26 extra checks · A27 indoor NPC loops · A28 browser matrix and robustness · A29 asset cache folder and 3-source cap · A30 rename zone names, keep ids.
