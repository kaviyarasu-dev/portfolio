# Plan 025: Shared exterior detail kit, signage and the Grand Hotel facade

Epic E2. Estimated turns: 55.

## Goal

Make buildings look like real South Indian buildings from outside. Build a reusable exterior detail kit (window frames and shutters, balconies, drainpipes, planters, bins, wall lamps, awnings, porticos, steps, signboards with Tamil and English text) that all 14 landmarks reuse, then apply it to the Grand Hotel: pastel plaster facade, red clay-tile roof over the stair block, flat terrace roof with parapet and water tank, arched entrance portico with columns, balconies, shutters, AC units, a lit signboard. Tamil text comes from one content file and is a human check (A2).

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 10.4, 10.6, decision D21, D25(d) and assumption A2, A15)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- src/world/kit/shell.js
- src/world/kit/building.js
- src/world/buildings/plaza/manifest.json
- src/engine/materials.js
- src/world/props/sets/signs.js
- src/world/props/sets/plants.js
- src/ui/hud.js
- docs/building-manifest.md

High-risk assumptions that touch this plan (each has a step that checks it):
- A2 (HIGH-RISK, accuracy): Tamil signage is drafted by this plan from the starter vocabulary below and is flagged for a person to check. No idols or deity images are modelled anywhere.

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Exterior detail kit (headless)

Deliver:
- `tests/unit/kit/exterior.test.js` first. `src/world/kit/exterior.js` exports builders that each return an `Object3D` whose root `userData.detailClass` is one of `window|door|signage|drainpipe|planter|bin|lamp|balcony|awning|portico|steps|ac-unit`: `windowFrame({ w, h, shutters, sill })` (frame, sill, optional two shutters in `woodDark`, a lintel), `balcony({ w, d, railing })` (slab, balusters, handrail), `drainpipe({ height })` (pipe with brackets and a hopper), `planterOutside({ w })`, `binOutside()` (a green municipal bin on legs), `wallLamp()`, `awning({ w, d })` (striped fabric on a frame), `portico({ w, columns, archHeight })` (columns with capitals, an arched lintel built from a half-torus or extruded arch, a flat roof), `steps({ w, rise, count })`, `acUnit()` (outdoor box with fan grille), `waterTank()` (black cylindrical roof tank on a stand, common in India). All headless, merged per material, sizes in metres.
- `placeExteriorDetails(instance, manifest, ctx)` reads `manifest.exteriorDetails` counts and `windows`, attaches the matching builders to the facade (window frames exactly at each manifest window position, doors framed, drainpipes at corners, planters and bins along the base, lamps beside doors) and returns the list of attached objects; each carries `userData.detailClass`. `countDetails(instanceRoot)` returns counts per class.
- Tests: each builder returns finite geometry with the right class and a bounding box in a sane range (window frame about its `w` by `h`, portico taller than 3 m); `placeExteriorDetails` on the cottage manifest attaches exactly the declared counts, a window frame sits within 0.05 m of each window position on the right wall; deterministic with a seed.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/kit/exterior.test.js`
- `node "{{runner}}/assert.mjs" exists src/world/kit/exterior.js`

### Step 2: Signage text and sign textures

Deliver:
- `tests/unit/content/signage.test.js` first. `src/content/signage.js` exports `SIGNS` (key -> `{ en, ta }`) and `signText(key)`. Starter vocabulary (a person still checks it): Grand Hotel `கிராண்ட் ஹோட்டல்`; Reception `வரவேற்பு`; Restaurant `உணவகம்`; Welcome `நல்வரவு`; Tea `தேநீர்`; Post Office `அஞ்சல் அலுவலகம்`; Library `நூலகம்`; School `பள்ளி`; Lighthouse `கலங்கரை விளக்கம்`; Harbour `துறைமுகம்`; Bus Stand `பேருந்து நிலையம்`; Fish Market `மீன் சந்தை`; Temple `கோயில்`; Town Hall `நகர மன்றம்`; Police `காவல் நிலையம்`; Exit `வெளியேறு`; Entrance `நுழைவாயில்`; Kitchen `சமையலறை`; Restroom `கழிப்பறை`; Open `திறந்திருக்கிறது`; Closed `மூடப்பட்டது`. Add keys for every zone building name and the hotel rooms as needed. Test: every key has non-empty `en` and `ta`; every `ta` contains at least one character in U+0B80 to U+0BFF; no key contains digits except room numbers; the file has a header comment stating the Tamil is a draft to be checked by a person.
- `src/world/kit/signTexture.js`: `makeSignMaterial({ lines: [{ text, font, color, size }], width, height, bg, border })` returns a `MeshStandardMaterial`. In the browser it draws the text with a canvas (Tamil lines with `"Noto Sans Tamil"`, English with `Orbitron` or `Inter`) and returns a `CanvasTexture` (sRGB, anisotropy 4); in Node (`typeof document === 'undefined'`) it returns a flat material of colour `bg` and records the text in `userData.text` so tests can read it. Export `awaitFonts()` that resolves after `document.fonts.load` for the two families (immediately in Node).
- `signboard({ key, w, h, style })` in `exterior.js` builds a board mesh with the sign material, a frame, and two small spot lamps; the manifest `exteriorDetails` class `signage` counts these.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/content/signage.test.js`
- `node "{{runner}}/assert.mjs" exists src/content/signage.js src/world/kit/signTexture.js`

