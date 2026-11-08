import { test, expect, vi, beforeEach } from 'vitest'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: vi.fn(() => false) } }))
vi.mock('@capacitor/status-bar', () => ({
  StatusBar: { setBackgroundColor: vi.fn(), setStyle: vi.fn() },
  Style: { Dark: 'DARK' }
}))
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: { hide: vi.fn() } }))

import { Capacitor } from '@capacitor/core'
import { StatusBar } from '@capacitor/status-bar'
import { SplashScreen } from '@capacitor/splash-screen'
import { initNative } from './init'

const isNative = vi.mocked(Capacitor.isNativePlatform)
const setBackgroundColor = vi.mocked(StatusBar.setBackgroundColor)
const setStyle = vi.mocked(StatusBar.setStyle)
const hide = vi.mocked(SplashScreen.hide)

beforeEach(() => {
  isNative.mockReset().mockReturnValue(false)
  setBackgroundColor.mockReset().mockResolvedValue(undefined)
  setStyle.mockReset().mockResolvedValue(undefined)
  hide.mockReset().mockResolvedValue(undefined)
})

test('in the web browser nothing native is touched', async () => {
  await initNative()
  expect(setBackgroundColor).not.toHaveBeenCalled()
  expect(setStyle).not.toHaveBeenCalled()
  expect(hide).not.toHaveBeenCalled()
})

test('in the native app the status bar becomes Pokédex red and the splash screen is hidden', async () => {
  isNative.mockReturnValue(true)
  await initNative()
  expect(setBackgroundColor).toHaveBeenCalledWith({ color: '#dc0a2d' })
  expect(setStyle).toHaveBeenCalledWith({ style: 'DARK' })
  expect(hide).toHaveBeenCalledTimes(1)
})

test('the splash screen is still hidden when the status bar plugin fails (setBackgroundColor does not exist on iOS)', async () => {
  isNative.mockReturnValue(true)
  setBackgroundColor.mockRejectedValue(new Error('"StatusBar.setBackgroundColor()" is not implemented on iOS'))
  await expect(initNative()).resolves.toBeUndefined()
  expect(hide).toHaveBeenCalledTimes(1)
})

test('a failing splash screen plugin does not make initNative fail', async () => {
  isNative.mockReturnValue(true)
  hide.mockRejectedValue(new Error('boom'))
  await expect(initNative()).resolves.toBeUndefined()
})
