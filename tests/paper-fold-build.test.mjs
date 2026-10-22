import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

// Run after `npx astro build` to check the actual collection-to-component output.
test('built paper keeps metadata inside the reader and months in inert templates', async () => {
  const html = await readFile(
    new URL('../dist/papers/index.html', import.meta.url),
    'utf8',
  )
  for (const pattern of [
    /<paper-board\b[^>]*>/,
    /<select[^>]*aria-label="筛选月份"/,
    /<option[^>]*value="\d{4}-\d{2}"/,
    /<template[^>]*data-month="\d{4}-\d{2}"/,
    /<paper-fold[^>]*data-title=/,
    /<details[^>]*class="paper-fold-fallback"/,
    /<dialog[^>]*aria-label=/,
    /<header class="paper-fold-meta"[^>]*>/,
    /<time datetime="[^"]+">/,
    /href="\/papers"/,
  ])
    assert.match(html, pattern)
  assert.doesNotMatch(html, /paper-fold-caption/)
  assert.doesNotMatch(html, /type="month"/)
  const monthOptions = [
    ...html.matchAll(/<option\b[^>]*value="(\d{4}-\d{2})"/g),
  ].map((match) => match[1])
  const monthTemplates = [
    ...html.matchAll(/<template\b[^>]*data-month="(\d{4}-\d{2})"/g),
  ].map((match) => match[1])
  assert.deepEqual(monthOptions, monthTemplates)
})
