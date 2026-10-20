// Original project-authored GLB; see public/models/abc-atelier-01.asset.json.
// Vite exposes this optional public asset override at build time, not a credential.
export const clipperHeroConfig = {
  modelUrl: import.meta.env?.VITE_CLIPPER_MODEL_URL || '/models/abc-atelier-01.glb',
  rootNode: 'BarberClipper',
  bladeNode: 'Blade',
  rotation: [0, 0, 0], // Export upright (+Y) with the front of the clipper facing +Z.
  normalizedHeight: 3.6,
  scissors: {
    modelUrl: '/models/abc-atelier-shears-01.glb',
    rootNode: 'BarberScissors',
    halfA: 'ScissorHalfA',
    halfB: 'ScissorHalfB',
    pivot: 'ScissorPivot',
    normalizedHeight: 2.95,
  },
  materialNames: {
    housing: 'Housing_BlackMetal',
    blade: 'Blade_Steel',
    trim: 'Trim_Champagne',
  },
}
