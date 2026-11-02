import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';
import { buildingPlan } from '../buildingPlan.mjs';

const propsPlan = (o) => ({
  epic: 'E4', est: 55, arch: 'section 10.5 and decision D18',
  read: ['src/world/props/catalog.js', 'src/world/props/sets/seating.js', 'src/world/props/sets/storage.js', 'tests/unit/props/allProps.test.js', 'src/engine/materials.js', 'docs/world-conventions.md'],
  allowed: ['portfolio/src/**', 'portfolio/tests/**'],
  ...o,
});

export default [
  // ---------------------------------------------------------------- 041
  propsPlan({
    id: '041', name: 'props-set-d', title: 'Prop set D: office, technology and broadcast studio (44 types)',
    goal: ['Fourth furniture set for the office tower, the broadcast station, the gatehouse control room and the garage and studio buildings. Same quality bar and metadata rules as plans 019, 022 and 023 (read the existing sets first). Screens carry a `screen` metadata slot (`userData.screen = { w, h, x, y, z }`) so buildings can show content or an emissive glow.'],
    steps: [
      {
        title: 'Office furniture and equipment (16 types)',
        items: [
          '`src/world/props/sets/office.js` (category `office`): `monitor-desktop`, `monitor-dual`, `laptop` (open, screen slot), `keyboard-mouse` (not solid), `desk-cubicle` (L-shaped desk), `cubicle-partition` (fabric panel 1.5 m high), `standing-desk` (adjustable legs), `printer-copier` (large floor unit with a tray and a control panel), `conference-table` (a 6 m boat-shaped table), `chair-conference` (padded, wheels), `reception-desk-modern` (curved front with a logo slot), `whiteboard-rolling`, `kanban-board` (a board with 4 columns of sticky notes), `bean-bag`, `desk-lamp`, `phone-desk`.',
          '`tests/unit/props/office.test.js`: exact list; desk heights 0.7 to 0.76 m (standing desk 1.0 to 1.2); monitors have a `screen` slot; `keyboard-mouse` not solid; conference table length 5 to 7 m.',
        ],
        verify: [vt('tests/unit/props/office.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/office.js')],
      },
      {
        title: 'Server, building services and office extras (12 types)',
        items: [
          '`src/world/props/sets/tech.js` (category `tech`): `server-rack` (42U rack with 12 blade fronts and blinking LED dots as emissive points), `network-box` (wall box with cables), `projector-ceiling`, `projector-screen` (pull-down), `water-dispenser`, `coffee-machine`, `vending-machine` (glass front with product rows), `plant-office` (snake plant in a square pot), `ceiling-panel-light` (600 mm panel, a `lightSockets` entry), `fire-extinguisher` (red cylinder with a wall bracket, not solid), `exit-sign` (green emissive), `wall-tv-large` (large screen with a slot).',
          '`tests/unit/props/tech.test.js`: exact list; `server-rack` height 1.9 to 2.1 m and at least 12 front parts; screens have slots; `ceiling-panel-light` has a socket; the extinguisher is not solid.',
        ],
        verify: [vt('tests/unit/props/tech.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/tech.js')],
      },
      {
        title: 'Broadcast studio (16 types)',
        items: [
          '`src/world/props/sets/media.js` (category `media`): `mic-desk` (desk microphone on a flexible arm with a pop filter), `mic-boom` (boom stand), `mixing-console` (a 2 m console with 24 faders and knobs as small parts, a meter strip as emissive dots), `camera-studio` (camera on a pedestal tripod with a viewfinder), `light-softbox`, `light-par-rig` (a ceiling grid bar with 6 lamps), `teleprompter`, `green-screen` (a green backdrop with a stand), `monitor-wall` (3 by 2 grid of screens, slots), `speaker-studio` (monitor speaker pair on stands), `on-air-sign` (a red emissive box with the text ON AIR; the emissive follows `userData.on`), `headphones-hook`, `patch-bay` (rack panel with cable ends), `acoustic-panel` (a fabric panel with a wooden frame, foam texture look), `news-desk` (curved two-person desk with a front logo slot), `antenna-rack` (a rack with a small dipole array).',
          '`tests/unit/props/media.test.js`: exact list; the mixing console has at least 24 fader parts; `on-air-sign.userData.on` is a boolean the building can toggle (provide `setOnAir(object, bool)` in the same file); `monitor-wall` has 6 screen slots; the whole catalog now has at least 215 registered types.',
          'Look at `npm run shots -- --fixture props --plan 041` (best effort) and fix obvious defects.',
        ],
        verify: [vt('tests/unit/props/media.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/media.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/office.test.js', 'tests/unit/props/tech.test.js', 'tests/unit/props/media.test.js', 'tests/unit/props/allProps.test.js')],
    freeze: ['portfolio/tests/unit/props/office.test.js', 'portfolio/tests/unit/props/tech.test.js', 'portfolio/tests/unit/props/media.test.js'],
  }),

  // ---------------------------------------------------------------- 042
  propsPlan({
    id: '042', name: 'props-set-e', title: 'Prop set E: library, museum, school, post office, security and transport (49 types)',
    goal: ['Fifth furniture set for the library, the town hall, the academy, the post office, the gatehouse and the ferry terminal. Same quality bar and metadata rules as before. Items that show text (plaques, boards, departure board) carry `userData.textSlots`.'],
    steps: [
      {
        title: 'Library and museum (20 types)',
        items: [
          '`src/world/props/sets/library.js` (category `library`): `library-stack` (a tall double-sided book stack 2.4 m high, 2 m long, 6 shelf levels filled with varied spines), `reading-desk` (long desk with two lamps), `card-catalog` (a wall of small drawers with brass pulls), `reading-lamp-green` (bankers lamp), `book-cart`, `ladder-library` (rolling ladder on a rail), `globe` (a globe on a wooden stand, spins as metadata), `map-table` (a table with a large map on top), `archive-box`, `scroll-case`.',
          '`src/world/props/sets/museum.js` (category `museum`): `display-case-glass` (a glass-topped case with a lit base, items slot), `plaque-wall` (wall plate with text slot), `podium`, `rope-barrier` (two posts with a rope, not solid), `award-wall` (a wall panel with 9 framed certificates), `trophy-cup`, `flag-stand`, `timeline-wall` (a long wall panel 6 m with year marks and 8 text slots), `bust-abstract` (an abstract geometric head on a pedestal, no real person), `banner-hanging` (a hanging cloth banner with a text slot).',
          '`tests/unit/props/libraryMuseum.test.js`: exact lists; `library-stack` height 2.2 to 2.6 m with at least 40 book parts before merging NOT required, but a triangle count over 600; `rope-barrier` not solid; `timeline-wall` has 8 text slots; `globe` has animated metadata kind `spin` (slow).',
        ],
        verify: [vt('tests/unit/props/libraryMuseum.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/library.js', 'src/world/props/sets/museum.js')],
      },
      {
        title: 'School and post office (17 types)',
        items: [
          '`src/world/props/sets/school.js` (category `school`): `desk-school` (a two-seat bench desk with a slanted top), `blackboard` (a wall board 3.6 m wide with a chalk tray, text slot), `teacher-desk`, `lab-bench` (a long bench with a sink and gas taps), `microscope`, `beaker-set` (glassware group, not solid), `wall-chart` (a framed chart with a text slot), `school-bell` (a brass hand bell).',
          '`src/world/props/sets/post.js` (category `post`): `post-box-red` (a round-top red pillar box with a slot and a plate), `parcel-shelf`, `scale-parcel`, `stamp-desk` (a slanted desk with a stamp pad and an ink pot), `counter-grille` (a service counter 3 m wide with a brass grille window and a ledge), `queue-rope` (stanchions with a belt, not solid), `sorting-rack` (a wall of pigeonholes 4 by 6), `mail-sack`, `parcel-stack`.',
          '`tests/unit/props/schoolPost.test.js`: exact lists; `desk-school` seats 2; `sorting-rack` has 24 holes; `post-box-red` height 1.4 to 1.7 m; `blackboard` has a text slot; small items not solid.',
        ],
        verify: [vt('tests/unit/props/schoolPost.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/school.js', 'src/world/props/sets/post.js')],
      },
      {
        title: 'Security and transport (12 types)',
        items: [
          '`src/world/props/sets/security.js` (category `security`): `barrier-gate` (a striped boom barrier on a housing, `animated: { kind: "swing" }`), `security-desk` (a console desk with a monitor bank), `cctv-bank` (a wall of 6 small screens, slots), `key-cabinet` (wall cabinet with hooks and keys), `turnstile` (tripod turnstile, solid), `guard-stool`.',
          '`src/world/props/sets/transport.js` (category `transport`): `ticket-counter` (a counter with two windows and a queue rail), `ticket-machine` (a kiosk with a screen), `departure-board` (a large board, 8 text rows, text slots, emissive), `luggage-scale`, `route-map-board` (a board with a coloured line map), `life-jacket-rack` (a rack with 8 orange life jackets).',
          '`tests/unit/props/securityTransport.test.js`: exact lists; the barrier has swing metadata and a boom 3 to 4.5 m long; the departure board has 8 text slots; the catalog now has at least 260 registered types.',
          'Look at `npm run shots -- --fixture props --plan 042` (best effort) and fix obvious defects.',
        ],
        verify: [vt('tests/unit/props/securityTransport.test.js', 'tests/unit/props/allProps.test.js'), exists('src/world/props/sets/security.js', 'src/world/props/sets/transport.js')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/props/libraryMuseum.test.js', 'tests/unit/props/schoolPost.test.js', 'tests/unit/props/securityTransport.test.js', 'tests/unit/props/allProps.test.js')],
    freeze: ['portfolio/tests/unit/props/libraryMuseum.test.js', 'portfolio/tests/unit/props/schoolPost.test.js', 'portfolio/tests/unit/props/securityTransport.test.js'],
  }),

  // ---------------------------------------------------------------- 043
  buildingPlan({
    id: '043', slug: 'notice-post-office', zone: 'notice', display: 'Post Office', prompt: 'collect resume', title: 'Post Office (zone notice): resume at the counter, journey 2',
    goal: 'Build the Post Office, the first converted landmark, in the style of a small town post office (cream plaster, red-oxide hip tile roof, pillared front veranda, a red pillar box, a hanging board in English and Tamil). The resume is collected at the counter: pressing `E` there downloads the PDF exactly as v1 did and shows the existing notice dialogue. Also create the shared dialogue expectation file for all 14 zones and prove journey 2.',
    footprint: 'about 14 by 10 m', floors: 'one floor (level 0, height 3.6)', style: 'plaster wall tint `#f3e3b8`, `hip` roof with `roofTile`, pitch 0.5, overhang 0.8, trim `woodDark`',
    rooms: [
      { id: 'hall', desc: 'public counter hall, 7 by 8 m', floor: '`floorTile`', objects: '`counter-grille` x1 along the back wall with a gap for the postal clerk, `queue-rope` x2, `post-box-red` inside the door, `bench-wood` x2, `notice-board` x2, `wall-clock`, `fan-ceiling` x3, `plant-potted-large` x2, `table-side`, `stamp-desk` x2, `scale-parcel`, `sign-board` (Tamil POST OFFICE / அஞ்சல் அலுவலகம்), `lamp-pendant` x2, `picture-frame-set`, `doormat`, `trash-bin-small`', lights: 'two pendants group `hall` auto dusk plus a switch at the door' },
      { id: 'sorting-room', desc: 'sorting room behind the counter, 7 by 5 m', floor: '`floorTileDark`', objects: '`sorting-rack` x2, `parcel-shelf` x3, `parcel-stack` x3, `mail-sack` x4, `table-folding` x2, `chair-wooden` x2, `shelf-wall`, `tube-light` x3, `fan-pedestal`, `filing-cabinet` x2, `water-filter`, `book-stack`, `paper-tray` x2', lights: 'three tube lights group `sorting`, switch at the door' },
      { id: 'postmaster-office', desc: 'postmaster office, 5 by 4 m', floor: '`woodPlanks`', objects: '`desk-wood`, `chair-office`, `chair-wooden` x2, `bookshelf-low`, `filing-cabinet`, `cabinet-glass`, `safe-box`, `monitor-desktop`, `keyboard-mouse`, `phone-desk`, `lamp-table`, `rug-rect`, `wall-clock`, `picture-frame-set`, `fan-ceiling`, `printer-copier`, `plant-office`', lights: 'table lamp and one ceiling light group `office`' },
    ],
    doors: 'main door south into `hall` (width 1.6, `exterior`, unlocked), a staff door from `hall` to `sorting-room` (interior), a door from `sorting-room` to `postmaster-office` (interior, unlocked), a back door from `sorting-room` to outside (`exterior`, `locked: true`)', windows: 'at least 8 (3 on the front, 2 each side, 1 back)', stairs: 'none; a ramp is not needed',
    details: 'window 8, door 2, signage 2, drainpipe 4, planter 4, bin 2, lamp 4; the exterior kit adds a veranda with 4 pillars (`portico`), a red pillar box outside, a flagpole, a notice board by the door',
    structureTest: 'the back door is locked and the other exterior door is not, the hall is within 6 m of the main door',
    exterior: 'a pillared veranda (`portico` with 4 columns and steps), a hip tile roof with deep eaves, arched windows with shutters, `post-box-red` outside on the left, a flagpole with a flag, `signboard` "POST OFFICE / அஞ்சல் அலுவலகம்" above the veranda, planters at the steps, two wall lamps, a bicycle stand.',
    signs: '`post-office` (already in the vocabulary), `post-hours` (OPEN 10-5 / திறந்திருக்கிறது)',
    read: { id: 'post-counter', room: 'hall', prompt: 'collect resume', object: 'clerk counter (`counter-grille`) in the hall' },
    seats: 'the two waiting benches',
    interiorTest: 'the counter is within 4 m of the entrance and reachable with a clear path, both benches are seat interactables',
    interiorExtra: 'Use the post-office props of set E generously.',
    readExtra: 'for this zone `E` at the counter keeps the v1 behaviour of `tryAction`: it triggers the resume download of `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` as `Kaviyarasu_Fullstack_Engineer_Resume.pdf`, shows the toast RESUME DOWNLOADED, a small camera shake and the interact sound, and ALSO opens the notice dialogue (move this behaviour into the interactable `onUse`)',
    e2eExtra: 'listen for the download event on `E` at the counter: `download.suggestedFilename()` is `Kaviyarasu_Fullstack_Engineer_Resume.pdf` (journey 2 of the spec: arrive, door opens with `E`, step inside with no loading screen, counter, `E`, download)',
    extra4: [
      'Create `tests/fixtures/zoneExpect.json` for ALL 14 zones from the content as it is today: `{ "<zoneId>": { "title": "<display name from ARCHITECTURE 10 / the D9 mapping>", "mustInclude": ["<two or three distinctive strings that appear in the dialogue today>"] } }`. Display names: plaza Grand Hotel, notice Post Office, forge Engineering Workshop, citadel GravityWrite HQ, broadcast Broadcast Station, gateway Security Gatehouse, transport Ferry Terminal, temple Community Hall, workshop Startup Garage, freshnote Design Studio, library Public Library, academy Academy, lighthouse Lighthouse, milestones Town Hall. Read `src/content/dialogues.js` and the content files to pick the strings (project names, company names, numbers that exist today; never invent). `tests/unit/content/zoneExpect.test.js`: all 14 ids present, each has a title and at least 2 `mustInclude` strings, and each string occurs in the rendered text of the matching dialogue builder (render with a minimal fake DOM or by reading the text nodes of the builder output).',
    ],
    verify4: [vt('tests/unit/content/zoneExpect.test.js')],
    freezeExtra: ['portfolio/tests/unit/content/zoneExpect.test.js', 'portfolio/tests/fixtures/zoneExpect.json'],
    extraShots: ',post-veranda',
    human: 'Walk the Post Office and compare with a real Indian post office; check the Tamil sign.',
  }),

  // ---------------------------------------------------------------- 044
  buildingPlan({
    id: '044', slug: 'forge-workshop', zone: 'forge', display: 'Engineering Workshop', prompt: 'inspect skills', title: 'Engineering Workshop (zone forge): tools, electronics and the skills board',
    goal: 'Build the Engineering Workshop, a small-scale engineering works of the kind found in Tamil Nadu industrial lanes: a shop floor with lathe and drill press, a tool store, an electronics lab and an office; exterior with a corrugated tin roof, a roller shutter, a chimney and a painted signboard. The skills board on the shop floor opens the tech-skills dialogue. This plan also adds the tool props that the garage workshop reuses.',
    footprint: 'about 18 by 14 m', floors: 'one floor (height 4.2 for the shop floor)', style: 'plaster wall tint `#c9c2b2` (concrete grey), `flat` roof is not used: use `gable` with `metalPainted` corrugated look (material `metalPainted`), pitch 0.25, trim `metalPainted`',
    rooms: [
      { id: 'shop-floor', desc: 'main machine floor, 11 by 9 m', floor: '`concrete`', objects: '`lathe-machine` x2, `drill-press` x2, `workbench` x4, `bench-vise` x4, `toolbox` x3, `pegboard-tools` x3 on walls, `compressor`, `shelf-industrial` x2, `parts-bins` x3, `welding-mask` x2, `cable-reel` x2, `fan-pedestal` x2, `tube-light` x6, `fire-extinguisher` x2, `exit-sign`, `sign-board` (Tamil text slot "SKILLS" board position), `trash-bin-small`, `water-dispenser`, `stool` x3, `wall-clock`', lights: 'six tube lights group `shop` plus a big switch at the door' },
      { id: 'tool-store', desc: 'tool and parts store, 5 by 4 m', floor: '`concrete`', objects: '`shelf-industrial` x4, `parts-bins` x4, `toolbox` x2, `cable-reel` x2, `archive-box` x3, `filing-cabinet`, `table-folding`, `stool`, `tube-light` x2, `locker-bank`, `pegboard-tools`, `rope-coil`, `book-stack`, `trash-bin-small`', lights: 'two tube lights group `store`' },
      { id: 'electronics-lab', desc: 'electronics bench room, 6 by 5 m', floor: '`floorTile`', objects: '`workbench` x2, `oscilloscope` x2, `soldering-station` x2, `printer-3d`, `monitor-desktop` x2, `laptop`, `keyboard-mouse` x2, `chair-office` x3, `server-rack`, `network-box`, `whiteboard-rolling`, `shelf-wall` x2, `parts-bins` x2, `desk-lamp` x2, `ac-split`, `fan-ceiling`, `plant-office`', lights: 'panel lights group `lab`' },
      { id: 'office', desc: 'works office, 5 by 4 m', floor: '`floorTile`', objects: '`desk-wood`, `chair-office`, `chair-wooden` x2, `filing-cabinet` x2, `bookshelf-low`, `cabinet-low`, `monitor-desktop`, `phone-desk`, `wall-clock`, `picture-frame-set`, `fan-ceiling`, `water-dispenser`, `rug-rect`, `plant-potted-small`, `printer-copier`', lights: 'one tube light and a lamp group `office`' },
    ],
    doors: 'a roller-shutter door south into `shop-floor` (width 3.0, height 3.0, `exterior`, unlocked, treated as a normal door leaf in the kit with the shutter drawn as a ribbed leaf), a small pedestrian door beside it into `shop-floor` (width 1.2, `exterior`, unlocked), `shop-floor` to `tool-store`, `shop-floor` to `electronics-lab`, `electronics-lab` to `office` (interior doors)', windows: 'at least 8 high strip windows', stairs: 'none',
    details: 'window 8, door 2, signage 2, drainpipe 4, planter 2, bin 3, lamp 4; the exterior has a chimney stack, a roller shutter, stacked pallets and a water drum',
    structureTest: 'the roller-shutter door is at least 3.0 m wide, both exterior doors are unlocked, the four rooms are all reachable',
    exterior: 'corrugated metal roof (ribbed `metalPainted`), ribbed roller shutter leaf half raised, a brick chimney stack with a cap, a painted signboard "ENGINEERING WORKS / பொறியியல் பணிமனை" (add key `workshop-sign`), pallets, an oil drum and a water tank, wall lamps, two windows with bars (grille), a small shed lean-to.',
    signs: '`workshop-sign`, `skills-board` ("SKILLS" / "திறன்கள்")',
    read: { id: 'skills-board', room: 'shop-floor', prompt: 'inspect skills', object: 'big skills board (a `sign-board` with the Tamil and English heading) on the long wall of the shop floor' },
    seats: 'the stools and the office chair',
    interiorTest: 'the skills board is within 8 m of the main door and clear; lathes are solid; the electronics lab has 2 oscilloscopes',
    newProps: { cat: 'tools', file: 'tools', types: ['workbench', 'toolbox', 'pegboard-tools', 'lathe-machine', 'drill-press', 'bench-vise', 'parts-bins', 'oscilloscope', 'soldering-station', 'printer-3d', 'cable-reel', 'welding-mask', 'compressor', 'shelf-industrial'], note: 'machines have at least 8 distinct parts (lathe: bed, headstock, chuck, tailstock, carriage, handwheels, motor cover, base)', test: 'lathe length 1.4 to 2.2 m, workbench height 0.85 to 0.95 m, small tools not solid' },
    freezeExtra: [],
    human: 'Judge whether the workshop reads as a real engineering works.',
  }),
];
