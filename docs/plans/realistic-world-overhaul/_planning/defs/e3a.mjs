import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 032
  {
    id: '032', name: 'town-plan', title: 'Town plan data: roads, areas, landmark anchors, plots, and the layout tests', epic: 'E3', est: 55,
    arch: 'sections 3 (Town plan), 10.4 and requirement R9, decision D14, D21',
    goal: [
      'Design the island as a real South Indian coastal town (radius about 300 m) as data: `src/world/layout/town.json` with road polylines, the harbour, beach, forest, hill and farmland areas, the 14 landmark anchors, the spawn, and about 40 generated plots for houses, shops, cafe, market and fishermen huts. Pure geometry tests prove no overlaps, every landmark reachable from the spawn along roads, and the walk to the farthest landmark within 460 m. Nothing in the 3D world changes in this plan.',
    ],
    read: ['src/world/zones.js', 'src/world/layout/slice.json', 'src/world/layout/square.js', 'src/world/buildings/plaza/manifest.json', 'src/config.js', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'Geometry helpers and the town.json schema',
        items: [
          '`tests/unit/layout/geometry.test.js` and `tests/unit/layout/townSchema.test.js` first. `src/world/layout/geometry.js` (pure): `polygonContains(poly, x, z)`, `polygonArea`, `polylineLength(points)`, `pointAlongPolyline(points, d)`, `distanceToPolyline(points, x, z)`, `rectOverlap(a, b, margin)` for oriented rectangles `{ x, z, w, d, rot }`, `rectInPolygon`, `nearestPointOnPolyline`.',
          '`src/world/layout/town.js` exports `validateTown(town)` returning problems and `loadTown()`. Schema: `{ version: 1, radius: 300, spawn: { x, z }, anchors: { <zoneId>: { x, z, rot, w, d } }, areas: { sea, harbour: polygon, beach: polygon, forest: polygon, farmland: polygon, hill: { x, z, r, h }, square: { cx, cz, w, d } }, roads: [{ id, class: "main|street|lane|path", width, points: [[x, z]...] }], plots: [{ id, type: "house-a|house-b|shop-row|cafe|market|hut", x, z, w, d, rot, facing }], boats: [{ id, kind, x, z, rot }] }`. Rules: all 14 zone ids present in `anchors` with positive `w` and `d`; every polygon has at least 3 points and is inside the radius; road widths by class (main 7, street 5, lane 3.5, path 1.8); points inside the radius minus 15 m.',
          'Tests: the geometry helpers on known shapes (rotated rectangles overlapping and not, a polygon with a hole-free concave shape, distance to a polyline segment end); the schema validator accepts a minimal valid town built in the test and rejects each broken rule.',
        ],
        verify: [vt('tests/unit/layout/geometry.test.js', 'tests/unit/layout/townSchema.test.js'), exists('src/world/layout/geometry.js', 'src/world/layout/town.js')],
      },
      {
        title: 'Author roads, areas and anchors; reachability and walk-time tests',
        items: [
          'Write `src/world/layout/town.json` (without plots yet, `plots: []`, `boats: []`). Compass: +x is east, +z is south. Concept (adjust coordinates freely but keep the idea and pass the tests): the sea is east and south; the harbour basin on the east coast (x 170 to 240, z 10 to 110) with the ferry terminal on its quay; a sand beach along the south-east shore; the lighthouse on the north-east headland (about 200, -90); the hill with the radio station and mast in the north-west (about -120, -90, height 18 m); forest north and north-west of the town; farmland west and south-west; the main street runs west to east through the town centre to the harbour; a ring road connects the outskirts; the west entrance gate (gateway gatehouse) stands where the west road enters the town (about -150, 0). The hotel (`plaza`) is at (0, -14) facing south onto the square (56 by 44 at (0, 20)); the spawn is the lobby (0, -8).',
          'Suggested anchors (x, z, w, d): plaza (0,-14,28,20); milestones town hall (0,68,22,16); notice post office (-48,20,14,10); library (-60,-34,24,18); academy (-100,40,30,22); forge engineering workshop (60,60,18,14); citadel office tower (72,-22,22,18); broadcast station (-120,-80,18,14); gateway gatehouse (-150,0,14,10); transport ferry terminal (190,50,28,16); temple community hall (-70,84,20,16); workshop startup garage (40,100,16,12); freshnote design studio (-20,104,16,12); lighthouse (200,-90,12,12).',
          'Roads: one `main` from the west gate through the square to the harbour; two `street` roads crossing it; `lane`s to each landmark; a `path` to the lighthouse and one up the hill; a ring `street`. Each anchor must have a road polyline passing within 12 m of its entrance side. Areas as polygons.',
          '`src/world/layout/walk.js`: `buildRoadGraph(town)` (nodes at road ends and intersections within 1.5 m, edges with lengths), `shortestWalk(graph, from, to)` returning the length in metres along roads plus the first and last connector segments from the point to the nearest road point, `farthestLandmark(town)`.',
          '`tests/unit/layout/townPlan.test.js`: `validateTown` has no problems; the road graph is one connected component; every landmark is reachable from the spawn; the farthest shortest walk is at most `MAX_PATH_METRES` (add `export const MAX_PATH_METRES = 460;` to `src/config.js`); no two anchor rectangles overlap (margin 4 m); no anchor rectangle intersects the harbour, beach (sea side), or a road polyline buffer of half width plus 1 m (except its own access lane end); the square rectangle does not overlap any anchor other than `plaza`; the hill centre is at least 60 m from every anchor except `broadcast`.',
        ],
        verify: [vt('tests/unit/layout/townPlan.test.js'), exists('src/world/layout/town.json', 'src/world/layout/walk.js'), has('src/config.js', 'MAX_PATH_METRES')],
      },
      {
        title: 'Plot generator and counts',
        items: [
          '`src/world/layout/plots.js` exports `generatePlots(town, seed)` (pure, deterministic): walks along `street` and `lane` roads every 14 to 22 m on both sides, places a rectangle plot facing the road (setback 3 m from the edge), type chosen by zone of the town: `shop-row` along the main street within 120 m of the square, `house-a` and `house-b` elsewhere in town, `cafe` once next to the square, `market` once near the harbour road, `hut` along the beach and harbour (6), skipping any candidate that overlaps another plot, an anchor (margin 4 m), a road buffer, the square or a water polygon; target counts: at least 28 houses, 8 shop rows, 1 cafe, 1 market, 6 huts; also `generateBoats(town, seed)` (8 catamarans on the beach, 4 in the water near the beach, 6 fishing boats in the harbour, 2 moored at the jetty).',
          '`scripts/gen-town.mjs` writes the generated `plots` and `boats` into `town.json` (keep the authored fields untouched, stable key order); run it. A unit test regenerates and asserts the committed `town.json` plots equal the generator output (so nobody edits plots by hand without the generator).',
          '`tests/unit/layout/plots.test.js`: counts above; no overlaps (margin 1.5 m between plots, 4 m to anchors); every plot has road access (distance to a road under 14 m); determinism for seed 1337; a different seed gives a different but valid set; `hut` plots are within 40 m of the beach or harbour polygon.',
        ],
        verify: [vt('tests/unit/layout/plots.test.js', 'tests/unit/layout/townPlan.test.js'), exists('src/world/layout/plots.js', 'scripts/gen-town.mjs')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/layout/geometry.test.js', 'tests/unit/layout/townSchema.test.js', 'tests/unit/layout/townPlan.test.js', 'tests/unit/layout/plots.test.js')],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/layout/geometry.test.js', 'portfolio/tests/unit/layout/townSchema.test.js', 'portfolio/tests/unit/layout/townPlan.test.js', 'portfolio/tests/unit/layout/plots.test.js'],
    human: 'Open `src/world/layout/town.json` in a viewer or look at the minimap later; judge whether the town plan feels right.',
  },

  // ---------------------------------------------------------------- 033
  {
    id: '033', name: 'terrain-from-plan', title: 'Terrain built from the town plan; world enlarged to 300 m; v1 landmarks moved to their anchors', epic: 'E3', est: 50,
    arch: 'sections 10.4 and requirement R9, assumption A14',
    goal: [
      'Rebuild the island from `town.json`: an irregular coast at about 300 m, plateaus under every anchor and plot, graded roads, the harbour basin cut below the water, a gently sloping beach, the hill, and wading limits so the player cannot walk out into deep water. Move the v1 landmark circles to their new anchors (`zones.js` reads the town plan) and enlarge the world constants, minimap and sky.',
    ],
    read: ['src/world/terrain/height.js', 'src/world/terrain/splat.js', 'src/world/terrain/terrainMesh.js', 'src/world/layout/town.json', 'src/world/layout/town.js', 'src/world/layout/geometry.js', 'src/world/zones.js', 'src/config.js', 'src/ui/minimap.js', 'src/world/sky.js', 'src/systems/collision/world.js', 'src/world/props.js'],
    steps: [
      {
        title: 'Heightfield from the town plan',
        items: [
          '`tests/unit/terrain/townHeight.test.js` first. Extend `createHeightField` with `createTownHeightField(town, { seed })` in `src/world/terrain/townHeight.js` (the old function stays for tests that use it): island coast radius 285 to 300 m perturbed by low-frequency noise (never inside 270 m), land height gently rising to a few metres inland, the hill (`town.areas.hill`) as a smooth bump up to its `h` (14 to 22 m), plateaus for each anchor and plot (height = the terrain height at the centre clamped to 0.3 to 3 m, blended over 6 m), roads graded: along each road polyline the height is a smoothed profile (moving average over 25 m) blended over `width / 2 + 3 m`, the harbour polygon below -2.5 m with a quay edge (a 3 m strip at +0.4 m on the land side), the beach polygon sloping at 0.03 to 0.09 from +1.0 m down to the water level, farmland flat plates with 0.3 m field bunds optional, the square rectangle flat at the slice height 0.15 m.',
          'Tests: no NaN over a 4 m grid; outside radius 300 the height is under -3 m; anchor plateaus within 0.03 m of their `y` at the centre; road slope (rise over run sampled every 2 m) at most 0.12 along every road; the harbour interior is under -1.8 m except the quay strip; beach slope inside the beach polygon between 0.02 and 0.10; hill peak between 14 and 22 m; the land is one connected island (flood fill on a 6 m grid, the largest component has at least 95 percent of land cells); determinism.',
        ],
        verify: [vt('tests/unit/terrain/townHeight.test.js'), exists('src/world/terrain/townHeight.js')],
      },
      {
        title: 'Wading limit, enlarged world constants and the v1 landmarks at their anchors',
        items: [
          '`tests/unit/collision/wading.test.js` first (a NEW test file; do not edit the frozen collision tests). Add `setWading({ waterLevel, maxDepth = 0.7 })` to `CollisionWorld`: a move whose target has terrain ground below `waterLevel - maxDepth` is treated as blocked (slides along the shore); the player can wade in shallow water. Tests: walking from a beach into the sea stops at depth 0.7; moving along the shoreline slides; with `setWading` not called nothing changes.',
          '`src/config.js`: `WORLD_RADIUS = 300`, `TERRAIN_SIZE = 680`, `TERRAIN_SEGMENTS` 340 for high tier (`TIER_SETTINGS` gets `terrainSegments`: low 170, medium 256, high 340), `CAMERA_FAR = 900`, fog density lowered to keep the horizon (about 0.0045). `src/world/terrain.js` builds the mesh from the town height field and uses `town.roads` for the path mask; `sampleHeight` equals the new `heightAt`.',
          '`src/world/zones.js`: `ZONE_LAYOUT` positions and `r` come from `town.json` anchors (`x`, `z`; `r` stays as v1), the v1 building factories take their world position from the zone; the temporary relocations of plan 031 are removed (`slice.json` is deleted and its users read `town.json`: hotel at the `plaza` anchor, square from `areas.square`). The v1 `buildPlaza` stays removed.',
          '`src/ui/minimap.js` and `src/world/sky.js`: scale the minimap range to the new radius (still a player-centred disc, 120 m visible) and keep the sky dome and sun shadow frustum sizes valid for the larger world (sky mesh radius at least 850 m). The v1 props scatter uses `WORLD_RADIUS` and the town plan exclusion list (roads buffer, plots, anchors, water, square); keep the counts as they are for now (plan 036 replaces vegetation).',
          '`tests/e2e/world-scale.spec.js`: boot; for every zone id `teleport(id)` puts the player within 0.15 m of the terrain height (hook `terrainHeight`); `collisionStats()` shows the wading rule (`wading: true` added to the stats); walking east from the beach for 12 s ends in water no deeper than 0.8 m; zero console errors; `check:budget` passes.',
        ],
        verify: [vt('tests/unit/collision/wading.test.js'), pw('tests/e2e/world-scale.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/terrain/townHeight.test.js', 'tests/unit/collision/wading.test.js', 'tests/unit/layout/townPlan.test.js'), pw('tests/e2e/world-scale.spec.js', 20), pw('tests/e2e/slice-regression.spec.js', 20), pw('tests/e2e/journey-1-arrive.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/terrain/townHeight.test.js', 'portfolio/tests/unit/collision/wading.test.js', 'portfolio/tests/e2e/world-scale.spec.js'],
  },

  // ---------------------------------------------------------------- 034
  {
    id: '034', name: 'roads', title: 'Road meshes with kerbs, junctions, surface lookup and clear-road checks', epic: 'E3', est: 50,
    arch: 'sections 10.4 and requirement R9, assumption A14',
    goal: [
      'Turn the road polylines into real roads: ribbon meshes that follow the graded terrain with textures by class (main street paving, street gravel, lane dirt, path dirt), kerbs and gutters on main roads and streets, clean junctions without z-fighting, and a `surfaceAt(x, z)` function that audio (plan 064) will use for footsteps. A test proves no collider blocks a road.',
    ],
    read: ['src/world/layout/town.json', 'src/world/layout/walk.js', 'src/world/layout/geometry.js', 'src/world/terrain/townHeight.js', 'src/engine/materials.js', 'src/util/uv.js', 'src/world/terrain/splat.js'],
    steps: [
      {
        title: 'Ribbon geometry and kerbs (pure, unit tested)',
        items: [
          '`tests/unit/roads/ribbon.test.js` first. `src/world/roads/ribbon.js`: `buildRoadGeometry(road, heightAt, { step = 1.5, yOffset })` returns a `BufferGeometry` strip along the polyline: samples every `step` metres, left and right edges offset by `width / 2` along the local normal (smoothed at corners with a miter limit of 2.0), `y = heightAt + yOffset` (main 0.05, street 0.045, lane 0.04, path 0.035 so overlaps do not z-fight), UV u across (0..1), v in metres along the road divided by 4, vertex normals up. `buildKerbGeometry(road, heightAt, side)` returns a 0.15 m high, 0.2 m wide kerb strip along an edge for `main` and `street` classes only. Both are headless.',
          'Tests: vertex count equals 2 per sample; width at straight segments equals `road.width` within 1 cm; no degenerate triangles (area under 1e-8) on a 90 degree corner; heights follow the function within 0.06 m; v increases monotonically; kerb height 0.15; a closed loop road does not leave a gap at the seam.',
        ],
        verify: [vt('tests/unit/roads/ribbon.test.js'), exists('src/world/roads/ribbon.js')],
      },
      {
        title: 'Materials, junctions, scene integration and surface lookup',
        items: [
          '`src/world/roads/roads.js`: `buildRoads(town, ctx)` returns `{ root, surfaceAt(x, z), update }` with one merged mesh per class (material: main `stonePaving`, street `gravel`, lane `dirtRoad`, path `dirtRoad` darker tint), kerb meshes merged per side, junction patches (a disc of the higher class material at each intersection of two roads of different class, radius = half the wider road + 1 m, 0.03 m above both) to hide the seams, road-side drainage gutters as a thin dark strip next to kerbs. Roads render with `polygonOffset` so they never fight with the terrain splat.',
          '`src/world/roads/surface.js` (pure, headless): `createSurfaceLookup(town, heightField)` returning `surfaceAt(x, z)` -> `\'stone\'` on main roads and the square, `\'gravel\'` on streets and lanes and paths, otherwise from the terrain splat dominant layer (`grass`, `sand`, `gravel` for dirt, `stone` for rock). A spatial grid of road segments (cell 16 m) keeps the lookup fast.',
          '`tests/unit/roads/surface.test.js`: points on each road class return the mapped surface; a point 10 m off the road on grass terrain returns `grass`; sand near the shoreline; the lookup handles 100000 calls in under 300 ms. `tests/unit/roads/clear.test.js`: build a headless collision world with all anchors as boxes (footprints), plots as boxes, square furniture (from `square.js`), and assert that sampling every 1 m along every road centreline gives `blockedAt` false at radius 0.35 (a plot or lamp on a road is a layout bug; fix the data or the generator inputs, not the test).',
          'Wire `buildRoads` into the world build (the `centre` area for the roads within 120 m of the square, the rest in `v1-world` for now) and remove the v1 straight path tint code from the terrain.',
        ],
        verify: [vt('tests/unit/roads/surface.test.js', 'tests/unit/roads/clear.test.js'), exists('src/world/roads/roads.js', 'src/world/roads/surface.js')],
      },
      {
        title: 'Playwright and a look',
        items: [
          '`tests/e2e/roads.spec.js`: boot; `listObjects()` reports road meshes per class; walking along the main street from the square to the east for 8 s moves the player at least 20 m without being blocked (`playerState()`); `surfaceAt` exposed in the hook as `surfaceAt(x, z)` returns `stone` on the main street; zero console errors; `check:budget` passes.',
          'Shots: add spots `main-street`, `junction`, `lane` to `src/shots.json` and run `npm run shots -- --spots main-street,junction,lane --plan 034`; look for z-fighting, floating kerbs, texture stretching (best effort, fix what you see).',
        ],
        verify: [pw('tests/e2e/roads.spec.js', 15), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/roads/ribbon.test.js', 'tests/unit/roads/surface.test.js', 'tests/unit/roads/clear.test.js'), pw('tests/e2e/roads.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/roads/ribbon.test.js', 'portfolio/tests/unit/roads/surface.test.js', 'portfolio/tests/unit/roads/clear.test.js', 'portfolio/tests/e2e/roads.spec.js'],
  },

  // ---------------------------------------------------------------- 035
  {
    id: '035', name: 'water', title: 'Sea and harbour water with depth colour, shoreline foam, waves and bobbing helpers', epic: 'E3', est: 45,
    arch: 'sections 10.5 and requirement R9, assumption A14',
    goal: [
      'Replace the v1 water plane with a believable sea: depth-based colour from shallow turquoise to deep blue, animated normals, foam along the shore, calm water inside the harbour, Fresnel reflection of the sky and sun glint, correct fog. Wave height is a pure function (`waveHeightAt`) that boats use in epic 5. Simpler on the low tier.',
    ],
    read: ['src/world/water.js', 'src/world/sky.js', 'src/systems/clock.js', 'src/world/terrain/townHeight.js', 'src/world/layout/town.json', 'src/engine/quality.js', 'src/engine/assets.js'],
    steps: [
      {
        title: 'Pure water functions',
        items: [
          '`tests/unit/water/waves.test.js` first. `src/world/water/waves.js`: `waveHeightAt(x, z, t, { calm = 0 })` (sum of 4 sine waves with different directions, amplitude about 0.18 m total at open sea, scaled by `1 - calm`, `calm` in 0..1), `waveNormalAt(x, z, t)` (analytic), `depthAt(x, z, heightField)` (`waterLevel - terrainHeight`, never negative), `shallowFactor(depth)` (0 at depth 3, 1 at depth 0, smooth), `foamAmount(depth, t, x, z)` (0 beyond 0.7 m, strongest between 0.05 and 0.3 m, modulated by a moving noise in 0..1), `harbourCalm(x, z, town)` (1 inside the harbour polygon fading to 0 over 12 m outside it).',
          'Tests: wave height bounded by 0.35 m; periodic in time; the normal is unit length; `shallowFactor` monotonic; `foamAmount` 0 for depth over 0.8 and for depth 0 at the dry edge; `harbourCalm` 1 inside, 0 far outside; determinism.',
        ],
        verify: [vt('tests/unit/water/waves.test.js'), exists('src/world/water/waves.js')],
      },
      {
        title: 'Water mesh and shader',
        items: [
          '`src/world/water/waterMesh.js`: a subdivided disc/square mesh covering the island plus 300 m of sea (finer cells near the shore: a 2 m grid within 320 m of the centre and coarser rings outside, built as separate meshes), per-vertex attribute `depth` computed from the height field, and a `MeshStandardMaterial` extended by `onBeforeCompile` (or a `ShaderMaterial` that includes the fog chunks): colour = mix(deep, shallow, `shallowFactor`), alpha rises with depth (0.55 shallow to 0.92 deep), animated normals from two scrolling procedural noise layers (no canvas texture needed), foam added from `foamAmount` in the fragment shader using a time uniform, Fresnel reflection from `scene.environment`, sun specular. `updateWater(dt, t)` advances the time uniform and keeps the water centred on the player in x and z in steps of 8 m to avoid swimming vertices. Low tier: no foam noise, one normal layer; reduced motion: waves slowed to 20 percent.',
          '`tests/unit/water/waterMesh.test.js`: in Node the mesh builds, the `depth` attribute is finite and non-negative, vertex counts are positive and the low tier has fewer, `updateWater` does not throw; the material has the fog flag enabled.',
          'Remove the v1 `buildWater` plane and generated normal-map canvas use; keep `updateWater` name for the game loop.',
        ],
        verify: [vt('tests/unit/water/waterMesh.test.js'), exists('src/world/water/waterMesh.js')],
      },
      {
        title: 'Playwright and a look',
        items: [
          '`tests/e2e/water.spec.js`: boot with `?quality=high`: `listObjects()` has a `water` object; zero console errors (shader compile errors show up as console errors); `canvasLooksRendered`; on `?quality=low` also boots without errors; `waveHeightAt` is exposed in the hook as `waveHeight(x, z)` and stays under 0.35.',
          'Shots: spots `shore`, `harbour-water` in `src/shots.json` (add), `npm run shots -- --spots shore,harbour-water --plan 035`; look for visible foam, depth gradient, no hard seams at ring borders (best effort; fix).',
        ],
        verify: [pw('tests/e2e/water.spec.js', 15), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/water/waves.test.js', 'tests/unit/water/waterMesh.test.js'), pw('tests/e2e/water.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/water/waves.test.js', 'portfolio/tests/unit/water/waterMesh.test.js', 'portfolio/tests/e2e/water.spec.js'],
  },

  // ---------------------------------------------------------------- 036
  {
    id: '036', name: 'vegetation', title: 'Coconut palms, trees, shrubs, grass and crops: instanced, wind-swayed, placed by area', epic: 'E3', est: 55,
    arch: 'sections 10.4 and requirement R9, decision D21, D29',
    goal: [
      'Replace the v1 trees, rocks and grass with believable South Indian vegetation: coconut palms (hero), neem-like broadleaf trees, banyan on the square (already built), casuarina near the beach, mango trees, banana clusters, shrubs (hibiscus), ferns and undergrowth in the forest, grass tufts and flowers around the player, paddy and crop rows in the farmland, reeds at the harbour edge, and rocks. All instanced with wind sway, placed from the town plan areas with exclusions, scaled by tier. Colliders for trunks.',
    ],
    read: ['src/world/props.js', 'src/world/town/square.js', 'src/world/layout/town.json', 'src/world/layout/geometry.js', 'src/world/terrain/townHeight.js', 'src/world/roads/surface.js', 'src/engine/quality.js', 'src/util/rng.js', 'src/systems/clock.js'],
    steps: [
      {
        title: 'Species builders (headless)',
        items: [
          '`tests/unit/vegetation/species.test.js` first. `src/world/vegetation/species.js` exports `SPECIES` (id -> `{ build(rng, variant) -> { geometries: [{ geometry, material }], height, trunkRadius, lod: [..] }, collider?: { r }, windStrength }`) for: `coconut-palm` (curved ringed trunk 8 to 14 m with a slight lean, 14 to 18 drooping fronds each a bent strip with many leaflet cards, a coconut cluster), `neem` (3 to 6 m trunk, wide dense crown of 5 leaf-card blobs), `mango` (rounded crown), `casuarina` (tall thin with drooping needle clusters), `banana-clump` (3 to 5 plants, big paddle leaves), `shrub-hibiscus` (with red flower dots), `fern`, `grass-tuft`, `flower-patch` (3 colours), `paddy-row` (a 4 m strip of 40 thin blades), `reed-clump`, `rock` (3 variants of displaced icospheres in `stoneRough`/`rockCliff`). Each species yields at most 2 materials and merged geometry, a high and a low detail version (the low version has at most 35 percent of the triangles).',
          'Tests: every species builds in Node with finite geometry; heights in range (palm 8 to 14 m, neem 4 to 8 m, banana 2 to 4 m); triangles per instance: palm high at most 3500 and low at most 1200, tuft at most 40; variants differ for different seeds; the palm trunk is not straight (horizontal offset of the top at least 0.5 m).',
        ],
        verify: [vt('tests/unit/vegetation/species.test.js'), exists('src/world/vegetation/species.js')],
      },
      {
        title: 'Placement rules (pure)',
        items: [
          '`tests/unit/vegetation/scatter.test.js` first. `src/world/vegetation/scatter.js`: `scatterVegetation(town, heightField, { seed, tier })` returns instances `[{ species, x, y, z, rot, scale, variant }]` by rules: coconut palms along the beach line (every 6 to 12 m within the beach polygon edge band), around huts and the harbour, avenue trees (neem) along main street every 15 to 20 m at 4.5 m from the centreline, forest polygon dense mix (neem, mango, casuarina, fern, shrubs; density 1 tree per 55 m2), hill slopes thinner, farmland: paddy rows in rectangles and a few palms on bunds, banana clumps near houses (one per two plots), shrubs and flowers at plot fronts, reeds along the harbour and shore edge, rocks on the beach edge and hill; grass tufts and flowers are NOT in this list (they are chunk-streamed around the player, see next step). Exclusions: road buffer (half width plus 1.2 m), plots and anchors (rect plus 2 m), the square, water (height under the waterline plus 0.3), slope over 0.6 for trees.',
          '`density` follows `TIER_SETTINGS[tier].decorScale` (tree and shrub counts halve on `low`). Returns also `colliders: [{ x, z, r }]` for trunks with `trunkRadius >= 0.15` limited to instances within the town, forest and beach (not grass).',
          'Tests: determinism; exclusions hold for every instance (road, plot, anchor, square, water) over the full set; per-species counts within ranges (palms 120 to 400 on high, total trees at most 1400); low tier count between 40 and 60 percent of high; no two trees closer than 0.8 m; avenue trees sit 4.5 m +- 1 m from main street centreline.',
        ],
        verify: [vt('tests/unit/vegetation/scatter.test.js'), exists('src/world/vegetation/scatter.js')],
      },
      {
        title: 'Instanced rendering, wind, grass chunks, colliders and integration',
        items: [
          '`src/world/vegetation/render.js`: one `InstancedMesh` per species per detail level per spatial chunk of 100 m (frustum culling per chunk), instance matrices from the scatter, LOD by distance with hysteresis (high under 70 m, low beyond), wind sway in the vertex shader via `onBeforeCompile` (a time uniform, sway amplitude by vertex height and species `windStrength`, a phase from the instance position; amplitude 0 when `getReducedMotion()` or tier `low` is on and `windStrength` low), shadows only on the high and medium tiers for palms and trees. `GrassChunks`: grass tuft and flower instances generated per 20 m cell within 60 m of the player (30 m on low), deterministic per cell seed, created and disposed as the player moves (at most 2 cells per frame), excluded from roads, plots, water and sand.',
          'Colliders: trunks go to `game.collision.addCircle` (they are in the broadphase).',
          'Remove the v1 `scatterProps` trees, rocks and grass; keep any v1 prop that is not vegetation. Add `listObjects()` entries `{ type: "vegetation-chunk", species, count }` to the hook, and hook `vegetationStats()` returning `{ instances, drawCalls }`.',
          '`tests/e2e/vegetation.spec.js`: boot with `?quality=high`: `vegetationStats().instances` is over 600; with `?quality=low` it is between 40 and 60 percent of high; walking into a palm trunk (teleport 3 m from a known palm at the beach, walk toward it) is blocked 0.5 m from its centre; the palm tops move over time with sway: sample a hook `windOffset(x, z)` twice 600 ms apart and expect a difference (not with reduced motion); zero console errors; `check:budget` passes with the new spots `beach` and `forest` added to `src/budgets.json`.',
          'Shots: `beach`, `forest`, `avenue` spots in `src/shots.json`; `npm run shots -- --spots beach,forest,avenue --plan 036`; view and fix (best effort).',
        ],
        verify: [pw('tests/e2e/vegetation.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/vegetation/species.test.js', 'tests/unit/vegetation/scatter.test.js'), pw('tests/e2e/vegetation.spec.js', 20), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/vegetation/species.test.js', 'portfolio/tests/unit/vegetation/scatter.test.js', 'portfolio/tests/e2e/vegetation.spec.js'],
    human: 'Look at the palms, forest and beach: do they feel like coastal Tamil Nadu?',
  },
];
