import { test, expect } from 'vitest'
import { GENERATIONS, generationOf, regionOf, rangeFor } from './generations'

test('generationOf maps boundary ids to their generation', () => {
  expect(generationOf(1)).toBe(1)
  expect(generationOf(151)).toBe(1)
  expect(generationOf(152)).toBe(2)
  expect(generationOf(1025)).toBe(9)
})

test('rangeFor returns the id range for a key', () => {
  expect(rangeFor('G3')).toEqual({ min: 252, max: 386 })
  expect(rangeFor('ALL')).toEqual({ min: 1, max: 1025 })
})

test('generation ranges are contiguous from G1 to G9', () => {
  const gens = GENERATIONS.filter((g) => g.key !== 'ALL')
  expect(gens).toHaveLength(9)
  expect(gens[0].min).toBe(1)
  for (let i = 1; i < gens.length; i++) {
    expect(gens[i].min).toBe(gens[i - 1].max + 1)
  }
  expect(gens[8].max).toBe(1025)
})

test('regionOf maps ids to the region of their generation', () => {
  expect(regionOf(1)).toBe('Kanto')
  expect(regionOf(152)).toBe('Johto')
  expect(regionOf(386)).toBe('Hoenn')
  expect(regionOf(387)).toBe('Sinnoh')
  expect(regionOf(649)).toBe('Unova')
  expect(regionOf(650)).toBe('Kalos')
  expect(regionOf(809)).toBe('Alola')
  expect(regionOf(810)).toBe('Galar')
  expect(regionOf(1025)).toBe('Paldea')
})

test('regionOf is null for ids out of range', () => {
  expect(regionOf(0)).toBeNull()
  expect(regionOf(1026)).toBeNull()
})
