# Kaviyarasu — Island Portfolio

An interactive pixel-art island exploration game that **is** the developer
portfolio for Kaviyarasu, Senior Full Stack Engineer. Walk the island, and
each landmark opens a retro RPG dialogue with the relevant portfolio section.

## Run it

Double-click `index.html` — it loads the pre-built bundle at `dist/bundle.js` and works over `file://`. Or serve via HTTP:

- **XAMPP**: `http://localhost/gggg/`
- **Quick local server**: `python -m http.server 8000` and open `http://localhost:8000/`

Any modern browser (Chrome, Safari, Firefox, Edge). Requires internet for one Google Font + the Howler.js CDN.

### After editing modules

Source lives in `/js/*.js` (ES modules). If you edit a module, regenerate the bundle:

```
node build.mjs
```

This concatenates all modules in dependency order into `dist/bundle.js`. Takes a fraction of a second.

## Controls

**Desktop**
- Move: `W A S D` or arrow keys
- Sprint: hold `Shift`
- Interact (at the Notice Board): `E`
- Debug weather: `1` clear · `2` rain · `3` fog
- Debug time: `T` advances the day/night cycle by ~20 min

**Mobile / touch**
- D-pad (bottom-left) to move
- `ACT` button (bottom-right) to take the resume scroll at the Notice Board
- `RUN` button (above ACT) toggles sprint

Walk near any landmark to auto-open its dialogue. Walk away to close it. Audio unlocks on first tap.

**URL params**
- `?time=0.75` starts the world at night. `0` midnight, `0.25` morning, `0.5` noon, `0.7` dusk.

## Zones

| Landmark | Section |
|---|---|
| The Hut | About Me |
| The Skill Forge | Tech Skills |
| GravityWrite Castle | Featured Project |
| The Shipyard | GravitySocial, GravityAuth, TransGenie, AI Agent (OSS), 1CLX |
| Milestones | 300K users, 5-dev team lead, open-source package, etc. |
| The Lighthouse | Contact (email, phone, LinkedIn, GitHub) |
| The Library | Experience timeline (4 roles) |
| The Academy | Education + PHP certification |
| The Notice Board | Resume download |

## Notes

- The resume link points to `./Kaviyarasu Full Stack Engineer Resume.pdf`
  (already present in this folder). Replace it to swap the download.
- All rendering is procedural canvas 2D — no external images. Sprites, tiles
  and buildings are drawn with `fillRect`/`arc`/gradients.
- Source is split into ES modules under `/js/` (see `CLAUDE.md` for the map).
