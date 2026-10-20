# The Art of the Fade — clipper hero

## Current hero and original model

The existing hero layout, text, booking links, colors and typography are preserved.
The hero now loads **one original, project-authored clipper GLB**:
`public/models/abc-atelier-01.glb`. It is a real mesh rendered by Three.js, not a video,
image sequence, billboard or a few box/cylinder stand-ins. It is an original design
concept; it is not a downloaded branded product, scan or certified manufacturing CAD.

The reproducible generator is `script/build-atelier-clipper.mjs`. It creates the
ergonomic housing from 100 varying superellipse cross sections, a fitted curved grip
with 35 machined ribs, separate blade mounting/cutting plates, 31 fixed and 27 moving
beveled teeth, grinding lines, countersunk screws, power slider, sculpted taper lever
and an inlaid ABC monogram. Meshes are consolidated by assembly/material into 14 draw
batches (45,800 triangles). The self-contained GLB is 3,308,488 bytes and has no texture
or decoder dependencies. Its SHA256 is
`aa7188edc9ec0c888a3d027a189b6dd7eeabd4a1da00a6b0e3efce96fb1424c6`.

Asset metadata: `public/models/abc-atelier-01.asset.json`. The original mesh and
generator are provided under CC0; see `public/models/LICENSE-abc-atelier-01.txt`.
No third-party geometry or textures were used. Regenerate with:

```sh
node script/build-atelier-clipper.mjs
```

The old video/image sequence has now been removed entirely from the active hero.
On a load/WebGL failure, the fallback is the charcoal background with a text-only availability
message. It contains no image, video, substitute tool or fake 3D model. Text and the
booking link are outside the canvas and remain usable during loading/errors.

## Removed sequence and usage audit

`CinematicHero.jsx` previously imported/mounted `HeroSequenceVideo.jsx`, which rendered
`/hero-animation.mp4`, `/hero-animation-mobile.mp4` and the poster
`/hero%20animation/frame_000000.webp` with `preload="auto"`. Its play/pause/replay state
was managed in the hero. A camera wrapper scaled the video with scroll progress,
and a drift wrapper moved it with pointer springs.

`HeroSequenceCanvas.jsx` was an older, unimported alternative: 240 WebP frame URLs,
a `new Image()` queue with six concurrent requests, adaptive frame stepping, a 2D
canvas and requestAnimationFrame playback. It was not mounted by the approved page.

Both components were deleted after confirming that the video had only the hero
import and the canvas had no consumers. Their mount, video playback callbacks,
replay state, pointer drift, scroll-image scale and dedicated CSS selectors were
removed. No hero image/preload logic or CSS image background remains. Existing
headline/light scroll behavior is unchanged and does not control any images or the
new Three.js scene. The old public media assets are retained on disk; no shared
images, components or other sections were removed. `SalonTools` and `SalonChair`
remain unused and are not mounted as a substitute.

## Earlier public asset acquisition attempts — 19 October 2026

No usable third-party model was downloaded in these attempts. The current GLB was
subsequently authored locally, rather than claiming one of these downloads succeeded.
The blockers found were:

