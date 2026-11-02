import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';
import { buildingPlan } from '../buildingPlan.mjs';

export default [
  // ---------------------------------------------------------------- 045
  {
    id: '045', name: 'citadel-tower', title: 'GravityWrite HQ tower (zone citadel), part 1: structure, glass facade, lobby, lift and stairs', epic: 'E4', est: 55, model: 'opus',
    arch: 'sections 3, 10.6 and requirement R6, R8, decision D9, D18, D19',
    goal: [
      'The modern office tower of GravityWrite (zone `citadel`): five levels, a lift and a staircase, glass curtain-wall facade with steel mullions and lit floor bands, a street-level lobby with reception. This plan builds the structure, the facade and the lobby; plan 046 furnishes the upper floors and converts the zone. Six rooms: `lobby` (level 0), `newsroom` (level 1), `meeting-room` and `executive-office` (level 2), `server-room` (level 3), `rooftop` (level 4, walkable roof terrace).',
    ],
    read: ['docs/building-manifest.md', 'src/world/buildings/plaza/manifest.json', 'src/world/buildings/plaza/build.js', 'src/world/kit/exterior.js', 'src/world/kit/building.js', 'src/world/kit/lifts.js', 'src/world/layout/town.json', 'src/content/dialogues.js', 'scripts/check-buildings.mjs'],
    steps: [
      {
        title: 'Structure manifest for the tower',
        items: [
          '`src/world/buildings/citadel/manifest.json`: `id "citadel"`, `displayName "GravityWrite HQ"`, `prompt "enter HQ"`, footprint from the `citadel` anchor (about 22 by 18 m), floors level 0 (y 0, h 4.6), level 1 (y 4.8, h 4.0), level 2 (y 9.0, h 4.0), level 3 (y 13.2, h 4.0), level 4 `rooftop: true` (y 17.4). Style: wall `concrete` tint `#d8dde3`, roof `flat`, trim `metalBrushed`.',
          'Rooms: `lobby` (whole ground floor), `newsroom` (whole level 1), `meeting-room` (level 2, 12 by 9 m, east part) and `executive-office` (level 2, west part), `server-room` (level 3, 10 by 8 m in the west with a corridor-like open area east counted as part of the room), `rooftop`. Stairs: a staircase core in the north-east corner linking every level (4 flights, rise 4.8, 4.2, 4.2, 4.2), and one lift in the same core serving levels 0 to 4. Doors: a revolving-look double entrance door south into `lobby` (width 2.4, `exterior`, unlocked), a service door (locked, exterior), `meeting-room` and `executive-office` doors to the stair core landing (the landing is part of the room that owns it; place the dividing wall so both rooms touch the stairs), `server-room` door (interior, unlocked).',
          'Windows: at least 30 large glass windows (sill 0.3, height 3.0) so the facade reads as curtain wall. `exteriorDetails`: window 30, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 8. Interactable declared now: `meeting-screen` (kind `read`, room `meeting-room`, `dialogueKey` `main`, prompt "view project").',
          '`tests/unit/buildings/citadel.test.js` first: structure stage passes; five floors, the rooftop floor flagged; the lift serves levels 0 to 4; the stair core reaches every level (walk graph from outside to the rooftop with doors open); the service door is locked and the main door not; `check:buildings --only citadel --stage structure` exits 0.',
        ],
        verify: [vt('tests/unit/buildings/citadel.test.js'), node('scripts/check-buildings.mjs --only citadel --stage structure'), exists('src/world/buildings/citadel/manifest.json')],
      },
      {
        title: 'Glass curtain-wall facade and exterior details',
        items: [
          'Add `curtainWall({ w, h, floors, mullionEvery = 1.5 })` to `src/world/kit/exterior.js` (with `userData.detailClass: "window"` counted per pane group): steel mullions and transoms in `metalBrushed`, tinted `glass` panes (blue-green tint, opacity 0.35), spandrel strips at each floor line with an emissive band that glows at night (group `citadel-bands`, registered with the light manager as an `auto: "dusk"` emissive-only light), a projecting entrance canopy with slim columns, a rooftop parapet with a glass rail. Test in a NEW file `tests/unit/kit/curtainWall.test.js` (finite geometry, pane count equals rows times columns, merged mesh count at most 6, the band is an emissive material).',
          '`src/world/buildings/citadel/build.js` `decorateCitadel`: apply `curtainWall` on the south, east and west facades (the north facade is a solid core wall in `concrete` with the stair tower look), the entrance canopy over the main door, a large lit signboard "GRAVITYWRITE" with a smaller Tamil caption (key `gravitywrite`, Tamil `கிராவிட்டிரைட்`, a draft), planters at the base, bins, wall lamps, rooftop water tank and a rooftop antenna pair (kit builders), a flagpole.',
          '`tests/unit/buildings/citadelExterior.test.js` first: counts at least the manifest, canopy leaves the entrance clear (walk graph reaches `lobby`), the tower height from the ground to the parapet is 17 to 19 m, draw-call friendly (exterior group at most 14 meshes).',
        ],
        verify: [vt('tests/unit/kit/curtainWall.test.js', 'tests/unit/buildings/citadelExterior.test.js'), node('scripts/check-buildings.mjs --only citadel --stage structure'), exists('src/world/buildings/citadel/build.js')],
      },
      {
        title: 'Lobby interior, lift check and shots',
        items: [
          '`lobby` (floor `marble`): `reception-desk-modern` with a logo slot "GRAVITYWRITE", `sofa-3` x2, `armchair` x3, `table-coffee` x2, `plant-office` x4, `plant-potted-large` x2, `wall-tv-large` x2 (a screen glow), `sign-board` "WELCOME / நல்வரவு", `water-dispenser`, `coffee-machine`, `vending-machine`, `bench-wood` x2, `rug-rect` x2, `lamp-floor` x2, `ceiling-panel-light` x8, `ac-split` x2 (the lobby is air-conditioned), `exit-sign` x2, `fire-extinguisher` x2, `wall-clock`, `magazine-rack`, `notice-board`, `trash-bin-small` x2, `flower-vase` x2 `on:table-coffee`. At least 22 distinct types.',
          'Lights group `lobby` (panels, auto dusk) with a switch; the lift call button in the lobby and inside the cabin buttons for levels 0 to 4 (from the manifest `lifts`).',
          '`tests/unit/buildings/citadelLobby.test.js` first: rooms rule for `lobby` with 14 types; no placement problems; the lift cabin reaches level 4 in the headless simulation (`createLift` update loop with fake time) and the walk graph treats the cabin floor as reachable.',
          '`tests/e2e/citadel-lift.spec.js` on `?fixture=building-citadel` (extend the fixture generator: plan 024 created `building-plaza`; add a generic fixture `building-<id>` that builds any manifest by id, registered in `src/dev/fixtures/building.js`, and keep the old name working): ride the lift from the lobby to level 4: `playerState().y` within 0.1 of 17.4; walk 3 m on the roof; the parapet blocks the edge; zero console errors. Shots `citadel-outside`, `citadel-lobby` (best effort).',
        ],
        verify: [vt('tests/unit/buildings/citadelLobby.test.js'), pw('tests/e2e/citadel-lift.spec.js', 20), exists('src/dev/fixtures/building.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/buildings/citadel.test.js', 'tests/unit/kit/curtainWall.test.js', 'tests/unit/buildings/citadelExterior.test.js', 'tests/unit/buildings/citadelLobby.test.js'), node('scripts/check-buildings.mjs --only citadel --stage structure'), pw('tests/e2e/citadel-lift.spec.js', 20)],
    allowed: ['portfolio/src/**', 'portfolio/tests/**', 'portfolio/docs/**'],
    freeze: ['portfolio/tests/unit/buildings/citadel.test.js', 'portfolio/tests/unit/kit/curtainWall.test.js', 'portfolio/tests/unit/buildings/citadelExterior.test.js', 'portfolio/tests/unit/buildings/citadelLobby.test.js', 'portfolio/tests/e2e/citadel-lift.spec.js'],
    human: 'Judge the tower facade at dusk and from the street.',
    blocked: ['The kit cannot express the level layout: describe the limitation in BLOCKED.md instead of working around it with fake geometry.'],
  },

  // ---------------------------------------------------------------- 046
  buildingPlan({
    id: '046', slug: 'citadel-floors', zone: 'citadel', display: 'GravityWrite HQ', prompt: 'enter HQ', title: 'GravityWrite HQ (zone citadel), part 2: newsroom, meeting room, executive office, server room, rooftop', est: 55, model: 'opus',
    goal: 'Finish the tower: furnish the newsroom floor, the meeting room (its wall screen opens the featured-project dialogue), the executive office, the server room and the rooftop, convert the zone and prove it in the browser. Structure, facade and lobby exist from plan 045; read them first and do NOT rewrite the manifest structure, only add objects, lights and interactables.',
    footprint: 'already set by plan 045 (do not change)', floors: 'as in plan 045 (levels 0 to 4)', style: 'unchanged from plan 045',
    rooms: [
      { id: 'newsroom', desc: 'level 1 open-plan newsroom, whole floor', floor: '`carpet`', objects: '`desk-cubicle` x8 in two `grid:2x4` blocks, `cubicle-partition` x6, `chair-office` x10, `monitor-dual` x6, `monitor-desktop` x4, `laptop` x3, `keyboard-mouse` x10, `phone-desk` x4, `kanban-board` x2, `whiteboard-rolling` x2, `wall-tv-large` x3, `printer-copier` x2, `water-dispenser`, `coffee-machine`, `bean-bag` x3, `plant-office` x6, `desk-lamp` x4, `ceiling-panel-light` x12, `ac-split` x3, `wall-clock` x2, `fire-extinguisher` x2, `exit-sign` x2, `trash-bin-small` x4, `notice-board`, `standing-desk` x2', lights: 'twelve panels in 3 groups `newsroom-a/b/c` with one switch bank at the stair door' },
      { id: 'meeting-room', desc: 'level 2 meeting room 12 by 9 m', floor: '`woodPlanks`', objects: '`conference-table` x1 centre, `chair-conference` x14 around it, `wall-tv-large` x1 large (the project screen, 3 m wide slot), `projector-ceiling`, `projector-screen`, `whiteboard-rolling` x2, `cabinet-low` x2, `coffee-machine`, `water-dispenser`, `plant-office` x4, `lamp-floor` x2, `curtain-pair` x4, `rug-rect`, `wall-clock`, `picture-frame-set` x3, `ac-split` x2, `ceiling-panel-light` x8, `exit-sign`, `fire-extinguisher`, `trophy-cup`', lights: 'panels group `meeting` with a dimmer-style switch pair (two groups `meeting-front` and `meeting-back`)' },
      { id: 'executive-office', desc: 'level 2 executive office 9 by 9 m', floor: '`woodPlanks`', objects: '`desk-wood` x1 large, `chair-office` x1, `armchair` x2, `sofa-2`, `table-coffee`, `bookshelf-tall` x2, `cabinet-glass`, `plant-potted-large` x2, `lamp-floor`, `lamp-table`, `monitor-dual`, `keyboard-mouse`, `phone-desk`, `rug-round`, `curtain-pair` x3, `wall-clock`, `picture-frame-set` x2, `mirror-wall`, `globe`, `flower-vase`, `ac-split`, `safe-box`', lights: 'lamps and panels group `exec`' },
      { id: 'server-room', desc: 'level 3 server room 10 by 8 m', floor: '`floorTileDark`', objects: '`server-rack` x10 in two aisles (`grid:2x5`), `network-box` x2, `ac-split` x4, `fire-extinguisher` x3, `exit-sign` x2, `ceiling-panel-light` x6, `workbench` x2, `chair-office` x2, `laptop`, `monitor-desktop` x2, `cable-reel`, `locker-bank`, `whiteboard-rolling`, `trash-bin-small`, `water-dispenser`', lights: 'cool white panels group `server`, and a small red emergency strip (emissive only)' },
      { id: 'rooftop', desc: 'level 4 rooftop terrace', floor: '`stonePaving`', objects: '`bench-park` x4, `planter-brick` x6, `planter-box` x4, `table-round` x3, `chair-plastic` x12, `roof-water-tank` x1, `satellite-dish` x2, `lantern-hanging` x6, `fan-pedestal` x2, `flower-vase` x3 `on:table-round`, `lamp-wall` x4, `plant-potted-large` x3, `solar-heater`', lights: 'lanterns group `roof` auto dusk' },
    ],
    doors: 'unchanged from plan 045', windows: 'unchanged', stairs: 'unchanged', details: 'unchanged',
    structureTest: 'the manifest structure from plan 045 is unchanged (room ids, floors, lift, stairs)',
    exterior: 'nothing new (done in plan 045); this step only verifies the exterior still passes and adds the night lighting of the facade bands to the light manager if plan 045 did not.',
    signs: '`citadel-floor-1`..`citadel-floor-4` floor number plates (English only plus Tamil words for "floor" `தளம்`)',
    read: { id: 'meeting-screen', room: 'meeting-room', prompt: 'view project', object: 'large wall screen at the head of the meeting table' },
    seats: 'every conference chair at the table (at least 6 are seat interactables), the lobby sofas, bean bags',
    interiorTest: 'all floors reachable by the lift and by stairs; the meeting screen is within 6 m of the stair landing; the newsroom has at least 8 desks',
    interiorExtra: 'The exterior and lobby types count toward the 40 types.',
    readExtra: 'the dialogue is the featured project (GravityWrite) as in v1',
    e2eExtra: 'ride the lift to level 2 and open the screen dialogue; walk to the rooftop by stairs after the lift test using `walkTo`',
    extraShots: ',citadel-newsroom,citadel-meeting',
    est: 55,
    human: 'Judge the newsroom and meeting room look.',
  }),

  // ---------------------------------------------------------------- 047
  buildingPlan({
    id: '047', slug: 'broadcast-station', zone: 'broadcast', display: 'Broadcast Station', prompt: 'tune in', title: 'Radio and TV station (zone broadcast): studio, control room and the mast',
    goal: 'Build the GravitySocial broadcast station: a low modern broadcast building with a studio behind glass, a control room, an equipment room and reception, and a 40 m red and white lattice radio mast beside it with blinking aviation lights. The control-room console screen opens the broadcast project dialogue; the ON AIR sign switches on when the player is in the studio.',
    footprint: 'about 18 by 14 m', floors: 'one floor (height 4.2)', style: 'plaster wall tint `#e9ecef`, `flat` roof with parapet, trim `metalPainted`',
    rooms: [
      { id: 'reception', desc: 'reception and lounge, 6 by 6 m', floor: '`floorTile`', objects: '`reception-desk-modern`, `sofa-2` x2, `armchair` x2, `table-coffee`, `plant-office` x3, `wall-tv-large` x2, `magazine-rack`, `water-dispenser`, `sign-board` ("BROADCAST / ஒளிபரப்பு": add key `broadcast`), `on-air-sign` repeater, `ceiling-panel-light` x4, `picture-frame-set` x3, `rug-rect`, `wall-clock`, `ac-split`, `doormat`', lights: 'panels group `reception`' },
      { id: 'studio', desc: 'main studio, 10 by 8 m, acoustic', floor: '`carpet`', objects: '`news-desk`, `chair-conference` x2, `camera-studio` x3, `light-softbox` x4, `light-par-rig` x2, `teleprompter`, `green-screen`, `monitor-wall`, `mic-desk` x3, `mic-boom`, `speaker-studio` x2, `acoustic-panel` x14, `on-air-sign` over the door, `headphones-hook` x2, `ac-split` x2, `cable-reel`, `lamp-floor`, `bean-bag`, `sofa-2`', lights: 'studio lights group `studio` (bright), a switch panel at the door; ON AIR emissive turns on while the player is inside (system toggles `on-air-sign`)' },
      { id: 'control-room', desc: 'control room, 7 by 5 m, raised floor, glass window into the studio', floor: '`carpet`', objects: '`mixing-console`, `monitor-wall`, `chair-office` x3, `speaker-studio` x2, `patch-bay` x2, `server-rack` x2, `headphones-hook` x2, `acoustic-panel` x8, `desk-office`, `monitor-dual` x2, `keyboard-mouse` x2, `desk-lamp`, `ac-split`, `water-dispenser`, `wall-clock`, `phone-desk`', lights: 'dim cool panels group `control` and emissive meters' },
      { id: 'equipment-room', desc: 'transmitter and equipment room, 5 by 5 m', floor: '`concrete`', objects: '`server-rack` x4, `antenna-rack` x2, `patch-bay`, `network-box` x2, `compressor`, `fire-extinguisher` x2, `exit-sign`, `locker-bank`, `table-folding`, `stool`, `ac-split` x2, `tube-light` x3, `cable-reel`, `trash-bin-small`', lights: 'tube lights group `equipment`' },
    ],
    doors: 'main door south into `reception` (width 1.8, exterior, unlocked), `reception` to `studio` (acoustic double door, interior, unlocked), `studio` to `control-room` (interior), `control-room` to `equipment-room` (interior, unlocked), a back exit from `equipment-room` (exterior, locked)', windows: 'at least 6 including a wide interior window between control room and studio (a `glass` pane inside the partition: model it as a window entry on the shared wall)', stairs: 'none',
    details: 'window 6, door 2, signage 2, drainpipe 3, planter 3, bin 2, lamp 6; the mast and a satellite dish farm are extra exterior builders',
    structureTest: 'the studio is reached only through reception, the back exit is locked, the control-room window entry is on the wall shared with the studio',
    exterior: 'a 40 m lattice radio mast (new builder `radioMast({ height: 40 })` in `exterior.js`: a triangular lattice of thin members in 8 m segments painted red and white, guy wires as thin lines to 3 anchor blocks, 3 blinking red aviation lights as emissive spheres with `animated: { kind: "blink" }`), a satellite dish pair, a cable tray, a lit signboard, an entrance canopy, two planters, bollards.',
    signs: '`broadcast` (BROADCAST STATION / ஒளிபரப்பு நிலையம்), `on-air` (ON AIR)',
    read: { id: 'control-console', room: 'control-room', prompt: 'tune in', object: 'screen above the mixing console' },
    seats: 'chairs in the control room and reception sofas',
    interiorTest: 'the ON AIR sign object exists in `reception` and `studio`; `setOnAir` flips the emissive; the mast builder is covered by the exterior test',
    newProps: undefined,
    readExtra: 'the dialogue is the GravitySocial project as in v1',
    e2eExtra: 'walking into the studio turns the ON AIR emissive on (hook `listObjects()` reports `onAir: true`), leaving turns it off; the mast top is higher than 35 m (hook `listObjects()` reports the `radio-mast` height)',
    extraShots: ',broadcast-mast',
    human: 'Judge the mast and studio.',
  }),

  // ---------------------------------------------------------------- 048
  buildingPlan({
    id: '048', slug: 'gateway-gatehouse', zone: 'gateway', display: 'Security Gatehouse', prompt: 'cross gateway', title: 'Security gatehouse and control office (zone gateway)',
    goal: 'Build the GravityAuth gatehouse: a compound entrance with a boom barrier, a guard booth, a visitor lobby with a turnstile, a control office with a CCTV wall and a small server closet, plus a stretch of boundary wall with a sliding gate. The control-office monitor wall opens the auth project dialogue.',
    footprint: 'about 14 by 10 m', floors: 'one floor (height 3.6)', style: 'plaster wall tint `#cfd6d9`, `flat` roof with a projecting canopy, trim `metalPainted` (yellow-black safety stripes on the barrier)',
    rooms: [
      { id: 'visitor-lobby', desc: 'visitor lobby, 6 by 5 m', floor: '`floorTile`', objects: '`security-desk`, `turnstile` x2, `bench-wood` x2, `chair-waiting`, `sign-board` ("VISITORS / பார்வையாளர்கள்": key `visitors`), `key-cabinet`, `notice-board` x2, `wall-clock`, `fan-ceiling` x2, `plant-potted-small` x2, `water-dispenser`, `trash-bin-small`, `fire-extinguisher`, `exit-sign`, `table-side`, `picture-frame-set`, `tube-light` x3, `doormat`', lights: 'group `lobby`' },
      { id: 'gate-booth', desc: 'guard booth with a window onto the road, 4 by 3 m', floor: '`concrete`', objects: '`security-desk`, `guard-stool` x2, `cctv-bank`, `key-cabinet`, `table-side`, `kettle-tray`, `fan-pedestal`, `wall-clock`, `tube-light`, `locker-bank`, `chair-wooden`, `phone-desk`, `notice-board`, `fire-extinguisher`', lights: 'group `booth`' },
      { id: 'control-office', desc: 'control office, 6 by 5 m', floor: '`carpet`', objects: '`cctv-bank` x2, `monitor-wall`, `desk-office` x2, `chair-office` x3, `monitor-dual` x2, `keyboard-mouse` x2, `server-rack`, `whiteboard-rolling`, `ac-split`, `water-dispenser`, `wall-clock`, `desk-lamp`, `filing-cabinet`, `plant-office`, `ceiling-panel-light` x4, `exit-sign`', lights: 'panels group `control`' },
      { id: 'server-closet', desc: 'server closet, 3 by 3 m', floor: '`floorTileDark`', objects: '`server-rack` x3, `network-box` x2, `ac-split`, `fire-extinguisher`, `exit-sign`, `tube-light`, `locker-bank`, `table-folding`', lights: 'one tube light group `closet`' },
    ],
    doors: 'main door south into `visitor-lobby` (width 1.6, exterior, unlocked), a window-door from `gate-booth` to the road side (exterior, unlocked), `visitor-lobby` to `control-office` via the turnstile-side door (interior, unlocked), `control-office` to `server-closet` (interior, `locked: true`), `visitor-lobby` to `gate-booth` (interior)', windows: 'at least 6 including a wide booth window', stairs: 'none',
    details: 'window 6, door 2, signage 2, drainpipe 2, planter 2, bin 2, lamp 6; the barrier, boundary wall and sliding gate are extra exterior pieces',
    structureTest: 'the server closet is locked and not required for reachability of the other rooms (it is excluded by the checker only because it is locked: assert the checker treats it as a decorative-locked room and the manifest marks that door `locked`), the three other rooms are reachable',
    exterior: '`barrier-gate` across the road with a striped boom (placed by the decorate hook outside the footprint), a boundary wall of 20 m each side with pillars and a sliding gate leaf (decorative, open), CCTV cameras on poles (`cctv-bank` is indoor: build `cctv-pole` in the exterior kit), a canopy over the booth, bollards, a lit sign "SECURITY / காவல்" (key `security`, Tamil `பாதுகாப்பு`), stripes painted on the kerbs.',
    signs: '`security`, `visitors`',
    read: { id: 'control-monitors', room: 'control-office', prompt: 'cross gateway', object: 'the large monitor wall above the control desks' },
    seats: 'the lobby benches and the control chairs',
    interiorTest: 'the barrier has swing metadata and the player can pass beside it; the CCTV monitors have screen slots',
    readExtra: 'the dialogue is the GravityAuth project as in v1',
    e2eExtra: 'the boom barrier is an interactable `door`-kind that swings up with `E` (reuse the door state machine with a pivot at the housing; `listDoors()` includes `gate-barrier`)',
    human: 'Judge the gatehouse and barrier.',
  }),

  // ---------------------------------------------------------------- 049
  buildingPlan({
    id: '049', slug: 'transport-terminal', zone: 'transport', display: 'Ferry Terminal', prompt: 'enter hub', title: 'Harbour ferry terminal and bus stop (zone transport)',
    goal: 'Build the TransGenie ferry terminal on the quay: a covered concourse with ticket counters, a waiting hall, an office and departure boards, a gangway to a moored ferry boat, and the bus stop outside. The departure board opens the transport project dialogue.',
    footprint: 'about 28 by 16 m', floors: 'one floor (height 4.4)', style: 'plaster wall tint `#d9e6ef`, `gable` roof with `metalPainted` (blue), pitch 0.2, trim `metalPainted`',
    rooms: [
      { id: 'concourse', desc: 'main concourse, 12 by 10 m, open to the quay side', floor: '`stonePaving`', objects: '`departure-board` x2, `ticket-counter` x2, `ticket-machine` x2, `route-map-board` x2, `bench-bus-stop` x3, `luggage-trolley` x2, `luggage-suitcase` x3, `luggage-scale`, `plant-potted-large` x3, `life-jacket-rack`, `fan-ceiling` x4, `lamp-pendant` x4, `sign-board` x2 (key `ferry`), `trash-bin-small` x3, `wall-clock` x2, `water-dispenser`, `notice-board`, `exit-sign`, `fire-extinguisher`', lights: 'group `concourse` auto dusk' },
      { id: 'waiting-hall', desc: 'waiting hall, 8 by 8 m', floor: '`floorTile`', objects: '`chair-waiting` x6, `bench-wood` x2, `table-coffee` x2, `magazine-rack`, `water-dispenser`, `wall-tv-large`, `vending-machine`, `coffee-machine`, `plant-potted-small` x3, `ac-split` x2, `ceiling-panel-light` x6, `rug-rect`, `wall-clock`, `picture-frame-set` x2, `lamp-floor`, `trash-bin-small` x2', lights: 'group `waiting`' },
      { id: 'terminal-office', desc: 'terminal office, 6 by 5 m', floor: '`woodPlanks`', objects: '`desk-office` x2, `chair-office` x3, `monitor-desktop` x2, `keyboard-mouse` x2, `phone-desk`, `filing-cabinet` x2, `cabinet-low`, `printer-copier`, `whiteboard-rolling`, `route-map-board`, `wall-clock`, `fan-ceiling`, `plant-office`, `water-filter`, `lamp-table`', lights: 'group `office`' },
    ],
    doors: 'two wide openings from the quay side and the road side into `concourse` (width 3.0, `exterior`, unlocked, both), `concourse` to `waiting-hall` (interior wide opening 2.4), `concourse` to `terminal-office` (interior, unlocked)', windows: 'at least 8', stairs: 'none',
    details: 'window 8, door 2, signage 3, drainpipe 4, planter 4, bin 4, lamp 8; plus a gangway, bollards, a ferry boat and a bus stop shelter',
    structureTest: 'both exterior openings are at least 3.0 m wide and unlocked',
    exterior: 'a long overhanging canopy toward the water, painted steel columns, a gangway (a walkable `addFloor` ramp from the quay to the ferry deck with handrails), a moored ferry boat (new builder `ferry-small` in `src/world/props/sets/harbour.js`: 18 m, two decks, a wheelhouse, a bob metadata; not walkable except the gangway and the deck), mooring bollards, lifebuoys, a lit sign "FERRY TERMINAL / படகுத்துறை" (keys `ferry`), the bus stop shelter (`bus-stop-shelter` from plan 039) with a timetable board, lamps.',
    signs: '`ferry`, `timetable`',
    read: { id: 'departure-board', room: 'concourse', prompt: 'enter hub', object: 'the large departure board' },
    seats: 'the shelter benches and waiting chairs',
    interiorTest: 'the gangway is walkable from the quay to the ferry deck (walk graph) and the deck edge blocks (handrails)',
    readExtra: 'the dialogue is the TransGenie project as in v1',
    e2eExtra: 'walk the gangway onto the ferry deck by `walkTo` and the player is on the deck (y near the deck height)',
    extraShots: ',ferry-terminal-quay',
    human: 'Judge the terminal against a real ferry jetty.',
  }),

  // ---------------------------------------------------------------- 050
  buildingPlan({
    id: '050', slug: 'temple-community-hall', zone: 'temple', display: 'Community Hall', prompt: 'read the wall', title: 'Community hall and open-source cafe (zone temple)',
    goal: 'Build the open-source community hall and cafe (the zone id `temple` is only an id: the building is a civic hall with a cafe, NO religious imagery): a cafe counter with seating, a meetup hall with a small stage and projector, a kitchen counter, and a loft co-working space reached by stairs. The code wall screen in the hall opens the open-source AI agent dialogue.',
    footprint: 'about 20 by 16 m', floors: 'ground floor (height 4.0) and a loft level at y 4.2 (height 3.2) over the north third', style: 'plaster wall tint `#efe0c0`, `hip` roof with `roofTile`, pitch 0.45, overhang 0.8, trim `woodDark`, pillared front porch',
    rooms: [
      { id: 'cafe', desc: 'cafe, 9 by 8 m', floor: '`woodPlanks`', objects: '`counter-straight` with `coffee-machine`, `cash-counter`, `bar-counter`, `table-round` x4, `chair-cane` x12, `table-bar`, `stool-bar` x4, `menu-board` x2, `plant-potted-large` x3, `lamp-pendant` x5, `fan-ceiling` x3, `picture-frame-set` x4, `shelf-wall` with `book-row` and `flower-vase`, `rug-rect`, `wall-clock`, `tea-glass-set` x6 `on:table-round`, `plate-set` x4, `water-jug`, `condiment-tray`, `display-case-glass`, `notice-board` (community notices), `doormat`', lights: 'pendants group `cafe` auto dusk, switch at the door' },
      { id: 'hall', desc: 'meetup hall with a stage, 11 by 8 m', floor: '`woodPlanks`', objects: '`chair-plastic` x40 in `grid:5x8`, a stage platform built from `podium` x3 and `table-folding` x2 as a dais (plus a `rug-rect`), `projector-ceiling`, `projector-screen`, `wall-tv-large` (the code wall, 3 m slot), `speaker-studio` x2, `mic-desk`, `whiteboard-rolling` x2, `banner-hanging` x2, `fan-ceiling` x4, `plant-potted-large` x2, `curtain-pair` x4, `bench-wood` x2, `lamp-wall` x4, `notice-board`, `ceiling-panel-light` x6, `fire-extinguisher`, `exit-sign` x2, `trash-bin-small` x2', lights: 'groups `hall-front` and `hall-back`, switch pair at the door' },
      { id: 'kitchen', desc: 'cafe kitchen, 5 by 4 m', floor: '`floorTileDark`', objects: '`counter-kitchen-straight` x2, `stove-gas`, `sink-double`, `fridge`, `rice-cooker`, `pot-set`, `pan-hanging`, `shelf-utensils`, `spice-rack`, `water-filter`, `hood-chimney`, `tube-light` x2, `table-folding`, `trash-bin-small`, `grinder-wet`', lights: 'tube lights group `kitchen`' },
      { id: 'loft', desc: 'loft co-working space (level 1), 11 by 5 m', floor: '`woodPlanks`', objects: '`desk-office` x4, `chair-office` x4, `laptop` x3, `monitor-desktop` x2, `keyboard-mouse` x4, `bean-bag` x3, `bookshelf-tall` x2, `plant-office` x3, `lamp-table` x3, `whiteboard-rolling`, `table-coffee`, `sofa-2`, `rug-round`, `wall-clock`, `fan-ceiling` x2, `ac-split`, `desk-lamp` x3, `kanban-board`', lights: 'group `loft`' },
    ],
    doors: 'main door south into `cafe` (width 1.8, exterior, unlocked), `cafe` to `hall` (wide interior opening 2.4), `cafe` to `kitchen` (interior), a side exterior door into `hall` (width 1.6, exterior, unlocked)', windows: 'at least 12', stairs: 'a staircase from `hall` to `loft` (rise 4.2, width 1.4)',
    details: 'window 12, door 2, signage 2, drainpipe 4, planter 6, bin 3, lamp 6; plus a pillared porch and a rangoli-free clean entrance',
    structureTest: 'the loft is reachable only by the staircase, both exterior doors are unlocked',
    exterior: 'a front porch with 4 carved-look wooden pillars (portico), a hip tile roof with overhanging eaves, shutters, a chalkboard sign on an easel outside ("OPEN SOURCE CAFE / திறந்த மூல உணவகம்", key `oss-cafe`, Tamil draft), bicycle stands with 3 parked cycles, tubs of plants, string lights across the porch, a notice board by the door.',
    signs: '`oss-cafe`, `community-hall` (COMMUNITY HALL / சமுதாயக் கூடம்)',
    read: { id: 'code-wall', room: 'hall', prompt: 'read the wall', object: 'the large "code wall" screen behind the stage' },
    seats: 'the cafe chairs, the hall chairs (at least 10 of them) and the bean bags',
    interiorTest: 'there are at least 36 chair items in the hall; the stage podiums do not block the aisle (a 1.0 m wide path from the door to the code wall)',
    readExtra: 'the dialogue is the open-source AI agent project as in v1; no part of the building models idols or religious imagery',
    e2eExtra: 'stairs to the loft work (hold `w` from the stair foot: `playerState().y` reaches 4.0)',
    human: 'The building must read as a community cafe, not a temple.',
  }),
];
