/** Deterministic string -> [0, 1) hash, so seed data is stable across reloads. */
export function seededRandom(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  const t = (h ^= h >>> 16) >>> 0
  return t / 4294967296
}

export function seededInt(seed: string, min: number, max: number): number {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min
}