| Source | Finding / actual result |
| --- | --- |
| [Cad Crowd / ADopustim](https://www.cadcrowd.com/3d-models/hair-clipper) | Author page lists CC BY 4.0. Following its actual Download-all URL with an HTTP client returned **75,238 bytes of login HTML**, not a ZIP or model. Stored only as `tmp/clipper-asset-research/cadcrowd-login-response.html`; SHA256 `514344ec3850e7e896a41d0e09f41c367fd7d8268fcf1543df37855a0914ccb0`. This is a failed model download, not a successfully acquired asset. |
| [CGTrader / aliali25 free clipper](https://www.cgtrader.com/free-3d-models/electronics/other/hair-clipper-8b489c8e-07c9-47dc-997d-56e106fd0c15) | Browser click on **Free Download** opened a login dialog. No model downloaded; binary integrity and commercial web distribution permission could not be verified. |
| [Free3D / Electric Razor Hair Trimmer](https://free3d.com/3d-model/electric-razor-hair-trimmer-3d-model-3d-model-886379.html) | Listing specifies **Personal Use License**; rejected for the salon marketing site. |
| [CadNav / cordless clipper](https://www.cadnav.com/3d-models/model-21318.html) | Listing specifies **Non-commercial** and .max format; rejected. |
| [Sketchfab / classic clipper](https://sketchfab.com/3d-models/classic-hair-clipper-38bfbbc42a1d47fa9ceee918dbde71f0) | Viewer-only, no public download permission; viewer resources were not extracted. |
| [3DAssets.dev / clipper tool rail](https://3dassets.dev/assets/clinic-and-veterinary-practice-clipper-tool-rail-fb444d59) | CC0 direct GLB advertised, but it is a simplified 1.5k-triangle prop with multiple tools/rails/scissors. Rejected because it does not meet the requested detailed single professional clipper. |

No purchase, account creation or third-party license acceptance was performed. These
attempts are historical context; they are no longer a runtime dependency of the hero.

## Optional future replacement

To replace the original design, use a licensed, web-ready clipper model or commission a Blender artist
to model one from multiple product reference photographs. The artist should supply
real blade teeth, beveled cutting plates, housing seams, screws, lever/switch details,
and correctly authored normals and PBR textures. Model quality cannot be inferred
from the file extension or generated by the lighting code.

One candidate is [Realistic Hair Clipper on CGTrader](https://www.cgtrader.com/3d-models/electronics/other/realistic-hair-clipper),
whose listing advertises PBR and GLB/glTF formats. This asset has **not** been purchased,
downloaded, inspected or approved. Check geometry detail and permission to serve the
model in a public website, then adapt/export it to the contract below. A custom
Blender asset can follow the same contract without changing the page layout.

## Asset handoff

- Self-contained **binary glTF 2.0 (`.glb`)**, with embedded PNG/JPEG textures and
  standard glTF metallic/roughness materials. Draco, Meshopt and KTX2 decoder
  pipelines are not configured; export without those compression extensions.
- One clipper only. Root object/group: `BarberClipper`. Its descendant `Blade` must
  contain the cutting plate and modeled teeth. Do not include a ground, backdrop,
  lights, other tools or extraneous scene meshes.
- Long axis along **Y**, blade at positive Y, front face toward **+Z**. Apply transforms
  before export. Adjust `rotation` in `clipperHeroConfig.js` if the source differs.
  Geometry is centered and normalized by height on load without replacing it.
- Optional material names: `Housing_BlackMetal`, `Blade_Steel`, `Trim_Champagne`.
  These receive restrained metal/roughness/color adjustments; other authored
  materials, textures and normals are preserved. Use neutral albedo on these
  surfaces so their textures do not introduce a conflicting color cast.
- Aim for under 60k triangles, 1K texture maps and roughly 2–4 MB total after
  optimization. These are handoff targets, not enforced limits. Inspect the
  optimized teeth and bevels at the hero's actual display size.

The default model works without environment settings. For an optional replacement,
place the finished asset at `public/models/barber-clipper.glb` and add this public
asset setting to the project's `.env.local`:

```dotenv
VITE_CLIPPER_MODEL_URL=/models/barber-clipper.glb
```

Vite settings are public and resolved at build time; do not put secrets in them.
Restart Vite/Rails or rebuild after changing the setting. Removing the override uses
the original bundled model again. Node/material names and orientation live in
`app/frontend/three/clipperHeroConfig.js`.

## Scene behavior

The asset is lazy-loaded in a separate visual layer reserved on the hero's right.
A text-only loading state is shown until a prepared scene renders. No video/image
fallback exists. No new scroll or pointer-driven tool animations are introduced.

The scene uses PMREM room reflections, a broad warm key, a restrained champagne
rim and a narrow area light moving across the blade. A bounded slow rotation and
small, slow camera drift keep the clipper facing the camera and inside the fit margin.
There are 12 faint particles, reduced to 6 on compact
screens. Fit-to-height/width camera framing and CSS bounds adapt to the available
space without moving the headline or CTA. The model fades into view while turning
from a three-quarter angle over 2.4 seconds, then settles into its subtle movement.
Reduced motion skips this reveal and keeps a static composition.

Reduced motion uses a static pose and light. The existing pause control also pauses
the 3D scene. Rendering stops offscreen and in hidden tabs; resizing and state changes
render a fresh frame. Pixel ratio is capped at 1.75 desktop and 1.25 compact screens.
The separate Three.js chunk currently adds about 262 KB gzip when enabled, plus the
model download. Fetching has a 15-second timeout; bad GLB headers, mismatched declared
file length, missing JSON chunk/named nodes, empty geometry and WebGL creation/context
failures show the text-only fallback. GLTFLoader then parses and checks the actual
asset; the initial header checks alone are not full glTF conformance validation.

Unmount/error cleanup aborts fetching, cancels animation frames, disconnects the
resize observer and visibility/context listeners, and disposes geometry, materials,
textures, decoded image bitmaps, PMREM resources and the renderer/context. Shared imported
resources are disposed once across the retained and extracted scene graphs.

## Launch and checks (Ubuntu / WSL)

```sh
cd ~/saloon
bin/dev
```

Open <http://localhost:3000>. This project's `bin/dev` starts Rails; Vite's existing
auto-build integration supplies assets. For live Vite development, run `bin/vite dev`
in a second terminal. Existing database/server configuration is unchanged.

```sh
node --test test/frontend/clipperHero.test.mjs
node node_modules/vite/bin/vite.js build
bin/rails test
```

Implementation validation: **ten Node tests pass** and include loading the actual
bundled binary through GLTFLoader, checking its SHA256, mesh and triangle counts,
and normalizing its named blade/root nodes. Other checks cover
asset rejection, normalization, bounded model/camera motion, portrait fit, binary
download checks and disposal. The production build passes and reports
a large-chunk warning for the lazy Three.js chunk, and Rails reports zero tests and
zero errors. Node fixtures do not render a substitute clipper.

Browser verification now confirms the actual GLB renders (`data-clipper-status=ready`)
with one WebGL canvas, at desktop and mobile sizes. The retired videos, image sequence
and posters remain absent. Headline and booking CTA stay visible while loading.
Rails serves the real model with HTTP 200 and the expected 3,308,488-byte length.
Two paused browser captures are pixel-identical; captures taken after resuming differ,
confirming that pause freezes the live scene and play resumes real rendering.
There are no captured console errors. The Windows graphics driver emits a non-fatal
shader precision warning from Three.js' generated lighting shader; it does not prevent
the scene rendering. This is not a full network or GPU-memory profile. WebGL context
loss/error recovery has not been manually forced in the browser.

For future asset changes, verify:

1. At desktop and mobile widths, the complete clipper fits in its reserved area and
   does not overlap the headline/CTA. Check detail and reflections in the real GLB.
2. With network throttling, text/booking stay visible before the scene appears.
3. Pause/play freezes/resumes motion without a jump. A hidden tab or offscreen hero
   should stop rendering; returning should resume smoothly.
4. With reduced motion enabled before load and toggled while open, the scene stays
   static and the booking flow remains available.
5. With an invalid model URL or WebGL disabled, the text-only fallback remains usable;
   no requests for the old MP4s, WebP frames or posters should occur.
6. Repeated navigation/unmounting does not accumulate canvases or WebGL resources.
