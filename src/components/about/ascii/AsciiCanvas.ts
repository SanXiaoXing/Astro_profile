import { prepareWithSegments, measureNaturalWidth } from '@chenglou/pretext'

type AsciiGlyph = {
  char: string
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  width: number
}

export type AsciiRenderer = {
  setMouse: (x: number, y: number) => void
  setTop: (top: number) => void
  readonly height: number
  destroy: () => void
}

// Physics constants
// 光标视觉尺寸为 36px（半径 18px），INFLUENCE_RADIUS 取 28 —— 比光标大一圈，
// 推开范围与光标视觉贴合，而不是原来 60 那种夸张的大圆。
const DAMPING = 0.82
const SPRING = 0.08
const INFLUENCE_RADIUS = 28
const FORCE_STRENGTH = 14

/** Extract the px font size from a CSS font shorthand — e.g. "700 8px FutureMono" → 8 */
function parseFontPx(font: string): number {
  const m = font.match(/(\d+(?:\.\d+)?)px/)
  return m ? parseFloat(m[1]!) : 8
}

export function createAsciiCanvas({
  stage,
  text,
  font,
}: {
  stage: HTMLElement
  text: string
  font: string
}): AsciiRenderer {
  // Create a single Canvas element, positioned within the stage
  const canvas = document.createElement('canvas')
  canvas.style.position = 'absolute'
  canvas.style.top = '0'
  canvas.style.left = '0'
  canvas.style.width = '100%'
  canvas.style.pointerEvents = 'none'
  canvas.style.cursor = 'none'
  stage.appendChild(canvas)

  const ctx = canvas.getContext('2d')!

  // 字体颜色随主题切换（--fontc 在 dark/light 下取不同值）。
  // 构造时读一次，再监听 theme-change 事件更新；否则 Canvas 会停留在旧主题颜色。
  let fontColor: string =
    getComputedStyle(document.documentElement).getPropertyValue('--fontc').trim() || '#fff'
  const readFontColor = () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--fontc').trim()
    if (v) fontColor = v
  }
  const onThemeChange = () => readFontColor()
  window.addEventListener('theme-change', onThemeChange)

  let glyphs: AsciiGlyph[] = []
  let mouseX = -9999
  let mouseY = -9999
  let rafId = 0
  let destroyed = false
  let top = 0
  let charW = 0
  let lineH = 0
  let totalH = 0
  let stageW = 0

  // Measure a single monospace character width via Pretext
  const measureCharWidth = () => {
    const probe = prepareWithSegments('-', font)
    charW = measureNaturalWidth(probe)
  }

  // Build glyph array directly from the raw text — ASCII art is pre-formatted,
  // each character must stay on its original (row, col) grid. Running it through
  // layoutWithLines would collapse whitespace and wrap lines at punctuation,
  // destroying the pattern. We only use Pretext to measure a single char width.
  const buildGlyphs = () => {
    if (!text || !font) return

    const fontSize = parseFontPx(font)
    lineH = Math.ceil(fontSize * 1.2)
    stageW = stage.clientWidth

    measureCharWidth()

    const rawLines = text.split('\n')
    const maxLineLen = rawLines.reduce((m, l) => Math.max(m, l.length), 0)
    const asciiW = Math.ceil(maxLineLen * charW)
    const centerX = Math.max(2, (stageW - asciiW) / 2)

    glyphs = []
    for (let li = 0; li < rawLines.length; li++) {
      const line = rawLines[li]!
      for (let ci = 0; ci < line.length; ci++) {
        const ch = line[ci]!
        glyphs.push({
          char: ch,
          baseX: centerX + ci * charW,
          baseY: top + li * lineH,
          x: centerX + ci * charW,
          y: top + li * lineH,
          vx: 0,
          vy: 0,
          width: charW,
        })
      }
    }

    totalH = rawLines.length * lineH

    // Resize canvas to match (reset transform to avoid dpr compounding)
    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.ceil(stageW * dpr)
    canvas.height = Math.ceil((totalH + lineH) * dpr)
    canvas.style.width = `${stageW}px`
    canvas.style.height = `${totalH + lineH}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // Physics update for all glyphs
  const updatePhysics = () => {
    for (const g of glyphs) {
      const dx = g.x - mouseX
      const dy = g.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < INFLUENCE_RADIUS && dist > 0) {
        const force = (1 - dist / INFLUENCE_RADIUS) * FORCE_STRENGTH
        g.vx += (dx / dist) * force
        g.vy += (dy / dist) * force
      }

      // Damping
      g.vx *= DAMPING
      g.vy *= DAMPING

      // Apply velocity
      g.x += g.vx
      g.y += g.vy

      // Spring back to base
      g.x += (g.baseX - g.x) * SPRING
      g.y += (g.baseY - g.y) * SPRING
    }
  }

  // Render frame
  const render = () => {
    if (destroyed) return

    ctx.clearRect(0, 0, stageW, totalH + lineH)
    updatePhysics()

    ctx.font = font
    ctx.fillStyle = fontColor
    ctx.textBaseline = 'top'

    for (const g of glyphs) {
      if (g.char === ' ' || g.char === '\n') continue
      ctx.fillText(g.char, g.x, g.y)
    }

    rafId = requestAnimationFrame(render)
  }

  // Start animation loop
  const start = () => {
    if (rafId) return
    rafId = requestAnimationFrame(render)
  }

  // Build and start
  buildGlyphs()
  start()

  // ResizeObserver: rebuild on stage width change
  const ro = new ResizeObserver(() => {
    const newW = stage.clientWidth
    if (newW !== stageW && newW > 0) {
      buildGlyphs()
    }
  })
  ro.observe(stage)

  return {
    setMouse(x: number, y: number) {
      mouseX = x
      mouseY = y
    },
    setTop(newTop: number) {
      if (newTop !== top) {
        top = newTop
        buildGlyphs()
      }
    },
    get height() {
      return totalH + lineH
    },
    destroy() {
      destroyed = true
      if (rafId) cancelAnimationFrame(rafId)
      rafId = 0
      ro.disconnect()
      window.removeEventListener('theme-change', onThemeChange)
      canvas.remove()
    },
  }
}