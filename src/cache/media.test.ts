import { test, expect, vi, beforeEach, afterEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'

// Lets a test make the next writes fail like a full disk would. Each test gets a new
// "generation": a background download left over by an earlier test belongs to an older
// generation and can never consume the failures meant for the current test.
const faults = { failNextSets: 0, generation: 0 }
vi.mock('idb-keyval', async (importOriginal) => {
  const actual = await importOriginal<typeof import('idb-keyval')>()
  type Tagged = ReturnType<typeof actual.createStore> & { generation?: number }
  return {
    ...actual,
    // every store remembers in which test it was created (the module is reloaded per test)
    createStore: (...args: Parameters<typeof actual.createStore>) => {
      const store: Tagged = actual.createStore(...args)
      store.generation = faults.generation
      return store
    },
    set: (key: IDBValidKey, value: unknown, store?: Tagged) => {
      if (store?.generation === faults.generation && faults.failNextSets > 0) {
        faults.failNextSets--
        return Promise.reject(new DOMException('disk full', 'QuotaExceededError'))
      }
      return actual.set(key, value, store)
    }
  }
})

const MB = 1024 * 1024
let now = 0
let blobCounter = 0

function response(bytes: number, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    headers: { get: () => 'image/png' },
    arrayBuffer: async () => new ArrayBuffer(bytes)
  }
}

function mockFetch(bytes = 1024) {
  const fetchMock = vi.fn().mockImplementation(async () => response(bytes))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function load() {
  vi.resetModules()
  return import('./media')
}

// waits until the background download of `url` is finished and stored
async function cached(media: Awaited<ReturnType<typeof load>>, url: string): Promise<void> {
  await vi.waitFor(async () => expect(await media.resolveMedia(url)).toMatch(/^blob:/))
}

beforeEach(() => {
  now = 0
  blobCounter = 0
  faults.failNextSets = 0
  faults.generation++
  vi.stubGlobal('indexedDB', new IDBFactory())
  vi.spyOn(Date, 'now').mockImplementation(() => ++now)
  URL.createObjectURL = vi.fn(() => `blob:mock-${++blobCounter}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(async () => {
  // a cache miss starts a background download: let it finish so it cannot leak into the next test
  await new Promise((resolve) => setTimeout(resolve, 30))
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('the limit for cached media is 50 MB', async () => {
  const media = await load()
  expect(media.MEDIA_LIMIT_BYTES).toBe(50 * 1024 * 1024)
})

test('the first time it gives the original address and downloads in the background; afterwards it gives a local copy', async () => {
  const fetchMock = mockFetch()
  const media = await load()
  expect(await media.resolveMedia('https://img/a.png')).toBe('https://img/a.png')
  expect(fetchMock).toHaveBeenCalledWith('https://img/a.png')
  await cached(media, 'https://img/a.png')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('the same address requested several times at once is downloaded only once', async () => {
  const fetchMock = mockFetch()
  const media = await load()
  await Promise.all([media.resolveMedia('https://img/a.png'), media.resolveMedia('https://img/a.png'), media.resolveMedia('https://img/a.png')])
  await cached(media, 'https://img/a.png')
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('a download that fails keeps the original address and stores nothing', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
  const media = await load()
  expect(await media.resolveMedia('https://img/a.png')).toBe('https://img/a.png')
  await new Promise((resolve) => setTimeout(resolve, 30))
  expect(await media.resolveMedia('https://img/a.png')).toBe('https://img/a.png')
})

test('a response that is not OK (or blocked) is not stored', async () => {
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => response(1024, false)))
  const media = await load()
  await media.resolveMedia('https://img/a.png')
  await new Promise((resolve) => setTimeout(resolve, 30))
  expect(await media.resolveMedia('https://img/a.png')).toBe('https://img/a.png')
})

test('over the limit, the least recently used files are removed first', async () => {
  mockFetch(20 * MB)
  const media = await load()
  await media.resolveMedia('https://img/a.png')
  await cached(media, 'https://img/a.png')
  await media.resolveMedia('https://img/b.png')
  await cached(media, 'https://img/b.png')
  await cached(media, 'https://img/a.png') // a is used again: b is now the oldest
  await media.resolveMedia('https://img/c.png')
  await cached(media, 'https://img/c.png') // 60 MB would not fit: the oldest (b) goes
  expect(await media.resolveMedia('https://img/b.png')).toBe('https://img/b.png')
  expect(await media.resolveMedia('https://img/a.png')).toMatch(/^blob:/)
  expect(await media.resolveMedia('https://img/c.png')).toMatch(/^blob:/)
})

test('a single file larger than the whole limit is never stored', async () => {
  mockFetch(51 * MB)
  const media = await load()
  await media.resolveMedia('https://img/huge.png')
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(await media.resolveMedia('https://img/huge.png')).toBe('https://img/huge.png')
})

test('when the disk is full, the oldest file is removed and the write is retried once', async () => {
  mockFetch()
  const media = await load()
  await media.resolveMedia('https://img/a.png')
  await cached(media, 'https://img/a.png')
  faults.failNextSets = 1
  await media.resolveMedia('https://img/b.png')
  await cached(media, 'https://img/b.png')
  expect(await media.resolveMedia('https://img/a.png')).toBe('https://img/a.png') // evicted to make room
})

test('when the disk stays full, the file is simply not stored and nothing throws', async () => {
  mockFetch()
  const media = await load()
  faults.failNextSets = 2
  await expect(media.resolveMedia('https://img/b.png')).resolves.toBe('https://img/b.png')
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(await media.resolveMedia('https://img/b.png')).toBe('https://img/b.png')
})

test('without IndexedDB the original address is returned and nothing throws', async () => {
  vi.stubGlobal('indexedDB', undefined)
  mockFetch()
  const media = await load()
  await expect(media.resolveMedia('https://img/a.png')).resolves.toBe('https://img/a.png')
})

test('revokeMedia only releases blob addresses', async () => {
  const media = await load()
  media.revokeMedia('https://img/a.png')
  expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  media.revokeMedia('blob:mock-1')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-1')
})

test('a hanging IndexedDB cannot block showing media: it gives up and returns the original address', async () => {
  vi.stubGlobal('indexedDB', { open: () => ({}) })
  mockFetch()
  const media = await load()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    const answer = media.resolveMedia('https://img/a.png')
    await vi.advanceTimersByTimeAsync(3000)
    await expect(answer).resolves.toBe('https://img/a.png')
  } finally {
    vi.useRealTimers()
  }
})
