import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

// Procedural salon tools: no external model download or embedded animation clip.
export function createSalonTools() {
  const root = new THREE.Group()
  const steel = new THREE.MeshStandardMaterial({ color: 0xd5d5cb, metalness: 1, roughness: 0.18 })
  const gold = new THREE.MeshStandardMaterial({ color: 0xcba96b, metalness: 1, roughness: 0.24 })
  const black = new THREE.MeshStandardMaterial({ color: 0x24291f, metalness: 0.45, roughness: 0.28 })
  const groove = new THREE.MeshStandardMaterial({ color: 0x30332a, metalness: 0.7, roughness: 0.3 })
  const mesh = (parent, geometry, material, position = [0, 0, 0]) => {
    const object = new THREE.Mesh(geometry, material)
    object.position.set(...position)
    parent.add(object)
    return object
  }
  const box = (parent, size, material, position, radius = 0.025) => mesh(parent, new RoundedBoxGeometry(...size, 2, radius), material, position)
  const curve = (parent, points, material, radius = 0.045) => mesh(parent, new THREE.TubeGeometry(new THREE.CubicBezierCurve3(...points.map(point => new THREE.Vector3(...point))), 24, radius, 8, false), material)
  const extrude = (parent, points, material, depth = 0.045) => {
    const shape = new THREE.Shape()
    points.forEach(([x, y], index) => index ? shape.lineTo(x, y) : shape.moveTo(x, y))
    shape.closePath()
    return mesh(parent, new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.012, bevelThickness: 0.009 }), material)
  }

  const scissors = new THREE.Group()
  const hinges = []
  for (const side of [-1, 1]) {
    const hinge = new THREE.Group()
    const half = new THREE.Group()
    half.scale.x = side
    half.position.z = side * 0.04
    hinge.add(half)
    scissors.add(hinge)
    hinges.push(hinge)
    extrude(half, [[-0.045, -0.12], [0.13, 0.12], [0.17, 0.5], [0.025, 2.05], [-0.035, 2.2], [-0.065, 0.3]], steel)
    // A thin cutting edge catches the moving studio light.
    extrude(half, [[-0.066, 0.23], [-0.036, 2.18], [-0.015, 2.03], [-0.035, 0.25]], gold, 0.048)
    curve(half, [[0, -0.09, 0], [0.01, -0.43, 0], [-0.29, -0.57, 0], [-0.31, -0.91, 0]], gold, 0.06)
    const handle = mesh(half, new THREE.TorusGeometry(0.295, 0.063, 12, 48), gold, [-0.32, -1.2, 0])
    handle.scale.set(0.86, 1.1, 1)
    if (side === -1) curve(half, [[-0.5, -1.38, 0], [-0.62, -1.42, 0], [-0.66, -1.58, 0], [-0.76, -1.5, 0]], gold, 0.04)
  }
  const screw = mesh(scissors, new THREE.CylinderGeometry(0.14, 0.14, 0.15, 32), gold, [0, 0, 0.095])
  screw.rotation.x = Math.PI / 2
  box(scissors, [0.13, 0.02, 0.015], groove, [0, 0, 0.18], 0.005)
  root.add(scissors)

  const comb = new THREE.Group()
  box(comb, [2.45, 0.18, 0.13], black, [0, 0, 0], 0.05)
  box(comb, [2.25, 0.025, 0.014], gold, [0, 0.045, 0.072], 0.006)
  for (let i = 0; i < 25; i++) {
    const length = i < 12 ? 0.57 : 0.49
    box(comb, [i < 12 ? 0.038 : 0.052, length, 0.075], black, [-1.13 + i * 0.094, -length / 2 - 0.04, 0], 0.016)
  }
  root.add(comb)

  const razor = new THREE.Group()
  box(razor, [0.27, 1.5, 0.14], black, [0, -0.55, 0], 0.085)
  box(razor, [0.018, 1.19, 0.014], gold, [-0.095, -0.55, 0.078], 0.005)
  const rivet = mesh(razor, new THREE.CylinderGeometry(0.055, 0.055, 0.17, 20), gold, [0, 0.12, 0])
  rivet.rotation.x = Math.PI / 2
  const blade = new THREE.Group()
  blade.position.set(0, 0.12, 0.015)
  blade.rotation.z = -1.08
  extrude(blade, [[-0.065, -0.08], [0.065, -0.08], [0.085, 0.28], [0.3, 0.4], [0.29, 1.36], [0.04, 1.52], [-0.055, 1.4]], steel)
  extrude(blade, [[0.24, 0.41], [0.29, 0.41], [0.28, 1.36], [0.04, 1.51], [0.07, 1.42], [0.24, 1.31]], gold, 0.047)
  razor.add(blade)
  root.add(razor)

  function update(time, progress = 0, pointer = { x: 0, y: 0 }, compact = false) {
    // Both blades rotate about the same screw; handles and cutting edges move together.
    const opening = 0.09 + (1 + Math.sin(time * 2.8)) * 0.13
    hinges[0].rotation.z = -opening
    hinges[1].rotation.z = opening
    scissors.position.set((compact ? -0.35 : -0.2) - progress * 0.3 + pointer.x * 0.016, 0.32 + Math.sin(time * 0.67) * 0.12 + progress * 0.3, 0.35)
    scissors.rotation.set(-0.12 + pointer.y * 0.009, 0.22 + Math.sin(time * 0.42) * 0.27 + pointer.x * 0.015, -0.38 + Math.sin(time * 0.53) * 0.09)
    scissors.scale.setScalar(compact ? 0.84 : 0.92)
    comb.position.set(1.38 + Math.sin(time * 0.4) * 0.12, -1.16 + Math.sin(time * 0.63 + 2) * 0.15 - progress * 0.26, -0.35)
    comb.rotation.set(0.15 + Math.sin(time * 0.4) * 0.12, -0.28 + Math.sin(time * 0.36) * 0.2, -0.68 + Math.sin(time * 0.42) * 0.08)
    comb.scale.setScalar(compact ? 0.7 : 0.87)
    razor.visible = !compact
    razor.position.set(-1.68 + Math.sin(time * 0.5) * 0.09, -1.52 + Math.sin(time * 0.55 + 1) * 0.12, 0.15)
    razor.rotation.set(0.14, -0.3 + Math.sin(time * 0.44) * 0.3, -0.56 + Math.sin(time * 0.39) * 0.08)
    razor.scale.setScalar(0.74)
  }
  function dispose() {
    const geometries = new Set()
    root.traverse(object => { if (object.geometry) geometries.add(object.geometry) })
    geometries.forEach(geometry => geometry.dispose())
    ;[steel, gold, black, groove].forEach(material => material.dispose())
  }
  update(0)
  return { root, scissors, comb, razor, hinges, update, dispose }
}
