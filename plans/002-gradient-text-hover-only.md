# 002 — 去掉 Blog/Tags 渐变文字常驻无限循环动画

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: MEDIUM
- **Category**: Performance / Cohesion
- **Estimated scope**: 1 个文件(src/components/Card.astro),约 25 行改动

## Problem

首页两张常驻渐变卡(Blog、Tags,见 src/pages/index.astro:34-39 `<Card ... variant="gradient">`)里的 `.moving-gradient-text` 有一个**永不停止**的 `gradient-shift 6s ease infinite` 动画(Card.astro:84),hover 时还加速成 4s 循环(Card.astro:92)。它是 `background-clip: text` 上的 `background-position` 位移——浏览器每帧重绘整块字形文本(纯 CPU 绘制,无法走合成器),两块卡就在首页顶部无休止地空转,即使没人看也照跑;hover 反而更耗。

当前代码(verbatim):

```css
/* src/components/Card.astro:75-99 — current */
<style>
  .moving-gradient-text {
    font-family: 'EmblemaOne', 'FutureMono', monospace;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--hc), var(--purple), var(--hc));
    background-size: 200% 200%;
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    animation: gradient-shift 6s ease infinite;
  }

  .moving-gradient-text:hover {
    background: linear-gradient(135deg, hsl(var(--accent)), var(--hc), hsl(var(--accent)));
    background-size: 200% 200%;
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    animation: gradient-shift 4s ease infinite;
  }

  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
</style>
```

## Target

静态时不再空转:文字停在渐变的初始相位(等价于现在循环的 0% 帧),视觉与现在几乎一致。把"动"留给用户交互——hover 时做**一次**从 0% → 100% 的 `background-position` 扫过(0.5s 强 ease-in-out,复用 AUDIT 的 `cubic-bezier(0.77, 0, 0.175, 1)`),移出时平滑回到 0%。reduced-motion 用户完全静置。

```css
/* src/components/Card.astro — target: 整体替换 <style> 块 */
<style>
  .moving-gradient-text {
    font-family: 'EmblemaOne', 'FutureMono', monospace;
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, var(--hc), var(--purple), var(--hc));
    background-size: 200% 200%;
    background-position: 0% 50%;
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    transition: background-position 500ms cubic-bezier(0.77, 0, 0.175, 1);
  }

  .moving-gradient-text:hover {
    background: linear-gradient(135deg, hsl(var(--accent)), var(--hc), hsl(var(--accent)));
    background-size: 200% 200%;
    background-position: 100% 50%;
  }

  @media (prefers-reduced-motion: reduce) {
    .moving-gradient-text {
      transition: none;
    }
  }
</style>
```

说明:原 hover 会同时换色板(background 本身不可过渡,原实现里也是瞬时切换)并加速循环;新实现保留瞬时换色板 + 一次扫过,不再无限循环。`background-clip` 在旧版 Safari 需 `-webkit-background-clip`,已保留。

## Repo conventions to follow

- 本仓库处理持续装饰动画的既有范例是给 CSS 动画加 reduced-motion 关闭:**Tagpage.astro:311-313**、**Categorypage.astro:314-316**(`@media (prefers-reduced-motion: reduce) { .x { animation: none; } }`)。本计划走同一条路,但因不再有无限动画,只需关掉 transition。
- 仓库尚未建立动效令牌(见 plan 003),这里按 AUDIT 直接写字面曲线值,不引入变量。

## Steps

1. 用上面 Target 的 `<style>` 块整体替换 Card.astro 第 75-99 行(从 `<style>` 到 `</style>`,含 keyframes)。
2. 删除 `@keyframes gradient-shift`(不再被引用)。
3. 全局确认 `gradient-shift` 无其它引用:

```bash
grep -rn "gradient-shift\|moving-gradient-text" src/
```

`moving-gradient-text` 应只在 Card.astro 出现一次(class 定义 + 一处 `variant="gradient"` 用法在 Card.astro:51)。若发现别的文件也定义了同名 keyframes,STOP 并报告。

## Boundaries

- 不要改动渐变卡的结构、文案或 Card.astro 其余样式(hover 渐变蒙层、箭头等)。
- 不要改动 `variant="gradient"` 的选择逻辑。
- 不要引入新依赖;不要新增全局 CSS(改动只在 Card.astro 的 scoped `<style>` 内)。

## Verification

- **Mechanical**: `pnpm build` 通过;`grep -rn "gradient-shift" src/` 无输出。
- **Feel check**:
  - 首页看 Blog/Tags 两卡:文字渐变保持静止(不再流动),观感与原动画 0% 相位一致,不闪不跳。
  - 鼠标悬停文字:色板瞬时切换 + 渐变从一端扫到另一端约 0.5s;移出后扫回,无卡顿、无重影。
  - DevTools → Performance 录制 5s 静止首页:不再有每帧的 `background-position`/paint 记录(原来会持续出现)。
  - Rendering 面板模拟 `prefers-reduced-motion: reduce`:hover 时无扫动,仅色板切换。
- **Done when**: 渐变文字静止时有零持续重绘;hover 只做一次 500ms 扫过;reduced-motion 下无 background-position 过渡。
