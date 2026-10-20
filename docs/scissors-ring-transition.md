# Scissors ring transition — 20 October 2026

The user's current pinned Craft section and its three-line statement are retained. The end of that sequence now straightens the existing GLB scissors, aims the camera at the right finger opening, and moves the camera through that opening into the Studio section.

## Rendering and handoff

- Asset: public/models/abc-atelier-shears-01.glb, the existing original CC0 model. No replacement model or downloaded asset.
- craftPortal.js uses coordinates from the model's original generator to locate the inside of the finger insert.
- The camera first removes the scissors tilt, then aligns to the ring, then approaches exponentially and crosses the ring plane.
- The Studio preview is a DOM photograph clipped to 64 projected points from the real moving ring aperture. The metal still renders in Three.js in front of it. This is a projected aperture composite, not a new modeled 3D interior.
- The preview and actual Studio intro share the same asset, crop, viewport dimensions and title styling.
- Studio overlaps the last viewport of the Craft pin. The Craft shell becomes transparent only after the aperture surrounds the viewport, so the real section takes over at the same location.
- Reverse scrolling restores the complete sequence. Completed Craft no longer intercepts pointer input over Studio.

## Responsive and resource handling

Section 2 uses Cormorant Garamond with lighter weight and sentence-case copy. Compact screens place the statement in the top area and the model below it. The full portal sequence runs on phones.

The Craft module is lazy-loaded behind a stable animation wrapper so delayed JS does not cause GSAP to miss its target. Rendering stops offscreen/when the document is hidden; pixel ratio is capped at 1.25 on compact screens and 1.75 on desktop. Reduced motion shows the static composition without a fly-through. Fetches are aborted on unmount; GLTF resources, PMREM, listeners, observers and renderer are released. A failed WebGL/model load uses a plain studio dissolve.

## Changed source files

- app/frontend/components/CraftScissorsScene.jsx
- app/frontend/components/EditorialSections.jsx
- app/frontend/three/craftPortal.js
- app/frontend/animations/useSalonScroll.js
- app/frontend/animations/salonScroll.css
- app/frontend/entrypoints/salon.css
- test/frontend/craftPortal.test.mjs

## Checks

25 Node tests passed:
- actual GLBs load and match their integrity metadata;
- rays through the aperture coordinates miss the actual metal and rubber geometry;
- the projected opening encloses all four screen corners before the camera crosses its plane, at six portrait/landscape aspects;
- straighten/aim/approach/pass ordering, finite camera distances and bounds;
- existing clipper, articulation and paper-opening regression tests.

Vite production build passed. The application chunk is about 543 kB and still produces the existing >500 kB warning. Lazy-loading keeps the Craft/WebGL rendering implementation out of the main application bundle.

Actual localhost browser checks:
- Desktop viewport 1440×1000: typography, straightening, ring targeting, studio inside the hole, full handoff.
- Phone viewports 390×844 and 320×568: statement fit, full portal, zero horizontal overflow.
- Reverse scrolling from Studio restores the ring and scissors.
- No application console errors observed. One existing ANGLE shader precision warning was reported during the desktop WebGL compile.
- Reduced-motion behavior is implemented but browser emulation and physical-device FPS were not measured.

Commands:
```sh
node --test test/frontend/craftPortal.test.mjs test/frontend/clipperHero.test.mjs test/frontend/heroScissors.test.mjs test/frontend/salonOpening.test.mjs
node node_modules/vite/bin/vite.js build
```

Open http://localhost:3000/#top, refresh, then scroll into Craft and through its last phase to Studio. The #craft anchor starts near the beginning of the held sequence.

