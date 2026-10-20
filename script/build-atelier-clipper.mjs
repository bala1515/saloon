// Original ABC Atelier 01 product mesh. No downloaded geometry or raster textures.
// Run: node script/build-atelier-clipper.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// GLTFExporter uses this browser API to assemble its binary output; no DOM is needed.
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.() }) }
}

const root = new T.Group(); root.name = 'BarberClipper'
root.userData = { title: 'ABC Atelier 01', creator: 'Original project-authored mesh', license: 'CC0-1.0', version: 1 }
const body = new T.Group(); body.name = 'Housing'; root.add(body)
const blade = new T.Group(); blade.name = 'Blade'; root.add(blade)
const controls = new T.Group(); controls.name = 'Controls'; root.add(controls)
function metal(name, color, roughness, metalness = 1) {
  const material = new T.MeshPhysicalMaterial({ name, color, roughness, metalness, clearcoat:name==='Housing_BlackMetal'?.18:.05, clearcoatRoughness:.32 })
  return material
}
const titanium = metal('Housing_BlackMetal', '#17191b', 0.30, 0.85)
const rear = metal('Satin_Graphite', '#111417', 0.42, 0.65)
const grip = metal('Machined_Grip', '#23272b', 0.36, 0.8)
const steel = metal('Blade_Steel', '#c9c9c3', 0.19)
const groundSteel = metal('Ground_Cutting_Edge', '#e2e1d8', 0.24)
const gold = metal('Trim_Champagne', '#bea77b', 0.25)
const recess = metal('Recess_Interior', '#050709', 0.55, 0.25)
const indicator = new T.MeshStandardMaterial({ name: 'Status_Light', color: '#e2cd95', emissive: '#c4a878', emissiveIntensity: 0.35, roughness: 0.35 })

function add(parent, name, geometry, material, position = [0, 0, 0]) {
  const mesh = new T.Mesh(geometry, material); mesh.name = name
  mesh.position.set(...position); parent.add(mesh); return mesh
}
// Smooth, varying cross sections create the actual ergonomic shell rather than
// approximating the main body with boxes/cylinders. Cross sections are superellipses.
const stations = [
  [-1.85, .16, .11], [-1.82, .28, .18], [-1.7, .34, .22],
  [-1.3, .36, .235], [-.8, .39, .26], [-.2, .46, .29],
  [.4, .51, .30], [.83, .50, .275], [1.12, .44, .22], [1.3, .33, .15],
]
function profile(y) {
  let i = 0
  while (i < stations.length - 2 && y > stations[i + 1][0]) i++
  const a = stations[i], b = stations[i + 1]
  const t = T.MathUtils.clamp((y - a[0]) / (b[0] - a[0]), 0, 1)
  const before=stations[Math.max(0,i-1)],after=stations[Math.min(stations.length-1,i+2)]
  const span=b[0]-a[0]
  return [1,2].map(axis=>{
    const m0=(b[axis]-before[axis])/(b[0]-before[0])*span
    const m1=(after[axis]-a[axis])/(after[0]-a[0])*span
    return (2*t**3-3*t*t+1)*a[axis]+(t**3-2*t*t+t)*m0+(-2*t**3+3*t*t)*b[axis]+(t**3-t*t)*m1
  })
}
function loft(y0, y1, material, name, scale = 1, rings = 100) {
  const slices = 64, positions = [], indices = []
  for (let j = 0; j <= rings; j++) {
    const y = T.MathUtils.lerp(y0, y1, j / rings), [w, d] = profile(y)
    for (let i = 0; i <= slices; i++) {
      const a = i / slices * Math.PI * 2, c = Math.cos(a), s = Math.sin(a)
      positions.push(Math.sign(c) * Math.abs(c) ** .55 * w * scale, y, Math.sign(s) * Math.abs(s) ** .62 * d * scale)
    }
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < slices; i++) {
    const a = j * (slices + 1) + i, b = a + slices + 1
    indices.push(a, b, a + 1, b, b + 1, a + 1)
  }
  // End caps share the shell profile, with independent normals after indexing.
  for (const [ring, y, reverse] of [[0, y0, true], [rings, y1, false]]) {
    const center = positions.length / 3; positions.push(0, y, 0)
    for (let i = 0; i < slices; i++) {
      const a = ring * (slices + 1) + i
      indices.push(...(reverse ? [center, a, a + 1] : [center, a + 1, a]))
    }
  }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices); geometry.computeVertexNormals()
  return add(body, name, geometry, material)
}
loft(-1.85, 1.3, titanium, 'Ergonomic_Lofted_Shell')
loft(-1.85, -1.76, gold, 'Machined_Heel_Collar', 1.012, 8)
loft(1.16, 1.28, gold, 'Blade_Neck_Collar', 1.012, 12)

