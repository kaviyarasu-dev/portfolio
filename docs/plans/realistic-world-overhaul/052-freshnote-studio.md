# Plan 052: Design and note-taking studio (zone freshnote)

Epic E4. Estimated turns: 60.

## Goal

Build the Freshnote design studio: a bright four-room studio (gallery, design room, meeting room and pantry) with a gallery wall of notes and sketches, drawing tables and easels, and a green wall outside. The mood board in the design room opens the Freshnote project dialogue.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only freshnote`).

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
- src/world/buildings/registry.js
- src/world/areas/index.js
- src/world/buildings/workshop/build.js
- src/world/props/sets/design.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Structure manifest for the Design Studio

Deliver:
- Create `src/world/buildings/freshnote/manifest.json` (schema of `docs/building-manifest.md`): `id: "freshnote"`, `displayName: "Design Studio"`, `prompt: "visit studio"`, footprint taken from the `freshnote` anchor in `src/world/layout/town.json` (exactly 16 by 12 m (`footprint { w: 16, d: 12 }`, building-local x -8 to 8 and z -6 to 6, origin at the centre, +z = front/south; the `freshnote` anchor of `town.json` (plan 032) must have that size, else stop with BLOCKED.md)), floors one floor (level 0, y 0, height 3.8), top-level `"stage": "structure"` for now (step 3 raises it to `full`), top-level `roomMin` `{ "gallery": 14, "design-room": 12, "meeting-room": 14, "pantry": 12 }`, style: plaster wall tint `#f4efe6`, `flat` roof with a green parapet, pastel accent trim `#9ec7b3`.
- Rooms (ids fixed): `gallery` (entry gallery with note walls, 8 by 6 m); `design-room` (design room, 9 by 6 m); `meeting-room` (meeting room, 5 by 5 m); `pantry` (pantry, 4 by 3 m). Room count between 3 and 6.
- Doors: five doors; `at` = metres along the wall from the wall centre (world coordinate in brackets): `main` (exterior, unlocked, the main door) on the south wall of `gallery`, width 1.8, height 2.4, at -4.0 (world x -4.0), hinge left; `gallery-design` (interior, wide opening 2.2, unlocked) on the north wall of `gallery` (z 0), at -5.0 (world x -5.0), hinge left; `gallery-meeting` (interior, unlocked) on the east wall of `gallery` (x 0), at 2.5 (world z 2.5), width 1.2, height 2.2, hinge right; `design-pantry` (interior, unlocked) on the east wall of `design-room` (x 1), at -4.5 (world z -4.5), width 0.9, height 2.2, hinge right; `pantry-back` (exterior, `locked: true`) on the north wall of `pantry` (z -6), at 3.0 (world x 3.0), width 0.9, height 2.2, hinge left. Rooms: `gallery` `[-8, 0, 0, 6]` (8 by 6), `design-room` `[-8, -6, 1, 0]` (9 by 6), `meeting-room` `[0, 1, 5, 6]` (5 by 5, its south wall is on the south footprint wall), `pantry` `[1, -6, 5, -3]` (4 by 3); the four rectangles do not overlap and do not tile the footprint: the leftover 53 m2 is solid service void (thick walls, no room, no door, no window). At least one unlocked exterior door that is not decorative. Windows: exactly 12 windows, ids `w-1` to `w-12`, all width 1.2, height 1.4, sill 1.0, each on an exterior wall of its room: `w-1` `design-room` west wall z -4.0; `w-2` `design-room` west wall z -1.5; `w-3` `design-room` north wall x -6.0; `w-4` `design-room` north wall x -3.0; `w-5` `design-room` north wall x 0.0; `w-6` `gallery` west wall z 2.0; `w-7` `gallery` west wall z 4.5; `w-8` `gallery` south wall x -6.8; `w-9` `gallery` south wall x -1.5; `w-10` `meeting-room` south wall x 2.5; `w-11` `meeting-room` south wall x 4.5; `w-12` `pantry` north wall x 1.5. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 12, door 2 (`main` and `pantry-back`), signage 2, drainpipe 4 (the four corners of the footprint), planter 8 (pots at the entry and in the rooms, built by the decorator), bin 2, lamp 5 (the manifest counts; the generic kit builds window, door and drainpipe, the decorator builds signage, planter, bin and lamp (`skipGeneric`)); the extras (never declared in the manifest, ARCH 10.8) are the green wall (40 planter boxes, see the exterior step: class `extra`, NOT the planter class), the awning, the bicycle rack with 3 `cycle-parked` (plan 039 local item), the sandwich board and the lit signboard. `interactables`: declare only `mood-board` now (kind `read`, room `design-room`, `dialogueKey` `main`, prompt "visit studio").
- `tests/unit/buildings/freshnote.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the back door `pantry-back` is locked and `main` is unlocked and not decorative, exactly 12 windows with ids `w-1` to `w-12`, the four room rectangles (gallery 8 by 6, design-room 9 by 6, meeting-room 5 by 5, pantry 4 by 3) do not overlap and lie inside the 16 by 12 footprint, all four rooms are reachable from `gallery` through the unlocked interior doors, and the manifest is `stage` structure; the CLI `check:buildings --only freshnote --stage structure` exits 0.
- Manifest data (exact; building-local x and z, origin at the footprint centre): `footprint { w: 16, d: 12 }`; rooms `gallery` `[-8, 0, 0, 6]` (8 by 6, `woodPlanks`), `design-room` `[-8, -6, 1, 0]` (9 by 6, `woodPlanks`), `meeting-room` `[0, 1, 5, 6]` (5 by 5, `carpet`), `pantry` `[1, -6, 5, -3]` (4 by 3, `floorTile`). LEFTOVER RULE (decision): the four rectangles cover 139 of the 192 m2 and do not overlap; they do not tile; the leftover 53 m2 is solid service void (thick walls, no room, no door, no window). `floors` `[{ level: 0, y: 0, height: 3.8 }]`; the five doors and twelve windows exactly as given above; `roomMin` `{ "gallery": 14, "design-room": 12, "meeting-room": 14, "pantry": 12 }`. `interactables` written in this step: `mood-board` `{ kind: "read", room: "design-room", x: -5.0, y: 1.5, z: -3.6, dialogueKey: "main", prompt: "visit studio" }` (the large board stands on the north wall of the design room at (-5.0, 1.5, -5.85), front toward +z, read point 2.25 m in front of it). Everything else in the interior step.
- Doors: `main` is the only unlocked exterior door that is not decorative; `pantry-back` is exterior and `locked: true`. Stairs and lifts: `none`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/freshnote.test.js`
- `node scripts/check-buildings.mjs --only freshnote --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/freshnote/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/freshnote/build.js` exports `decorateFreshnote(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): all positions building-local (south wall at z 6, +z outward), everything via `instance.addDetail`: (a) the lit signboard `signboard({ key: "zone-freshnote", w: 3.2, h: 0.8, style: "board" })` above the main door at x -4.0, y 3.1, z 6 (declared signage 1; its English text is the zone name "Design Studio", the frozen 025 value; the Tamil "ஃபிரெஷ்நோட்" is a draft); a second signage `signboard({ key: "open", w: 0.8, h: 0.3, style: "plaque" })` right of the main door at x -2.6, y 1.55, z 6 (declared signage 2, existing key `open`); its light is in group `freshnote:sign`, `auto: "dusk"`; (b) the extras (`detailClass: "extra"`, never declared): `greenWall({ boxes: 40 })` x1 on the west wall of the gallery (x -8, z 0.5 to 5.5): 40 small planter boxes `planter-box-1` to `planter-box-40` in 4 rows of 10 (0.4 by 0.25 by 0.25 m each, merged into at most 8 meshes), `detailKind: "green-wall"`, one box collider per row; `awning({ w: 2.4, d: 0.9 })` x1 over the main door at (-4.0, 2.9, 6.45), a small sloped canvas roof, `detailKind: "awning"`, no collider; `sandwichBoard()` x1 at (-4.0, 6.6, 0), `detailKind: "sandwich-board"`; `cycle-parked` (the plan 039 exported builder) x3 at (4.0, 6.9), (4.8, 6.9) and (5.6, 6.9), facing the front wall; (c) the pastel accent and white frames of the windows come from the generic kit. No curtain fills: the interior is enterable (this overrides the generic sentence of the exterior step). The 40 boxes are NOT `planter` class: the planter count of the manifest (8) is the decorator count of pots only.
- Signage from `src/content/signage.js`: add the keys `zone-freshnote` (the existing plan 025 key; its English is the zone name "Design Studio", no second key `freshnote` is added; the Tamil ஃபிரெஷ்நோட் is a draft for the person to check), `open` (existing key); the keys are digit-free (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/freshnoteExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- `src/world/buildings/freshnote/build.js` exports `decorateFreshnote(instance, ctx)` and the builders `greenWall`, `awning` and `sandwichBoard` (each returns an Object3D whose root `userData` has `detailClass: "extra"`, `detailKind` and, when solid, `colliders` in the plan 025 form; at most 8 meshes each; materials from `getMaterial` only; deterministic). `cycle-parked` (plan 039) is reused through its exported builder.
- `src/world/buildings/registry.js` (read first): `import { decorateFreshnote } from "./freshnote/build.js"` and `DECORATORS.freshnote = { decorate: decorateFreshnote, skipGeneric: ["signage", "planter", "bin", "lamp"] }`. `tests/unit/buildings/freshnoteExterior.test.js` (headless build with `getDecorator("freshnote")`) asserts the decorator is defined with those four names; `countDetails` gives window 12, door 2, signage 2, drainpipe 4, planter 8, bin 2, lamp 5 and the extras `green-wall` 1 (with 40 `planter-box-*` parts), `awning` 1, `sandwich-board` 1, `cycle-parked` 3; the two signs record `{ en: "Design Studio", ta: "ஃபிரெஷ்நோட்" }` and `{ en: "Open", ta: "திறந்திருக்கிறது" }`; every lamp registers a light in group `freshnote:exterior`.
- Area: `src/world/areas/freshnoteArea.js` exports `createFreshnoteArea(game, deps = {})` returning `{ id: "freshnote", priority: 30, loadRadius: 120, unloadRadius: 170, interior: true, load, unload }`; registered by ONE line `registerLandmarkArea(createFreshnoteArea)` in `src/world/areas/index.js` (plan 040). `tests/unit/buildings/freshnoteArea.test.js` (fake deps) asserts those fields, preload before build, nothing left after `unload`, and that `freshnote` appears once in `createAllAreas`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/freshnoteExterior.test.js`
- `node scripts/check-buildings.mjs --only freshnote --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/freshnote/build.js`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "freshnote"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/freshnote/build.js "decorateFreshnote"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/freshnote/build.js "green-wall"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/freshnote/build.js "awning"`
- `node "{{runner}}/assert.mjs" has src/content/signage.js "zone-freshnote"`
- `node "{{runner}}/assert.mjs" has tests/unit/buildings/freshnoteExterior.test.js "getDecorator"`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- New props first (category `design`, file `src/world/props/sets/design.js`, same quality bar and metadata rules as plans 019 and 022): `drawing-table`, `easel`, `color-swatch-wall`, `mood-board`, `drawing-tablet`, `sample-books`, `paper-roll-stand`, `display-stand`. Table `[w, h, d]`, solid, mount, seats, topY (the test asserts exactly this, plan 041 and 042 style; origin at the footprint centre, front toward +z): `drawing-table` [1.4, 0.8, 0.9] solid, topY 0.8 (parts `top`, `leg-1` to `leg-4`, `drawer`); `easel` [0.7, 1.7, 0.6] not solid, topY 1.7 (`frame`, `board`, `tray`, `leg-1` to `leg-3`), height 1.5 to 1.9 m; `color-swatch-wall` [1.6, 2.0, 0.1] not solid, mount `wall` (24 tiles `swatch-1` to `swatch-24`); `mood-board` has TWO variants: `small` [1.2, 1.0, 0.06] and `large` [2.4, 1.6, 0.06], both mount `wall` with a pinned-notes layout of 12 note quads `detail-note-1` to `detail-note-12` in pastel colours (the parts are counted by these mesh names; this sentence and the frozen design.test.js both state it) and one text slot each; the `large` variant (the design-room project board) has the largest text slot in the building (2.0 by 0.5 m against 0.9 by 0.4 m for `small`), so the frozen test is not a tie; `sample-books` [0.6, 0.25, 0.2] not solid (`book-1` to `book-6`); `paper-roll-stand` [0.5, 1.4, 0.5] solid, topY 1.4 (`stand`, `roll`, `tray`); `display-stand` [0.8, 1.5, 0.5] solid, topY 1.5 (`base`, `post`, `panel`, `shelf-1`, `shelf-2`); `drawing-tablet` [0.45, 0.04, 0.3] not solid, topY 0.04 (`pad`, `stylus`); `book-row` is a placement option of `shelf-wall` (its parts), NOT a separate type. Register them in `src/world/props/index.js` and add `tests/unit/props/design.test.js` (exact list, sizes within 20 percent of the bounding box, categories, both mood-board variants have 12 `detail-note-*` parts, the large variant has the largest text slot in the set, easel height 1.5 to 1.9 m, drawing-tablet and sample-books not solid, paper-roll-stand and display-stand solid with the sizes of the table, color-swatch-wall has 24 `swatch-*` parts and mount wall).
- Room `gallery` (floor material `woodPlanks`): `display-stand` x4, `mood-board` x3, `picture-frame-set` x6, `sample-books` x2, `bench-wood` x2, `plant-potted-large` x3, `lamp-floor` x3, `rug-round`, `sign-board` (the interior sign uses the same key `zone-freshnote`, no second key: the English is "Design Studio"), `wall-clock`, `notice-board`, `table-side` x2, `flower-vase` x2, `fan-ceiling` x2, `lamp-pendant` x4, `mirror-wall`, `shelf-wall` x3 with `book-row`, `doormat`. Lights: pendants group `freshnote:gallery` auto dusk.
- Room `design-room` (floor material `woodPlanks`): `drawing-table` x4, `easel` x3, `drawing-tablet` x3, `color-swatch-wall`, `mood-board` (the project board, a large one), `paper-roll-stand`, `chair-office` x4, `stool` x4, `monitor-dual` x2, `laptop` x2, `keyboard-mouse` x3, `desk-lamp` x4, `cabinet-low` x2, `shelf-wall` x2, `plant-office` x3, `whiteboard-rolling`, `bean-bag` x2, `fan-ceiling` x2, `ac-split`, `wall-tv-large`, `trash-bin-small`, `rug-rect`. Lights: bright panels group `freshnote:design`.
- Room `meeting-room` (floor material `carpet`): `table-dining-6` as the meeting table, `chair-conference` x6, `wall-tv-large`, `whiteboard`, `plant-office` x2, `cabinet-low`, `coffee-machine`, `lamp-pendant`, `curtain-pair` x2, `wall-clock`, `picture-frame-set`, `ac-split`, `flower-vase`, `rug-rect` (14 types; the meeting room has exactly 12 without the last two, so zero margin is not allowed). Lights: group `freshnote:meeting`: pendant `meeting-1` (x 2.5, y 3.0, z 3.5, colour `#ffe2b0`, intensity 8, distance 6, `auto: "dusk"`) and tube `meeting-2` (x 2.5, y 3.7, z 5.0, colour `#f4f8ff`, intensity 10, distance 7).
- Room `pantry` (floor material `floorTile`): `counter-kitchen-straight`, `sink-double`, `fridge`, `microwave`, `kettle-tray`, `tea-glass-set`, `plate-set`, `stool-bar` x3, `table-bar`, `shelf-utensils`, `water-filter`, `trash-bin-small`, `plant-potted-small`, `tube-light`. Lights: group `freshnote:pantry`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. Distinct types per room: gallery at least 14, design-room at least 14, meeting-room 14 and pantry 14 (the rooms rule of 12 holds for all four).
- Interactables: mood-board (`read`, the object is the large mood board in the design room); light switches per room; seats the stools, office chairs and bean bags.
- Interactables (manifest, building-local, y 1.3 unless stated): switches `sw-gallery` (room gallery, x -2.4, z 5.85, group `freshnote:gallery`), `sw-design` (design-room, x -2.5, z -0.3, group `freshnote:design`), `sw-meeting` (meeting-room, x 0.4, z 1.3, group `freshnote:meeting`), `sw-pantry` (pantry, x 1.4, z -3.4, group `freshnote:pantry`). Seats (kind `sit`, `object` = the prop type): `sit-stool` (design-room, `stool`, 4), `sit-office` (design-room, `chair-office`, 4), `sit-bean` (design-room, `bean-bag`, 2), `sit-meeting` (meeting-room, `chair-conference`, 6).
- Lights (`auto: "dusk"` unless stated, each light named): group `freshnote:gallery` pendants `gallery-1` to `gallery-4` at (-6.0, 3.2, 2.0), (-2.0, 3.2, 2.0), (-6.0, 3.2, 4.5) and (-2.0, 3.2, 4.5), colour `#ffe9c4`, intensity 10, distance 7; group `freshnote:design` panels `design-1` to `design-4` at (-6.0, 3.6, -4.5), (-2.5, 3.6, -4.5), (-6.0, 3.6, -1.5) and (-2.5, 3.6, -1.5), colour `#fbfdff`, intensity 18, distance 9; group `freshnote:meeting` (the two lights of the room list); group `freshnote:pantry` `pantry-1` at (3.0, 3.6, -4.5), colour `#f4f8ff`, intensity 12, distance 6.
- Placements: the large `mood-board` (read) and the two small `mood-board` variants in the gallery; `display-stand` x4, `picture-frame-set` x6 and `sample-books` x2 with `place` values; `shelf-wall` x3 with `book-row` parts (`book-row` is an option of `shelf-wall`, not a separate type); `whiteboard-rolling` with one text slot (type `board`) carrying the sketch words; about 100 object entries: gallery about 30, design-room about 35, meeting-room 14, pantry 14; floor items with explicit coordinates, items on tables and shelves with `place` values; floor materials as in the structure step.
- At the end of this step set top-level `"stage": "full"` in `src/world/buildings/freshnote/manifest.json`.
- `tests/unit/buildings/freshnoteInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the `large` mood board in the design room has the largest text slot in the building (the `small` boards are smaller, so there is no tie) and its read point is reachable; the room has the 22 types listed; the meeting room has 14 types.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/freshnoteInterior.test.js tests/unit/props/design.test.js tests/unit/props/allProps.test.js`
- `node scripts/check-buildings.mjs --only freshnote`
- `node "{{runner}}/assert.mjs" has src/world/buildings/freshnote/manifest.json "sw-gallery"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/freshnote/manifest.json "mood-board"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/freshnote/manifest.json "sit-stool"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/freshnote/manifest.json stage full`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- Remove the v1 freshnote: in `src/world/buildings.js` delete the factory `buildFreshnoteStudio` and its table entry, and any helper only it used (grep first); in `src/world/buildingAnims.js` and `src/world/collision.js` delete only the freshnote entries (list the lines in the report). `src/content/dialogues.js`: the freshnote title becomes `titleBar("Design Studio -", ...)` with the accent part unchanged. `src/world/zones.js`: `freshnote` becomes `name: "Design Studio"`, `prompt: "visit studio"`, `mode: "object"`. `src/ui/minimap.js`: the label for the zone becomes the zone name, the colour stays. README zone row becomes Design Studio (README.md is in the allowed paths). `tests/unit/world/zones.test.js` asserts mode object: E away from the mood board does NOT open the dialogue, E at its read point does.
- Spots (append; ids `freshnote-outside` and `freshnote-inside` with the same numbers in `src/budgets.json` and `src/shots.json`, no third spot): with the `freshnote` anchor at world (ax, az) and rotation 0: `freshnote-outside` { x ax, y 1.8, z az+12.5, yaw 0, pitch 0.08 } (the green wall and the signboard in view); `freshnote-inside` { x ax-4.0, y 1.6, z az+0.8, yaw 0.524, pitch -0.08 } (the gallery toward the design room and the large board). If the anchor rotation is not 0, recompute both with the ARCHITECTURE 10.8 transform and yaw plus the anchor rotation.
- `src/world/zones.js`: `freshnote` becomes `name: "Design Studio"`, `prompt: "visit studio"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `freshnote` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `freshnote` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `freshnote` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the large mood board in the design room) so `E` opens the existing dialogue for `freshnote` (A5); the dialogue is the Freshnote project as in v1; the title text becomes exactly `Design Studio -` followed by the v1 accent part, unchanged.
- Add `freshnote` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/freshnote.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `freshnote` with `interiorVisible` true and empty `problems`; walk to the the large mood board in the design room and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[freshnote].mustInclude` and the display name; Escape closes; the e2e walks in only through the `main` door (teleport 6 m in front of it, `e` opens it, polled); the green wall is an `extra` and does not count toward `planter`; zero console errors; polled waits only; URL `/?only=freshnote&time=0.5&freeze=1&seed=1337`; zero console errors.
- Add budget spots `freshnote-outside` and `freshnote-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 052 --spots freshnote-outside,freshnote-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/freshnote.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only freshnote`
- `npx vitest run tests/unit/world/zones.test.js tests/unit/buildings/freshnoteArea.test.js tests/unit/content/zoneExpect.test.js`
- `node "{{runner}}/assert.mjs" json src/world/buildings/freshnote/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createFreshnoteArea"`
- `node "{{runner}}/assert.mjs" has src/world/buildings/registry.js "decorateFreshnote"`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "buildFreshnoteStudio"`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Design Studio"`
- `node "{{runner}}/assert.mjs" has README.md "Design Studio"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "freshnote-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "freshnote-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "freshnote-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "freshnote-inside"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/freshnote.test.js tests/unit/buildings/freshnoteExterior.test.js tests/unit/buildings/freshnoteInterior.test.js`
- `node scripts/check-buildings.mjs --only freshnote`
- `npx playwright test tests/e2e/freshnote.spec.js`
- `npm run check:budget`
- `npm run check:ledger`
- `npm run test`
- `npm run check:content`
- `npx vitest run tests/unit/buildings/freshnoteExterior.test.js tests/unit/buildings/freshnoteArea.test.js tests/unit/props/design.test.js`

Human check (goes in the report, never blocks): Does the studio feel like a real design studio? Also check the Tamil of the signs (ஃபிரெஷ்நோட் and திறந்திருக்கிறது are drafts).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
