# The Office — plan

A 3D version of my real office that doubles as my résumé. Inspired by
felixrieseberg.com (the desk computer as the entry point, a fixed viewpoint
you look around from), but the room, the objects and what they unlock should
say something about me specifically: music teacher turned SRE, outdoors
person, reader, builder of side projects.

Reference photos live in `/photos` (gitignored, never committed).

## Controls

- The camera stands at a **fixed point in the center of the room** at eye
  height. Click-drag or touch-drag rotates the view around that point (yaw
  360°, clamped pitch). There is no walking.
- Hovering an interactive object highlights it. Clicking it flies the camera
  to that object's focus pose and opens its card, link or embed. `Esc`, a back
  button, or a click on empty space flies back to center.
- The same input works on desktop and mobile. No keyboard is required.

## The room, mapped to stations

The desk wall is "north" (`-z`).

| Where | Object | Does |
| --- | --- | --- |
| North wall | Standing desk, monitors, laptops | **Computer**: terminal "OS" with résumé, work history, contact |
| Desk | Split keyboard | Links to [this Primeagen post](https://x.com/ThePrimeagen/status/1952838755288793106) |
| Wall behind desk | Posters and pictures (replacing the mounted backpacks) | **Photo wall**: accomplishments and photos I'm proud of, plus a cartoon "Code Cop" poster that is obviously Prime |
| Left of desk | Yeti cooler | Links to [birchwood.lol](https://birchwood.lol), my recipe site |
| Right of desk | Big Monstera plant (replaces the tent pile) | Decor |
| Floor | Red/navy patterned rug | Decor |
| Behind the chair | Bookshelves (a modest number of books) | **Library**: book spines for things I've learned and recommend |
| Bookshelf | Lava lamp | Nod to Cloudflare's LavaRand lava lamp wall |
| Bookshelf | Record player + records on the bottom shelf | **Records**: Spotify embed player |
| Back corner by the bookshelf | Blonde Epiphone Casino on a stand | [My college band on SoundCloud](https://soundcloud.com/noticing-icarus-363880582), noting that I was one of the songwriters |
| Gear corner | Ice axes, packs, boots, skis, bikes | **Biggest climbs at work**: the hardest things I've shipped (cutting ~50k LOC, seven services down to two, co-founding the SRE practice) |
| Wall | Topo map of the **Chugach Mountains, Alaska** | **Career journey**: pins from music → bootcamp → curriculum dev → Radiance → SRE |
| Corner | Drum practice pad | Easter egg about my music-teaching past; plays a rudiment |
| Doorway | Door, "5261-NY" plate | Leads to a **bikepacking mini-game**: eat or you bonk. Design TBD. |
| Closet | Gear bins | TBD |
| Lights | LED strip / lamp | Day/night toggle |

Room size: about 12 × 12 ft with an 8 ft ceiling (3.66 × 3.66 × 2.44 m).

## Game layer

- **Quest log**: "Explore the office — n/N found". Finding everything unlocks
  a closing card with contact links.
- An always-visible **"Skip to résumé"** link to
  [brandonapol/resume](https://github.com/brandonapol/resume), and eventually a
  plain HTML résumé page in this site.

## Tech

- **Vite + vanilla three.js**. UI is plain HTML/CSS overlays on top of the
  canvas, so text is selectable and links are real.
- **Content lives in data**: one content module (résumé, projects, links,
  photo wall, stations) that the scene reads. A résumé update never touches 3D
  code.
- **One interaction system**: each station registers a mesh, a camera focus
  pose and an action (card, link, or embed). Adding a station is mostly data.
- **Embeds**: the Spotify and SoundCloud iframe players need no API keys.
  Load them lazily, only after a click.
- **Models**: stylized low-poly. Primitives in code first, CC0 kits (Kenney,
  Poly Pizza) for filler props, Blender or image-to-3D for hero props. GLB +
  meshopt + KTX2, under about 5 MB before the first interaction.
- **Performance**: if things get heavy, fix the assets first (compression,
  instancing, baked lighting). Rust/WASM only if profiling shows the CPU side
  is the bottleneck, which is unlikely for a room like this.
- **Hosting**: GitHub Pages via `.github/workflows/pages.yml`, deploying
  `site/dist` at www.brandonapol.dev.

## Status

- **v0 (live):** room shell, desk and monitor, WASD capsule character, `E`
  zooms into a terminal overlay. The WASD controls get replaced by the
  fixed-center camera.
- Everything else is tracked in GitHub issues.

## Open questions

- Which Spotify playlist or album goes in the records?
- The list of accomplishments and photos for the photo wall.
