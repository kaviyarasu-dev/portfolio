# Plan 068: Fast-travel map with keyboard and touch access

Epic E7. Estimated turns: 60.

## Goal

A full-screen map of the island (key `M`, and a map button visible on touch and desktop) listing the 14 landmarks as markers and as a keyboard-operable list. Choosing one teleports the player to that building with a short fade. The map is also the fast way around a 300 m island. Touch buttons for the rest arrive in plan 071. Shared key bindings (W A S D, Shift sprint, E interact, V camera, M map, O settings, N mute (plan 064), Shift+R text mode, Escape) agree with plans 067, 070 and 071. Decision (stated here and in plan 070): the guided tour does not block M; only dialogue, settings and text mode block M.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Accessibility, Touch) and D7(a) in _planning/requirements.md (fast-travel map half of D7))
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/ui/minimap.js (plan 013/040)
- src/ui/minimapData.js (plan 040)
- src/ui/hud.js (plan 011)
- src/ui/settings.js (plan 011)
- src/systems/input.js (plan 016)
- src/world/layout/town.json (plan 032)
- src/world/layout/geometry.js (plan 032, entrancePoint(rect))
- src/world/zones.js (plan 031)
- src/world/buildings/plaza/manifest.json (plan 024)
- src/dev/worldHook.js (plan 003)
- src/systems/collision (plan 016; the isBlocked(x, z, y, r) query that plan 058 defines)
- src/world/heightField (plan 033)
- tests/e2e/dialogues-all.spec.js (plan 057)
- `portfolio/index.html`

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Fast-travel points, the teleport API and the hook

