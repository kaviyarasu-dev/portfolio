import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 027
  {
    id: '027', name: 'hotel-interior-upper', title: 'Grand Hotel upper floors: corridor, four guest rooms with bathrooms, rooftop, and journey 5', epic: 'E2', est: 55,
    arch: 'sections 10.6 and decisions D18, D19, requirement R6, R7',
    goal: [
      'Furnish the first floor and the roof terrace and finish the hotel so the full Rich bar passes: corridor with numbered doors, four guest rooms each with a real bed, wardrobe, desk, TV, minibar and a separate bathroom, a walkable rooftop with water tank and seating, the lift, switches and seats. Then prove journey 5 (sit on the bed, switch to first person, stand up) and the whole-building check.',
    ],
    read: ['src/world/buildings/plaza/manifest.json', 'src/world/buildings/plaza/build.js', 'docs/building-manifest.md', 'src/world/props/sets/hotelRoom.js', 'src/world/props/sets/bath.js', 'src/world/kit/exterior.js', 'scripts/check-buildings.mjs', 'tests/e2e/hotel-public.spec.js'],
    steps: [
      {
        title: 'Corridor and the four guest rooms',
        items: [
          '`corridor-1` (floor `carpet`): `rug-rect` runners x3, `lamp-wall` x6, `plant-potted-large` x2, `bench-wood` x2, `console-table` x2 with `flower-vase`, `wall-clock`, `picture-frame-set` x4, `fan-ceiling` x2, `sign-board` text "FIRST FLOOR / முதல் தளம்" (add key `first-floor`), `room-number-plate` per guest door (101 to 104 as text slots); at least 14 distinct types. Lights group `corridor-1` auto dusk, a switch at each end.',
          '`guest-1` to `guest-4` (floor `woodPlanks`, carpet rug on top): `bed-king` with `pillow-stack` and `blanket-roll` placed `on:bed-king`, `table-bedside` x2 with `lamp-table` x2 placed `on:table-bedside`, `wardrobe`, `desk-wood` with `chair-office` and `lamp-table`, `tv-wall`, `tv-stand` in two rooms and `armchair` + `table-side` in the other two, `minibar`, `safe-box`, `luggage-rack`, `luggage-suitcase`, `kettle-tray` `on:desk-wood`, `curtain-pair`, `rug-rect`, `mirror-standing`, `fan-ceiling`, `ac-split`, `picture-frame-set`, `wall-clock`, `flower-vase`; each room at least 18 distinct types, and the four rooms differ in at least 4 types (vary the layout: mirror the plan in two of them and give one room a `sofa-2`). Lights: bedside lamps and a ceiling light, group `guest-N`, switch at the door; `bed-king` is a `sit` interactable ("lie down") with its seat; the desk chair is a seat.',
          '`bath-1` to `bath-4` (floor `floorTile`, walls use the new `wallMaterial` room field below): `toilet`, `washbasin-pedestal`, `mirror-bath`, `shower-cubicle`, `towel-rail`, `towel-stack`, `bucket-mug`, `geyser`, `trash-bin-small`, `bath-mat`, `tube-light`; at least 10 distinct types each; light switch outside the door.',
          'Doors: `guest-1` and `guest-2` unlocked; `guest-3` and `guest-4` locked (a door plate "Do not disturb" is a nice touch but not required). Add a `wallMaterial` (string) field to the room schema in `src/world/kit/schema.js`, `shell.js` and `docs/building-manifest.md` if it is not there yet (default `plaster`), with a unit test in a NEW file `tests/unit/kit/wallMaterial.test.js`; do not edit frozen kit tests.',
          '`tests/unit/buildings/plazaUpper.test.js`: rooms rule for `corridor-1,guest-1,guest-2,guest-3,guest-4,bath-1,bath-2,bath-3,bath-4` with `minTypes` 14 for corridor, 18 for guests, 10 for baths (call `checkBuilding` with those per-room thresholds); no placement problems; `guest-1` and `guest-2` reachable with doors open, `guest-3` and `guest-4` not reachable while locked; both beds are `sit` interactables.',
        ],
        verify: [vt('tests/unit/buildings/plazaUpper.test.js', 'tests/unit/kit/wallMaterial.test.js')],
      },
      {
        title: 'Rooftop, rooftop props and the whole-building check',
        items: [
          '`src/world/props/sets/rooftop.js` (category `rooftop`): `roof-water-tank` (black cylindrical tank on a brick stand with a float pipe), `solar-heater` (two panels on a tilted frame with a small tank), `satellite-dish`, `clothes-line` (two posts with a wire and a few hung cloths, `solid: false`), `roof-access-hut` (a small box room with a door, decorative). Add `tests/unit/props/rooftop.test.js` (exact list, heights, `clothes-line` not solid).',
          '`rooftop` room: `table-round` x3 with `chair-plastic` x12, `planter-brick` x6, `planter-box` x4, `lamp-wall` x4, `bench-wood` x2, `roof-water-tank` x2, `solar-heater`, `satellite-dish`, `clothes-line`, `fan-pedestal`, `flower-vase` x3 `on:table-round`, `lantern-hanging` x4 (outdoor lighting). At least 14 distinct types. The 1.0 m parapet comes from the shell. `rooftop` lights auto dusk.',
          'Run the whole check: `npm run check:buildings -- --only plaza` (stage `full` is the default) must pass: at least 40 distinct types in total, every type registered, reachability, exterior detail classes, hotel rules.',
        ],
        verify: [vt('tests/unit/props/rooftop.test.js'), node('scripts/check-buildings.mjs --only plaza')],
      },
      {
        title: 'Journey 5 and shots',
        items: [
          '`tests/e2e/journey-5-sit.spec.js` on `?fixture=building-plaza&time=0.5` (journey 5 of the spec): teleport into `guest-1` (through the corridor: use the lift or stairs by teleporting to the first floor corridor, open the `guest-1` door with `e`, walk in), `e` on the bed: `playerState().sitting` is true and `playerAnim()` is `sit`; press `v`: `cameraMode()` is `first` and the camera is lower than the standing eye height (1.62); press `w`: stands up (`sitting` false), camera returns to the previous mode after pressing `v` again; the two locked rooms refuse (`listDoors()` shows them locked). Zero console errors.',
          '`tests/e2e/hotel-upper.spec.js`: ride the lift to level 2 (rooftop): `playerState().y` is within 0.1 of 7.6 and the player can walk 3 m on the roof without falling (y stays within 0.1); the parapet blocks walking off the edge (hold `w` toward the edge for 4 s: y does not change by more than 0.1 and the player is still within the footprint).',
          'Shots: spots `hotel-corridor`, `hotel-guest-1`, `hotel-bath-1`, `hotel-rooftop` added to `src/shots.json`; run them with `--plan 027`, view, fix obvious defects (best effort). Add the guest room and the rooftop to `src/budgets.json` spots.',
        ],
        verify: [pw('tests/e2e/journey-5-sit.spec.js', 15), pw('tests/e2e/hotel-upper.spec.js', 15)],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/buildings/plazaUpper.test.js', 'tests/unit/props/rooftop.test.js', 'tests/unit/buildings/plaza.test.js'), node('scripts/check-buildings.mjs --only plaza'), pw('tests/e2e/journey-5-sit.spec.js', 15), pw('tests/e2e/hotel-upper.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/building-manifest.md'],
    freeze: ['portfolio/tests/unit/buildings/plazaUpper.test.js', 'portfolio/tests/unit/props/rooftop.test.js', 'portfolio/tests/unit/kit/wallMaterial.test.js', 'portfolio/tests/e2e/journey-5-sit.spec.js', 'portfolio/tests/e2e/hotel-upper.spec.js'],
    human: 'Walk the guest rooms and the rooftop; judge realism and the layout.',
  },

  // ---------------------------------------------------------------- 028
  {
    id: '028', name: 'terrain-splat', title: 'Textured terrain: heightfield module and a four-layer splat material', epic: 'E2', est: 50,
    arch: 'sections 10.2, 10.4 and requirement R9, assumption A14',
    goal: [
      'Replace the v1 vertex-colour terrain with a textured one: a pure heightfield module (`heightAt`, shore and slope helpers), splat weights (grass, sand, dirt road, rock) and a standard material extended with the four CC0 texture sets from plan 013 (`grass`, `sand`, `dirtRoad`, `rockCliff`). The island size stays as v1 until plan 033 rebuilds the terrain from the town plan; this plan keeps the same API so that plan only swaps data.',
    ],
    read: ['src/world/terrain.js', 'src/world/props.js', 'src/world/zones.js', 'src/engine/materials.js', 'src/engine/quality.js', 'src/config.js', 'assets/textures/INDEX.json'],
    steps: [
      {
        title: 'Heightfield and splat weights (pure)',
        items: [
          '`tests/unit/terrain/height.test.js` and `tests/unit/terrain/splat.test.js` first. `src/world/terrain/height.js`: `createHeightField({ seed, radius, flatAreas, paths, waterLevel })` returns `{ heightAt(x, z), slopeAt(x, z), isWater(x, z), shoreDistance(x, z) }` using the same noise as v1 (move the v1 functions here, behaviour for existing zones must match v1 within 0.05 m at each zone centre) with `flatAreas: [{ x, z, r, y }]` (smooth blend to a plateau), the island falloff to below the water level at `radius`, and no values outside [-12, 40].',
          '`src/world/terrain/splat.js`: `splatWeights({ h, slope, shore, pathMask, waterLevel })` returns `[grass, sand, dirt, rock]` summing to 1 (each in [0,1]): sand near the water level (within 1.2 m above it), rock on slopes over 0.7, dirt where `pathMask` is 1, grass elsewhere, smooth transitions (no value jumps over 0.35 between points 0.5 m apart). `pathMask(x, z)` comes from a list of path polylines with a half-width and a 1.5 m falloff.',
          'Tests: determinism; zones centres match the v1 heights; flat area plateau within 0.02 m at the centre; island edge under the water; weights sum to 1 and are never negative over a 50 by 50 sample grid; sand at h = waterLevel + 0.3; rock at slope 1.0; dirt on a path; continuity.',
        ],
        verify: [vt('tests/unit/terrain/height.test.js', 'tests/unit/terrain/splat.test.js'), exists('src/world/terrain/height.js', 'src/world/terrain/splat.js')],
      },
      {
        title: 'Splat material and terrain mesh',
        items: [
          '`src/world/terrain/terrainMesh.js`: builds the terrain mesh from the heightfield (segments from `TERRAIN_SEGMENTS`, 200 by 200 on high, 120 by 120 on low), vertex attribute `splat` (vec4) from `splatWeights`, normals from the height function, and a `MeshStandardMaterial` extended with `onBeforeCompile` that blends four albedo textures by `splat` using planar world-xz coordinates divided by each layer tile size (grass 4 m, sand 3 m, dirt 3 m, rock 5 m) plus a second sample at a different scale to hide tiling, and adds the rock normal map on high tier only. At most 10 texture units in total. Texture size follows the tier (`getMaterial` helpers or a shared loader). Falls back to a flat-colour blend when `document` is undefined (Node).',
          '`tests/unit/terrain/terrainMesh.test.js`: in Node the mesh builds, has `position`, `normal`, `splat` attributes of equal vertex counts, all splat values finite; the low-tier mesh has fewer vertices than the high one; the material has an `onBeforeCompile` function and `defines` for the layer count.',
          'Replace the v1 `buildTerrain` body in `src/world/terrain.js` with the new module (keep `sampleHeight` exported and equal to `heightAt`); the player still stands on the terrain (`collision.groundHeight`). Props that read `sampleHeight` keep working.',
        ],
        verify: [vt('tests/unit/terrain/terrainMesh.test.js'), has('src/world/terrain.js', 'createHeightField'), npm('lint')],
      },
      {
        title: 'Playwright, budget and a look',
        items: [
          '`tests/e2e/terrain.spec.js`: boot, ready, zero console errors; `playerState().y` at the spawn is within 0.1 m of `heightAt` for that point (expose `terrainHeight(x, z)` in the hook); on `?quality=low` the terrain triangle count (reported by `rendererInfo` difference or a hook `terrainStats()`) is lower than on high; `canvasLooksRendered`.',
          '`npm run check:budget` still passes. `npm run shots -- --spots spawn,library --plan 028`; look at them: the ground must show visible grass texture, sand at the shore and dirt on paths, with no stretched textures (best effort; fix tile sizes if needed).',
        ],
        verify: [pw('tests/e2e/terrain.spec.js', 15), { cmd: 'npm run check:budget', timeout_min: 10 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/terrain/height.test.js', 'tests/unit/terrain/splat.test.js', 'tests/unit/terrain/terrainMesh.test.js'), pw('tests/e2e/terrain.spec.js', 15), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/terrain/height.test.js', 'portfolio/tests/unit/terrain/splat.test.js', 'portfolio/tests/unit/terrain/terrainMesh.test.js', 'portfolio/tests/e2e/terrain.spec.js'],
  },

  // ---------------------------------------------------------------- 029
  {
    id: '029', name: 'town-square', title: 'Town square in front of the hotel: paving, banyan platform, clock tower, street furniture', epic: 'E2', est: 55,
    arch: 'sections 3 (town plan), 10.4 and decision D21, D25(b)',
    goal: [
      'Build the public square the visitor sees on leaving the hotel, in a South Indian town style: a paved square with kerbs, a large banyan-style tree on a round stone platform, a clock tower with a working clock face, street lamps that switch on at dusk, benches, bins, planters, direction signposts in English and Tamil and a bus-stop shelter bench. Positions come from a data file so plan 032 can move it. Collision, lights and walkability are real.',
    ],
    read: ['src/world/props.js', 'src/world/terrain/height.js', 'src/world/props/sets/lamps.js', 'src/world/props/sets/outdoorSeating.js', 'src/world/kit/exterior.js', 'src/content/signage.js', 'src/systems/lights/lightManager.js', 'src/world/zones.js'],
    steps: [
      {
        title: 'Slice layout data and the square plan',
        items: [
          '`src/world/layout/slice.json`: provisional world placement used until plan 032: `{ "hotel": { "x": 0, "z": -14, "rot": 0 }, "square": { "cx": 0, "cz": 20, "w": 56, "d": 44, "y": 0.15 } }` and a list of `furniture` entries `{ "type", "x", "z", "rot" }` for benches, lamps, bins, planters, signposts (the data lives in the file, not in code).',
          '`tests/unit/layout/square.test.js` first. `src/world/layout/square.js` exports `loadSquare()` and `checkSquare(plan, { collision })`: furniture stays inside the square rectangle (at least 0.8 m from its edge); no two solid items overlap; at least 3.0 m of clear walkway between the hotel door (at `hotel.z + 10` on the south side) and the platform; every furniture item is reachable by the walk graph from the hotel door; at least 8 street lamps spaced 6 to 14 m apart; at least 6 benches; at least 4 bins; at least 4 planters; at least 2 signposts.',
          'Author the furniture list with these counts and sensible spacing: lamps along the long edges and around the platform, benches facing the platform, signposts at the road entrances (west, east, south).',
        ],
        verify: [vt('tests/unit/layout/square.test.js'), exists('src/world/layout/slice.json', 'src/world/layout/square.js')],
      },
      {
        title: 'Landmark builders: paving, banyan platform, clock tower',
        items: [
          '`tests/unit/world/squareLandmarks.test.js` first. `src/world/town/square.js` exports `buildSquare(plan, ctx)` returning `{ root, colliders, lights, update(dtMs) }`: paved ground (`stonePaving` with a border band of `brick`, 0.15 m above terrain with a 0.2 m kerb and drop kerbs at the road gaps) laid with a darker grid pattern; `buildBanyan()` (a spreading tree: thick buttress trunk, 14 aerial prop roots as thin tapered cylinders, 5 large canopy blobs made of 600 leaf quads in total, instanced; round platform of cut stone 6 m wide with two steps and a low wall; a small stone lamp stand on the platform without any idol); `buildClockTower()` (square base with arched openings, 9 m tower, a belfry roof with a small dome, four clock faces; the hour and minute hands are separate nodes rotated from the real local time each second; the clock face material is emissive after dusk).',
          'Street furniture from the catalog (`lamp-street` registered with the light manager, `bench-park`, `bin`-like `trash-bin-small` placed as `binOutside` from the exterior kit, `planter-brick`, `sign-board` posts with Tamil and English text from `signage.js`, a bus-stop shelter using `bench-bus-stop` with a roof). Colliders: the platform (circle), the tower base (box), each lamp post (circle 0.2), benches (boxes), planters. Lamps are `auto: "dusk"` with warm colour.',
          'Tests: `buildSquare` in Node returns the root with the expected meshes; the clock hands rotate for a fake date (3:00 gives the hour hand 90 degrees from 12 and the minute hand at 12); every furniture type exists in the catalog; collider count matches the solid items; light count equals the lamps; frame mesh count after merging under 40 (draw calls).',
        ],
        verify: [vt('tests/unit/world/squareLandmarks.test.js'), exists('src/world/town/square.js')],
      },
      {
        title: 'Integrate into the world, Playwright and shots',
        items: [
          'In `src/main.js` build the square after the terrain (inside the v1 world loading step for now; plan 031 moves it into a streamed area): flatten the terrain under the square and hotel footprint with `flatAreas` from `slice.json`, add the square colliders to `game.collision`, register the lamp lights. Remove v1 trees, rocks and grass that fall inside the square rectangle (the v1 props scatter checks a list of exclusion rectangles: add the square and the hotel footprint plus 3 m).',
          '`tests/e2e/square.spec.js`: boot with `?time=0.75&freeze=1`: `listLights()` has at least 8 lamp lights on; the player cannot walk through the platform (teleport 6 m west of the platform centre, hold `d` toward it for 3 s: distance to the centre stays at least 3 m minus 0.5 m for the wall); the clock tower hands exist (`listObjects()` includes `clock-tower`); zero console errors; `check:budget` spot `square` (add it) passes.',
          'Shots: spots `square-day` (time 0.4) and `square-night` (time 0.75) in `src/shots.json`; `npm run shots -- --spots square-day,square-night --plan 029`; view and fix (best effort).',
        ],
        verify: [pw('tests/e2e/square.spec.js', 15), { cmd: 'npm run check:budget', timeout_min: 10 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/layout/square.test.js', 'tests/unit/world/squareLandmarks.test.js'), pw('tests/e2e/square.spec.js', 15), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/layout/square.test.js', 'portfolio/tests/unit/world/squareLandmarks.test.js', 'portfolio/tests/e2e/square.spec.js'],
    human: 'Judge the square: does it feel like a real town centre? Tamil signposts need a reader.',
  },

  // ---------------------------------------------------------------- 030
  {
    id: '030', name: 'hero-props-polyhaven', title: 'Replace selected code-built props with CC0 Poly Haven models where a good one exists', epic: 'E2', est: 50,
    arch: 'sections 1, 10.1, 10.2 and decision D2, D11, A29',
    goal: [
      'Raise realism of the most visible furniture: let the prop catalog use optimized GLB models from Poly Haven (CC0) for selected types, with the code-built version as the always-available fallback (phone tier, headless tests, failed downloads). Acquire what Poly Haven offers for about 28 target types within the 3-source cap, optimize each (1k textures, meshopt), ledger it, and prove loading works. Success does not depend on how many are found; what is found must be correct.',
    ],
    read: ['src/world/props/catalog.js', 'scripts/assets/packModel.mjs', 'scripts/search-assets.mjs', 'scripts/assets/polyhaven.mjs', 'src/dev/fixtures/props.js', 'src/engine/quality.js', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'Catalog support for GLB-backed props',
        items: [
          '`tests/unit/props/glbProps.test.js` first. `src/world/props/glbProps.js`: reads `src/world/props/glbProps.json` (array of `{ type, file, scale, rotY, offset: [x, y, z], source }`); `registerGlbOverrides(catalog, entries)` marks catalog types as GLB-backed; `preloadProps(types, { loader })` loads the needed GLBs once (GLTFLoader with `MeshoptDecoder`), caches the parsed scene and returns a promise; `buildProp` clones the cached scene (shared geometry and materials), applies scale, rotation and offset so the result has the same origin convention and fits the declared `size` within 15 percent, and copies `userData` (`seats`, `solid`, `lightSockets`) from the code-built meta. When `typeof document === \'undefined\'`, when the tier is `low`, when a GLB is missing or failed to load, `buildProp` silently uses the code-built builder.',
          'Tests with a GLB fixture created in the test with gltf-transform (a box with a texture): override applied, size fit scaling, userData copied, fallback in Node, fallback after a failed preload (loader throws), cache loads once for ten builds.',
          'Extend the building context so `buildBuilding` awaits `preloadProps(distinct types of the manifest)` before building when running in the browser (it is async anyway through the streamer); headless tests are unchanged.',
        ],
        verify: [vt('tests/unit/props/glbProps.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/glbProps.js')],
      },
      {
        title: 'Acquire hero models from Poly Haven',
        items: [
          'Write `scripts/assets/packModelList.mjs <list.json>` (like `packMaterialList`): for each target `{ type, queries, categories, tags, maxTriangles }` search Poly Haven models, try up to 3 candidates (attempt cap per element `model-<type>`), run `packModel` into `assets/models/props/<type>.glb`, measure the bounding box with `readGlbInfo`, compute `scale` so the model height matches the declared catalog height, write the entry into `src/world/props/glbProps.json`. A candidate is rejected when it is over 1.5 MB, over 25000 triangles, or its aspect (width to height) differs from the declared size by more than 45 percent. Unit test with fake search and pack functions: reject by size, reject by aspect, accept the second candidate.',
          'Write `scripts/assets/heroProps.list.json` with these 28 targets (type: search hints): sofa-3 (sofa), armchair (armchair), chair-dining (dining chair), chair-wooden (wooden chair), table-coffee (coffee table), table-dining-4 (dining table), table-side (side table), table-bedside (nightstand), bookshelf-tall (bookshelf), cabinet-low (cabinet, sideboard), drawer-chest (drawers), lamp-table (table lamp), lamp-floor (floor lamp), plant-potted-large (potted plant, ficus), plant-potted-small (plant pot), fern-pot (fern), flower-vase (vase), vase-floor (large vase), mirror-wall (mirror), wall-clock (clock), picture-frame-set (picture frame), bed-king (bed), toilet (toilet), washbasin-pedestal (sink), bathtub (bathtub), tv-stand (tv cabinet), rug-rect (carpet), brass-urn (brass pot or urn). Run it. Poly Haven only has some of them; the rest keep the code-built version.',
          '`tests/unit/props/glbProps.assets.test.js`: every entry in `glbProps.json` has an existing file under `assets/models/props/`, a ledger entry (read `assets/LEDGER.json`), a catalog type that exists, a `scale` between 0.001 and 100, file size at most 1.5 MB, the sum of all GLBs at most 20 MB, `source` an https Poly Haven URL.',
          'A type without a model is not a failure: put the list of found and not-found types in the final report under `context`.',
        ],
        verify: [vt('tests/unit/props/glbProps.assets.test.js'), exists('scripts/assets/packModelList.mjs', 'scripts/assets/heroProps.list.json', 'src/world/props/glbProps.json'), npm('check:ledger')],
      },
      {
        title: 'Browser check, budget and a look',
        items: [
          '`tests/e2e/glb-props.spec.js`: `?fixture=props&quality=high`: all registered types appear in `listObjects()`; the number of GLB-backed props loaded (`__world.propsStats()` returns `{ glb, code, failed }`) equals the entries of `glbProps.json` whose file loads, `failed` is 0; with `?quality=low` `glb` is 0 and `code` equals the full count; zero console errors. Add `propsStats()` to the hook.',
          '`npm run check:size` (total under 80 MB) and `npm run check:budget` still pass. `npm run shots -- --fixture props --plan 030`, view the PNG, note which props look better and which look wrong (wrong scale, rotated, flipped); fix by editing the entry (`scale`, `rotY`, `offset`) or remove an entry whose model looks bad (best effort).',
        ],
        verify: [pw('tests/e2e/glb-props.spec.js', 15), npm('check:size'), npm('check:ledger')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/glbProps.test.js', 'tests/unit/props/glbProps.assets.test.js', 'tests/unit/props/allProps.test.js'), pw('tests/e2e/glb-props.spec.js', 15), npm('check:ledger'), npm('check:size')],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/assets/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/props/glbProps.test.js', 'portfolio/tests/unit/props/glbProps.assets.test.js', 'portfolio/tests/e2e/glb-props.spec.js'],
    human: 'Check the props fixture: do the Poly Haven models look right in place (scale, orientation)?',
    blocked: ['Poly Haven unreachable for all candidates: do not block; finish with an empty `glbProps.json` array and say so in the report. Block only when the code itself cannot be made to work.'],
  },

  // ---------------------------------------------------------------- 031
  {
    id: '031', name: 'slice-integration-review', title: 'Vertical slice integration: streamed hotel and square, spawn in the lobby, journey 1, review pack', epic: 'E2', est: 50,
    arch: 'sections 6 (Streaming), 10.4, 10.7 and requirement R7, decision D17, A6',
    goal: [
      'Put the slice together as the visitor will experience it: the Grand Hotel and the square are streamed areas that load first, the visitor spawns in the hotel lobby facing the reception, the intro dialogue opens only from the reception desk (A6), the old v1 plaza building and anything overlapping the new square is gone, budgets hold, journey 1 passes end to end, and a review pack of screenshots for the person is written. After this plan the runner pauses for approval of the look (D17).',
    ],
    read: ['src/main.js', 'src/world/zones.js', 'src/engine/streaming.js', 'src/world/layout/slice.json', 'src/world/town/square.js', 'src/world/buildings/plaza/build.js', 'src/systems/interaction.js', 'src/world/buildings.js', 'src/budgets.json', 'src/shots.json'],
    steps: [
      {
        title: 'Streamed areas, spawn and zone changes',
        items: [
          '`tests/unit/world/sliceAreas.test.js` first. `src/world/areas/plazaArea.js` exports `createPlazaAreas(game)` returning two Streamer area definitions: `centre` (id `centre`, priority 100, always on) loading the terrain-flattening data, square and street furniture, and `hotel` (id `hotel`, priority 100, `loadRadius` 140, `unloadRadius` 180) loading the hotel building through `buildBuilding` with `decoratePlaza` and the lights; the hotel area registers its interior as `interior: true`. The remaining v1 buildings, props and trees stay in the `v1-world` area (priority 50, they load after).',
          'Remove the v1 `plaza` building factory call and its collider from `src/world/buildings.js`. Relocate the v1 buildings that overlap the square or hotel footprints: add a test that no `ZONE_LAYOUT` circle (radius `r`) intersects the square rectangle or the hotel footprint plus 3 m; move `notice` to (-40, 24) and `milestones` to (40, 24) in `src/world/zones.js` if they do (they keep `mode: "radius"`). `plaza` becomes `name: "Grand Hotel"`, `mode: "object"`, `prompt: "check in"`.',
          'Spawn: the player starts inside the lobby, 5 m in front of the reception desk, facing it (read the desk position from the manifest `reception-intro` interactable), `playerState()` reports a position inside the hotel footprint. `teleport(\'plaza\')` goes to the same place. Skip the v1 auto-open of the plaza dialogue (it only opens from the desk now); the `T`, `?time` features stay.',
          'The loading screen covers only the `centre` and `hotel` areas plus the player; the loader hides when they are `loaded`; the `v1-world` area continues in the background (show nothing). If an area fails, the retry banner of plan 015 appears.',
        ],
        verify: [vt('tests/unit/world/sliceAreas.test.js'), exists('src/world/areas/plazaArea.js'), npm('lint')],
      },
      {
        title: 'Journey 1 and the streaming order',
        items: [
          '`tests/e2e/journey-1-arrive.spec.js` (journey 1 of the spec): open the base URL with default params; the loader shows progress then hides; `playerState()` is inside the hotel footprint; hold `w` until within 1.8 m of the reception desk (poll `playerState()` every 200 ms for at most 12 s); press `e`: `#dialogue` is visible and mentions the name from the contact content; press Escape: hidden; `streamState().loadOrder` starts with `centre` and `hotel` before `v1-world`; zero console errors.',
          '`tests/e2e/slice-regression.spec.js`: the other 13 v1 zones still behave as in v1 (loop over their ids: `teleport(id)`, press `e`, `#dialogue` visible, teleport away and it closes; the `notice` zone downloads the PDF instead, assert the download event and the RESUME DOWNLOADED toast); pressing `e` next to the hotel door outside does NOT open the plaza dialogue (only the reception desk does); `collisionStats()` shows boxes (hotel) and circles (v1 buildings).',
        ],
        verify: [pw('tests/e2e/journey-1-arrive.spec.js', 15), pw('tests/e2e/slice-regression.spec.js', 20)],
      },
      {
        title: 'Budgets, shots and the review pack',
        items: [
          'Make sure `src/budgets.json` has spots `lobby`, `restaurant`, `square`, `guest-room`, `rooftop` (placed in world coordinates with the hotel at its slice position) and run `npm run check:budget`: desktop and phone profiles must pass. If a spot is over its limit, reduce draw calls by merging static meshes per material, using `InstancedMesh` for repeated props (chairs, lamps, leaves), and hiding the interior when outside; do NOT raise a limit.',
          'Run `npm run shots -- --plan 031 --spots hotel-front,hotel-corner,square-day,square-night,hotel-reception,hotel-restaurant,hotel-kitchen,hotel-corridor,hotel-guest-1,hotel-bath-1,hotel-rooftop` (adapt the spots to the final world coordinates, and use the slice positions rather than the fixture). Open every PNG with the Read tool and fix visible defects: floating objects, objects inside walls, flat or missing textures, black rooms, z-fighting. Best effort, never fails; list what you fixed.',
          'Write `docs/review/slice-review.md` for the person: what to open (`npm run dev`, then the URL), the 11 screenshot paths under `docs/shots/031/`, the controls to try (E, V, T, O), what is intentionally not done yet (the other 13 buildings are still v1, the terrain is v1 size, no NPCs, weather or new audio), the known weaknesses you saw, and the budget numbers from `check:budget`.',
        ],
        verify: [{ cmd: 'npm run check:budget', timeout_min: 15 }, exists('docs/review/slice-review.md', 'docs/shots/031/hotel-front-high.png')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/world/sliceAreas.test.js'), pw('tests/e2e/journey-1-arrive.spec.js', 15), pw('tests/e2e/slice-regression.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 15 }, node('scripts/check-buildings.mjs --only plaza'), npm('check:ledger'), npm('check:size')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/review/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/world/sliceAreas.test.js', 'portfolio/tests/e2e/journey-1-arrive.spec.js', 'portfolio/tests/e2e/slice-regression.spec.js'],
    human: 'MILESTONE: the runner pauses after this plan. Open `docs/review/slice-review.md` and the screenshots, walk the hotel and square with `npm run dev`, and approve the look (or tell the planner what to change) before epic 3 starts (D17). Run `/plan-replan realistic-world-overhaul` for changes.',
  },
];
