import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Draggable } from 'gsap/Draggable'
import { SectionLabel } from './EditorialSections'
import { categories } from '../data/salonContent'
import { useReducedMotion } from 'framer-motion'

gsap.registerPlugin(ScrollTrigger, Draggable)

function Arrow() {
  return <span aria-hidden="true">↗</span>
}

function buildCardTimeline(cards) {
  const tl = gsap.timeline({ paused: true })
  const n = cards.length

  if (n <= 1) {
    if (cards[0]) {
      gsap.set(cards[0], { xPercent: 0, scale: 1, opacity: 1, zIndex: 100 })
    }
    return tl
  }

  cards.forEach((card, i) => {
    if (i === 0) {
      gsap.set(card, { xPercent: 0, scale: 1, opacity: 1, zIndex: 100 })
      tl.to(card, { xPercent: -110, scale: 0.85, opacity: 0.35, zIndex: 50, duration: 1, ease: 'none' }, 0)
      if (n > 2) {
        tl.to(card, { xPercent: -240, scale: 0.5, opacity: 0, zIndex: 10, duration: 1, ease: 'none' }, 1)
      }
    } else if (i === 1) {
      gsap.set(card, { xPercent: 110, scale: 0.85, opacity: 0.35, zIndex: 50 })
      tl.to(card, { xPercent: 0, scale: 1, opacity: 1, zIndex: 100, duration: 1, ease: 'none' }, 0)
      if (n > 2) {
        tl.to(card, { xPercent: -110, scale: 0.85, opacity: 0.35, zIndex: 50, duration: 1, ease: 'none' }, 1)
      }
      if (n > 3) {
        tl.to(card, { xPercent: -240, scale: 0.5, opacity: 0, zIndex: 10, duration: 1, ease: 'none' }, 2)
      }
    } else {
      gsap.set(card, { xPercent: 240, scale: 0.5, opacity: 0, zIndex: 10 })
      tl.to(card, { xPercent: 110, scale: 0.85, opacity: 0.35, zIndex: 50, duration: 1, ease: 'none' }, i - 2)
      tl.to(card, { xPercent: 0, scale: 1, opacity: 1, zIndex: 100, duration: 1, ease: 'none' }, i - 1)
      if (i < n - 1) {
        tl.to(card, { xPercent: -110, scale: 0.85, opacity: 0.35, zIndex: 50, duration: 1, ease: 'none' }, i)
      }
      if (i < n - 2) {
        tl.to(card, { xPercent: -240, scale: 0.5, opacity: 0, zIndex: 10, duration: 1, ease: 'none' }, i + 1)
      }
    }
  })

  return tl
}

