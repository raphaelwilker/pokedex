import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'

/**
 * Light haptic feedback for the controls. In the native app it uses the system's
 * light impact; in a browser it uses navigator.vibrate when the device has it.
 * Never throws: a device that cannot vibrate (desktop, iOS Safari) does nothing.
 */
export function buzz(ms = 10): void {
  try {
    if (Capacitor.isNativePlatform()) {
      Promise.resolve(Haptics.impact({ style: ImpactStyle.Light })).catch(() => {})
      return
    }
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
    }
  } catch {
    // vibration blocked, or the plugin is not available
  }
}
