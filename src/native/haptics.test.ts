import { test, expect, vi, afterEach } from 'vitest'
import { buzz } from './haptics'

function setVibrate(value: unknown): void {
  Object.defineProperty(navigator, 'vibrate', { value, configurable: true, writable: true })
}

afterEach(() => {
  // jsdom has no vibrate: remove whatever a test defined
  delete (navigator as unknown as Record<string, unknown>).vibrate
})

test('buzz vibrates for 10 ms by default', () => {
  const vibrate = vi.fn()
  setVibrate(vibrate)
  buzz()
  expect(vibrate).toHaveBeenCalledWith(10)
})

test('buzz vibrates for the given duration', () => {
  const vibrate = vi.fn()
  setVibrate(vibrate)
  buzz(25)
  expect(vibrate).toHaveBeenCalledWith(25)
})

test('buzz does nothing and does not throw when the device cannot vibrate', () => {
  expect(() => buzz()).not.toThrow()
})

test('buzz does not throw when vibrate itself throws', () => {
  setVibrate(() => {
    throw new Error('blocked')
  })
  expect(() => buzz()).not.toThrow()
})
