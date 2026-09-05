# 001 — 移除首页整页双层入场(500ms 空白 + 1s ease-in-out blur)

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: HIGH
- **Category**: Easing & duration / Performance / Accessibility
- **Estimated scope**: 2 个文件(src/styles/globals.css、src/pages/index.astro),约 40 行改动

## Problem

首页 `<main data-animate-enter>`(src/pages/index.astro:27)触发 globals.css 的整页 CSS 动画,而同一屏的卡片又被 index.astro 内的 Motion One `timeline` 序列二次入场,形成双层入场:

1. `[data-animate-enter]`(globals.css:151-158)用 `animation-fill-mode: both` + `animation-delay: var(--start)`(`--start: 500ms`)——**内容在加载后前 500ms 完全不可见**,随后再用 `ease-in-out` 花 1000ms 把整页从 `blur(20px)` 淡入。入场用了"先慢后快"的 ease-in-out 曲线,总等待约 1.5s,远超 UI 动画 300ms 预算;全屏 `blur(20px)` 在 Safari 上是最重的滤镜档位。
2. 同时 index.astro:59-71 的卡片序列把 6 张 `.card-animate` 从 `y: 40%` + `opacity: 0` 弹簧(`stagger(0.3)`)再播一遍——同一屏内容被连续"藏→放"两次。
3. 两处都没有 `prefers-reduced-motion` 分支:reduced-motion 用户同样被强制等 500ms 空白、看 1s blur。

当前代码(verbatim):

```css
/* src/styles/globals.css:132-158 — current */
@keyframes enter {
  0% {
    opacity: 0;
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes blurOut {
  from {
    filter: blur(20px);
  }
  to {
    filter: blur(0px);
  }
}

[data-animate-enter] {
  --stagger: 0;
  --delay: 1000ms;
  --start: 500ms;
  animation: enter var(--delay) ease-in-out, blurOut var(--delay) ease-in-out;
  animation-fill-mode: both;
  animation-delay: var(--start);
}
```

```html
<!-- src/pages/index.astro:25-28 — current -->
<main
  class="mx-auto w-full max-w-5xl overflow-hidden p-3 sm:p-4 md:p-6"
  data-animate-enter
>
```

```js
// src/pages/index.astro:52-79 — current
<script is:inline>
  import { stagger, spring, timeline } from 'motion';
  import { loaderAnimation } from '../lib/constants';

  function initializeAnimation() {
    const cards = document.querySelectorAll('.card-animate');

    const sequence = [
      loaderAnimation,
      [
        cards,
        { y: ['40%', '0%'], opacity: [0, 1] },
        {
          at: '-0.1',
          duration: 0.4,
          delay: stagger(0.3),
          easing: spring({ velocity: 100, stiffness: 50, damping: 10 }),
        },
      ],
    ];

    timeline(sequence);
  }

  if (typeof window !== 'undefined') {
    initializeAnimation();
  }
</script>
```

## Target

首页只有**一次**入场:loader 遮罩淡出后,卡片组做一次轻快的错落入场。内容永不被整页 blur,永不先藏 500ms。入场曲线用强 ease-out(先快后慢),错落间隔降到 100ms 档位,总时长 ~800ms 内收尾。

```css
/* src/styles/globals.css — target: 整个 132-158 段(enter / blurOut / [data-animate-enter])删除 */
```

```html
<!-- src/pages/index.astro:25-27 — target: 只删 data-animate-enter 属性,main 及其余类名不动 -->
<main
  class="mx-auto w-full max-w-5xl overflow-hidden p-3 sm:p-4 md:p-6"
>
```

```js
// src/pages/index.astro — target: 用下面的脚本整体替换 52-79 的 <script> 块
<script is:inline>
  import { stagger, spring, timeline } from 'motion';

  function initializeAnimation() {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const loader = document.querySelector<HTMLElement>('.loader');
    const cards = document.querySelectorAll('.card-animate');

    if (reduceMotion) {
      // reduced-motion:遮罩直接移除,卡片本就可见,不做位移
      if (loader) loader.style.display = 'none';
      return;
    }

    const sequence = [
      ['.loader', { opacity: [1, 0], pointerEvents: 'none' }, { duration: 0.3, easing: 'ease-out' }],
      [
        cards,
        { y: ['40%', '0%'], opacity: [0, 1] },
        {
          at: '-0.05',
          duration: 0.5,
          delay: stagger(0.1),
          easing: spring({ velocity: 100, stiffness: 50, damping: 10 }),
        },
      ],
    ];

    timeline(sequence);
  }

  if (typeof window !== 'undefined') {
    initializeAnimation();
  }
</script>
```

