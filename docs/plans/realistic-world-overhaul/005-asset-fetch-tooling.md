# Plan 005: Asset fetch tooling: host allowlist, untrusted cache, Poly Haven client, ledger writer

Epic E1. Estimated turns: 55.

## Goal

Build the only way plan sessions may download assets: node scripts that talk to allowlisted CC0 hosts, store every download in its own folder under `..\portfolio-asset-cache\<source>\<id>\` (outside the repo), never execute anything, count at most 3 sources per element, and write the licence ledger. Poly Haven is the reliable source on this machine; the other hosts are tried by the same code but are expected to fail (ARCHITECTURE.md 10.1).

All logic takes an injectable `fetchImpl` so unit tests never touch the network. One live dry-run check at the end proves the Poly Haven client works against the real API.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 6, 7 and 10.1, 10.2)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- docs/world-conventions.md
- scripts/lib/paths.mjs
- vitest.config.js

High-risk assumptions that touch this plan (each has a step that checks it):
- A1 (HIGH-RISK, security): downloads are untrusted data. Steps 1 and 2 enforce: host allowlist on every redirect hop, https only, size cap, no execution, sanitized folder names, TLS verification never disabled (a test scans the source for the forbidden strings).

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Host allowlist, cache folders, attempt counter

Deliver:
- `scripts/lib/hosts.mjs`: `DOWNLOAD_HOSTS` = `api.polyhaven.com`, `dl.polyhaven.org`, `polyhaven.com`, `ambientcg.com`, `kenney.nl`, `poly.pizza`, `static.poly.pizza`, `opengameart.org`; `assertDownloadUrl(url)` throws unless the URL is https, has no username/password, no port other than 443 and the host is exactly in the list.
- `scripts/lib/cache.mjs`: `cacheRoot()` = `<repo>/../portfolio-asset-cache`; `cacheDir(source, id)` validates both against `/^[a-z0-9][a-z0-9_.-]{0,79}$/i` (throws otherwise, so `..` can never appear) and creates the folder; `manualDir(kind)` returns `<cacheRoot>/manual/<kind>`; `readManualMeta(kind)` reads `meta.json` there and requires `sourceUrl`, `author` and `licence === "CC0"` (returns null when the folder or file is missing, throws on a bad file). Naming rule for every function in `scripts/`: the optional test override of the cache folder is called `root`; the optional fake network is `fetchImpl`.
- `scripts/lib/attempts.mjs`: `recordAttempt(element, source, outcome)` appends one JSON line to `<cacheRoot>/attempts.jsonl`; `distinctSources(element)`; `assertAttemptAllowed(element, source)` throws a clear message ("3 sources already tried for <element>: build it by code") when 3 other distinct sources were already recorded. Element names match `/^[a-z0-9][a-z0-9_.-]{0,60}$/`. All functions take an optional `root` argument for tests.
- Tests `tests/unit/scripts/assets-hosts.test.js` and `tests/unit/scripts/assets-cache.test.js`: http URL, userinfo URL, port 8443, look-alike host `api.polyhaven.com.evil.com`, unlisted host, id `../x`, id with spaces, the 4th source, the same source twice (counts once), an element name with a space; `recordAttempt` writes a JSON line to a temp `root`; `manualDir` path; `readManualMeta` with a valid file, a missing folder (null), a licence `CC-BY` (throws) and a missing author (throws).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/assets-hosts.test.js tests/unit/scripts/assets-cache.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/lib/hosts.mjs scripts/lib/cache.mjs scripts/lib/attempts.mjs`

### Step 2: Safe download and JSON fetch

