import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { PerspectiveCamera, Raycaster, Vector3 } from 'three'
import { prepareScissors } from '../../app/frontend/three/heroToolComposition.js'
import { disposeModel } from '../../app/frontend/three/clipperSceneModel.js'
import { craftCameraDistance, craftPortalFrame, fingerPortal, portalCameraDistance, projectFingerAperture } from '../../app/frontend/three/craftPortal.js'

const config={rootNode:'BarberScissors',halfA:'ScissorHalfA',halfB:'ScissorHalfB',pivot:'ScissorPivot',normalizedHeight:3.2}
async function loadShears() {
  const file=await readFile(new URL('../../public/models/abc-atelier-shears-01.glb',import.meta.url))
  const {scene}=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'')
  const shears=prepareScissors(scene,config)
  shears.halfA.rotation.z=.035;shears.halfB.rotation.z=-.035
  shears.rig.updateMatrixWorld(true)
  return shears
}
const inside=(point,polygon)=>{
  let result=false
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [x,y]=polygon[i],[xx,yy]=polygon[j]
    if((y>point[1])!==(yy>point[1])&&point[0]<(xx-x)*(point[1]-y)/(yy-y)+x)result=!result
  }
  return result
}

test('portal coordinates lie in the actual GLB hole, clear of metal and rubber',async()=>{
  const shears=await loadShears(), ray=new Raycaster(), direction=new Vector3(0,0,-1)
  for(let i=0;i<17;i++) {
    const angle=i/16*Math.PI*2
    const x=i===16?0:fingerPortal.radiusX*Math.cos(angle)
    const y=i===16?0:fingerPortal.radiusY*Math.sin(angle)
    const center=fingerPortal.center
    const point=new Vector3(center[0]+x*Math.cos(fingerPortal.tilt)-y*Math.sin(fingerPortal.tilt),center[1]+x*Math.sin(fingerPortal.tilt)+y*Math.cos(fingerPortal.tilt),center[2])
    shears.halfA.localToWorld(point)
    ray.set(point.add(new Vector3(0,0,3)),direction)
    assert.equal(ray.intersectObject(shears.rig,true).length,0,'the aperture must not reveal the studio through solid mesh')
  }
  disposeModel(shears.rig)
})

test('ring encloses every viewport corner before the camera passes its plane',async()=>{
  const shears=await loadShears()
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,1000],[1920,1080],[844,390]]) {
    const camera=new PerspectiveCamera(32,width/height,.002,80)
    const ring=shears.halfA.localToWorld(new Vector3(...fingerPortal.center))
    const frame=craftPortalFrame(.94)
    const distance=portalCameraDistance(craftCameraDistance(width/height,width<=700),frame)
    assert.ok(distance>camera.near)
    camera.position.copy(ring).add(new Vector3(0,0,distance));camera.lookAt(ring);camera.updateMatrixWorld(true)
    const polygon=projectFingerAperture(shears.halfA,camera)
    assert.ok(polygon.flat().every(Number.isFinite))
    for(const corner of [[0,0],[100,0],[100,100],[0,100]])assert.ok(inside(corner,polygon))
  }
  disposeModel(shears.rig)
})

test('straighten and aim finish before the tunnel; approach and handoff are reversible',()=>{
  assert.equal(craftPortalFrame(.24).straighten,1)
  assert.equal(craftPortalFrame(.43).aim,1)
  assert.equal(craftPortalFrame(.43).approach,0)
  assert.equal(craftPortalFrame(.94).pass,0)
  assert.ok(portalCameraDistance(12,craftPortalFrame(1))<0)
  assert.deepEqual(craftPortalFrame(-2),craftPortalFrame(0))
  assert.deepEqual(craftPortalFrame(2),craftPortalFrame(1))
  assert.deepEqual(craftPortalFrame(NaN),craftPortalFrame(0))
  let previous=Infinity
  for(let p=0;p<=1;p+=.01) {
    const distance=portalCameraDistance(12,craftPortalFrame(p))
    assert.ok(Number.isFinite(distance)&&distance<=previous)
    previous=distance
  }
})
