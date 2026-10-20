import React, { useEffect, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { prepareScissors } from '../three/heroToolComposition.js'
import { disposeModel, validateClipperGlb } from '../three/clipperSceneModel.js'
import { craftCameraDistance, craftPortalFrame, fingerPortal, portalCameraDistance, projectFingerAperture } from '../three/craftPortal.js'
import studioInterior from '../assets/salon-cinematic.png'

const scissorsConfig = { rootNode: 'BarberScissors', halfA: 'ScissorHalfA', halfB: 'ScissorHalfB', pivot: 'ScissorPivot', normalizedHeight: 3.2 }

export default function CraftScissorsScene() {
  const containerRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const section = container.closest('#craft')
    const preview = container.querySelector('.craft-portal-preview')
    const previewTitle = container.querySelector('.craft-portal-title')
    const controller = new AbortController()
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, .002, 80)
    const home = new THREE.Vector3(), ring = new THREE.Vector3(), target = new THREE.Vector3()
    let renderer, environment, prepared, imported
    let disposed = false, frame = 0, previous = 0, elapsed = 0, visible = false, failed = false
    let width = 1, height = 1, compact = false, distance = 10
    let progress = Number(section.dataset.portalProgress) || 0
    const pointer = { x: 0, y: 0 }

    const requestFrame = () => {
      if (!disposed && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw)
    }
    const update = () => {
      const flight = craftPortalFrame(reduced ? 0 : progress)
      container.dataset.portalPhase = flight.pass > 0 ? 'through' : flight.approach > 0 ? 'entering' : flight.aim > 0 ? 'aligning' : 'upright'
      container.dataset.portalProgress = flight.progress.toFixed(4)
      previewTitle.style.opacity = flight.title
      if (!prepared || failed) {
        preview.style.clipPath = 'inset(0)'
        preview.style.opacity = failed ? flight.reveal * (1 - flight.handoff) : 0
        return
      }

      const idle = reduced || progress > 0 ? 0 : Math.sin(elapsed * .6)
      const straighten = flight.straighten
      const opening = THREE.MathUtils.lerp(reduced ? .075 : .09 + idle * .025, .035, straighten)
      prepared.halfA.rotation.z = opening
      prepared.halfB.rotation.z = -opening
      prepared.rig.rotation.set(
        THREE.MathUtils.lerp(.10 + pointer.y * .06 + idle * .015, 0, straighten),
        THREE.MathUtils.lerp(-.14 + pointer.x * .10, 0, straighten),
        THREE.MathUtils.lerp(.48 + pointer.x * .035, 0, straighten),
      )
      prepared.rig.position.set(compact ? 0 : 1.05, compact ? -.85 : 0, 0)
      prepared.rig.updateMatrixWorld(true)
      ring.fromArray(fingerPortal.center)
      prepared.halfA.localToWorld(ring)
      home.set(0, 0, distance)
      const approach = portalCameraDistance(distance - ring.z, flight)
      camera.position.set(
        THREE.MathUtils.lerp(home.x, ring.x, flight.aim),
        THREE.MathUtils.lerp(home.y, ring.y, flight.aim),
        ring.z + approach,
      )
      target.set(ring.x * flight.aim, ring.y * flight.aim, ring.z * flight.aim)
      // Once close to the ring, keep looking forward as the lens passes its plane.
      if (flight.pass > 0) target.z = camera.position.z - 1
      camera.lookAt(target)
      camera.updateMatrixWorld(true)

      const full = approach <= .055
      if (flight.reveal > 0 && !full) {
        const polygon = projectFingerAperture(prepared.halfA, camera)
        preview.style.clipPath = 'polygon(' + polygon.map(([x, y]) => x.toFixed(3) + '% ' + y.toFixed(3) + '%').join(',') + ')'
      } else preview.style.clipPath = full ? 'inset(0)' : 'ellipse(0% 0% at 50% 50%)'
      preview.style.opacity = flight.reveal * (1 - flight.handoff)
      // The actual ring already surrounds the screen before the metal clears.
      renderer.domElement.style.opacity = approach > .025 ? 1 : 0
      container.dataset.ringDistance = approach.toFixed(4)
      container.dataset.ringCenter = ring.toArray().map(value => value.toFixed(4)).join(',')
      container.dataset.apertureFull = String(full)
      renderer.render(scene, camera)
    }
    function draw(now) {
      frame = 0
      if (disposed || !visible || document.hidden) { previous = 0; return }
      if (previous && !reduced) elapsed += Math.min((now - previous) / 1000, .05)
      previous = now
      update()
      if (!reduced && prepared && progress < .001) requestFrame()
    }
    const resize = () => {
      width = container.clientWidth
      height = container.clientHeight
      if (!width || !height) return
      compact = width <= 700 || height < 600
      distance = craftCameraDistance(width / height, compact)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      if (renderer) {
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.75))
        renderer.setSize(width, height, false)
      }
      requestFrame()
    }
    const scroll = event => { progress = event.detail.progress; requestFrame() }
    const mouse = event => {
      if (compact || reduced || progress > 0) return
      const bounds = container.getBoundingClientRect()
      pointer.x = THREE.MathUtils.clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1)
      pointer.y = THREE.MathUtils.clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1)
      requestFrame()
    }
    const visibility = () => {
      previous = 0
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestFrame()
    }
    const fail = error => {
      if (disposed) return
      failed = true
      container.dataset.status = 'error'
      console.warn('[craft-portal] Using the studio dissolve fallback:', error.message)
      requestFrame()
    }
    const contextLost = event => { event.preventDefault(); fail(new Error('WebGL context lost')) }
    section.addEventListener('salon:craft-portal', scroll)
    section.addEventListener('pointermove', mouse, { passive: true })
    document.addEventListener('visibilitychange', visibility)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting
      if (visible) requestFrame()
      else { cancelAnimationFrame(frame); frame = 0; previous = 0 }
    }, { rootMargin: '100px' })
    intersection.observe(section)

    async function load() {
      container.dataset.status = 'loading'
      let timeout
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
        renderer.setClearColor(0, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = .95
        renderer.domElement.setAttribute('aria-hidden', 'true')
        renderer.domElement.addEventListener('webglcontextlost', contextLost)
        container.appendChild(renderer.domElement)
        const generator = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment()
        try { environment = generator.fromScene(room, .04) } finally { room.dispose(); generator.dispose() }
        scene.environment = environment.texture
        scene.environmentIntensity = .8
        scene.add(new THREE.HemisphereLight(0xfff5e6, 0x111311, .9))
        for (const [color, intensity, position] of [
          [0xfffaed, 2.6, [3, 4, 4.5]],
          [0xdde8ff, 1.4, [-4, -2, 3]],
          [0xd9b36c, 2.4, [2, -3, -2]],
        ]) {
          const light = new THREE.DirectionalLight(color, intensity)
          light.position.set(...position); scene.add(light)
        }
        timeout = setTimeout(() => controller.abort(), 20000)
        const response = await fetch('/models/abc-atelier-shears-01.glb', { signal: controller.signal })
        if (!response.ok) throw new Error('Scissors request failed (' + response.status + ')')
        const buffer = await response.arrayBuffer()
        validateClipperGlb(buffer)
        const gltf = await new GLTFLoader().parseAsync(buffer, '/models/')
        imported = gltf.scene
        if (disposed) { disposeModel(imported); return }
        prepared = prepareScissors(imported, scissorsConfig)
        scene.add(prepared.rig)
        container.dataset.status = 'ready'
        resize(); requestFrame()
      } catch (error) { fail(error) } finally { clearTimeout(timeout) }
    }
    resize()
    load()
    return () => {
      disposed = true
      controller.abort(); cancelAnimationFrame(frame)
      intersection.disconnect(); resizeObserver.disconnect()
      section.removeEventListener('salon:craft-portal', scroll)
      section.removeEventListener('pointermove', mouse)
      document.removeEventListener('visibilitychange', visibility)
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost)
      disposeModel([prepared?.rig, imported].filter(Boolean))
      environment?.dispose(); renderer?.dispose(); renderer?.forceContextLoss()
      renderer?.domElement.remove()
    }
  }, [reduced])

  return <div ref={containerRef} className="craft-scissors-viewport" aria-hidden="true">
    <div className="craft-portal-preview">
      <img src={studioInterior} alt="" decoding="async" width="1672" height="941" />
      <div className="craft-portal-title"><span>A SPACE</span><em>to reset.</em></div>
    </div>
  </div>
}
