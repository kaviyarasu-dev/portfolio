# Audio assets

The game loads audio files from here via Howler.js. All files are **optional** — if missing, the game runs silently without errors. Each file can be `.ogg` or `.mp3` (Howler will pick whichever is present). OGG is preferred for size.

## What plays when

### Music loops (`/music/`)
Ambient loops (30 s – 2 min), mixed quietly.

| File | When it plays |
|---|---|
| `island_day.ogg`   | Default overworld theme (walking the island) |
| `island_night.ogg` | Once day/night phase passes dusk |
| `castle.ogg`       | Inside GravityWrite Citadel radius |
| `forge.ogg`        | Inside Skill Forge / Open-Source Temple radius |
| `lighthouse.ogg`   | Inside Lighthouse radius |
| `library.ogg`      | Inside Library or Academy radius |

### Sound effects (`/sfx/`)
Short one-shots and continuous loops.

| File | Trigger |
|---|---|
| `footstep_grass.ogg` | Walking on grass / trees / rocks |
| `footstep_sand.ogg`  | Walking on sand |
| `interact.ogg`       | Generic zone interaction stinger |
| `type_tick.ogg`      | Typewriter tick (every 3rd character) |
| `scroll_pickup.ogg`  | Resume download confirm |
| `ocean_loop.ogg`     | Constant low-volume water/coast ambient |
| `wind_loop.ogg`      | Mixed with ocean at night |

## Current sources & licenses

Files currently shipped in this folder come from three open-source projects:

### Red Eclipse ambience pack — CC0 1.0 (public domain)
Author: **garsipal** · Source: https://github.com/redeclipse/base/discussions/1347

- `music/island_day.ogg`   ← `loop_sad.ogg`
- `music/island_night.ogg` ← `crickets_loop.ogg`
- `music/castle.ogg`       ← `ominous.ogg`
- `music/forge.ogg`        ← `garsipal_machine.ogg`
- `music/lighthouse.ogg`   ← `water_drops_reverb.ogg`
- `music/library.ogg`      ← `cold_ambience.ogg`

### Minetest Game default sounds — CC-BY-SA 3.0
Source: https://github.com/luanti-org/minetest_game/tree/master/mods/default/sounds (see the upstream `LICENSE.txt` for individual contributors)

- `sfx/footstep_grass.ogg` ← `default_grass_footstep.1.ogg`
- `sfx/footstep_sand.ogg`  ← `default_sand_footstep.1.ogg`
- `sfx/interact.ogg`       ← `default_chest_open.ogg`
- `sfx/type_tick.ogg`      ← `default_glass_footstep.ogg`
- `sfx/scroll_pickup.ogg`  ← `default_chest_close.ogg`

### Muges/ambientsounds
Source: https://github.com/Muges/ambientsounds

- `sfx/wind_loop.ogg`  ← `wind.ogg` by **felix.blume** (CC0)
- `sfx/ocean_loop.ogg` ← `stream.ogg` by **mystiscool** (CC-BY — attribution required)

## Replacing a file

Drop in any file matching the expected name. `.ogg` is preferred; `.mp3` works too. Keep source loops roughly 30 s – 2 min for music and under 1 s for footsteps / ticks — the mixer in `js/systems/audio.js` sets per-track volumes, so don't pre-attenuate at the source.

## Recommended free sources

- [freesound.org](https://freesound.org) — filter by CC0
- [opengameart.org](https://opengameart.org)
- [pixabay.com/sound-effects](https://pixabay.com/sound-effects/)
