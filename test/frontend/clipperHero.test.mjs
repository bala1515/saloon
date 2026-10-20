import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { BufferAttribute, BufferGeometry, Group, Mesh, MeshStandardMaterial, Texture, Box3, Vector3 } from 'three'
import { clipperHeroConfig } from '../../app/frontend/three/clipperHeroConfig.js'
import { clipperCameraPose, clipperPose, disposeModel, framingDistance, prepareClipper, validateClipperGlb } from '../../app/frontend/three/clipperSceneModel.js'

// Small non-rendered test fixtures exercise the asset contract, not visual model quality.
function fixture({ blade = true, empty = false } = {}) {
  const scene = new Group(), model = new Group()
  model.name = 'BarberClipper'
  scene.add(model)
  const points = empty ? [] : [-0.5, -2, -0.2, 0.5, -2, 0.2, 0, 2, 0]
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(points), 3))
  const material = new MeshStandardMaterial({ color: '#eeeeee' })
  material.name = 'Housing_BlackMetal'
  model.add(new Mesh(geometry, material))
  if (blade) {
    const bladeGeometry = new BufferGeometry()
    bladeGeometry.setAttribute('position', new BufferAttribute(new Float32Array([-0.45, 1.8, 0, 0.45, 1.8, 0, 0, 2, 0]), 3))
    const node = new Mesh(bladeGeometry, new MeshStandardMaterial())
    node.name = 'Blade'; model.add(node)
  }
  return { scene, model, geometry, material }
}

test('the original GLB passes integrity checks and loads through the actual GLTFLoader', async () => {
  assert.equal(clipperHeroConfig.modelUrl, '/models/abc-atelier-01.glb')
  const file = await readFile(new URL('../../public/models/abc-atelier-01.glb', import.meta.url))
  const report = JSON.parse(await readFile(new URL('../../public/models/abc-atelier-01.asset.json', import.meta.url), 'utf8'))
  assert.equal(createHash('sha256').update(file).digest('hex'), report.sha256)
  const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength)
  validateClipperGlb(buffer)
  const loaded = await new GLTFLoader().parseAsync(buffer, '')
  const prepared = prepareClipper(loaded.scene, clipperHeroConfig)
  assert.ok(prepared.bladeSize.x > .8)
  let meshes = 0, triangles = 0
  prepared.model.traverse(o=>{if(o.isMesh) { meshes++; triangles += o.geometry.attributes.position.count / 3 }})
  assert.equal(meshes, report.meshes)
  assert.equal(triangles, report.triangles)
  assert.ok(triangles > 40000 && triangles < 60000)
  disposeModel([prepared.rig, loaded.scene])
})

test('rejects missing clipper root and blade instead of making substitute geometry', () => {
  assert.throws(() => prepareClipper(new Group(), clipperHeroConfig), /BarberClipper/)
  const item = fixture({ blade: false })
  assert.throws(() => prepareClipper(item.scene, clipperHeroConfig), /Blade/)
  disposeModel(item.scene)
})

test('rejects empty clipper bounds and keeps the model available for cleanup', () => {
  const item = fixture({ blade: false, empty: true })
  const blade = new Group(); blade.name = 'Blade'; item.model.add(blade)
  assert.throws(() => prepareClipper(item.scene, clipperHeroConfig), /empty or invalid/)
  assert.equal(item.model.parent, item.scene)
  disposeModel(item.scene)
})

test('rejects an empty blade even when the housing has geometry', () => {
  const item = fixture({ blade: false })
  const blade = new Group(); blade.name = 'Blade'; item.model.add(blade)
  assert.throws(() => prepareClipper(item.scene, clipperHeroConfig), /modeled blade/)
  assert.equal(item.model.parent, item.scene)
  disposeModel(item.scene)
})

test('centers and normalizes imported geometry while preserving the mesh', () => {
  const item = fixture()
  item.model.position.set(10, 2, 0)
  const prepared = prepareClipper(item.scene, clipperHeroConfig)
  prepared.rig.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(prepared.rig)
  assert.ok(Math.abs(bounds.getSize(new Vector3()).y - 3.6) < 1e-5)
  assert.ok(bounds.getCenter(new Vector3()).length() < 1e-5)
  assert.equal(prepared.model, item.model)
  assert.equal(item.model.children[0].geometry, item.geometry)
  assert.equal(item.material.metalness, 0.85)
  assert.ok(prepared.bladeCenter.y > 1)
  disposeModel(prepared.rig)
})

test('rotation is slow and bounded and the blade reflection sweeps across its range', () => {
  let minimum = 1, maximum = 0
  for (let t = 0; t < 100; t += 0.1) {
    const pose = clipperPose(t)
    assert.ok(pose.y >= -0.441 && pose.y <= -0.119)
    assert.ok(pose.sweep >= 0 && pose.sweep <= 1)
    minimum = Math.min(minimum, pose.sweep); maximum = Math.max(maximum, pose.sweep)
  }
  assert.ok(minimum < 0.01 && maximum > 0.99)
  assert.ok(Math.abs(clipperPose(1).y - clipperPose(0).y) < 0.04)
})

test('portrait composition backs the camera away to prevent clipping', () => {
  assert.ok(framingDistance(0.32, 3.6) > framingDistance(1, 3.6))
  assert.ok(Number.isFinite(framingDistance(0, 3.6)))
})

test('camera drift stays outside the fit distance and moves gently', () => {
  for (const aspect of [0.3, 1, 1.7]) {
    for (let t = 0; t < 100; t += 0.5) {
      const pose = clipperCameraPose(t, aspect, 3.6)
      assert.ok(pose.z > framingDistance(aspect, 3.6))
      assert.ok(Math.abs(pose.x) <= 0.06 && Math.abs(pose.y - 0.03) <= 0.025)
    }
  }
})

test('rejects login HTML, short and truncated downloads before GLTFLoader', () => {
  assert.throws(() => validateClipperGlb(new TextEncoder().encode('<!DOCTYPE html><html>Log in to download</html>').buffer), /HTML\/login/)
  assert.throws(() => validateClipperGlb(new ArrayBuffer(0)), /complete/)
  const buffer = new ArrayBuffer(24), view = new DataView(buffer)
  view.setUint32(0, 0x46546c67, true); view.setUint32(4, 2, true)
  view.setUint32(8, 28, true)
  assert.throws(() => validateClipperGlb(buffer), /truncated/)
  view.setUint32(8, 24, true)
  assert.throws(() => validateClipperGlb(buffer), /JSON/)
})

test('disposes shared geometry, materials and textures once per model', () => {
  const item = fixture({ blade: false })
  const texture = new Texture()
  let closed = 0, textures = 0, geometries = 0, materials = 0
  texture.source.data = { close() { closed++ } }
  item.material.map = texture
  item.model.add(new Mesh(item.geometry, item.material))
  texture.addEventListener('dispose', () => textures++)
  item.geometry.addEventListener('dispose', () => geometries++)
  item.material.addEventListener('dispose', () => materials++)
  const extra = new Group()
  extra.add(new Mesh(item.geometry, item.material))
  disposeModel([item.scene, extra])
  assert.deepEqual([closed, textures, geometries, materials], [1, 1, 1, 1])
})
