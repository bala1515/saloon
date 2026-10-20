import React, { Component, lazy, Suspense, useRef, useState, useCallback } from 'react'
import { useInView, useReducedMotion } from 'framer-motion'
import { clipperHeroConfig } from '../three/clipperHeroConfig.js'
import '../three/clipperHero.css'
const ClipperHeroScene = lazy(() => import('./ClipperHeroScene'))
class ClipperSceneBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}
export default function CinematicHero() {
  const section = useRef(null)
  const reduced = useReducedMotion()
  const inView = useInView(section, { amount: .01 })
  const [paused,setPaused] = useState(false)
  const [status,setStatus] = useState(clipperHeroConfig.modelUrl ? 'loading' : 'asset-missing')
  const failure = useCallback(() => setStatus('error'),[])
  const ready = status === 'ready'
  return <section ref={section} className={`cinematic-hero ${paused || reduced ? 'motion-paused' : ''}`} data-clipper-status={status} data-opening-phase="complete" aria-label="ABC Salon, Sivakasi">
    <div className="cinematic-stage">
      <div className="hero-pointer-light" aria-hidden="true" />
      <div className="hero-orbit" aria-hidden="true"><span>LOOK GOOD. FEEL GOOD.</span></div>
      {clipperHeroConfig.modelUrl && <div className="clipper-hero-layer" data-status={status} data-opening-active="false" aria-hidden="true"><ClipperSceneBoundary onFailure={failure}><Suspense fallback={null}><ClipperHeroScene config={clipperHeroConfig} skipOpening paused={paused} reduced={!!reduced} inView={inView} onStatusChange={setStatus} /></Suspense></ClipperSceneBoundary></div>}
      <div className="cinematic-brand"><p className="cinematic-location"><span /> SATCHIYAPURAM, SIVAKASI</p><h1 className="hero-company-name" aria-label="ABC Salon"><span>ABC</span><span>SALON<span className="hero-period">.</span></span></h1><p className="hero-description">Fresh cuts.<br /><em>Good energy.</em></p><p className="hero-support">Hair, grooming & occasion makeup.<br />Your next look starts in our chair.</p><div className="hero-actions"><a className="button" href="#services">Find your service <span aria-hidden="true">↗</span></a><a className="hero-services-link" href="#visit">Visit us →</a></div></div>
      {!ready && <p className="clipper-hero-status" role="status">{status === 'loading' ? 'Loading the tools of the trade…' : 'Precision. Care. A fresh perspective.'}</p>}
      <div className="cinematic-bottom"><a href="#services" className="explore-link">TAKE A LOOK AROUND <span aria-hidden="true">↓</span></a><div className="hero-motion-control"><span>REAL TOOLS. REAL CRAFT.</span>{!reduced && ready && <button aria-label={paused ? 'Play hero animation' : 'Pause hero animation'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? 'Play ▷' : 'Pause Ⅱ'}</button>}</div></div>
    </div>
    <div className="salon-strip"><span>SIVAKASI, WITH STYLE.</span><span>HAIR / GROOMING / MAKEUP</span><a href="#visit">EVERY DAY · 9 AM — 8 PM ↗</a></div>
  </section>
}
