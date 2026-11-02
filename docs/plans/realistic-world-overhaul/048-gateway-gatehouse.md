# Plan 048: Security gatehouse and control office (zone gateway)

Epic E4. Estimated turns: 55.

## Goal

Build the GravityAuth gatehouse: a compound entrance with a boom barrier, a guard booth, a visitor lobby with a turnstile, a control office with a CCTV wall and a small server closet, plus a stretch of boundary wall with a sliding gate. The control-office monitor wall opens the auth project dialogue.

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
- Create `src/world/buildings/gateway/manifest.json` (schema of `docs/building-manifest.md`): `id: "gateway"`, `displayName: "Security Gatehouse"`, `prompt: "cross gateway"`, footprint taken from the `gateway` anchor in `src/world/layout/town.json` (about 14 by 10 m), floors one floor (height 3.6), style: plaster wall tint `#cfd6d9`, `flat` roof with a projecting canopy, trim `metalPainted` (yellow-black safety stripes on the barrier).
- Rooms (ids fixed): `visitor-lobby` (visitor lobby, 6 by 5 m); `gate-booth` (guard booth with a window onto the road, 4 by 3 m); `control-office` (control office, 6 by 5 m); `server-closet` (server closet, 3 by 3 m). Room count between 3 and 6.
- Doors: main door south into `visitor-lobby` (width 1.6, exterior, unlocked), a window-door from `gate-booth` to the road side (exterior, unlocked), `visitor-lobby` to `control-office` via the turnstile-side door (interior, unlocked), `control-office` to `server-closet` (interior, `locked: true`), `visitor-lobby` to `gate-booth` (interior). At least one unlocked exterior door that is not decorative. Windows: at least 6 including a wide booth window. Stairs and lifts: none.
- `exteriorDetails` counts (all seven classes, window at least 4): window 6, door 2, signage 2, drainpipe 2, planter 2, bin 2, lamp 6; the barrier, boundary wall and sliding gate are extra exterior pieces. `interactables`: declare only `control-monitors` now (kind `read`, room `control-office`, `dialogueKey` `main`, prompt "cross gateway").
- `tests/unit/buildings/gateway.test.js` first: `checkBuilding(manifest, { stage: "structure" })` passes; the room ids above exist exactly; the exterior door is unlocked; the server closet is locked and not required for reachability of the other rooms (it is excluded by the checker only because it is locked: assert the checker treats it as a decorative-locked room and the manifest marks that door `locked`), the three other rooms are reachable; the CLI `check:buildings --only gateway --stage structure` exits 0.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/gateway.test.js`
- `node scripts/check-buildings.mjs --only gateway --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/gateway/manifest.json`

### Step 2: Exterior: shell look, details, signage

Deliver:
- `src/world/buildings/gateway/build.js` exports `decorateGateway(instance, ctx)` (the kit calls it through the decorate hook) using the shared exterior kit (`src/world/kit/exterior.js`): `barrier-gate` across the road with a striped boom (placed by the decorate hook outside the footprint), a boundary wall of 20 m each side with pillars and a sliding gate leaf (decorative, open), CCTV cameras on poles (`cctv-bank` is indoor: build `cctv-pole` in the exterior kit), a canopy over the booth, bollards, a lit sign "SECURITY / காவல்" (key `security`, Tamil `பாதுகாப்பு`), stripes painted on the kerbs.
- Signage from `src/content/signage.js`: add the keys `security`, `visitors` (English plus Tamil draft; see the vocabulary in plan 025; flag the Tamil for the person).
- Counts of built detail objects must reach the manifest counts (`checkDetails`). Windows get frames; buildings without visible interiors use curtain fills only if the interior is hidden.
- `tests/unit/buildings/gatewayExterior.test.js` first: detail counts per class at least the manifest counts, the sign materials record the English and Tamil strings, the exterior door clearance stays free, and the walk graph still reaches every room.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/gatewayExterior.test.js`
- `node scripts/check-buildings.mjs --only gateway --stage structure`
- `node "{{runner}}/assert.mjs" exists src/world/buildings/gateway/build.js`

### Step 3: Interior: rooms, objects, lights, interactables

