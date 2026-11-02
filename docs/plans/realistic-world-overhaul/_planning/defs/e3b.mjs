import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 037
  {
    id: '037', name: 'town-buildings', title: 'Houses, shop rows, cafe and market from archetype manifests, baked per block', epic: 'E3', est: 55,
    arch: 'sections 3, 10.6 and requirement R9, decision D3, D21, assumption A15',
    goal: [
      'Fill the plots of the town plan with believable buildings. Six archetypes (house-a: single-storey tiled-roof house with a pillared front veranda; house-b: two-storey flat-roof house with a water tank; shop-row: a row of three shops with roll-down shutters and signboards; cafe: an enterable tea and snack cafe; market: an open pillared market hall with stalls; hut: a small thatched fisherman hut) are manifests with parameters, built by the kit, tinted in pastel colours, and baked into merged meshes per 80 m block so 60 buildings cost few draw calls. Extras are not Rich-bar buildings: only the cafe is enterable, the rest have decorative doors and curtain-filled windows.',
    ],
    read: ['src/world/layout/town.json', 'src/world/layout/plots.js', 'src/world/kit/building.js', 'src/world/kit/exterior.js', 'src/world/kit/shell.js', 'docs/building-manifest.md', 'src/content/signage.js', 'src/world/props/catalog.js'],
    steps: [
      {
        title: 'Archetype manifests and the parameterized instance',
        items: [
          '`tests/unit/town/archetypes.test.js` first. `src/world/buildings/_archetypes/` holds `house-a.json`, `house-b.json`, `shop-row.json`, `cafe.json`, `market.json`, `hut.json` (manifests in the standard schema with `id: "archetype-<name>"`). `src/world/town/archetype.js` exports `instantiate(archetypeId, plot, { seed })` returning a manifest copy fitted to the plot (`footprint` from `plot.w` and `plot.d`, rooms scaled proportionally, door on the wall facing `plot.facing`, wall tint chosen from a pastel palette by seed: cream `#f1dfb0`, mint `#b9dccb`, sky `#b8d5e6`, rose `#e8c1bd`, ochre `#e3b869`, white `#f3efe6`; roof material variants; window counts from the footprint).',
          'Details per archetype: house-a gets a veranda (`portico` with 2 to 4 pillars, the thinnai bench `bench-wood` fixed in the veranda, a doorstep with 2 steps), a tiled gable or hip roof, 2 to 3 windows, a water pot stand beside the door; house-b gets a flat roof with parapet, `waterTank`, a balcony, an outside staircase; shop-row three bays each with a `rolling-shutter` mesh (ribbed box, half open on some), a `signboard` with a key from `signage.js` shop names, an awning; cafe has a counter, 4 tables and 12 chairs inside (`counter-straight`, `table-round`, `chair-wooden`, a `fan-ceiling`, `tea-glass-set`, `menu-board`, `lamp-pendant`) and a seat; market is an open hall (roof on 12 pillars, no walls) with 8 stalls of `table-folding` with `crate-fish`-free produce (use `basket-wicker` if present, otherwise `pot-set`); hut uses `thatch` roof, bamboo walls (`woodPlanks` tinted) and a stool.',
          'Tests: `instantiate` for every archetype and a sample plot validates (`validateManifest`), the door faces the plot facing, fits inside the plot, colours come from the palette, the cafe passes `checkBuilding` structure stage with at least 20 distinct types (a small rule: pass `--min-types` 20 in the test call, not the 40 rule), all non-cafe doors are `decorative`.',
        ],
        verify: [vt('tests/unit/town/archetypes.test.js'), exists('src/world/town/archetype.js', 'src/world/buildings/_archetypes/house-a.json', 'src/world/buildings/_archetypes/cafe.json')],
      },
      {
        title: 'Baking static geometry per block',
        items: [
          '`tests/unit/kit/bake.test.js` first. `src/world/kit/bake.js` exports `bakeStatic(group, { exclude })`: for the world-space static meshes under `group` that are not flagged `userData.dynamic` (doors, lamps with emissive toggles, signs that animate), merge geometry per material into one mesh per material (world matrices applied), dispose the originals, keep colliders and interactables untouched, and return `{ meshesBefore, meshesAfter }`. Windows of buildings without an interior get `curtain` fill planes (flat dark `fabric` quads inset 0.12 m with a warm emissive tint toggled by the light manager group `town-windows` at night).',
          '`src/world/town/townBuilder.js`: `buildTown(town, ctx)` groups plots by 80 m grid block, `buildBuilding` each (interior props only for the cafe), `bakeStatic` per block, returns `{ blocks: [{ id, root, bounds }], instances }` so the streamer can register each block as an area (`interior` of the cafe handled by the building itself).',
          'Tests: baking 10 cottage instances reduces mesh count to at most the number of distinct materials times 2; world positions of vertices are unchanged within 1e-4; flagged dynamic meshes survive; `buildTown` on the real `town.json` in Node returns the plot count and every block has at most 40 meshes after baking.',
        ],
        verify: [vt('tests/unit/kit/bake.test.js'), exists('src/world/kit/bake.js', 'src/world/town/townBuilder.js')],
      },
      {
        title: 'Integrate and verify in the browser',
        items: [
          'Register each town block as a streamed area (priority 80 for blocks within 100 m of the square, 40 otherwise, `loadRadius` 160, `unloadRadius` 220) in `src/world/areas/townAreas.js`; remove v1 generic houses if any exist. Plot colliders come from the shell (walls) so you cannot walk through houses; the doors are decorative and closed.',
          '`tests/e2e/town-buildings.spec.js`: boot, ready; `listBuildings()` after teleporting to the main street shows at least 8 buildings loaded; the player cannot walk through a house wall (teleport 2 m in front of a house door, hold `w` for 3 s: the player stays outside the footprint); the cafe door opens and the player can enter (`e`); the cafe has `problems` empty; zero console errors; `check:budget` with new spots `main-street` and `harbour-road` still passes (if over budget raise the baking or reduce details, not the limit).',
          'Shots: `npm run shots -- --spots main-street,house-row --plan 037` (add `house-row`); view and fix (best effort).',
        ],
        verify: [pw('tests/e2e/town-buildings.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/town/archetypes.test.js', 'tests/unit/kit/bake.test.js'), pw('tests/e2e/town-buildings.spec.js', 20)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/town/archetypes.test.js', 'portfolio/tests/unit/kit/bake.test.js', 'portfolio/tests/e2e/town-buildings.spec.js'],
    human: 'Shop and house names are placeholders (A15); judge whether the street feels real.',
  },

  // ---------------------------------------------------------------- 038
  {
    id: '038', name: 'harbour-and-beach', title: 'Fishing harbour: jetty, quay, boats, nets, fish racks, fish market, beach details', epic: 'E3', est: 55,
    arch: 'sections 10.4 and requirement R9, decision D25(c), D21',
    goal: [
      'The fishing harbour and beach of a Tamil Nadu coast: a wooden jetty on piles, a stone quay with bollards and lamps, catamarans (kattumaram) on the sand and in the water, painted fishing boats at moorings, fishing nets on frames and heaped, drying-fish racks, fish crates, wicker baskets, a fish market hall, fishermen huts (from plan 037), a lifebuoy post, driftwood and shells on the beach. Boats carry bobbing metadata for epic 5.',
    ],
    read: ['src/world/layout/town.json', 'src/world/layout/plots.js', 'src/world/props/catalog.js', 'src/world/props/sets/outdoorSeating.js', 'src/world/water/waves.js', 'src/world/town/townBuilder.js', 'src/engine/materials.js', 'src/world/kit/exterior.js'],
    steps: [
      {
        title: 'Harbour props (headless)',
        items: [
          '`tests/unit/props/harbour.test.js` first (the generic `allProps` test also covers these). `src/world/props/sets/harbour.js`, category `harbour`: `catamaran` (5 lashed logs tapering to a raised bow, rope lashings, a small mast stub; 5 to 6 m long; `animated: { kind: "bob", amp: 0.08 }`), `boat-fishing` (wooden hull with a painted stripe, thwarts, an outboard motor, a small cabin on the larger one; 7 to 9 m; bob metadata), `boat-rowing` (3.5 m), `net-rack` (two poles with a draped translucent net: a mesh of crossing thin lines as geometry, alpha-tested), `net-heap` (a lumpy pile with floats), `fish-rack` (bamboo A-frame with 3 rows of small silvery fish shapes), `crate-fish` (plastic crate with fish), `basket-wicker`, `ice-box` (white fish cooler), `bollard`, `mooring-post`, `lifebuoy-post` (a post with a red and white ring), `anchor-prop`, `driftwood`, `shell-cluster`, `rope-coil`, `fish-scale` (a hanging scale on a stand).',
          'Tests: exact list; boats are 3.5 to 9.5 m long and under 3.5 m high; `catamaran` and `boat-fishing` carry `animated.kind === "bob"`; nets are not solid; fish racks have at least 3 rows of fish children before merging is NOT required, but the triangle count is over 300; every type has `size` matching its bounding box.',
        ],
        verify: [vt('tests/unit/props/harbour.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/harbour.js')],
      },
      {
        title: 'Jetty, quay, fish market and placement from the plan',
        items: [
          '`tests/unit/town/harbourLayout.test.js` first. `src/world/town/harbour.js`: `buildHarbour(town, ctx)` builds the jetty (a 4 m wide, 55 m long wooden pier from the quay into the harbour with plank deck, 70 piles under it, handrails on both sides, 8 bollards, 6 lamp posts auto at dusk; the deck is a walkable floor via `addFloor` at 0.9 m above the water; handrails are colliders), the quay edge (stone wall face with a 0.4 m kerb, bollards every 8 m, a few steps down to the water, rubber fenders), the fish market (the `market` archetype plus `crate-fish`, `ice-box`, `fish-scale`, tables, baskets and a corrugated roof), and places everything from `town.boats` and extra data in `town.json` (`harbour.props`: nets, racks, crates, baskets generated by `gen-town.mjs` along the beach and quay; extend the generator and regenerate).',
          'Catamarans on the beach sit on the sand with their keel slightly buried (y from the terrain), in-water boats float at the water level with `y = waterLevel + 0.05` and are NOT walkable (collider box the size of the hull); moored boats lie within 6 m of the jetty or quay. Wading limit already blocks deep water.',
          'Tests: jetty floor is walkable from the quay (walk graph with `addFloor` and quay ground: the end of the jetty is reachable); handrails block stepping off (circle moves toward the edge are blocked); no boat on the beach overlaps a plot or a road; every boat in water has terrain height under the waterline minus 0.3 m; all fish-market props exist in the catalog; counts: catamarans at least 10, boats at least 8, nets at least 6, fish racks at least 6, bollards at least 14.',
        ],
        verify: [vt('tests/unit/town/harbourLayout.test.js'), exists('src/world/town/harbour.js')],
      },
      {
        title: 'Integrate, Playwright and shots',
        items: [
          'Register `harbour` (jetty, quay, market, boats; priority 60, `loadRadius` 170) and `beach` (beach props, palms are vegetation already; priority 40) as streamed areas.',
          '`tests/e2e/harbour.spec.js`: boot, `teleport` to the quay then walk along the jetty by holding `w` for 8 s: `playerState().y` stays within 0.1 of the deck height (0.9) once on the jetty and the player ends at least 30 m from the quay; the handrail blocks sideways movement; `listObjects()` has at least 10 catamarans; zero console errors; `check:budget` spots `harbour` and `beach` pass.',
          'Shots: `harbour`, `jetty`, `beach-boats` spots, `npm run shots --plan 038`; view and fix (best effort).',
        ],
        verify: [pw('tests/e2e/harbour.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/harbour.test.js', 'tests/unit/town/harbourLayout.test.js', 'tests/unit/layout/plots.test.js'), pw('tests/e2e/harbour.spec.js', 20)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/props/harbour.test.js', 'portfolio/tests/unit/town/harbourLayout.test.js', 'portfolio/tests/e2e/harbour.spec.js'],
    unfreeze: ['portfolio/tests/unit/layout/plots.test.js'],
    human: 'Catamaran and net detail must look right to someone who knows the coast (D25).',
  },

  // ---------------------------------------------------------------- 039
  {
    id: '039', name: 'local-detail-and-signage', title: 'Gopuram gate and small temple, street life, Tamil and English signage, local-detail manifest check', epic: 'E3', est: 55,
    arch: 'sections 10.4 and requirement R9, decision D25, assumption A2, A15, A26',
    goal: [
      'The identity of the town: a gopuram-style gate with a small temple at the west entrance (stepped tower with horizontal bands, red and white striped walls, stone steps, oil-lamp stand, flower garlands; NO idols or deity images, A2), street life (kolam patterns at doorsteps, two tea stalls, three parked auto-rickshaws, a town bus at a bus stop with shelter, fruit carts, festival bunting across the main street) and Tamil plus English signs on shops and public places. A manifest check proves every required local item exists in the built world (R9).',
    ],
    read: ['src/world/layout/town.json', 'src/world/town/townBuilder.js', 'src/world/kit/exterior.js', 'src/world/kit/signTexture.js', 'src/content/signage.js', 'src/world/props/sets/harbour.js', 'src/world/props/sets/outdoorSeating.js', 'src/world/roads/surface.js', 'assets/fonts'],
    risks: ['A2 (HIGH-RISK): temple and kolam are modelled respectfully as architecture and pattern only; Tamil strings are drafts for a person to check. D21: more is built by code, so the look is the risk.'],
    steps: [
      {
        title: 'Gopuram gate and temple builders',
        items: [
          '`tests/unit/local/gopuram.test.js` first. `src/world/local/gopuram.js`: `buildGopuram({ tiers = 5, baseW = 9, baseD = 6 })` (a gate with a central passage 3.5 m wide and 4.5 m high, a stone base, then 5 tiers each smaller than the last with horizontal moulding bands, small arched niches left EMPTY (no figures), vertical red and white stripes on the lower walls, a barrel-vault crown with a row of 7 kalasam finials in brass, total height 14 to 18 m); `buildSmallTemple()` (a square sanctum with a pyramidal vimana roof, an entrance mandapa on 8 pillars, a stone plinth and 5 steps, a flagpole (dhwajasthambam) and a stone oil-lamp pillar with 12 lamp cups, a perimeter wall with a gate; the sanctum interior is empty and its door is open but decorative). `buildGarland(path)` marigold strings as small orange and yellow bead meshes along a catenary between two points (instanced).',
          'Tests: gopuram height 14 to 18 m, 5 tiers (child groups named `tier-1`..`tier-5`) with decreasing widths, a passage that a 0.35 m circle can walk through (collider check with the walk graph on the generated colliders), 7 finials; the temple has an open entrance reachable from outside; no mesh or material in either builder is named with the words `idol`, `deity`, `statue` (a naming guard); garland points lie on a catenary (sag between 0.3 and 1.0 m for a 6 m span).',
          'Place the gopuram and temple at the west entrance on the main road (data in `town.json` `local.gate` and `local.temple`, regenerate with the script if needed) so the main road passes through the gate passage.',
        ],
        verify: [vt('tests/unit/local/gopuram.test.js'), exists('src/world/local/gopuram.js')],
      },
      {
        title: 'Street life props and placement',
        items: [
          '`tests/unit/local/streetLife.test.js` first. `src/world/props/sets/street.js`, category `street`: `auto-rickshaw` (three-wheeler: yellow canopy, black lower body, one front wheel, open sides, driver seat and a rear bench; 2.7 m long), `bus-town` (a 10 m single-deck bus in two-tone paint with a destination board using a text slot, windows, wheels), `bus-stop-shelter` (roof, back wall, bench), `tea-stall` (a wooden kiosk with a tin roof, a counter, a kettle on a stove, glass jars of biscuits, a hanging banana bunch, a stool bench), `fruit-cart` (two-wheel pushcart with an awning and baskets of fruit blobs), `bunting` (a string of triangular flags between two poles with 12 flags), `kolam` (a flat decal mesh 1.6 m wide: in the browser a canvas texture of a dotted geometric pattern in white on a transparent background drawn with a seeded generator (4 pattern families); in Node a plain white disc), `water-pot-stand`, `scooter` (parked motorbike) and `cycle-parked`.',
          '`src/world/local/placeLocal.js`: places 25 or more kolam at house doorsteps (house plots, in front of the door), 2 tea stalls (one at the square, one at the harbour road), 3 auto-rickshaws (square, market, ferry terminal), the bus and its stop shelter near the ferry terminal anchor, 3 fruit carts on the main street, 6 bunting strings across the main street between poles every 30 m, scooters and cycles at shop rows. Data is deterministic from `town.json` and a seed; none overlap roads (carts and autos sit on the road edge or plot front) or other solid items.',
          'Tests: exact type list and sizes (auto 2.5 to 3.0 m long; bus 9 to 11 m); `kolam` is not solid and under 0.02 m high; placement counts and non-overlap with the clear-road rule of plan 034 (re-run the road clearance with these items as colliders: autos and carts must not block the main street centre lane); every placed item exists in the catalog.',
        ],
        verify: [vt('tests/unit/local/streetLife.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/street.js', 'src/world/local/placeLocal.js')],
      },
      {
        title: 'Signage placement and the local-detail manifest check',
        items: [
          'Extend `src/content/signage.js` with shop and place names (placeholders per A15, English and Tamil drafts): `kumar-stores` Kumar Stores / குமார் கடை, `anbu-tea` Anbu Tea Stall / அன்பு தேநீர் கடை, `selvi-tailors` Selvi Tailors / செல்வி தையல், `tn-bakery` Tamilnadu Bakery / தமிழ்நாடு பேக்கரி, `fresh-fish` Fresh Fish / புதிய மீன், `medical` Medical Shop / மருந்தகம், `provision` Provision Store / மளிகை கடை, `barber` Barber Shop / முடிதிருத்தகம், `fish-market` Fish Market / மீன் சந்தை, `bus-stop` Bus Stop / பேருந்து நிலையம், `harbour` Harbour / துறைமுகம், `welcome` Welcome / நல்வரவு. Each shop row bay and each public place gets a `signboard` with its key (at least 12 signs with both scripts in the town). The existing signage test of plan 025 keeps passing.',
          '`src/world/layout/localDetail.json` lists the required items and minimum counts: `gopuram` 1, `temple` 1, `kolam` 20, `tea-stall` 2, `auto-rickshaw` 3, `bus-town` 1, `bus-stop-shelter` 1, `fruit-cart` 3, `bunting` 6, `catamaran` 10, `net-rack` 4 (nets in total at least 6 with heaps), `fish-rack` 4, `jetty` 1, `fish-market` 1, `signage-tamil` 12.',
          '`scripts/check-local-detail.mjs` (exports `checkLocalDetail({ root })`; CLI exit 1 on a miss; add it to `package.json` as `check:local`): builds the placement lists headless (`placeLocal`, harbour, `buildTown`) and counts each item by `userData.localItem` (every builder and placement sets it); also checks the Tamil font file `assets/fonts/noto-sans-tamil-tamil-400.woff2` and `assets/licenses/OFL-noto-sans-tamil.txt` exist (A26). `tests/unit/local/localDetail.test.js` runs it on the real data and on a trimmed data set that must fail.',
          'Register the gate and temple as an area `west-gate` (priority 50), street life items inside the `centre`, `harbour` and town block areas as appropriate.',
        ],
        verify: [vt('tests/unit/local/localDetail.test.js'), node('scripts/check-local-detail.mjs'), exists('src/world/layout/localDetail.json', 'scripts/check-local-detail.mjs')],
      },
      {
        title: 'Playwright and shots',
        items: [
          '`tests/e2e/local-detail.spec.js`: boot; walk through the gate passage along the main road (teleport 12 m west of the gate facing east, hold `w` for 8 s: the player passes the gate line x and is not blocked); `listObjects()` contains the local items with counts at or above `localDetail.json`; the sign material text contains a Tamil character for at least 12 signs (hook `listSigns()` returning `[{ key, en, ta }]`); zero console errors; `check:budget` passes.',
          'Shots: `gopuram`, `temple`, `street-life`, `tea-stall`, `shop-signs` spots; `npm run shots --plan 039`; view and fix obvious defects (best effort). Do not add deity imagery.',
        ],
        verify: [pw('tests/e2e/local-detail.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 15 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/local/gopuram.test.js', 'tests/unit/local/streetLife.test.js', 'tests/unit/local/localDetail.test.js', 'tests/unit/content/signage.test.js'), node('scripts/check-local-detail.mjs'), pw('tests/e2e/local-detail.spec.js', 20)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/package.json'],
    freeze: ['portfolio/tests/unit/local/gopuram.test.js', 'portfolio/tests/unit/local/streetLife.test.js', 'portfolio/tests/unit/local/localDetail.test.js', 'portfolio/tests/e2e/local-detail.spec.js'],
    human: 'A person from Tamil Nadu should check the gopuram, temple, kolam, catamaran and every Tamil string (D25, A2).',
  },

  // ---------------------------------------------------------------- 040
  {
    id: '040', name: 'world-integration', title: 'World integration: areas, minimap, fog, tour of every area, budgets, review pack', epic: 'E3', est: 50,
    arch: 'sections 6 (Streaming), 10.4 and requirement R9, decision D14, A13',
    goal: [
      'Close epic 3: all areas stream in the right order for the bigger world, the minimap shows the real island (roads, water, labels), fog and view distance suit 300 m, every area passes the budget, a tour test teleports to every area and checks the player stands on the ground and nothing errors, and a review pack for the person is written. Fast travel keeps the whole island reachable in time (walk time already tested in plan 032).',
    ],
    read: ['src/main.js', 'src/engine/streaming.js', 'src/world/areas', 'src/ui/minimap.js', 'src/world/sky.js', 'src/systems/clock.js', 'src/budgets.json', 'src/shots.json', 'src/world/layout/town.json'],
    steps: [
      {
        title: 'Area table, priorities and tier rules',
        items: [
          '`tests/unit/world/areas.test.js` first. `src/world/areas/index.js` exports `createAllAreas(game, town)` returning the final table: `centre` (100), `hotel` (100), `town-<block>` (80 near the square, 40 elsewhere), `harbour` (60), `beach` (40), `west-gate` (50), `forest` (30), `hill-and-outskirts` (20), `v1-world` (the 13 remaining v1 landmarks, 50, until epic 4 replaces them). Every area has `loadRadius < unloadRadius`, a centre inside the island and a unique id. Phone tier (`low`): vegetation and town block areas use `TIER_SETTINGS.low.viewDistance` for their load radii.',
          'Tests: ids unique; sorted order of `priority` then distance from the spawn puts `centre`, `hotel` first; all areas together cover every anchor, plot, boat and vegetation chunk (each plot belongs to exactly one block area); low-tier radii are smaller.',
        ],
        verify: [vt('tests/unit/world/areas.test.js'), exists('src/world/areas/index.js')],
      },
      {
        title: 'Minimap, fog and view distance',
        items: [
          '`src/ui/minimap.js`: draw the island from the data: sea colour, land polygon (the heightfield sampled on a coarse 6 m grid cached once into an offscreen canvas, land vs shallows vs sea), roads by class (width and colour), the harbour, the player arrow, and a letter or small icon per landmark with the zone display name on hover or in the legend; a larger map is plan 068. `tests/unit/ui/minimapData.test.js`: the pure function `buildMinimapLayers(town, heightField)` returns road polylines, landmark list of 14, and a land mask of the expected size (a function so the canvas drawing stays thin).',
          'Fog and sky: fog density scales with `viewDistance` of the tier; the sun shadow frustum follows the player (already) with size from the tier; far scenery fades into fog, nothing pops closer than 150 m (check by teleport tests only).',
        ],
        verify: [vt('tests/unit/ui/minimapData.test.js'), exists('src/ui/minimap.js')],
      },
      {
        title: 'World tour test, budgets and the review pack',
        items: [
          '`tests/e2e/world-tour.spec.js`: for each of these spots (hotel lobby, square, main street, harbour quay, jetty end, beach, forest edge, hill top near the broadcast anchor, west gate, lighthouse anchor, farmland): `teleport`, wait 1.5 s, assert the ground rule (`playerState().y` within 0.15 m of the standing surface), `rendererInfo().calls` under the budget, no console errors during the whole tour, and `streamState()` has no area in state `failed`. Time between spots is under 20 s each.',
          'Auto-walk for tests (journeys 3, 4 and 7 need long walks): `src/dev/autoWalk.js` and the hook `walkTo(x, z, { sprint = true, timeoutMs = 90000 })` returning a promise that resolves `{ arrived, blocked, x, z }`. It plans a route with the road graph of `src/world/layout/walk.js` (nearest road point to start, shortest road path, nearest road point to target) and steers the player by feeding the same movement input the controller reads (so collision and doors behave as for a person), turning toward the next waypoint; it stops when within 1.5 m of the target, when blocked for 3 s, or on timeout. `tests/unit/dev/autoWalk.test.js` tests the pure steering function (`steerToward(pos, target, yaw)` gives forward and turn values; waypoint advance); `tests/e2e/auto-walk.spec.js`: from the harbour quay `walkTo` the square resolves `arrived: true` in under 90 s of test time.',
          'Add the budget spots `main-street`, `harbour`, `beach`, `forest`, `west-gate`, `lighthouse-road` to `src/budgets.json` (if missing) and run `npm run check:budget`: both profiles pass. If a spot is over budget find the cause with `rendererInfo()` and fix (merge more, instancing, shorter distances, hide far interiors); never raise a limit.',
          'Write `docs/review/town-review.md` (what to look at, the screenshot list under `docs/shots/040/`, known gaps: 13 landmarks are still v1 boxes, no NPCs, weather or new audio) and produce the shots for 12 spots day and 4 at night with `npm run shots --plan 040`; view them and fix visible defects (best effort).',
        ],
        verify: [pw('tests/e2e/world-tour.spec.js', 30), pw('tests/e2e/auto-walk.spec.js', 15), vt('tests/unit/dev/autoWalk.test.js'), { cmd: 'npm run check:budget', timeout_min: 15 }, exists('docs/review/town-review.md')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/world/areas.test.js', 'tests/unit/ui/minimapData.test.js'), pw('tests/e2e/world-tour.spec.js', 30), pw('tests/e2e/journey-1-arrive.spec.js', 15), { cmd: 'npm run check:budget', timeout_min: 15 }, npm('check:ledger'), npm('check:size')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/review/**'],
    freeze: ['portfolio/tests/unit/world/areas.test.js', 'portfolio/tests/unit/ui/minimapData.test.js', 'portfolio/tests/e2e/world-tour.spec.js', 'portfolio/tests/e2e/auto-walk.spec.js', 'portfolio/tests/unit/dev/autoWalk.test.js'],
    human: 'Milestone of epic 3: walk the town, harbour, beach and forest and tell the planner what to change before epic 4.',
  },
];
