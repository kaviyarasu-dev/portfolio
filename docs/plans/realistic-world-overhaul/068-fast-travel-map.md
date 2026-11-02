# Plan 068: Fast-travel map with keyboard and touch access

Epic E7. Estimated turns: 50.

## Goal

A full-screen map of the island (key `M`, and a map button visible on touch and desktop) listing the 14 landmarks as markers and as a keyboard-operable list. Choosing one teleports the player to the entrance of that building with a short fade. The map is also the fast way around a 300 m island. Touch buttons for the rest arrive in plan 071.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 7 (Accessibility, Touch) and requirement R12, decision D7(a), journey 3)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/ui/minimap.js
- src/ui/hud.js
- src/world/layout/town.json
- src/world/zones.js
- src/world/buildings/plaza/manifest.json
- src/dev/worldHook.js
- src/ui/settings.js
- src/systems/input.js

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Entrance points and the shared teleport

Deliver:
- `tests/unit/map/entrance.test.js` first. `src/systems/teleport.js`: `entrancePoint(zoneId, manifest, anchor)` returns `{ x, y, z, yaw }`: 3.0 m outside the main exterior door (the first unlocked `exterior` door, not decorative) along the outward wall normal, rotated by the anchor rotation, at the terrain height there, facing the door; `teleportToZone(game, zoneId)` moves the player and camera (sets yaw), clears the interaction state (closes any dialogue, stands up from a seat), and keeps the interior visibility consistent; the hook `teleport(zoneId)` uses it (the spawn `plaza` still goes to the lobby of plan 031: `teleportToZone(game, 'plaza')` is the lobby, the map offers the hotel entrance by an extra `entrance` flag).
- Tests: for all 14 manifests the point is outside the footprint, not blocked (`blockedAt` false with radius 0.35 in a headless world with that building), within 4 m of the door and not inside another anchor rectangle; the yaw faces the door within 0.1 rad; for a rotated anchor the point rotates with it.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/map/entrance.test.js`
- `node "{{runner}}/assert.mjs" exists src/systems/teleport.js`

### Step 2: The map UI

Deliver:
- `src/ui/map.js`: `openMap()` / `closeMap()` for `#map` (role `dialog`, `aria-modal`, labelled "Island map"). It draws the island from `buildMinimapLayers` (plan 040) on a canvas sized to the viewport (land, sea, harbour, roads by class, the player marker with direction), places 14 marker buttons (`<button class="map-marker" data-zone="library" aria-label="Public Library">`) over the canvas by their anchor coordinates, and shows a list on the side or below on narrow screens with the same 14 names (a `<ul>` of buttons, arrow keys move focus, Enter travels). Hover or focus shows the name and what the building shows (from the zone prompt). A "You are here" marker and a "Close" button. `M` toggles, `Escape` closes, pointer lock is released while open, movement keys are ignored while open. Selecting a zone calls `teleportToZone`, fades the screen to black and back over 400 ms (CSS, skipped when reduced motion is on) and closes the map.
- The HUD gets a small map button (aria-label "Open map") top-right under the settings gear that works with mouse and touch.
- `tests/e2e/map.spec.js`: press `m`: `#map` visible and `document.activeElement` is inside it; there are exactly 14 `.map-marker` buttons and 14 list buttons; for each zone: click its marker: the map closes, `playerState()` is within 6 m of `entrancePoint` (hook `entrancePoint(id)`) and not blocked; the map button opens it too; `Escape` closes; keyboard only: open with `m`, Tab to the list, ArrowDown twice, Enter: the player teleports to the third landmark; zero console errors.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx playwright test tests/e2e/map.spec.js`
- `node "{{runner}}/assert.mjs" exists src/ui/map.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/map/entrance.test.js`
- `npx playwright test tests/e2e/map.spec.js`
- `npx playwright test tests/e2e/dialogues-all.spec.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
