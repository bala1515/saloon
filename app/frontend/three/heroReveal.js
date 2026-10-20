// Shared type/object timings, kept dependency-free so Three.js remains lazy-loaded.
export const heroReveal = { firstLine: .1, secondLine: .28, typeDuration: 1.3, signature: .75, toolsDuration: 2.4 }
export function revealProgress(seconds, delay = 0) {
  return 1 - Math.pow(1 - Math.max(0,Math.min((seconds-delay)/heroReveal.toolsDuration,1)),3)
}
