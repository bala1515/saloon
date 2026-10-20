# ABC Salon: fresh cuts, good energy

The page uses the supplied palette: teal #0A7C6E, amber #F59E0B, coral #FF6B35 and off-white #FAFAFA. Bold Manrope headings replace the thin luxury serif treatment; DM Sans carries readable service descriptions and business details.

## Visitor journey

1. ABC Salon hero: immediate Sivakasi location, service and visit links, the existing real clipper/scissors models in one canvas, an amber graphic backdrop and a pause control.
2. Service menu: all seven services in normal document flow, with category filters and a telephone link. No invented pricing.
3. Style inspiration: asymmetric editorial photographs, clearly identified as reference imagery rather than client results.
4. Salon story: a brief neighbourhood introduction with an explicitly labelled interior concept and direct call link.
5. Reviews: amber source summary, stable review text, manual pagination and source attribution retained.
6. Visit: address, direct phone link, directions and daily opening hours.

## Motion

No portal transition or opening curtain is mounted in this page. Phones now use the short pinned photo reel described below; other sections stay in normal flow. The old model assets and unused Craft scene are retained for possible reuse. The hero camera and amber orbit respond gently to native scrolling. Editorial images settle from 1.09 scale to 1 as they enter, and heading rules draw once. Body text is never hidden or moved by scroll. Reduced motion bypasses these effects and freezes tool idle motion; the existing scene cleanup is retained.

The GLB scene stays lazy-loaded. Its existing roughly 880 kB bundle still produces Vite's chunk-size advisory; a production build succeeds. The interior concept remains a large existing image. Real salon photography would improve authenticity before a client launch.

Validation: existing 25 frontend model/composition tests pass. Actual localhost browser inspected at 1440x1000, 390x844 and 320x568; both models render, image loads succeed, mobile navigation closes after selection, service filtering and review navigation work, and no horizontal overflow was observed. Browser console had no errors during these checks. No deployment performed.

## GSAP and pointer enhancements

The existing design now includes a pointer-follow hero light/ring graphic, bounded cursor-driven clipper/scissor rotations in the existing shared renderer, subtle perspective on editorial photos with floating descriptive labels, a cursor-position service highlight and small graphic/arrow accents. These pointer effects use the native cursor and activate only for hover-capable fine pointers with no reduced-motion preference. Category-filtered rows retain highlights through delegated pointer handling. Hero pause also resets its pointer lighting/tilt.

ScrollTrigger additionally controls the studio image framing reveal, the coral craft-mark rotation and the service-menu gold rule. All scrolling stays native and text remains visible. MatchMedia and effect cleanup remove listeners, observers, pointer state and GSAP transforms. Pointer motion has no continuous standalone requestAnimationFrame loop.

Validation for this addition: production build passes with the existing lazy Three.js chunk-size warning; all 25 existing frontend tests pass. Actual desktop browser checks confirmed pointer light position, pause reset, photo perspective/label, service hover highlight and console without errors. Responsive layout checked at 390 pixels; coarse-pointer and OS reduced-motion behavior are guarded in code, not browser-emulated.

## Responsive scroll choreography

Phone viewports up to 760px wide and at least 560px tall get a dedicated ScrollTrigger image reel. The first full-width photograph holds briefly while the second wipes in horizontally; a coral progress rule follows scroll, and captions fade between readable endpoints. The pin lasts 85% of one viewport height, supports reverse scrolling, and releases into the salon story. The cue is inside the pinned visual. Short landscape screens, tablets and desktop retain normal gallery flow; reduced motion retains both photos without pinning or masks.

The mobile hero now has a stronger bounded tool turn/dolly and an earlier scroll endpoint so its movement occurs while the tools are visible. Its amber backdrop contracts and rotates on scroll. The service panel expands from narrow side gutters, and the studio image opens from a narrower crop on phones. Body text remains in document flow. Service-menu ResizeObserver refreshes downstream triggers after category filtering. GSAP matchMedia removes the pin, classes and transforms when crossing breakpoints.

Validation: Vite build and 25 model tests pass. Actual 390px browser scrolling verified intermediate and completed photo masks, visible progress, readable final captions, reverse scrolling and transition to desktop with zero remaining pin spacers. Short-screen and 320px layouts were also checked. This is viewport browser validation, not physical phone performance measurement.