export default function GsapCardGallery({ allServices, category, setCategory, phoneUrl, phone }) {
  const reduced=useReducedMotion()
  const galleryRef = useRef(null)
  const cardsRef = useRef(null)
  const dragProxyRef = useRef(null)
  const scrollToCardRef = useRef(null)
  const previousCategory = useRef(category)
  const [activeIndex, setActiveIndex] = useState(0)

  // Filter services by category - each service rendered once!
  const filtered = allServices.filter(s => category === 'All' || s.category === category)
  const n = filtered.length

  useEffect(() => {
    setActiveIndex(0)
  }, [category])

  useEffect(() => {
    const gallery = galleryRef.current
    const cardsContainer = cardsRef.current
    const dragProxy = dragProxyRef.current
    if (!gallery || !cardsContainer || !dragProxy) return

    const cards = gsap.utils.toArray(cardsContainer.querySelectorAll('li'))
    if (!cards.length) return
    const categoryChanged = previousCategory.current !== category
    previousCategory.current = category
    if(reduced) {
      gsap.set(cards,{clearProps:'transform,opacity,zIndex'})
      scrollToCardRef.current=null
      ScrollTrigger.refresh()
      return
    }

    const tl = buildCardTimeline(cards)

    // Responsive scroll distance
    let isMobile = window.innerWidth <= 768
    let totalScroll = Math.max(1, (n - 1) * (isMobile ? 240 : 320))

    const trigger = ScrollTrigger.create({
      trigger: gallery,
      start: 'top top',
      end: () => `+=${totalScroll}`,
      pin: true,
      anticipatePin: 1,
      onRefreshInit: () => {
        isMobile = window.innerWidth <= 768
        totalScroll = Math.max(1, (n - 1) * (isMobile ? 240 : 320))
      },
      scrub: 0.5,
      animation: tl,
      snap: n > 1 ? {
        snapTo: 1 / (n - 1),
        duration: { min: 0.16, max: 0.28 },
        delay: 0.14,
        inertia: false,
        directional: false,
        ease: 'power2.out'
      } : false
    })

    const nextBtn = gallery.querySelector('.next')
    const prevBtn = gallery.querySelector('.prev')

    let currentTargetIndex = 0
    let previousIndex = -1
    let scrollTween = null

    const updateState = () => {
      const progress = tl.progress()
      const currentIdx = Math.round(progress * (n - 1))
      if (currentIdx !== previousIndex) {
        setActiveIndex(currentIdx)
        cards.forEach((card,index) => {
          card.inert = index !== currentIdx
          card.setAttribute('aria-hidden', String(index !== currentIdx))
        })
        previousIndex = currentIdx
      }
      currentTargetIndex = currentIdx

      if (prevBtn) {
        prevBtn.style.opacity = currentIdx <= 0 ? '0.35' : '1'
        prevBtn.style.pointerEvents = currentIdx <= 0 ? 'none' : 'auto'
      }
      if (nextBtn) {
        nextBtn.style.opacity = currentIdx >= n - 1 ? '0.35' : '1'
        nextBtn.style.pointerEvents = currentIdx >= n - 1 ? 'none' : 'auto'
      }
    }

    tl.eventCallback('onUpdate', updateState)
    updateState()

    const scrollToCard = (targetIndex) => {
      if (n <= 1) return
      const clamped = Math.max(0, Math.min(n - 1, targetIndex))
      currentTargetIndex = clamped
      const targetProgress = clamped / (n - 1)
      const targetScroll = trigger.start + targetProgress * totalScroll
      const currentScroll = trigger.scroll()
      const proxy = { y: currentScroll }

      if (scrollTween) scrollTween.kill()
      trigger.getTween(true)?.kill?.()

      scrollTween = gsap.to(proxy, {
        y: targetScroll,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate() {
          trigger.scroll(proxy.y)
        }
      })
    }

    scrollToCardRef.current = scrollToCard

    const onNext = () => {
      scrollToCard(currentTargetIndex + 1)
    }

    const onPrev = () => {
      scrollToCard(currentTargetIndex - 1)
    }

    nextBtn?.addEventListener('click', onNext)
    prevBtn?.addEventListener('click', onPrev)

    // Touch & Mouse dragging functionality
    const draggable = Draggable.create(dragProxy, {
      type: 'x',
      trigger: cardsContainer,
      onPress() {
        this.startScroll = trigger.scroll()
      },
      onDrag() {
        if (n <= 1) return
        const dragFactor = totalScroll / (n * (isMobile ? 240 : 400))
        const dragDelta = (this.startX - this.x) * dragFactor
        const newScroll = Math.max(trigger.start, Math.min(trigger.end, this.startScroll + dragDelta))
        trigger.scroll(newScroll)
      },
      onDragEnd() {
        if (n <= 1) return
        const currentProgress = (trigger.scroll() - trigger.start) / Math.max(totalScroll, 1)
        const targetIndex = Math.round(currentProgress * (n - 1))
        scrollToCard(targetIndex)
      }
    })

    // Filtering changes pin spacing; recalculate the sections below the carousel.
    const refreshFrame=requestAnimationFrame(()=>{
      ScrollTrigger.sort();ScrollTrigger.refresh(!categoryChanged)
      if (categoryChanged) {
        trigger.getTween(true)?.kill?.()
        trigger.scroll(trigger.start + 1)
        trigger.update();tl.progress(0);updateState()
      }
    })

    return () => {
      cancelAnimationFrame(refreshFrame)
      if (scrollTween) scrollTween.kill()
      nextBtn?.removeEventListener('click', onNext)
      prevBtn?.removeEventListener('click', onPrev)
      trigger.kill()
      if (draggable[0]) draggable[0].kill()
      tl.kill()
      cards.forEach(card => { card.inert = false; card.removeAttribute('aria-hidden') })
    }
  }, [category, n, reduced])

  return (
    <section className="services-gallery-section" id="services" aria-labelledby="services-heading">
      <div className="gallery" ref={galleryRef}>
        <div className="gallery-top">
          <div className="section-heading">
            <div>
              <SectionLabel number="05" light>What we do</SectionLabel>
              <h2 id="services-heading">Our services.<br /><em>Pick yours.</em></h2>
            </div>
            <div className="section-heading-note">
              <p>Regular cut or a special occasion — we have you covered. Explore our services and find your next look.</p>
              <span>PRICING CONFIRMED BY THE SALON</span>
            </div>
          </div>
          <div className="filters" role="group" aria-label="Filter services">
            {categories.map(item => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="gallery-stage">
          <ul className="cards" ref={cardsRef}>
            {filtered.map((service, idx) => (
              <li key={`${service.name}-${idx}`} className="ivory-card">
                <div className="sc-card-head">
                  <span className="sc-card-num">{String(idx + 1).padStart(2, '0')}</span>
                  <div className="sc-card-head-meta">
                    <span className="sc-card-badge">{service.category}</span>
                    <span className="sc-card-counter">{String(idx + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</span>
                  </div>
                </div>

                <div className="sc-card-body">
                  <h3 className="sc-card-title">{service.name}</h3>
                  <p className="sc-card-desc">{service.description}</p>
                </div>

                <div className="sc-card-foot">
                  <span className="sc-card-origin">Sivakasi Studio</span>
                  <a
                    className="sc-card-btn"
                    href="#visit"
                  >
                    <span>Visit the studio</span>
                    <Arrow />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="gallery-bottom">
          <div className="actions">
            <button type="button" className="prev" aria-label="Previous service">← Prev</button>
            <div className="action-dots" role="tablist" aria-label="Service navigation">
              {filtered.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === activeIndex}
                  aria-label={`Go to service ${i + 1}`}
                  className={`action-dot${i === activeIndex ? ' action-dot--active' : ''}`}
                  onClick={() => scrollToCardRef.current?.(i)}
                />
              ))}
            </div>
            <button type="button" className="next" aria-label="Next service">Next →</button>
          </div>
        </div>
        <div className="drag-proxy" ref={dragProxyRef}></div>
      </div>
      <div className="service-note">
        <p>Not sure where to begin? Let's talk about your next look.</p>
        <a href={phoneUrl || "tel:+919080550025"}>Call {phone || "090805 50025"} <Arrow /></a>
      </div>
    </section>
  )
}

