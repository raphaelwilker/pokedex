import { test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => false) } }))
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn() },
  ImpactStyle: { Light: 'LIGHT' }
}))

import { Capacitor } from '@capacitor/core'
import { Haptics } from '@capacitor/haptics'
import { buzz } from './haptics'

const isNative = vi.mocked(Capacitor.isNativePlatform)
const impact = vi.mocked(Haptics.impact)

function setVibrate(value: unknown): void {
  Object.defineProperty(navigator, 'vibrate', { value, configurable: true, writable: true })
}

beforeEach(() => {
  isNative.mockReset().mockReturnValue(false)
  impact.mockReset().mockResolvedValue(undefined)
})

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

test('in the native app buzz uses the light haptic impact and not navigator.vibrate', () => {
  isNative.mockReturnValue(true)
  const vibrate = vi.fn()
  setVibrate(vibrate)
  buzz()
  expect(impact).toHaveBeenCalledWith({ style: 'LIGHT' })
  expect(vibrate).not.toHaveBeenCalled()
})

test('in the web browser buzz never calls the native plugin', () => {
  buzz()
  expect(impact).not.toHaveBeenCalled()
})

test('in the native app a failing haptic plugin is ignored', async () => {
  isNative.mockReturnValue(true)
  impact.mockRejectedValue(new Error('not available'))
  expect(() => buzz()).not.toThrow()
  await Promise.resolve() // an unhandled rejection would fail the run
})

test('in the native app a plugin that throws synchronously is ignored', () => {
  isNative.mockReturnValue(true)
  impact.mockImplementation(() => {
    throw new Error('not implemented')
  })
  expect(() => buzz()).not.toThrow()
})
