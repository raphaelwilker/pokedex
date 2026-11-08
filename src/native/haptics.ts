/**
 * Light haptic feedback for the controls. Never throws: a device that cannot
 * vibrate (desktop browsers, iOS Safari) simply does nothing.
 */
export function buzz(ms = 10): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
    }
  } catch {
    // vibration blocked by the browser or the device
  }
}
