// Original professional shear design, authored for the ABC Salon hero.
// Run: node script/build-atelier-scissors.mjs — no downloads or image textures.
import { mkdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.() }) }
}
const root = new T.Group(); root.name = 'BarberScissors'
root.userData = { title: 'ABC Atelier Shears 01', creator: 'Original project-authored mesh', license: 'CC0-1.0', pivotAxis: '+Z' }
const halfA = new T.Group(); halfA.name = 'ScissorHalfA'
const halfB = new T.Group(); halfB.name = 'ScissorHalfB'
const pivot = new T.Group(); pivot.name = 'ScissorPivot'
root.add(halfA, halfB, pivot)
function surface(name, color, roughness, metalness = 1) {
  return new T.MeshPhysicalMaterial({ name, color, roughness, metalness, clearcoat: metalness>.8?.12:0, clearcoatRoughness:.32 })
}
const steel = surface('Shears_Convex_Steel', '#aeb8be', .26)
const edge = surface('Shears_Honed_Edge', '#e6e8e4', .19)
const forged = surface('Shears_Forged_Handle', '#8c989e', .30)
const gold = surface('Shears_Champagne_Tension_Dial', '#baa576', .27)
const insert = surface('Shears_Finger_Insert', '#111519', .48, .15)
const dark = surface('Shears_Recess', '#080b0d', .42, .4)
function add(group, name, geometry, material, position = [0, 0, 0]) {
  const mesh = new T.Mesh(geometry, material); mesh.name = name
  mesh.position.set(...position); group.add(mesh); return mesh
}
function extrude(group, name, shape, material, depth, bevel, z) {
  return add(group, name, new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 4, curveSegments: 24, steps: 1 }), material, [0, 0, z])
}
// Each blade is a closed convex steel surface with a thin, separately honed edge.
// The cross section swells toward its center and tapers to a precision tip.
function blade(group, sign, z) {
  const rows = 56, columns = 16, positions = [], indices = [], edgePoints = []
  function section(t) {
    const width = (.25 * Math.sin((t * .92 + .08) * Math.PI / 2) ** .3 * (1 - t) ** .72 + .006)
    const inner = .065 * (1 - t) - .015 * t
    return { inner, outer: inner - width }
  }
  for (let face = 0; face < 2; face++) for (let j = 0; j <= rows; j++) {
    const t = j / rows, y = -.06 + 2.44 * t, { inner, outer } = section(t)
    for (let i = 0; i <= columns; i++) {
      const u = i / columns
      const crown = (.008 + .048 * Math.sin(Math.PI * u) ** .8) * (1 - t * .72)
      positions.push(sign * T.MathUtils.lerp(outer, inner, u), y, z + (face === 0 ? crown : -crown * .55))
    }
    if (face === 0) edgePoints.push(new T.Vector3(sign * inner, y, z + .007 * (1 - t * .72)))
  }
  const layer = (rows + 1) * (columns + 1)
  function tri(a, b, c) { indices.push(...(sign === 1 ? [a, b, c] : [a, c, b])) }
  for (let face = 0; face < 2; face++) for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
    const a = face * layer + j * (columns + 1) + i, b = a + columns + 1
    if (face === 0) { tri(a,a+1,b); tri(a+1,b+1,b) } else { tri(a,b,a+1); tri(a+1,b,b+1) }
  }
  for (let j = 0; j < rows; j++) for (const i of [0, columns]) {
    const a = j * (columns + 1) + i, b = a + columns + 1
    if (i === 0) { tri(a,b,a+layer); tri(b,b+layer,a+layer) } else { tri(a,a+layer,b); tri(b,a+layer,b+layer) }
  }
  for (const j of [0, rows]) for (let i = 0; i < columns; i++) {
    const a = j * (columns + 1) + i
    if (j === 0) { tri(a,a+layer,a+1); tri(a+1,a+layer,a+layer+1) } else { tri(a,a+1,a+layer); tri(a+1,a+layer+1,a+layer) }
  }
  const geometry = new T.BufferGeometry()
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions,3)); geometry.setIndex(indices); geometry.computeVertexNormals()
  add(group, 'Convex_Ground_Blade', geometry, steel)
  const edgeCurve = new T.CatmullRomCurve3(edgePoints)
  add(group, 'Honed_Cutting_Edge', new T.TubeGeometry(edgeCurve, 70, .0024, 4, false), edge)
}
function shank(group, sign, z) {
  const curve=new T.CubicBezierCurve3(new T.Vector3(0,.04,z+.025),new T.Vector3(-.10*sign,-.39,z+.025),new T.Vector3(.34*sign,-.62,z+.025),new T.Vector3(.43*sign,-1.08,z+.025))
  const positions=[],indices=[],rows=64,columns=20
  for(let j=0;j<=rows;j++) {
    const t=j/rows,center=curve.getPoint(t),tangent=curve.getTangent(t)
    const normal=new T.Vector3(-tangent.y,tangent.x,0).normalize()
    const radius=T.MathUtils.lerp(.108,.046,t)+Math.sin(t*Math.PI)*.012
    for(let i=0;i<=columns;i++) {
      const angle=i/columns*Math.PI*2
      const point=center.clone().addScaledVector(normal,Math.cos(angle)*radius)
      point.z+=Math.sin(angle)*(.032+Math.sin(t*Math.PI)*.008)
      positions.push(...point.toArray())
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<columns;i++) {
    const a=j*(columns+1)+i,b=a+columns+1
    indices.push(a,a+1,b,a+1,b+1,b)
  }
  const geometry=new T.BufferGeometry()
  geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals()
  add(group,'Sculpted_Round_Forged_Shank',geometry,forged)
}
function ovalRing(group, sign, centerY, rx, ry, material, z, depth, wall, bevel) {
  const centerX=sign*.43,tilt=sign*-.20,radius=wall*.5
  const points=Array.from({length:97},(_,i)=>{
    const a=i/96*Math.PI*2,x=(rx-radius)*Math.cos(a),y=(ry-radius)*Math.sin(a)
    return new T.Vector3(centerX+x*Math.cos(tilt)-y*Math.sin(tilt),centerY+x*Math.sin(tilt)+y*Math.cos(tilt),z+depth*.5)
  })
  // Rounded forged stock with a genuine open finger hole and continuous normals.
  const curve=new T.CatmullRomCurve3(points.slice(0,-1),true)
  add(group,'Rounded_Forged_Finger_Ring',new T.TubeGeometry(curve,96,radius,16,true),material)
}
blade(halfA,1,.037); blade(halfB,-1,-.037)
shank(halfA,1,.019); shank(halfB,-1,-.058)
ovalRing(halfA,1,-1.37,.29,.36,forged,.01,.052,.069,.014)
ovalRing(halfB,-1,-1.33,.285,.345,forged,-.06,.052,.065,.014)
ovalRing(halfA,1,-1.37,.214,.285,insert,.015,.041,.025,.007)
ovalRing(halfB,-1,-1.33,.213,.273,insert,-.055,.041,.025,.007)
// Contoured removable finger rest and its collar on the lower ring.
const tang = new T.CatmullRomCurve3([
  new T.Vector3(-.66,-1.48,-.033), new T.Vector3(-.76,-1.55,-.033),
  new T.Vector3(-.88,-1.60,-.033), new T.Vector3(-.98,-1.55,-.033), new T.Vector3(-1.01,-1.46,-.033),
])
add(halfB,'Sculpted_Finger_Rest',new T.TubeGeometry(tang,36,.034,10,false),forged)
// Small stop pads on the handles meet when the blades nearly close.
for (const [half,sign,z] of [[halfA,1,.05],[halfB,-1,-.03]]) {
  const s = new T.Shape(); s.absellipse(sign*.07,-.57,.045,.055,0,Math.PI*2)
  extrude(half,'Handle_Stop_Pad',s,insert,.03,.006,z)
}
// Raised tension assembly with a machined, knurled ring and slotted center screw.
function lathe(name, profile, material, z) {
  const mesh = add(pivot,name,new T.LatheGeometry(profile.map(([r,h])=>new T.Vector2(r,h)),48),material,[0,0,z])
  mesh.rotation.x = Math.PI/2
}
lathe('Recessed_Pivot_Washer',[[0,0],[.132,0],[.142,.012],[.136,.023],[0,.023]],dark,.080)
lathe('Tension_Dial',[[0,0],[.104,0],[.118,.014],[.118,.039],[.105,.052],[0,.052]],gold,.101)
lathe('Polished_Adjustment_Screw',[[0,0],[.064,0],[.071,.009],[.064,.022],[0,.022]],edge,.155)
for(let i=0;i<40;i++) {
  const angle=i/40*Math.PI*2, x=Math.cos(angle)*.117, y=Math.sin(angle)*.117
  const curve=new T.LineCurve3(new T.Vector3(x,y,.122),new T.Vector3(x,y,.142))
  add(pivot,'Dial_Knurl',new T.TubeGeometry(curve,1,.0025,4,false),forged)
}
const slot = new T.Shape(); slot.moveTo(-.048,-.005);slot.lineTo(.048,-.005);slot.lineTo(.048,.005);slot.lineTo(-.048,.005);slot.closePath()
extrude(pivot,'Adjustment_Screw_Slot',slot,dark,.001,.001,.178)
// Closed-state rig leaves the blade interfaces correctly layered around Z.
halfA.rotation.z = .035; halfB.rotation.z = -.035

// Consolidate geometry within each moving half; the two true pivot nodes stay intact.
for(const assembly of [halfA,halfB,pivot]) {
  assembly.updateMatrix()
  const buckets=new Map()
  for(const mesh of [...assembly.children]) {
    mesh.updateMatrix()
    const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()
    g.applyMatrix4(mesh.matrix);g.deleteAttribute('uv')
    const list=buckets.get(mesh.material)||[];list.push(g);buckets.set(mesh.material,list)
    assembly.remove(mesh);mesh.geometry.dispose()
  }
  for(const [material,geometries] of buckets) {
    const geometry=mergeGeometries(geometries,false)
    if(!geometry) throw new Error(`Cannot merge ${assembly.name}`)
    add(assembly,`${assembly.name}_${material.name}`,geometry,material)
    geometries.forEach(g=>g.dispose())
  }
}
const binary=await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true})
const output=new URL('../public/models/',import.meta.url);await mkdir(output,{recursive:true})
await writeFile(new URL('abc-atelier-shears-01.glb',output),Buffer.from(binary))
let triangles=0,meshes=0;root.traverse(o=>{if(o.isMesh){meshes++;triangles+=o.geometry.attributes.position.count/3}})
const metadata={name:'ABC Atelier Shears 01',origin:'Original project-authored mesh; not downloaded',license:'CC0-1.0',bytes:binary.byteLength,sha256:createHash('sha256').update(Buffer.from(binary)).digest('hex'),triangles,meshes,pivotNodes:['ScissorHalfA','ScissorHalfB','ScissorPivot'],features:['two closed convex blade meshes','separate honed edges','forged offset shanks','oval through-hole finger rings','soft finger inserts','sculpted finger rest','knurled champagne tension dial','slotted central screw'],generator:'script/build-atelier-scissors.mjs'}
await writeFile(new URL('abc-atelier-shears-01.asset.json',output),`${JSON.stringify(metadata,null,2)}\n`)
console.log(JSON.stringify(metadata,null,2))
