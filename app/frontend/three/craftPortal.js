import { MathUtils, Vector3 } from 'three'

const smooth = value => {
  const p = MathUtils.clamp(value, 0, 1)
  return p * p * (3 - 2 * p)
}

// Geometry coordinates from the original shear generator, inside the finger insert.
// Keep the aperture inside the real metal/rubber opening, rather than its outer rim.
export const fingerPortal = {
  center: [0.43, -1.37, 0.0355],
  radiusX: 0.183,
  radiusY: 0.254,
  tilt: -0.20,
}

export function craftPortalFrame(progress) {
  const p = MathUtils.clamp(Number.isFinite(progress) ? progress : 0, 0, 1)
  return {
    progress: p,
    straighten: smooth(p / .24),
    aim: smooth((p - .20) / .23),
    approach: smooth((p - .43) / .51),
    pass: smooth((p - .94) / .06),
    reveal: smooth((p - .29) / .15),
    title: smooth((p - .82) / .10),
    handoff: smooth((p - .985) / .015),
  }
}

/** Fit both tool height and width, including the diagonal at the start. */
export function craftCameraDistance(aspect, compact = false) {
  const tan = Math.tan(MathUtils.degToRad(16))
  return Math.max(3.2 / (2 * tan * (compact ? .43 : .62)), 2.7 / (2 * tan * aspect * .82))
}

export function portalCameraDistance(home, frame) {
  // Exponential approach avoids a last-second zoom jump near the small aperture.
  const near = .035
  return Math.exp(MathUtils.lerp(Math.log(home), Math.log(near), frame.approach)) - frame.pass * .35
}

/** Project the actual moving half's inner ellipse, including tilt and perspective. */
export function projectFingerAperture(half, camera, samples = 64) {
  const point = new Vector3(), coordinates = []
  const { center, radiusX, radiusY, tilt } = fingerPortal
  for (let i = 0; i < samples; i++) {
    const angle = i / samples * Math.PI * 2
    const x = radiusX * Math.cos(angle), y = radiusY * Math.sin(angle)
    point.set(center[0] + x * Math.cos(tilt) - y * Math.sin(tilt), center[1] + x * Math.sin(tilt) + y * Math.cos(tilt), center[2])
    half.localToWorld(point).project(camera)
    coordinates.push([(point.x + 1) * 50, (1 - point.y) * 50])
  }
  return coordinates
}
