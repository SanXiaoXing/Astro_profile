// WebGL shaders and facet lighting ported from the supplied 纸间 experiment.
export class PaperRenderer {
  constructor() {
    this.canvas = document.createElement('canvas')
    const gl = this.canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    })
    if (!gl) throw new Error('WebGL unavailable')
    this.gl = gl
    this.textures = new Set()
    const compile = (type, source) => {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader))
      return shader
    }
    const vertex = compile(
      gl.VERTEX_SHADER,
      `attribute vec3 position;attribute vec2 uv;attribute float shade;attribute vec3 corner;uniform vec2 viewport;uniform vec2 center;varying vec2 vUV;varying float vShade;varying vec3 vCorner;void main(){float w=1.0-position.z/1400.0;gl_Position=vec4((position.x+center.x*w)*2.0/viewport.x,-(position.y+center.y*w)*2.0/viewport.y,-position.z/1600.0,w);vUV=uv;vShade=shade;vCorner=corner;}`,
    )
    const fragment = compile(
      gl.FRAGMENT_SHADER,
      `precision mediump float;uniform sampler2D image;uniform float crumple;varying vec2 vUV;varying float vShade;varying vec3 vCorner;void main(){vec3 ink=texture2D(image,vUV).rgb;vec3 back=vec3(.96,.95,.918);vec3 paper=gl_FrontFacing?back:ink;float edge=min(vCorner.x,min(vCorner.y,vCorner.z));float crease=1.0-(1.0-smoothstep(0.0,.025,edge))*(.012+.065*crumple);gl_FragColor=vec4(paper*vShade*crease,1.0);}`,
    )
    this.program = gl.createProgram()
    gl.attachShader(this.program, vertex)
    gl.attachShader(this.program, fragment)
    gl.linkProgram(this.program)
    gl.deleteShader(vertex)
    gl.deleteShader(fragment)
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(this.program))
    gl.useProgram(this.program)
    this.buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    for (const [name, size, offset] of [
      ['position', 3, 0],
      ['uv', 2, 12],
      ['shade', 1, 20],
      ['corner', 3, 24],
    ]) {
      const location = gl.getAttribLocation(this.program, name)
      gl.enableVertexAttribArray(location)
      gl.vertexAttribPointer(location, size, gl.FLOAT, false, 36, offset)
    }
    this.viewport = gl.getUniformLocation(this.program, 'viewport')
    this.center = gl.getUniformLocation(this.program, 'center')
    this.crumple = gl.getUniformLocation(this.program, 'crumple')
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
    gl.clearColor(0, 0, 0, 0)
  }

  texture(source) {
    const gl = this.gl,
      texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    this.textures.add(texture)
    return texture
  }

  draw(canvas, mesh, progress, rotation, pose, texture) {
    const { width, height } = canvas.getBoundingClientRect()
    if (!width || !height) return
    const dpr = Math.min(devicePixelRatio || 1, 2),
      gl = this.gl
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    this.canvas.width = canvas.width
    this.canvas.height = canvas.height
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.useProgram(this.program)
    gl.uniform2f(this.viewport, width, height)
    gl.uniform2f(this.center, pose.x - width / 2, pose.y - height / 2)
    const closed = 1 - progress
    const [ax, ay, az] = rotation.map((angle) => angle * closed)
    const points = Fold.sample(mesh, progress),
      positions = []
    for (let k = 0; k < points.length; k += 3) {
      let x = points[k],
        y = points[k + 1],
        z = points[k + 2]
      ;[y, z] = [
        y * Math.cos(ax) - z * Math.sin(ax),
        y * Math.sin(ax) + z * Math.cos(ax),
      ]
      ;[x, z] = [
        x * Math.cos(ay) + z * Math.sin(ay),
        -x * Math.sin(ay) + z * Math.cos(ay),
      ]
      positions.push([
        x * Math.cos(az) - y * Math.sin(az),
        x * Math.sin(az) + y * Math.cos(az),
        z,
      ])
    }
    const data = []
    for (const face of mesh.faces) {
      const [a, b, c] = face.map((index) => positions[index])
      const u = b.map((v, k) => v - a[k]),
        v = c.map((v, k) => v - a[k])
      const n = [
        u[1] * v[2] - u[2] * v[1],
        u[2] * v[0] - u[0] * v[2],
        u[0] * v[1] - u[1] * v[0],
      ]
      const light =
        ((-n[0] * 0.35 - n[1] * 0.45 + n[2] * 0.82) * (n[2] < 0 ? -1 : 1)) /
        (Math.hypot(...n) || 1)
      const shade =
        (0.55 + 0.46 * Math.max(0, light)) *
        (1 -
          closed *
            0.13 *
            Math.max(0, Math.min(1, (20 - (a[2] + b[2] + c[2]) / 3) / 90)))
      for (let k = 0; k < 3; k++) {
        const index = face[k],
          position = positions[index]
        data.push(
          ...position.map((value) => value * pose.scale),
          mesh.rest[index * 3] / 320 + 0.5,
          mesh.rest[index * 3 + 1] / 430 + 0.5,
          shade,
          k === 0 ? 1 : 0,
          k === 1 ? 1 : 0,
          k === 2 ? 1 : 0,
        )
      }
    }
    gl.uniform1f(this.crumple, closed)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW)
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 9)
    const context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(this.canvas, 0, 0)
  }

  dispose() {
    for (const texture of this.textures) this.gl.deleteTexture(texture)
    this.gl.deleteBuffer(this.buffer)
    this.gl.deleteProgram(this.program)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

import { Fold } from './mesh.mjs'
