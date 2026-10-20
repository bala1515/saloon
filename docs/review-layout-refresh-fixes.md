# Review layout and refresh fixes — 20 October 2026

- Reloads clear the old section fragment and disable native scroll restoration, returning to the cinematic hero. The initial GSAP/font refresh also holds the top until the visitor interacts. Ordinary section links and browser fragment navigation continue to work.
- Removed opposing review-column parallax so the rating summary and testimonial start on the same baseline.
- Narrowed reviewer metadata styles to the text container: the avatar retains grid centering, no top margin, and a fixed non-shrinking circle.
- Flexible grid tracks, wrapping service metadata, a non-wrapping counter, and a stacked layout below 900px prevent narrow-column collisions.
- Quote/identity layout reserves reading space and keeps controls below the reviewer; mobile typography scales down instead of inheriting the oversized 37px rule.
- Source note uses the available section width.

Validation: Vite production build passed; existing >500 kB application chunk warning remains. Actual browser tests at 1440×1000 and 320×568 verified refresh from Craft and Reviews returns to scrollY 0 with no stale fragment. Review pages 1, 4 and 6 checked; quote, caption and controls have non-overlapping bounds, avatar display is grid with zero top margin, and no horizontal overflow. No backend or asset changes.
