import { Box3, Group, MathUtils, Vector3 } from 'three'

/** Dispose resources owned by a loaded scene, including decoded GLTF ImageBitmaps. */
export function disposeModel(root) {
  const geometries = new Set(), materials = new Set(), textures = new Set(), images = new Set()
  for (const item of [].concat(root || [])) item.traverse(object => {
    if (object.geometry) geometries.add(object.geometry)
    for (const material of [].concat(object.material || [])) materials.add(material)
  })
  materials.forEach(material => {
    Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value) })
    // Imported standard/physical glTF materials do not require custom shader uniforms.
  })
  textures.forEach(texture => {
    if (texture.source?.data) images.add(texture.source.data)
    texture.dispose()
  })
  images.forEach(image => { if (typeof image.close === 'function') image.close() })
  geometries.forEach(geometry => geometry.dispose())
  materials.forEach(material => material.dispose())
}

export function prepareClipper(scene, config) {
  const model = scene.getObjectByName(config.rootNode)
  if (!model) throw new Error(`The GLB needs a clipper root named ${config.rootNode}.`)
  const blade = model.getObjectByName(config.bladeNode)
  if (!blade) throw new Error(`The GLB needs a separate blade node named ${config.bladeNode}.`)
  // Retain parent transforms when extracting the single clipper from the imported scene.
  scene.updateMatrixWorld(true)
  const transform = model.matrixWorld.clone()
  model.removeFromParent()
  transform.decompose(model.position, model.quaternion, model.scale)
  const orientation = new Group()
  orientation.rotation.set(...config.rotation)
  orientation.add(model)
  const normalizer = new Group()
  normalizer.add(orientation)
  normalizer.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(normalizer)
  const size = bounds.getSize(new Vector3())
  if (bounds.isEmpty() || !size.toArray().every(Number.isFinite) || size.y < 0.00001) {
    // Put the model back so the caller can dispose the complete imported scene on error.
    scene.add(model)
    throw new Error('The clipper model has empty or invalid geometry bounds.')
  }
  const scale = config.normalizedHeight / size.y
  normalizer.scale.setScalar(scale)
  normalizer.position.copy(bounds.getCenter(new Vector3())).multiplyScalar(-scale)
  const rig = new Group()
  rig.name = 'ClipperHeroRig'
  rig.add(normalizer)
  rig.updateMatrixWorld(true)
  const bladeBounds = new Box3().setFromObject(blade)
  const bladeSize = bladeBounds.getSize(new Vector3())
  if (bladeBounds.isEmpty() || !bladeSize.toArray().every(Number.isFinite)) {
    scene.add(model)
    throw new Error('The blade node needs actual, modeled blade and teeth geometry.')
  }
  const bladeCenter = bladeBounds.getCenter(new Vector3())
  // Preserve authored textures, normals, geometry and material separation.
  // Only well-known, explicitly named surfaces get the requested material treatment.
  model.traverse(object => {
    for (const material of [].concat(object.material || [])) {
      if (!material.isMeshStandardMaterial && !material.isMeshPhysicalMaterial) continue
      if (material.name === config.materialNames.housing) {
        material.color.set('#17191b'); material.metalness = 0.85; material.roughness = 0.3
      } else if (material.name === config.materialNames.blade) {
        material.color.set('#c9c9c3'); material.metalness = 1; material.roughness = 0.19
      } else if (material.name === config.materialNames.trim) {
        material.color.set('#bea77b'); material.metalness = 1; material.roughness = 0.25
      }
    }
  })
  return { rig, model, bladeCenter, bladeSize }
}

/** Small bounded movement keeps the model in its reserved right-hand composition. */
export function clipperPose(seconds) {
  return {
    x: -0.045,
    y: -0.28 + Math.sin(seconds * 0.2) * 0.16,
    z: 0.10 + Math.sin(seconds * 0.16) * 0.012,
    sweep: (Math.sin(seconds * 0.75) + 1) / 2,
  }
}

export function framingDistance(aspect, height, fov = 34, margin = 1.2) {
  const vertical = height / (2 * Math.tan(MathUtils.degToRad(fov / 2)))
  // Conservative width budget includes the clipper's tilt and shallow rotation.
  const horizontal = height * 0.43 / (2 * Math.tan(MathUtils.degToRad(fov / 2)) * Math.max(aspect, 0.1))
  return Math.max(vertical, horizontal) * margin
}

/** A very small studio-camera drift, with extra distance to retain the fit margin. */
export function clipperCameraPose(seconds, aspect, height) {
  return {
    x: Math.sin(seconds * 0.09) * 0.06,
    y: 0.03 + Math.sin(seconds * 0.07) * 0.025,
    z: framingDistance(aspect, height) * (1.025 + Math.sin(seconds * 0.08) * 0.012),
  }
}

export function validateClipperGlb(buffer) {
  if (buffer.byteLength < 20) throw new Error('The model is not a complete binary glTF file.')
  const header = new DataView(buffer)
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2) {
    throw new Error('Expected binary glTF 2.0; an HTML/login response is not a model.')
  }
  if (header.getUint32(8, true) !== buffer.byteLength) {
    throw new Error('The model download is truncated or has an invalid declared length.')
  }
  if (header.getUint32(16, true) !== 0x4e4f534a) {
    throw new Error('The GLB is missing its required first JSON chunk.')
  }
}
