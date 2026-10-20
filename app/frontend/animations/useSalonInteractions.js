import { useLayoutEffect } from 'react'
import gsap from 'gsap'

// Pointer enhancements use the native cursor and never intercept clicks or touch scrolling.
export default function useSalonInteractions() {
  useLayoutEffect(() => {
    const root = document.getElementById('root')
    const media = gsap.matchMedia()
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const listeners = []
      const listen = (element, name, callback) => {
        if (!element) return
        element.addEventListener(name, callback, { passive: true })
        listeners.push(() => element.removeEventListener(name, callback))
      }
      const hero = root.querySelector('.cinematic-hero')
      const stage = root.querySelector('.cinematic-stage')
      const light = root.querySelector('.hero-pointer-light')
      const pointer = { x: 0, y: 0 }
      const send = () => hero?.dispatchEvent(new CustomEvent('salon:hero-pointer', { detail: { ...pointer } }))
      const moveX = gsap.quickTo(light, 'x', { duration: .65, ease: 'power3.out' })
      const moveY = gsap.quickTo(light, 'y', { duration: .65, ease: 'power3.out' })
      const revealLight = gsap.quickTo(light, 'opacity', { duration: .35 })
      const toolX = gsap.quickTo(pointer, 'x', { duration: .8, ease: 'power3.out', onUpdate: send })
      const toolY = gsap.quickTo(pointer, 'y', { duration: .8, ease: 'power3.out', onUpdate: send })
      listen(stage, 'pointermove', event => {
        if (event.pointerType === 'touch' || hero.classList.contains('motion-paused')) return
        const bounds = stage.getBoundingClientRect()
        const x = event.clientX - bounds.left, y = event.clientY - bounds.top
        moveX(x); moveY(y); revealLight(1)
        toolX((x / bounds.width - .5) * 2)
        toolY((y / bounds.height - .5) * 2)
      })
      const resetHero = () => { revealLight(0); toolX(0); toolY(0) }
      listen(stage, 'pointerleave', resetHero)
      const pauseObserver = new MutationObserver(() => {
        if (hero.classList.contains('motion-paused')) resetHero()
      })
      pauseObserver.observe(hero, { attributes: true, attributeFilter: ['class'] })

      root.querySelectorAll('.look-image').forEach(frame => {
        const label = frame.querySelector('.image-hover-label')
        gsap.set(frame, { transformPerspective: 1000, transformOrigin: 'center' })
        const turnX = gsap.quickTo(frame, 'rotationX', { duration: .65, ease: 'power3.out' })
        const turnY = gsap.quickTo(frame, 'rotationY', { duration: .65, ease: 'power3.out' })
        const labelX = gsap.quickTo(label, 'x', { duration: .4, ease: 'power3.out' })
        const labelY = gsap.quickTo(label, 'y', { duration: .4, ease: 'power3.out' })
        const labelOpacity = gsap.quickTo(label, 'opacity', { duration: .25 })
        listen(frame, 'pointermove', event => {
          const bounds = frame.getBoundingClientRect()
          const x = event.clientX - bounds.left, y = event.clientY - bounds.top
          turnX((.5 - y / bounds.height) * 3)
          turnY((x / bounds.width - .5) * 3)
          labelX(Math.max(55, Math.min(bounds.width - 55, x)))
          labelY(Math.max(35, Math.min(bounds.height - 35, y)))
          labelOpacity(1)
        })
        listen(frame, 'pointerleave', () => { turnX(0); turnY(0); labelOpacity(0) })
      })
      // Delegation keeps category-filtered service rows interactive as React replaces them.
      listen(root.querySelector('.service-menu-list'), 'pointermove', event => {
        const row = event.target.closest('.service-menu-row')
        if (!row) return
        const bounds = row.getBoundingClientRect()
        row.style.setProperty('--row-x', `${event.clientX - bounds.left}px`)
        row.style.setProperty('--row-y', `${event.clientY - bounds.top}px`)
      })
      return () => {
        listeners.forEach(remove => remove())
        pauseObserver.disconnect()
        // GSAP matchMedia reverts its tracked quickTo tweens and transforms.
        pointer.x = 0; pointer.y = 0; send()
        root.querySelectorAll('.service-menu-row').forEach(row => {
          row.style.removeProperty('--row-x'); row.style.removeProperty('--row-y')
        })
      }
    }, root)
    return () => media.revert()
  }, [])
}
