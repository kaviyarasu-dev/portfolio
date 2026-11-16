# Plan 048: Security gatehouse and control office (zone gateway)

Epic E4. Estimated turns: 60.

## Goal

Build the GravityAuth gatehouse: a compound entrance with a boom barrier across the road, a guard booth, a visitor lobby with a turnstile, a control office with a CCTV wall and a small server closet, plus a stretch of boundary wall with a sliding gate. The control-office monitor wall opens the auth project dialogue. Layout in one line (building-local metres, origin at the footprint centre, +z = front/south, N = -z; footprint 14 by 10: x -7 to 7, z -5 to 5; the anchor of `gateway` in town.json from plan 032 gives the world origin): control office x -7 to -1, z 0 to 5 (6 by 5, south-west); visitor lobby x -1 to 5, z 0 to 5 (6 by 5, south, the main room with the main door in the south wall); gate booth x 3 to 7, z -3 to 0 (4 by 3, north-east, on the road side); server closet x -7 to -4, z -3 to 0 (3 by 3, north-west, reached only through the control office). The rest of the footprint is solid plaster, not a room. The road runs along x 9 to 13 (the road edge at x 9); the barrier stands at the road edge. Every coordinate below is a target: `checkBuilding` is the judge; when the placer reports a collision, nudge by at most 0.4 m inside the same room and list it under `different_from_plan`.

This is a Rich-bar landmark: 3 to 6 rooms, at least 40 distinct object types, an enterable door, all seven exterior detail classes, and every room reachable (`npm run check:buildings -- --only gateway`).

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

### Step 1: Structure manifest for the Security Gatehouse

