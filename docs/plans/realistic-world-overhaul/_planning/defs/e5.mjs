import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 058
  {
    id: '058', name: 'npc-core', title: 'NPC core: cheap skinned people, routines, path following and player avoidance', epic: 'E5', est: 55,
    arch: 'sections 10.4, 10.5 and requirement R10, decision D8, D23, assumption A27',
    goal: [
      'The engine of ambient people. A skinned single-mesh version of the procedural humanoid (about one draw call per person, vertex-coloured clothes), extra work and sit clips, an NPC state machine (walk a route, idle, sit on a seat, work), outdoor path following on the walk graph, indoor waypoint loops on one floor only (A27), soft avoidance of the player, and hard walls through the collision world. No conversations, no greetings (D23).',
    ],
    read: ['src/entity/avatar/humanoid.js', 'src/entity/avatar/clips.js', 'src/entity/avatar/loadAvatar.js', 'src/systems/nav/walkGraph.js', 'src/systems/collision/world.js', 'src/systems/interaction/sit.js', 'src/engine/quality.js', 'src/world/kit/building.js'],
    steps: [
      {
        title: 'Skinned humanoid with vertex colours and extra clips',
        items: [
          '`tests/unit/npc/skinned.test.js` first. `src/entity/avatar/skinnedHumanoid.js`: `buildSkinnedHumanoid({ skin, shirt, trousers, shoes, hair, heightScale, seed })` builds the same body parts as `buildHumanoid`, merges all part geometries into one `BufferGeometry` with a `color` vertex attribute (skin, shirt, trousers, shoes, hair), `skinIndex` and `skinWeight` (each part rigidly weighted 1.0 to the bone of its joint), and returns `{ root, mesh (SkinnedMesh), bones: { <jointName>: Bone }, height }` with bone names exactly the joint names of the existing humanoid and the same rest pose, so `buildClips(bones)` from plan 008 works unchanged. Material: one `MeshStandardMaterial` with `vertexColors`, shared by all NPCs; the mesh has at most 3500 triangles.',
          '`src/entity/avatar/clipsExtra.js`: `buildExtraClips(joints)` returns `work` (a 2.4 s loop: right forearm and hand move small circles as if writing or typing, head nods slightly) and `hammer` (1.2 s: right arm raise and strike), and `stand-talk` (3 s idle with small gestures but NO speech). Do not edit `clips.js`.',
          'Tests: bone names equal the joint names list; exactly one `SkinnedMesh` and one geometry; triangles at most 3500; bind pose height 1.65 to 1.85 with `heightScale`; the existing four clips and the new three bind to the bones and rotate the right bone at t = 0.5 s (mixer test); two NPCs with different seeds have different vertex colours; memory: building 50 NPCs shares one geometry buffer per seed class (at most 6 geometry variants) and one material.',
        ],
        verify: [vt('tests/unit/npc/skinned.test.js'), exists('src/entity/avatar/skinnedHumanoid.js', 'src/entity/avatar/clipsExtra.js')],
      },
      {
        title: 'NPC state machine and movement',
        items: [
          '`tests/unit/npc/npc.test.js` first. `src/world/npc/npc.js`: `class Npc` with `id`, `home`, `kind` (`walker|sitter|worker|loop`), `update(dtMs, ctx)`. States `idle`, `walking`, `waiting`, `sitting`, `working`. Routes: `{ type: "path", points: [[x, z], ...], loop: true|false, dwellMs: [min, max] }` (outdoor, each leg uses `findPath` from the walk graph, cached per leg) and `{ type: "loop", waypoints: [[x, z], ...] }` (indoor, straight legs, the NPC y stays constant: a loop whose waypoints differ in ground height by more than 0.1 m is rejected at construction, and a loop never contains a stair or lift cell); `sitter` goes to a seat (`seats` of the placed prop, uses the `sit` clip, stays seated for 20 to 60 s then walks a short loop and returns); `worker` stands at a spot and plays `work` or `hammer` clips.',
          'Movement: speed 1.0 to 1.4 m/s with the `walk` clip speed matched (time scale = speed / 1.2), turning smoothed, movement through `world.moveCircle` with radius 0.3 so walls and closed doors always stop an NPC (a blocked NPC waits 2 s, then picks the next waypoint); NPCs do not collide with each other (soft separation of 0.5 m by steering); avoidance of the player: when the player is within 1.6 m and in front, the NPC waits (or steps aside 0.6 m to the right) for up to 3 s; NPCs never open doors by themselves (indoor routes stay inside their room or pass doors that are open or decorative gaps).',
          'Tests: a loop route stays on the loop within 0.3 m; an indoor loop with a stair cell is rejected; a path route follows the walk graph and never crosses a wall box (sample every frame in a simulated 120 s run with fake time); blocked NPC recovers; player avoidance waits then continues; sitter seats and stands; worker clip names; speed within range; deterministic with the same seed.',
        ],
        verify: [vt('tests/unit/npc/npc.test.js'), exists('src/world/npc/npc.js')],
      },
      {
        title: 'NPC manager, LOD and the hook',
        items: [
          '`src/world/npc/manager.js`: `class NpcManager` with `add(npc)`, `update(dtMs, playerPos)`, `setTier`, `list()`. NPCs farther than 90 m (60 m on low) from the player are hidden (`visible = false`) and not updated except for a cheap time-skip when they come back (they resume at a point along their route computed from elapsed time); at most `ceil(80 * npcScale)` NPCs visible at once; animation mixers update only for visible NPCs within 40 m, farther ones freeze on the current pose. Positions are exposed through the hook `listNpcs()` as `[{ id, kind, state, x, y, z, visible }]` and `isBlocked(x, z, y, r)` (collision query).',
          '`tests/unit/npc/manager.test.js`: far NPCs hidden and not stepped; the visible cap holds; resume point is on the route; tier change rescales the cap; `list()` plain data.',
          'Temporary fixture `?fixture=npcs`: a flat floor with 6 NPCs of each kind and a wall with a gap so the avoidance and walls can be seen. `tests/e2e/npc-core.spec.js`: `listNpcs()` has 18 entries; over 20 s of sampling every second no NPC position satisfies `isBlocked(x, z, y, 0.25)` (nobody inside a wall); a walker moves at least 10 m in 20 s; a sitter becomes `sitting`; zero console errors; draw calls of the fixture stay under 120.',
        ],
        verify: [vt('tests/unit/npc/manager.test.js'), pw('tests/e2e/npc-core.spec.js', 15), exists('src/world/npc/manager.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/npc/skinned.test.js', 'tests/unit/npc/npc.test.js', 'tests/unit/npc/manager.test.js', 'tests/unit/avatar/humanoid.test.js'), pw('tests/e2e/npc-core.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/npc/skinned.test.js', 'portfolio/tests/unit/npc/npc.test.js', 'portfolio/tests/unit/npc/manager.test.js', 'portfolio/tests/e2e/npc-core.spec.js'],
    human: 'The people are simple figures; judge whether they read as people from a normal distance.',
  },

  // ---------------------------------------------------------------- 059
  {
    id: '059', name: 'npc-population', title: 'Populate the town and the buildings with ambient people', epic: 'E5', est: 55,
    arch: 'sections 10.6 (npcLoops) and requirement R10, decision D8, D23, assumption A27',
    goal: [
      'Place the people: pedestrians on the streets, shoppers, a tea vendor and fruit seller at work, fishermen mending nets, children in the school yard, people waiting at the bus stop and on benches in the square, and indoors the receptionist, waiters, cooks, office workers, clerks, students, readers. Each building manifest gets `npcLoops`. Counts follow the tier. At night fewer people are outside.',
    ],
    read: ['src/world/npc/npc.js', 'src/world/npc/manager.js', 'src/world/layout/town.json', 'src/world/layout/walk.js', 'src/world/layout/square.js', 'src/world/buildings', 'src/world/areas/index.js', 'src/world/props/sets/street.js'],
    steps: [
      {
        title: 'Population data and generator',
        items: [
          '`tests/unit/npc/population.test.js` first. `src/world/npc/population.js` exports `buildPopulation({ town, manifests, seed, tier, nightFactor })` returning NPC definitions `{ id, kind, seed, look: { skin, shirt, trousers, hair, heightScale }, route | loop | seat | spot }`. Outdoor (high tier targets): 14 pedestrians walking road-to-road loops of 80 to 300 m between landmarks and plots (using the road graph; never inside the square platform), 4 shoppers lingering at shop rows, 2 vendors (`worker` at the tea stalls and 1 at a fruit cart), 5 fishermen (`worker` with `work` at nets and racks, 2 sitting at the jetty edge), 4 children running short loops in the academy yard, 4 people waiting at the bus stop and the ferry terminal (`sitter` on shelter benches), 4 sitters on square benches, 1 watchman at the gatehouse. Indoor: from each manifest `npcLoops` and seats: hotel receptionist (`worker` at the desk), 2 waiters on loops in the restaurant, 2 cooks (`worker` at stoves), 3 guests sitting in the lobby, post clerk at the counter and a customer waiting, office workers at the newsroom desks (4 `worker`), meeting-room 4 sitters, studio presenter at the news desk (`worker` while ON AIR), lab students (4 `sitter`), classroom 8 students sitting and a teacher at the blackboard (`worker`), library readers 5 (`sitter`) and the librarian, cafe 6 (`sitter` and a barista `worker`), workshop 3 workers (`hammer`), studio 3 designers, lighthouse keeper in the cottage living room, town hall clerk, ferry terminal counter clerk. Indoor NPCs never use stairs or lifts (A27).',
          'Edit the manifests (`src/world/buildings/*/manifest.json`) to add `npcLoops` and extra `npcSeats` references; manifest schema already allows `npcLoops` (extend `schema.js` only if it rejects them; add the test in a NEW file `tests/unit/kit/npcLoops.test.js`).',
          'Rules and tests: every outdoor route point is on a walkable cell reachable from the nearest road (walk graph); every indoor loop waypoint is inside its room bounds, on the right floor y, at least 0.5 m from walls and not on a stair or lift footprint; loop legs do not cross solid props (raycast in the headless building); every seat id used exists as a seat interactable; totals: high tier at least 60 and at most 90 NPCs, low tier between 40 and 60 percent of high; at night (`nightFactor` 1) outdoor pedestrians and shoppers are at most 40 percent; determinism; unique ids; looks vary (at least 8 distinct shirt colours).',
        ],
        verify: [vt('tests/unit/npc/population.test.js', 'tests/unit/kit/npcLoops.test.js'), exists('src/world/npc/population.js')],
      },
      {
        title: 'Spawn through the streamed areas and Playwright',
        items: [
          'Each streamed area (town blocks, harbour, hotel and the landmark areas) registers its NPCs with the `NpcManager` when it loads and removes them on unload (`areaNpcs(areaId)`); the global `NpcManager` is created in `main.js` and updated from the game loop; the tier and night factor re-run `buildPopulation` filters (hide or show NPCs, no rebuild of meshes).',
          '`tests/e2e/npc-population.spec.js`: boot with `?quality=high&time=0.4`: after `walkTo` the square `listNpcs()` has at least 8 visible NPCs within 60 m; teleport into the hotel lobby: at least 3 NPCs visible there and the receptionist is `working`; sample all visible NPC positions every 1.5 s for 45 s: none is inside a wall (`isBlocked` false for radius 0.25) and none changes height by more than 0.2 m while indoors (A27); with `?quality=low` the total listed NPCs are between 40 and 60 percent of the high count; `check:budget` spots pass with NPCs present (they add draw calls: if over, raise instancing efficiency, never the limit); zero console errors.',
        ],
        verify: [pw('tests/e2e/npc-population.spec.js', 25), { cmd: 'npm run check:budget', timeout_min: 20 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/npc/population.test.js', 'tests/unit/kit/npcLoops.test.js'), pw('tests/e2e/npc-population.spec.js', 25), node('scripts/check-buildings.mjs --all')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/npc/population.test.js', 'portfolio/tests/unit/kit/npcLoops.test.js', 'portfolio/tests/e2e/npc-population.spec.js'],
    human: 'Walk the town: do the people feel natural, or do they look robotic or in the way?',
  },

  // ---------------------------------------------------------------- 060
  {
    id: '060', name: 'animals-nature', title: 'Seagulls, crows, forest birds, fish, crabs and butterflies', epic: 'E5', est: 55,
    arch: 'sections 10.4 and requirement R10, decision D8(b)',
    goal: [
      'Living nature: seagulls circling over the harbour and beach and gliding along the shore, crows perched on roofs and lamp posts that now and then fly to another perch, small birds flitting between forest trees, schools of fish under the shallow water near the jetty, crabs scuttling on the beach, butterflies over gardens and flowers. Motion is a set of pure, deterministic functions of time and a seed, drawn with instancing. Counts follow the tier; reduced motion halves speeds. Trees, grass and waves already sway (plans 035 and 036).',
    ],
    read: ['src/world/vegetation/render.js', 'src/world/water/waves.js', 'src/world/layout/town.json', 'src/world/terrain/townHeight.js', 'src/engine/quality.js', 'src/util/rng.js', 'src/systems/clock.js'],
    steps: [
      {
        title: 'Pure motion models',
        items: [
          '`tests/unit/life/motion.test.js` first. `src/world/life/motion.js` exports pure functions `gullPose(t, seed, region)` (an orbit of radius 18 to 70 m around a centre in the region, altitude 10 to 35 m with slow altitude drift, speed 6 to 10 m/s, banking angle from curvature, a flap phase), `crowPose(t, seed, perches)` (stays on a perch for 20 to 90 s with small head turns, then flies a smooth arc of 2 to 4 s to another perch within 60 m), `birdPose(t, seed, treeSpots)` (hops and flits between tree spots in the canopy band 3 to 9 m high, 1 to 3 s legs), `fishPose(t, seed, school)` (a school of 14 fish orbiting inside an ellipse of 3 by 2 m at depth 0.3 to 1.2 m with sinusoidal tail wiggle phase; only exists where water depth is over 0.6 m), `crabPose(t, seed, home)` (sideways scuttles of 0.3 to 1.2 m in bursts, pauses 2 to 7 s, stays within 3 m of home on sand), `butterflyPose(t, seed, patch)` (a flutter path within a 6 m patch at 0.4 to 1.6 m above ground, wing flap phase at 8 Hz). All return `{ x, y, z, yaw, pitch, roll, phase }`; none uses `Math.random` or the wall clock.',
          'Tests: gull stays inside its radius and altitude bands for 600 simulated seconds and its speed stays within bounds (numerical derivative); crow positions are always on a perch or on an arc between two perches; birds stay inside the canopy band; fish depth within bounds; crabs never leave 3 m from home; butterflies altitude bounds; all deterministic for the same seed and different for another; no NaN.',
        ],
        verify: [vt('tests/unit/life/motion.test.js'), exists('src/world/life/motion.js')],
      },
      {
        title: 'Instanced rendering, placement and tiers',
        items: [
          '`src/world/life/nature.js`: builds one `InstancedMesh` per kind (low-poly gull with two wing quads whose flap is a vertex-shader rotation from the phase attribute, crow, bird, fish with a tail wiggle in the vertex shader, crab with scuttle legs as a static mesh with a small bob, butterfly with two wing quads), places the regions from the town plan (gull regions: harbour, beach, jetty tip; crow perches: roof ridges and lamp posts of the town blocks (take from the placed buildings and lamp props within the area), bird spots: tree instances in the forest polygon, fish schools: harbour water near the jetty and quay with depth over 0.6 m, crab homes: beach polygon sand cells, butterfly patches: planters, gardens and the flower patches of vegetation near houses). Counts on high: 24 gulls, 10 crows, 20 forest birds, 5 fish schools, 30 crabs, 24 butterflies; scaled by `TIER_SETTINGS[tier].particleScale`; reduced motion halves the speeds; no animals inside buildings.',
          'Update: only entities within 120 m of the player are stepped (the rest are hidden); the per-frame CPU work stays under 1.0 ms on the high tier (assert in a unit test with 200 entities stepping 100 frames in under 120 ms in Node).',
          '`tests/e2e/nature.spec.js`: boot: `listObjects()` has kinds `gull`, `crow`, `bird`, `fish`, `crab`, `butterfly` with counts; the positions of the first gull differ by at least 3 m between two samples 1 s apart; every crab `y` is within 0.3 m of the ground (use `terrainHeight`); on `?quality=low` counts are 40 to 60 percent of high; with the reduced-motion setting the same gull moves less than half the distance in 1 s; zero console errors; `check:budget` still passes.',
        ],
        verify: [pw('tests/e2e/nature.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 20 }, exists('src/world/life/nature.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/life/motion.test.js'), pw('tests/e2e/nature.spec.js', 20)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/life/motion.test.js', 'portfolio/tests/e2e/nature.spec.js'],
  },

  // ---------------------------------------------------------------- 061
  {
    id: '061', name: 'moving-things', title: 'Boats on routes, the bus, flags, real-time clocks, ceiling fans, lighthouse beam, blinking lights', epic: 'E5', est: 55,
    arch: 'sections 10.5 and requirement R10, decision D8(c)',
    goal: [
      'Everything that moves on a fixed rule: catamarans and boats bobbing on the waves, fishing boats sailing a loop out of the harbour and back, the ferry docked and swaying, the town bus driving its route and stopping at the bus stop, an auto-rickshaw loop, flags and bunting waving, every wall clock showing the real time, ceiling fans spinning, the lighthouse beam sweeping with a real spot light at night, red mast lights blinking. A generic animator registry reads the `userData.animated` metadata that props already carry.',
    ],
    read: ['src/world/props/sets/harbour.js', 'src/world/props/sets/air.js', 'src/world/props/sets/decor.js', 'src/world/props/sets/street.js', 'src/world/water/waves.js', 'src/world/town/harbour.js', 'src/world/buildings/lighthouse/build.js', 'src/world/buildings/broadcast/build.js', 'src/systems/lights/lightManager.js', 'src/world/layout/walk.js'],
    steps: [
      {
        title: 'Animator registry and kinds',
        items: [
          '`tests/unit/life/animators.test.js` first. `src/world/life/animators.js`: `AnimatorSet` with `register(object, meta)` (meta from `userData.animated`: `{ kind: "spin"|"bob"|"blink"|"hands"|"flag"|"swing", ... }`), `scan(root)` (registers every descendant with the metadata), `update(dtMs, playerPos, tNow)` stepping only objects within 70 m of the player (and always the lighthouse beam). Kinds: `spin` (rotation about the axis at `speed` rad/s, fans 6 rad/s and a slow globe), `bob` (`waveHeightAt` plus roll and pitch from the wave normal, amplitude `amp`), `blink` (period 1.2 s, 0.3 s on, emissive intensity toggle), `hands` (clock: finds children `hand-hour` and `hand-minute` and sets their rotation from the real local time: hour = (h mod 12 + m / 60) * 30 degrees, minute = (m + s / 60) * 6 degrees), `flag` (a vertex wave on the cloth plane with amplitude by an assumed wind of 0.4 to 1.0, phase from position).',
          'Tests: spin angle after 1 s; bob stays within `amp` plus 0.05 of the wave and follows the wave phase; blink duty cycle; `hands` at 15:15:30 gives hour hand 97.75 degrees and minute hand 91.0 degrees (and at midnight both 0); `flag` vertices stay within amplitude; objects farther than 70 m are not stepped; reduced motion slows spin and flags to 30 percent.',
        ],
        verify: [vt('tests/unit/life/animators.test.js'), exists('src/world/life/animators.js')],
      },
      {
        title: 'Routes: boats, bus, auto-rickshaw',
        items: [
          '`tests/unit/life/routes.test.js` first. `src/world/life/routes.js`: `RouteFollower({ points, speed, loop, dwell: [{ at: index, ms }] })` with `update(dtMs)` returning `{ x, z, yaw, progress, dwelling }` (smooth corners with a turning radius, constant speed along the polyline, dwell at marked points). Data in `town.json` `routes`: `fishing-loop` (a fishing boat sails from the harbour mouth out 120 m to sea and back, 1.6 m/s, over water cells only), `fishing-loop-2`, `catamaran-drift` (a slow 12 m circle, 0.3 m/s), `bus` (a loop along the main street and ring road passing the bus stop with a dwell of 8 s there; speed 6 m/s), `auto` (a shorter street loop, 5 m/s). Regenerate `town.json` with `scripts/gen-town.mjs` or edit by hand and cover it in the test.',
          'Tests: follower stays on the polyline within 0.5 m (corner smoothing excepted: within 1.5 m); loop wraps; dwell holds the position for the given time; every boat route point is on water (height under the waterline minus 0.5 m) and every bus and auto route point is on a road with no solid collider within 1.5 m (use the road clearance world of plan 034); the bus never passes through the square platform.',
          'Hook the followers to the objects: boats `bob` plus route, the bus and the auto drive their route as `non-solid` objects: when the player is within 8 m ahead on the road the vehicle slows to a stop and waits (no collision damage, no ragdoll), then continues; the ferry stays docked and only bobs. Add them to `listObjects()` as `{ type: "vehicle", id, x, z }`.',
        ],
        verify: [vt('tests/unit/life/routes.test.js'), exists('src/world/life/routes.js')],
      },
      {
        title: 'Lighthouse beam, blinking mast lights, wiring and Playwright',
        items: [
          'Lighthouse: the `lens-fresnel` spins (`spin` 0.6 rad/s) and a `SpotLight` (distance 220, angle 0.12, penumbra 0.6) is attached to the lens and rotates with it; the spot is on only when `nightFactor` is over 0.5 or the weather gloom is high; it is a pool-exempt light (one special light) and is disabled on the `low` tier (the emissive lens still glows). A faint beam cone mesh (additive, very low opacity) follows the spot at night on medium and high.',
          'Wiring: scan every building and prop root with `AnimatorSet.scan` when it loads; flags on the town hall, academy and post office masts, bunting strings get the `flag` kind; `wall-clock` objects everywhere use `hands`; `fan-ceiling` objects spin only when the room light group is on or the player is in the room (fans in empty dark rooms may stay still); the mast `blink` lights.',
          '`tests/e2e/moving-things.spec.js`: boot with `?time=0.75&freeze=1`: `listObjects()` reports the lighthouse beam angle changing by at least 0.3 rad between two samples 1.2 s apart and a spot light exists on `high`; with `?time=0.5&freeze=1` the beam is off; the bus position changes by at least 10 m over 6 s and it dwells at the stop at some moment within 90 s of simulated time (use `setTime` is not enough: sample positions for up to 120 s with the hook `fastForward(seconds)` that advances the animators and routes by fake time, add it to the hook); the hotel lobby `wall-clock` hands equal the system time within one minute (hook `clockTimes()` returns each clock hands in degrees); a ceiling fan rotation differs between two samples; zero console errors; `check:budget` passes.',
        ],
        verify: [pw('tests/e2e/moving-things.spec.js', 25), { cmd: 'npm run check:budget', timeout_min: 20 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/life/animators.test.js', 'tests/unit/life/routes.test.js', 'tests/unit/layout/townPlan.test.js'), pw('tests/e2e/moving-things.spec.js', 25)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/life/animators.test.js', 'portfolio/tests/unit/life/routes.test.js', 'portfolio/tests/e2e/moving-things.spec.js'],
    unfreeze: ['portfolio/tests/unit/layout/plots.test.js'],
  },

  // ---------------------------------------------------------------- 062
  {
    id: '062', name: 'weather', title: 'Weather: clouds, mist, rain and wet ground, seeded and forceable with ?weather=', epic: 'E5', est: 55,
    arch: 'sections 4 (URL params) and requirement R10, decision D8(d), assumption A19',
    goal: [
      'A believable sky and weather: layered drifting clouds, morning mist, occasional rain with streaks and splashes, wet ground and darker, softer light. The weather follows a seeded schedule (same seed, same weather) and `?weather=clear|cloudy|mist|rain` forces a state. Rain is rare (a few minutes in an hour of play). Effects scale with the tier.',
    ],
    read: ['src/world/sky.js', 'src/systems/clock.js', 'src/util/urlParams.js', 'src/engine/scene.js', 'src/world/terrain/terrainMesh.js', 'src/world/roads/roads.js', 'src/systems/lights/lightManager.js', 'src/engine/quality.js'],
    steps: [
      {
        title: 'Weather model (pure)',
        items: [
          '`tests/unit/weather/model.test.js` first. `src/world/weather/model.js`: `weatherAt(tSeconds, seed, { forced })` returns a continuous state `{ type, cloudCover (0..1), mist (0..1), rain (0..1), wetness (0..1), gloom (0..1), windSpeed, sunFactor, fogFactor }`. The schedule is built from seeded segments: clear most of the time, cloudy 15 percent, mist only in the early morning (dayFraction 0.2 to 0.32) with 25 percent chance, rain episodes of 90 to 240 s about 5 percent of the time in total, with 20 s smooth ramps; `wetness` rises with rain and dries over 180 s. `forced` pins the type with 3 s blends. Over 24 simulated hours of game time rain covers 3 to 12 percent of the time.',
          'Tests: determinism; continuity (no jump of more than 0.05 per second in any field); bounds 0..1; rain total fraction; forced types; wetness lags rain; `sunFactor` lower with cloud cover (clear 1.0, rain at most 0.45); `fogFactor` higher in mist.',
        ],
        verify: [vt('tests/unit/weather/model.test.js'), exists('src/world/weather/model.js')],
      },
      {
        title: 'Clouds, mist, rain rendering and ground wetness',
        items: [
          '`src/world/weather/clouds.js`: a cloud layer dome with a procedural noise shader (two octaves of scrolling 3D value noise, no texture file) whose coverage and darkness follow `cloudCover` and `gloom`, tinted by the sky colour and the sun direction, fading at the horizon; the existing v1 sky gradient stays beneath. `src/world/weather/rain.js`: an `InstancedMesh` of thin streak quads in a 30 m box around the camera (3000 on high, 1500 medium, 600 low, none when reduced motion is on and then a darker grey overlay only), falling at 14 m/s with wind slant, wrapping inside the box; splash rings: 120 small expanding ring quads near the ground within 12 m; the box follows the player. Mist: fog density and colour blend from `fogFactor`. Wetness: a shared uniform `uWet` used by the terrain, road and paving materials through `onBeforeCompile` (colour 25 percent darker, roughness down by 0.35 at wetness 1) and by `getMaterial` for roof tiles and paving; light: `sunFactor` scales the sun, the hemisphere and the bloom threshold lowers slightly.',
          '`src/world/weather/index.js` ties it together: `updateWeather(dtMs)` advances the model with the game clock; `setWeather(type)` for the hook and `?weather=`; `getWeatherState()`; the `LightManager` `setNight` input uses `max(nightFactor, gloom * 0.7)` so interior lights come on in heavy rain; it emits the event `weather:rain` with the intensity for the audio plan 065.',
          '`tests/unit/weather/render.test.js`: rain streak count by tier; box wraps (no streak leaves the box); `uWet` follows the model; cloud material uniforms update; in Node nothing touches the DOM.',
        ],
        verify: [vt('tests/unit/weather/render.test.js'), exists('src/world/weather/clouds.js', 'src/world/weather/rain.js', 'src/world/weather/index.js')],
      },
      {
        title: 'Playwright and a look',
        items: [
          '`tests/e2e/weather.spec.js`: `?weather=rain&time=0.4`: `weatherState().type` is `rain`, `listObjects()` has a `rain` object with at least 500 streaks on `?quality=low` and more on high, `rendererInfo().calls` stays within the budget, canvas renders, zero console errors; `?weather=clear`: no rain object; `?weather=mist&time=0.25`: fog factor over 0.5; `?weather=rain` darkens: the sun intensity (hook `sunIntensity()`) is at most 45 percent of the `clear` value at the same time; `setWeather(\'clear\')` at runtime removes the rain within 4 s; with the same `?seed` the schedule at time 600 s is equal in two page loads.',
          'Shots: `npm run shots -- --spots square-day --weather rain --plan 062` and `--weather mist`, `--weather cloudy`; view and fix (best effort).',
        ],
        verify: [pw('tests/e2e/weather.spec.js', 20), { cmd: 'npm run check:budget', timeout_min: 20 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/weather/model.test.js', 'tests/unit/weather/render.test.js'), pw('tests/e2e/weather.spec.js', 20)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/weather/model.test.js', 'portfolio/tests/unit/weather/render.test.js', 'portfolio/tests/e2e/weather.spec.js'],
  },

  // ---------------------------------------------------------------- 063
  {
    id: '063', name: 'living-light', title: 'Living light: windows, signs, facades, street lights and the sky at dusk, with machine proof', epic: 'E5', est: 50,
    arch: 'sections 10.5 and requirement R10, assumption A11, A26',
    goal: [
      'Make dusk and night feel alive: house windows glow, shop and hotel signs light up, facade bands and lamps switch on, street lights follow the clock, interiors light as the light manager already does, the lighthouse sweeps, the sky gains a moon and stars, and the sun colour warms at golden hour. A machine proof reads the real light state through `__world` with `?time=`: lights on at night, off at noon.',
    ],
    read: ['src/systems/lights/lightManager.js', 'src/world/kit/bake.js', 'src/world/town/townBuilder.js', 'src/world/kit/signTexture.js', 'src/world/sky.js', 'src/systems/clock.js', 'src/world/weather/index.js', 'src/world/buildings'],
    steps: [
      {
        title: 'Night glow system',
        items: [
          '`tests/unit/lights/nightGlow.test.js` first. `src/systems/lights/nightGlow.js`: `NightGlow` registers meshes or materials flagged `userData.nightGlow = { color, maxIntensity, group?, jitter? }` (windows of town houses and shops, sign boards, facade bands, lamp bulbs, the clock face of the clock tower, the lighthouse lantern) and sets their `emissiveIntensity` each frame from `effectiveNight` (`max(nightFactor, gloom * 0.7)`) with a per-instance random on-time offset of up to 0.12 so houses do not all switch on in the same second (seeded), turning smoothly over 3 s; windows on baked town blocks are driven by a per-block shared material with an instanced `glow` attribute (so baking keeps working); `jitter` flickers oil lamps slightly.',
          'Tests: intensity is 0 at noon and at least 0.8 of max at midnight; the offset spreads switch-on times over at least 6 percent of the dusk window; deterministic; unregistering removes the entry; reduced motion removes the flicker.',
          'Mark the glowing parts in the existing builders: `curtain` window fills of town houses, shop signboards, the hotel and tower signs, the clock faces (square tower, academy, town hall), mast lamps, lighthouse lantern. Keep each change small and covered by the tests of those builders (they must still pass).',
        ],
        verify: [vt('tests/unit/lights/nightGlow.test.js'), exists('src/systems/lights/nightGlow.js')],
      },
      {
        title: 'Sky at dusk: moon, stars, warm sun, and the all-buildings light rule',
        items: [
          '`src/world/sky.js`: a moon disc with a soft halo (opposite the sun, visible at night, brightness by `nightFactor`) and a star field (1500 points on the dome, twinkle by shader time, hidden by clouds `cloudCover`), warm orange sun tint and longer shadows between dayFraction 0.62 and 0.72 and 0.28 to 0.34 (golden hour) through the existing clock colours. Reduced motion: no twinkle.',
          '`tests/unit/lights/allBuildingsLights.test.js`: for all 14 landmark manifests, each room that has a window or an exterior door has at least one light with `auto: "dusk"`, and at the effective night 1 the headless light manager reports at least one `on` light group per building; every landmark `exteriorDetails` lamp count is at least 2 and registered as night glow.',
        ],
        verify: [vt('tests/unit/lights/allBuildingsLights.test.js'), npm('lint')],
      },
      {
        title: 'Playwright proof with ?time=',
        items: [
          '`tests/e2e/living-light.spec.js`: with `?time=0.5&freeze=1` (noon): `listLights()` has no lights `on` outdoors (street lamps) and none of the lobby group is on; `lightIntensity` of every pooled light is 0; with `?time=0.75&freeze=1`: at least 8 street lamp lights `on`, the lobby group `on` after `teleport(\'plaza\')`, and `nightGlowStats()` (new hook) reports at least 40 glowing window instances and a mean intensity over 0.6; walk to the library, enter: the main hall group is `on`; set `setTime(0.5)` live and after 5 s the groups switch off again; `?time=0.75&freeze=1&weather=rain` and `?time=0.5&freeze=1&weather=rain` both turn interior lights on (gloom rule) only for the second case at noon is the street lamp group still off; zero console errors; `check:budget` night spots pass (glow adds no draw calls).',
          'Shots: `npm run shots -- --spots square-night,main-street,harbour,lighthouse-road --time 0.75 --plan 063`; view and fix (best effort).',
        ],
        verify: [pw('tests/e2e/living-light.spec.js', 25), { cmd: 'npm run check:budget', timeout_min: 20 }],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/lights/nightGlow.test.js', 'tests/unit/lights/allBuildingsLights.test.js'), pw('tests/e2e/living-light.spec.js', 25), node('scripts/check-buildings.mjs --all')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/lights/nightGlow.test.js', 'portfolio/tests/unit/lights/allBuildingsLights.test.js', 'portfolio/tests/e2e/living-light.spec.js'],
    human: 'Walk the town at dusk (`?time=0.72&freeze=1`): is it beautiful or garish?',
  },
];
