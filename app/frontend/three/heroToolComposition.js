import { Box3, Group, MathUtils, Vector3 } from 'three'
import { framingDistance } from './clipperSceneModel.js'

/** Scroll is a camera/object move, independent of the opening and idle clocks. */
export function heroScrollPose(progress, compact = false) {
  const p=MathUtils.clamp(Number.isFinite(progress)?progress:0,0,1)
  const eased=p*p*(3-2*p)
  return {
    progress:p,
    dolly:1-eased*(compact?.055:.24),
    orbit:eased*(compact?.10:.50),
    lift:eased*(compact?.04:.20),
    turn:eased*(compact?.28:.90),
    tilt:eased*(compact?.04:.12),
    separation:eased*(compact?.06:.52),
  }
}
export function scissorsPose(seconds, reduced = false) {
  const opening = reduced ? .075 : .035 + (Math.sin(seconds * .65 - .5) + 1) * .055
  return { halfA: opening, halfB: -opening, x: -.10, y: -.20 + (reduced ? 0 : Math.sin(seconds*.17)*.10), z: -.53 + (reduced ? 0 : Math.sin(seconds*.14)*.025) }
}

export function prepareScissors(scene, config) {
  const model=scene.getObjectByName(config.rootNode)
  if(!model) throw new Error(`Scissors GLB is missing ${config.rootNode}.`)
  const halfA=model.getObjectByName(config.halfA), halfB=model.getObjectByName(config.halfB)
  const pivot=model.getObjectByName(config.pivot)
  if(!halfA || !halfB || !pivot) throw new Error('Scissors need two articulated halves and a separate center pivot.')
  if(halfA.position.length()>.0001 || halfB.position.length()>.0001) throw new Error('Scissors half origins must share the central pivot.')
  const bounds=new Box3().setFromObject(model), size=bounds.getSize(new Vector3())
  if(bounds.isEmpty() || !size.toArray().every(Number.isFinite) || size.y<=0) throw new Error('Scissors have invalid geometry bounds.')
  scene.updateMatrixWorld(true)
  const transform=model.matrixWorld.clone();model.removeFromParent()
  transform.decompose(model.position,model.quaternion,model.scale)
  const normalizer=new Group();normalizer.add(model)
  const scale=config.normalizedHeight/size.y
  normalizer.scale.setScalar(scale)
  normalizer.position.copy(bounds.getCenter(new Vector3())).multiplyScalar(-scale)
  const rig=new Group();rig.name='ScissorsHeroRig';rig.add(normalizer)
  rig.updateMatrixWorld(true)
  const cutPoint=halfA.localToWorld(new Vector3(0,1.4,0))
  return {rig,model,halfA,halfB,pivot,cutPoint}
}

/** One full-width camera. Move the objects through its shared world, not DOM columns. */
export function heroComposition(seconds, width, height, slot = null) {
  const aspect=width/height, portrait=width<=650, tablet=width>650&&width<=1000
  const tan=Math.tan(MathUtils.degToRad(17))
  let distance=framingDistance(aspect,4.4)
  if(portrait) {
    const safeHeight=slot ? Math.max(170,slot.bottom-slot.top) : height*.36
    distance=Math.max(distance,3.6*height/safeHeight/(2*tan),4.5/(2*tan*aspect))
  }
  const drift=1.025+Math.sin(seconds*.08)*.012
  distance*=drift
  const viewHeight=2*tan*distance, viewWidth=viewHeight*aspect
  const anchor=portrait?(width<370?.85:.80):.70
  const centerY=portrait?(slot?(slot.top+slot.bottom)/(2*height):.69):.51
  const anchorX=(anchor-.5)*viewWidth
  // Allow a small overlap at the handle while keeping the long diagonal tips in frame.
  const desktopSeparation=Math.min(1.52,viewWidth*.48*(1+.65/distance)-anchorX-.85)
  return {
    camera:{x:Math.sin(seconds*.09)*.04,y:Math.sin(seconds*.07)*.02,z:distance},
    clipper:{x:anchorX,y:(.5-centerY)*viewHeight,z:.10},
    scissors:{x:anchorX+(portrait?(width<370?.30:.50):tablet?.65:desktopSeparation),y:(.5-centerY)*viewHeight+(portrait?-1.15:.30),z:-.65,scale:portrait?.70:tablet?.82:1,angleOffset:portrait?.28:0},
    floorY:portrait?( .5-centerY)*viewHeight-2.40:-2.08,
  }
}
