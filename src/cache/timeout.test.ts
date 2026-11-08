import { test, expect, vi, afterEach } from 'vitest'
import { withTimeout, CACHE_TIMEOUT_MS } from './timeout'

afterEach(() => vi.useRealTimers())

test('the wait is short enough that the app never feels stuck', () => {
  expect(CACHE_TIMEOUT_MS).toBeGreaterThanOrEqual(500)
  expect(CACHE_TIMEOUT_MS).toBeLessThanOrEqual(3000)
})

test('a promise that answers in time keeps its value and leaves no timer behind', async () => {
  vi.useFakeTimers()
  await expect(withTimeout(Promise.resolve('value'), 'fallback')).resolves.toBe('value')
  expect(vi.getTimerCount()).toBe(0)
})

test('a promise that never answers gives the fallback after the wait', async () => {
  vi.useFakeTimers()
  const result = withTimeout(new Promise<string>(() => {}), 'fallback', 1000)
  await vi.advanceTimersByTimeAsync(1000)
  await expect(result).resolves.toBe('fallback')
})

test('a rejection is passed on (callers decide what to do) and leaves no timer behind', async () => {
  vi.useFakeTimers()
  await expect(withTimeout(Promise.reject(new Error('boom')), 'fallback')).rejects.toThrow('boom')
  expect(vi.getTimerCount()).toBe(0)
})
