import { useEffect } from 'react'
import {
  layoutNextLine,
  layoutWithLines,
  prepareWithSegments,
  measureNaturalWidth,
  clearCache,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '@chenglou/pretext'
import { createAsciiCanvas, type AsciiRenderer } from './about/ascii/AsciiCanvas'

/**
 * 将 About 页面渲染为一个 Pretext 场景：
 *  - 抽取 .about-title / .about-subtitle / .about-paragraph 的文本
 *  - 隐藏原有流式内容（.about-header / .about-content），保留 WorkLink 不受影响
 *  - 在 .about-page 顶部插入 .pretext-stage，全部文本由 Pretext 排版
 *  - ASCII（favicon-ascii.txt）由 Pretext 排版为矩形障碍，正文环绕
 *  - favicon.svg 作为跟随光标，同时是圆形障碍，正文实时重排
 *
 * 组件 return null，所有产物在 useEffect 中创建并在清理时完整还原。
 */

const CSS = `
.about-page.pretext-scene .about-header,
.about-page.pretext-scene .about-content { display: none; }

.pretext-stage {
  position: relative;
  width: 100%;
  margin: 0 0 3rem;
}
.pretext-stage,
.pretext-stage .pt-line,
.pretext-stage .pt-ascii-line {
  cursor: none;
}
.pretext-stage .pt-line,
.pretext-stage .pt-ascii-line {
  position: absolute;
  white-space: pre;
  transform: translateZ(0);       /* 合成层，避免重排抖动 */
  user-select: text;
}
.pretext-stage .pt-headline { color: var(--fontc); font-weight: 700; letter-spacing: -0.01em; }
.pretext-stage .pt-subtitle { color: var(--fontc); opacity: 0.6; }
.pretext-stage .pt-section-title { color: var(--fontc); font-weight: 700; opacity: 0.95; letter-spacing: -0.01em; }
.pretext-stage .pt-body { color: var(--fontc); opacity: 0.88; }
.pretext-stage .pt-ascii-line {
  color: var(--fontc);
  opacity: 1; /* ASCII 是装饰纹理：半透明会让细笔画在浅色背景上发灰发浅，须实心渲染 */
  font-family: var(--font-family-mono, "FutureMono", ui-monospace, monospace);
  font-weight: 700; /* 加粗让细笔画在浅色背景下更清晰 */
  user-select: none;
}

/* 浅色模式：纯黑 + 描边加粗 — 小字号 ASCII 笔画太细，--fontc 显灰 */
html.light .pretext-stage .pt-ascii-line {
  color: #000;
  -webkit-text-stroke: 0.4px #000;
  paint-order: stroke fill;
}

@media (max-width: 640px) {
  .pretext-stage .pt-ascii-line {
    font-size: 4px; /* 移动端确保 ASCII 不溢出，由 JS 动态覆盖 */
  }
}

.pretext-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 36px;
  height: 36px;
  pointer-events: none;            /* 不影响任何指针事件 */
  z-index: 9999;
  opacity: 0;
  transition: opacity 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  user-select: none;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.45));
  will-change: transform;
}
`

// 字体（canvas font 简写，须与渲染一致；noto-serif 覆盖 CJK）
const HEADLINE_FONT = '700 36px "noto-serif", "EmblemaOne", serif'
const HEADLINE_LINE = 44
const SUBTITLE_FONT = '400 14px "noto-serif", serif'
const SUBTITLE_LINE = 22
const SECTION_TITLE_FONT = '700 22px "noto-serif", serif'
const SECTION_TITLE_LINE = 30
const BODY_FONT = '400 18px "noto-serif", serif'
const BODY_LINE = 30
const PARAGRAPH_GAP = 14
const SECTION_TITLE_GAP = 8
const ASCII_MEASURE_FONT = '8px "FutureMono", ui-monospace, monospace'

// 障碍参数（参照 editorial-engine）
const CURSOR_RADIUS = 30
const CURSOR_HPAD = 6
const CURSOR_VPAD = 2
const ASCII_VPAD = 4
const MIN_SLOT_W = 40

const CURSOR_LERP = 0.32

type Interval = { left: number; right: number }
type PositionedLine = { x: number; y: number; text: string }
type RectObs = { x: number; y: number; w: number; h: number }
type CircleObs = { cx: number; cy: number; r: number; hPad: number; vPad: number }

function carveSlots(base: Interval, blocked: Interval[], minSlotW = MIN_SLOT_W): Interval[] {
  let slots = [base]
  for (const b of blocked) {
    const next: Interval[] = []
    for (const s of slots) {
      if (b.right <= s.left || b.left >= s.right) {
        next.push(s)
        continue
      }
      if (b.left > s.left) next.push({ left: s.left, right: b.left })
      if (b.right < s.right) next.push({ left: b.right, right: s.right })
    }
    slots = next
  }
  return slots.filter((s) => s.right - s.left >= minSlotW)
}

function circleIntervalForBand(o: CircleObs, bandTop: number, bandBottom: number): Interval | null {
  const top = bandTop - o.vPad
  const bottom = bandBottom + o.vPad
  if (top >= o.cy + o.r || bottom <= o.cy - o.r) return null
  const minDy = o.cy >= top && o.cy <= bottom ? 0 : o.cy < top ? top - o.cy : o.cy - bottom
  if (minDy >= o.r) return null
  const maxDx = Math.sqrt(o.r * o.r - minDy * minDy)
  return { left: o.cx - maxDx - o.hPad, right: o.cx + maxDx + o.hPad }
}

/** 单列障碍感知排版（参照 editorial-engine.layoutColumn，简化为单列、多槽填充）。 */
function layoutColumnObstacle(
  prepared: PreparedTextWithSegments,
  start: LayoutCursor,
  regionX: number,
  regionY: number,
  regionW: number,
  regionH: number,
  lineHeight: number,
  circles: CircleObs[],
  rects: RectObs[],
): { lines: PositionedLine[]; cursor: LayoutCursor; endY: number } {
  let cursor: LayoutCursor = start
  const lines: PositionedLine[] = []
  let lineTop = regionY
  let exhausted = false

  while (lineTop + lineHeight <= regionY + regionH && !exhausted) {
    const bandTop = lineTop
    const bandBottom = lineTop + lineHeight
    const blocked: Interval[] = []

    for (const c of circles) {
      const iv = circleIntervalForBand(c, bandTop, bandBottom)
      if (iv) blocked.push(iv)
    }
    for (const r of rects) {
      if (bandBottom <= r.y || bandTop >= r.y + r.h) continue
      blocked.push({ left: r.x, right: r.x + r.w })
    }

    const slots = carveSlots({ left: regionX, right: regionX + regionW }, blocked)
    if (slots.length === 0) {
      lineTop += lineHeight
      continue
    }
    // 从左到右填每个槽
    slots.sort((a, b) => a.left - b.left)
    for (const s of slots) {
      const w = s.right - s.left
      const line = layoutNextLine(prepared, cursor, w)
      if (line === null) {
        exhausted = true
        break
      }
      lines.push({ x: Math.round(s.left), y: Math.round(lineTop), text: line.text })
      cursor = line.end
    }
    lineTop += lineHeight
  }

  return { lines, cursor, endY: lineTop }
}

export default function AboutInteraction() {
  useEffect(() => {
    const page = document.querySelector<HTMLElement>('.about-page')
    if (!page) return

    let cancelled = false
    let cleaned = false
    const cleanups: Array<() => void> = []

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // 注入样式
    const styleEl = document.createElement('style')
    styleEl.setAttribute('data-pretext', '')
    styleEl.textContent = CSS
    document.head.appendChild(styleEl)
    cleanups.push(() => styleEl.remove())

    // 抽取文本
    const titleEl = page.querySelector<HTMLElement>('.about-header .about-title')
    const subtitleEl = page.querySelector<HTMLElement>('.about-subtitle')
    const contentEl = page.querySelector<HTMLElement>('.about-content')
    const headlineText = (titleEl?.textContent ?? '').trim()
    const subtitleText = (subtitleEl?.textContent ?? '').trim()
    // 抽取 .about-content 中的内容序列（标题 + 段落保持原始顺序）
    const contentSequence: { type: 'section-title' | 'body'; text: string }[] = []
    if (contentEl) {
      for (const child of contentEl.children) {
        if (child.matches('h2.about-title')) {
          const t = (child.textContent ?? '').trim()
          if (t) contentSequence.push({ type: 'section-title', text: t })
        } else if (child.matches('p.about-paragraph')) {
          const t = (child.textContent ?? '').trim()
          if (t) contentSequence.push({ type: 'body', text: t })
        }
      }
    }
    if (!headlineText && !contentSequence.length) return // 无内容可渲染

    page.classList.add('pretext-scene')
    cleanups.push(() => page.classList.remove('pretext-scene'))

    // stage
    const stage = document.createElement('div')
    stage.className = 'pretext-stage'
    page.insertBefore(stage, page.firstChild)
    cleanups.push(() => stage.remove())

    // 光标
    const cursorEl = document.createElement('img')
    cursorEl.className = 'pretext-cursor'
    cursorEl.src = '/favicon.svg'
    cursorEl.alt = ''
    cursorEl.setAttribute('aria-hidden', 'true')
    document.body.appendChild(cursorEl)
    cleanups.push(() => cursorEl.remove())

    // 行 span 池（按类别）
    const syncPool = (pool: HTMLSpanElement[], count: number, cls: string): HTMLSpanElement[] => {
      while (pool.length < count) {
        const el = document.createElement('span')
        el.className = cls
        stage.appendChild(el)
        pool.push(el)
      }
      for (let i = 0; i < pool.length; i++) pool[i]!.style.display = i < count ? '' : 'none'
      return pool
    }
    const headlinePool: HTMLSpanElement[] = []
    const subtitlePool: HTMLSpanElement[] = []
    const sectionTitlePool: HTMLSpanElement[] = []
    const bodyPool: HTMLSpanElement[] = []
    cleanups.push(() => {
      ;[headlinePool, subtitlePool, sectionTitlePool, bodyPool].forEach((p) => p.forEach((el) => el.remove()))
    })

    // 状态
    let stageW = 0
    let mouseX = -9999
    let mouseY = -9999
    let cursorLocalX = -9999
    let cursorLocalY = -9999
    let mouseInside = false
    let dirty = true
    let rafId = 0

    // 缓存 prepared（字体加载后一次性）
    let preparedHeadline: PreparedTextWithSegments | null = null
    let preparedSubtitle: PreparedTextWithSegments | null = null
    let preparedContentSequence: { type: 'section-title' | 'body'; prepared: PreparedTextWithSegments }[] = []
    let asciiText = ''
    let asciiFont = ''
    let asciiRenderer: AsciiRenderer | null = null

    const setup = async () => {
      try {
        await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready
      } catch {
        /* noop */
      }
      if (cancelled) return

      preparedHeadline = headlineText ? prepareWithSegments(headlineText, HEADLINE_FONT) : null
      preparedSubtitle = subtitleText ? prepareWithSegments(subtitleText, SUBTITLE_FONT) : null
      preparedContentSequence = contentSequence.map((item) => ({
        type: item.type,
        prepared: prepareWithSegments(item.text, item.type === 'section-title' ? SECTION_TITLE_FONT : BODY_FONT),
      }))

      // ASCII：测量自然宽度后反推字号，再以最终字号重新 prepare
      try {
        const res = await fetch('/favicon-ascii.txt')
        if (res.ok) asciiText = await res.text()
      } catch {
        asciiText = ''
      }
      if (cancelled) return

      if (asciiText) {
        stageW = stage.clientWidth || page.clientWidth
        // 响应式宽度：移动端占更多空间，桌面端保持适中
        const widthFrac = stageW < 640 ? 0.92 : 0.5
        const targetW = Math.max(160, stageW * widthFrac)

        // 保留原始行结构，不自动换行
        const rawLines = asciiText.split('\n')
        const maxLineLen = Math.max(...rawLines.map((l) => l.length))

        // 测量单个字符在 8px 下的宽度，按最长行推算字号
        const charProbe = prepareWithSegments('-', ASCII_MEASURE_FONT)
        const charW8 = measureNaturalWidth(charProbe)
        const fontPx =
          maxLineLen > 0 ? Math.max(3.5, Math.min(8, (8 * targetW) / (maxLineLen * charW8))) : 6

        // 字重加入 font 简写
        asciiFont = `700 ${fontPx}px "FutureMono", ui-monospace, monospace`
        asciiRenderer = createAsciiCanvas({ stage, text: asciiText, font: asciiFont })
      }

      dirty = true
      schedule()
    }

    const projectLines = (
      pool: HTMLSpanElement[],
      lines: PositionedLine[],
      cls: string,
      font: string,
      lineH: number,
    ) => {
      const els = syncPool(pool, lines.length, cls)
      for (let i = 0; i < lines.length; i++) {
        const el = els[i]!
        const l = lines[i]!
        if (el.textContent !== l.text) el.textContent = l.text
        el.style.left = `${l.x}px`
        el.style.top = `${l.y}px`
        el.style.font = font
        el.style.lineHeight = `${lineH}px`
      }
    }

    const render = () => {
      rafId = 0
      if (cancelled) return
      stageW = stage.clientWidth || page.clientWidth

      // 光标平滑跟随：局部坐标用于障碍；img 视口坐标 = 局部 + stage 原点
      if (mouseInside) {
        // 首次进入或离开后归来：snap 到当前位置，避免从 -9999 缓动飘入
        if (cursorLocalX < -9000 || cursorLocalY < -9000) {
          cursorLocalX = mouseX
          cursorLocalY = mouseY
        } else {
          cursorLocalX += (mouseX - cursorLocalX) * CURSOR_LERP
          cursorLocalY += (mouseY - cursorLocalY) * CURSOR_LERP
        }
        const rect = stage.getBoundingClientRect()
        cursorEl.style.opacity = '1'
        cursorEl.style.transform = `translate(${(cursorLocalX + rect.left).toFixed(2)}px, ${(cursorLocalY + rect.top).toFixed(2)}px) translate(-50%, -50%)`
      } else {
        cursorEl.style.opacity = '0'
      }

      if (dirty) {
        dirty = false
        layoutAndProject()
      } else if (mouseInside) {
        // 光标移动 → 障碍位置变化，重排
        layoutAndProject()
      }
    }

    const schedule = () => {
      if (rafId) return
      rafId = requestAnimationFrame(render)
    }

    const layoutAndProject = () => {
      if (!preparedHeadline && !preparedContentSequence.length) return

      const circles: CircleObs[] =
        mouseInside && !reduced
          ? [{ cx: cursorLocalX, cy: cursorLocalY, r: CURSOR_RADIUS, hPad: CURSOR_HPAD, vPad: CURSOR_VPAD }]
          : []

      let y = 0
      // 1. 标题（无障碍，避免标题被推开影响阅读）
      const hlLines: PositionedLine[] = []
      if (preparedHeadline) {
        const r = layoutWithLines(preparedHeadline, stageW, HEADLINE_LINE)
        r.lines.forEach((l, i) => hlLines.push({ x: 0, y: i * HEADLINE_LINE, text: l.text }))
        y = hlLines.length * HEADLINE_LINE
      }
      projectLines(headlinePool, hlLines, 'pt-line pt-headline', HEADLINE_FONT, HEADLINE_LINE)

      // 2. 副标题
      const subLines: PositionedLine[] = []
      if (preparedSubtitle) {
        const r = layoutWithLines(preparedSubtitle, stageW, SUBTITLE_LINE)
        r.lines.forEach((l, i) => subLines.push({ x: 0, y: y + i * SUBTITLE_LINE, text: l.text }))
        y += subLines.length * SUBTITLE_LINE + 6
      }
      projectLines(subtitlePool, subLines, 'pt-line pt-subtitle', SUBTITLE_FONT, SUBTITLE_LINE)

      // 3. ASCII 图案：Canvas 渲染器（独立物理引擎，每帧自动更新）
      let asciiBottom = 0
      if (asciiRenderer) {
        const asciiTop = y + 14
        asciiRenderer.setTop(asciiTop)
        y = asciiTop + asciiRenderer.height + 20
        asciiBottom = asciiTop + asciiRenderer.height + 16
      }

      // 4. 正文内容序列：按原始顺序排版（标题+段落），均受光标障碍影响
      const bodyTop = y + 18
      const allSectionTitle: PositionedLine[] = []
      const allBody: PositionedLine[] = []
      let curY = bodyTop
      for (const item of preparedContentSequence) {
        const lineH = item.type === 'section-title' ? SECTION_TITLE_LINE : BODY_LINE
        const gap = item.type === 'section-title' ? SECTION_TITLE_GAP : PARAGRAPH_GAP
        const start: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
        const res = layoutColumnObstacle(
          item.prepared,
          start,
          0,
          curY,
          stageW,
          100000,
          lineH,
          circles,
          [], // ASCII 已在上方，正文无需再绕开它
        )
        for (const l of res.lines) {
          if (item.type === 'section-title') {
            allSectionTitle.push(l)
          } else {
            allBody.push(l)
          }
        }
        curY = res.endY + gap
      }
      projectLines(sectionTitlePool, allSectionTitle, 'pt-line pt-section-title', SECTION_TITLE_FONT, SECTION_TITLE_LINE)
      projectLines(bodyPool, allBody, 'pt-line pt-body', BODY_FONT, BODY_LINE)

      // stage 高度 = 正文末尾 / ASCII 底部 较大者
      const bodyBottom = curY
      stage.style.height = `${Math.max(bodyBottom, asciiBottom) + 16}px`
    }

    // 事件：障碍用 stage 局部坐标，光标 img 视口坐标在 render 中由局部+原点换算
    const onLeave = () => {
      mouseInside = false
      if (asciiRenderer) asciiRenderer.setMouse(-9999, -9999)
      schedule()
    }
    const onResize = () => {
      dirty = true
      schedule()
    }
    const onViewMove = (e: MouseEvent) => {
      const rect = stage.getBoundingClientRect()
      const localX = e.clientX - rect.left
      const localY = e.clientY - rect.top
      mouseInside = localX >= 0 && localX <= rect.width && localY >= 0 && localY <= rect.height
      mouseX = mouseInside ? localX : -9999
      mouseY = mouseInside ? localY : -9999
      // ASCII 物理引擎：传入 stage 局部坐标，与 glyph.baseX/baseY 坐标系一致
      if (asciiRenderer) asciiRenderer.setMouse(mouseX, mouseY)
      schedule()
    }
    const onWindowOut = (e: MouseEvent) => {
      // 鼠标离开窗口 → 隐藏光标、停止重排
      if (e.relatedTarget === null) onLeave()
    }
    const onVisibility = () => {
      if (!document.hidden) schedule()
    }

    window.addEventListener('mousemove', onViewMove)
    window.addEventListener('mouseout', onWindowOut)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)
    cleanups.push(() => {
      window.removeEventListener('mousemove', onViewMove)
      window.removeEventListener('mouseout', onWindowOut)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    })

    setup()

    return () => {
      cancelled = true
      if (rafId) cancelAnimationFrame(rafId)
      if (cleaned) return
      cleaned = true
      // 反向清理
      for (let i = cleanups.length - 1; i >= 0; i--) {
        try {
          cleanups[i]!()
        } catch {
          /* noop */
        }
      }
      try {
        clearCache()
      } catch {
        /* noop */
      }
    }
  }, [])

  return null
}
