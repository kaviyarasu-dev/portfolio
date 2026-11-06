import { has, none, exists, json, absent, vt, pw, npm, node } from '../lib.mjs';

export default [
  // ---------------------------------------------------------------- 005
  {
    id: '005', name: 'asset-fetch-tooling', title: 'Asset fetch tooling: host allowlist, untrusted cache, Poly Haven client, ledger writer', epic: 'E1', est: 55,
    arch: 'sections 6, 7 and 10.1, 10.2',
    goal: [
      'Build the only way plan sessions may download assets: node scripts that talk to allowlisted CC0 hosts, store every download in its own folder under `..\\portfolio-asset-cache\\<source>\\<id>\\` (outside the repo), never execute anything, count at most 3 sources per element, and write the licence ledger. Poly Haven is the reliable source on this machine; the other hosts are tried by the same code but are expected to fail (ARCHITECTURE.md 10.1).',
      'All logic takes an injectable `fetchImpl` so unit tests never touch the network. One live dry-run check at the end proves the Poly Haven client works against the real API.',
    ],
    read: ['docs/world-conventions.md', 'scripts/lib/paths.mjs', 'vitest.config.js'],
    risks: ['A1 (HIGH-RISK, security): downloads are untrusted data. Steps 1 and 2 enforce: host allowlist on every redirect hop, https only, size cap, no execution, sanitized folder names, TLS verification never disabled (a test scans the source for the forbidden strings).'],
    steps: [
      {
        title: 'Host allowlist, cache folders, attempt counter',
        items: [
          '`scripts/lib/hosts.mjs`: `DOWNLOAD_HOSTS` = `api.polyhaven.com`, `dl.polyhaven.org`, `polyhaven.com`, `ambientcg.com`, `kenney.nl`, `poly.pizza`, `static.poly.pizza`, `opengameart.org`; `assertDownloadUrl(url)` throws unless the URL is https, has no username/password, no port other than 443 and the host is exactly in the list.',
          '`scripts/lib/cache.mjs`: `cacheRoot()` = `<repo>/../portfolio-asset-cache`; `cacheDir(source, id)` validates both against `/^[a-z0-9][a-z0-9_.-]{0,79}$/i` (throws otherwise, so `..` can never appear) and creates the folder; `manualDir(kind)` returns `<cacheRoot>/manual/<kind>`; `readManualMeta(kind)` reads `meta.json` there and requires `sourceUrl`, `author` and `licence === "CC0"` (returns null when the folder or file is missing, throws on a bad file). Naming rule for every function in `scripts/`: the optional test override of the cache folder is called `root`; the optional fake network is `fetchImpl`.',
          '`scripts/lib/attempts.mjs`: `recordAttempt(element, source, outcome)` appends one JSON line to `<cacheRoot>/attempts.jsonl`; `distinctSources(element)`; `assertAttemptAllowed(element, source)` throws a clear message ("3 sources already tried for <element>: build it by code") when 3 other distinct sources were already recorded. Element names match `/^[a-z0-9][a-z0-9_.-]{0,60}$/`. All functions take an optional `root` argument for tests.',
          'Tests `tests/unit/scripts/assets-hosts.test.js` and `tests/unit/scripts/assets-cache.test.js`: http URL, userinfo URL, port 8443, look-alike host `api.polyhaven.com.evil.com`, unlisted host, id `../x`, id with spaces, the 4th source, the same source twice (counts once), an element name with a space; `recordAttempt` writes a JSON line to a temp `root`; `manualDir` path; `readManualMeta` with a valid file, a missing folder (null), a licence `CC-BY` (throws) and a missing author (throws).',
        ],
        verify: [vt('tests/unit/scripts/assets-hosts.test.js', 'tests/unit/scripts/assets-cache.test.js'), exists('scripts/lib/hosts.mjs', 'scripts/lib/cache.mjs', 'scripts/lib/attempts.mjs')],
      },
      {
        title: 'Safe download and JSON fetch',
        items: [
          '`scripts/lib/net.mjs`: `class NetError extends Error { kind }` with kinds `host|tls|timeout|size|http|md5`. `download(url, destFile, { fetchImpl = fetch, maxBytes = 250 MB, timeoutMs = 120000, maxRedirects = 5, md5 })` returns `{ file, bytes, sha256, finalUrl }`: uses `redirect: \'manual\'` and re-runs `assertDownloadUrl` on every hop; streams the body to `<destFile>.part`, aborts and deletes the part when bytes exceed `maxBytes` or the timeout hits; renames only after success; when `md5` is given and differs it deletes the file and throws kind `md5`. TLS failures (look at `err.cause?.code` first, then `err.code`; codes starting `SELF_SIGNED`, `DEPTH_ZERO`, `UNABLE_TO_VERIFY`, `CERT_`, `ERR_TLS`) become kind `tls` with the message "certificate not trusted on this network".',
          '`fetchJson(url, { fetchImpl, maxBytes = 20 MB })` with the same checks. Neither function ever sets `NODE_TLS_REJECT_UNAUTHORIZED`, `rejectUnauthorized`, an HTTP proxy agent or a custom dispatcher.',
          '`tests/unit/scripts/assets-net.test.js` with a fake `fetchImpl`: redirect to an unlisted host is refused; size cap deletes the partial file; md5 mismatch deletes the file; a thrown error with `cause.code = \'SELF_SIGNED_CERT_IN_CHAIN\'` becomes kind `tls`; a redirect from https to http is refused; a timeout aborts with kind `timeout`; `fetchJson` rejects an unlisted host and a body over the size cap; the returned `sha256` equals the sha256 of the written bytes and `finalUrl` is the last hop; and a scan test that reads `scripts/lib/net.mjs`, `scripts/fetch-asset.mjs` and every file under `scripts/assets/` and fails if any contains `NODE_TLS_REJECT_UNAUTHORIZED`, `rejectUnauthorized`, `curl`, `wget` or `Invoke-WebRequest`.',
        ],
        verify: [vt('tests/unit/scripts/assets-net.test.js'), exists('scripts/lib/net.mjs')],
      },
      {
        title: 'Poly Haven client and the fetch and search CLIs',
        items: [
          'Live shapes (verified 2026-10-30): `GET https://api.polyhaven.com/assets?t=textures|models|hdris[&c=<category>]` returns an object keyed by asset id with `name`, `categories`, `tags`, `authors`, `polycount`; `GET /files/<id>` returns keys like `Diffuse`, `nor_gl`, `Rough`, `AO`, `arm`, `Displacement` for textures (each `{ "1k": { "jpg": { url, size, md5 }, "png": {...} } }`) and for models `gltf: { "1k": { "gltf": { url, size, md5, include: { "<relative path>": { url, size, md5 } } } } }`; `GET /info/<id>` returns `authors` (object name -> role) and `name`. HDRIs: `files` has `hdri: { "1k": { "hdr": { url, size, md5 }, "exr": {...} } }`; `pickHdriFiles(filesJson, { res })` takes `hdr` and falls back to `exr`, then to the next lower resolution. Check these shapes once against the live API before you code the parser, using a throwaway script under `scripts/dev/` that calls `fetchJson` from `scripts/lib/net.mjs` (delete it afterwards), and note any difference in your report.',
          '`scripts/assets/polyhaven.mjs` (all functions take `{ fetchImpl, root }` where `root` overrides the cache folder): `searchAssets({ type, category, tags, query, limit })` (filter the id map client-side by tags and the query in id, name or tags); `pickTextureFiles(filesJson, { res, maps })` returns `{ diff, nor_gl, rough, ao, arm }` entries (jpg for colour, rough and ao, png or jpg for nor_gl; skip a map that is missing); `pickModelFiles(filesJson, { res })` returns the glTF url plus its `include` map; `fetchTexture(id, { res })`, `fetchModel(id, { res })` and `fetchHdri(id, { res })` download into `cacheDir(\'polyhaven\', id)` (model includes keep their relative paths inside that folder) with md5 verification, and return `{ cacheDir, files, author, sourceUrl: \'https://polyhaven.com/a/<id>\', name }` where `author` joins the `authors` keys and `files` is, for a texture, `{ diff, nor_gl, rough, ao, arm }` (absolute paths; a key is absent when the asset has no such map), for a model `{ gltf: <absolute path of the .gltf>, dir: <cacheDir> }`, for an HDRI `{ hdri: <absolute path> }`.',
          '`scripts/fetch-asset.mjs polyhaven <texture|model|hdri> <id> --res <1k|2k> --element <name> [--dry-run]` prints one JSON line `{ ok, element, source, cacheDir, files, author, sourceUrl }`. It calls `assertAttemptAllowed` first and `recordAttempt` after (not on `--dry-run`). With `--dry-run` it fetches only the API JSON and prints the files it would download. With `--dry-run` the JSON has `files: [{ name, url, size, md5 }]` (nothing is written). Other sources (`ambientcg`, `kenney`, `polypizza`, `opengameart`) are accepted by name: the CLI does one `GET https://<host>/` through `fetchJson`-style checks only to prove the host is reachable, records the attempt, and prints `ok:false` with the `NetError` kind (it never claims success because it has no asset parser) and the text "<n> of 3 sources used for <element>" where n counts this attempt; they are expected to fail here and the element is then built by code.',
          '`scripts/search-assets.mjs polyhaven <textures|models|hdris> [--category c] [--tags a,b] [--query q] [--limit n]` (`category` must be one of the asset categories; every listed tag must match, AND semantics; `query` matches id, name or any tag, case-insensitive) prints one JSON line per match (`id`, `name`, `categories`, `tags`, `polycount`).',
          'Tests `tests/unit/scripts/assets-polyhaven.test.js` with fixtures in `tests/fixtures/polyhaven/` (small hand-written JSON copies of the shapes above): texture map selection at `1k`, fallback when `arm` is missing, model include map, tag filtering, author join, dry-run makes no download.',
        ],
        verify: [vt('tests/unit/scripts/assets-polyhaven.test.js'), exists('scripts/fetch-asset.mjs', 'scripts/search-assets.mjs', 'scripts/assets/polyhaven.mjs')],
      },
      {
        title: 'Ledger library and ledger-add CLI, then the live dry-run',
        items: [
          '`scripts/lib/ledgerRules.mjs` (shared with the checker plan 010): `isLedgerExempt(file)` (true for `assets/LEDGER.json`, any `*.md`, anything under `assets/licenses/`, `assets/textures/INDEX.json` and `assets/textures/*/set.json`: documentation and index files, not shipped assets) and `ALLOWED_LICENCES = [\'CC0\', \'OFL\', \'OWN\']`, `LEDGER_HOSTS` (download hosts plus `local`, `www.npmjs.com`, `github.com`), `validateEntry(entry, { repoRoot, assetsRoot = repoRoot/assets })` returning an array of problems (`assetsRoot` is the `assets/` folder itself; ledger `file` values are always written `assets/<rest>` and resolved as `assetsRoot/<rest>`; `repoRoot` is used to resolve `generated:` paths): `file` must start with `assets/` and exist; `licence` allowed; `OFL` only under `assets/fonts/`; `OWN` only for `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`; `sourceUrl` is `https:` with an allowed host or `generated:<path that exists in the repo>`; `github.com` only when `notes` starts with `legacy-v1`; any other https host only when `notes` starts with `manual-drop-in`; `author` non-empty; `sha256` and `bytes` match the file.',
          '`scripts/lib/ledger.mjs`: `loadLedger(path)`, `addEntry(entry, { ledgerPath, assetsRoot, repoRoot })` computes `sha256` and `bytes` itself, sets `host` to the hostname of `sourceUrl` (`local` for `generated:` sources), defaults `notes` to an empty string, validates, replaces an existing entry with the same `file`, keeps the array sorted by `file`, writes pretty JSON; creates `assets/LEDGER.json` (`[]`) when missing; and `removeEntry(file, { ledgerPath })` (removes the entry whose `file` equals the argument, keeps the array sorted, writes the file and returns `true`, or returns `false` when there is no such entry; it never deletes the asset file itself; plan 030 uses it to drop a rejected model). `scripts/ledger-add.mjs --file <assets/...> --source <url|generated:path> --author <name> --licence CC0 [--notes text]` is the CLI; `scripts/ledger-add.mjs --remove <assets/file> [--ledger <path>]` is its second mode (no other flag is needed in that mode): it calls `removeEntry`, prints one JSON line `{ ok, removed, file }` and exits 0 when an entry was removed and 1 when there was none.',
          '`tests/unit/scripts/assets-ledger.test.js` with temp folders: valid entry written with correct sha; wrong licence, unlisted host, missing file, OFL outside fonts, `github.com` without the legacy note, generated path that does not exist: all rejected; idempotent re-add; sorted output; empty author rejected; a missing `LEDGER.json` is created as `[]`; `host` is `local` for generated sources; the `ledger-add.mjs` CLI (call its exported `main(argv)`) writes the entry and exits non-zero on a bad licence; `removeEntry` removes an existing entry and returns `true`, returns `false` for an unknown file and leaves the other entries and their sort order untouched, and does not touch the asset file on disk; `main(["--remove", "assets/x.bin", "--ledger", tmp])` exits 0 for a ledgered file and 1 for an unknown one.',
          'Live check (needs network): `node scripts/fetch-asset.mjs polyhaven texture plaster_grey_04 --res 1k --element selftest-plaster --dry-run` and `node scripts/search-assets.mjs polyhaven models --category furniture --limit 3` both exit 0. If the network is down write BLOCKED.md.',
        ],
        verify: [
          vt('tests/unit/scripts/assets-ledger.test.js'),
          exists('scripts/lib/ledger.mjs', 'scripts/lib/ledgerRules.mjs', 'scripts/ledger-add.mjs'),
          has('scripts/lib/ledger.mjs', 'removeEntry'),
          has('scripts/ledger-add.mjs', 'remove'),
          node('scripts/search-assets.mjs polyhaven models --category furniture --limit 3'),
        ],
      },
    ],
    accept: [
      npm('lint'),
      vt('tests/unit/scripts/assets-hosts.test.js', 'tests/unit/scripts/assets-cache.test.js', 'tests/unit/scripts/assets-net.test.js', 'tests/unit/scripts/assets-polyhaven.test.js', 'tests/unit/scripts/assets-ledger.test.js'),
      node('scripts/fetch-asset.mjs polyhaven texture plaster_grey_04 --res 1k --element selftest-plaster --dry-run', 5),
    ],
    allowed: ['portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md'],
    freeze: ['portfolio/tests/unit/scripts/assets-hosts.test.js', 'portfolio/tests/unit/scripts/assets-cache.test.js', 'portfolio/tests/unit/scripts/assets-net.test.js', 'portfolio/tests/unit/scripts/assets-polyhaven.test.js', 'portfolio/tests/unit/scripts/assets-ledger.test.js'],
    donttouch: ['`assets/` (no asset is added in this plan).'],
  },

  // ---------------------------------------------------------------- 006
  {
    id: '006', name: 'asset-optimize-tooling', title: 'Asset optimize tooling: GLB optimizer, texture packer, material and model pack CLIs', epic: 'E1', est: 50,
    arch: 'sections 1 and 10.2',
    goal: [
      'Turn raw downloads into shippable files: a GLB optimizer (dedup, prune, WebP textures, meshopt compression), a texture-set packer (512 / 1k / 2k WebP per map), and two CLIs (`packMaterial`, `packModel`) that fetch, convert and write the ledger in one command. Every later plan that needs a texture or model uses these CLIs.',
    ],
    read: ['scripts/lib/ledger.mjs', 'scripts/lib/cache.mjs', 'scripts/assets/polyhaven.mjs', 'scripts/fetch-asset.mjs', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'Dependencies, GLB info and GLB optimizer',
        items: [
          'Install dev dependencies with `--save-dev --save-exact`: `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `meshoptimizer`, `sharp`.',
          '`scripts/lib/glbInfo.mjs`: `readGlbInfo(path)` returns `{ bytes, triangles, meshes, materials, textures, extensionsUsed, animations: [names], size: [x,y,z] }` using gltf-transform `NodeIO` with all extensions registered and `meshopt` decoder and encoder registered (`await MeshoptDecoder.ready` and `await MeshoptEncoder.ready` first). `triangles` counts indexed triangle primitives (index count / 3, or position count / 3 when non-indexed, mode TRIANGLES only) over all meshes; `size` is the bounding box of the default scene in metres (`getBounds`); `animations` lists clip names.',
          '`scripts/assets/optimizeGlb.mjs`: `optimizeGlb({ input, output, maxTextureSize = 1024, webpQuality = 82 })` accepts a `.gltf` (with its `.bin` and textures) or `.glb`; applies `dedup`, `prune`, `textureCompress({ encoder: sharp, targetFormat: \'webp\', resize: [max, max] })`, then `meshopt({ encoder: MeshoptEncoder, level: \'medium\' })`; writes one `.glb`; returns the info of the result.',
          '`tests/unit/scripts/optimizeGlb.test.js`: build a tiny glTF in memory (one quad, one 1024x1024 PNG texture made with `sharp`), write it to a temp folder, optimize with `maxTextureSize` 256, read back: `extensionsUsed` contains `EXT_meshopt_compression` and `EXT_texture_webp`, the texture is WebP and at most 256 wide (the resize is applied), triangles unchanged (2), `size` is the quad bounds; a second run with `maxTextureSize` 1024 leaves the texture 1024 wide; the info of the result lists the animation names (an empty list here).',
        ],
        verify: [vt('tests/unit/scripts/optimizeGlb.test.js'), exists('node_modules/sharp/package.json', 'node_modules/@gltf-transform/core/package.json', 'scripts/assets/optimizeGlb.mjs', 'scripts/lib/glbInfo.mjs')],
      },
      {
        title: 'Texture set packer',
        items: [
          '`scripts/assets/packTextureSet.mjs`: `packTextureSet({ name, maps: { diff, nor_gl, rough, ao }, assetsRoot, sizes = [512, 1024], hero = false })` writes `assets/textures/<name>/<512|1k|2k>/{color,normal,rough,ao}.webp` (quality 82; `ao` only when given; `2k` only when `hero`), resizing with sharp (`fit: inside`, never upscaling); `rough` is converted to single channel grayscale; returns the list of written files. A text file `assets/textures/<name>/set.json` records `{ name, sizes, maps }`.',
          'Names: `<name>` matches `/^[a-z][a-z0-9-]{1,40}$/`.',
          '`tests/unit/scripts/packTextureSet.test.js`: make 2048x2048 PNG inputs with sharp (flat colours are fine), pack with `hero: true` into a temp assets root, assert the three size folders `512`, `1k` and `2k` exist, the files are 512, 1024 and 2048 wide; a second call with 600x600 inputs and `hero: false` writes `512` (512 wide) and `1k` (600 wide, not upscaled) and no `2k`; `rough.webp` has one channel in the metadata (`channels` 1) and `ao.webp` exists only when `ao` was given; the output is WebP (`format` webp); `set.json` lists the sizes; an invalid name throws. The size numbers map to folders as 512 to `512`, 1024 to `1k`, 2048 to `2k`; `hero` adds 2048 to `sizes`; the returned list contains the image files only, and `set.json` is an index file that is exempt from the ledger (`isLedgerExempt`).',
        ],
        verify: [vt('tests/unit/scripts/packTextureSet.test.js'), exists('scripts/assets/packTextureSet.mjs')],
      },
      {
        title: 'packMaterial and packModel CLIs with ledger writing, then a live self-test',
        items: [
          '`scripts/assets/packMaterial.mjs <polyhavenId> <name> --element <e> [--hero] [--assets-root dir] [--ledger file]`: fetch the texture (res `2k` when `--hero` else `1k`), `packTextureSet`, then `addEntry` for every written file with `sourceUrl https://polyhaven.com/a/<id>`, the author from the info call, licence `CC0`, notes `texture set <name>`. `--element` is the element name for the attempt counter of plan 005: call `assertAttemptAllowed` before the first request and `recordAttempt` after (the CLIs import the polyhaven client directly, which the INSTRUCTIONS allow for `scripts/assets/*.mjs`). The fetched texture result has `files: { diff, nor_gl, rough, ao, arm }` (absolute paths, a key missing when the map does not exist); a model result has `files: { gltf: <absolute path of the .gltf>, dir }`. Prints one JSON line with the written files (a `files` array of repo-relative paths plus `ledgered: <count>`). `addEntry` creates missing parent folders of the ledger file. Exits 1 if any output file is missing afterwards or if any file was written under the repo `assets/` while `--assets-root` was given (compare a directory listing before and after).',
          '`scripts/assets/packModel.mjs <polyhavenId> <name> --element <e> [--max-texture 1024] [--assets-root dir] [--ledger file]`: fetch the model at `1k`, optimize to `<assets-root>/models/<name>.glb`, add the ledger entry, print `readGlbInfo`. Refuses (exit 1) when the result is over 3 MB or over 60000 triangles (defaults of the tool, overridable with `--max-mb` and `--max-tris`): it deletes the output file, writes no ledger entry and says why. A unit test covers both the accept and the refuse path with a generated glTF.',
          'Both CLIs export their main function so a unit test can call it with a fake `fetchImpl`, a temp assets root and a temp ledger: `tests/unit/scripts/packCli.test.js` checks that files and ledger entries line up one to one and that the ledger sha256 equals the file.',
          'Live self-test (needs network): `node scripts/assets/packMaterial.mjs plaster_grey_04 selftest-plaster --element selftest-plaster --assets-root ../portfolio-asset-cache/_selftest/assets --ledger ../portfolio-asset-cache/_selftest/LEDGER.json` exits 0 and writes nothing under the repo `assets/`.',
        ],
        verify: [vt('tests/unit/scripts/packCli.test.js'), exists('scripts/assets/packMaterial.mjs', 'scripts/assets/packModel.mjs'), node('scripts/assets/packMaterial.mjs plaster_grey_04 selftest-plaster --element selftest-plaster --assets-root ../portfolio-asset-cache/_selftest/assets --ledger ../portfolio-asset-cache/_selftest/LEDGER.json', 8)],
      },
    ],
    accept: [
      npm('lint'),
      vt('tests/unit/scripts/optimizeGlb.test.js', 'tests/unit/scripts/packTextureSet.test.js', 'tests/unit/scripts/packCli.test.js'),
      node('scripts/assets/packMaterial.mjs plaster_grey_04 selftest-plaster --element selftest-plaster --assets-root ../portfolio-asset-cache/_selftest/assets --ledger ../portfolio-asset-cache/_selftest/LEDGER.json', 8),
    ],
    allowed: ['portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/docs/world-conventions.md', 'portfolio/node_modules/**', 'portfolio/package.json', 'portfolio/package-lock.json'],
    freeze: ['portfolio/tests/unit/scripts/optimizeGlb.test.js', 'portfolio/tests/unit/scripts/packTextureSet.test.js', 'portfolio/tests/unit/scripts/packCli.test.js'],
    donttouch: ['`assets/` (the live self-test writes only into the cache folder).'],
    blocked: ['`sharp` fails to install or load on this machine: BLOCKED.md with the npm error.'],
  },

  // ---------------------------------------------------------------- 007
  {
    id: '007', name: 'replace-nonfree-audio', title: 'Replace the non-CC0 sound effects with generated CC0 ones and ledger the legacy music', epic: 'E1', est: 45,
    arch: 'decision D28 (requirements.md) and section 10.1, 10.2',
    goal: [
      'The 5 CC-BY-SA effects (`footstep_grass`, `footstep_sand`, `interact`, `type_tick`, `scroll_pickup`) and the CC-BY `ocean_loop.ogg` must leave the repo (D28). No other audio host is reachable unattended (ARCHITECTURE.md 10.1), so a deterministic synthesizer script writes the replacements as WAV files that the project owns (ledger licence CC0, source `generated:scripts/assets/synthSfx.mjs`). The 6 CC0 music loops and `wind_loop.ogg` stay and get ledger entries. Plan 064 extends the synthesizer with the per-surface footsteps.',
    ],
    read: ['assets/audio/CREDITS.md', 'src/systems/audio.js', 'scripts/lib/ledger.mjs', 'scripts/ledger-add.mjs'],
    steps: [
      {
        title: 'Synthesizer with deterministic recipes',
        items: [
          '`scripts/assets/synthSfx.mjs`: exports `RECIPES` (name -> `{ seconds, sampleRate, render(rng) }` returning a `Float32Array`), `renderRecipe(name, seed = 1)` and `writeWav(file, samples, sampleRate)` (16-bit PCM mono WAV with a correct 44-byte header). Recipes now: `footstep_grass` (0.18 s noise burst, low-passed near 1.8 kHz, 4 ms attack, exponential decay), `footstep_sand` (0.24 s, softer, low-pass near 900 Hz), `interact` (0.4 s two-note chime, sine plus a quiet harmonic), `type_tick` (0.03 s click), `scroll_pickup` (0.5 s paper rustle then a soft chime), `ocean_loop` (20 s, 22050 Hz, brown noise shaped by two slow swells; the last 1.5 s are cross-faded into the first so the loop is seamless). Peak level of every recipe is at most 0.8.',
          '`tests/unit/scripts/synthSfx.test.js` (write first): same seed gives byte-identical samples; every recipe has finite samples within [-1, 1]; lengths equal `seconds * sampleRate`; `ocean_loop` first and last samples differ by less than 0.02; `writeWav` header fields (RIFF, fmt, data sizes) are right when parsed back.',
        ],
        verify: [vt('tests/unit/scripts/synthSfx.test.js'), exists('scripts/assets/synthSfx.mjs')],
      },
      {
        title: 'Generate the files, replace the old ones, ledger everything that stays',
        items: [
          'CLI: `node scripts/assets/synthSfx.mjs --all` writes `assets/audio/sfx/<name>.wav` for every recipe and calls `addEntry` with `sourceUrl generated:scripts/assets/synthSfx.mjs`, author `project (generated)`, licence `CC0`. Run it.',
          'Delete `assets/audio/sfx/footstep_grass.ogg`, `footstep_sand.ogg`, `interact.ogg`, `type_tick.ogg`, `scroll_pickup.ogg`, `ocean_loop.ogg`.',
          'Ledger the files that stay with `scripts/ledger-add.mjs`: the six `assets/audio/music/*.ogg` (author `garsipal`, source `https://github.com/redeclipse/base/discussions/1347`, notes `legacy-v1: Red Eclipse ambience pack, CC0`) and `assets/audio/sfx/wind_loop.ogg` (author `felix.blume`, source `https://github.com/Muges/ambientsounds`, notes `legacy-v1: wind.ogg, CC0`). The resume PDF `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf` gets licence `OWN`, author `Kaviyarasu M`, source `https://github.com/kaviyarasu-dev/portfolio` and notes `legacy-v1: the user own resume`.',
          'Update `src/systems/audio.js` (and any other file that names a replaced sound): replace the v1 name concatenation with one table `AUDIO_FILES` of full relative paths (for example `sfx: { footstep_grass: "sfx/footstep_grass.wav", ... }`, `music: { island_day: "music/island_day.ogg", ... }`), loaded through `assetUrl("audio/" + path)`; music stays `.ogg`, replaced effects become `.wav`; drop the `.mp3` fallback attempts. Rewrite `assets/audio/CREDITS.md` to describe the new set (generated sounds, the CC0 music and wind sources); remove every CC-BY and CC-BY-SA mention.',
          '`tests/unit/audio/files.test.js`: imports `AUDIO_FILES` from `src/systems/audio.js` (export it) and asserts every path in it exists under `assets/audio/`; ignores non-audio files such as `CREDITS.md` and `LEDGER.json` when checking ledger coverage; asserts none of the six removed files exist; asserts `assets/LEDGER.json` has an entry for every `.ogg`/`.wav`/`.mp3` file under `assets/audio` and none for a missing file, that the resume PDF entry has licence `OWN`, and that `assets/audio/CREDITS.md` contains neither `CC-BY` nor `CC BY` and does contain `generated`.',
        ],
        verify: [vt('tests/unit/audio/files.test.js'), exists('assets/audio/sfx/footstep_grass.wav', 'assets/audio/sfx/ocean_loop.wav', 'assets/LEDGER.json'), absent('assets/audio/sfx/ocean_loop.ogg', 'assets/audio/sfx/footstep_grass.ogg', 'assets/audio/sfx/interact.ogg')],
      },
      {
        title: 'Playwright: no failed requests',
        items: [
          '`tests/e2e/audio-assets.spec.js`: wait for `window.__world.ready`; click the canvas and press `Shift` to unlock audio; wait 4 s; assert no response had status 400 or higher and no `requestfailed` happened except an aborted media request (`ERR_ABORTED` on a `.ogg`, which streaming music can cause); log offending URLs in the assertion message; assert at least one `.wav` request returned 200 and at least one `.ogg` request returned 200 or 206.',
        ],
        verify: [pw('tests/e2e/audio-assets.spec.js', 10)],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/scripts/synthSfx.test.js', 'tests/unit/audio/files.test.js'), pw('tests/e2e/audio-assets.spec.js', 10), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/scripts/**', 'portfolio/assets/**', 'portfolio/src/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/scripts/synthSfx.test.js', 'portfolio/tests/unit/audio/files.test.js', 'portfolio/tests/e2e/audio-assets.spec.js'],
    human: 'Listen to the generated effects (footsteps, chime, ocean) once; they are simple on purpose and plan 064 improves the footsteps.',
  },

  // ---------------------------------------------------------------- 008
  {
    id: '008', name: 'avatar-replacement', title: 'Replace Soldier with a code-built casual human avatar (idle, walk, run, sit) and a drop-in GLB path', epic: 'E1', est: 55, model: 'opus',
    arch: 'sections 10.1, 10.5 and decisions D16, D28',
    goal: [
      'Remove the Mixamo Soldier (not CC0) and give the game a casual human avatar with the clips `idle`, `walk`, `run` and `sit`. No CC0 rigged human is reachable unattended (ARCHITECTURE.md 10.1), so the default is a code-built articulated humanoid with procedural clips. If the user places a CC0 GLB at `..\\portfolio-asset-cache\\manual\\avatar\\avatar.glb` (with `meta.json`), a build script optimizes and uses it instead. The rest of the game only sees one API: `loadAvatar()`.',
    ],
    read: ['src/entity/player.js', 'src/state.js', 'src/systems/controller.js', 'scripts/assets/optimizeGlb.mjs', 'scripts/lib/cache.mjs', 'scripts/lib/ledger.mjs'],
    risks: ['D21/A2 style risk: the look of a code-built person is plain. This plan keeps proportions realistic (1.75 m) and gives NPC variants (plan 059) different clothes, but the person should judge it (human check).'],
    steps: [
      {
        title: 'Humanoid builder and procedural clips (headless, unit tested)',
        items: [
          '`tests/unit/avatar/humanoid.test.js` first. `src/entity/avatar/humanoid.js` exports `buildHumanoid({ skin, shirt, trousers, shoes, hair, heightScale = 1 })` returning `{ root, joints, height }`. `joints` is a name -> `Object3D` map for: `hips, spine, chest, neck, head, shoulderL, shoulderR, upperArmL, upperArmR, lowerArmL, lowerArmR, handL, handR, upperLegL, upperLegR, lowerLegL, lowerLegR, footL, footR`. Joint names are unique and used verbatim by the clips. Parts are `CapsuleGeometry`, `SphereGeometry` and `BoxGeometry` meshes with `MeshStandardMaterial` (roughness 0.7 to 0.9, no textures): pelvis, torso with a shirt, neck, head with hair cap and two small dark eyes, upper and lower arms with hands, upper and lower legs with trousers, shoes. Standing height is `1.75 * heightScale` metres (bounding box checked), feet at y = 0, front is +z. `castShadow` true on all meshes.',
          '`src/entity/avatar/clips.js` exports `buildClips(joints)` returning `{ idle, walk, run, sit }` as `AnimationClip`s using `QuaternionKeyframeTrack` on `<joint>.quaternion` and a `VectorKeyframeTrack` on `hips.position`. Walk: 1.0 s loop, 16 keys, hip swing +-0.5 rad, knees flex only backward (the shin folds behind the thigh, a positive x rotation of the lower leg), arms swing opposite the legs, small torso counter-rotation, vertical bob 0.03 m. Run: 0.7 s loop, hip swing +-0.9 rad, elbows bent 1.4 rad, forward lean 0.15 rad, bob 0.06 m. Idle: 3.2 s loop, chest and shoulders breathe by +-0.01 rad, arms hang slightly forward. Sit: 0.5 s clip that ends in a held seated pose (hips lowered to about 0.5 m above the seat origin, upper legs -1.55 rad about x so the thighs point forward (+z), lower legs +1.5 rad so the shins hang down again, spine leans back 0.05 rad, hands on thighs; with the front at +z a negative x rotation of a hanging leg moves the foot forward), loop off, `clampWhenFinished` is set by the player code.',
          'Tests: every clip track targets an existing joint; names are exactly `idle walk run sit`; walk duration 1.0 +- 0.01, run 0.7 +- 0.01; sampled with an `AnimationMixer` at t = 0.25 s the right and left upper-leg rotations differ; sit pose lowers `hips.position.y` by at least 0.3 m below idle and the ankles end at least 0.3 m in front (+z) of the hips; walk keeps the knees bending backward only (the lower leg x rotation is never negative); height within 1.70 to 1.80; two humanoids built with different colours do not share material instances.',
        ],
        verify: [vt('tests/unit/avatar/humanoid.test.js'), exists('src/entity/avatar/humanoid.js', 'src/entity/avatar/clips.js')],
      },
      {
        title: 'loadAvatar, the optional GLB path, player integration, remove Soldier',
        items: [
          '`scripts/assets/buildAvatar.mjs` (`buildAvatar({ root, assetsRoot, ledgerPath, repoRoot, sourceFile })`, `root` is the cache root as in plan 005 and `readManualMeta("avatar", root)` is used): when `<root>/manual/avatar/avatar.glb` and a valid `meta.json` exist, run `optimizeGlb` into `assets/models/avatar.glb`, require animations whose names contain `idle`, `walk` and `run` (add the `sit` clip from the procedural clip names mapping when missing: record `sit: "procedural"`), `addEntry` for the file from `meta.json` with notes starting `manual-drop-in` (so any https source host is accepted by the ledger rules), and write `src/entity/avatar/avatarSource.json` = `{ "source": "glb", "file": "models/avatar.glb", "clipMap": { "idle": "<name>", ... } }`. When no manual file exists write `{ "source": "procedural" }` and exit 0. Run it now (expected: procedural).',
          '`tests/unit/scripts/buildAvatar.test.js`: with a generated fixture GLB (gltf-transform: a bone chain plus animations `Idle`, `Walk`, `Run`) in a temp manual folder, the function writes the source JSON with `source: glb` and the clip map and adds a ledger entry; with an empty folder it writes `procedural`; with a `meta.json` whose licence is not CC0 it throws and writes nothing (no file, no ledger entry, no source json change); a GLB larger than 6 MB is also refused.',
          '`src/entity/avatar/loadAvatar.js`: `async loadAvatar({ variant } = {})` where `variant` is `{ skin, shirt, trousers, shoes, hair, heightScale }` (defaults for the player: shirt `#2f6fb0`, trousers `#2b2f3a`, skin `#c68642`, hair `#1b1b1b`, shoes `#222222`, heightScale 1) returns `{ root, mixer, actions: { idle, walk, run, sit }, clips, source, headJoint }`. Procedural: `buildHumanoid` plus `buildClips` plus an `AnimationMixer`. GLB: `GLTFLoader` with `MeshoptDecoder` from `three/addons/libs/meshopt_decoder.module.js`, mapping clip names through `clipMap`. Same shape either way. GLB details: the model is scaled so its bounding box is 1.75 m high with feet at y 0 and turned so its forward axis (`meta.json.forwardAxis`, default `+z`) is +z; `headJoint` is the first bone whose name matches /head/i and not /top|end/i; the `sit` action of a GLB without a `sit` clip is a fallback that plays `idle` and lowers the model root by 0.35 m (stated in `source` details), so sitting still works; `actions.sit` always exists.',
          'Rewrite `src/entity/player.js` to use `loadAvatar()`: crossfade idle/walk/run as v1 did (0.35 s); keep the head look-at toward the nearest zone using `headJoint`, applied AFTER the mixer update each frame so animation tracks never fight it; expose `playAvatarAnim(name)` (sets `game.player.animOverride = name` and plays that action once, clamped; while an override is set `animatePlayer` does not crossfade to the base actions), `clearAvatarAnim()` (removes the override and crossfades back to idle) and `getAvatarState()` (`{ current, clips: [...], hipsY }`); `game.player.avatar = { actions, clips, getState }` so the dev hook can reach it. The player root keeps `game.player.*` fields as in v1. Default player look: see `loadAvatar`.',
          'Delete `assets/models/Soldier.glb`. `tests/unit/avatar/noSoldier.test.js` asserts no file under `src/` mentions `Soldier` or `Xbot` and that no `.glb` named Soldier or Xbot exists in `assets/`.',
        ],
        verify: [vt('tests/unit/scripts/buildAvatar.test.js', 'tests/unit/avatar/noSoldier.test.js'), exists('src/entity/avatar/loadAvatar.js', 'src/entity/avatar/avatarSource.json'), has('src/entity/avatar/avatarSource.json', 'procedural'), absent('assets/models/Soldier.glb')],
      },
      {
        title: 'Hook fields and Playwright: four clips exist and play',
        items: [
          'Extend `src/dev/worldHook.js`: `avatarClips()` returns the clip names of the player avatar; `playerAnim()` returns the name of the action with the highest weight (not the requested name); `avatarPose()` returns `{ hipsY }`; `setPlayerAnim(name)` calls `playAvatarAnim` (and `clearAvatarAnim()` for `idle`, `walk`, `run` after `setPlayerAnim`) for tests. The hook reads `game.player.avatar`.',
          '`tests/e2e/avatar.spec.js`: start with `teleport(0, 20, undefined, 0)`; `avatarClips()` equals `[\'idle\',\'run\',\'sit\',\'walk\']` when sorted; walking with `w` makes `playerAnim()` become `walk` (poll up to 4 s), with Shift `run`, after releasing the keys `idle`; record `avatarPose().hipsY` when idle, then `setPlayerAnim(\'sit\')`: `playerAnim()` becomes `sit` (poll up to 4 s) and `hipsY` is at least 0.3 m lower than the idle value, and `setPlayerAnim(\'idle\')` brings it back. Also assert zero console errors.',
          'Visual self-review (best effort, never fails): run `npm run shots` if it exists (it arrives in plan 014; otherwise skip and say so) and note how the avatar looks.',
        ],
        verify: [pw('tests/e2e/avatar.spec.js', 10)],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/avatar/humanoid.test.js', 'tests/unit/scripts/buildAvatar.test.js', 'tests/unit/avatar/noSoldier.test.js'), { cmd: 'npm test', timeout_min: 15 }, pw('tests/e2e/avatar.spec.js', 10), pw('tests/e2e/smoke.spec.js', 15)],
    allowed: ['portfolio/src/**', 'portfolio/scripts/**', 'portfolio/assets/**', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/avatar/humanoid.test.js', 'portfolio/tests/unit/scripts/buildAvatar.test.js', 'portfolio/tests/unit/avatar/noSoldier.test.js', 'portfolio/tests/e2e/avatar.spec.js'],
    human: 'Judge the avatar look. To use a nicer CC0 person: download Quaternius "Universal Base Characters" (CC0) from itch.io yourself, save the GLB as `..\\portfolio-asset-cache\\manual\\avatar\\avatar.glb` with a `meta.json` ({"sourceUrl": "...", "author": "Quaternius", "licence": "CC0"}), then run `node scripts/assets/buildAvatar.mjs` and the tests.',
  },

  // ---------------------------------------------------------------- 009
  {
    id: '009', name: 'fonts-self-hosted', title: 'Self-host Inter, Orbitron and Noto Sans Tamil (OFL) and drop Google Fonts', epic: 'E1', est: 40,
    arch: 'sections 1, 10.2 and assumptions A9, A26, A28',
    goal: [
      'No font request may leave the site: Inter, Orbitron and Noto Sans Tamil (all OFL) are copied from the `@fontsource` packages into `assets/fonts/` with their licence texts, declared by `@font-face`, and the Google Fonts links disappear. A script checks that no CDN is used anywhere in the page or the build.',
    ],
    read: ['index.html', 'src/main.js', 'scripts/lib/ledger.mjs', 'scripts/lib/ledgerRules.mjs'],
    steps: [
      {
        title: 'Install the packages and sync the font files',
        items: [
          'Install with `--save-dev --save-exact`: `@fontsource/inter`, `@fontsource/orbitron`, `@fontsource/noto-sans-tamil` (a source for the copy script only; this npm install is the one permitted non-asset-script download, like plan 001).',
          '`scripts/sync-fonts.mjs`: copies from `node_modules/@fontsource/<pkg>/files/<pkg>-<subset>-<weight>-normal.woff2` exactly these 14 files to `assets/fonts/<family>-<subset>-<weight>.woff2`: Inter latin 400, 500, 600, 700, 800; Orbitron latin 500, 700, 900; Noto Sans Tamil latin 400, 600, 700 and tamil 400, 600, 700; copies each package `LICENSE` to `assets/licenses/OFL-<family>.txt`; writes ledger entries through `addEntry` of `scripts/lib/ledger.mjs` (licence `OFL`, source `https://www.npmjs.com/package/@fontsource/<name>`, author = the text after `Copyright` on the first copyright line of the copied licence file, for example `The Inter Project Authors`, notes `font <family> <weight>`). Idempotent.',
          'Run it. `tests/unit/fonts/files.test.js`: all 14 font files exist, the OFL text for Noto Sans Tamil exists and contains `SIL OPEN FONT LICENSE`, all three family licence files exist, every font file has a ledger entry with licence `OFL` and a non-empty author, total font bytes are under 1.5 MB.',
        ],
        verify: [vt('tests/unit/fonts/files.test.js'), exists('assets/fonts/noto-sans-tamil-tamil-400.woff2', 'assets/licenses/OFL-noto-sans-tamil.txt', 'scripts/sync-fonts.mjs')],
      },
      {
        title: '@font-face, index.html and the no-CDN check',
        items: [
          '`src/styles/fonts.css` with one `@font-face` per file (`font-display: swap`, `unicode-range` for the Tamil subset U+0B80-0BFF), urls like `/fonts/inter-latin-400.woff2` (Vite rewrites them with the base). Import it from `src/main.js`.',
          'Google Fonts links are already gone (plan 002); make sure `index.html` has none. Add `"Noto Sans Tamil"` to the CSS `font-family` stacks of the body text and of the Orbitron headings after the Latin family, so Tamil text uses it. Each `@font-face` has `font-display: swap`; the Tamil faces carry `unicode-range: U+0B80-0BFF` and the Latin Noto faces `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`; urls look like `/fonts/inter-latin-400.woff2` (Vite rewrites them with the base).',
          '`scripts/check-no-cdn.mjs`: scans `index.html`, `credits.html` when present, `src/` and `dist/` (only these exact hosts are flagged; other URLs inside the bundled libraries are ignored) for the hosts `fonts.googleapis.com`, `fonts.gstatic.com`, `cdn.jsdelivr.net`, `cdnjs.cloudflare.com`, `unpkg.com`, `ajax.googleapis.com`, `kit.fontawesome.com`; exit 1 with file:line on a hit, exit 0 otherwise. Export `scanForCdn(root)` returning `[{ file, line, host }]`; `tests/unit/scripts/noCdn.test.js` covers each of the seven hosts, the CLI exit code and the `file:line` output, `credits.html`, a clean folder and ignoring `docs/`.',
        ],
        verify: [vt('tests/unit/scripts/noCdn.test.js'), exists('src/styles/fonts.css', 'scripts/check-no-cdn.mjs'), none('index.html', 'fonts\\.googleapis|fonts\\.gstatic')],
      },
      {
        title: 'Playwright: fonts load locally',
        items: [
          '`tests/e2e/fonts.spec.js`: record all request hosts during load: none other than the dev server host; `await document.fonts.load(\'700 16px Orbitron\')` resolves with at least one face and `await document.fonts.load(\'400 16px "Noto Sans Tamil"\', \'தமிழ்\')` (pass Tamil text, otherwise the Tamil unicode-range face is not selected) resolves with a face whose `status` is `loaded` and whose `unicodeRange` includes `U+0B80`; `document.fonts.check` is true for both with the Tamil sample text; zero console errors.',
          'Run `npm run build` and `node scripts/check-no-cdn.mjs`.',
        ],
        verify: [pw('tests/e2e/fonts.spec.js', 10), npm('build', 15), node('scripts/check-no-cdn.mjs')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/fonts/files.test.js', 'tests/unit/scripts/noCdn.test.js'), npm('build', 15), node('scripts/check-no-cdn.mjs'), pw('tests/e2e/fonts.spec.js', 10)],
    allowed: ['portfolio/scripts/**', 'portfolio/assets/**', 'portfolio/src/**', 'portfolio/index.html', 'portfolio/tests/**'],
    freeze: ['portfolio/tests/unit/fonts/files.test.js', 'portfolio/tests/unit/scripts/noCdn.test.js', 'portfolio/tests/e2e/fonts.spec.js'],
  },

  // ---------------------------------------------------------------- 010
  {
    id: '010', name: 'ledger-size-credits', title: 'Strict ledger check, size check and the generated credits page', epic: 'E1', est: 45,
    arch: 'sections 3 (asset ledger) and 10.2, requirement R2',
    goal: [
      'Make the licence rules machine-enforced: `npm run check:ledger` fails on any shipped file without a proper CC0 (or OFL font, or the user\'s own PDF) entry, `npm run check:size` enforces the 80 MB total and 20 MB per file limits, and `scripts/generate-credits.mjs` writes `credits.html` and `CREDITS.md` from the ledger. At the end the whole `gates:full` group runs green for the first time.',
    ],
    read: ['scripts/lib/ledgerRules.mjs', 'scripts/lib/ledger.mjs', 'assets/LEDGER.json', 'vite.config.js', 'scripts/run-gates.mjs', 'docs/world-conventions.md'],
    steps: [
      {
        title: 'check-ledger',
        items: [
          '`scripts/check-ledger.mjs` (export `checkLedger({ root })` returning `{ problems }`; the CLI exits 1 and prints every problem): walks `assets/`; every file for which `isLedgerExempt` (plan 005) is false needs exactly one entry (documentation and index files such as `CREDITS.md`, `INDEX.json`, `set.json` and the licence texts are exempt); every entry needs an existing file; each entry passes `validateEntry` from `ledgerRules.mjs` (licence rules, host rules, sha256 and bytes match); no duplicate `file`; no entry for a file outside `assets/`.',
          '`tests/unit/scripts/checkLedger.test.js` with temp trees (the exempt files are ignored; an entry whose `host` field differs from the hostname of `sourceUrl` is a problem; duplicate `file`; an entry for a file outside `assets/`): missing entry, extra entry, wrong sha, licence `CC-BY`, host `example.com`, OFL on a non-font, `OWN` on a non-PDF, a clean tree; plus one test that runs `checkLedger` on the real repo and expects no problems.',
          'Fix any real problem it reports on the current repo: a file whose real source is known gets its entry through `ledger-add`; a file with no known source or a non-CC0 licence is DELETED (never ledger a file with an invented source). Stray leftovers such as old `assets/models/*` files are deleted.',
        ],
        verify: [vt('tests/unit/scripts/checkLedger.test.js'), npm('check:ledger')],
      },
      {
        title: 'check-size',
        items: [
          '`scripts/check-size.mjs` (export `checkSize({ root, totalMb = 80, fileMb = 20 })`, MB means 1048576 bytes): sums the bytes of every file under `assets/` (all files, exempt ones included); fails when the total exceeds the limit or any file is 20 MB or more; prints the five largest files and the total; options `--total-mb` and `--file-mb` override. Reserve the flag `--phone` (not implemented yet: it prints "phone budget arrives in plan 075" and exits 0).',
          '`tests/unit/scripts/checkSize.test.js`: temp trees at, below and above both limits (a file of exactly 20 MB fails, a total of exactly 80 MB passes), the `--total-mb` and `--file-mb` overrides, the five-largest list order and the `--phone` stub message with exit 0.',
        ],
        verify: [vt('tests/unit/scripts/checkSize.test.js'), npm('check:size')],
      },
      {
        title: 'Credits generator, credits.html in the build',
        items: [
          '`scripts/generate-credits.mjs [--check]`: exports `renderCredits(ledger, licenseTexts)` where `licenseTexts` is an object `{ "<file name>": "<text>" }` of the files under `assets/licenses/`, returning `{ html, markdown }`, and `checkCredits({ root })` returning `{ ok, stale: [file...] }` (the `--check` logic); groups by source (host) then author, lists file counts and links; has a "Fonts" section that includes the full text of each `assets/licenses/OFL-*.txt` (HTML-escaped); has a CC0 notice. Writes `credits.html` and `CREDITS.md` at the repo root; with `--check` it exits 1 when either file is out of date and writes nothing. HTML uses the same dark theme colours as `index.html` (background `#05070c`, text `#f5f7fb`, accent `#7cc7ff`), no external resources (no `http` in any `src`, `href` or `url(` except the credited source links shown as plain `<a>` text links), `<meta name="viewport">`, a link back to `./`; the page shows a CC0 notice ("CC0 1.0 Universal, public domain dedication") and one section per source host with authors and file counts.',
          '`vite.config.js`: add `build.rollupOptions.input` with `main: \'index.html\'` and `credits: \'credits.html\'`. Add a small "Credits" link in a footer element `#credits-link` of `index.html` that is visible on every screen size (the `#help` panel is hidden under 800 px, so do not put it there) and opens `credits.html` in a new tab with `target="_blank" rel="noopener"`.',
          '`tests/unit/scripts/credits.test.js`: HTML-escaping of an author like `A <b>&"x`, OFL text included, the CC0 notice, one section per host, no external resource URLs, the viewport meta, deterministic output (two calls equal), `checkCredits` on a temp dir (fresh and stale). A second small test reads `index.html` and `vite.config.js`: the `#credits-link` has `rel="noopener"`, and `rollupOptions.input` names `credits.html`. Then generate the files for real.',
        ],
        verify: [vt('tests/unit/scripts/credits.test.js'), node('scripts/generate-credits.mjs --check'), has('vite.config.js', 'input'), has('index.html', 'id="credits-link"')],
      },
      {
        title: 'First green full gates run',
        items: [
          'Run `npm run gates:full` for real. Entries whose script does not exist yet are SKIPPED (content, buildings, local detail); everything else must pass: lint, unit, build, no-cdn, prod-hook, phone, ledger, size, credits (read the output and confirm each of these nine says passed, none skipped). Fix a failure at its root by changing the code or data, never by weakening a check; if one cannot be fixed within this plan write BLOCKED.md naming the check.',
          'Add a section titled "Assets and ledger" to `docs/world-conventions.md` (how to add an asset: always through `packMaterial`, `packModel`, `synthSfx` or `ledger-add`; never by hand; what is exempt from the ledger; the 80 MB and 20 MB limits).',
        ],
        verify: [{ cmd: 'npm run gates:full', timeout_min: 30 }, has('docs/world-conventions.md', 'Assets and ledger')],
      },
    ],
    accept: [npm('lint'), vt('tests/unit/scripts/checkLedger.test.js', 'tests/unit/scripts/checkSize.test.js', 'tests/unit/scripts/credits.test.js'), { cmd: 'npm run gates:full', timeout_min: 30 }],
    allowed: ['portfolio/scripts/**', 'portfolio/tests/**', 'portfolio/assets/**', 'portfolio/credits.html', 'portfolio/CREDITS.md', 'portfolio/vite.config.js', 'portfolio/index.html', 'portfolio/docs/world-conventions.md', 'portfolio/src/**'],
    freeze: ['portfolio/tests/unit/scripts/checkLedger.test.js', 'portfolio/tests/unit/scripts/checkSize.test.js', 'portfolio/tests/unit/scripts/credits.test.js'],
  },
];
