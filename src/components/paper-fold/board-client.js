import { defaultPaperMonth, constrainPaper, layoutPapers } from './board.mjs'

class PaperBoard extends HTMLElement {
  connectedCallback() {
    if (this.controller) return
    this.controller = new AbortController()
    const options = { signal: this.controller.signal }
    this.board = this.querySelector('.paper-board')
    this.input = this.querySelector('select')
    this.count = this.querySelector('[data-paper-count]')
    this.empty = this.querySelector('[data-paper-empty]')
    this.positions = new Map()
    this.input.value = defaultPaperMonth(
      Array.from(this.input.options, (option) => option.value).filter(Boolean),
    )
    this.input.addEventListener(
      'change',
      () => {
        this.selectMonth(this.input.value)
      },
      options,
    )
    this.board.addEventListener(
      'pointerdown',
      (event) => {
        const trigger = event.target.closest('.paper-fold-trigger')
        if (!trigger || event.button !== 0 || event.isPrimary === false) return
        const paper = trigger.closest('paper-fold')
        this.drag = {
          paper,
          trigger,
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          left: parseFloat(paper.style.left),
          top: parseFloat(paper.style.top),
          moved: false,
        }
        this.suppressClick = false
        trigger.setPointerCapture(event.pointerId)
      },
      options,
    )
    this.board.addEventListener(
      'pointermove',
      (event) => {
        const drag = this.drag
        if (!drag || event.pointerId !== drag.id) return
        const dx = event.clientX - drag.x,
          dy = event.clientY - drag.y
        if (!drag.moved && Math.hypot(dx, dy) < 6) return
        drag.moved = true
        drag.paper.classList.add('is-dragging')
        this.move(drag.paper, drag.left + dx, drag.top + dy)
      },
      options,
    )
    const endDrag = (event) => {
      if (!this.drag || event.pointerId !== this.drag.id) return
      this.suppressClick = this.drag.moved && event.type === 'pointerup'
      this.drag.paper.classList.remove('is-dragging')
      const trigger = this.drag.trigger
      this.drag = null
      if (trigger.hasPointerCapture(event.pointerId))
        trigger.releasePointerCapture(event.pointerId)
    }
    this.board.addEventListener('pointerup', endDrag, options)
    this.board.addEventListener('pointercancel', endDrag, options)
    this.board.addEventListener('lostpointercapture', endDrag, options)
    this.board.addEventListener(
      'click',
      (event) => {
        if (this.suppressClick && event.detail !== 0) {
          event.preventDefault()
          event.stopPropagation()
          this.suppressClick = false
        }
      },
      { ...options, capture: true },
    )
    this.board.addEventListener(
      'keydown',
      (event) => {
        if (!event.target.matches('.paper-fold-trigger')) return
        const direction = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        }[event.key]
        if (!direction) return
        event.preventDefault()
        const paper = event.target.closest('paper-fold'),
          step = event.shiftKey ? 30 : 10
        this.move(
          paper,
          parseFloat(paper.style.left) + direction[0] * step,
          parseFloat(paper.style.top) + direction[1] * step,
        )
      },
      options,
    )
    this.observer = new ResizeObserver(() => this.arrange())
    this.observer.observe(this.board)
    const paperId = new URL(window.location.href).searchParams.get('paper')
    const matchingTemplate = paperId && Array.from(this.querySelectorAll('template[data-month]'))
      .find((template) => Array.from(template.content.querySelectorAll('paper-fold')).some((paper) => paper.dataset.paperId === paperId))
    if (matchingTemplate) this.input.value = matchingTemplate.dataset.month
    this.selectMonth(this.input.value)
    if (matchingTemplate) {
      const paper = Array.from(this.board.querySelectorAll('paper-fold')).find((item) => item.dataset.paperId === paperId)
      const trigger = paper?.querySelector('.paper-fold-trigger')
      if (trigger && !trigger.hidden) trigger.click()
      else if (paper) paper.querySelector('details').open = true
    }
  }

  selectMonth(month) {
    this.month = month
    this.drag = null
    this.suppressClick = false
    const template = Array.from(
      this.querySelectorAll('template[data-month]'),
    ).find((item) => item.dataset.month === month)
    this.board.replaceChildren(
      ...(template ? [template.content.cloneNode(true)] : []),
    )
    this.count.textContent = `${this.board.children.length} 张纸`
    this.empty.hidden = this.board.children.length !== 0
    this.empty.textContent = month
      ? `${month.replace('-', ' 年 ')} 月，还没有留下记忆。`
      : '这里还没有留下记忆。'
    this.arrange()
  }

  arrange() {
    const papers = Array.from(this.board.querySelectorAll('paper-fold'))
    const width = this.board.clientWidth
    const { height, positions } = layoutPapers(papers.length, width)
    this.board.style.height = `${height}px`
    const saved = this.positions.get(this.month)
    papers.forEach((paper, index) => {
      const position = saved?.get(index)
      const point = position
        ? constrainPaper(position.x * width, position.y * height, width, height)
        : positions[index]
      paper.style.left = `${point.x}px`
      paper.style.top = `${point.y}px`
    })
    this.board.dataset.ready = ''
  }

  move(paper, x, y) {
    const width = this.board.clientWidth,
      height = this.board.clientHeight
    const position = constrainPaper(x, y, width, height)
    paper.style.left = `${position.x}px`
    paper.style.top = `${position.y}px`
    if (!this.positions.has(this.month))
      this.positions.set(this.month, new Map())
    this.positions
      .get(this.month)
      .set(Array.from(this.board.children).indexOf(paper), {
        x: position.x / width,
        y: position.y / height,
      })
  }

  disconnectedCallback() {
    this.controller?.abort()
    this.observer?.disconnect()
    this.controller = null
  }
}

if (!customElements.get('paper-board'))
  customElements.define('paper-board', PaperBoard)
