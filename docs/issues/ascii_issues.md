如果你要让 AI（Claude Code / Codex / Trae Agent 等）直接修改你当前的 `AboutInteraction.ts`，不要描述「我要做 Pretext 效果」，因为模型容易误解成 DOM 动画。

应该明确：

* 当前代码结构
* 保留哪些
* 删除哪些
* 引入什么架构
* 目标效果

下面这个 Prompt 可以直接使用：

---

```markdown
# Task: Refactor ASCII interaction to Pretext Canvas renderer

## Context

当前项目使用 React + TypeScript + @chenglou/pretext 实现 About 页面动态排版。

当前 AboutInteraction.ts 已经实现：

- 使用 prepareWithSegments()
- 使用 layoutWithLines()/layoutNextLine()
- 标题、副标题、正文由 Pretext layout 控制
- 鼠标 favicon.svg 作为 cursor
- 正文支持 circle obstacle 动态避让

但是 ASCII 图案目前不是 Pretext renderer：

当前实现：

ASCII text
→ split('\n')
→ asciiLines
→ 每行 span absolute positioning
→ 根据鼠标距离移动整行

这种方式只能产生 line displacement，不是真正的 Pretext kinetic typography。

需要重构。

---

# Goal

将 ASCII 图案改造成独立 Canvas renderer。

目标效果：

鼠标移动到 ASCII 区域：

- 鼠标作为中心点产生 radial force field
- ASCII 中每个字符独立受到影响
- 字符向外扩散
- 离开鼠标后弹性恢复
- 效果类似水滴进入文字粒子场

不要移动整个 ASCII block。

---

# Architecture Requirement

最终结构：

```

AboutInteraction.ts

```
    |
    |
    +---- Text Renderer
    |        |
    |        + DOM absolute spans
    |
    |
    +---- ASCII Renderer
             |
             + Canvas
             |
             + Pretext layout
             |
             + Glyph physics
```

```

---

# Important

不要使用：

- character span DOM
- 每个字符一个 HTML element
- CSS transform 动画

ASCII 必须 Canvas 绘制。

原因：

Pretext 本身是 DOM-free text layout engine。

使用：

prepareWithSegments()
+
layoutWithLines()

获取文本布局信息，然后自行 Canvas render。

Reference:

Pretext manual rendering flow:

prepareWithSegments()
→ layoutWithLines()
→ custom renderer(Canvas/SVG/WebGL)


---

# Implementation Requirements

## 1. Create new module

创建：

```

components/about/ascii/AsciiCanvas.ts

````

负责：

- prepareWithSegments()
- layoutWithLines()
- ASCII glyph generation
- Canvas rendering
- mouse physics
- animation loop


---

## 2. Glyph data structure


不要保存 line。

保存 character:

```ts
type AsciiGlyph = {

 char:string

 baseX:number
 baseY:number

 x:number
 y:number

 vx:number
 vy:number

 width:number
}
````

---

## 3. Generate glyphs

流程：

```
asciiText

↓

prepareWithSegments()

↓

layoutWithLines()

↓

lines

↓

iterate every character

↓

AsciiGlyph[]
```

每个字符必须有独立坐标。

---

## 4. Physics

实现 radial force:

```
distance =
sqrt(
(dx)^2+
(dy)^2
)


if distance < radius:

force =
1-distance/radius


velocity += direction * force
```

加入：

* velocity damping
* spring back

示例：

```ts
vx *= 0.82

vy *= 0.82


x += vx

y += vy


x += (baseX-x)*0.08

y += (baseY-y)*0.08
```

---

## 5. Canvas renderer

每帧：

```
clearRect()

update glyph physics

fillText()
```

字体必须和原 ASCII 保持一致：

```
FutureMono
monospace
```

颜色：

使用：

```
var(--fontc)
```

保持 ASCII 与正文颜色一致。

---

# Modify AboutInteraction.ts

删除：

```
asciiLines

asciiPool

asciiRender

ASCII_PART_MAX

lineCenterX

lineCenterY
```

删除：

```
整行 ASCII 位移逻辑
```

增加：

```ts
import {
 createAsciiCanvas
} from './ascii/AsciiCanvas'
```

初始化：

```ts
const asciiRenderer =
 createAsciiCanvas({
   stage,
   text: asciiText,
   font: asciiFont,
 })
```

mousemove:

不要重新 layout。

只调用：

```ts
asciiRenderer.setMouse(
 x,
 y
)
```

---

# Keep unchanged

不要修改：

* headline layout
* subtitle layout
* body layout
* circle obstacle algorithm
* cursor favicon rendering
* cleanup strategy

正文仍然保持：

Pretext layout + obstacle flow。

---

# Final expected result

Before:

```
ASCII block

##########
##########
##########

mouse

entire block moves
```

After:

```
ASCII block


##########
###   ####
##     ###
###   ####


mouse center

characters individually pushed


release:

characters smoothly return
```

---

请直接修改现有代码。

不要解释方案。

输出：

1. 修改后的 AboutInteraction.ts
2. 新增 AsciiCanvas.ts
3. 说明删除了哪些旧逻辑

```
