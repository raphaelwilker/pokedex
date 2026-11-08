import { createStore, del, entries, get, set } from 'idb-keyval'
import type { UseStore } from 'idb-keyval'
import { withTimeout } from './timeout'

/*
 * Permanent cache for sprites and cries (IndexedDB). Files are stored as raw bytes
 * plus their type (IndexedDB Blob support is unreliable on older WebKit), with a
 * small separate record (size, last use) so cleaning never has to load the bytes.
 * Nothing here throws: any failure just means "use the original address".
 */

export const MEDIA_LIMIT_BYTES = 50 * 1024 * 1024

interface MediaData {
  data: ArrayBuffer
  type: string
}

interface MediaMeta {
  size: number
  lastUsed: number
}

interface Stores {
  data: UseStore
  meta: UseStore
}

let stores: Stores | null | undefined // undefined = not opened yet, null = unavailable
const downloading = new Set<string>()

function open(): Stores | null {
  if (stores === undefined) {
    try {
      stores = { data: createStore('pokedex-media', 'files'), meta: createStore('pokedex-media-meta', 'info') }
    } catch {
      stores = null
    }
  }
  return stores
}

async function totalAndOldest(db: Stores): Promise<{ total: number; byAge: [string, MediaMeta][] }> {
  const all = (await entries<string, MediaMeta>(db.meta)) as [string, MediaMeta][]
  const byAge = all.sort((a, b) => a[1].lastUsed - b[1].lastUsed)
  const total = byAge.reduce((sum, [, meta]) => sum + meta.size, 0)
  return { total, byAge }
}

async function remove(db: Stores, url: string): Promise<void> {
  await del(url, db.data)
  await del(url, db.meta)
}

// removes the least recently used files until `needed` more bytes fit under the limit
async function makeRoom(db: Stores, needed: number): Promise<void> {
  const { total, byAge } = await totalAndOldest(db)
  let used = total
  for (const [url, meta] of byAge) {
    if (used + needed <= MEDIA_LIMIT_BYTES) return
    await remove(db, url)
    used -= meta.size
  }
}

// after a write failed (disk full): free a quarter of the files, at least one
async function evictSome(db: Stores): Promise<void> {
  const { byAge } = await totalAndOldest(db)
  for (const [url] of byAge.slice(0, Math.max(1, Math.ceil(byAge.length / 4)))) {
    await remove(db, url)
  }
}

async function save(db: Stores, url: string, file: MediaData, meta: MediaMeta): Promise<void> {
  await set(url, file, db.data)
  await set(url, meta, db.meta)
}

async function download(db: Stores, url: string): Promise<void> {
  if (downloading.has(url)) return
  downloading.add(url)
  try {
    const response = await fetch(url)
    if (!response.ok) return
    const data = await response.arrayBuffer()
    if (data.byteLength > MEDIA_LIMIT_BYTES) return
    const file: MediaData = { data, type: response.headers.get('content-type') ?? '' }
    const meta: MediaMeta = { size: data.byteLength, lastUsed: Date.now() }
    await makeRoom(db, meta.size)
    try {
      await save(db, url, file, meta)
    } catch {
      await evictSome(db)
      await save(db, url, file, meta) // one retry; a second failure is caught below
    }
  } catch {
    // offline, blocked, or no space: the original address keeps working online
  } finally {
    downloading.delete(url)
  }
}

/**
 * Returns a local `blob:` address when the file was seen before. Otherwise returns the
 * original address right away and downloads the file in the background for next time.
 */
export async function resolveMedia(url: string): Promise<string> {
  try {
    const db = open()
    if (!db) return url
    const file = await withTimeout(get<MediaData>(url, db.data), undefined)
    if (file) {
      const touch: MediaMeta = { size: file.data.byteLength, lastUsed: Date.now() }
      void set(url, touch, db.meta).catch(() => {})
      return URL.createObjectURL(new Blob([file.data], { type: file.type }))
    }
    void download(db, url)
  } catch {
    // fall through to the original address
  }
  return url
}

export function revokeMedia(objectUrl: string): void {
  if (objectUrl.startsWith('blob:')) URL.revokeObjectURL(objectUrl)
}
