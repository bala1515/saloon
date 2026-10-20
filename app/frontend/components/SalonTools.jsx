import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createSalonTools } from './salonToolModels'

// The SVG version also animates when a device cannot create a WebGL context.
export function SalonToolsFallback() {
  return <svg className="salon-tools-fallback" viewBox="0 0 560 620" aria-hidden="true">
    <defs><linearGradient id="salon-steel" x1="0" x2="1"><stop stopColor="#777b72"/><stop offset=".3" stopColor="#f5f0df"/><stop offset=".6" stopColor="#a6a68f"/><stop offset=".8" stopColor="#f7e7b8"/><stop offset="1" stopColor="#676c60"/></linearGradient><linearGradient id="salon-brass"><stop stopColor="#715530"/><stop offset=".4" stopColor="#ebd8a8"/><stop offset="1" stopColor="#a17c43"/></linearGradient></defs>
    <g className="fallback-scissors-float"><g transform="translate(265 285) rotate(-24)"><g className="fallback-scissors-half half-left"><path d="M-5 8 L-10 -190 Q10 -185 13 -158 L9 -25Z" fill="url(#salon-steel)"/><path d="M0 5 Q-4 52 -24 77" fill="none" stroke="url(#salon-brass)" strokeWidth="11"/><ellipse cx="-32" cy="107" rx="25" ry="29" fill="none" stroke="url(#salon-brass)" strokeWidth="10"/></g><g className="fallback-scissors-half half-right"><path d="M5 8 L10 -190 Q-10 -185 -13 -158 L-9 -25Z" fill="url(#salon-steel)"/><path d="M0 5 Q4 52 24 77" fill="none" stroke="url(#salon-brass)" strokeWidth="11"/><ellipse cx="32" cy="107" rx="25" ry="29" fill="none" stroke="url(#salon-brass)" strokeWidth="10"/></g><circle r="12" fill="url(#salon-brass)"/><path d="M-5 0H5" stroke="#454a3a" strokeWidth="2"/></g></g>
    <g className="fallback-comb-float"><g transform="translate(365 435) rotate(-34)"><rect x="-100" y="-13" width="200" height="17" rx="6" fill="#30362a" stroke="#a98d58"/><path d="M-86 2v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43m9-43v43" stroke="#9d946e" strokeWidth="4"/></g></g>
    <g className="fallback-razor-float"><g transform="translate(123 437) rotate(-34)"><rect x="-12" y="0" width="24" height="100" rx="10" fill="#2c3226" stroke="#a98d58"/><path d="M0 0L92 -84L116 -72L26 17Z" fill="url(#salon-steel)"/><circle r="5" fill="url(#salon-brass)"/></g></g>
  </svg>
}

export default function SalonTools({ paused = false, reduced = false, pointerX, pointerY, progress }) {
  const host = useRef(null)
  const state = useRef({ paused, reduced })
  const schedule = useRef(() => {})
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    state.current = { paused, reduced }
    schedule.current()
  }, [paused, reduced])
  useEffect(() => {
    const element = host.current
    let renderer, environment, models, resizeObserver, intersectionObserver
    let frame = 0, elapsed = 0, previous = 0, visible = true, compact = false, disposed = false
    let poseProgress = 0, posePointer = { x: 0, y: 0 }
    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 30)
    camera.position.set(0, 0, 10)
    const cleanups = []
    function requestRender() {
      if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(render)
    }
    function render(now) {
      frame = 0
      if (disposed || !visible || document.hidden) { previous = 0; return }
      const moving = !state.current.paused && !state.current.reduced
      if (moving && previous) elapsed += Math.min((now - previous) / 1000, 0.05)
      previous = moving ? now : 0
      if (moving) { poseProgress = progress?.get() || 0; posePointer = { x: pointerX?.get() || 0, y: pointerY?.get() || 0 } }
      models.update(elapsed, state.current.reduced ? 0 : poseProgress, state.current.reduced ? { x: 0, y: 0 } : posePointer, compact)
      renderer.render(scene, camera)
      if (moving) requestRender()
    }
    function visibilityChange() {
      previous = 0
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestRender()
    }
    const contextLost = event => {
      event.preventDefault(); cancelAnimationFrame(frame); frame = 0; disposed = true; setFailed(true)
    }
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setClearColor(0x000000, 0)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.5
      element.appendChild(renderer.domElement)
      renderer.domElement.addEventListener('webglcontextlost', contextLost)
      const pmrem = new THREE.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      environment = pmrem.fromScene(room, 0.04)
      scene.environment = environment.texture
      room.dispose(); pmrem.dispose()
      scene.add(new THREE.HemisphereLight(0xffeed2, 0x5b6355, 2.3))
      const key = new THREE.DirectionalLight(0xffe2a7, 4)
      key.position.set(3, 5, 6); scene.add(key)
      const rim = new THREE.DirectionalLight(0xffffff, 3)
      rim.position.set(-5, 1, 4); scene.add(rim)
      models = createSalonTools(); scene.add(models.root)
      function resize() {
        const width = element.clientWidth, height = element.clientHeight
        if (!width || !height) return
        compact = window.matchMedia('(max-width: 720px)').matches
        const aspect = width / height
        const span = aspect < 0.75 ? 3.5 / aspect : 3
        camera.left = -span * aspect; camera.right = span * aspect
        camera.top = span; camera.bottom = -span; camera.updateProjectionMatrix()
        renderer.setSize(width, height)
        requestRender()
      }
      resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element); resize()
      intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting; previous = 0
        if (!visible) { cancelAnimationFrame(frame); frame = 0 } else requestRender()
      }, { threshold: 0.01 })
      intersectionObserver.observe(element)
      document.addEventListener('visibilitychange', visibilityChange)
      for (const value of [pointerX, pointerY, progress]) if (value) cleanups.push(value.on('change', requestRender))
      schedule.current = requestRender
      models.update(0, 0, { x: 0, y: 0 }, compact)
      renderer.render(scene, camera)
      setReady(true); requestRender()
    } catch {
      disposed = true; cancelAnimationFrame(frame); setFailed(true)
    }
    return () => {
      disposed = true; cancelAnimationFrame(frame); schedule.current = () => {}
      cleanups.forEach(unsubscribe => unsubscribe())
      resizeObserver?.disconnect(); intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', visibilityChange)
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost)
      models?.dispose(); environment?.dispose(); renderer?.dispose()
      if (renderer?.domElement.parentNode === element) element.removeChild(renderer.domElement)
    }
  }, [pointerX, pointerY, progress])
  return <div className={`salon-tools ${paused || reduced ? 'tools-paused' : ''}`} aria-hidden="true">
    <div ref={host} className={`salon-tools-canvas ${ready && !failed ? 'is-ready' : ''}`} />
    {(!ready || failed) && <SalonToolsFallback />}
  </div>
}

