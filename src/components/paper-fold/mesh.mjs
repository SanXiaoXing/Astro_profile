// A continuous, irregular triangular sheet. Shared vertices prevent cracks.
// Edge constraints approximate resistance to stretching, not rigid origami.
// Precomputed positions are sampled by travelled distance, without easing.
export const Fold = {
  create(w, h, seed, precompute = true) {
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0
      return seed / 4294967296
    }
    const n = 18,
      m = 24,
      points = []
    for (let j = 0; j <= m; j++)
      for (let i = 0; i <= n; i++)
        points.push([
          ((i + (i === 0 || i === n ? 0 : (random() - 0.5) * 0.9)) / n) * w -
            w / 2,
          ((j + (j === 0 || j === m ? 0 : (random() - 0.5) * 0.9)) / m) * h -
            h / 2,
        ])
    const count = points.length,
      coords = points.concat([
        [-w * 5, -h * 4],
        [w * 5, -h * 4],
        [0, h * 6],
      ])
    function triangle(a, b, c) {
      const [ax, ay] = coords[a],
        [bx, by] = coords[b],
        [cx, cy] = coords[c],
        d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by))
      if (Math.abs(d) < 1e-8) return null
      const aa = ax * ax + ay * ay,
        bb = bx * bx + by * by,
        cc = cx * cx + cy * cy
      const x = (aa * (by - cy) + bb * (cy - ay) + cc * (ay - by)) / d,
        y = (aa * (cx - bx) + bb * (ax - cx) + cc * (bx - ax)) / d
      return { a, b, c, x, y, r: (ax - x) ** 2 + (ay - y) ** 2 }
    }
    let tris = [triangle(count, count + 1, count + 2)]
    for (let p = 0; p < count; p++) {
      const [x, y] = coords[p],
        boundary = new Map(),
        keep = []
      for (const t of tris) {
        if ((x - t.x) ** 2 + (y - t.y) ** 2 > t.r + 1e-6) {
          keep.push(t)
          continue
        }
        for (const [a, b] of [
          [t.a, t.b],
          [t.b, t.c],
          [t.c, t.a],
        ]) {
          const key = a < b ? a + ':' + b : b + ':' + a
          if (boundary.has(key)) boundary.delete(key)
          else boundary.set(key, [a, b])
        }
      }
      for (const [a, b] of boundary.values()) {
        const t = triangle(a, b, p)
        if (t) keep.push(t)
      }
      tris = keep
    }
    const faces = tris
      .filter((t) => t.a < count && t.b < count && t.c < count)
      .map((t) => {
        const a = coords[t.a],
          b = coords[t.b],
          c = coords[t.c]
        return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) > 0
          ? [t.a, t.b, t.c]
          : [t.a, t.c, t.b]
      })
    const rest = new Float32Array(count * 3)
    points.forEach((p, i) => {
      rest[i * 3] = p[0]
      rest[i * 3 + 1] = p[1]
    })
    const edgeMap = new Map()
    for (const f of faces)
      for (let k = 0; k < 3; k++) {
        const a = f[k],
          b = f[(k + 1) % 3],
          key = a < b ? a + ':' + b : b + ':' + a
        if (!edgeMap.has(key))
          edgeMap.set(key, [
            a * 3,
            b * 3,
            Math.hypot(
              points[a][0] - points[b][0],
              points[a][1] - points[b][1],
            ),
          ])
      }
    const edges = [...edgeMap.values()],
      target = new Float32Array(rest.length)
    // Overlapping curls, uneven dents and free corners produce a discarded-paper silhouette.
    for (let i = 0; i < count; i++) {
      const u = points[i][0] / w + 0.5,
        v = points[i][1] / h + 0.5
      const a =
        u * Math.PI * 3.7 + 0.7 * Math.sin(v * 12) + (random() - 0.5) * 0.5
      const b =
        (v - 0.5) * Math.PI * 2.2 +
        0.6 * Math.sin(u * 13) +
        (random() - 0.5) * 0.45
      const r = 57 + random() * 25 + 8 * Math.sin(u * 19 + v * 17)
      target[i * 3] = Math.cos(a) * Math.cos(b) * r
      target[i * 3 + 1] = Math.sin(b) * r * 1.07
      target[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r
    }
    function relax(pos, goal, iterations) {
      for (let iter = 0; iter < iterations; iter++) {
        for (let k = 0; k < pos.length; k++) pos[k] += (goal[k] - pos[k]) * 0.12
        for (const [a, b, length] of edges) {
          const dx = pos[b] - pos[a],
            dy = pos[b + 1] - pos[a + 1],
            dz = pos[b + 2] - pos[a + 2],
            d = Math.hypot(dx, dy, dz) || 1,
            f = ((d - length) / d) * 0.38
          pos[a] += dx * f
          pos[a + 1] += dy * f
          pos[a + 2] += dz * f
          pos[b] -= dx * f
          pos[b + 1] -= dy * f
          pos[b + 2] -= dz * f
        }
      }
    }
    const ball = target.slice()
    relax(ball, target, 110)
    // Center the volume so differently seeded balls remain on their own desk positions.
    for (let axis = 0; axis < 3; axis++) {
      let min = Infinity,
        max = -Infinity
      for (let k = axis; k < ball.length; k += 3) {
        min = Math.min(min, ball[k])
        max = Math.max(max, ball[k])
      }
      const center = (min + max) / 2
      for (let k = axis; k < ball.length; k += 3) ball[k] -= center
    }
    const frames = [ball],
      distance = [0],
      steps = 100,
      mesh = { rest, faces, edges, frames, distance, total: 0 }
    mesh.prepare = () => {
      if (frames.length > 1) return mesh
      for (let step = 1; step <= steps; step++) {
        const s = step / steps,
          pos = frames[step - 1].slice(),
          goal = new Float32Array(rest.length)
        for (let k = 0; k < goal.length; k++)
          goal[k] = ball[k] + (rest[k] - ball[k]) * s
        relax(pos, goal, 24)
        if (step === steps) pos.set(rest)
        let travel = 0
        for (let k = 0; k < pos.length; k++)
          travel += (pos[k] - frames[step - 1][k]) ** 2
        distance.push(distance[step - 1] + Math.sqrt(travel / count))
        frames.push(pos)
      }
      mesh.total = distance[distance.length - 1]
      return mesh
    }
    if (precompute) mesh.prepare()
    return mesh
  },
  sample(mesh, p) {
    if (p <= 0) return mesh.frames[0]
    if (p >= 1) return mesh.rest
    const d = p * mesh.total
    let low = 0,
      high = mesh.distance.length - 1
    while (high - low > 1) {
      const mid = (low + high) >> 1
      if (mesh.distance[mid] < d) low = mid
      else high = mid
    }
    const t =
        (d - mesh.distance[low]) /
        (mesh.distance[high] - mesh.distance[low] || 1),
      a = mesh.frames[low],
      b = mesh.frames[high],
      out = new Float32Array(a.length)
    for (let k = 0; k < a.length; k++) out[k] = a[k] + (b[k] - a[k]) * t
    return out
  },
  advance(p, target, dt, seconds) {
    return p < target
      ? Math.min(target, p + dt / seconds)
      : Math.max(target, p - dt / seconds)
  },
}

export const Focus = {
  pose(home, viewport, p) {
    const scale = Math.min(
      (viewport.width - 48) / 320,
      (viewport.height - 160) / 430,
      1.75,
    )
    return {
      x: home.x + (viewport.width / 2 - home.x) * p,
      y: home.y + (viewport.height / 2 - home.y) * p,
      scale: home.scale + (scale - home.scale) * p,
    }
  },
  constrain(x, y, width, height) {
    return {
      x: Math.max(60, Math.min(width - 60, x)),
      y: Math.max(60, Math.min(height - 60, y)),
    }
  },
}
