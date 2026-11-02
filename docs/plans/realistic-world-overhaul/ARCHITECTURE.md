# ARCHITECTURE - realistic-world-overhaul

Every plan session reads this first and follows it. Section 10 (written at split time) is final and wins over any earlier section where they differ (for example it replaces the `public/` folder with `assets/` as the Vite public dir). Built only from `_planning/requirements.md` (D#, A#) and the spec `docs/specs/2026-10-30-realistic-world-overhaul-design.md`. Where a value is not decided there, it says "fixed by plan 001" and plan 001 writes the value back into this file.

## 1. Stack
- Language: JavaScript (ES modules), no TypeScript (current code is JS; D5 does not add TS).
- Rendering: Three.js, the current stable release at install time, pinned exactly by `package-lock.json` (D5, A9). Replaces r147 from CDN.
- Build: Vite, static output only, `base: '/portfolio/'` (D5, A22).
- Audio: Howler from npm, not CDN (A9).
- Models: glTF/GLB, compressed with meshopt/draco; textures KTX2 or WebP (A7). Decoders self-hosted in the build output (A28).
- Fonts: Inter, Orbitron, Noto Sans Tamil, all OFL, self-hosted with licence text (A9, A28).
- Tests: Vitest (logic), `@playwright/test` driving the installed system Chrome, `channel: 'chrome'`, no browser download (D13, A9).
- Dev-only tools: a glTF optimiser, a PDF text extractor (the machine has `pdftotext`), a texture compressor; none ship (A9).
- Runtime: Node v20.19.5 and npm 10.8.2 are on this machine. Windows 11; scripts must work in Git Bash and PowerShell (use Node scripts, not shell-only tricks).
- No database, backend, auth or runtime jobs (N/A areas).

## 2. Structure
Single repo `portfolio/` (git root), branch `world-v2` for all work; `main` untouched until approval (D27).
```
index.html              Vite entry (no CDN scripts)
public/                 files served as-is: resume PDF (no-space name), decoders, fonts, fallback assets
src/
  main.js               boot (keeps today's boot order idea)
  config.js             constants (world radius ~300 m, tiers, budgets)
  state.js              shared game state
  engine/               renderer, scene, camera rig, loader/streaming, quality tiers, materials
  world/
    layout/             town plan data + generator (roads, plots)
    terrain/ water/ sky/ weather/ vegetation/
    buildings/<zoneId>/ one folder per landmark: manifest.json + builder + props
    props/ npc/ life/
  systems/              input (incl. touch), controller, collision, interaction, doors, lights, sit, audio, clock
  ui/                   hud, dialogue, minimap, map, settings, tour, text-mode, credits
  content/              resume content (rewritten per D12)
  util/
assets/                 shipped assets (textures, models, audio), plus LEDGER.json
scripts/                check-ledger, check-size, check-budget, check-buildings, check-content, check-phone, fetch-asset helpers
tests/unit/  tests/e2e/ Vitest and Playwright specs
.github/workflows/      pages.yml
docs/                   specs, plans
```
Naming: files `camelCase.js`; folders `kebab-case` or zone id; one building = one folder named by its zone id (D9, A30). Zone ids never change: `plaza notice forge citadel broadcast gateway transport temple workshop freshnote library academy lighthouse milestones`.
Raw asset downloads live OUTSIDE the repo at `..\portfolio-asset-cache\<source>\<id>\` (A29).

## 3. Data model (no database)
Static JSON and JS data only. Times are not stored. Distances are metres, rotations radians.
- **Asset ledger** `assets/LEDGER.json`: array of `{ file, sourceUrl, host, licence: "CC0", author, sha256, bytes, notes }`. Every shipped file under `assets/` and `public/` (textures, models, audio, fonts with their OFL licence entry) has one entry. Fonts: licence `"OFL"` is allowed only for the three fonts in section 1; everything else must be `CC0` (D11, D28).
- **Building manifest** `src/world/buildings/<zoneId>/manifest.json`: `{ id, displayName, prompt, footprint, rooms: [{ id, floor, bounds, surface, lights, objects:[{type,count}] }], doors: [{ id, from, to, locked }], interactables: [{ id, kind: "read|sit|switch|door|elevator", dialogueKey? }], exteriorDetails: [...], npcLoops: [{ room, waypoints }] }`. `npm run check:buildings` reads these (D18, A27).
- **Town plan** `src/world/layout/town.json`: plots, roads (splines), paths, harbour, beach, forest and zone anchors; consumed by terrain, props and tests (D14).
- **Content** `src/content/*.js`: resume content; `contact` has NO phone field (D30).
- Collision and nav data are derived from manifests and the town plan at build/test time, not hand-written (A10).

## 4. API contracts (internal, no network API)
No HTTP API. Contracts that plans must respect:
- `ZONE_LAYOUT` keeps `id`, `name`, `x`, `z`, `r`, `prompt` (names/prompts renamed per A30; positions change per D14).
- Dialogue contract: `openDialogue(zoneId, key?)` renders existing dialogue builders from `src/content`; opened by the `read` interactable with `E` (A5).
- Dev/test hook, present only when `import.meta.env.MODE !== 'production'`: `window.__world = { teleport(zoneId|x,z,y), listDoors(), listLights(), listObjects(), listNpcs(), rendererInfo(), audioState(), setTime(f), setWeather(w), quality }`. It must not appear in the production build (A17, A26).
- URL params kept: `?time=` (0..1); added `?weather=`, `?seed=` (A19, A17).
- Errors: console errors are bugs; the boot smoke test fails on any.

## 5. Auth and authorization
None. One anonymous visitor. No identity, sessions or roles (N/A).

## 6. Real-time, background jobs, external services
- No server, sockets or jobs. All "life" runs client-side per frame (D8).
- External services at runtime: none (fonts, three, howler, decoders all self-hosted/bundled). The only external contact is the visitor opening LinkedIn/GitHub links.
- Download-time external contact (plan sessions only): direct-download CC0 hosts Poly Haven, ambientCG, Kenney, Poly Pizza, OpenGameArt (CC0-tagged, direct links) (A21). In tests nothing is downloaded; tests read the committed assets and the ledger.
- Streaming: the world loads in areas; town centre + hotel first, other areas and interiors by distance, interiors hidden when the player is outside; no loading screen after first load (A13, D29). Chunk failure shows a retry UI (A28).

## 7. Cross-cutting rules
- Logging: `console.error` only for real errors; `console.warn` for recoverable ones; no analytics (out of scope).
- Config: constants in `src/config.js`; no secrets exist; no tokens in the repo.
- Privacy: the phone number must not appear in `src/`, `public/` (except the resume PDF, D31) or the build; email is click-to-reveal built by script; `npm run check:phone` enforces it (D26, D30).
- Facts: new content may only use facts present in the resume PDF text and the pre-rewrite content; `npm run check:content` enforces the A24 token rule (D12, A3).
- Downloaded data is never executed; each download in its own folder; ledger entry with sha256 before use (A1).
- Determinism: all randomness uses the seeded RNG (`?seed=`) so tests repeat (A17).
- Performance budgets (tuned by plan 001, then written back here): desktop <= 600 draw calls and <= 3M visible triangles; phone <= 250 draw calls and <= 800k (A7). Texture sizes 2K hero / 1K default / 512 phone. Phone first-session download < 25 MB; total shipped assets <= 80 MB; each file < 20 MB (D29, A8).
- Tiers: `low | medium | high`, auto-detected, user-overridable in a settings menu, plus reduced motion (A12). Phone tier: no point lights, about half decor (D29).
- Accessibility: reduced-motion option, keyboard-operable settings and map, text mode (D7).
- Touch: joystick, context action button (= `E`), camera-toggle and map buttons (A25).
- Resilience: WebGL context loss handled; no-WebGL detection routes to the fallback page (A28).
- No git commits by plan sessions unless the runner snapshots; nothing on `main` (D27).

## 8. Testing
- Unit/integration: `npm test` (Vitest, files in `tests/unit/`). Covers collision, camera solver, layout/nav reachability, manifests, ledger, content-fact check, phone check, NPC walkable paths, surface-to-sound map, zone id/name consistency.
- E2E: `npm run test:e2e` (Playwright, `tests/e2e/`, system Chrome, `window.__world`). The app is started for E2E with `npm run dev -- --port 4173` (or `vite preview` of a test build); the Playwright config starts it via `webServer` (fixed by plan 001). Software WebGL: assert counts, boots, behaviours, not frame rate (A7).
- Scripts: `npm run check:ledger`, `check:size`, `check:budget`, `check:buildings`, `check:content`, `check:phone`.
- Test data: no database. "Setup" = `npm ci` then `npm run build` when a test needs the build; "reset" = delete `dist/` and Playwright output (`test-results/`); localStorage is cleared per Playwright context (tour-once test).
- CI runs `npm test`, `check:ledger`, `check:size`, `check:phone`, build, and a boot smoke test only (A23). Full walk-through and budget tests run locally in plan sessions.
- Visual self-review: a script `npm run shots` saves screenshots from fixed camera spots to a plan output folder; the session views them; never a pass/fail gate (D22).

## 9. Environments and deploy
- Local: `npm run dev`; production check `npm run build && npm run preview`.
- Test: the Playwright webServer on a local port.
- Production: GitHub Pages project page `https://kaviyarasu-dev.github.io/portfolio/`, `base: '/portfolio/'`, no custom domain (A22).
- CI/deploy: `.github/workflows/pages.yml` runs on push to `main` only: `npm ci`, tests and checks, `npm run build`, upload artifact, deploy to Pages. `dist/` is not committed (D15). The user switches the Pages source to GitHub Actions once (human check).
- Health: the boot smoke test (page loads, zero console errors, canvas non-blank) is the health check; no server health endpoint exists.
- Branching: all plans on `world-v2`; merge to `main` only after the user approves the epic-2 slice and the final result (D17, D27).

## 10. Decisions fixed by the plan writer (final; these replace every "fixed by plan 001" above)

Plan sessions cannot write into the plan folder, so nothing is written back here. Plan 001 creates `docs/world-conventions.md` in the repo as the short working copy of this section; if the two ever differ, this section wins.

### 10.1 What the network allows on this machine (tested 2026-10-30)
- Works: `api.polyhaven.com` and `dl.polyhaven.org` (textures, models, HDRIs, all CC0), `registry.npmjs.org`.
- Fails: `ambientcg.com` (connect timeout); `kenney.nl`, `poly.pizza`, `opengameart.org` (TLS: self-signed certificate in chain, a corporate proxy). Quaternius packs are on Google Drive / itch.io (dropped by A21).
- Rules: never disable TLS verification (no `NODE_TLS_REJECT_UNAUTHORIZED`, no `rejectUnauthorized: false`). A host that fails counts as one of the 3 tried sources of that element (A29). After 3 failures the element is built by code. Expect this for audio files, characters and anything not on Poly Haven.
- Manual drop-in: a file the user places in `..\portfolio-asset-cache\manual\<kind>\` (with a `meta.json` holding sourceUrl, author, licence "CC0") is used before any download. Used for the avatar (`manual\avatar\avatar.glb`).
- Code-generated assets (sounds written by a script, procedural meshes) are authored by this project: ledger licence `CC0`, `sourceUrl` `generated:<script path>`, host `local`.

### 10.2 Shipped assets folder and URLs
- Vite `publicDir` is `assets/` (not `public/`). Everything under `assets/` is shipped as-is and served at the site root under the Vite base, so `assets/audio/x.ogg` is `import.meta.env.BASE_URL + 'audio/x.ogg'`. Helper `assetUrl(path)` in `src/util/assetUrl.js` (plan 002). There is no `public/` folder.
- Folders: `assets/audio/{music,sfx}`, `assets/models/`, `assets/textures/<set>/<size>/`, `assets/fonts/`, `assets/licenses/`, `assets/LEDGER.json`, `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` (byte-identical copy of the user's PDF, sha256 abfe286b1bbcf14a76585f5885a1a76414d9b2113ce1eb813ea99ebb5abf5d3f).
- Ledger licences allowed: `CC0` (everything), `OFL` (only files under `assets/fonts/`), `OWN` (only the resume PDF). Hosts allowed in `sourceUrl`: `polyhaven.com`, `api.polyhaven.com`, `dl.polyhaven.org`, `ambientcg.com`, `kenney.nl`, `poly.pizza`, `static.poly.pizza`, `opengameart.org`, plus `local` (generated), `www.npmjs.com` (fonts only) and any https host when the notes start with `manual-drop-in` (a file the person placed by hand, for example the avatar), `github.com` (only the 8 legacy-v1 entries whose notes start with `legacy-v1`: the 7 kept v1 audio files and the resume PDF).
- Texture and model formats: textures WebP; models GLB with `EXT_meshopt_compression` and `EXT_texture_webp`. No KTX2 and no Draco (no extra decoder files needed: the meshopt decoder ships inside `three/addons` and is bundled). This replaces the KTX2/Draco wording of A7/A28 and §1.

### 10.3 Gates runner
`scripts/run-gates.mjs <group> [--strict]` (plan 001, frozen) runs a fixed, complete list of checks per group and skips an entry whose script file does not exist yet (prints SKIPPED); `--strict` turns a skip into a failure. Groups and entries (name: file that must exist, command):
- `full`: lint (`eslint.config.js`, `npm run lint`); unit (`vitest.config.js`, `npm test`); build (`vite.config.js`, `npm run build`); no-cdn (`scripts/check-no-cdn.mjs`); prod-hook (`scripts/check-prod-hook.mjs`); phone (`scripts/check-phone.mjs`); ledger (`scripts/check-ledger.mjs`); size (`scripts/check-size.mjs`); credits (`scripts/generate-credits.mjs`, `node scripts/generate-credits.mjs --check`); buildings (`scripts/check-buildings.mjs`); content (`scripts/check-content.mjs`); local (`scripts/check-local-detail.mjs`, `node scripts/check-local-detail.mjs`).
- `e2e`: playwright (`playwright.config.js`, `npm run test:e2e`); budget (`scripts/check-budget.mjs`, `npm run check:budget`).
- `ci`: lint, unit, build, no-cdn, prod-hook, phone, ledger, size, credits, content, smoke (`tests/e2e/smoke.spec.js`, `npx playwright test tests/e2e/smoke.spec.js`).
Manifest `full_gates` = `npm run gates:full`; `e2e_gates` = `npm run gates:e2e`; the final plan runs both with `--strict`.

### 10.4 Numbers
- `WORLD_RADIUS` 300 m, `TERRAIN_SIZE` 680 m, `WATER_LEVEL` -1.2 m, sea beyond. Walk speed 4.0 m/s, sprint 7.8 m/s (as v1). Player circle radius 0.35 m, eye height 1.62 m, step-up 0.45 m.
- Layout limit (R9): the shortest walkable path from spawn to the farthest landmark is at most 460 m (about 115 s of walking). `MAX_PATH_METRES = 460` in `src/config.js`.
- Budgets start at the A7 values and are stored in `src/budgets.json` (written by plan 014, tuned there from a first measurement; later plans read the file, never hard-code).
- Per-room limits (D18): 3 to 6 rooms per landmark, except the Grand Hotel (`plaza`), which may have up to 24 spaces because the spec also requires lobby, restaurant, kitchen, 4+ guest rooms with bathrooms, corridors and a rooftop. Rooms are named spaces with a door or opening; a corridor counts as a room.
- At least 40 distinct prop types per landmark, counted over all rooms' `objects[].type` (not exterior details).

### 10.5 Module map (names are fixed; a plan may add modules, never rename these)
```
src/config.js  src/state.js  src/main.js
src/util/ { assetUrl.js urlParams.js rng.js math.js dom.js three.js uv.js }
src/engine/ { renderer.js scene.js camera.js loader.js quality.js materials.js streaming.js assets.js }
src/dev/ { worldHook.js fixtures/index.js fixtures/<name>.js }       (dev only, never in the production build)
src/systems/
  collision/ { geometry.js world.js cameraSolver.js legacy.js }
  nav/ { navGrid.js }
  interaction/ { registry.js doors.js lightSwitch.js sit.js elevator.js read.js }
  lights/ { lightManager.js }
  audio/ ...   input.js controller.js clock.js gameloop.js events.js
src/entity/ { player.js avatar/humanoid.js avatar/loadAvatar.js avatar/clips.js }
src/world/
  kit/ { schema.js walls.js shell.js rooms.js doors.js lights.js place.js building.js }
  props/ { catalog.js index.js sets/<setName>.js }
  buildings/<zoneId>/ { manifest.json build.js props.js }
  layout/ { town.json generate.js nav.js }   terrain/ water/ sky/ weather/ vegetation/ npc/ life/
src/ui/ { hud.js dialogue.js minimap.js map.js settings.js tour.js textMode.js credits.js emailReveal.js retryBanner.js }
src/content/ { contact.js projects.js experience.js education.js dialogues.js }
```
- Headless rule: any module that a Vitest test imports must not touch `window`, `document` or WebGL at import time, and its geometry code must run in Node (Three.js geometry, materials without textures, and math all work in Node). Texture loading, canvas text and audio are guarded by `typeof document !== 'undefined'`.
- `window.__world` (dev only) fields: `ready` (true after the first frame), `teleport(zoneId | x, z, y)`, `playerState()`, `setTime(f)`, `time()`, `setWeather(w)`, `quality()`, `listDoors()`, `listLights()`, `listObjects()`, `listNpcs()`, `rendererInfo()` (`{calls, triangles, textures, geometries}`), `audioState()`, `openDialogue(zoneId, key?)`, `cameraMode()`, `setCamera({x,y,z,yaw,pitch} | null)`, `avatarClips()`, `playerAnim()`. A plan that adds a field extends the object in `src/dev/worldHook.js`; it never renames one.
- URL params (all parsed only in `src/util/urlParams.js`): `time` 0..1, `weather` clear|cloudy|mist|rain, `seed` integer (default 1337), `freeze` boolean (the clock does not advance with real time; `T` still advances it; tests that use `?time=` always add `&freeze=1`), `quality` low|medium|high, `only` comma list of area ids (dev only, loads just those areas so tests are fast), `fixture` name (dev only), `debug`.
- Tests: Vitest files `tests/unit/<area>/<name>.test.js`; Playwright files `tests/e2e/<name>.spec.js`, viewport 960x540, one worker, tests wait for `window.__world.ready`. A plan creates new test files instead of editing earlier ones.

### 10.6 Building manifest (extends section 3; field names fixed here)
```
{ "id": "<zoneId>", "displayName": "...", "prompt": "...",
  "footprint": { "w": 24, "d": 18 },                       local origin = footprint centre, +z = front of the building; the town plan sets world x, z, rotation
  "style": { "wall": "plaster", "wallTint": "#f0d9a8", "roof": { "type": "hip|gable|flat|dome|cone", "material": "roofTile", "pitch": 0.45, "overhang": 0.6 }, "trim": "woodDark" },
  "floors": [ { "level": 0, "y": 0, "height": 3.4 }, { "level": 1, "y": 3.6, "height": 3.2 } ],
  "rooms": [ { "id": "lobby", "floor": 0, "bounds": [x0, z0, x1, z1], "surface": "tile", "floorMaterial": "floorTile",
               "lights": [ { "id": "lobby-1", "x": 0, "y": 3.0, "z": 0, "color": "#ffd9a0", "intensity": 18, "distance": 12, "group": "lobby", "auto": "dusk" } ],
               "objects": [ { "type": "sofa", "count": 2, "place": "wall:N" }, { "type": "reception-desk", "x": 0, "z": -3, "rot": 0, "y": 0 } ] } ],
  "doors": [ { "id": "main", "from": "outside", "to": "lobby", "wall": "S", "at": 0, "width": 1.8, "height": 2.4, "kind": "exterior|interior|decorative", "locked": false } ],
  "windows": [ { "room": "lobby", "wall": "S", "at": -5, "width": 1.4, "height": 1.5, "sill": 0.9 } ],
  "stairs": [ { "id": "s1", "from": "lobby", "to": "corridor-1", "x": 6, "z": 2, "dir": "N", "width": 1.4, "rise": 3.6 } ],
  "interactables": [ { "id": "desk-intro", "kind": "read|sit|switch|door|elevator", "room": "lobby", "x": 0, "y": 1.0, "z": -3, "dialogueKey": "intro", "prompt": "check in" } ],
  "exteriorDetails": [ { "class": "window|door|signage|drainpipe|planter|bin|lamp", "count": 12 } ],
  "npcLoops": [ { "room": "lobby", "waypoints": [ [x, z], [x, z] ] } ] }
```
`place` values: `wall:N|E|S|W`, `corner:NE|NW|SE|SW`, `center`, `grid:RxC`, `ceiling`, `on:<object type in the same room>`; explicit `x`,`z`,`rot`,`y` win over `place`. Plan 020 writes the exact schema into `docs/building-manifest.md`; `src/world/kit/schema.js` validates it and is used by `npm run check:buildings`.

### 10.7 Dialogue modes during the transition
Until a landmark's own plan (epic 4) converts it, a zone keeps `mode: 'radius'` (v1 behaviour, verified in the v1 code: pressing `E` within the zone radius opens its dialogue, pressing `E` again or walking away closes it; the notice board downloads the PDF instead). A converted zone has `mode: 'object'`: it opens only from its `read` interactable with `E` (A5). `zones.js` carries the `mode`; plan 057 checks that all 14 are `object`.

### 10.8 Angles, hook extras and shared conventions (added at review)
- **Camera / player yaw** (`setCamera`, `teleport(.., yaw)`, `playerState().yaw`, `game.camRig.yaw`, interaction `find(pos, yaw)`): as the v1 camera rig. The horizontal look direction is `(-sin yaw, -cos yaw)`: yaw 0 looks toward -z (north), a positive yaw turns left (toward -x). The Three.js camera uses Euler order `YXZ` with `rotation.y = yaw` and `rotation.x = pitch`; pitch below 0 looks down. The player model's own `facing` (v1 `p.facing`) is `yaw + PI` while walking forward; plans never use `facing` as an API angle.
- **Object rotation** (`rot` in manifests, door `yaw`, seat `yaw`, prop `rot`): Three.js `rotation.y`. An object with rotation 0 has its front toward +z; rotation `r` turns its front to `(sin r, cos r)`. Compass letters: N = -z, S = +z, E = +x, W = -x; a stair `dir` letter maps to the direction the climb travels (N = -z).
- Hook additions are allowed and extend `src/dev/worldHook.js` (never rename): `setCamera`, `cameraState()`, `tierSettings()`, `setQuality`, `pixelRatio`, `reducedMotion`, `streamState()`, `retryArea(id)`, `listInteractables()`, `useNearest()`, `collisionStats()`, `setCameraMode(m)`, `playerState().bodyVisible`. `listObjects()` returns `game.fixtureObjects` (an array a fixture may fill with `{ type, name }` records) plus the objects of real areas.
- Every URL parameter, including fixture-only ones such as `fail`, is parsed in `src/util/urlParams.js` (`getParams()` returns it as `params.fail`, a string or null).
- Ledger exempt files: see `isLedgerExempt` (plan 005): `assets/LEDGER.json`, `assets/textures/INDEX.json` and per-set `set.json` files need no ledger entry.
- Time-based Playwright assertions never use a fixed wait for game progress: poll with `expect.poll(..., { timeout: 15000 })` (the game loop clamps `dt` to 50 ms and software WebGL is slow, so game time runs slower than wall time).
