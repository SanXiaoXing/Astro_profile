import { Fold, Focus } from './mesh.mjs'
import { PaperRenderer } from './renderer.js'

let renderer = null
const instances = new Set()
let active = null

class PaperFoldElement extends HTMLElement {
  connectedCallback() {
    if (this.controller) return
    this.controller = new AbortController()
    const options = { signal: this.controller.signal }
    this.trigger = this.querySelector('.paper-fold-trigger')
    this.fallback = this.querySelector('.paper-fold-fallback')
    this.body = this.querySelector('.paper-fold-body')
    this.dialog = this.querySelector('dialog')
    this.reader = this.querySelector('.paper-fold-reader')
    this.stage = this.querySelector('.paper-fold-stage')
    this.thumbnail = this.querySelector('.paper-fold-thumbnail')
    this.closeButton = this.querySelector('.paper-fold-close')
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)')
    this.progress = 0
    this.target = 0
    this.frame = 0
    const seed = Number(this.dataset.seed) || 47
    this.rotation = [0.72, -0.55, -0.42 + (seed % 13) / 10]
    try {
      if (!renderer) {
        renderer = new PaperRenderer()
        const currentRenderer = renderer
        renderer.canvas.addEventListener('webglcontextlost', () => {
          if (renderer !== currentRenderer) return
          // Restore all HTML readers when the shared GPU context is lost.
          for (const instance of [...instances]) instance.disconnectedCallback()
        })
      }
      this.mesh = Fold.create(320, 430, seed, false)
      this.texture = renderer.texture(this.makeTexture())
    } catch (error) {
      console.warn('PaperFold: using accessible text fallback.', error)
      this.controller.abort()
      this.controller = null
      if (!instances.size) {
        renderer?.dispose()
        renderer = null
      }
      return
    }
    instances.add(this)
    this.reader.append(this.body)
    this.trigger.hidden = false
    this.fallback.hidden = true
    this.trigger.addEventListener('click', () => this.open(), options)
    this.closeButton.addEventListener('click', () => this.close(), options)
    this.dialog.addEventListener(
      'cancel',
      (event) => {
        event.preventDefault()
        this.close()
      },
      options,
    )
    this.dialog.addEventListener(
      'click',
      (event) => {
        if (event.target === this.dialog) this.close()
      },
      options,
    )
    this.dialog.addEventListener(
      'close',
      () => {
        if (active === this) this.release()
      },
      options,
    )
    this.reduce.addEventListener(
      'change',
      () => {
        if (this.reduce.matches && active === this) {
          this.progress = this.target
          this.animate()
        }
      },
      options,
    )
    this.observer = new ResizeObserver(() => {
      this.drawThumbnail()
      if (active === this) {
        this.home = this.anchor()
        this.drawStage()
      }
    })
    this.observer.observe(this)
    window.addEventListener(
      'resize',
      () => {
        if (active === this) {
          this.home = this.anchor()
          this.drawStage()
        }
      },
      options,
    )
    this.drawThumbnail()
    this.loadPreviewImage()
  }

  makeTexture(image) {
    const canvas = document.createElement('canvas')
    canvas.width = 768
    canvas.height = 1032
    const context = canvas.getContext('2d')
    context.fillStyle = '#f4f0e4'
    context.fillRect(0, 0, 768, 1032)
    context.fillStyle = '#455346'
    context.font = '32px serif'
    const text = (this.body.textContent || this.dataset.title)
      .replace(/\s+/g, ' ')
      .trim()
    // ponytail: a short text/image preview is enough for the moving mesh;
    // the full Markdown remains native HTML in the reader, including long posts.
    let line = '',
      y = 100
    if (image) {
      const scale = Math.min(
        640 / image.naturalWidth,
        440 / image.naturalHeight,
      )
      context.drawImage(
        image,
        (768 - image.naturalWidth * scale) / 2,
        60,
        image.naturalWidth * scale,
        image.naturalHeight * scale,
      )
      y = 560
    }
    for (const character of text.slice(0, 450)) {
      if (context.measureText(line + character).width > 630) {
        context.fillText(line, 64, y)
        line = ''
        y += 54
        if (y > 950) break
      }
      line += character
    }
    if (y <= 950) context.fillText(line, 64, y)
    return canvas
  }

  async loadPreviewImage() {
    const source = this.body.querySelector('img')
    if (!source) return
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = source.currentSrc || source.src
    try {
      await image.decode()
      if (!this.isConnected || !instances.has(this)) return
      const texture = renderer.texture(this.makeTexture(image))
      renderer.gl.deleteTexture(this.texture)
      renderer.textures.delete(this.texture)
      this.texture = texture
      this.drawThumbnail()
      if (active === this) this.drawStage()
    } catch {
      // Remote images without CORS still render normally in the HTML reader.
    }
  }

  drawThumbnail() {
    if (renderer)
      renderer.draw(
        this.thumbnail,
        this.mesh,
        0,
        this.rotation,
        { x: 60, y: 60, scale: 0.48 },
        this.texture,
      )
  }

  anchor() {
    const rect = this.thumbnail.getBoundingClientRect()
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      scale: 0.48,
    }
  }

  open() {
    if (active) return
    this.mesh.prepare()
    active = this
    this.home = this.anchor()
    this.target = 1
    this.progress = this.reduce.matches ? 1 : 0
    this.savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    this.reader.scrollTop = 0
    this.thumbnail.style.visibility = 'hidden'
    this.dialog.showModal()
    this.closeButton.focus({ preventScroll: true })
    this.previousTime = 0
    this.animate()
  }

  close() {
    if (active !== this || this.target === 0) return
    this.target = 0
    this.reader.hidden = true
    this.stage.hidden = false
    if (this.reduce.matches) this.progress = 0
    this.previousTime = 0
    this.animate()
  }

  drawStage() {
    const viewport = {
      width: this.dialog.clientWidth,
      height: this.dialog.clientHeight,
    }
    const pose = Focus.pose(this.home, viewport, this.progress)
    const end = Focus.pose(this.home, viewport, 1)
    this.reader.style.setProperty('--paper-width', `${end.scale * 320}px`)
    this.reader.style.setProperty('--paper-height', `${end.scale * 430}px`)
    renderer.draw(
      this.stage,
      this.mesh,
      this.progress,
      this.rotation,
      pose,
      this.texture,
    )
    this.reader.hidden = this.progress !== 1 || this.target !== 1
    this.stage.hidden = !this.reader.hidden
  }

  animate() {
    cancelAnimationFrame(this.frame)
    this.frame = requestAnimationFrame((now) => {
      if (active !== this) return
      const delta = this.previousTime
        ? Math.min((now - this.previousTime) / 1000, 0.05)
        : 0
      this.previousTime = now
      // Keep the reference's .8s constant-travel path, also when reversing.
      this.progress = Fold.advance(this.progress, this.target, delta, 0.8)
      this.drawStage()
      if (this.progress === 0 && this.target === 0) this.release()
      else if (this.progress !== this.target) this.animate()
      else this.previousTime = 0
    })
  }

  release() {
    cancelAnimationFrame(this.frame)
    active = null
    this.dialog.close()
    document.body.style.overflow = this.savedOverflow
    this.thumbnail.style.visibility = ''
    this.reader.hidden = true
    this.stage.hidden = false
    if (this.isConnected) this.trigger.focus({ preventScroll: true })
  }

  disconnectedCallback() {
    if (!this.controller) return
    if (active === this) this.release()
    cancelAnimationFrame(this.frame)
    this.observer?.disconnect()
    this.controller.abort()
    this.controller = null
    this.fallback.append(this.body)
    this.fallback.hidden = false
    this.trigger.hidden = true
    if (instances.delete(this)) {
      renderer.gl.deleteTexture(this.texture)
      renderer.textures.delete(this.texture)
    }
    if (!instances.size) {
      renderer?.dispose()
      renderer = null
    }
  }
}

if (!customElements.get('paper-fold'))
  customElements.define('paper-fold', PaperFoldElement)
