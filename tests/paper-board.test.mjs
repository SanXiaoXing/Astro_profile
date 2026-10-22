import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultPaperMonth } from '../src/components/paper-fold/board.mjs'

test('default selection only uses months with content', () => {
  assert.equal(
    defaultPaperMonth(['2026-10', '2026-09'], '2026-10-22'),
    '2026-10',
  )
  assert.equal(
    defaultPaperMonth(['2026-09', '2026-08'], '2026-10-22'),
    '2026-09',
  )
  assert.equal(defaultPaperMonth([], '2026-10-22'), '')
})
import {
  paperMonth,
  constrainPaper,
  layoutPapers,
} from '../src/components/paper-fold/board.mjs'

test('month selection defaults to the current month and respects Shanghai month boundaries', () => {
  assert.equal(paperMonth('2026-09-30T16:00:00Z'), '2026-10')
  assert.equal(paperMonth('2026-12-31T16:00:00Z'), '2027-01')
  assert.equal(paperMonth('2026-10-22'), '2026-10')
  assert.match(paperMonth(), /^\d{4}-\d{2}$/)
})

test('scattered paper positions stay on the board, including small screens', () => {
  for (const width of [100, 280, 680]) {
    const result = layoutPapers(12, width)
    assert.equal(result.positions.length, 12)
    assert.deepEqual(layoutPapers(12, width), result)
    for (const position of result.positions) {
      assert.ok(position.x >= Math.min(60, width / 2))
      assert.ok(position.x <= Math.max(width - 60, width / 2))
      assert.ok(position.y >= 60 && position.y <= result.height - 60)
    }
  }
  assert.deepEqual(constrainPaper(-500, 900, 300, 400), { x: 60, y: 340 })
  assert.deepEqual(constrainPaper(50, 40, 100, 80), { x: 50, y: 40 })
})
