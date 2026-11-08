import { vi } from 'vitest'

/*
 * Tests run without a permanent data cache by default: the real one keeps data in
 * module-level memory (jsdom has no IndexedDB), which would leak between tests of
 * the same file. Tests of the cache itself call vi.unmock('./storage'); tests that
 * need to control it replace this mock with their own vi.mock('../cache/storage').
 */
vi.mock('./cache/storage', () => ({
  isValidEntry: vi.fn(() => true),
  getEntry: vi.fn(async () => undefined),
  setEntry: vi.fn(async () => undefined),
  getList: vi.fn(async () => undefined),
  setList: vi.fn(async () => undefined)
}))
