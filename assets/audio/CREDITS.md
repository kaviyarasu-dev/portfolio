# Audio assets

The game loads audio files from here via Howler.js. All files are **optional** — if missing, the game runs silently without errors. Drop in any CC0 / OGA-BY licensed files matching these names.

Each file can be either `.ogg` **or** `.mp3` (Howler will pick whichever is present). OGG is preferred for size + Firefox compatibility.

## Music loops (`/music/`)

Long loops, 60–120 seconds, ambient. ~200 KB each at OGG Q3.

| File | When it plays |
|---|---|
| `island_day.ogg`    | Default overworld theme (walking the island) |
| `island_night.ogg`  | Swaps in once day/night phase >= dusk (Phase C1) |
| `castle.ogg`        | Inside GravityWrite Castle dialogue radius |
| `forge.ogg`         | Inside Skill Forge radius |
| `lighthouse.ogg`    | Inside Lighthouse / near sea |
| `library.ogg`       | Inside Library or Academy |

## Sound effects (`/sfx/`)

Short, one-shot. 10–40 KB each.

| File | Trigger |
|---|---|
| `footstep_grass.ogg`  | Walking on grass / tree / rock tiles |
| `footstep_sand.ogg`   | Walking on sand |
| `footstep_path.ogg`   | Walking on cobble paths |
| `interact.ogg`        | Generic zone interaction stinger |
| `type_tick.ogg`       | Typewriter tick (every 3rd character) |
| `scroll_pickup.ogg`   | Resume download confirm |
| `ocean_loop.ogg`      | Constant low-volume ocean ambient |
| `wind_loop.ogg`       | Mixed with ocean at night |

## Recommended sources (license-safe)

- [freesound.org](https://freesound.org) — filter by CC0
- [opengameart.org](https://opengameart.org)
- [pixabay.com/sound-effects](https://pixabay.com/sound-effects/)

## Volume guidelines

The audio module already sets per-track volumes in `js/systems/audio.js`. If an export is too hot, trim it at the source — don't fight the mixer.