### Step 3: Apply to the Grand Hotel and check the details exist

Deliver:
- `src/world/buildings/plaza/build.js` exports `decoratePlaza(instance, ctx)`: portico over the main door with two columns and a stepped plinth; a pastel exterior (`style.wallTint` `#f1d7a6` for the main block, a darker trim; set in the manifest); window frames with shutters on the first floor, balconies in front of `guest-1` and `guest-2`, AC units under four windows, drainpipes at the four corners, `planterOutside` on both sides of the entrance (use the shared builders), a lit signboard `GRAND HOTEL` with the Tamil line above the portico, a smaller `RESTAURANT` board at the restaurant door, wall lamps beside every exterior door, a water tank and a satellite dish on the roof terrace, bins at the corner. The kit calls `decoratePlaza` automatically when `src/world/buildings/<id>/build.js` exists (extend `buildBuilding` with an optional `decorate` hook; do not break the cottage tests).
- `check:buildings` gets the rule "declared exteriorDetails counts are really built": for the `full` and `rooms` stages and also `structure` when the building has a `build.js`, the built instance must contain at least the declared number of objects of each detail class (`countDetails`). Implement it as a separate exported `checkDetails(manifest, instance)` in `scripts/check-buildings.mjs` that `checkAll` also runs, and put its tests in the new file `tests/unit/scripts/checkBuildingsDetails.test.js`. Do not edit `tests/unit/scripts/checkBuildings.test.js` (frozen by plan 024); it must keep passing.
- `tests/unit/buildings/plazaExterior.test.js`: after `decoratePlaza` the counts per class are at least the manifest counts; the signboard material records the text `GRAND HOTEL` and the Tamil string from `SIGNS`; the portico does not block the main door clearance (walk graph still reaches `lobby`); `check:buildings --only plaza --stage structure` still passes.
- `tests/e2e/plaza-exterior.spec.js`: `?fixture=building-plaza`; zero console errors; `document.fonts.check('16px "Noto Sans Tamil"')` true after load; shots from `hotel-front` and a second spot `hotel-corner` (add to `src/shots.json`); view them and fix defects such as floating frames (best effort).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/buildings/plazaExterior.test.js tests/unit/scripts/checkBuildingsDetails.test.js`
- `node scripts/check-buildings.mjs --only plaza --stage structure`
- `npx playwright test tests/e2e/plaza-exterior.spec.js`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/kit/exterior.test.js tests/unit/content/signage.test.js tests/unit/buildings/plazaExterior.test.js tests/unit/scripts/checkBuildingsDetails.test.js tests/unit/scripts/checkBuildings.test.js`
- `npx playwright test tests/e2e/plaza-exterior.spec.js`

Human check (goes in the report, never blocks): Have a Tamil reader check every string in `src/content/signage.js` and the hotel and shop names (A2, A15).

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
