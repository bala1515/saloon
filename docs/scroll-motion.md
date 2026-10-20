# ABC Salon: continuous depth and scroll direction

This revision replaces the previous Craft pin, Studio GSAP pin and horizontal portfolio pin with continuous parallax. The service carousel remains the only ScrollTrigger pin. The page keeps native scroll, anchor links, the original GLBs, paper opening, booking form and existing service/review functionality.

## References actually inspected

- [Campo Santo / Firewatch](https://www.firewatchgame.com/): viewed before and after scrolling, and inspected its nine different layer speeds. Applied the principle of distinct foreground, middle and background travel.
- [Illoca / Unseen](https://illoca.unseen.co/): viewed its illustrated scene after scrolling from the opening. Inspired the move from a framed image into an immersive scene.
- [A24 concept / Ravi Klaassens](https://a24.raviklaassens.com/): viewed overlapping discs at different scroll positions. Inspired separated depth and perspective rather than a uniform image slider.
- [GSAP showcase](https://gsap.com/showcase/) and [ScrollTrigger documentation](https://gsap.com/docs/v3/Plugins/ScrollTrigger/): reference discovery and lifecycle/scrub guidance.

No reference code, photography, models or branding was copied into this project.

## Choreography

1. Hero: a short native sticky hold; GSAP sends progress to the existing Three.js scene. The camera dollies and tracks the clipper's screen anchor, the clipper turns toward the lens, and scissors/particles recede at different rates. The headline moves less than the objects and the CTA remains readable. Opening and idle clocks remain independent.
2. Craft: flowing text and numbered steps. Background outline lettering travels slowly; the portrait travels farther; a smaller tools photograph crosses in the foreground. Images move independently inside oversized clipped frames. The detail uses the existing editorial photo, not a new claimed client asset.
3. Studio: ivory side masks open onto the full-width studio photograph. A native sticky stage holds the backdrop while large foreground typography passes upward and the story scrolls over it. A controlled scrim protects contrast. No GSAP pin or artificial extra scroll spacer.
4. Portfolio: vertical editorial composition with unequal photo travel, shallow perspective rotation, internal image movement and a slower background word. No horizontal scroll lock.
5. Reviews/booking: modest offset movement for copy and review columns; form controls, contact information and opening hours remain stable.

## Responsive and accessibility behavior

Desktop choreography requires at least 901px width and 680px height. Compact screens use shorter translations, no floating detail print, no studio sticky scene and natural stacked content. The compact matchMedia condition explicitly covers both narrow and short windows.

Reduced motion skips all page GSAP effects and retains the original static layout. Decorative layers are aria-hidden. SplitText supplies the original heading label including spaces at line breaks. MatchMedia contexts, SplitText wrappers, observers and the Three.js scroll event listener are reverted on cleanup. Oversized photographs reserve enough height for the full parallax range.

## Files

- app/frontend/animations/useSalonScroll.js — scene choreography and responsive cleanup
- app/frontend/animations/salonScroll.css — layered layouts, overscan and compact/static fallbacks
- app/frontend/components/EditorialSections.jsx — decorative layers and native studio wrappers
- app/frontend/components/ClipperHeroScene.jsx — scroll camera tracking and separate tool/particle depth
- app/frontend/three/heroToolComposition.js — bounded camera path
- test/frontend/heroScissors.test.mjs — camera bounds and compact-motion regression checks

## Verification, 20 October 2026

- 22 Node tests pass, including actual GLB integrity/GLTFLoader checks, scissors articulation, paper opening and bounded scroll camera movement.
- Vite production build passes. Existing >500 kB JS chunk warnings remain (application and lazy Three scene).
- Actual localhost page inspected at desktop 1440×1000 and compact 390×844. Screenshots include the studio and gallery.
- Browser observations: one WebGL canvas, one service pin, no horizontal overflow, no console warnings/errors in the checked session.
- Real camera distance changed from approximately 8.94 to 7.00 as scroll progress reached 0.81.
- Mobile service filtering produced three Hair services; Book Service reached #book at about 28px from the viewport top, selected Haircut & styling, and kept the form fully visible.
- Fixed issues found in preview: GSAP's decomposition of the hero percentage translate displaced the headline; compact matchMedia needed an explicit matching condition.
- Reduced-motion handling is implemented and reviewed in source; the available browser controls did not expose reduced-motion emulation. No physical-device FPS measurement was performed.

## Local preview

Keep the existing Rails/Vite development workflow. Open http://localhost:3000/#top and refresh, let the paper opening finish, then scroll through Craft, Studio, gallery and booking. Scroll backward too: all parallax is reversible.

Run checks in the project:
```sh
node --test test/frontend/clipperHero.test.mjs test/frontend/heroScissors.test.mjs test/frontend/salonOpening.test.mjs
node node_modules/vite/bin/vite.js build
```

