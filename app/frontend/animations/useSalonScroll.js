import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { craftPortalFrame } from '../three/craftPortal.js'

gsap.registerPlugin(ScrollTrigger)

// Mobile address-bar resize should not kill our scroll triggers.
ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true })

/**
 * Premium scroll experience — OnePlus-style momentum with visible mobile effects.
 * Desktop: full depth parallax + pinned studio lens.
 * Mobile: bold clip-path reveals, strong y-travel, momentum scrub.
 */
export default function useSalonScroll() {
  useLayoutEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    // A browser reload always restarts the cinematic introduction. In-page
    // navigation still uses fragments, without restoring a pinned scroll offset.
    const reloadAtHero = performance.getEntriesByType('navigation')[0]?.type === 'reload'
    const previousRestoration = window.history.scrollRestoration
    if (reloadAtHero) {
      window.history.scrollRestoration = 'manual'
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    const media = gsap.matchMedia()
    let refreshFrame = 0, disposed = false
    let userInteracted = false, initialAnchorPending = true
    const markInteraction = () => { userInteracted = true }
    window.addEventListener('wheel', markInteraction, { passive: true })
    window.addEventListener('touchstart', markInteraction, { passive: true })
    window.addEventListener('keydown', markInteraction)
    const navigateToHash = (hash, behavior = 'smooth') => {
      const id = hash.slice(1), target = document.getElementById(id)
      if (!target) return
      const craftTrigger = ScrollTrigger.getById('craft-ring-portal')
      const top = id === 'top' ? 0 : id === 'craft' && craftTrigger
        ? craftTrigger.start : target.getBoundingClientRect().top + window.scrollY - 28
      ScrollTrigger.getAll().forEach(trigger => trigger.getTween(true)?.kill?.())
      window.scrollTo({ top: Math.max(0, top), behavior })
    }
    const anchors = event => {
      const link = event.target.closest('a[href^="#"]:not(.skip)')
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const hash = link.getAttribute('href')
      if (!document.getElementById(hash.slice(1))) return
      event.preventDefault()
      userInteracted = true
      if (window.location.hash !== hash) window.history.pushState(null, '', hash)
      navigateToHash(hash, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')
    }
    const hashChange = () => {
      userInteracted = true
      if (document.getElementById(window.location.hash.slice(1))) navigateToHash(window.location.hash, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth')
    }
    root.addEventListener('click', anchors)
    window.addEventListener('hashchange', hashChange)
    const refresh = () => {
      cancelAnimationFrame(refreshFrame)
      refreshFrame = requestAnimationFrame(() => {
        if (!disposed) {
          ScrollTrigger.sort(); ScrollTrigger.refresh()
          if (reloadAtHero && !userInteracted) window.scrollTo({ top: 0, behavior: 'instant' })
          if (initialAnchorPending) {
            initialAnchorPending = false
            if (!userInteracted && window.location.hash) navigateToHash(window.location.hash, 'instant')
          }
        }
      })
    }

    media.add({
      desktop: '(min-width: 901px) and (min-height: 680px)',
      compact: '(max-width: 900px), (max-height: 679px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, context => {
      const { desktop, reduced } = context.conditions
      root.dataset.scrollMotion = reduced ? 'reduced' : 'active'
      root.dataset.scrollLayout = desktop ? 'desktop' : 'compact'
      if (reduced) {
        gsap.set('.craft-line-1, .craft-line-2, .craft-line-3, .craft-scissors-layer, .craft-top-bar, .craft-bottom-bar', {
          opacity: 1,
          yPercent: 0,
          scale: 1,
          rotation: 0,
          y: 0,
        })
        return
      }
      const q = gsap.utils.selector(root)

      // Mobile travels at 55% of desktop (was 35% — now clearly visible on phone).
      const span = desktop ? 1 : .55
      // Momentum scrub: desktop snappy, mobile smooth (feels like you're pulling content).
      const SCRUB = desktop ? .55 : .6

      const move = (target, from, to, trigger, start = 'top bottom', end = 'bottom top', scrub = SCRUB) => {
        const els = q(target)
        if (!els.length) return
        return gsap.fromTo(els, from, { ...to, ease: 'none',
          scrollTrigger: { trigger: q(trigger)[0] || q(target)[0], start, end, scrub, invalidateOnRefresh: true } })
      }

      /* ─── SECTION 1 -> SECTION 2 CURTAIN OVERLAY REVEAL ─── */
      const heroShell = q('#top')[0]
      const craftSec = q('#craft')[0]
      const studioSec = q('#studio')[0]
      const portal = { progress: 0 }
      const sendPortal = () => {
        if (!craftSec) return
        craftSec.dataset.portalProgress = portal.progress.toFixed(5)
        craftSec.dataset.portalComplete = String(portal.progress >= .99999)
        craftSec.style.setProperty('--craft-shell-opacity', 1 - craftPortalFrame(portal.progress).handoff)
        craftSec.dispatchEvent(new CustomEvent('salon:craft-portal', { detail: { progress: portal.progress } }))
      }

      if (heroShell && craftSec) {
        studioSec?.classList.add('has-ring-entry')
        // Pin Section 1 in place while user scrolls through the fade transition
        // Section 1 stays firmly in place (no receding/scaling backwards)
        ScrollTrigger.create({
          trigger: heroShell,
          start: 'top top',
          end: '+=100%',
          pin: heroShell,
          pinSpacing: false,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        })

        // Pure black fade: dissolves hero into black ONLY when scrolling down
        const veil = q('.hero-scroll-veil')[0]
        if (veil) {
          gsap.fromTo(veil,
            { opacity: 0 },
            {
              opacity: 1,
              ease: 'power1.inOut',
              scrollTrigger: {
                trigger: craftSec,
                start: 'top bottom',
                end: 'top top',
                scrub: true,
                invalidateOnRefresh: true,
              }
            }
          )
        }

        // Dynamic feather that fades in ONLY when scrolling starts (0% opacity at scroll 0)
        const feather = q('.craft-scroll-feather')[0]
        if (feather) {
          gsap.fromTo(feather,
            { opacity: 0 },
            {
              opacity: 1,
              ease: 'power1.out',
              scrollTrigger: {
                trigger: craftSec,
                start: 'top bottom',
                end: 'top 80%',
                scrub: true,
                invalidateOnRefresh: true,
              }
            }
          )
        }

        // Section 2 initial state: completely hidden and positioned inside line masks
        gsap.set('.craft-line-1, .craft-line-2, .craft-line-3', { yPercent: 110, opacity: 0 })
        gsap.set('.craft-line-1', { yPercent: 18, opacity: .3 })
        gsap.set('.craft-scissors-layer', { scale: 0.6, opacity: 0, rotation: -18 })
        gsap.set('.craft-top-bar, .craft-bottom-bar', { opacity: 0, y: 12 })

        // Section 2 Pinned Scrollytelling Sequence:
        // Section 2 locks full screen. Section 3 is held completely off screen.
        // Scroll progression:
        // 1. Black is full screen. First text line appears ("SHARPEN THE CRAFT").
        // 2. Scroll further: Second line ("SHAPE THE VISION") + 3D Scissors appear.
        // 3. Scroll further: Third line ("CUT BEYOND") appears.
        // 4. Straighten, align to the finger hole, pass through, then release to Section 3.
        const craftTl = gsap.timeline({
          scrollTrigger: {
            trigger: craftSec,
            start: 'top top',
            id: 'craft-ring-portal',
            end: desktop ? '+=290%' : '+=270%',
            pin: true,
            scrub: desktop ? .65 : .55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onLeave: self => {
              // Release must finish with the physical pin; scrub lag otherwise
              // leaves a shifted copy of the studio over its real photograph.
              craftSec.dataset.portalReleased = 'true'
              self.getTween()?.progress?.(1)
              portal.progress = 1; sendPortal()
            },
            onEnterBack: () => { craftSec.dataset.portalReleased = 'false' },
            onRefresh: self => { craftSec.dataset.portalReleased = String(self.progress === 1) },
          }
        })

        craftTl
          // Micro-bars fade in at the start of Section 2 lock
          .to('.craft-top-bar, .craft-bottom-bar', {
            opacity: 1,
            y: 0,
            duration: 0.35,
            ease: 'power2.out',
          }, 0)

          // Step 1: First line reveals ("SHARPEN THE CRAFT")
          .to('.craft-line-1', {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
          }, 0)

          // Step 2: Second line reveals ("SHAPE THE VISION") + 3D Scissors appears
          .to('.craft-line-2', {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
          }, 1.0)
          .to('.craft-scissors-layer', {
            scale: 1,
            opacity: 1,
            rotation: 0,
            duration: 0.95,
            ease: 'power2.out',
          }, 1.0)

          // Step 3: Third line reveals ("CUT BEYOND")
          .to('.craft-line-3', {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
          }, 2.0)

          // Hold the complete statement, then transfer control to the actual 3D camera.
          .to({}, { duration: 0.45 })
          .to('.craft-statement-container, .craft-top-bar, .craft-bottom-bar', {
            opacity: 0, duration: .45, ease: 'power1.inOut',
          }, 3.4)
          .to('.craft-scroll-feather', { opacity: 0, duration: .35 }, 3.4)
          .to(portal, { progress: 1, duration: 3.1, ease: 'none', onUpdate: sendPortal }, 3.4)
      }

      /* ─── STUDIO SECTION ─── */
      if (desktop) {
        // Desktop: pinned aperture lens open + floating depth title.
        gsap.set('.studio-aperture-left, .studio-aperture-right', { scaleX: 0 })
        move('.studio-image img', { yPercent: 0, scale: 1 }, { yPercent: -3, scale: 1.08 }, '#studio', 'top top', 'bottom top', .6)
        const story = gsap.timeline({ scrollTrigger: {
          trigger: '#studio', start: 'top top', end: 'bottom bottom', scrub: .65, invalidateOnRefresh: true,
        } })
        story
          .fromTo('.studio-depth-title', { y: 0, xPercent: 0, scale: 1 }, { y: () => -innerHeight * .34, xPercent: 7, scale: 1.08, duration: 1, ease: 'none' }, 0)
          .to('.studio-depth-title', { opacity: 0, duration: .35 }, .42)
          .fromTo('.studio-scrim', { opacity: 0 }, { opacity: 1, duration: .8, ease: 'none' }, .1)
        move('.studio-copy', { y: 55 }, { y: -35 }, '.studio-story', 'top bottom', 'bottom bottom')
      } else {
        // Mobile: image zooms out as you scroll past, text slides up from below.
        move('.studio-image img', { yPercent: 0, scale: 1 }, { yPercent: -3, scale: 1.08 }, '.studio-section', 'top top', 'bottom top', .6)
        move('.studio-copy', { y: 35 }, { y: -20 }, '.studio-section', 'top 80%', 'bottom bottom', .6)
      }

      /* ─── TRANSFORMATIONS / GALLERY ─── */
      move('.portfolio-depth-word', { xPercent: 8 }, { xPercent: -24 }, '#transformations', 'top bottom', 'bottom top', .8)
      // Pin the existing Studio at its last readable viewport. Animate its
      // original composition, including the story, rather than a second image.
      const composition = q('.studio-composition')[0]
      if (composition && studioSec) {
        const aperture = (closed = false) => {
          const height = composition.offsetHeight
          const viewport = Math.min(innerHeight, height)
          const center = height - viewport / 2
          const half = closed ? 1 : viewport / 2
          return `inset(${(center - half) / height * 100}% ${closed ? 7 : 0}% ${(height - center - half) / height * 100}% ${closed ? 7 : 0}%)`
        }
        gsap.set(composition, { transformOrigin: '50% calc(100% - 50svh)' })
        gsap.timeline({
          onUpdate() { if (this.scrollTrigger?.progress === 0) composition.style.clipPath = 'none' },
          scrollTrigger: {
          id: 'studio-gallery-cut', trigger: studioSec, start: 'bottom bottom',
          onLeaveBack: self => { self.getTween()?.progress?.(1); composition.style.clipPath = 'none' },
          onRefresh: self => { if (self.progress === 0) composition.style.clipPath = 'none' },
          end: () => `+=${innerHeight * (desktop ? 1 : .8)}`,
          pin: true, scrub: .4, anticipatePin: 1, invalidateOnRefresh: true,
          onLeave: self => self.getTween()?.progress?.(1),
        } })
          .fromTo(composition, { scale: 1, clipPath: () => aperture() },
            { scale: .88, clipPath: () => aperture(true), duration: 1, ease: 'power2.inOut', immediateRender: false }, 0)
          .to(composition, { opacity: 0, duration: .15 }, .9)
        gsap.fromTo('.transformation-heading', { opacity: .2, y: 40 }, {
          opacity: 1, y: 0, ease: 'none', scrollTrigger: {
            trigger: '#transformations', start: 'top 80%', end: 'top 15%', scrub: .35,
          },
        })
      }
      // Mobile: images travel on different Y planes → creates clear depth without 3D rotation.
      move('.look-feature',
        { y: 100 * span, rotationY: desktop ? -5 : 0, rotationZ: desktop ? -2 : 0 },
        { y: -100 * span, rotationY: desktop ? 3 : 0, rotationZ: desktop ? 1 : 0 },
        '#transformations')
      move('.look-secondary',
        { y: 230 * span, rotationY: desktop ? 6 : 0, rotationZ: desktop ? 3 : 0 },
        { y: -200 * span, rotationY: desktop ? -4 : 0, rotationZ: desktop ? -2 : 0 },
        '#transformations')
      // Inner image drift — visible even on mobile with 55% span.
      move('.look-feature img',   { yPercent: -9, scale: 1.04 }, { yPercent: 9, scale: 1 }, '.look-feature')
      move('.look-secondary img', { yPercent: -9, scale: 1.04 }, { yPercent: 9, scale: 1 }, '.look-secondary')
      move('.gallery-note', { y: 90 * span }, { y: -55 * span }, '#transformations')

      /* ─── MOBILE CLIP-PATH REVEAL — image wipe on entry ─── */
      if (!desktop) {
        // Wipe completes when the element's CENTER crosses 60% of viewport
        // — ensures full reveal well before the section exits screen.
        q('.look-image').forEach(wrap => {
          gsap.fromTo(wrap,
            { clipPath: 'inset(18% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
              scrollTrigger: {
                trigger: wrap,
                start: 'top 98%',   // begin as soon as element edge enters
                end: 'center 62%',  // complete when element center is at 62% — always before exit
                scrub: .5,
                invalidateOnRefresh: true
              } })
        })
      }

      /* ─── REVIEWS (quiet, stable) ─── */
      // Keep the review columns aligned and still while visitors read or paginate.


      /* ─── READING PROGRESS BAR ─── */
      gsap.fromTo('.reading-progress', { scaleX: 0 }, { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: .15 } })

      /* ─── HERO CAMERA SYNC ─── */
      const hero = q('.cinematic-hero')[0]
      let heroTimeline
      const camera = { progress: 0 }
      const sendCamera = () => {
        hero.dataset.sceneProgress = camera.progress.toFixed(4)
        hero.dispatchEvent(new CustomEvent('salon:hero-scroll', { detail: { progress: camera.progress } }))
      }
      context.add('syncHero', () => {
        if (!hero) return
        const ready = hero.dataset.openingPhase === 'complete' && !hero.classList.contains('motion-paused')
        if (!ready) { heroTimeline?.scrollTrigger.disable(false); return }
        if (heroTimeline) { heroTimeline.scrollTrigger.enable(false); return }
        // Lock transform origin before GSAP takes ownership.
        gsap.set('.cinematic-brand', { yPercent: -50, y: 0, scale: 1 })
        heroTimeline = gsap.timeline({ scrollTrigger: {
          id: 'salon-hero', trigger: hero, start: 'top top', end: '+=100%', scrub: desktop ? .65 : .6, invalidateOnRefresh: true,
        } })
          .to(camera, { progress: 1, duration: 1, ease: 'none', onUpdate: sendCamera }, 0)
          .to('.cinematic-brand', { y: desktop ? -65 : -22, scale: desktop ? .94 : .97, transformOrigin: 'left center', duration: 1, ease: 'none' }, 0)
          .to('.cinematic-bottom', { y: -20, duration: 1, ease: 'none' }, 0)
      })
      context.syncHero()
      const observer = new MutationObserver(() => context.syncHero())
      if (hero) observer.observe(hero, { attributes: true, attributeFilter: ['data-opening-phase', 'class'] })

      refresh()
      return () => {
        observer.disconnect()

        portal.progress = 0; sendPortal()
        studioSec?.classList.remove('has-ring-entry')
        if (craftSec) { delete craftSec.dataset.portalProgress; delete craftSec.dataset.portalComplete; delete craftSec.dataset.portalReleased; craftSec.style.removeProperty('--craft-shell-opacity') }
        if (hero) { camera.progress = 0; sendCamera(); delete hero.dataset.sceneProgress }
      }
    }, root)
    document.fonts?.ready.then(() => { if (!disposed) refresh() })
    return () => {
      disposed = true; cancelAnimationFrame(refreshFrame)
      root.removeEventListener('click', anchors)
      window.removeEventListener('hashchange', hashChange)
      window.removeEventListener('wheel', markInteraction)
      window.removeEventListener('touchstart', markInteraction)
      window.removeEventListener('keydown', markInteraction)
      media.revert(); delete root.dataset.scrollMotion; delete root.dataset.scrollLayout
      window.history.scrollRestoration = previousRestoration
    }
  }, [])
}


