import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

export const THEME_COLOR = '#dc0a2d'

/**
 * Native-only start-up: Pokédex-red status bar and hiding the splash screen.
 * Does nothing in a browser. Each step is independent because some do not exist on
 * every platform (setBackgroundColor is Android only) and none may block the app.
 */
export async function initNative(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setBackgroundColor({ color: THEME_COLOR })
  } catch {
    // not implemented on iOS
  }
  try {
    await StatusBar.setStyle({ style: Style.Dark }) // light icons on the red bar
  } catch {
    // keep the default style
  }
  try {
    await SplashScreen.hide()
  } catch {
    // the splash screen hides itself after its configured timeout
  }
}
