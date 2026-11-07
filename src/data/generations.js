export const MAX_ID = 1025

export const GENERATIONS = [
  { key: 'G1', label: 'G1', min: 1, max: 151 },
  { key: 'G2', label: 'G2', min: 152, max: 251 },
  { key: 'G3', label: 'G3', min: 252, max: 386 },
  { key: 'G4', label: 'G4', min: 387, max: 493 },
  { key: 'G5', label: 'G5', min: 494, max: 649 },
  { key: 'G6', label: 'G6', min: 650, max: 721 },
  { key: 'G7', label: 'G7', min: 722, max: 809 },
  { key: 'G8', label: 'G8', min: 810, max: 905 },
  { key: 'G9', label: 'G9', min: 906, max: 1025 },
  { key: 'ALL', label: 'ALL', min: 1, max: MAX_ID }
]

export function generationOf(id) {
  const index = GENERATIONS.findIndex((g) => g.key !== 'ALL' && id >= g.min && id <= g.max)
  return index + 1
}

export function rangeFor(key) {
  const { min, max } = GENERATIONS.find((g) => g.key === key)
  return { min, max }
}