function line(parent, name, points, radius, material, radial = 5) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)))
  return add(parent, name, new T.TubeGeometry(curve, Math.max(12, points.length * 2), radius, radial, false), material)
}
function faceZ(x, y) {
  const [w, d] = profile(y)
  return d * Math.max(0, 1 - (Math.abs(x) / w) ** 3.6) ** (1 / 3.6)
}
// A fine casing seam follows the entire curved silhouette on both sides.
for (const side of [-1, 1]) {
  const points = Array.from({ length: 65 }, (_, i) => {
    const y = -1.72 + i / 64 * 2.83, [w] = profile(y)
    return [side * w * 1.002, y, .025]
  })
  line(body, `Shell_Seam_${side}`, points, .006, gold)
}
// Recessed, fitted grip panel follows the shell's curvature.
const panelPositions = [], panelIndices = []
for (let j = 0; j <= 50; j++) for (let i = 0; i <= 28; i++) {
  const y = -1.53 + j / 50 * 1.42, [w] = profile(y)
  const taper = .72 * Math.sin(Math.PI * (.06 + .88 * j / 50)) ** .14
  const x = (i / 28 * 2 - 1) * w * taper
  panelPositions.push(x, y, faceZ(x, y) + .006)
}
for (let j = 0; j < 50; j++) for (let i = 0; i < 28; i++) {
  const a = j * 29 + i, b = a + 29; panelIndices.push(a, a + 1, b, b, a + 1, b + 1)
}
const panel = new T.BufferGeometry(); panel.setAttribute('position', new T.Float32BufferAttribute(panelPositions, 3)); panel.setIndex(panelIndices); panel.computeVertexNormals()
add(body, 'Contoured_Grip_Inlay', panel, rear)
// Actual shallow machined ribs; individually shaped to the curved grip surface.
for (let j = 0; j < 35; j++) {
  const y = -1.43 + j * .035, [w] = profile(y)
  const points = Array.from({ length: 15 }, (_, i) => {
    const x = (i / 14 * 2 - 1) * w * .61
    return [x, y + x * .12, faceZ(x, y + x * .12) + .010]
  })
  line(body, `Grip_Flute_${j}`, points, .0028, grip, 4)
}

function outline(points) {
  const shape = new T.Shape(); shape.moveTo(...points[0])
  for (const p of points.slice(1)) shape.lineTo(...p)
  shape.closePath(); return shape
}
function plate(parent, name, points, depth, bevel, material, z = 0) {
  const geometry = new T.ExtrudeGeometry(outline(points), { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 12 })
  return add(parent, name, geometry, material, [0, 0, z])
}
function roundedRect(x, y, w, h, r) {
  const s = new T.Shape()
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s
}
function roundedPart(parent, name, x, y, w, h, r, z, depth, material) {
  return add(parent, name, new T.ExtrudeGeometry(roundedRect(x, y, w, h, r), { depth, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 3, steps: 1, curveSegments: 8 }), material, [0, 0, z])
}
// Separate blade mounting shoe, fixed blade and moving cutter with modeled teeth.
plate(blade, 'Blade_Mounting_Shoe', [[-.33,1.14],[.33,1.14],[.43,1.35],[.43,1.48],[-.43,1.48],[-.43,1.35]], .10, .015, recess, .12)
plate(blade, 'Fixed_Blade_Plate', [[-.48,1.3],[.48,1.3],[.53,1.4],[.53,1.62],[-.53,1.62],[-.53,1.4]], .045, .008, steel, .23)
plate(blade, 'Moving_Cutter_Plate', [[-.44,1.4],[.44,1.4],[.47,1.48],[.47,1.66],[-.47,1.66],[-.47,1.48]], .028, .006, groundSteel, .286)
for (let i = 0; i < 31; i++) {
  const x = -.50 + i / 30 * 1.0
  plate(blade, `Fixed_Tooth_${i}`, [[x-.012,1.59],[x+.012,1.59],[x+.010,1.85],[x+.006,1.91],[x-.006,1.91],[x-.010,1.85]], .038, .002, steel, .23)
}
for (let i = 0; i < 27; i++) {
  const x = -.445 + i / 26 * .89
  plate(blade, `Cutting_Tooth_${i}`, [[x-.012,1.63],[x+.012,1.63],[x+.008,1.80],[x-.008,1.80]], .022, .0015, groundSteel, .29)
}
// Grinding lines are geometry, not painted teeth or a blade photograph.
for (let i = 0; i < 38; i++) {
  const x = -.44 + i / 37 * .88
  line(blade, `Grinding_Line_${i}`, [[x,1.44,.318],[x,1.62,.318]], .0007, steel, 3)
}
function screw(parent, x, y, z, scale = 1) {
  const points = [[0,0],[.025,0],[.039,.007],[.043,.015],[.04,.025],[.025,.031],[0,.031]].map(([r,h])=>new T.Vector2(r*scale,h*scale))
  const head = add(parent, 'Countersunk_Screw', new T.LatheGeometry(points, 28), steel, [x,y,z])
  head.rotation.x = Math.PI / 2
  const slot = roundedPart(parent, 'Screw_Driver_Recess', x-.026*scale, y-.004*scale, .052*scale, .008*scale, .002*scale, z+.031*scale, .001, recess)
  return slot
}
screw(blade,-.27,1.455,.315); screw(blade,.27,1.455,.315)
screw(body,-.32,.85,.268,.75); screw(body,.32,.85,.268,.75)

