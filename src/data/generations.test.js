import { test, expect } from 'vitest'
import { GENERATIONS, generationOf, rangeFor } from './generations'

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
