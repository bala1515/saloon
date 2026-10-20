import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function ChairFallback() {
  return <svg className="chair-fallback" viewBox="0 0 420 520" role="img" aria-label="Blue salon chair illustration">
    <defs><linearGradient id="metal"><stop stopColor="#657887"/><stop offset=".35" stopColor="#f8fbff"/><stop offset=".55" stopColor="#9bafc2"/><stop offset=".8" stopColor="#fff"/><stop offset="1" stopColor="#6c8293"/></linearGradient><linearGradient id="seat" x2="1" y2="1"><stop stopColor="#316cf1"/><stop offset="1" stopColor="#102b80"/></linearGradient></defs>
    <ellipse cx="212" cy="467" rx="130" ry="20" fill="#122449" opacity=".1"/><ellipse cx="210" cy="443" rx="97" ry="22" fill="url(#metal)"/><path d="M192 330h36v105h-36z" fill="url(#metal)"/><rect x="115" y="130" width="190" height="185" rx="28" fill="url(#metal)"/><rect x="124" y="133" width="172" height="167" rx="22" fill="url(#seat)"/><rect x="170" y="80" width="80" height="57" rx="16" fill="url(#seat)"/><path d="M92 248v76m236-76v76" stroke="url(#metal)" strokeWidth="14"/><rect x="75" y="235" width="52" height="20" rx="8" fill="#143582"/><rect x="294" y="235" width="52" height="20" rx="8" fill="#143582"/><rect x="103" y="294" width="214" height="49" rx="17" fill="url(#seat)"/><path d="m155 341-17 55h145l-17-55" fill="none" stroke="url(#metal)" strokeWidth="10"/><rect x="131" y="384" width="157" height="20" rx="5" fill="#4e5e74"/>
  </svg>
}

