# 纸间 / PaperFold

基于本地 `g-w-n/outputs/index.html` 中的折纸实验，保留不规则三角网格、光照、0.8 秒匀速展开及折回路径。多个组件共用一个 WebGL 上下文，避免纸张增多时触及浏览器上下文数量限制。

## 写 Markdown

预览地址：`/papers`。在 `src/content/papers/` 下新建 `.md` 文件，每份文件对应一张纸：

```md
---
title: 今天的一点记录
date: 2026-10-22
draft: false
---

# 今天

支持 **粗体**、_斜体_、列表、引用、链接、表格和代码块。

![图片说明](/images/my-photo.jpg)
```

将本地图片放入 `public/images/`，Markdown 中使用 `/images/文件名`；也可以使用 HTTPS 图片地址。`draft: true` 的纸张不会出现在页面。标题与日期由 frontmatter 自动显示在展开后的纸张内部，正文无需重复写标题。

月份下拉框只列出已有非草稿内容的月份，按新到旧排序。默认显示当前月份（北京时间）；当前月没有内容时，默认显示最近一个有内容的月份。一次只将所选月份的纸团放到画布中，没有“全部”选项，也不会列出没有内容的月份。所有月份均无记录时禁用下拉框并显示空状态。

纸团可用鼠标或触摸拖动，拖动后不会误打开；聚焦纸团后也可用方向键移动，Shift 加方向键加快移动。位置在当前页面内按月份暂存，切换月份后回来会保留，刷新后恢复初始散放。

展开后的内容复用 Astro 的 Markdown 编译流程，包括现有的代码高亮与图片处理。长文章、宽表格和代码块可以滚动阅读，文字可选中，链接可点击。动画纹理使用正文摘要和第一张图片预览；完整排版以展开后的 HTML 为准。远程图片如不支持跨域纹理读取，纸团会使用文字预览，展开后仍显示原图。

## 在其他页面复用

```astro
---
import PaperFold from '../components/PaperFold.astro'
import { getEntry } from 'astro:content'
const paper = await getEntry('papers', '20261022')
if (!paper) throw new Error('找不到纸张内容')
const { Content } = await paper.render()
---

<PaperFold title={paper.data.title} date={paper.data.date} seed={47}>
  <Content />
</PaperFold>
```

`title` 用于纸张内部标题与无障碍名称，纸团外不显示标题；`date` 用于内部日期；`seed` 决定固定的褶皱形状，建议多张纸使用不同值；`class` 可用于外部布局。组件不需要 `client:load`，脚本由 Astro 自动加载。

点击纸团打开，点击右上角关闭按钮、纸张外侧或按 Escape 折回，并恢复按钮焦点。系统开启“减少动态效果”时直接显示内容。不支持 WebGL 或禁用 JavaScript 时显示原生可展开的完整正文。

验证网格、月份与拖动边界：`node --test tests/paper-fold.test.mjs tests/paper-board.test.mjs`。执行 `npm run build` 验证 Markdown 集合及页面构建，再运行 `node --test tests/paper-fold-build.test.mjs` 验证实际生成的月份模板、内部标题日期与无脚本阅读结构。