Deliver:
- `tests/unit/map/entrance.test.js` first. `src/systems/teleport.js` exports `fastTravelPoint(zoneId, { entrance })`, returning `{ x, y, z, yaw }`. Name chosen to avoid plan 032 `entrancePoint(rect)` in `src/world/layout/geometry.js`: that function is REUSED for the rect front-centre, not redefined. Door choice: the zone first door with `kind === "exterior"` and `locked === false` (field names from plan 017); if none exists, the fallback is the front centre of the anchor (the face given by the anchor rotation), and the test records `usedFallback`, which must be false for all 14 zones, so the fallback fails the test. Point: 3.0 m outside the door along the outward wall normal, rotated with the anchor rotation; `y = heightField.heightAt(x, z)` (plan 033), never the anchor `y` (anchor y values 0, 16 or 6 are floor values, not ground). Yaw faces the door.
- Plaza has two points. The default (`teleport("plaza")`) is the lobby spawn from plan 031 (reception desk area). The map entry `{ id: "plaza", entrance: true }` uses the hotel door from `src/world/buildings/plaza/manifest.json` (plan 024). Before writing the e2e threshold, step 1 reads plan 031 plaza spawn values (the report lists spawn (-8.25, -6.7) and desk (-13.25, -6.7), 5 m apart) and asserts the hotel door point is at least 6 m from the lobby spawn, so the e2e 6 m check cannot pass on the wrong point.
- `teleportToZone(game, zoneId, opts)` in `src/systems/teleport.js` does, in order: (1) closes any open dialogue with the dialogue close function of plan 017; (2) stands up if seated, through the stand-up method of the `SitController` of plan 018; (3) clears lift state and resets to floor 0 of the target zone, through the lift API of plan 018; (4) sets the player position and yaw (`opts.yaw` or the fast travel yaw) and the camera yaw; (5) sets interior visibility for the target zone through the streaming API of plan 015. It never places the player on a blocked point. The fade is done by the caller (map, step 2), not here.
- Hook: `src/dev/worldHook.js` (plan 003) gets additions only (ARCH 10.8): `teleport(zoneId, { entrance, yaw })` (the existing `teleport(x, z, y)` form is unchanged; `zoneId` is a zone id from `src/world/zones.js`, never a spot id or a hotel or harbour alias). The options object is confirmed: with `entrance` falsy or absent a zone landing stays at the zone default point (plan 031), and the door point is used only when `entrance` is true, so frozen plan 017 and 031 landings do not move; `yaw` overrides the fast travel yaw. `fastTravelPoint(id, opts)` returns the point, and `isBlocked(x, z, y, r)` (the name plan 058 defines; plan 016 collision) is exposed unchanged, called with r = 0.35 by the tests. The hook is dev only and is stripped from prod builds.
- Tests (`tests/unit/map/entrance.test.js`, using the headless world helper that plan 016 exports for unit tests; read its export name in plan 016): for all 14 zones the point is outside the footprint, `isBlocked(x, z, y, 0.35)` is false, the point is within 4 m of the door and not inside another anchor rectangle, `usedFallback` is false; the yaw faces the door within 0.1 rad; for a test anchor rotated by 90 degrees the point rotates with it; `teleportToZone` clears the dialogue, seat and lift flags (each checked).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/map/entrance.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/teleport.js`
- `node "{{runner}}/assert.mjs" has src/dev/worldHook.js "fastTravelPoint"`

### Step 2: The map UI, HUD button, keys, fade and e2e

Deliver:
- DOM is static in `index.html` (ARCH 10.5 addition): `<section id="map" role="dialog" aria-modal="true" aria-label="Island map" hidden>` containing a `button#map-close` labelled "Close", a `canvas#map-canvas`, a `<span class="map-you">You are here</span>` label (a separate element that JS positions next to the player arrow), a `<div id="map-tip" role="tooltip" hidden>`, and a `<ul id="map-list">`. Markers: `<button class="map-marker" data-zone="{id}" aria-label="{name}" tabindex="-1">` absolutely placed over the canvas. Fade: `<div id="map-fade">` in `index.html`. CSS in the `index.html` style block; at widths below 720 px the list sits below the canvas (checked by e2e). `src/ui/map.js` exports `openMap()`, `closeMap()`, `toggleMap()`.
- Canvas: `buildMinimapLayers` (plan 040, `src/ui/minimapData.js`) supplies `origin`, `size` and `cell`; world-to-canvas uses them. Backing size is CSS size times `devicePixelRatio`; redraw on open and on resize. It draws land, sea, harbour, roads by class and the player arrow with direction. The non-blank check (e2e): sample a 100 by 100 grid with `getImageData`; more than 1 percent of samples differ from the sea colour.
- List: one `li` with a button per landmark, in the order of `ZONES` in `src/world/zones.js` (plan 031). The count is read from `ZONES` and must be 14 (the test fails otherwise). Roving tabindex: only the current item has tabindex 0. ArrowDown and ArrowUp move and wrap, Home and End jump, Enter travels. Focus on open goes to the current list item (the first on the first open). Markers are tabindex -1, so the list is the Tab stop (Close is also a Tab stop).
- Tooltip: on hover or focus of a marker or list item, `#map-tip` shows the zone name and the first sentence of the zone `prompt` field (plan 031). No new strings.
- Keys and priority: `M` toggles the map (`src/systems/input.js`, plan 016) and sets `game.mapOpen`. `Escape` closes the map. While a dialogue, settings (plan 011) or text mode (plan 067) is open, `M` does nothing. The guided tour (plan 070) does NOT block `M` (decided: the tour is not modal). Escape order: dialogue > settings > map > text mode > tour. The single Escape dispatcher is created by plan 067 in `src/systems/input.js`; this plan registers `closeMap` with it at priority map (no request to 011 is needed for this). Movement keys are ignored while `game.mapOpen` is true. Pointer lock is released when the map opens and re-acquired only when the user clicks the canvas (v1 click-to-lock rule); no auto-lock.
- Focus: `openMap()` stores `document.activeElement`; `closeMap()` returns focus to it if it is still connected, else to `#map-btn`.
- Travel: selecting a zone (marker click, list Enter, or list item click) closes the map and calls `teleport(zone.id, { entrance: zone.entrance })`. Fade: `#map-fade` goes to opacity 1 over 200 ms, the teleport happens at black, then opacity 0 over 200 ms (400 ms total). If `game.settings.reducedMotion` (plan 011) is true the fade is skipped and the teleport is immediate.
- HUD button: `src/ui/hud.js` (plan 011 owner) gets `<button id="map-btn" aria-label="Open map">` top-right, under the settings gear with an 8 px gap, minimum 44 px target, working by mouse and touch. This is the ONLY map button: its id is `#map-btn` and its label is "Open map" everywhere (plans 070 and 071 use the same id and label; the frozen map.spec clicks "Open map"). It sits outside `#touch-layer` (plan 071), so it is visible on desktop too.
- `tests/e2e/map.spec.js` (URL `/?time=0.5&freeze=1`, no `?only=`; `ZONES` imported from `src/world/zones.js`; `expect.poll` with a 15 s timeout after each teleport for area load): (a) press `m`: `#map` visible, role `dialog`, `aria-modal="true"`, label "Island map", `document.activeElement` inside `#map`; (b) exactly 14 `.map-marker` and 14 list buttons; Close button and "You are here" label exist; (c) hover shows `#map-tip` with the zone name; (d) the canvas non-blank rule passes; (e) for each zone: click its marker: the map closes, `playerState()` is within 6 m of the hook `fastTravelPoint(id, { entrance })`, and `isBlocked(x, z, y, 0.35)` is false (plaza is checked against the hotel door point); (f) `[aria-label="Open map"]` opens the map; (g) `Escape` closes; (h) while open, pressing `w` leaves `playerState()` unchanged; (i) keyboard only: open with `m` (focus lands on the current list item, the first one on the first open; no Tab), ArrowDown twice, Enter: the player is within 6 m of `ZONES[2]`; (j) `document.pointerLockElement` is null while open; (k) at 390 by 844 viewport `#map-list` top is at or below the canvas bottom; (l) with `page.emulateMedia({ reducedMotion: "reduce" })` the teleport happens with no fade element at opacity above 0; (m) `m` closes the map; (n) `[aria-label="Open map"]` is 8 px or less below the settings gear and at least 44 by 44 px; (o) zero console errors.
- Regressions: the teleport change can break frozen e2e tests of earlier plans. This plan re-runs `tests/e2e/dialogues-all.spec.js` (plan 057) and the plan 057 landmark close spec (`tests/e2e/all-landmarks-close.spec.js`, plan 057) and reports any fix needed there.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/map.spec.js`
- `node "{{runner}}/assert.mjs" exists src/ui/map.js`
- `node "{{runner}}/assert.mjs" has index.html "id="map""`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npm run test`
- `npx vitest run tests/unit/map/entrance.test.js`
- `npx playwright test tests/e2e/map.spec.js`
- `npx playwright test tests/e2e/dialogues-all.spec.js`
- `npx playwright test tests/e2e/all-landmarks-close.spec.js`
- `npm run check:phone`
- `npm run build`
- `node "{{runner}}/assert.mjs" none dist "__world"`
- `node "{{runner}}/assert.mjs" none dist "fastTravelPoint"`
- `npm run check:budget`
- `npm run check:ledger`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
