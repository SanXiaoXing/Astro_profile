# 003 — 建立全站动效令牌,收紧 transition:all 与重复曲线

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: MEDIUM
- **Category**: Cohesion & tokens / Performance
- **Estimated scope**: 9 个文件(globals.css + 各组件 scoped CSS),约 60 行净改动

## Problem

仓库没有任何共享动效令牌,近似曲线与时长在各文件里手写复制,已出现至少 5 组"几乎相同但不一样"的值;另有十余处 `transition: all` 会让未打算动画的属性(如非悬停状态的 box-shadow、background)也进过渡,且部分 hover 时长 500ms 偏慢。逐处核对过的实例:

| 曲线/时长 | 出现处 |
| --- | --- |
| built-in `ease` | Categorypage.astro:271/420/444、BlogPost.astro:178(副)、Footer_blog.astro:26 等几十处 |
| built-in `ease-in-out` | globals.css:129/155/224 |
| `cubic-bezier(0.4, 0, 0.2, 1)` | BackToTop.astro:30/81、BlogPost.astro:178/199 |
| `[0.16, 1, 0.3, 1]` | MastodonFeed.tsx:135、ThemeToggle.astro:255 |
| `[0.22, 1, 0.36, 1]` | AboutInteraction.tsx(注入 CSS,约 :79) |
| gsap `power2.inOut` | ThemeToggle.astro:191 |
| `transition: all 0.25s ease` | Categorypage.astro:420(.post-link)、:454(.post-arrow)、Header.astro:109/135、BlogPost.astro:232 |
| `transition: all 300ms/400ms` | Card.astro:25(`transition-all duration-500`)、MastodonFeed.tsx:142/157、BackToTop.astro:30/68/81 |
| Tailwind `transition-all duration-500`(hover) | timeline.tsx:95/179、Card.astro:25 |
| Tailwind `transition-all duration-300`(hover) | IntroCard.astro:43/48/53/58/63 |

(完整清单以 `grep -rn "transition-all\|transition: all" src/` 为准;机械清理。)

## Target

1. 在 globals.css `:root`(第一个块,约 6-62 行的末尾 `--box-shadow` 之后)新增令牌:

```css
    /* Motion tokens (improve-animations audit) */
    --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
    --ease-out-strong: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);
    --duration-fast: 150ms;  /* press / tooltip */
    --duration-base: 200ms;  /* hover / color */
    --duration-slow: 300ms;  /* 面板/遮罩,仍 < 300ms 预算 */
```

> 语义映射(按 AUDIT.md):进场 = `var(--ease-out)`;屏内移动/形态变化 = `var(--ease-in-out)`;hover/颜色 = `var(--ease-out)` 配 150-200ms;100ms 内只用于按压回弹。`--ease-out-strong` 是仓库既有主打曲线 `[0.16,1,0.3,1]` 的命名版,供 framer/gsap 之外的 CSS 使用。

2. 下列 `.post-link`/`.post-arrow`/Header 链接/BackToTop 等**逐处替换**,`transition: all` 一律改为显式属性列表,时长取令牌:

```css
/* Categorypage.astro:420 — .post-link current → target */
/* current:  transition: all 0.25s ease; */
transition: background-color var(--duration-base) var(--ease-out),
            border-color var(--duration-base) var(--ease-out),
            box-shadow var(--duration-base) var(--ease-out),
            transform var(--duration-base) var(--ease-out);
```

```css
/* Categorypage.astro:454 — .post-arrow current → target */
transition: color var(--duration-base) var(--ease-out),
            opacity var(--duration-base) var(--ease-out),
            transform var(--duration-base) var(--ease-out);
```

```css
/* Header.astro:109(nav a)与 :135(.icon-link)— current: transition: all 0.25s ease; → target */
transition: background-color var(--duration-base) var(--ease-out),
            color var(--duration-base) var(--ease-out);
```

```css
/* BackToTop.astro:30 — .progress-wrap current: transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1); → target */
transition: opacity var(--duration-slow) var(--ease-out),
            transform var(--duration-slow) var(--ease-out),
            box-shadow var(--duration-slow) var(--ease-out),
            visibility 0s linear var(--duration-slow);
/* 进入态 .active-progress(:34-38)补一条 visibility 0s,保证隐藏时先淡出再隐藏:
   .progress-wrap.active-progress { transition: opacity var(--duration-slow) var(--ease-out), transform var(--duration-slow) var(--ease-out), box-shadow var(--duration-slow) var(--ease-out), visibility 0s; }
   hover(:39-46)与 :active(:60-63)保持原有 transform,继承该 transition。 */
```

```css
/* BlogPost.astro:178 与 :199 — date 元素 current: transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease; → target */
transition: transform 400ms var(--ease-out-strong), opacity 400ms var(--ease-out);
/* (400ms 是既有"文章页顶部日期标签"的既定较慢节奏,保留 400ms,只归一曲线) */
```

```css
/* BlogPost.astro:232 — .category-link current: transition: all 0.25s ease; → target */
transition: color var(--duration-base) var(--ease-out),
            border-color var(--duration-base) var(--ease-out),
            background-color var(--duration-base) var(--ease-out);
```

```css
/* Card.astro:25 — ShadcnCard className 去掉 transition-all duration-500 ease-out(该元素自身无 hover 过渡,子元素各有 transition) */
className={`card-animate group relative col-span-1 h-auto w-full flex-none overflow-hidden p-6 shadow-lg ${...}`
/* Card.astro:58 — 箭头 current: transition-all duration-300 ease-out → target */
className="relative float-right h-6 text-muted-foreground/40 transition-[color,transform] duration-[var(--duration-base)] ease-[var(--ease-out)] group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-primary"
```

