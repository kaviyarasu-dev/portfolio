# Plan 006: Asset optimize tooling: GLB optimizer, texture packer, material and model pack CLIs

Epic E1. Estimated turns: 50.

## Goal

Turn raw downloads into shippable files: a GLB optimizer (dedup, prune, WebP textures, meshopt compression), a texture-set packer (512 / 1k / 2k WebP per map), and two CLIs (`packMaterial`, `packModel`) that fetch, convert and write the ledger in one command. Every later plan that needs a texture or model uses these CLIs.

## Read first

- `portfolio/docs/plans/realistic-world-overhaul/ARCHITECTURE.md` (section 10 is final; most relevant: sections 1 and 10.2)
- `portfolio/docs/plans/realistic-world-overhaul/INSTRUCTIONS.md`
- CONTEXT.md in this plan folder (written by the runner, lists what earlier plans built) and docs/world-conventions.md in the repo, when they exist
- scripts/lib/ledger.mjs
- scripts/lib/cache.mjs
- scripts/assets/polyhaven.mjs
- scripts/fetch-asset.mjs
- docs/world-conventions.md

## Steps

Do the steps in order. After each step run the checkpoint command from your prompt and continue only on `CHECKPOINT <n> OK`.

### Step 1: Dependencies, GLB info and GLB optimizer

Deliver:
- Install dev dependencies with `--save-dev --save-exact`: `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `meshoptimizer`, `sharp`.
- `scripts/lib/glbInfo.mjs`: `readGlbInfo(path)` returns `{ bytes, triangles, meshes, materials, textures, extensionsUsed, animations: [names], size: [x,y,z] }` using gltf-transform `NodeIO` with all extensions registered and `meshopt` decoder and encoder registered (`await MeshoptDecoder.ready` and `await MeshoptEncoder.ready` first). `triangles` counts indexed triangle primitives (index count / 3, or position count / 3 when non-indexed, mode TRIANGLES only) over all meshes; `size` is the bounding box of the default scene in metres (`getBounds`); `animations` lists clip names.
- `scripts/assets/optimizeGlb.mjs`: `optimizeGlb({ input, output, maxTextureSize = 1024, webpQuality = 82 })` accepts a `.gltf` (with its `.bin` and textures) or `.glb`; applies `dedup`, `prune`, `textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [max, max] })`, then `meshopt({ encoder: MeshoptEncoder, level: 'medium' })`; writes one `.glb`; returns the info of the result.
- `tests/unit/scripts/optimizeGlb.test.js`: build a tiny glTF in memory (one quad, one 1024x1024 PNG texture made with `sharp`), write it to a temp folder, optimize with `maxTextureSize` 256, read back: `extensionsUsed` contains `EXT_meshopt_compression` and `EXT_texture_webp`, the texture is WebP and at most 256 wide (the resize is applied), triangles unchanged (2), `size` is the quad bounds; a second run with `maxTextureSize` 1024 leaves the texture 1024 wide; the info of the result lists the animation names (an empty list here).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/optimizeGlb.test.js`
- `node "{{runner}}/assert.mjs" exists node_modules/sharp/package.json node_modules/@gltf-transform/core/package.json scripts/assets/optimizeGlb.mjs scripts/lib/glbInfo.mjs`

### Step 2: Texture set packer

