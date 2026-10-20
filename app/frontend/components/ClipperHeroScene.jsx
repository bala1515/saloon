import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js'
import { clipperPose, disposeModel, prepareClipper, validateClipperGlb } from '../three/clipperSceneModel.js'
import { heroComposition, heroScrollPose, prepareScissors, scissorsPose } from '../three/heroToolComposition.js'
import { openingFrame, paperCutPath } from '../three/salonOpening.js'
import { createPaperOpening } from '../three/PaperOpening.js'

/** Loads a real GLB only. This component never generates a substitute clipper mesh. */
export default function ClipperHeroScene({ config, skipOpening, paused, reduced, inView, onStatusChange, onOpeningPhaseChange }) {
  const host = useRef(null)
  const playback = useRef({ paused, reduced, inView, skipOpening })
  const status = useRef(onStatusChange)
  const openingStatus = useRef(onOpeningPhaseChange)
  const schedule = useRef(() => {})
  status.current = onStatusChange
  openingStatus.current = onOpeningPhaseChange

  useEffect(() => {
    playback.current = { paused, reduced, inView, skipOpening }
    schedule.current()
  }, [paused, reduced, inView, skipOpening])

  useEffect(() => {
    const element = host.current
    if (!element || !config.modelUrl) return
    const hero=element.closest('.cinematic-hero')
    let scrollProgress=Number(hero?.dataset.sceneProgress)||0
    function scrollChange(event) {
      scrollProgress=event.detail.progress
      requestFrame()
    }
    hero?.addEventListener('salon:hero-scroll',scrollChange)
    const controller = new AbortController()
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    const loader = new GLTFLoader()
    let renderer, importedScene, importedScissors, clipper, scissors, environment, resizeObserver, sweepLight
    let ground, groundGeometry, groundMaterial, shadowKey, paper
    let openingPhase, opening
    let width=1, height=1, slot=null
    let frame = 0, previous = 0, elapsed = 0, loaded = false, disposed = false
    let particleGeometry, particleMaterial, particles
    const bladeCenter = new THREE.Vector3(), sweepPosition = new THREE.Vector3()
    const introRotation=new THREE.Quaternion(), restingRotation=new THREE.Quaternion(), cutPosition=new THREE.Vector3()

    function canRender() { return loaded && !disposed && playback.current.inView && !document.hidden }
    function requestFrame() {
      if (canRender() && !frame) frame = requestAnimationFrame(draw)
    }
    function updateComposition() {
      opening=openingFrame(playback.current.reduced?0:elapsed,playback.current.reduced||playback.current.skipOpening||!scissors)
      if(opening.phase!==openingPhase) {
        openingPhase=opening.phase
        openingStatus.current?.(openingPhase)
      }
      element.dataset.openingPhase=opening.phase
      element.dataset.cutStage=opening.travel<.3?'start':opening.travel<.7?'middle':'end'
      element.dataset.paperStage=opening.peel===0?'cut':opening.peel<.75?'curl':'depart'
      const seconds = playback.current.reduced ? 0 : opening.heroTime
      const pose = clipperPose(seconds)
      const reveal = opening.zoom
      const composition = heroComposition(seconds,width,height,slot)
      const viewpoint = composition.camera
      const travel=heroScrollPose(playback.current.reduced?0:scrollProgress,width<=800)
      // Blend only once the opening push-in has settled; scrolling never replays it.
      const blend=opening.zoom
      const zoom=1+(1-opening.zoom)*.65
      // Track the product's screen anchor while dollying: keep the left copy clear.
      const anchorX=composition.clipper.x*(1-travel.dolly)*blend
      const anchorY=composition.clipper.y*(1-travel.dolly)*blend
      camera.position.set(viewpoint.x+anchorX+travel.orbit*blend, viewpoint.y+anchorY+travel.lift*blend, viewpoint.z*zoom*THREE.MathUtils.lerp(1,travel.dolly,blend))
      camera.lookAt(anchorX+travel.orbit*blend*.65, anchorY+travel.lift*blend*.5, 0)
      element.dataset.cameraDistance=camera.position.z.toFixed(3)
      element.dataset.scrollProgress=travel.progress.toFixed(3)
      clipper.rig.rotation.set(pose.x+travel.tilt*blend, pose.y - (1 - reveal) * 0.35+travel.turn*blend, pose.z + (1 - reveal) * 0.06)
      clipper.rig.position.set(composition.clipper.x*zoom,(composition.clipper.y + (playback.current.reduced ? 0 : Math.sin(seconds * .28) * .028))*zoom,composition.clipper.z)
      clipper.rig.updateMatrixWorld(true)
      bladeCenter.copy(clipper.bladeCenter).applyMatrix4(clipper.rig.matrixWorld)
      sweepPosition.copy(clipper.bladeCenter)
      sweepPosition.x += (pose.sweep - 0.5) * Math.max(clipper.bladeSize.x * 1.5, 0.35)
      sweepPosition.z += 0.55
      sweepPosition.applyMatrix4(clipper.rig.matrixWorld)
      sweepLight.position.copy(sweepPosition)
      sweepLight.lookAt(bladeCenter)
      if(scissors) {
        const shearPose=scissorsPose(seconds,playback.current.reduced)
        const cutting=opening.phase==='cutting'
        const progress=opening.return
        const viewHeight=2*Math.tan(THREE.MathUtils.degToRad(17))*(camera.position.z-.8)
        const viewWidth=viewHeight*width/height
        const introScale=Math.min(340,height*.42,width*.62)/height*viewHeight/config.scissors.normalizedHeight
        const cut=paperCutPath(opening.cut)
        introRotation.setFromEuler(new THREE.Euler(-.12,.10,-Math.atan(cut.dx*width/height)))
        restingRotation.setFromEuler(new THREE.Euler(shearPose.x,shearPose.y-travel.turn*.35,shearPose.z+composition.scissors.angleOffset-travel.tilt))
        cutPosition.copy(scissors.cutPoint).multiplyScalar(introScale).applyQuaternion(introRotation)
        cutPosition.negate().add(new THREE.Vector3((cut.x-.5)*viewWidth,(cut.y-.5)*viewHeight,.8))
        scissors.rig.position.copy(cutPosition).lerp(new THREE.Vector3(composition.scissors.x*zoom-travel.separation,composition.scissors.y*zoom+travel.lift,composition.scissors.z-travel.separation),progress)
        scissors.rig.scale.setScalar(THREE.MathUtils.lerp(introScale,composition.scissors.scale,progress))
        scissors.rig.quaternion.copy(introRotation).slerp(restingRotation,progress)
        scissors.halfA.rotation.z=THREE.MathUtils.lerp(opening.opening,shearPose.halfA,progress)
        scissors.halfB.rotation.z=-scissors.halfA.rotation.z
        scissors.rig.traverse(object=>object.layers.set(cutting?2:0))
      }
      if(opening.peel<1) paper.update(opening,elapsed)
      ground.position.y=composition.floorY
      shadowKey.target.position.set(composition.clipper.x,composition.clipper.y,0)
      particles.rotation.y = playback.current.reduced ? 0 : elapsed * 0.012
      particles.position.set(composition.clipper.x,composition.clipper.y+(playback.current.reduced ? 0 : Math.sin(elapsed * .18)*.06),-.5-travel.separation*2)
    }
    function draw(now) {
      frame = 0
      if (!canRender()) { previous = 0; return }
      const moving = !playback.current.paused && !playback.current.reduced
      if (moving && previous) elapsed += Math.min((now - previous) / 1000, 0.05)
      previous = moving ? now : 0
      updateComposition()
      renderScene()
      if (moving) requestFrame()
    }
    function renderScene() {
      renderer.clear()
      camera.layers.set(0);renderer.render(scene,camera)
      if(opening.peel<1) {
        paper.render(renderer)
        renderer.clearDepth()
        camera.layers.set(2);renderer.render(scene,camera)
        camera.layers.set(0)
      }
    }
    function resize() {
      if (!renderer) return
      width = element.clientWidth; height = element.clientHeight
      if (!width || !height) return
      const compact = window.matchMedia('(max-width: 800px)').matches
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.25 : 1.75))
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      paper?.resize(width,height)
      const stage=element.closest('.cinematic-stage'), stageBounds=stage?.getBoundingClientRect()
      const headline=stage?.querySelector('h1')?.getBoundingClientRect()
      const controls=stage?.querySelector('.cinematic-bottom')?.getBoundingClientRect()
      slot=headline&&controls?{top:Math.max(height*.43,headline.bottom-stageBounds.top-30),bottom:controls.top-stageBounds.top-28}:null
      particleGeometry?.setDrawRange(0, compact ? 6 : 12)
      if(shadowKey) {
        const mapSize=compact?512:1024
        if(shadowKey.shadow.mapSize.x!==mapSize) {
          shadowKey.shadow.map?.dispose();shadowKey.shadow.map=null
          shadowKey.shadow.mapSize.set(mapSize,mapSize)
        }
      }
      requestFrame()
    }
    function visibilityChange() {
      previous = 0
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0 } else requestFrame()
    }
    function release() {
      if (disposed) return
      disposed = true
      controller.abort(); cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      hero?.removeEventListener('salon:hero-scroll',scrollChange)
      document.removeEventListener('visibilitychange', visibilityChange)
      renderer?.domElement.removeEventListener('webglcontextlost', contextLost)
      disposeModel([clipper?.rig, importedScene, scissors?.rig, importedScissors].filter(Boolean))
      particleGeometry?.dispose(); particleMaterial?.dispose(); environment?.dispose()
      groundGeometry?.dispose();groundMaterial?.dispose();shadowKey?.shadow.dispose()
      paper?.dispose()
      renderer?.dispose()
      renderer?.forceContextLoss()
      if (renderer?.domElement.parentNode === element) element.removeChild(renderer.domElement)
      schedule.current = () => {}
    }
    function fail(error) {
      if (disposed) return
      status.current('error')
      openingStatus.current?.('complete')
      console.warn('[clipper-hero] 3D unavailable; using the text-only fallback:', error.message)
      release()
    }
    function contextLost(event) {
      event.preventDefault()
      fail(new Error('WebGL context was lost.'))
    }

    async function loadAsset(url) {
      const request=new AbortController()
      const abort=()=>request.abort()
      controller.signal.addEventListener('abort',abort,{once:true})
      const timeout=setTimeout(abort,15000)
      try {
        const response=await fetch(url,{signal:request.signal})
        if(!response.ok) throw new Error(`Model request failed (${response.status}): ${url}`)
        const buffer=await response.arrayBuffer()
        if(disposed) return null
        validateClipperGlb(buffer)
        const resourcePath=new URL('.',new URL(url,window.location.href)).href
        const gltf=await loader.parseAsync(buffer,resourcePath)
        if(disposed||request.signal.aborted) {
          disposeModel(gltf.scene)
          if(disposed) return null
          throw new Error('The model exceeded the loading timeout.')
        }
        return gltf.scene
      } finally {
        clearTimeout(timeout);controller.signal.removeEventListener('abort',abort)
      }
    }

    async function load() {
      status.current('loading')
      try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
        renderer.setClearColor(0x000000, 0)
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.ACESFilmicToneMapping
        renderer.toneMappingExposure = 0.82
        renderer.autoClear=false
        renderer.shadowMap.enabled=true
        renderer.shadowMap.type=THREE.PCFShadowMap
        renderer.domElement.setAttribute('aria-hidden', 'true')
        renderer.domElement.addEventListener('webglcontextlost', contextLost)
        element.appendChild(renderer.domElement)
        element.dataset.scissorsStatus='loading'
        // Both assets share one loader/renderer; a secondary failure keeps the trimmer.
        await Promise.all([
          loadAsset(config.modelUrl).then(value=>{importedScene=value}),
          loadAsset(config.scissors.modelUrl).then(value=>{importedScissors=value}).catch(error=>{
            if(!disposed) {element.dataset.scissorsStatus='error';console.warn('[clipper-hero] Scissors unavailable; retaining the trimmer:',error.message)}
          }),
        ])
        if(disposed) return
        clipper = prepareClipper(importedScene, config)
        scene.add(clipper.rig)
        if(importedScissors) {
          try {
            scissors=prepareScissors(importedScissors,config.scissors)
            scene.add(scissors.rig);element.dataset.scissorsStatus='ready'
          } catch(error) {
            element.dataset.scissorsStatus='error'
            console.warn('[clipper-hero] Scissors validation failed; retaining the trimmer:',error.message)
            disposeModel(importedScissors);importedScissors=null
          }
        }
        for(const model of [clipper.model,scissors?.model].filter(Boolean)) model.traverse(object=>{
          if(object.isMesh){object.castShadow=true;object.receiveShadow=true}
        })
        // Reuse the existing project's PMREM/RoomEnvironment approach for metal reflections.
        const generator = new THREE.PMREMGenerator(renderer)
        const room = new RoomEnvironment()
        try { environment = generator.fromScene(room, 0.04) } finally { room.dispose(); generator.dispose() }
        scene.environment = environment.texture
        scene.environmentIntensity = 0.58
        scene.add(new THREE.HemisphereLight(0xfff6e5, 0x1d211c, 0.7))
        RectAreaLightUniformsLib.init()
        const softbox = new THREE.RectAreaLight(0xfff7e8, 2.2, 3.8, 5)
        softbox.position.set(-1.8, 3.5, 4); softbox.lookAt(1.5, 0, 0); scene.add(softbox)
        const strip = new THREE.RectAreaLight(0xe5efff,1.4,1,4)
        strip.position.set(4,1.5,3);strip.lookAt(1.5,0,0);scene.add(strip)
        const rim = new THREE.DirectionalLight(0xd3b887, 1.7)
        rim.position.set(3.5, 2.5, -2); scene.add(rim)
        sweepLight = new THREE.RectAreaLight(0xffe4ae, 4, 0.035, Math.max(clipper.bladeSize.y * 1.3, 0.16))
        scene.add(sweepLight)
        shadowKey=new THREE.DirectionalLight(0xffedcf,.85)
        shadowKey.position.set(-3,6,5);shadowKey.castShadow=true
        shadowKey.shadow.mapSize.set(1024,1024)
        Object.assign(shadowKey.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:25})
        shadowKey.shadow.camera.updateProjectionMatrix()
        shadowKey.shadow.normalBias=.025;shadowKey.shadow.bias=-.0003
        shadowKey.shadow.radius=3
        scene.add(shadowKey,shadowKey.target)
        groundGeometry=new THREE.PlaneGeometry(16,16)
        groundMaterial=new THREE.ShadowMaterial({opacity:.22})
        ground=new THREE.Mesh(groundGeometry,groundMaterial)
        ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground)
        const positions = new Float32Array(12 * 3)
        for (let index = 0; index < 12; index++) {
          positions[index * 3] = Math.sin(index * 7.13) * 1.6
          positions[index * 3 + 1] = Math.cos(index * 4.91) * 2.2
          positions[index * 3 + 2] = -1.2 + Math.sin(index * 3.71) * 0.4
        }
        particleGeometry = new THREE.BufferGeometry()
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        particleMaterial = new THREE.PointsMaterial({ color: 0xc4a878, size: 0.015, transparent: true, opacity: 0.18, depthWrite: false })
        particles = new THREE.Points(particleGeometry, particleMaterial)
        scene.add(particles)
        // The ivory cut and the same articulated scissors share this renderer.
        scene.traverse(object=>{if(object.isLight)object.layers.enable(2)})
        paper=createPaperOpening(element)
        elapsed=0
        loaded = true
        resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element)
        document.addEventListener('visibilitychange', visibilityChange)
        schedule.current = requestFrame
        resize()
        // Paint once before exposing the scene, even if the tab/hero starts offscreen.
        updateComposition()
        renderScene()
        status.current('ready')
        requestFrame()
      } catch (error) { fail(error) }
    }
    load()
    return release
  }, [config])

  return <div ref={host} className="clipper-hero-viewport" aria-hidden="true" />
}
