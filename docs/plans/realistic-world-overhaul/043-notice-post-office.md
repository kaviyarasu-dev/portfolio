# Plan 043: Post Office (zone notice): resume at the counter, journey 2

Epic E4. Estimated turns: 55.

## Goal

Build the Post Office, the first converted landmark, in the style of a small town post office (cream plaster, red-oxide hip tile roof, pillared front veranda, a red pillar box, a hanging board in English and Tamil). The resume is collected at the counter: pressing `E` there downloads the PDF exactly as v1 did and shows the existing notice dialogue. Also create the shared dialogue expectation file for all 14 zones and prove journey 2.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only notice`).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 3, 10.6 and requirement R6, R8, decision D4, D9, D18, A5, A30)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/building-manifest.md
- src/world/buildings/plaza/manifest.json
- src/world/buildings/plaza/build.js
- src/world/kit/exterior.js
- src/world/kit/building.js
- src/world/layout/town.json
- src/world/zones.js
- src/content/dialogues.js
- src/content/signage.js
- scripts/check-buildings.mjs

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Post Office

Deliver:
- Create `src/world/buildings/notice/manifest.json` (schema of `docs/building-manifest.md`): `id: "notice"`, `displayName: "Post Office"`, `prompt: "collect resume"`, footprint taken from the `notice` anchor in `src/world/layout/town.json` (about 14 by 10 m), floors one floor (level 0, height 3.6), style: plaster wall tint `#f3e3b8`, `hip` roof with `roofTile`, pitch 0.5, overhang 0.8, trim `woodDark`.
- Rooms (ids fixed): `hall` (public counter hall, 7 by 8 m); `sorting-room` (sorting room behind the counter, 7 by 5 m); `postmaster-office` (postmaster office, 5 by 4 m). Room count between 3 and 6.
- Doors: main door south into `hall` (width 1.6, `exterior`, unlocked), a staff door from `hall` to `sorting-room` (interior), a door from `sorting-room` to `postmaster-office` (interior, unlocked), a back door from `sorting-room` to outside (`exterior`, `locked: true`). At least one unlocked exterior door that is not decorative. Windows: at least 8 (3 on the front, 2 each side, 1 back). Stairs and lifts: none; a ramp is not needed.
- `exteriorDetails` counts (all seven classes, window at least 4): window 8, door 2, signage 2, drainpipe 4, planter 4, bin 2, lamp 4; the exterior kit adds a veranda with 4 pillars (`portico`), a red pillar box outside, a flagpole, a notice board by the door. `interactables`: declare only `post-counter` now (kind `read`, room `hall`, `dialogueKey` `main`, prompt "collect resume").
- `tests/unit/buildings/notice.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the back door is locked and the other exterior door is not, the hall is within 6 m of the main door; the CLI `check:buildings --only notice --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/notice.test.js`
- `node scripts/check-buildings.mjs --only notice --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/notice/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/notice/build.js` exports `decorateNotice(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): a pillared veranda (`portico` with 4 columns and steps), a hip tile roof with deep eaves, arched windows with shutters, `post-box-red` outside on the left, a flagpole with a flag, `signboard` "POST OFFICE / அஞ்சல் அலுவலகம்" above the veranda, planters at the steps, two wall lamps, a bicycle stand.
- Signage from `src/content/signage.js`: add the keys `post-office` (already in the vocabulary), `post-hours` (OPEN 10-5 / திறந்திருக்கிறது) (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/noticeExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/noticeExterior.test.js`
- `node scripts/check-buildings.mjs --only notice --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/notice/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `hall` (floor material `floorTile`): `counter-grille` x1 along the back wall with a gap for the postal clerk, `queue-rope` x2, `post-box-red` inside the door, `bench-wood` x2, `notice-board` x2, `wall-clock`, `fan-ceiling` x3, `plant-potted-large` x2, `table-side`, `stamp-desk` x2, `scale-parcel`, `sign-board` (Tamil POST OFFICE / அஞ்சல் அலுவலகம்), `lamp-pendant` x2, `picture-frame-set`, `doormat`, `trash-bin-small`. Lights: two pendants group `hall` auto dusk plus a switch at the door.
- Room `sorting-room` (floor material `floorTileDark`): `sorting-rack` x2, `parcel-shelf` x3, `parcel-stack` x3, `mail-sack` x4, `table-folding` x2, `chair-wooden` x2, `shelf-wall`, `tube-light` x3, `fan-pedestal`, `filing-cabinet` x2, `water-filter`, `book-stack`, `paper-tray` x2. Lights: three tube lights group `sorting`, switch at the door.
- Room `postmaster-office` (floor material `woodPlanks`): `desk-wood`, `chair-office`, `chair-wooden` x2, `bookshelf-low`, `filing-cabinet`, `cabinet-glass`, `safe-box`, `monitor-desktop`, `keyboard-mouse`, `phone-desk`, `lamp-table`, `rug-rect`, `wall-clock`, `picture-frame-set`, `fan-ceiling`, `printer-copier`, `plant-office`. Lights: table lamp and one ceiling light group `office`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. Use the post-office props of set E generously.
- Interactables: post-counter (`read`, the object is clerk counter (`counter-grille`) in the hall); light switches per room; seats the two waiting benches.
- `tests/unit/buildings/noticeInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the counter is within 4 m of the entrance and reachable with a clear path, both benches are seat interactables.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/noticeInterior.test.js`
- `node scripts/check-buildings.mjs --only notice`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- Create `tests/fixtures/zoneExpect.json` for ALL 14 zones from the content as it is today: `{ "<zoneId>": { "title": "<display name from ARCHITECTURE 10 / the D9 mapping>", "mustInclude": ["<two or three distinctive strings that appear in the dialogue today>"] } }`. Display names: plaza Grand Hotel, notice Post Office, forge Engineering Workshop, citadel GravityWrite HQ, broadcast Broadcast Station, gateway Security Gatehouse, transport Ferry Terminal, temple Community Hall, workshop Startup Garage, freshnote Design Studio, library Public Library, academy Academy, lighthouse Lighthouse, milestones Town Hall. Read `src/content/dialogues.js` and the content files to pick the strings (project names, company names, numbers that exist today; never invent). `tests/unit/content/zoneExpect.test.js`: all 14 ids present, each has a title and at least 2 `mustInclude` strings, and each string occurs in the rendered text of the matching dialogue builder (render with a minimal fake DOM or by reading the text nodes of the builder output).
- `src/world/zones.js`: `notice` becomes `name: "Post Office"`, `prompt: "collect resume"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `notice` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `notice` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `notice` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (clerk counter (`counter-grille`) in the hall) so `E` opens the existing dialogue for `notice` (A5); for this zone `E` at the counter keeps the v1 behaviour of `tryAction`: it triggers the resume download of `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` as `Kaviyarasu_Fullstack_Engineer_Resume.pdf`, shows the toast RESUME DOWNLOADED, a small camera shake and the interact sound, and ALSO opens the notice dialogue (move this behaviour into the interactable `onUse`).
- `tests/e2e/notice.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `notice` with `interiorVisible` true and empty `problems`; walk to the clerk counter (`counter-grille`) in the hall and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[notice].mustInclude` and the display name; Escape closes; listen for the download event on `E` at the counter: `download.suggestedFilename()` is `Kaviyarasu_Fullstack_Engineer_Resume.pdf` (journey 2 of the spec: arrive, door opens with `E`, step inside with no loading screen, counter, `E`, download); zero console errors.
- Add budget spots `notice-outside` and `notice-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 043 --spots notice-outside,notice-inside,post-veranda`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/notice.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only notice`
- `npx vitest run tests/unit/content/zoneExpect.test.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/notice.test.js tests/unit/buildings/noticeExterior.test.js tests/unit/buildings/noticeInterior.test.js`
- `node scripts/check-buildings.mjs --only notice`
- `npx playwright test tests/e2e/notice.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Walk the Post Office and compare with a real Indian post office; check the Tamil sign.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
