# Plan 041: Prop set D: office, technology and broadcast studio (44 types)

Epic E4. Estimated turns: 55.

## Goal

Fourth furniture set for the office tower, the broadcast station, the gatehouse control room and the garage and studio buildings. Same quality bar and metadata rules as plans 019, 022 and 023 (read the existing sets first). Screens carry a `screen` metadata slot (`userData.screen = { w, h, x, y, z }`) so buildings can show content or an emissive glow.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: section 10.5 and decision D18)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/props/catalog.js
- src/world/props/sets/seating.js
- src/world/props/sets/storage.js
- tests/unit/props/allProps.test.js
- src/engine/materials.js
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Office furniture and equipment (16 types)

Deliver:
- `src/world/props/sets/office.js` (category `office`): `monitor-desktop`, `monitor-dual`, `laptop` (open, screen slot), `keyboard-mouse` (not solid), `desk-cubicle` (L-shaped desk), `cubicle-partition` (fabric panel 1.5 m high), `standing-desk` (adjustable legs), `printer-copier` (large floor unit with a tray and a control panel), `conference-table` (a 6 m boat-shaped table), `chair-conference` (padded, wheels), `reception-desk-modern` (curved front with a logo slot), `whiteboard-rolling`, `kanban-board` (a board with 4 columns of sticky notes), `bean-bag`, `desk-lamp`, `phone-desk`.
- `tests/unit/props/office.test.js`: exact list; desk heights 0.7 to 0.76 m (standing desk 1.0 to 1.2); monitors have a `screen` slot; `keyboard-mouse` not solid; conference table length 5 to 7 m.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/office.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/office.js`

### Step 2: Server, building services and office extras (12 types)

Deliver:
- `src/world/props/sets/tech.js` (category `tech`): `server-rack` (42U rack with 12 blade fronts and blinking LED dots as emissive points), `network-box` (wall box with cables), `projector-ceiling`, `projector-screen` (pull-down), `water-dispenser`, `coffee-machine`, `vending-machine` (glass front with product rows), `plant-office` (snake plant in a square pot), `ceiling-panel-light` (600 mm panel, a `lightSockets` entry), `fire-extinguisher` (red cylinder with a wall bracket, not solid), `exit-sign` (green emissive), `wall-tv-large` (large screen with a slot).
- `tests/unit/props/tech.test.js`: exact list; `server-rack` height 1.9 to 2.1 m and at least 12 front parts; screens have slots; `ceiling-panel-light` has a socket; the extinguisher is not solid.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/tech.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/tech.js`

### Step 3: Broadcast studio (16 types)

Deliver:
- `src/world/props/sets/media.js` (category `media`): `mic-desk` (desk microphone on a flexible arm with a pop filter), `mic-boom` (boom stand), `mixing-console` (a 2 m console with 24 faders and knobs as small parts, a meter strip as emissive dots), `camera-studio` (camera on a pedestal tripod with a viewfinder), `light-softbox`, `light-par-rig` (a ceiling grid bar with 6 lamps), `teleprompter`, `green-screen` (a green backdrop with a stand), `monitor-wall` (3 by 2 grid of screens, slots), `speaker-studio` (monitor speaker pair on stands), `on-air-sign` (a red emissive box with the text ON AIR; the emissive follows `userData.on`), `headphones-hook`, `patch-bay` (rack panel with cable ends), `acoustic-panel` (a fabric panel with a wooden frame, foam texture look), `news-desk` (curved two-person desk with a front logo slot), `antenna-rack` (a rack with a small dipole array).
- `tests/unit/props/media.test.js`: exact list; the mixing console has at least 24 fader parts; `on-air-sign.userData.on` is a boolean the building can toggle (provide `setOnAir(object, bool)` in the same file); `monitor-wall` has 6 screen slots; the whole catalog now has at least 215 registered types.
- Look at `npm run shots -- --fixture props --plan 041` (best effort) and fix obvious defects.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/props/media.test.js tests/unit/props/allProps.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/props/sets/media.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/props/office.test.js tests/unit/props/tech.test.js tests/unit/props/media.test.js tests/unit/props/allProps.test.js`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