Deliver:
- `scripts/assets/packTextureSet.mjs`: `packTextureSet({ name, maps: { diff, nor_gl, rough, ao }, assetsRoot, sizes = [512, 1024], hero = false })` writes `assets/textures/<name>/<512|1k|2k>/{color,normal,rough,ao}.webp` (quality 82; `ao` only when given; `2k` only when `hero`), resizing with sharp (`fit: inside`, never upscaling); `rough` is converted to single channel grayscale; returns the list of written files. A text file `assets/textures/<name>/set.json` records `{ name, sizes, maps }`.
- Names: `<name>` matches `/^[a-z][a-z0-9-]{1,40}$/`.
- `tests/unit/scripts/packTextureSet.test.js`: make 2048x2048 PNG inputs with sharp (flat colours are fine), pack with `hero: true` into a temp assets root, assert the three size folders `512`, `1k` and `2k` exist, the files are 512, 1024 and 2048 wide; a second call with 600x600 inputs and `hero: false` writes `512` (512 wide) and `1k` (600 wide, not upscaled) and no `2k`; `rough.webp` has one channel in the metadata (`channels` 1) and `ao.webp` exists only when `ao` was given; the output is WebP (`format` webp); `set.json` lists the sizes; an invalid name throws. The size numbers map to folders as 512 to `512`, 1024 to `1k`, 2048 to `2k`; `hero` adds 2048 to `sizes`; the returned list contains the image files only, and `set.json` is an index file that is exempt from the ledger (`isLedgerExempt`).

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/packTextureSet.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/packTextureSet.mjs`

### Step 3: packMaterial and packModel CLIs with ledger writing, then a live self-test

Deliver:
- `scripts/assets/packMaterial.mjs <polyhavenId> <name> --element <e> [--hero] [--assets-root dir] [--ledger file]`: fetch the texture (res `2k` when `--hero` else `1k`), `packTextureSet`, then `addEntry` for every written file with `sourceUrl https://polyhaven.com/a/<id>`, the author from the info call, licence `CC0`, notes `texture set <name>`. `--element` is the element name for the attempt counter of plan 005: call `assertAttemptAllowed` before the first request and `recordAttempt` after (the CLIs import the polyhaven client directly, which the INSTRUCTIONS allow for `scripts/assets/*.mjs`). The fetched texture result has `files: { diff, nor_gl, rough, ao, arm }` (absolute paths, a key missing when the map does not exist); a model result has `files: { gltf: <absolute path of the .gltf>, dir }`. Prints one JSON line with the written files (a `files` array of repo-relative paths plus `ledgered: <count>`). `addEntry` creates missing parent folders of the ledger file. Exits 1 if any output file is missing afterwards or if any file was written under the repo `assets/` while `--assets-root` was given (compare a directory listing before and after).
- `scripts/assets/packModel.mjs <polyhavenId> <name> --element <e> [--max-texture 1024] [--assets-root dir] [--ledger file]`: fetch the model at `1k`, optimize to `<assets-root>/models/<name>.glb`, add the ledger entry, print `readGlbInfo`. Refuses (exit 1) when the result is over 3 MB or over 60000 triangles (defaults of the tool, overridable with `--max-mb` and `--max-tris`): it deletes the output file, writes no ledger entry and says why. A unit test covers both the accept and the refuse path with a generated glTF.
- Both CLIs export their main function so a unit test can call it with a fake `fetchImpl`, a temp assets root and a temp ledger: `tests/unit/scripts/packCli.test.js` checks that files and ledger entries line up one to one and that the ledger sha256 equals the file.
- Live self-test (needs network): `node scripts/assets/packMaterial.mjs plaster_grey_04 selftest-plaster --element selftest-plaster --assets-root ../portfolio-asset-cache/_selftest/assets --ledger ../portfolio-asset-cache/_selftest/LEDGER.json` exits 0 and writes nothing under the repo `assets/`.

Check for this step (the runner runs it too; it fails before the work and passes after):
- `npx vitest run tests/unit/scripts/packCli.test.js`
- `node "{{runner}}/assert.mjs" exists scripts/assets/packMaterial.mjs scripts/assets/packModel.mjs`
- `node scripts/assets/packMaterial.mjs plaster_grey_04 selftest-plaster --element selftest-plaster --assets-root ../portfolio-asset-cache/_selftest/assets --ledger ../portfolio-asset-cache/_selftest/LEDGER.json`

## Do not touch

- The plan folder, `.git`, `.env` and `.env.*`, agent settings, hooks, skills. The branch (stay on `world-v2`).
- Frozen tests and test configs of earlier plans (a refused write means frozen).
- `assets/` (the live self-test writes only into the cache folder).

## Acceptance

Run every command below before the final report. All must exit 0.

- `npm run lint`
- `npx vitest run tests/unit/scripts/optimizeGlb.test.js tests/unit/scripts/packTextureSet.test.js tests/unit/scripts/packCli.test.js`
- `node scripts/assets/packMaterial.mjs plaster_grey_04 selftest-plaster --element selftest-plaster --assets-root ../portfolio-asset-cache/_selftest/assets --ledger ../portfolio-asset-cache/_selftest/LEDGER.json`

## If blocked

Write `BLOCKED.md` in the plan folder with the reason and what you tried, then stop. Do not weaken a check, do not fake a result.
- `sharp` fails to install or load on this machine: BLOCKED.md with the npm error.

## Report back

End with the runner's final JSON report: every step done or not, `not_done` (anything you did not do), `different_from_plan` (each with a reason), `needs_person_check`, and `context` (every module, interface, helper or convention later plans must reuse, with its path and exported names).