```css
/* MastodonFeed.tsx:142 时间线圆点 与 :157 卡片 current: transition-all duration-300 → target */
/* 圆点: 只过渡 background-color + box-shadow(ring 用 box-shadow 实现) */
className="h-2 w-2 rounded-full bg-[var(--hc)]/60 ring-4 ring-[hsl(var(--primary)/0.08)] transition-[background-color,box-shadow] duration-[var(--duration-base)] group-hover:bg-[var(--hc)] group-hover:ring-[hsl(var(--primary)/0.15)]"
/* 卡片: 只过渡 background-color + border-color */
className="rounded-2xl border border-[hsl(var(--primary)/0.1)] bg-[hsl(var(--card)/0.4)] p-4 transition-[background-color,border-color] duration-[var(--duration-base)] group-hover:border-[hsl(var(--primary)/0.22)] group-hover:bg-[hsl(var(--card)/0.6)] sm:p-5"
```

```css
/* IntroCard.astro:43/48/53/58/63 五个社交按钮 — current: transition-all duration-300 → target */
/* 每个按钮的 className 中 transition-all duration-300 替换为: */
transition-[background-color,border-color] duration-[var(--duration-base)] ease-[var(--ease-out)]
```

```css
/* timeline.tsx:95 与 :179 — 时间线卡片 current: transition-all duration-500 → target(400ms→改 300ms 上限内,曲线取 hover 用的 ease-out) */
transition-[transform,border-color,box-shadow] duration-[var(--duration-slow)] ease-[var(--ease-out)]
```

3. 逐文件机械清理剩余 `transition: all` / `transition-all`(以 grep 清单为界,全量替换为"只含实际发生变化的属性"的等价写法;颜色类 hover 统一 `var(--duration-base) var(--ease-out)`,位移/缩放类统一 `var(--duration-base) var(--ease-out)`,进入态统一 `var(--duration-slow) var(--ease-out)`)。若某处 hover 同时只变颜色,属性列表可只写该颜色属性,不必凑满。

4. 纯颜色 `transition: color 0.2s ease` 之类的**单项属性过渡不算违规**,可保留,但曲线可顺手换 `var(--ease-out)`(可选,不强制)。

## Repo conventions to follow

- 令牌与既有 CSS 变量同放 globals.css 的 `:root` 块内(仓库惯例:颜色/字体变量都在那,见 6-62 行);Tailwind 主题不扩展新 keyframes,不动 tailwind.config.ts。
- Astro scoped `<style>` 内可直接使用 `var(--ease-out)`(CSS 变量来自全局 `:root`,组件内已大量使用 `var(--fontc)` 等,遵循同款用法)。
- 曲线语义以 AUDIT 为准:进入 = ease-out;屏内移动/形态 = ease-in-out;hover/颜色 = ease-out 且 ≤200ms。不要在一处 hover 上同时写多个不同缓动曲线。

## Steps

1. globals.css:在第一个 `:root { ... }` 块内、`--box-shadow: ...;` 之后、`}` 之前插入 Target 的 Motion tokens 段(注意缩进与现有 4 空格一致)。
2. 用上面的替换对逐一处理 Categorypage.astro(.post-link、.post-arrow)、Header.astro(nav a、.icon-link)、BackToTop.astro(.progress-wrap + 补 .active-progress 的 visibility 0s)、BlogPost.astro(:178/:199/:232)、Card.astro(:25 className、:58 箭头)、MastodonFeed.tsx(:142、:157)、IntroCard.astro(5 个按钮)、timeline.tsx(:95、:179)。
3. `grep -rn "transition-all\|transition: all" src/ --include=*.astro --include=*.tsx --include=*.css` 复查:把残留的 `transition-all`/`transition: all` 全部按 Target 第 3 条的规则收尾(包括 globals.css:350/.headline a 与 :458/.expressive-code 等,若 grep 命中)。
4. 全仓 grep 确认没有手写 `cubic-bezier(0.4, 0, 0.2, 1)` 或 built-in `ease-in-out` 用于入场的新增实例(既有入场如 globals.css 若已由 plan 001 删除则自然消失;`ease-in-out` 若仍存在于 .theme-transition 的 0.3s 主题过渡,那是刻意瞬时批处理,保留)。
5. 若替换过程中某行与当前代码不符(代码已漂移),STOP 并报告,不要自行改写逻辑。

## Boundaries

- 不动任何动画的**起止值/结构/意图**,只改过渡的曲线、时长与属性白名单。
- 不动 globals.css 的 .theme-transition(主题切换批量过渡)与 `html { scroll-behavior: smooth }`。
- 不动 framer-motion/gsap 的 JS 动画(它们归 plan 004/005 管);ThemeToggle.astro:191 的 `power2.inOut` 是 gsap timeline 专用,不在本计划范围。
- 不新增依赖;不改布局与 HTML 结构。

## Verification

- **Mechanical**: `pnpm build` 通过;`grep -rn "transition: all\|transition-all" src/` 输出为空(除注释外)。
- **Feel check**:
  - 悬停博客列表项、顶部导航链接、渐变卡片箭头:颜色/边框过渡应在 200ms 内完成,不拖尾;列表项 hover 左移 4px 与阴影出现同步,不闪烁。
  - 快速来回移动鼠标划过多个导航链接/列表项:每个都应即时跟手(过渡可被打断重定向),无"上次动画必须播完"的迟滞。
  - BackToTop 出现/消失:400ms 变 300ms 后仍平滑淡入淡出;hover 发光不滞后于光标。
  - 主题切换(黑白):仍流畅,颜色渐变不被新 token 破坏。
- **Done when**: `transition: all` 清零;全站 hover 类过渡集中在 150-200ms 且曲线一致;`grep` 复核通过。
