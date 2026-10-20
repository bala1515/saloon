import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Box3, Group, Vector3 } from 'three'
import { clipperHeroConfig } from '../../app/frontend/three/clipperHeroConfig.js'
import { disposeModel, validateClipperGlb } from '../../app/frontend/three/clipperSceneModel.js'
import { heroComposition, heroScrollPose, prepareScissors, scissorsPose } from '../../app/frontend/three/heroToolComposition.js'
import { heroReveal, revealProgress } from '../../app/frontend/three/heroReveal.js'

test('actual scissors binary passes integrity and GLTFLoader checks',async()=>{
  const file=await readFile(new URL('../../public/models/abc-atelier-shears-01.glb',import.meta.url))
  const metadata=JSON.parse(await readFile(new URL('../../public/models/abc-atelier-shears-01.asset.json',import.meta.url),'utf8'))
  assert.equal(createHash('sha256').update(file).digest('hex'),metadata.sha256)
  const buffer=file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength)
  validateClipperGlb(buffer)
  const {scene}=await new GLTFLoader().parseAsync(buffer,'')
  const shears=prepareScissors(scene,clipperHeroConfig.scissors)
  assert.equal(shears.model.name,'BarberScissors')
  assert.equal(shears.pivot.name,'ScissorPivot')
  let meshes=0,triangles=0
  shears.model.traverse(o=>{if(o.isMesh){meshes++;triangles+=o.geometry.attributes.position.count/3}})
  assert.equal(meshes,metadata.meshes);assert.equal(triangles,metadata.triangles)
  shears.rig.updateMatrixWorld(true)
  const closedHeight=new Box3().setFromObject(shears.rig).getSize(new Vector3()).y
  assert.ok(Math.abs(closedHeight-clipperHeroConfig.scissors.normalizedHeight)<1e-5)
  // Opening changes blade/ring endpoints without moving either half's hinge origin.
  let oldTip=null,tipMoved=false
  for(const seconds of [0,3,7,12]) {
    const pose=scissorsPose(seconds)
    shears.halfA.rotation.z=pose.halfA;shears.halfB.rotation.z=pose.halfB
    shears.rig.updateMatrixWorld(true)
    assert.ok(shears.halfA.getWorldPosition(new Vector3()).distanceTo(shears.halfB.getWorldPosition(new Vector3()))<1e-8)
    assert.ok(shears.halfA.getWorldPosition(new Vector3()).distanceTo(shears.pivot.getWorldPosition(new Vector3()))<1e-8)
    const tip=shears.halfA.localToWorld(new Vector3(0,2.38,0))
    if(oldTip&&tip.distanceTo(oldTip)>.001) tipMoved=true
    oldTip=tip
  }
  assert.ok(tipMoved)
  disposeModel([shears.rig,scene])
})

test('rejects non-articulated placeholders',()=>{
  const scene=new Group();scene.name='BarberScissors'
  assert.throws(()=>prepareScissors(scene,clipperHeroConfig.scissors),/articulated/)
})

test('gentle opening stays within a realistic small angle and reduced motion is static',()=>{
  for(let t=0;t<100;t+=.1){
    const pose=scissorsPose(t)
    assert.ok(pose.halfA>=.035&&pose.halfA<=.1451)
    assert.equal(pose.halfA,-pose.halfB)
  }
  assert.deepEqual(scissorsPose(0,true),scissorsPose(100,true))
})

test('both tools stay in one camera composition with the scissors behind the trimmer',()=>{
  for(const [w,h] of [[1440,1000],[1920,1080],[800,844],[390,844],[320,710]]) {
    const layout=heroComposition(5,w,h,w<=650?{top:h*.53,bottom:h*.88}:null)
    assert.ok(Number.isFinite(layout.camera.z)&&layout.camera.z>0)
    assert.ok(layout.scissors.z<layout.clipper.z)
    assert.ok(layout.scissors.x>layout.clipper.x)
    assert.ok(layout.scissors.scale<=1)
    assert.ok(layout.floorY<layout.clipper.y-1.8)
  }
})

test('shared reveal clock staggers tools and settles assets that arrive after the intro',()=>{
  const between=(heroReveal.firstLine+heroReveal.secondLine)/2
  assert.equal(revealProgress(0,heroReveal.firstLine),0)
  assert.equal(revealProgress(between,heroReveal.secondLine),0)
  assert.ok(revealProgress(between,heroReveal.firstLine)>0)
  assert.equal(revealProgress(10,heroReveal.secondLine),1)
})

test('scroll camera stays bounded, reversible and gentler on narrow screens',()=>{
  const start=heroScrollPose(0), end=heroScrollPose(1), mobile=heroScrollPose(1,true)
  assert.equal(start.dolly,1)
  assert.equal(start.turn,0)
  assert.ok(end.dolly>=.75&&end.dolly<.9)
  assert.ok(mobile.dolly>end.dolly&&mobile.turn<end.turn)
  let previous=1
  for(let step=0;step<=100;step++) {
    const pose=heroScrollPose(step/100)
    assert.ok(Object.values(pose).every(Number.isFinite))
    assert.ok(pose.dolly<=previous)
    previous=pose.dolly
  }
  assert.deepEqual(heroScrollPose(-5),start)
  assert.deepEqual(heroScrollPose(5),end)
  assert.deepEqual(heroScrollPose(Number.NaN),start)
})