Deliver:
- Create `src/world/buildings/gateway/manifest.json` (schema of `docs/building-manifest.md`): `id: "gateway"`, `displayName: "Security Gatehouse"`, `prompt: "cross gateway"`, footprint taken from the `gateway` anchor in `src/world/layout/town.json` (about 14 by 10 m (footprint 14 by 10 at the `gateway` anchor of town.json, plan 032)), floors one floor (level 0, y 0, height 3.6), style: plaster wall tint `#cfd6d9`, `flat` roof with a projecting canopy, trim `metalPainted` (yellow-black safety stripes on the barrier).
- Rooms (ids fixed): `visitor-lobby` (bounds `[-1, 0, 5, 5]`, visitor lobby, 6 by 5 m, the MAIN ROOM (the room of the main door); its main door is in the south wall at x 1; the turnstile-side door is in the west wall at z 2.5; the booth door is in the north wall at x 4); `gate-booth` (bounds `[3, -3, 7, 0]`, guard booth with a window onto the road, 4 by 3 m; its door to the road side is the window-door in the east wall at z -0.6; its door to the lobby is in the south wall (z 0) at x 4); `control-office` (bounds `[-7, 0, -1, 5]`, control office, 6 by 5 m; its north wall (z 0) at x -7 to -4 is shared with the server closet (locked door at x -5.5); the CCTV monitor wall is on the north wall at x -2); `server-closet` (bounds `[-7, -3, -4, 0]`, server closet, 3 by 3 m; its only door is the locked door in the south wall (z 0) at x -5.5). Room count between 3 and 6.
- Doors: five doors (`at` is the offset in metres along the wall from the wall centre, ARCHITECTURE 10.8; the wall letter is relative to the building anchor rotation): `main` from `outside` to `visitor-lobby`, wall S (z 5), at 1 (x 1), width 1.6, height 2.4, kind `exterior`, unlocked; `lobby-control` (the turnstile-side door) from `visitor-lobby` to `control-office`, wall W of the lobby (x -1), at 2.5 (z 2.5), width 1.0, height 2.2, kind `interior`, unlocked; `lobby-booth` from `visitor-lobby` to `gate-booth`, wall N of the lobby (z 0), at 4 (x 4), width 1.2, height 2.2, kind `interior`, unlocked; `booth-road` (the window-door to the road side) from `gate-booth` to `outside`, wall E (x 7), at -0.6 (z -0.6), width 1.0, height 2.2, kind `exterior`, unlocked; `control-closet` from `control-office` to `server-closet`, wall N of the control office (z 0), at -5.5 (x -5.5), width 1.0, height 2.2, kind `interior`, `locked: true`. Every room is reachable from the main door with all doors opened; the closet is also reachable only through its locked door.. At least one unlocked exterior door that is not decorative. Windows: seven windows (at least 6): `w-1` lobby S wall at 3.5 (x), width 1.2; `w-2` control-office S wall at -4.0 (x), width 1.2; `w-3` control-office S wall at -2.0 (x), width 1.2; `w-4` control-office W wall at 2.5 (z), width 1.2; `w-5` server-closet W wall at -1.5 (z), width 1.0; `w-6` gate-booth N wall at 5.0 (x), width 2.0 (the wide booth window, sill 0.9); `w-7` gate-booth E wall at -2.4 (z), width 1.0; all sill 0.9 and height 1.5. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 7, door 2, signage 2, drainpipe 2, planter 2, bin 2, lamp 6; plus the exterior extras of the exterior step (the barrier, the boundary wall and gate leaf, the CCTV poles, the canopy, bollards, the kerb stripes). `interactables`: declare only `control-monitors` now (kind `read`, room `control-office`, `dialogueKey` `main`, prompt "cross gateway").
- `tests/unit/buildings/gateway.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the server closet door is `locked: true` and the closet is reachable only through it; the checker opens ALL non-decorative doors including locked ones (plan 024) and emits an INFO `locked-only` line for the closet, which the test asserts (it does not claim that the checker excludes the closet); the visitor lobby, gate booth and control office are reachable from the main door with all doors opened; the main door is not locked; the wide booth window `w-6` is on the wall north of the booth; exactly seven windows; floor height 3.6; the CLI `check:buildings --only gateway --stage structure` exits 0.
- Manifest data (exact; all x, z building-local): `footprint { w: 14, d: 10 }`; rooms `visitor-lobby` `[-1, 0, 5, 5]`, `gate-booth` `[3, -3, 7, 0]`, `control-office` `[-7, 0, -1, 5]`, `server-closet` `[-7, -3, -4, 0]` (floor 0; floorMaterial `floorTile`, `concrete`, `carpet`, `floorTileDark`); the doors and windows exactly as above; top-level `roomMin` `{ "server-closet": 8 }` (ARCHITECTURE 10.8 placement addenda: the closet has 8 distinct types, the default is 12); `"stage": "structure"`.
- Interactables: `control-monitors` `{ kind: "read", room: "control-office", x: -2.0, y: 1.6, z: 2.2, dialogueKey: "main", prompt: "cross gateway" }` (in front of the monitor wall); `gate-barrier` is NOT a manifest door (ARCHITECTURE 10.8 ignores manifest door interactables), see the exterior step.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/gateway.test.js`
- `node scripts/check-buildings.mjs --only gateway --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/gateway/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/gateway/build.js` exports `decorateGateway(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): the exterior is built by `src/world/buildings/gateway/build.js` `decorateGateway(instance, ctx)` (all via `instance.addDetail`) with the kit `src/world/kit/exterior.js` and the barrier of the extension above. Signs: `signboard({ key: "security", w: 3.6, h: 0.9, style: "board" })` lit, on the canopy fascia (declared signage 1), and `signboard({ key: "visitors", w: 2.0, h: 0.6, style: "plaque" })` on the south wall beside the main door at (3.6, 2.6, 5.05) (declared signage 2); both register their lights in group `gateway:sign`, `auto: "dusk"`. The generic placer builds windows 7, doors 2, drainpipes 2, planters 2 at (-1.6, 5.6) and (5.9, -4.1), bins 2 at (-0.6, 5.7) and (6.9, -1.6), and lamps 6 (wall lamps beside the main door, the booth window and the closet, group `gateway:exterior`, `auto: "dusk"`). Mesh budget: `exterior-details` at most 14 meshes; the barrier, the boundary wall, the gate leaf, the CCTV poles and the kerb stripes go to a separate group `gateway-extras` (at most 30 meshes). Colour: plaster wall tint `#cfd6d9`; the barrier boom has yellow-black stripes (`metalPainted` tinted #f2c12e and #111111, 0.5 m bands).
- Signage from `src/content/signage.js`: add the keys `security` (SECURITY / பாதுகாப்பு) for the canopy sign and `visitors` (VISITORS / பார்வையாளர்கள்) for the lobby sign and plaque; digit-free keys; the Tamil words are a draft for the human check (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/gatewayExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.
- Registry: `src/world/buildings/registry.js` gets `import { decorateGateway } from "./gateway/build.js"` and `DECORATORS.gateway = { decorate: decorateGateway, skipGeneric: ["signage", "planter", "bin", "lamp"] }`; a unit test asserts `getDecorator("gateway")` returns that entry (plan 043 pattern).
- Area: `src/world/areas/gatewayArea.js` exports `createGatewayArea`, registered with one line through the plan 040 `registerLandmarkArea(factory)` in `src/world/areas/index.js` (priority 30, loadRadius 120, unloadRadius 170, interior true); a unit test asserts those values. The factory awaits `preloadBuildingProps(manifest, ctx)` before `buildBuilding`, and the area also registers the barrier door (below).
- Barrier door (plan 017 API, hand-registered because manifest door interactables are ignored): in the gateway area factory, `createDoor({ id: "gate-barrier", hinge, yaw, width, height, openAngle, leaf, world, registry, events, list })` from `src/systems/interaction/doors.js` (plan 017). `leaf` is the boom pivot object of the `barrier-gate` prop (plan 042), whose origin is the hinge at the housing top (local (8.4, 1.0, -1.2) in the building frame, converted to world with the anchor transform). The boom swings with `root.userData.swingTarget` (plan 042: 0 rest, 1 up) and `openAngle` 1.396 rad (80 degrees). Width of the opening: 4.0 m along the boom. Colliders: the housing as one box 0.8 by 0.8 from y 0 to 1.1, and the boom at rest as one box 4.0 by 0.1 by 0.1 at y 1.0 (both in `colliders` metadata, ids `gateway:barrier-*`). Passable width beside the barrier: a 1.2 m walkway at z -2.6 to -1.4 (no collider), tested with `moveCircle` and `blockedAt` (plan 016) for a radius 0.35 player.
- Exterior extras (new builders in `src/world/kit/exterior.js`, `detailClass` `extra`): `boundaryWall({ length: 20, height: 2.4, pillarEvery: 4 })` (a plaster wall with `metalPainted` pillars every 4 m, colliders per pillar; the frontage runs along x 9.5 from z -12 to 8, with the sliding gate opening at z -2 to 4); `slidingGate({ width: 6, height: 2.2 })` (a decorative leaf on a rail at the opening, open, no collider); `kerbStripes({ length: 3.0 })` (painted yellow-black boxes on the kerb, no collider); `bollard()` x4 (reused from plan 047) at (8.8, -4.0), (8.8, 2.0), (8.8, 6.0) and (6.0, 6.8); `cctvPole({ height: 4.5 })` x2 (a pole with a camera head, collider box 0.3 by 0.3) at (9.8, -4.5) and (2.5, 7.8); `canopy({ w: 4.0, d: 1.6, height: 3.0 })` (reused from plan 047) over the booth window at (5.0, -3.2) on the north side. The `barrier-gate` prop (plan 042) sits at the housing (8.4, -1.2) on the road side, outside the footprint (x greater than 7).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/gatewayExterior.test.js`
- `node scripts/check-buildings.mjs --only gateway --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/gateway/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `visitor-lobby` (floor material `floorTile`): (all `x, z, rot`; wall items have `y` 0 and are modelled at their mounting height) `security-desk` at (2.2, 1.6, 0); `turnstile` x2 at (0.2, 2.0, 1.5708) and (0.2, 4.0, 1.5708) (the walkable gap between them is z 2.25 to 3.75, in line with the west door); `bench-wood` at (2.8, 4.5, 3.1416) and (2.8, 2.8, 3.1416); `chair-waiting` at (4.0, 2.4, 0); `sign-board` at (2.2, 0.0, 0) with `text: "visitors"` (VISITORS / பார்வையாளர்கள்); `key-cabinet` at (-0.5, 0.0, 0); `notice-board` x2 on the east wall at (5.0, 0.8, -1.5708) and (5.0, 4.2, -1.5708); `wall-clock` on the west wall at (-1.0, 4.0, 1.5708); `fan-ceiling` x2 with `place: "ceiling"` at (1.0, 1.5) and (4.0, 4.0); `plant-potted-small` x2 at (-0.6, 4.4, 0) and (4.6, 4.4, 0); `water-dispenser` at (4.9, 3.2, -1.5708); `trash-bin-small` at (4.4, 4.6, 0); `fire-extinguisher` at (0.6, 4.8, 0); `exit-sign` at (1.0, 4.99, 3.1416) (over the main door); `table-side` at (3.8, 3.4, 0); `magazine-rack` at (0.8, 0.6, 0); `picture-frame-set` on the west wall at (-1.0, 1.2, 1.5708); `tube-light` x3 with `place: "ceiling"` at (0.0, 2.8), (2.5, 2.8) and (4.5, 2.8); `doormat` at (1.0, 4.7, 0). About 18 distinct types (rule: at least 12; the main room needs 14). Lights: group `gateway:lobby`: `lob-1` (0.0, 2.8, 1.5), `lob-2` (3.0, 2.8, 1.5), `lob-3` (3.0, 2.8, 4.0), `lob-4` (0.0, 2.8, 4.0), colour `#e8f0ff`, intensity 14, distance 9, `auto: "dusk"`; switch `sw-lobby` at (1.8, 1.3, 4.85) inside the main door.
- Room `gate-booth` (floor material `concrete`): (all `x, z, rot`) `guard-stool` x2 at (4.4, -1.6, 1.5708) and (5.8, -1.6, -1.5708); `cctv-bank` at (6.4, -2.6, -1.5708) (east wall, beside the window); `key-cabinet` at (3.1, -2.6, 1.5708) (west wall); `table-side` at (4.6, -0.7, 0); `kettle-tray` at (5.8, -0.7, 0); `coffee-machine` at (5.0, -2.6, 0); `fan-pedestal` at (4.0, -2.2, 0); `wall-clock` at (6.6, -2.99, 0) on the north wall beside the wide window; `tube-light` at (5.0, -1.5) with `place: "ceiling"`; `locker-bank` at (3.1, -0.4, 1.5708); `chair-wooden` at (5.2, -2.0, 0); `phone-desk` at (4.9, -0.2, 0); `notice-board` at (3.8, -2.99, 0) on the north wall; `fire-extinguisher` at (6.4, -0.6, 0) by the door. About 13 distinct types (rule: at least 12). Lights: group `gateway:booth`: `bth-1` (5.0, 2.6, -1.5), colour `#fff1d0`, intensity 10, distance 6, `auto: "dusk"`; switch `sw-booth` at (3.2, 1.3, -1.0).
- Room `control-office` (floor material `carpet`): (all `x, z, rot`) `cctv-bank` x2 on the west and south walls at (-6.6, 1.0, 1.5708) and (-3.0, 4.6, 3.1416); `monitor-wall` at (-2.0, 0.01, 0) on the north wall (the CCTV wall above the control desks; its screen is the read point); `desk-office` x2 at (-5.4, 2.2, 0) and (-2.4, 2.2, 0); `chair-office` x3 at (-5.4, 3.2, 3.1416), (-2.4, 3.2, 3.1416) and (-3.9, 4.0, 3.1416) (sitters face north toward the desks); `monitor-dual` x2 with `place: "on:desk-office"` (one on each desk); `keyboard-mouse` x2 with `place: "on:desk-office"`; `desk-lamp` with `place: "on:desk-office"` on the first desk; `server-rack` at (-6.6, 3.8, 1.5708) (west wall, a rack of the control room, not the closet); `whiteboard-rolling` at (-1.6, 3.6, 0); `water-dispenser` at (-6.4, 4.6, 0); `wall-clock` at (-4.2, 0.01, 0); `filing-cabinet` at (-4.6, 4.8, 0); `plant-office` at (-1.4, 4.6, 0); `ceiling-panel-light` x4 with `place: "ceiling"` at (-6.0, 2.5), (-3.0, 2.5), (-6.0, 4.0) and (-3.0, 4.0); `exit-sign` at (-4.0, 4.99, 3.1416); `ac-split` at (-1.0, 4.4, -1.5708). About 16 distinct types (rule: at least 12). Lights: panels group `gateway:control`: `ctl-1` (-5.0, 2.6, 2.5), `ctl-2` (-2.5, 2.6, 2.5), colour `#dfeaff`, intensity 14, distance 8, no `auto`.
- Room `server-closet` (floor material `floorTileDark`): (all `x, z, rot`) `server-rack` x3 at (-6.6, -2.8, 1.5708), (-6.6, -1.6, 1.5708) and (-6.6, -0.4, 1.5708); `network-box` x2 at (-4.6, -2.6, 0) and (-4.6, -1.2, 0); `ac-split` at (-4.2, -2.99, 0) on the north wall; `fire-extinguisher` at (-4.4, -0.4, 0); `exit-sign` on the north wall at (-5.5, -2.99, 0); `tube-light` with `place: "ceiling"` at (-5.5, -1.5); `locker-bank` at (-4.1, -1.5, -1.5708); `table-folding` at (-5.0, -1.0, 0). 8 distinct types (the closet keeps its own minimum of 8 through the manifest `roomMin`). Lights: one tube light group `gateway:closet`: `clo-1` (-5.5, 3.0, -1.5), colour `#f4f8ff`, intensity 10, distance 5, no `auto`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: control-monitors (`read`, the object is the large monitor wall above the control desks (the CCTV wall at (-2.0, 0.01, 0) on the north wall)); light switches per room; seats the lobby benches (`sit-bench-1`, `sit-bench-2` on `bench-wood`), the booth guard stools (`sit-stool-1`, `sit-stool-2`) and the control chairs (`sit-control-1` to `sit-control-3`).
- Switches: `sw-lobby` (in the lobby), `sw-booth` (in the booth). The turnstile pair is solid (colliders from plan 042); the walk graph passes through the gap.
- Server closet: its 8 distinct types are the `roomMin` of the manifest, so the 12-type rule is replaced for this room only. The `checkBuilding` run uses the manifest `roomMin`; the INFO `locked-only` line for the closet is expected and asserted.
- `tests/unit/buildings/gatewayInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the main room is visitor-lobby with at least 14 distinct types; the CCTV monitor screens exist as screen slots on `monitor-wall`; the lobby turnstile leaves a walkable gap of 1.5 m (z 2.25 to 3.75) on the way from the main door to the west door; the barrier passable width test of the extension.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/gatewayInterior.test.js`
- `node scripts/check-buildings.mjs --only gateway`

### Step 4: Convert the zone, stream it, Playwright, budgets and shots

Deliver:
- `src/world/zones.js`: `gateway` becomes `name: "Security Gatehouse"`, `prompt: "cross gateway"`, `mode: "object"` (ARCHITECTURE 10.7, A30). Update the gateway dialogue title in `src/content/dialogues.js` to the display name `Security Gatehouse` (facts unchanged). The manifest `stage` is set to `full` (json assert below). Remove the v1 gateway factory from `src/world/buildings.js` with its collider and animation hooks; record the removed identifier in the report and check it with `none` in the verify list. The minimap label and the README zone table label: the README is in the plan `allowed` list (plan 043 pattern); the minimap label file is named in the report, or it becomes a human_check item if it is outside the allowed paths.
- The gateway area is registered through the plan 040 `registerLandmarkArea(createGatewayArea)` line in `src/world/areas/index.js` (structure step). The read interactable `control-monitors` opens the existing dialogue for `gateway` (A5). `tests/fixtures/zoneExpect.json` already has `gateway` (plan 043): no change.
- `tests/e2e/gateway.spec.js` (generated name, frozen) on `/?only=gateway&time=0.5&freeze=1&seed=1337`: teleport 6 m in front of the main door, `e` opens it, walk in with no loader; `listBuildings()` shows `gateway` with `interiorVisible` true and no problems; teleport to local (-3.6, 0.8), about 2.1 m from the control monitors (negative check: the zone is in mode `object`, so `e` there must not open the dialogue and `#dialogue` stays hidden), then teleport to the control monitor spot in front of the CCTV wall, press `e`, `#dialogue` is visible and contains every string of `zoneExpect.json` for gateway plus the display name, Escape closes; the barrier check of the e2e extra; zero console errors. Every wait is `expect.poll`.
- Budget and shot spots (ids of this plan only): `gateway-outside` (budget and shot) camera at local (0, 14), height 4.0, yaw 0, pitch 0.1; `gateway-inside` (budget and shot; the main room visitor-lobby) camera at local (2.8, 4.6), height 1.6, yaw 0.197, pitch 0 (it looks at the security desk); `gateway-barrier` (shot only) camera at local (14.0, 3.0), height 1.6, yaw 0.927, pitch 0 (it looks at the barrier housing (8.4, -1.2)). World = anchor (x, z read from town.json, ground y from town.json) plus local, with the rotation from town.json added to the yaw; the anchor values are written into both files. `has` checks on both files; `npm run check:budget` passes; run `npm run shots -- --plan 48 --spots gateway-outside,gateway-inside,gateway-barrier`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures and black rooms (best effort, list the fixes under `different_from_plan`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/gateway.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only gateway`
- `node "{{runner}}/assert.mjs" none src/world/buildings.js "gateway"`
- `node "{{runner}}/assert.mjs" has src/world/areas/index.js "createGatewayArea"`
- `node "{{runner}}/assert.mjs" json src/world/buildings/gateway/manifest.json stage full`
- `node "{{runner}}/assert.mjs" has src/content/dialogues.js "Security Gatehouse"`
- `node "{{runner}}/assert.mjs" has README.md "Security Gatehouse"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "gateway-outside"`
- `node "{{runner}}/assert.mjs" has src/budgets.json "gateway-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "gateway-outside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "gateway-inside"`
- `node "{{runner}}/assert.mjs" has src/shots.json "gateway-barrier"`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/buildings/gateway.test.js tests/unit/buildings/gatewayExterior.test.js tests/unit/buildings/gatewayInterior.test.js`
- `node scripts/check-buildings.mjs --only gateway`
- `npx playwright test tests/e2e/gateway.spec.js`
- `npm run check:budget`
- `npm run check:ledger`

Human check (goes in the report, never blocks): Judge the gatehouse and the barrier. The Tamil of the two keys (பாதுகாப்பு, பார்வையாளர்கள்) is a draft: review it.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