export default function SalonChair({ reducedMotion = false }) {
  const mount = useRef(null)
  const actions = useRef({})
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(!reducedMotion)
  const playingRef = useRef(!reducedMotion)

  useEffect(() => {
    playingRef.current = !reducedMotion
    setPlaying(!reducedMotion)
    const host = mount.current
    if (!host) return
    let renderer, environment, pmrem, controls, resizeObserver, intersectionObserver
    let frame = 0, visible = true, disposed = false, last = 0
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 50)
    const target = new THREE.Vector3(0, 1.75, 0)

    const render = (now = performance.now()) => {
      frame = 0
      if (disposed || !visible || document.hidden) return
      const delta = last ? Math.min((now - last) / 1000, 0.05) : 0
      last = now
      controls.autoRotate = playingRef.current
      controls.update(delta)
      renderer.render(scene, camera)
      if (controls.autoRotate && !frame) frame = requestAnimationFrame(render)
    }
    function requestRender() {
      if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(render)
    }
    function onVisibility() { last = 0; if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestRender() }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
      renderer.setClearColor(0x000000, 0)
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.25
      renderer.domElement.setAttribute('aria-label', 'Interactive blue and chrome salon chair. Drag left or right to rotate. Keyboard rotation buttons are below.')
      renderer.domElement.setAttribute('role', 'img')
      host.appendChild(renderer.domElement)
      camera.position.set(4.4, 3.3, 6.2)
      controls = new OrbitControls(camera, renderer.domElement)
      controls.target.copy(target)
      controls.enableZoom = false
      controls.enablePan = false
      controls.enableDamping = false
      controls.minPolarAngle = Math.PI * 0.3
      controls.maxPolarAngle = Math.PI * 0.5
      controls.rotateSpeed = 0.6
      controls.autoRotateSpeed = 0.85
      controls.update()
      // Preserve vertical page scrolling on touch screens; horizontal drags rotate the model.
      renderer.domElement.style.touchAction = 'pan-y'
      pmrem = new THREE.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      environment = pmrem.fromScene(room, 0.04)
      scene.environment = environment.texture
      room.dispose()
      pmrem.dispose()
      scene.add(new THREE.HemisphereLight(0xffffff, 0x94a2c4, 2.2))
      const key = new THREE.DirectionalLight(0xffffff, 4)
      key.position.set(3, 7, 4)
      key.castShadow = true
      key.shadow.mapSize.set(1024, 1024)
      key.shadow.camera.left = -4; key.shadow.camera.right = 4
      key.shadow.camera.top = 5; key.shadow.camera.bottom = -4
      key.shadow.normalBias = 0.035
      scene.add(key)
      const rim = new THREE.DirectionalLight(0x99bbff, 2)
      rim.position.set(-4, 3, -3)
      scene.add(rim)
      const chair = new THREE.Group()
      scene.add(chair)
      const leather = new THREE.MeshPhysicalMaterial({ color: 0x123fa6, roughness: 0.36, metalness: 0.08, clearcoat: 0.25, clearcoatRoughness: 0.35 })
      const piping = new THREE.MeshStandardMaterial({ color: 0x3a6fe0, roughness: 0.45 })
      const chrome = new THREE.MeshStandardMaterial({ color: 0xe0e8ef, metalness: 1, roughness: 0.18 })
      const dark = new THREE.MeshStandardMaterial({ color: 0x142138, roughness: 0.6, metalness: 0.2 })
      const add = (geometry, material, position, rotation = [0, 0, 0]) => {
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(...position); mesh.rotation.set(...rotation)
        mesh.castShadow = true; mesh.receiveShadow = true
        chair.add(mesh)
        return mesh
      }
      const box = (size, material, position, radius = 0.08, rotation) => add(new RoundedBoxGeometry(...size, 3, radius), material, position, rotation)
      const cylinder = (top, bottom, height, material, position) => add(new THREE.CylinderGeometry(top, bottom, height, 48), material, position)
      const rod = (from, to, radius = 0.035) => {
        const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to)
        const mesh = add(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 16), chrome, a.clone().add(b).multiplyScalar(0.5).toArray())
        mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize())
      }
      cylinder(0.93, 0.98, 0.1, chrome, [0, 0.13, 0])
      cylinder(0.75, 0.89, 0.08, chrome, [0, 0.21, 0])
      cylinder(0.28, 0.39, 0.14, dark, [0, 0.29, 0])
      cylinder(0.19, 0.24, 0.72, chrome, [0, 0.69, 0])
      cylinder(0.12, 0.12, 0.64, chrome, [0, 1.2, 0])
      box([1.45, 0.13, 1.23], chrome, [0, 1.49, 0.02], 0.055)
      box([1.55, 0.28, 1.38], leather, [0, 1.67, 0.07], 0.12)
      box([1.42, 1.44, 0.2], chrome, [0, 2.27, -0.55], 0.09, [-0.12, 0, 0])
      box([1.34, 1.35, 0.26], leather, [0, 2.3, -0.45], 0.12, [-0.12, 0, 0])
      for (let x = -0.47; x <= 0.48; x += 0.235) {
        box([0.016, 1.06, 0.016], piping, [x, 2.31, -0.304], 0.006, [-0.12, 0, 0])
        box([0.016, 0.014, 1.08], piping, [x, 1.814, 0.09], 0.005)
      }
      rod([-0.25, 2.9, -0.64], [-0.25, 3.23, -0.68])
      rod([0.25, 2.9, -0.64], [0.25, 3.23, -0.68])
      box([0.83, 0.38, 0.28], leather, [0, 3.15, -0.6], 0.1, [-0.1, 0, 0])
      for (const side of [-1, 1]) {
        rod([side * 0.86, 1.52, -0.35], [side * 0.86, 2.13, -0.35], 0.045)
        rod([side * 0.86, 1.52, 0.48], [side * 0.86, 2.13, 0.48], 0.045)
        box([0.22, 0.12, 1.19], chrome, [side * 0.86, 2.13, 0.05], 0.045)
        box([0.25, 0.13, 1.17], leather, [side * 0.86, 2.23, 0.05], 0.06)
        rod([side * 0.56, 1.5, 0.58], [side * 0.56, 0.83, 1.12], 0.04)
      }
      box([1.29, 0.09, 0.48], chrome, [0, 0.81, 1.15], 0.035)
      box([1.15, 0.03, 0.36], dark, [0, 0.875, 1.15], 0.015)
      for (let x = -0.48; x < 0.49; x += 0.12) box([0.025, 0.018, 0.3], chrome, [x, 0.895, 1.15], 0.005)
      rod([0.18, 0.4, 0], [0.65, 0.39, 0.35])
      box([0.3, 0.05, 0.13], dark, [0.65, 0.39, 0.35], 0.02)
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.16 }))
      ground.rotation.x = -Math.PI / 2; ground.position.y = 0.065; ground.receiveShadow = true
      scene.add(ground)
      const resize = () => {
        const width = host.clientWidth, height = host.clientHeight
        if (!width || !height) return
        renderer.setSize(width, height)
        camera.aspect = width / height
        camera.fov = width < 480 ? 40 : 34
        camera.updateProjectionMatrix()
        requestRender()
      }
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host); resize()
      intersectionObserver = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting; last = 0
        if (!visible) { cancelAnimationFrame(frame); frame = 0 } else requestRender()
      }, { threshold: 0.01 })
      intersectionObserver.observe(host)
      document.addEventListener('visibilitychange', onVisibility)
      controls.addEventListener('change', requestRender)
      controls.addEventListener('start', () => { playingRef.current = false; setPlaying(false) })
      actions.current = {
        toggle() { playingRef.current = !playingRef.current; setPlaying(playingRef.current); requestRender() },
        rotate(direction) {
          playingRef.current = false; setPlaying(false)
          camera.position.sub(target).applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * Math.PI / 6).add(target)
          controls.update(); requestRender()
        },
      }
      renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); cancelAnimationFrame(frame); setFailed(true) })
      renderer.render(scene, camera)
      setReady(true)
      requestRender()
    } catch (error) {
      console.warn('3D chair unavailable; showing the illustrated chair.', error.message)
      setFailed(true)
    }
    return () => {
      disposed = true; cancelAnimationFrame(frame)
      resizeObserver?.disconnect(); intersectionObserver?.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      controls?.dispose()
      const materials = new Set()
      scene.traverse(object => { object.geometry?.dispose(); if (object.material) materials.add(object.material); object.shadow?.dispose() })
      materials.forEach(material => material.dispose())
      environment?.dispose(); renderer?.dispose()
      if (renderer?.domElement.parentNode === host) host.removeChild(renderer.domElement)
      actions.current = {}
    }
  }, [reducedMotion])

  return <div className="chair-experience">
    <div ref={mount} className={`chair-canvas ${failed ? 'is-failed' : ''}`} />
    {(!ready || failed) && <ChairFallback />}
    {ready && !failed && <div className="chair-controls"><span>DRAG TO ROTATE</span><div><button onClick={() => actions.current.rotate(-1)} aria-label="Rotate chair left">←</button><button onClick={() => actions.current.toggle()} aria-label={playing ? 'Pause chair rotation' : 'Play chair rotation'} aria-pressed={playing}>{playing ? 'Ⅱ' : '▷'}</button><button onClick={() => actions.current.rotate(1)} aria-label="Rotate chair right">→</button></div></div>}
    {failed && <span className="chair-fallback-note">CHAIR ILLUSTRATION · 3D UNAVAILABLE ON THIS DEVICE</span>}
  </div>
}


