/** How long a cache read may take before the app carries on without it. */
export const CACHE_TIMEOUT_MS = 1500

/**
 * Some WebKit versions never answer IndexedDB requests (a known first-launch bug).
 * A cache is only an optimisation, so after `ms` the caller gets `fallback` instead of
 * waiting forever. Rejections are passed on; the timer is always cleared.
 */
export function withTimeout<T>(promise: Promise<T>, fallback: T, ms: number = CACHE_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => resolve(fallback), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
}