Deliver:
- `scripts/lib/net.mjs`: `class NetError extends Error { kind }` with kinds `host|tls|timeout|size|http|md5`. `download(url, destFile, { fetchImpl = fetch, maxBytes = 250 MB, timeoutMs = 120000, maxRedirects = 5, md5 })` returns `{ file, bytes, sha256, finalUrl }`: uses `redirect: 'manual'` and re-runs `assertDownloadUrl` on every hop; streams the body to `<destFile>.part`, aborts and deletes the part when bytes exceed `maxBytes` or the timeout hits; renames only after success; when `md5` is given and differs it deletes the file and throws kind `md5`. TLS failures (look at `err.cause?.code` first, then `err.code`; codes starting `SELF_SIGNED`, `DEPTH_ZERO`, `UNABLE_TO_VERIFY`, `CERT_`, `ERR_TLS`) become kind `tls` with the message "certificate not trusted on this network".
- `fetchJson(url, { fetchImpl, maxBytes = 20 MB })` with the same checks. Neither function ever sets `NODE_TLS_REJECT_UNAUTHORIZED`, `rejectUnauthorized`, an HTTP proxy agent or a custom dispatcher.
- `tests/unit/scripts/assets-net.test.js` with a fake `fetchImpl`: redirect to an unlisted host is refused; size cap deletes the partial file; md5 mismatch deletes the file; a thrown error with `cause.code = 'SELF_SIGNED_CERT_IN_CHAIN'` becomes kind `tls`; a redirect from https to http is refused; a timeout aborts with kind `timeout`; `fetchJson` rejects an unlisted host and a body over the size cap; the returned `sha256` equals the sha256 of the written bytes and `finalUrl` is the last hop; and a scan test that reads `scripts/lib/net.mjs`, `scripts/fetch-asset.mjs` and every file under `scripts/assets/` and fails if any contains `NODE_TLS_REJECT_UNAUTHORIZED`, `rejectUnauthorized`, `curl`, `wget` or `Invoke-WebRequest`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/assets-net.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/lib/net.mjs`

### Step 3: Poly Haven client and the fetch and search CLIs

Deliver:
- Live shapes (verified 2026-10-30): `GET https://api.polyhaven.com/assets?t=textures|models|hdris[&c=<category>]` returns an object keyed by asset id with `name`, `categories`, `tags`, `authors`, `polycount`; `GET /files/<id>` returns keys like `Diffuse`, `nor_gl`, `Rough`, `AO`, `arm`, `Displacement` for textures (each `{ "1k": { "jpg": { url, size, md5 }, "png": {...} } }`) and for models `gltf: { "1k": { "gltf": { url, size, md5, include: { "<relative path>": { url, size, md5 } } } } }`; `GET /info/<id>` returns `authors` (object name -> role) and `name`. HDRIs: `files` has `hdri: { "1k": { "hdr": { url, size, md5 }, "exr": {...} } }`; `pickHdriFiles(filesJson, { res })` takes `hdr` and falls back to `exr`, then to the next lower resolution. Check these shapes once against the live API before you code the parser, using a throwaway script under `scripts/dev/` that calls `fetchJson` from `scripts/lib/net.mjs` (delete it afterwards), and note any difference in your report.
- `scripts/assets/polyhaven.mjs` (all functions take `{ fetchImpl, root }` where `root` overrides the cache folder): `searchAssets({ type, category, tags, query, limit })` (filter the id map client-side by tags and the query in id, name or tags); `pickTextureFiles(filesJson, { res, maps })` returns `{ diff, nor_gl, rough, ao, arm }` entries (jpg for colour, rough and ao, png or jpg for nor_gl; skip a map that is missing); `pickModelFiles(filesJson, { res })` returns the glTF url plus its `include` map; `fetchTexture(id, { res })`, `fetchModel(id, { res })` and `fetchHdri(id, { res })` download into `cacheDir('polyhaven', id)` (model includes keep their relative paths inside that folder) with md5 verification, and return `{ cacheDir, files, author, sourceUrl: 'https://polyhaven.com/a/<id>', name }` where `author` joins the `authors` keys and `files` is, for a texture, `{ diff, nor_gl, rough, ao, arm }` (absolute paths; a key is absent when the asset has no such map), for a model `{ gltf: <absolute path of the .gltf>, dir: <cacheDir> }`, for an HDRI `{ hdri: <absolute path> }`.
- `scripts/fetch-asset.mjs polyhaven <texture|model|hdri> <id> --res <1k|2k> --element <name> [--dry-run]` prints one JSON line `{ ok, element, source, cacheDir, files, author, sourceUrl }`. It calls `assertAttemptAllowed` first and `recordAttempt` after (not on `--dry-run`). With `--dry-run` it fetches only the API JSON and prints the files it would download. With `--dry-run` the JSON has `files: [{ name, url, size, md5 }]` (nothing is written). Other sources (`ambientcg`, `kenney`, `polypizza`, `opengameart`) are accepted by name: the CLI does one `GET https://<host>/` through `fetchJson`-style checks only to prove the host is reachable, records the attempt, and prints `ok:false` with the `NetError` kind (it never claims success because it has no asset parser) and the text "<n> of 3 sources used for <element>" where n counts this attempt; they are expected to fail here and the element is then built by code.
- `scripts/search-assets.mjs polyhaven <textures|models|hdris> [--category c] [--tags a,b] [--query q] [--limit n]` (`category` must be one of the asset categories; every listed tag must match, AND semantics; `query` matches id, name or any tag, case-insensitive) prints one JSON line per match (`id`, `name`, `categories`, `tags`, `polycount`).
- Tests `tests/unit/scripts/assets-polyhaven.test.js` with fixtures in `tests/fixtures/polyhaven/` (small hand-written JSON copies of the shapes above): texture map selection at `1k`, fallback when `arm` is missing, model include map, tag filtering, author join, dry-run makes no download.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/assets-polyhaven.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/fetch-asset.mjs scripts/search-assets.mjs scripts/assets/polyhaven.mjs`

### Step 4: Ledger library and ledger-add CLI, then the live dry-run

Deliver:
- `scripts/lib/ledgerRules.mjs` (shared with the checker plan 010): `isLedgerExempt(file)` (true for `assets/LEDGER.json`, any `*.md`, anything under `assets/licenses/`, `assets/textures/INDEX.json` and `assets/textures/*/set.json`: documentation and index files, not shipped assets) and `ALLOWED_LICENCES = ['CC0', 'OFL', 'OWN']`, `LEDGER_HOSTS` (download hosts plus `local`, `www.npmjs.com`, `github.com`), `validateEntry(entry, { repoRoot, assetsRoot = repoRoot/assets })` returning an array of problems (`assetsRoot` is the `assets/` folder itself; ledger `file` values are always written `assets/<rest>` and resolved as `assetsRoot/<rest>`; `repoRoot` is used to resolve `generated:` paths): `file` must start with `assets/` and exist; `licence` allowed; `OFL` only under `assets/fonts/`; `OWN` only for `assets/Kaviyarasu_Fullstack_Engineer_Resume.pdf`; `sourceUrl` is `https:` with an allowed host or `generated:<path that exists in the repo>`; `github.com` only when `notes` starts with `legacy-v1`; any other https host only when `notes` starts with `manual-drop-in`; `author` non-empty; `sha256` and `bytes` match the file.
- `scripts/lib/ledger.mjs`: `loadLedger(path)`, `addEntry(entry, { ledgerPath, assetsRoot, repoRoot })` computes `sha256` and `bytes` itself, sets `host` to the hostname of `sourceUrl` (`local` for `generated:` sources), defaults `notes` to an empty string, validates, replaces an existing entry with the same `file`, keeps the array sorted by `file`, writes pretty JSON; creates `assets/LEDGER.json` (`[]`) when missing; and `removeEntry(file, { ledgerPath })` (removes the entry whose `file` equals the argument, keeps the array sorted, writes the file and returns `true`, or returns `false` when there is no such entry; it never deletes the asset file itself; plan 030 uses it to drop a rejected model). `scripts/ledger-add.mjs --file <assets/...> --source <url|generated:path> --author <name> --licence CC0 [--notes text]` is the CLI; `scripts/ledger-add.mjs --remove <assets/file> [--ledger <path>]` is its second mode (no other flag is needed in that mode): it calls `removeEntry`, prints one JSON line `{ ok, removed, file }` and exits 0 when an entry was removed and 1 when there was none.
- `tests/unit/scripts/assets-ledger.test.js` with temp folders: valid entry written with correct sha; wrong licence, unlisted host, missing file, OFL outside fonts, `github.com` without the legacy note, generated path that does not exist: all rejected; idempotent re-add; sorted output; empty author rejected; a missing `LEDGER.json` is created as `[]`; `host` is `local` for generated sources; the `ledger-add.mjs` CLI (call its exported `main(argv)`) writes the entry and exits non-zero on a bad licence; `removeEntry` removes an existing entry and returns `true`, returns `false` for an unknown file and leaves the other entries and their sort order untouched, and does not touch the asset file on disk; `main(["--remove", "assets/x.bin", "--ledger", tmp])` exits 0 for a ledgered file and 1 for an unknown one.
- Live check (needs network): `node scripts/fetch-asset.mjs polyhaven texture plaster_grey_04 --res 1k --element selftest-plaster --dry-run` and `node scripts/search-assets.mjs polyhaven models --category furniture --limit 3` both exit 0. If the network is down write BLOCKED.md.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/assets-ledger.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/lib/ledger.mjs scripts/lib/ledgerRules.mjs scripts/ledger-add.mjs`
- `node "{{runner}}/assert.mjs" has scripts/lib/ledger.mjs "removeEntry"`
- `node "{{runner}}/assert.mjs" has scripts/ledger-add.mjs "remove"`
- `node scripts/search-assets.mjs polyhaven models --category furniture --limit 3`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).
- `assets/` (no asset is added in this plan).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/assets-hosts.test.js tests/unit/scripts/assets-cache.test.js tests/unit/scripts/assets-net.test.js tests/unit/scripts/assets-polyhaven.test.js tests/unit/scripts/assets-ledger.test.js`
- `node scripts/fetch-asset.mjs polyhaven texture plaster_grey_04 --res 1k --element selftest-plaster --dry-run`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