Deliver:
- Room `visitor-lobby` (floor material `floorTile`): `security-desk`, `turnstile` x2, `bench-wood` x2, `chair-waiting`, `sign-board` ("VISITORS / பார்வையாளர்கள்": key `visitors`), `key-cabinet`, `notice-board` x2, `wall-clock`, `fan-ceiling` x2, `plant-potted-small` x2, `water-dispenser`, `trash-bin-small`, `fire-extinguisher`, `exit-sign`, `table-side`, `picture-frame-set`, `tube-light` x3, `doormat`. Lights: group `lobby`.
- Room `gate-booth` (floor material `concrete`): `security-desk`, `guard-stool` x2, `cctv-bank`, `key-cabinet`, `table-side`, `kettle-tray`, `fan-pedestal`, `wall-clock`, `tube-light`, `locker-bank`, `chair-wooden`, `phone-desk`, `notice-board`, `fire-extinguisher`. Lights: group `booth`.
- Room `control-office` (floor material `carpet`): `cctv-bank` x2, `monitor-wall`, `desk-office` x2, `chair-office` x3, `monitor-dual` x2, `keyboard-mouse` x2, `server-rack`, `whiteboard-rolling`, `ac-split`, `water-dispenser`, `wall-clock`, `desk-lamp`, `filing-cabinet`, `plant-office`, `ceiling-panel-light` x4, `exit-sign`. Lights: panels group `control`.
- Room `server-closet` (floor material `floorTileDark`): `server-rack` x3, `network-box` x2, `ac-split`, `fire-extinguisher`, `exit-sign`, `tube-light`, `locker-bank`, `table-folding`. Lights: one tube light group `closet`.
- Over all rooms at least 40 distinct object types (rooms rule: at least 12 distinct types per room, 14 in the main room); every type exists in the catalog. 
- Interactables: control-monitors (`read`, the object is the large monitor wall above the control desks); light switches per room; seats the lobby benches and the control chairs.
- `tests/unit/buildings/gatewayInterior.test.js` first: `checkBuilding` full stage passes; per-room distinct type counts; no placement problems; every room reachable with the unlocked doors open; the barrier has swing metadata and the player can pass beside it; the CCTV monitors have screen slots.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/gatewayInterior.test.js`
- `node scripts/check-buildings.mjs --only gateway`

### Step 4: Convert the zone, stream it, Playwright and shots

Deliver:
- `src/world/zones.js`: `gateway` becomes `name: "Security Gatehouse"`, `prompt: "cross gateway"`, `mode: "object"` (ARCHITECTURE.md 10.7, A30). Update the dialogue title text in `src/content/dialogues.js` for `gateway` to use the display name (keep the accent part and all facts unchanged) and the minimap and README zone table labels. Remove the v1 factory for `gateway` from `src/world/buildings.js` (and its collider and animation hooks).
- Register the building as a streamed area `gateway` (priority 30, `loadRadius` 120, `unloadRadius` 170, `interior: true`) in `src/world/areas/index.js`; register the `read` interactable (the large monitor wall above the control desks) so `E` opens the existing dialogue for `gateway` (A5); the dialogue is the GravityAuth project as in v1.
- Add `gateway` to `tests/fixtures/zoneExpect.json` ONLY if it is missing (plan 043 created all 14 entries).
- `tests/e2e/gateway.spec.js`: teleport 6 m in front of the main door (use the manifest door position and the anchor rotation), `e` opens it, walk in with no loading screen (the `#loader` stays hidden), `listBuildings()` shows `gateway` with `interiorVisible` true and empty `problems`; walk to the the large monitor wall above the control desks and press `e`: `#dialogue` is visible and contains every string of `zoneExpect.json[gateway].mustInclude` and the display name; Escape closes; the boom barrier is an interactable `door`-kind that swings up with `E` (reuse the door state machine with a pivot at the housing; `listDoors()` includes `gate-barrier`); zero console errors.
- Add budget spots `gateway-outside` and `gateway-inside` to `src/budgets.json` (inside = the main room) and shot spots to `src/shots.json`; `npm run check:budget` passes; run `npm run shots -- --plan 048 --spots gateway-outside,gateway-inside`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures, black rooms (best effort, list what you fixed).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/gateway.spec.js`
- `npm run check:budget`
- `node scripts/check-buildings.mjs --only gateway`

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

Human check (goes in the report, never blocks): Judge the gatehouse and barrier.

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
