import React, { Component, lazy, Suspense, useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { clipperHeroConfig } from '../three/clipperHeroConfig.js'
import '../three/clipperHero.css'
import { heroReveal } from '../three/heroReveal.js'

const ease = [0.22, 1, 0.36, 1]
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
  const inView = useInView(section, { amount: 0.01 })
  const [paused, setPaused] = useState(false)
  const [openingPhase, setOpeningPhase] = useState('loading')
  const [skipOpening, setSkipOpening] = useState(false)
  const [clipperStatus, setClipperStatus] = useState(clipperHeroConfig.modelUrl ? 'loading' : 'asset-missing')
  const clipperReady = clipperStatus === 'ready'
  const clipperFailed = useCallback(() => { setClipperStatus('error'); setOpeningPhase('complete') }, [])
  const handleStatus = useCallback(value => { setClipperStatus(value); if(value==='error') setOpeningPhase('complete') }, [])
  const phase = reduced || skipOpening ? 'complete' : openingPhase
  const nameVisible = phase === 'reveal' || phase === 'complete'

  const entered=useRef(false)
  useEffect(()=>{
    if(inView)entered.current=true
    else if(entered.current)setSkipOpening(true)
  },[inView])

  const still = reduced || paused

  return (
    <section
      ref={section}
      className={`cinematic-hero ${still ? 'motion-paused' : ''}`}
      aria-label="ABC Salon cinematic introduction"
      data-clipper-status={clipperStatus}
      data-opening-phase={phase}
    >
      <div className="cinematic-stage">
        {/* Ambient background shade guaranteeing text legibility */}
        <div className="cinematic-shade" />

        {/* Warm golden light overlay */}
        <motion.div
          className="cinematic-light"
          aria-hidden="true"
          style={{ opacity: 0.17 }}
        />

        {/* One GLB scene receives scroll camera cues; text and CTA stay in the DOM. */}
        {clipperHeroConfig.modelUrl && (
          <div className="clipper-hero-layer" data-status={clipperStatus} data-opening-active={phase!=='complete'} aria-hidden="true">
            <ClipperSceneBoundary onFailure={clipperFailed}>
              <Suspense fallback={null}>
                <ClipperHeroScene config={clipperHeroConfig} skipOpening={skipOpening} onOpeningPhaseChange={setOpeningPhase} paused={paused} reduced={!!reduced} inView={inView} onStatusChange={handleStatus} />
              </Suspense>
            </ClipperSceneBoundary>
          </div>
        )}

        {phase!=='complete' && (
          <div className="hero-opening-cover" data-loading={!clipperReady} aria-hidden="true">
            <span className="opening-monogram">ABC<span>SALON · SIVAKASI</span></span>
          </div>
        )}

        {/* Text-only fallback: never restore the retired video, frames or primitive tools. */}
        {!clipperReady && (
          <div className="clipper-hero-status" role="status" aria-live="polite">
            {clipperStatus === 'loading' ? 'Preparing the 3D studio…' : '3D experience unavailable.'}
          </div>
        )}

        {/* Approved text and studio link remain independent of the 3D loading state. */}
        <motion.div
          className="cinematic-brand"
        >
          <motion.p
            className="cinematic-location"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15 }}
          >
            SIVAKASI <span /> TAMIL NADU
          </motion.p>
          <h1 className="hero-company-name" aria-label="ABC Salon">
            <span className="brand-reveal">
              <motion.span
                initial={reduced ? false : { y: '105%' }}
                animate={{ y: nameVisible ? 0 : '105%' }}
                transition={{ duration: heroReveal.typeDuration, ease, delay: heroReveal.firstLine }}
              >
                ABC
              </motion.span>
            </span>
            <span className="brand-reveal hero-fade-line">
              <motion.span
                initial={reduced ? false : { y: '110%' }}
                animate={{ y: nameVisible ? 0 : '110%' }}
                transition={{ duration: heroReveal.typeDuration, ease, delay: heroReveal.secondLine }}
              >
                <em>SALON</em>
              </motion.span>
            </span>
          </h1>
          <motion.div
            className="cinematic-signature"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: nameVisible ? 1 : 0 }}
            transition={{ duration: 1, delay: heroReveal.signature }}
          >
            <span />HAIRCUTS. GROOMING. INDIVIDUALITY.
          </motion.div>
          <p className="hero-description">A considered cut. A confident finish.<br />Your next look, right here in Sivakasi.</p>
          <a className="button hero-visit" href="#visit">Visit the studio <span aria-hidden="true">↗</span></a>
        </motion.div>

        {/* Bottom controls */}
        <div className="cinematic-bottom">
          <a href="#main" className="explore-link">
            <span className="scroll-indicator" aria-hidden="true">↓</span>SCROLL TO EXPLORE
          </a>
          <div className="hero-motion-control">
            <span>THE ABC EXPERIENCE</span>
            {!reduced && clipperReady && phase==='complete' && (
              <button
                aria-label={paused ? 'Play hero animation' : 'Pause hero animation'}
                aria-pressed={paused}
                onClick={() => setPaused(value => !value)}
              >
                {paused ? 'PLAY ▷' : 'PAUSE Ⅱ'}
              </button>
            )}
          </div>
        </div>

        <div className="cinematic-vignette" aria-hidden="true" />
        {/* Seamless dark veil that darkens hero on scroll */}
        <div className="hero-scroll-veil" aria-hidden="true" />
      </div>
    </section>
  )
}
