# Animation reference analysis

References supplied by the user:
- WhatsApp Video 2026-10-19 at 9.48.50 AM.mp4 — 10 seconds, 720 × 1280.
- WhatsApp Video 2026-10-19 at 9.48.49 AM.mp4 — 10 seconds, 720 × 1280.

Inspected ten timestamped frames from each clip using the built-in Windows media decoder. Both videos show a laptop displaying a salon website in an interior scene. The visible websites stay largely on their hero sections; the clips do not demonstrate a complete scroll sequence, a rotating 3D object, or service-to-booking interactions.

The first reference uses charcoal backgrounds, black leather chairs, warm brass/gold lighting, a left-aligned heading, and photographic depth. The second uses a full-width salon interior, centred serif branding, warm neutral colours, and a light services section below. Small camera/hand movements are visible; exact animation easing and trigger mechanics cannot be recovered from these clips.

Implementation direction: original photographic salon scene, charcoal/champagne palette, oversized ABC Salon branding, a restrained 24-second camera drift, pointer parallax, and a short scroll-linked camera push. The hero keeps branding and animation only. Services use a warm neutral background and editorial type. Reduced-motion and manual pause disable movement. This is photographic parallax, not a fully navigable 3D room.

The old isolated blue chair is no longer loaded by the page. Its source is retained as an unused previous experiment.

## Original hero asset

- Asset: app/frontend/assets/salon-cinematic.png
- Generator: built-in image_gen tool.
- Style reference: a decoded frame from the first supplied video.
- Final prompt: Create an original photorealistic widescreen cinematic salon interior photograph to use as a full-bleed website hero background, 16:9 landscape. Reference image is a STYLE REFERENCE ONLY: capture its black and warm-gold salon atmosphere; do not reproduce the laptop, hands, website UI, text or layout. Camera is inside the actual salon, eye-level slightly low 28mm architectural photograph. An elegant black leather hydraulic barber chair with realistic brushed chrome base is the focal point on the RIGHT THIRD, with a second chair further behind; tall softly glowing arched brass-framed mirrors, fluted dark wood and charcoal plaster walls, subtle black marble counter, tidy grooming tools. Salon should feel refined and plausible in a modern Indian city. Keep the LEFT HALF dark and uncluttered with deep cinematic negative space for white brand lettering added later by HTML. Warm champagne practical lighting, gentle volumetric light rays, deep charcoal shadows with readable detail, natural realistic material texture, editorial luxury photo, photographic not primitive 3D. Scene extends fully to every edge, no border. No people, no laptops, no screens, no text, no branding, no watermarks. Return a clean standalone room photograph, not a mockup of a website.
