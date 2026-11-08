import { test, expect } from 'vitest'
import html from '../index.html?raw'

function viewportContent(): string {
  const match = html.match(/<meta\s+name="viewport"\s+content="([^"]*)"/)
  return match ? match[1] : ''
}

test('the viewport meta covers the whole screen (notch and gesture bar) on phones', () => {
  expect(viewportContent()).toContain('viewport-fit=cover')
})

test('the viewport meta follows the device width', () => {
  expect(viewportContent()).toContain('width=device-width')
})
