# The Office — plan

A walkable 3D version of my real office that doubles as my résumé. Inspired by
felixrieseberg.com (the desk computer as the entry point), but the room, the
objects and what they unlock should say something about me specifically: music
teacher turned SRE, outdoors person, reader, builder of side projects.

Reference photos live in `/photos` (gitignored, never committed).

## The real room, mapped to the game

Looking at the desk wall, which is "north" in the scene (`-z`):

| Where | Real object | In-game station | What it unlocks |
| --- | --- | --- | --- |
| North wall | Standing desk, window + blinds, vertical + main monitor, two laptops, Zero to One, the little bust, purple LED | **The computer** | Terminal / desktop "OS": résumé, work history, contact. The main entry point. |
| Behind the chair | Two bookshelves, lava lamp, hats, globe | **Library** | Clickable book spines: things I've learned, talks, writing, recommended reads |
| Gear corner | Ice axes, packs, boots on crates, skis, two bikes | **Gear wall** | "Side quests": outdoors life, plus the hardest climbs at work (e.g. cutting ~50k LOC, seven services down to two, starting the SRE practice) |
| Walls | Starry Night, Great Wave, landscape painting, topo map | **Photo wall** | Accomplishments and photos I'm proud of. The topo map becomes a career-journey map with pins (music → bootcamp → curriculum dev → Radiance → SRE) |
| Corner | Drum practice pad on stand | **Practice pad** | Easter egg about my music-teaching past. Press E and it plays a rudiment. |
| Doorway | Door, "5261-NY" plate, hallway | **Exit / portals** | Links out to sites I run: autobutler.org, birchwood.lol, Quark, VibeCheck, GitHub, LinkedIn |
| Closet | Storage bins | **Project crates** (optional) | Each bin is a project with a short card |
| Lights | LED strip / ring light / lamp | **Light switch** | Day/night toggle (the two desk photos are basically day and night) |

## Game layer

- WASD / arrow keys to walk, `E` to interact, `Esc` to back out. Clicking or
  tapping an object also works.
- Third-person "dollhouse" camera: walls facing the camera cull away
  automatically.
- A small quest log: "Explore the office — 0/6 found". Finding everything
  unlocks a closing card with a contact CTA. It gives people a reason to see
  everything without making the content hard to get to.
- An always-visible **"Skip to résumé"** link that goes to a plain HTML page.
  Recruiters in a hurry, no-WebGL browsers and screen readers all need it.

## Tech

- **Vite + vanilla three.js**, no framework. The UI overlays are plain HTML/CSS
  on top of the canvas, which keeps text selectable, links real and the page
  accessible.
- **Content lives in data, not in the scene**: one `content.js`/JSON for
  résumé, projects, links and photo-wall entries, so a résumé update never
  touches 3D code.
- **Models**: stylized low-poly, not photoreal. It hides the mess, stays
  small, and ages better. Sources, roughly in order of preference:
  1. Simple primitives built in code (what v0 does) for furniture.
  2. CC0 kits (Kenney Furniture Kit, Poly Pizza) for filler props.
  3. Blender or image-to-3D for hero props that should really look like mine:
     the split keyboard, ice axes, bikes, the bust.
  Export as GLB with meshopt compression and KTX2 textures. Budget: under
  about 5 MB before the first interaction, with the rest lazy-loaded.
- **Photo wall images** are curated and committed on purpose, separately from
  the reference photos (resized WebP, under 200 KB each).
- **Character**: swap the capsule for a rigged low-poly character with
  idle/walk animations (Mixamo or a Kenney character), ideally styled to look
  a bit like me.
- **Hosting**: GitHub Pages via `.github/workflows/pages.yml`. It builds
  `site/` and deploys `site/dist` on every push to `main` that touches `site/`.
  The custom domain is www.brandonapol.dev.

## Phases

0. **Done.** Room shell, desk, one monitor, WASD character with collision,
   `E` zooms into the screen and opens a terminal overlay with links, plus the
   Pages deploy.
1. **Room fidelity.** Real measurements, window with blinds, door, closet,
   chair, LED strip, lamp; collision for everything; a real character model.
2. **The computer.** A terminal that accepts commands (`ls projects`,
   `cat resume`, `open autobutler`) or a small desktop with windows, driven by
   the content file.
3. **Stations.** Library, gear wall, photo wall, practice pad, doorway, each
   with an E-interaction and an overlay card.
4. **Polish.** Sound (keyboard clacks, drum pad, room tone), day/night toggle,
   quest log, mobile joystick or tap-to-walk, skip-to-résumé page, OG image,
   loading screen.

## Open questions

- Style: stylized low-poly (recommended) vs. a phone-scanned Gaussian splat of
  the real room (very cool, but interaction and collision are harder and the
  mess shows).
- Camera: keep the dollhouse third-person view, or go first-person?
- Should the avatar be me?
- Real room dimensions. The scene uses a guess of 4.2 × 3.6 m.
- Which accomplishments and photos go on the photo wall?
