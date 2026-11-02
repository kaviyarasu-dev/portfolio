import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 021
  {
    id: '021', name: 'kit-rooms-doors-lights', title: 'Building kit part 2: walk graph, object placement, doors, lights, lifts and the BuildingInstance', epic: 'E2', est: 55, model: 'opus',
    arch: 'sections 3, 10.4, 10.6 and decisions D18, D19, assumptions A10, A11',
    goal: [
      'Complete the kit: a generic walk-graph (reachability using the real collision world), automatic and explicit object placement from the manifest with overlap and door-clearance checks, doors built from manifest entries (plan 017), lights registered with the light manager (plan 012), lifts (plan 018), and the single entry point `buildBuilding(manifest, ctx)` returning a `BuildingInstance` that can show or hide its interior. A cottage fixture proves it end to end in the browser.',
    ],
    read: ['docs/building-manifest.md', 'src/world/kit/schema.js', 'src/world/kit/shell.js', 'src/world/kit/collide.js', 'src/world/kit/walls.js', 'src/world/props/catalog.js', 'src/systems/interaction/doors.js', 'src/systems/interaction/elevator.js', 'src/systems/lights/lightManager.js', 'src/systems/interaction/lightSwitch.js', 'src/systems/interaction/sit.js', 'src/systems/collision/world.js', 'tests/fixtures/manifests/cottage.json'],
    steps: [
      {
        title: 'Walk graph (reachability with the real movement rules)',
        items: [
          '`tests/unit/nav/walkGraph.test.js` first. `src/systems/nav/walkGraph.js`: `reachableFrom(world, start, { cell = 0.4, radius = 0.35, bounds, maxStates = 400000 })` does a breadth-first search over states `(ix, iz, yq)` (`yq` = ground height rounded to 0.1 m) using `world.moveCircle` for each of 8 neighbour moves: a move is allowed when `blocked` is false and the position reached is within 0.05 m of the target cell centre. Returns `{ has(x, z, y), cells, states }`. `canReach(world, from, to, opts)` returns true when `to` is within one cell of a reached state. `findPath(world, from, to, opts)` returns a list of `{ x, z, y }` waypoints (A* on the same moves, then string-pulled with `raycast2D`), or null.',
          'Tests on a hand-built world: open field reachable; a wall splits two areas; a gap of 0.6 m is not passable but 1.2 m is; stairs connect two floors (reach the top); a disabled box (open door) connects rooms; `maxStates` exceeded throws a clear error; `findPath` waypoints never cross a wall.',
        ],
        verify: [vt('tests/unit/nav/walkGraph.test.js'), exists('src/systems/nav/walkGraph.js')],
      },
      {
        title: 'Object placement',
        items: [
          '`tests/unit/kit/place.test.js` first. `src/world/kit/place.js`: `placeObjects(room, manifest, { getMeta, rng })` returns `{ items: [{ type, x, y, z, rot, room, on? }], problems: [] }`. `getMeta(type)` returns `{ size: [w, h, d], solid }` (inject `getPropMeta`). Rules: `place: "wall:N|E|S|W"` puts props against that wall inside the room, back to the wall (rot so +z faces into the room), offset `d/2 + 0.05`, spread evenly along the free length of the wall and never inside a door or window opening plus 0.5 m on each side; `corner:NE|NW|SE|SW`; `center`; `grid:RxC` (spacing = prop size + 0.45 m, centred in the room, rows along x); `ceiling` (y = room ceiling height minus prop height); `on:<type>` (placed on the top of the first item of that type in the same room: y = item y + item height, x and z of the item); explicit `x`, `z`, `rot`, `y` win. Coordinates are building-local. `count` repeats a placement.',
          'Problems reported (never silently fixed): a solid prop whose footprint leaves the room bounds; two solid props whose footprints overlap by more than 5 percent of the smaller; a solid prop inside the 1.0 m by door-width clearance rectangle in front of any door of the room; a `wall:` placement that does not fit (not enough free wall length); `on:` target missing.',
          'Tests: each `place` kind with known sizes gives exact coordinates; doors keep their clearance; overlapping explicit props are reported; grid 2x3 inside a 6x4 room; unfit wall placement reported; determinism with the same seed.',
        ],
        verify: [vt('tests/unit/kit/place.test.js'), exists('src/world/kit/place.js')],
      },
      {
        title: 'Doors, lights, lifts, interactables and the BuildingInstance',
        items: [
          '`tests/unit/kit/building.test.js` first, using `tests/fixtures/manifests/cottage.json` and `twoStorey.json` (extend copies of them in new fixture files `cottageFull.json` with two lights, a switch interactable, a read interactable, a seat, three props from the catalog; do not edit the frozen originals).',
          '`src/world/kit/doors.js` (`buildDoors`): for every manifest door make a frame (jambs and lintel boxes in `style.trim`), a leaf mesh (`woodDark` panel with a handle) in a pivot at the hinge, and a `createDoor` from plan 017; `kind: "decorative"` gives a fixed leaf with a collider and no interactable; `locked: true` is locked. `src/world/kit/lights.js` (`buildLights`): registers each `room.lights` entry with the light manager (group, auto, emissive bulb mesh as a small sphere using `emissiveWarm`); `src/world/kit/lifts.js` (`buildLifts`): shaft walls with openings at each floor, cabin, buttons via `createLift`.',
          '`src/world/kit/building.js`: `buildBuilding(manifest, ctx, placement = { x: 0, z: 0, rot: 0, y: 0 })` where `ctx = { collision, interaction, lightManager, events, getMaterial, getPropMeta, buildProp, rng, registerSeat, registerSwitch, registerRead, scene? }` returns `BuildingInstance { id, root, exterior, interior, rooms, doors, lights, lifts, items, problems, collisionIds, setInteriorVisible(bool), insideRoom(x, z, y), isNear(x, z), update(dtMs, playerPos), dispose() }`. It builds the shell (plan 020), adds collision, places objects (props are `buildProp`, instanced into the `interior` group; solid props add collision boxes from their size and rotation), registers interactables from the manifest (`read` through `registerRead`, `sit` through `registerSeat` using the prop `seats`, `switch` through `registerSwitch`), and collects `problems` from placement. `update` shows the interior when the player is inside the footprint or within 3 m of an exterior door and hides it otherwise (`interior.visible`), never toggling more than once per 200 ms. `dispose` removes every collider, interactable, light and door it created. Headless: with stub contexts everything works in Node.',
          'Tests: instance has the right room, door and light counts; every interior door and the exterior door can be opened (`doors[i].use`) and then the walk graph reaches both rooms from outside, with the doors closed it does not; a locked interior door keeps its room unreachable; props produce collision (a circle cannot walk through a placed solid bed) and are inside their rooms; visibility toggling with hysteresis; `dispose` leaves the world empty (`collision.list()` length 0); lift shaft in `twoStorey` variant reachable by walk graph only through stairs or lift.',
        ],
        verify: [vt('tests/unit/kit/building.test.js'), exists('src/world/kit/building.js', 'src/world/kit/doors.js', 'src/world/kit/lights.js', 'src/world/kit/lifts.js', 'tests/fixtures/manifests/cottageFull.json')],
      },
      {
        title: 'Cottage fixture and Playwright',
        items: [
          '`src/dev/fixtures/cottage.js`: builds `cottageFull.json` with the real context (`game.collision`, registry, light manager) at the origin on a flat floor; spawn 6 m south of the door. Register it as `cottage`.',
          '`tests/e2e/cottage.spec.js` on `?fixture=cottage&time=0.5`: from the spawn the interior is hidden (`listObjects()` reports `interiorVisible: false` for the building); walk to the door, `e` opens it, walk in, interior visible; press `e` at the switch and the room light group turns on; `e` at the seat sits; zero console errors. Add a hook field `listBuildings()` returning `[{ id, interiorVisible, rooms, problems }]`.',
        ],
        verify: [pw('tests/e2e/cottage.spec.js', 15), exists('src/dev/fixtures/cottage.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/nav/walkGraph.test.js', 'tests/unit/kit/place.test.js', 'tests/unit/kit/building.test.js', 'tests/unit/kit/collide.test.js'), pw('tests/e2e/cottage.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/building-manifest.md'],
    freeze: ['portfolio/tests/unit/nav/walkGraph.test.js', 'portfolio/tests/unit/kit/place.test.js', 'portfolio/tests/unit/kit/building.test.js', 'portfolio/tests/e2e/cottage.spec.js', 'portfolio/tests/fixtures/manifests/cottageFull.json'],
  },

  // ---------------------------------------------------------------- 022
  {
    id: '022', name: 'props-set-b', title: 'Prop set B: storage, books, lighting fixtures, textiles, plants, decor, fans, signs (46 types)', epic: 'E2', est: 55,
    arch: 'section 10.5 and decision D18',
    goal: [
      'Second furniture set. The quality bar and metadata rules are those of plan 019 (read `docs/world-conventions.md` and the existing sets first). New metadata used here: `lightSockets: [{ x, y, z }]` on lamps (where a building light is attached), `animated: { kind: \'spin\', axis: \'y\', speed }` on fans (plan 061 animates them), `text` slots on signs (the sign texture is added by the building).',
    ],
    read: ['src/world/props/catalog.js', 'src/world/props/sets/seating.js', 'src/world/props/sets/tables.js', 'tests/unit/props/allProps.test.js', 'src/engine/materials.js'],
    steps: [
      {
        title: 'Storage and books (16 types)',
        items: [
          '`src/world/props/sets/storage.js` (category `storage`): `wardrobe` (two doors, handles, plinth), `bookshelf-tall`, `bookshelf-low`, `cabinet-glass` (glass doors, shelves inside), `cabinet-low`, `drawer-chest`, `shoe-rack`, `filing-cabinet`, `locker-bank` (a row of 4 metal lockers), `shelf-wall`. `src/world/props/sets/books.js` (category `books`): `book-stack`, `book-row` (a row of 12 varied spines, used to fill shelves, `solid: false`), `magazine-rack`, `notice-board` (cork with pinned papers), `whiteboard` (frame, tray, marker), `paper-tray`.',
          'Shelves must carry their contents visually: `bookshelf-*` include 3 to 5 rows of `book-row` style spines merged into the prop. Heights: wardrobe 1.9 to 2.2 m, bookshelf-tall 1.9 to 2.2 m, cabinet-low 0.8 to 0.9 m.',
          '`tests/unit/props/storage.test.js`: exact type lists of both files; heights in range; books are not solid; `bookshelf-tall` has more than 4 distinct meshes before merging is not required, but its triangle count is over 200 (not an empty box).',
        ],
        verify: [vt('tests/unit/props/storage.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/storage.js', 'src/world/props/sets/books.js')],
      },
      {
        title: 'Lighting fixtures and textiles (14 types)',
        items: [
          '`src/world/props/sets/lamps.js` (category `lighting`, each with `lightSockets`): `lamp-table`, `lamp-floor`, `lamp-pendant` (cord, shade; socket under the shade), `lamp-ceiling-flush`, `lamp-wall`, `lamp-street` (cast pole 4.5 m, curved arm, lamp head), `lantern-hanging` (brass hanging lantern), `oil-lamp-brass` (a tall standing brass oil lamp, no deity imagery), `tube-light` (a fluorescent tube in a batten, common in Indian shops).',
          '`src/world/props/sets/textiles.js` (category `textiles`): `rug-rect`, `rug-round`, `curtain-pair` (hung from a rod, folds as a few thin boxes with different heights), `doormat`, `cushion-set`. Rugs are 0.02 m thick and `solid: false`.',
          '`tests/unit/props/lamps.test.js`: every lamp has at least one `lightSockets` entry inside its bounding box; the street lamp is 4 to 5 m high; rugs are not solid and at most 0.03 m high; exact type lists.',
        ],
        verify: [vt('tests/unit/props/lamps.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/lamps.js', 'src/world/props/sets/textiles.js')],
      },
      {
        title: 'Plants, decor, fans, AC and signs (16 types)',
        items: [
          '`src/world/props/sets/plants.js` (category `plants`): `plant-potted-large` (ficus-like, 60 leaf quads on a trunk), `plant-potted-small`, `fern-pot`, `money-plant-jar` (glass jar with trailing vine), `planter-box`, `planter-brick` (masonry planter with a shrub), `planter-hanging`, `flower-vase`. Foliage uses double-sided alpha-tested leaf geometry (a procedural leaf shape in a small canvas texture only in the browser; flat green quads in Node).',
          '`src/world/props/sets/decor.js` (category `decor`): `wall-clock` (the minute and hour hands are separate named children `hand-hour` and `hand-minute` so plan 061 can drive them), `picture-frame-set`, `mirror-wall`, `mirror-standing`, `vase-floor`, `brass-urn`. `src/world/props/sets/air.js` (category `air`): `fan-ceiling` (animated metadata), `fan-pedestal`, `ac-split` (wall unit with a grille). `src/world/props/sets/signs.js` (category `signs`): `sign-hanging`, `sign-door-plate`, `sign-board` (large board on posts), `room-number-plate`.',
          '`tests/unit/props/decor.test.js`: exact lists; `fan-ceiling.userData.animated.kind === "spin"`; `wall-clock` has the two hand children; planters declare `solid`; signs have a `text` slot (`userData.textSlots` with width and height in metres).',
          'Total types in sets B: 46. Run `npx vitest run tests/unit/props` and `npm run shots -- --fixture props --plan 022` and look at the PNG (best effort).',
        ],
        verify: [vt('tests/unit/props/decor.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/plants.js', 'src/world/props/sets/decor.js', 'src/world/props/sets/air.js', 'src/world/props/sets/signs.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/storage.test.js', 'tests/unit/props/lamps.test.js', 'tests/unit/props/decor.test.js', 'tests/unit/props/allProps.test.js')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/props/storage.test.js', 'portfolio/tests/unit/props/lamps.test.js', 'portfolio/tests/unit/props/decor.test.js'],
  },

  // ---------------------------------------------------------------- 023
  {
    id: '023', name: 'props-set-c', title: 'Prop set C: kitchen, dining, bathroom and hotel room items (46 types)', epic: 'E2', est: 55,
    arch: 'section 10.5 and decision D18, D21',
    goal: [
      'Third furniture set, for kitchens, restaurants, bathrooms and hotel rooms, with South Indian details (wet grinder, clay stove, bucket and mug, brass tumblers, banana-leaf plates). Same quality bar and metadata rules as plan 019 and 022.',
    ],
    read: ['src/world/props/catalog.js', 'src/world/props/sets/tables.js', 'tests/unit/props/allProps.test.js', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'Kitchen (16 types)',
        items: [
          '`src/world/props/sets/kitchen.js` (category `kitchen`): `stove-gas` (4 burners with pan supports), `stove-clay` (a traditional clay chulha with a firewood opening), `counter-kitchen-straight` (base cabinets with a stone top, 2.4 m), `counter-kitchen-corner`, `sink-double` (steel double sink with a tap), `fridge` (double door), `microwave`, `hood-chimney`, `grinder-wet` (South Indian wet grinder: stone drum on a base), `rice-cooker`, `idli-steamer` (stacked steel plates in a pot), `pot-set` (three pots of different sizes), `pan-hanging` (a rail with hanging pans), `spice-rack`, `shelf-utensils` (wall shelf with steel tumblers and plates), `water-filter` (wall purifier).',
          '`tests/unit/props/kitchen.test.js`: exact list; counter height 0.85 to 0.95 m; the stove has 4 burner parts (children named `burner-1`..`burner-4`); the fridge is at least 1.7 m high.',
        ],
        verify: [vt('tests/unit/props/kitchen.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/kitchen.js')],
      },
      {
        title: 'Dining and restaurant (12 types)',
        items: [
          '`src/world/props/sets/dining.js` (category `dining`): `plate-set` (a plate, a bowl and a spoon, `solid: false`), `thali-set` (round steel plate with six small bowls), `banana-leaf-setting` (a leaf with small food heaps in colour blobs), `glass-set`, `tea-glass-set` (small steel tumbler and davara), `water-jug`, `napkin-holder`, `menu-board` (standing board with a text slot), `buffet-counter` (long heated counter with six steel pans), `bar-counter` (restaurant service counter with a rail), `cash-counter` (counter with a till and a bell), `condiment-tray`.',
          'Small items are `solid: false` and sit via `place: "on:<table type>"`; boards and counters are solid with accurate sizes (`buffet-counter` about 3.0 by 0.8 m).',
          '`tests/unit/props/dining.test.js`: exact list; small items not solid and under 0.35 m; `menu-board.userData.textSlots` exists.',
        ],
        verify: [vt('tests/unit/props/dining.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/dining.js')],
      },
      {
        title: 'Bathroom and hotel room (18 types)',
        items: [
          '`src/world/props/sets/bath.js` (category `bath`): `toilet` (seat, lid, cistern), `washbasin-pedestal`, `washbasin-counter`, `bathtub`, `shower-cubicle` (glass panels, rose, fixed with a tray), `towel-rail`, `towel-stack`, `mirror-bath`, `bucket-mug` (plastic bucket with a mug, a very common bathroom pair in India), `geyser` (wall water heater cylinder), `trash-bin-small`, `bath-mat`.',
          '`src/world/props/sets/hotelRoom.js` (category `hotel`): `minibar` (small fridge with a glass door), `safe-box`, `luggage-suitcase`, `luggage-trolley` (brass trolley with a suitcase), `tv-wall` (flat panel on a wall bracket), `tv-stand`, `luggage-rack` (folding), `kettle-tray` (tray with kettle and two cups).',
          '`tests/unit/props/bath.test.js`: exact lists of both files; the toilet seat height 0.38 to 0.45 m; `bathtub` length 1.5 to 1.8 m; `bath-mat` not solid; the whole catalog now has at least 125 registered types (sets A, B, C): assert `listPropTypes().length >= 125` and no duplicate names.',
          'Run `npm run shots -- --fixture props --plan 023`, look at the PNG, fix obvious defects (best effort).',
        ],
        verify: [vt('tests/unit/props/bath.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/bath.js', 'src/world/props/sets/hotelRoom.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/kitchen.test.js', 'tests/unit/props/dining.test.js', 'tests/unit/props/bath.test.js', 'tests/unit/props/allProps.test.js')],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/props/kitchen.test.js', 'portfolio/tests/unit/props/dining.test.js', 'portfolio/tests/unit/props/bath.test.js'],
  },

  // ---------------------------------------------------------------- 024
  {
    id: '024', name: 'hotel-manifest-and-building-check', title: 'check:buildings and the Grand Hotel structure manifest', epic: 'E2', est: 55,
    arch: 'sections 3, 10.4, 10.6, requirement R6 and R7, assumption A6, A30',
    goal: [
      'Create the machine check that enforces the Rich detail bar (`npm run check:buildings`) and the structure of the first real building, the Grand Hotel (zone id `plaza`): footprint, three levels (ground, first floor, roof terrace), all rooms, doors, windows, stairs, lift, exterior detail counts. Objects and lights are added by plans 025 to 027; the check has stages so it passes now on structure and later on the full bar.',
    ],
    read: ['docs/building-manifest.md', 'src/world/kit/schema.js', 'src/world/kit/building.js', 'src/systems/nav/walkGraph.js', 'src/world/props/index.js', 'src/world/zones.js', 'tests/fixtures/manifests/cottageFull.json'],
    steps: [
      {
        title: 'check-buildings with stages',
        items: [
          '`tests/unit/scripts/checkBuildings.test.js` first. `scripts/check-buildings.mjs` (exports `checkBuilding(manifest, { stage })` and `checkAll({ stage, only, all })`; the CLI prints one table row per building and exits 1 on any problem): loads every `src/world/buildings/<id>/manifest.json`; options `--only <id>`, `--all` (all 14 zone ids must have a manifest), `--stage structure|rooms|full` (default `full`), `--rooms a,b` with `--min-types-per-room N` (default 12).',
          'Rules by stage. structure: `validateManifest` has no problems; 3 to 6 rooms (the `plaza` manifest may have up to 24); at least one `exterior` door with `locked: false` and `kind` not `decorative`; the building built headless with `buildBuilding` and stub contexts reports no `problems`; every room is reachable from `outside` with the walk graph when all non-locked, non-decorative doors are open; the manifest `exteriorDetails` has all seven classes (`window door signage drainpipe planter bin lamp`) with count at least 1 (`window` at least 4). rooms: for the rooms given in `--rooms` each has at least `--min-types-per-room` distinct object types. full: all of the above plus at least 40 distinct object types over all rooms, every type registered in the prop catalog, every interactable of kind `read` has a `dialogueKey`, and at least one `light` per room that has a window or a door to the outside.',
          'The `plaza` extra rules (any stage but `structure` for the lists): rooms named `lobby`, `restaurant`, `kitchen`; at least 4 rooms with id starting `guest-` and for each one a room `bath-<same suffix>` connected by a door; at least one room whose id starts with `corridor`; a floor with `rooftop: true` that is walkable (a room `rooftop` exists).',
          'Tests build small invalid manifests from `cottageFull.json` for each rule (too many rooms, no exterior door, locked-only route, missing detail class, unknown prop type, fewer than 40 types, hotel rule violations) and assert the message names the rule; a valid rich manifest is generated in the test by adding 40 real catalog types to a copy of the cottage.',
        ],
        verify: [vt('tests/unit/scripts/checkBuildings.test.js'), exists('scripts/check-buildings.mjs')],
      },
      {
        title: 'Grand Hotel structure manifest',
        items: [
          '`src/world/buildings/plaza/manifest.json` with `id: "plaza"`, `displayName: "Grand Hotel"`, `prompt: "check in"`, footprint 28 m wide by 20 m deep, floors: level 0 (y 0, height 3.8), level 1 (y 4.0, height 3.4), level 2 `rooftop: true` (y 7.6). Rooms (ids fixed): ground floor `lobby`, `restaurant`, `kitchen`, `stairhall`; first floor `corridor-1`, `guest-1` to `guest-4`, `bath-1` to `bath-4`; `rooftop`. Total 14 spaces. Suggested layout (adjust so every door wall lies on a shared boundary): ground floor, front (+z) half is lobby (left, 16 m wide) and restaurant (right); back half is kitchen (right) and stairhall (left, with the lift shaft and the staircase); first floor, a corridor along the middle with four guest rooms on the front side, each with its bathroom behind it.',
          'Doors: main exterior door on the south wall into `lobby` (width 2.0, `exterior`), a second exterior door into `restaurant` (width 1.6), a service door from `kitchen` to outside (`exterior`, `locked: true`), interior doors between lobby and restaurant (wide opening 2.4), lobby and stairhall, restaurant and kitchen, stairhall and `corridor-1` via the stairs (no door), corridor to each guest room (`guest-1` and `guest-2` unlocked, `guest-3` and `guest-4` `locked: true`), each guest room to its bath, stairhall to `rooftop` via stairs. Windows: at least 24 over the facades (every guest room 2, lobby 3, restaurant 4, kitchen 1). Stairs: ground to first floor (rise 4.0) and first floor to roof (rise 3.6). One lift in the stairhall serving levels 0, 1 and 2.',
          '`exteriorDetails` counts: window 24 (or the real number), door 3, signage 3, drainpipe 4, planter 8, bin 3, lamp 8. `interactables`: only the three ids that exist now are declared here with real positions: `reception-intro` (kind `read`, room `lobby`, `dialogueKey` `intro`), more are added by later plans. `rooms[].objects` stays empty and `lights` empty for now.',
          '`tests/unit/buildings/plaza.test.js`: `checkBuilding(plaza, { stage: "structure" })` passes; room list exactly as above; guest-3 and guest-4 are locked and guest-1 and guest-2 are not; the main door width is 2.0; `check:buildings` CLI with `--only plaza --stage structure` exits 0.',
          '`src/world/zones.js`: add the `displayName` mapping for `plaza` (`Grand Hotel`) and the `mode` stays `radius` until plan 031.',
        ],
        verify: [vt('tests/unit/buildings/plaza.test.js'), node('scripts/check-buildings.mjs --only plaza --stage structure'), exists('src/world/buildings/plaza/manifest.json')],
      },
      {
        title: 'Hotel shell in the browser',
        items: [
          '`src/dev/fixtures/building-plaza.js` builds the plaza manifest with the real context at the origin on a flat 120 m floor (no props yet); register as `building-plaza`. Spawn 8 m south of the main door.',
          '`tests/e2e/plaza-shell.spec.js`: `?fixture=building-plaza&time=0.5`; the main door opens with `e` and the player can walk into the lobby (`listBuildings()` shows `interiorVisible` true after entering); the locked service door and `guest-3` door refuse; `rendererInfo().calls` is under 150 with the interior visible; zero console errors. Take two shots with `npm run shots -- --fixture building-plaza --plan 024 --spots hotel-front,hotel-lobby` (add those two spots to `src/shots.json` first) and look at them (best effort).',
          'Update `docs/world-conventions.md` with a short "How to add a building" section: manifest, `check:buildings`, fixture, shots.',
        ],
        verify: [pw('tests/e2e/plaza-shell.spec.js', 15), exists('src/dev/fixtures/building-plaza.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/scripts/checkBuildings.test.js', 'tests/unit/buildings/plaza.test.js'), node('scripts/check-buildings.mjs --only plaza --stage structure'), pw('tests/e2e/plaza-shell.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/check-buildings.mjs', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/scripts/checkBuildings.test.js', 'portfolio/tests/unit/buildings/plaza.test.js', 'portfolio/tests/e2e/plaza-shell.spec.js'],
    human: 'Walk the empty hotel shell once in `?fixture=building-plaza` to judge the proportions and room layout before furniture goes in.',
  },

  // ---------------------------------------------------------------- 025
  {
    id: '025', name: 'hotel-exterior', title: 'Shared exterior detail kit, signage and the Grand Hotel facade', epic: 'E2', est: 55,
    arch: 'sections 10.4, 10.6, decision D21, D25(d) and assumption A2, A15',
    goal: [
      'Make buildings look like real South Indian buildings from outside. Build a reusable exterior detail kit (window frames and shutters, balconies, drainpipes, planters, bins, wall lamps, awnings, porticos, steps, signboards with Tamil and English text) that all 14 landmarks reuse, then apply it to the Grand Hotel: pastel plaster facade, red clay-tile roof over the stair block, flat terrace roof with parapet and water tank, arched entrance portico with columns, balconies, shutters, AC units, a lit signboard. Tamil text comes from one content file and is a human check (A2).',
    ],
    read: ['src/world/kit/shell.js', 'src/world/kit/building.js', 'src/world/buildings/plaza/manifest.json', 'src/engine/materials.js', 'src/world/props/sets/signs.js', 'src/world/props/sets/plants.js', 'src/ui/hud.js', 'docs/building-manifest.md'],
    risks: ['A2 (HIGH-RISK, accuracy): Tamil signage is drafted by this plan from the starter vocabulary below and is flagged for a person to check. No idols or deity images are modelled anywhere.'],
    steps: [
      {
        title: 'Exterior detail kit (headless)',
        items: [
          '`tests/unit/kit/exterior.test.js` first. `src/world/kit/exterior.js` exports builders that each return an `Object3D` whose root `userData.detailClass` is one of `window|door|signage|drainpipe|planter|bin|lamp|balcony|awning|portico|steps|ac-unit`: `windowFrame({ w, h, shutters, sill })` (frame, sill, optional two shutters in `woodDark`, a lintel), `balcony({ w, d, railing })` (slab, balusters, handrail), `drainpipe({ height })` (pipe with brackets and a hopper), `planterOutside({ w })`, `binOutside()` (a green municipal bin on legs), `wallLamp()`, `awning({ w, d })` (striped fabric on a frame), `portico({ w, columns, archHeight })` (columns with capitals, an arched lintel built from a half-torus or extruded arch, a flat roof), `steps({ w, rise, count })`, `acUnit()` (outdoor box with fan grille), `waterTank()` (black cylindrical roof tank on a stand, common in India). All headless, merged per material, sizes in metres.',
          '`placeExteriorDetails(instance, manifest, ctx)` reads `manifest.exteriorDetails` counts and `windows`, attaches the matching builders to the facade (window frames exactly at each manifest window position, doors framed, drainpipes at corners, planters and bins along the base, lamps beside doors) and returns the list of attached objects; each carries `userData.detailClass`. `countDetails(instanceRoot)` returns counts per class.',
          'Tests: each builder returns finite geometry with the right class and a bounding box in a sane range (window frame about its `w` by `h`, portico taller than 3 m); `placeExteriorDetails` on the cottage manifest attaches exactly the declared counts, a window frame sits within 0.05 m of each window position on the right wall; deterministic with a seed.',
        ],
        verify: [vt('tests/unit/kit/exterior.test.js'), exists('src/world/kit/exterior.js')],
      },
      {
        title: 'Signage text and sign textures',
        items: [
          '`tests/unit/content/signage.test.js` first. `src/content/signage.js` exports `SIGNS` (key -> `{ en, ta }`) and `signText(key)`. Starter vocabulary (a person still checks it): Grand Hotel `கிராண்ட் ஹோட்டல்`; Reception `வரவேற்பு`; Restaurant `உணவகம்`; Welcome `நல்வரவு`; Tea `தேநீர்`; Post Office `அஞ்சல் அலுவலகம்`; Library `நூலகம்`; School `பள்ளி`; Lighthouse `கலங்கரை விளக்கம்`; Harbour `துறைமுகம்`; Bus Stand `பேருந்து நிலையம்`; Fish Market `மீன் சந்தை`; Temple `கோயில்`; Town Hall `நகர மன்றம்`; Police `காவல் நிலையம்`; Exit `வெளியேறு`; Entrance `நுழைவாயில்`; Kitchen `சமையலறை`; Restroom `கழிப்பறை`; Open `திறந்திருக்கிறது`; Closed `மூடப்பட்டது`. Add keys for every zone building name and the hotel rooms as needed. Test: every key has non-empty `en` and `ta`; every `ta` contains at least one character in U+0B80 to U+0BFF; no key contains digits except room numbers; the file has a header comment stating the Tamil is a draft to be checked by a person.',
          '`src/world/kit/signTexture.js`: `makeSignMaterial({ lines: [{ text, font, color, size }], width, height, bg, border })` returns a `MeshStandardMaterial`. In the browser it draws the text with a canvas (Tamil lines with `"Noto Sans Tamil"`, English with `Orbitron` or `Inter`) and returns a `CanvasTexture` (sRGB, anisotropy 4); in Node (`typeof document === \'undefined\'`) it returns a flat material of colour `bg` and records the text in `userData.text` so tests can read it. Export `awaitFonts()` that resolves after `document.fonts.load` for the two families (immediately in Node).',
          '`signboard({ key, w, h, style })` in `exterior.js` builds a board mesh with the sign material, a frame, and two small spot lamps; the manifest `exteriorDetails` class `signage` counts these.',
        ],
        verify: [vt('tests/unit/content/signage.test.js'), exists('src/content/signage.js', 'src/world/kit/signTexture.js')],
      },
      {
        title: 'Apply to the Grand Hotel and check the details exist',
        items: [
          '`src/world/buildings/plaza/build.js` exports `decoratePlaza(instance, ctx)`: portico over the main door with two columns and a stepped plinth; a pastel exterior (`style.wallTint` `#f1d7a6` for the main block, a darker trim; set in the manifest); window frames with shutters on the first floor, balconies in front of `guest-1` and `guest-2`, AC units under four windows, drainpipes at the four corners, `planterOutside` on both sides of the entrance (use the shared builders), a lit signboard `GRAND HOTEL` with the Tamil line above the portico, a smaller `RESTAURANT` board at the restaurant door, wall lamps beside every exterior door, a water tank and a satellite dish on the roof terrace, bins at the corner. The kit calls `decoratePlaza` automatically when `src/world/buildings/<id>/build.js` exists (extend `buildBuilding` with an optional `decorate` hook; do not break the cottage tests).',
          '`check:buildings` gets the rule "declared exteriorDetails counts are really built": for the `full` and `rooms` stages and also `structure` when the building has a `build.js`, the built instance must contain at least the declared number of objects of each detail class (`countDetails`). Implement it as a separate exported `checkDetails(manifest, instance)` in `scripts/check-buildings.mjs` that `checkAll` also runs, and put its tests in the new file `tests/unit/scripts/checkBuildingsDetails.test.js`. Do not edit `tests/unit/scripts/checkBuildings.test.js` (frozen by plan 024); it must keep passing.',
          '`tests/unit/buildings/plazaExterior.test.js`: after `decoratePlaza` the counts per class are at least the manifest counts; the signboard material records the text `GRAND HOTEL` and the Tamil string from `SIGNS`; the portico does not block the main door clearance (walk graph still reaches `lobby`); `check:buildings --only plaza --stage structure` still passes.',
          '`tests/e2e/plaza-exterior.spec.js`: `?fixture=building-plaza`; zero console errors; `document.fonts.check(\'16px "Noto Sans Tamil"\')` true after load; shots from `hotel-front` and a second spot `hotel-corner` (add to `src/shots.json`); view them and fix defects such as floating frames (best effort).',
        ],
        verify: [vt('tests/unit/buildings/plazaExterior.test.js', 'tests/unit/scripts/checkBuildingsDetails.test.js'), node('scripts/check-buildings.mjs --only plaza --stage structure'), pw('tests/e2e/plaza-exterior.spec.js', 15)],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/kit/exterior.test.js', 'tests/unit/content/signage.test.js', 'tests/unit/buildings/plazaExterior.test.js', 'tests/unit/scripts/checkBuildingsDetails.test.js', 'tests/unit/scripts/checkBuildings.test.js'), pw('tests/e2e/plaza-exterior.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/kit/exterior.test.js', 'portfolio/tests/unit/content/signage.test.js', 'portfolio/tests/unit/buildings/plazaExterior.test.js', 'portfolio/tests/unit/scripts/checkBuildingsDetails.test.js', 'portfolio/tests/e2e/plaza-exterior.spec.js'],
    human: 'Have a Tamil reader check every string in `src/content/signage.js` and the hotel and shop names (A2, A15).',
  },

  // ---------------------------------------------------------------- 026
  {
    id: '026', name: 'hotel-interior-public', title: 'Grand Hotel ground floor: lobby, restaurant, kitchen, stair hall', epic: 'E2', est: 55,
    arch: 'sections 10.6 and decisions D18, D19, A5, A6',
    goal: [
      'Furnish and light the public rooms of the hotel with real detail: reception with the intro reading object (A6), lounge, restaurant with tables and a buffet, kitchen with stoves and counters, stair hall with the staircase and the lift. All content is data in the manifest (types from the catalog), per-room lights and switches, seats, and a `read` interactable at the reception desk. Rooms must meet the per-room richness rule of `check:buildings` (at least 14 distinct types each).',
    ],
    read: ['src/world/buildings/plaza/manifest.json', 'docs/building-manifest.md', 'src/world/kit/place.js', 'src/world/props/catalog.js', 'src/content/signage.js', 'src/content/dialogues.js', 'scripts/check-buildings.mjs'],
    steps: [
      {
        title: 'Lobby and reception',
        items: [
          'Fill `lobby` in `src/world/buildings/plaza/manifest.json` (floor `marble`, wall plaster, ceiling height 3.8): a reception desk (`counter-straight` or a custom `reception-desk` type added to `src/world/props/sets/hotelRoom.js` with a bell, key rack and monitor children), a wall behind it with `wall-clock`, `sign-board` text slot "RECEPTION / வரவேற்பு", `picture-frame-set`; a lounge with `sofa-3` x2, `armchair` x2, `table-coffee` x2, `rug-rect`, `plant-potted-large` x3, `lamp-floor` x2, `bench-wood`, `luggage-trolley`, `luggage-suitcase`, `magazine-rack`, `notice-board`, `fan-ceiling` x3, `lamp-pendant` x3, `mirror-wall`, `flower-vase` on `table-side`, `doormat` at the door, `brass-urn`, `oil-lamp-brass` pair at the entrance. At least 18 distinct types.',
          'Lights: 3 pendants and 2 floor lamps with `group` `lobby`, `auto: "dusk"`; light switch interactable beside the main door (group `lobby`). Interactables: `reception-intro` (kind `read`, at the desk, `dialogueKey` `intro`, prompt "check in"), seats on both sofas and armchairs (`kind: "sit"`, positions taken from the props `seats`).',
          '`tests/unit/buildings/plazaLobby.test.js`: `check:buildings --only plaza --stage rooms --rooms lobby --min-types-per-room 14` logic passes (call `checkBuilding`); the reception desk is within 6 m of the main door; no placement problems in the lobby; the intro interactable exists; walk graph reaches the desk from outside.',
        ],
        verify: [vt('tests/unit/buildings/plazaLobby.test.js')],
      },
      {
        title: 'Restaurant and kitchen',
        items: [
          '`restaurant` (floor `woodPlanks`): 8 tables (`table-dining-4` in a `grid:2x4` and 2 `table-round`), 32 chairs placed beside tables (`chair-dining`, `chair-cane`; use explicit coordinates or a `grid` plus `place` rules that keep chair clearance), `buffet-counter`, `bar-counter`, `cash-counter` at the door, `menu-board` x2 with "MENU / உணவு பட்டியல்" (add the key `menu` to `signage.js` with Tamil `உணவுப் பட்டியல்`), table settings (`plate-set`, `glass-set`, `water-jug`, `condiment-tray`, `napkin-holder` placed `on:table-dining-4` and `on:table-round`), `plant-potted-small` x4, `lamp-pendant` x6, `fan-ceiling` x4, `curtain-pair` at windows, `wall-clock`, `picture-frame-set` x3. At least 18 distinct types; interactables: a seat per chair at two tables (not all), switch for group `restaurant`.',
          '`kitchen` (floor `floorTileDark`): `counter-kitchen-straight` x2, `counter-kitchen-corner`, `stove-gas` x2, `stove-clay`, `sink-double`, `fridge` x2, `hood-chimney`, `grinder-wet`, `idli-steamer`, `rice-cooker`, `pot-set` x2, `pan-hanging`, `spice-rack`, `shelf-utensils`, `water-filter`, `table-folding` as prep table, `trash-bin-small`, `tube-light` x3, `fan-pedestal`. At least 16 distinct types. The service door (`locked`) keeps the kitchen reachable only through the restaurant.',
          'Lights and switches per room; windows from the structure manifest stay as they are.',
          '`tests/unit/buildings/plazaRestaurant.test.js`: the rooms rule for `restaurant,kitchen` with 14 types each; at least 30 chair items in the restaurant; no overlaps or door clearance problems; every table has at least two chairs within 1.2 m; the kitchen is reachable only through the restaurant door with the service door locked.',
        ],
        verify: [vt('tests/unit/buildings/plazaRestaurant.test.js')],
      },
      {
        title: 'Stair hall, lift, public-room Playwright test and shots',
        items: [
          '`stairhall` (floor `floorTile`): the staircase to the first floor is already in the manifest; add `plant-potted-large` x2, `lamp-wall` x4, `sign-board` with "STAIRS / LIFT" Tamil `படிக்கட்டு / மின்தூக்கி` (add key `stairs-lift`), `notice-board`, `bench-wood`, `wall-clock`, `lift` entry in the manifest `lifts` for levels 0, 1, 2 with call buttons; at least 12 distinct types.',
          '`tests/e2e/hotel-public.spec.js` on `?fixture=building-plaza&time=0.5`: walk in through the main door (teleport 2 m south of the door facing it, `e`, hold `w`); `listBuildings()[0].problems` is empty; teleport to the reception, press `e`: `#dialogue` is visible and contains the name of the person (the plaza dialogue content); press Escape closes it; the lobby switch toggles `listLights()` for group `lobby`; sit on a lobby sofa; ride the lift from ground to level 1; zero console errors; `rendererInfo().calls` stays under 400 in the lobby.',
          'Shots: add spots `hotel-reception`, `hotel-restaurant`, `hotel-kitchen`, `hotel-stairhall` to `src/shots.json` (and the lobby and restaurant to `src/budgets.json` spots); run `npm run shots -- --fixture building-plaza --plan 026 --spots hotel-reception,hotel-restaurant,hotel-kitchen,hotel-stairhall`, open the PNGs with the Read tool and fix floating objects, objects inside walls, flat textures or black rooms (best effort; list what you fixed).',
          '`npm run check:buildings -- --only plaza --stage rooms --rooms lobby,restaurant,kitchen,stairhall --min-types-per-room 12` must pass.',
        ],
        verify: [pw('tests/e2e/hotel-public.spec.js', 15), node('scripts/check-buildings.mjs --only plaza --stage rooms --rooms lobby,restaurant,kitchen,stairhall --min-types-per-room 12')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/buildings/plazaLobby.test.js', 'tests/unit/buildings/plazaRestaurant.test.js', 'tests/unit/buildings/plaza.test.js'), node('scripts/check-buildings.mjs --only plaza --stage rooms --rooms lobby,restaurant,kitchen,stairhall --min-types-per-room 12'), pw('tests/e2e/hotel-public.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/buildings/plazaLobby.test.js', 'portfolio/tests/unit/buildings/plazaRestaurant.test.js', 'portfolio/tests/e2e/hotel-public.spec.js'],
    human: 'Walk the lobby, restaurant and kitchen and judge whether they feel like a real hotel.',
  },
];
