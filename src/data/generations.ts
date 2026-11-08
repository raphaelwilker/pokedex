export const MAX_ID = 1025

export type GenerationKey = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7' | 'G8' | 'G9' | 'ALL'

export interface Generation {
  key: GenerationKey
  label: string
  region: string | null
  min: number
  max: number
}

export const GENERATIONS: Generation[] = [
  { key: 'G1', label: 'G1', region: 'Kanto', min: 1, max: 151 },
  { key: 'G2', label: 'G2', region: 'Johto', min: 152, max: 251 },
  { key: 'G3', label: 'G3', region: 'Hoenn', min: 252, max: 386 },
  { key: 'G4', label: 'G4', region: 'Sinnoh', min: 387, max: 493 },
  { key: 'G5', label: 'G5', region: 'Unova', min: 494, max: 649 },
  { key: 'G6', label: 'G6', region: 'Kalos', min: 650, max: 721 },
  { key: 'G7', label: 'G7', region: 'Alola', min: 722, max: 809 },
  { key: 'G8', label: 'G8', region: 'Galar', min: 810, max: 905 },
  { key: 'G9', label: 'G9', region: 'Paldea', min: 906, max: 1025 },
  { key: 'ALL', label: 'ALL', region: null, min: 1, max: MAX_ID }
]

export function generationOf(id: number): number {
  const index = GENERATIONS.findIndex((g) => g.key !== 'ALL' && id >= g.min && id <= g.max)
  return index + 1
}

// Region where the Pokémon was introduced (the region of its generation)
export function regionOf(id: number): string | null {
  const gen = GENERATIONS.find((g) => g.key !== 'ALL' && id >= g.min && id <= g.max)
  return gen ? gen.region : null
}

export function rangeFor(key: GenerationKey): { min: number; max: number } {
  const generation = GENERATIONS.find((g) => g.key === key)
  if (!generation) throw new Error(`Unknown generation: ${key}`)
  return { min: generation.min, max: generation.max }
}
