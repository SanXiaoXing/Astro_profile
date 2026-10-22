import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Fold, Focus } from '../src/components/paper-fold/mesh.mjs'

test('reference mesh has repeatable connected creases and a flat endpoint', () => {
  const mesh = Fold.create(320, 430, 47)
  assert.ok(mesh.faces.length > 500)
  assert.deepEqual(mesh.rest, Fold.create(320, 430, 47, false).rest)
  assert.equal(new Set(mesh.faces.flat()).size, mesh.rest.length / 3)
  const edges = new Map()
  for (const face of mesh.faces) {
    for (let k = 0; k < 3; k++) {
      const a = face[k],
        b = face[(k + 1) % 3]
      const key = a < b ? `${a}:${b}` : `${b}:${a}`
      edges.set(key, (edges.get(key) || 0) + 1)
    }
  }
  assert.ok([...edges.values()].every((n) => n === 1 || n === 2))
  assert.deepEqual(Fold.sample(mesh, 1), mesh.rest)
  for (const progress of [0, 0.1, 0.5, 0.9, 1]) {
    assert.ok(Fold.sample(mesh, progress).every(Number.isFinite))
  }
  const ball = Fold.sample(mesh, 0)
  const sizes = [0, 1, 2].map((axis) => {
    const coordinates = ball.filter((_, i) => i % 3 === axis)
    return Math.max(...coordinates) - Math.min(...coordinates)
  })
  assert.ok(Math.max(...sizes) < 180 && Math.min(...sizes) > 55)
  const rms = (a, b) =>
    Math.sqrt(
      a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0) / (a.length / 3),
    )
  const distances = Array.from({ length: 39 }, (_, i) =>
    rms(Fold.sample(mesh, i / 40), Fold.sample(mesh, (i + 1) / 40)),
  )
  assert.ok(Math.max(...distances) / Math.min(...distances) < 1.5)
  assert.ok(Math.abs(Fold.advance(0.4, 0, 0.2, 2) - 0.3) < 1e-12)
})

test('opening and closing share a reversible viewport-safe path', () => {
  const home = { x: 145, y: 510, scale: 0.48 }
  for (const viewport of [
    { width: 1280, height: 720 },
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    assert.deepEqual(Focus.pose(home, viewport, 0), home)
    const end = Focus.pose(home, viewport, 1)
    assert.equal(end.x, viewport.width / 2)
    assert.equal(end.y, viewport.height / 2)
    assert.ok(end.scale * 320 <= viewport.width - 48 + 1e-6)
    assert.ok(end.scale * 430 <= viewport.height - 160 + 1e-6)
    assert.equal(Focus.pose(home, viewport, 0.5).x, (home.x + end.x) / 2)
  }
})
