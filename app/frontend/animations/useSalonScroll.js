import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'



gsap.registerPlugin(ScrollTrigger)

// Mobile address-bar resize should not kill our scroll triggers.
ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true })

/**
 * Native reading flow with a scroll-responsive hero camera and image depth.
 * All text stays in place. Reduced motion skips scroll effects entirely.
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
      const top = id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY - 28
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
      mobile: '(max-width: 760px) and (min-height: 560px)',
      reduced: '(prefers-reduced-motion: reduce)',
    }, context => {
      const { desktop, mobile, reduced } = context.conditions
      root.dataset.scrollMotion = reduced ? 'reduced' : 'active'
      root.dataset.scrollLayout = mobile ? 'mobile' : desktop ? 'desktop' : 'compact'
      const q = gsap.utils.selector(root)
      if (reduced) return
      // Desktop gets independent image depth; phones get one deliberate image reel.
      const gallery = q('.editorial-gallery')[0]
      const gallerySection = q('#transformations')[0]
      if (mobile && gallery) {
        gallery.classList.add('is-scroll-reel')
        gallerySection.classList.add('has-scroll-reel')
        const feature = gallery.querySelector('.look-feature')
        const secondary = gallery.querySelector('.look-secondary')
        gsap.set(secondary.querySelector('.look-image'), { clipPath: 'inset(0% 0% 0% 100%)' })
        gsap.timeline({ scrollTrigger: {
          id: 'salon-mobile-reel', trigger: gallery, start: 'top 15%',
          end: () => `+=${Math.round(window.innerHeight * .85)}`,
          pin: true, scrub: .3, anticipatePin: 1, invalidateOnRefresh: true,
        } })
          .to(feature.querySelector('.look-image'), { xPercent: -8, scale: .96, ease: 'none', duration: 1 }, 0)
          .to(feature.querySelector('figcaption'), { opacity: 0, duration: .12, ease: 'none' }, .75)
          .fromTo(secondary.querySelector('figcaption'), { opacity: 0 }, { opacity: 1, duration: .15, ease: 'none' }, .85)
          .to(feature.querySelector('img'), { scale: 1.12, ease: 'none', duration: 1 }, 0)
          .to(secondary.querySelector('.look-image'), { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', duration: .75 }, .15)
          .fromTo(secondary.querySelector('img'), { scale: 1.15, xPercent: 4 }, {
            scale: 1, xPercent: 0, ease: 'none', duration: .85,
          }, .15)
          .fromTo(gallerySection, { '--reel-progress': 0 }, { '--reel-progress': 1, ease: 'none', duration: 1 }, 0)
      }
      q('.depth-image').forEach(frame => {
        if (mobile && frame.closest('.editorial-gallery')) return
        gsap.fromTo(frame.querySelector('img'), { scale: desktop ? 1.12 : 1.18, yPercent: desktop ? -3 : 0 }, {
          scale: 1, yPercent: desktop ? 3 : 0, ease: 'none', scrollTrigger: {
            trigger: frame, start: 'top bottom', end: mobile ? 'bottom 55%' : 'bottom top', scrub: .4,
          },
        })
      })
      // The teal service panel expands into the viewport; its text stays still.
      gsap.fromTo('.service-menu-section', { clipPath: `inset(0% ${mobile ? 3 : 5}% 0% ${mobile ? 3 : 5}%)` }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: {
          trigger: '.service-menu-section', start: 'top 98%', end: 'top 45%', scrub: .25,
        },
      })
      // A graphic orbit, rather than a pinned reading section, carries the hero out.
      gsap.to('.hero-orbit', { rotation: mobile ? 48 : 22, scale: mobile ? .86 : 1, y: desktop ? 65 : -35, ease: 'none', scrollTrigger: {
        trigger: '.cinematic-stage', start: 'top top', end: 'bottom top', scrub: .4,
      } })
      q('.section-heading').forEach(heading => gsap.fromTo(heading, {
        '--accent-progress': 0,
      }, { '--accent-progress': 1, duration: 1, scrollTrigger: {trigger:heading,start:'top 85%',once:true} }))
      // Give each visual a distinct motion: a framing reveal and a rotating craft mark.
      gsap.fromTo('.studio-image img', { clipPath: mobile ? 'inset(0% 14% 0% 14%)' : 'inset(7% 0% 7% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', ease: 'none', scrollTrigger: {
          trigger: '.studio-image', start: 'top 95%', end: mobile ? 'center 55%' : 'center 65%', scrub: .3,
        },
      })
      gsap.fromTo('.gallery-statement > span', { rotation: -25 }, {
        rotation: 95, ease: 'none', scrollTrigger: {
          trigger: '.editorial-gallery', start: 'top bottom', end: 'bottom top', scrub: .6,
        },
      })
      gsap.fromTo('.service-menu-list', { '--menu-rule': 0 }, {
        '--menu-rule': 1, ease: 'none', scrollTrigger: {
          trigger: '.service-menu-list', start: 'top 95%', end: 'top 50%', scrub: .4,
        },
      })
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
        // Only the 3D camera responds to scroll; text keeps its layout position.
        heroTimeline = gsap.timeline({ scrollTrigger: {
          id: 'salon-hero', trigger: hero, start: 'top top', end: mobile ? 'bottom 30%' : 'bottom top', scrub: .25, invalidateOnRefresh: true,
        } })
          .to(camera, { progress: 1, duration: 1, ease: 'none', onUpdate: sendCamera }, 0)
      })
      context.syncHero()
      const observer = new MutationObserver(() => context.syncHero())
      if (hero) observer.observe(hero, { attributes: true, attributeFilter: ['data-opening-phase', 'class'] })

      refresh()
      return () => {
        observer.disconnect()
        gallery?.classList.remove('is-scroll-reel')
        gallerySection?.classList.remove('has-scroll-reel')


        if (hero) { camera.progress = 0; sendCamera(); delete hero.dataset.sceneProgress }
      }
    }, root)
    // Filtering services changes the offsets of every section below the menu.
    const menuResize = new ResizeObserver(refresh)
    const serviceMenu = root.querySelector('.service-menu-section')
    if (serviceMenu) menuResize.observe(serviceMenu)
    document.fonts?.ready.then(() => { if (!disposed) refresh() })
    return () => {
      disposed = true; cancelAnimationFrame(refreshFrame)
      menuResize.disconnect()
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