## Repo conventions to follow

- 全站已普遍尊重 reduced-motion,且仓库内已有一个正确范例:**MastodonFeed.tsx:126-136** 用 `useReducedMotion()` 使 `initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}`、`delay: 0`。首页是纯 CSS/Motion One 脚本,没有 React hooks,所以用 `window.matchMedia('(prefers-reduced-motion: reduce)')` 一行判断即可,风格与 ThemeToggle.astro:159、Tagpage.astro:120 一致。
- 现有入场弹簧配置 `spring({ velocity: 100, stiffness: 50, damping: 10 })` 保留(它是本仓库自己的"玩趣"范例),只把 `stagger(0.3)` 收紧为 `stagger(0.1)` 并把 loader 段的时长显式写成 `duration: 0.3`。
- `loaderAnimation` 常量位于 src/lib/constants.ts:3-7,仅被本页使用;删除后把该常量一并移除,避免死代码。

## Steps

1. 在 src/styles/globals.css 删除以下整段(132-158,含 `@keyframes enter`、`@keyframes blurOut`、`[data-animate-enter]` 规则)。**不要**删除 117-130 的 `@keyframes fadeIn` 与 `.fade-in`(另有 plan 006 处理)。若删除后发现 `@keyframes fadeIn` 之前有一空行残留,一并清掉。
2. 在 src/pages/index.astro 的 `<main ...>` 上删除 `data-animate-enter` 属性(第 27 行),保留 class 与其余内容。
3. 用上面 Target 中的完整 `<script is:inline>` 块替换 index.astro 现有的 52-79 脚本块。注意:新脚本不再 `import { loaderAnimation } from '../lib/constants'`。
4. 在 src/lib/constants.ts 删除 `loaderAnimation` 导出(3-7 行):

```ts
// src/lib/constants.ts — 删除后
import type { Page } from './types'

export const LINKS = {
```

5. 全局搜一遍确认没有其它地方使用 `data-animate-enter`、`loaderAnimation`、`@keyframes enter`、`blurOut`:

```bash
grep -rn "data-animate-enter\|loaderAnimation\|blurOut\|keyframes enter" src/ || true
```

若除 globals.css 内的 `fadeIn`/`.fade-in`(属于 plan 006)外仍有命中,STOP 并报告,不要自行扩大删除。

## Boundaries

- 不要改动 loader 的 HTML(首页 14-23 行的 `.loader` 结构与文字)与首页卡片布局。
- 不要改动卡片入场的方向/曲线意图(仍为从下 40% 上升 + 弹簧),只改时长档位、错落间隔与 reduced-motion 分支。
- 不要动其它页面的 CSS/脚本;`transition:animate="fade"`(Layout.astro:24)不属于本计划。
- 不新增依赖、不改组件结构。

## Verification

- **Mechanical**: `pnpm build`(项目无独立 lint/typecheck 脚本;构建含 Astro 编译)预期成功;`grep -rn "data-animate-enter" src/` 无输出。
- **Feel check**:
  - 硬刷新首页:页面不应再出现"整页先模糊/空白约 0.5s 再淡入";loader 淡出后卡片从下方错落入场,全部内容在 ~0.8s 内稳定可见。
  - DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` 后刷新:遮罩立即消失、卡片静止出现(无位移、无弹跳),内容即刻可读。
  - DevTools Animations 面板 10% 慢放:卡片依次从下上升,错落约 100ms/张,无"先全隐藏再同时弹起"的断层。
- **Done when**: 首页从导航进入或硬刷新时只有一次入场;reduced-motion 下无任何位移动画且无空白等待;grep 无残留引用。