// Tactile power slider, recess and a fine status indicator on the face.
roundedPart(controls, 'Switch_Recess', -.095,.12,.19,.38,.08,.299,.009,recess)
roundedPart(controls, 'Power_Slider', -.069,.22,.138,.19,.045,.312,.024,gold)
for (let i = 0; i < 4; i++) line(controls,'Switch_Grip', [[-.045,.25+i*.025,.343],[.045,.25+i*.025,.343]], .002, rear)
roundedPart(controls, 'Indicator_Recess', -.045,-1.61,.09,.026,.012,.23,.008,recess)
roundedPart(controls, 'Warm_Status_Indicator', -.022,-1.605,.044,.012,.005,.242,.003,indicator)

// Sculpted taper lever on the visible right edge, with a modeled pivot and finger pad.
const lever = plate(controls, 'Taper_Lever', [[.40,.65],[.48,.68],[.63,.49],[.65,.08],[.60,-.01],[.56,.04],[.56,.40],[.45,.51]], .065, .018, gold, .025)
screw(controls,.468,.59,.108,.9)
for (let j=0;j<6;j++) line(controls,'Lever_Flute', [[.577,.08+j*.035,.109],[.625,.08+j*.035,.109]], .0025, rear)

// Original inlaid ABC monogram, built as tiny metal strokes on the upper shell.
const letters = [
  [[-.15,.51],[-.10,.70],[-.05,.51]], [[-.135,.57],[-.065,.57]],
  [[-.015,.51],[-.015,.70],[.045,.70],[.065,.68],[.065,.63],[-.015,.61],[.045,.61],[.07,.59],[.07,.53],[.045,.51],[-.015,.51]],
  [[.22,.68],[.20,.70],[.13,.70],[.11,.68],[.11,.53],[.13,.51],[.20,.51],[.22,.53]],
]
for (const points of letters) line(controls,'Inlaid_ABC_Monogram',points.map(([x,y])=>[x-.03,y,faceZ(x-.03,y)+.008]),.003,gold,5)

// Merge within each named assembly/material to keep the model inexpensive to draw.
for (const assembly of [body, blade, controls]) {
  assembly.updateMatrixWorld(true)
  const buckets = new Map()
  for (const mesh of [...assembly.children]) {
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone()
    geometry.applyMatrix4(mesh.matrix)
    // All geometry needs the same attributes to merge; UV maps are unnecessary here.
    geometry.deleteAttribute('uv')
    const list = buckets.get(mesh.material) || []; list.push(geometry); buckets.set(mesh.material,list)
    assembly.remove(mesh); mesh.geometry.dispose()
  }
  for (const [material, geometries] of buckets) {
    const merged = mergeGeometries(geometries, false)
    if (!merged) throw new Error(`Could not merge ${assembly.name}/${material.name}`)
    add(assembly, `${assembly.name}_${material.name}`, merged, material)
    geometries.forEach(g=>g.dispose())
  }
}
const exporter = new GLTFExporter()
const buffer = await exporter.parseAsync(root, { binary: true, onlyVisible: true })
const output = new URL('../public/models/', import.meta.url)
await mkdir(output, { recursive: true })
await writeFile(new URL('abc-atelier-01.glb', output), Buffer.from(buffer))
let triangles = 0, meshes = 0
root.traverse(o=>{ if(o.isMesh) { meshes++; triangles += o.geometry.attributes.position.count / 3 } })
const report = { name: 'ABC Atelier 01', origin: 'Original mesh authored for this project; not downloaded', license: 'CC0-1.0', bytes: buffer.byteLength, sha256: createHash('sha256').update(Buffer.from(buffer)).digest('hex'), triangles, meshes, features: ['lofted ergonomic shell','contoured grip inlay and machined ribs','31 fixed and 27 moving blade teeth','countersunk screws','power slider','sculpted taper lever','inlaid ABC monogram'], generator: 'script/build-atelier-clipper.mjs' }
await writeFile(new URL('abc-atelier-01.asset.json', output), `${JSON.stringify(report,null,2)}\n`)
console.log(JSON.stringify(report,null,2))
