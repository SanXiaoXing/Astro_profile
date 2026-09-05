# 006 — 删除 globals.css 中无引用的入场动画死代码

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: LOW
- **Category**: Cohesion & tokens(清理)
- **Estimated scope**: 1 个文件(src/styles/globals.css),删除约 14 行

## Problem

globals.css 中 `@keyframes fadeIn`(:117-126)与 `.fade-in`(:128-130)在整个代码库没有任何引用——`grep "fade-in" src/` 只命中 globals.css 自身的定义。这是一段 1s `ease-in-out` + `translateY(20px)` 的入场动画残骸:留着既误导后续维护者(以为全站有统一 fade-in 工具类),也让未来审计反复命中。`@keyframes fadeIn` 只被 `.fade-in` 使用,可一并删除。

当前代码(verbatim):

```css
/* src/styles/globals.css:117-130 — current */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 1s ease-in-out;
}
```

## Target

两段全部删除,不留空行残留(若 :116 与 :131 之间出现多余空行,保留一个空行即可,保持与相邻块一致的排版)。

> 注意:此段与 plan 001 删除的 `@keyframes enter` / `blurOut` / `[data-animate-enter]`(:132-158)是两个**相邻但独立**的块。若先执行了 plan 001,本计划的锚点文本不变(按文字精确匹配,不依赖行号);若两计划在同一次会话执行,顺序无关,只需各自按文本删除自己的块。

## Repo conventions to follow

- 本仓库对 CSS 动效的命名与组织就是 globals.css 内平铺 keyframes + 工具类;删除时保持其余块(如 :117 之前的主题/基础层与 :132 起的内容)原样不动。

## Steps

1. 用精确文本匹配删除 globals.css 的 `@keyframes fadeIn { ... }` 块与 `.fade-in { ... }` 块(上面 Target 所引全文,含前导缩进与空行处理)。
2. 全局确认无引用:

```bash
grep -rn "fade-in\|fadeIn" src/ --include=*.astro --include=*.tsx --include=*.ts --include=*.css --include=*.mjs
```

预期输出只剩 globals.css 中无命中(全部消失);若其它文件有引用,STOP 并报告(说明该文件在用 .fade-in,不应删除)。

## Boundaries

- 不要删除 :132-158 的 `enter`/`blurOut`/`[data-animate-enter]`(归 plan 001);若执行时发现该段已被删,正常继续本计划即可。
- 不要动 `.headline`、`.expressive-code`、scrollbar 等其它样式。
- 不新增依赖。

## Verification

- **Mechanical**: `pnpm build` 通过;上述 grep 输出为空。
- **Feel check**: 全站各页面(首页、/blog、文章页、/work、/about、/mastodon)刷新:无任何元素因为缺了 `.fade-in`/`fadeIn` 而改变外观或缺失动画(本就无人使用,视觉零变化)。
- **Done when**: globals.css 不含 `fadeIn`/`fade-in`,grep 复核为空,构建通过。
