# 004 — 为工作页时间线与首页 Pulse 补齐 prefers-reduced-motion

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 3 个文件(src/components/ui/timeline.tsx、src/components/Pulse.astro、src/components/sections/Now.astro),约 25 行改动

## Problem

两处动效完全没做 reduced-motion 门控:

1. **timeline.tsx**(工作经历页 src/pages/work.astro):时间线右侧内容卡与移动端布局用 `whileInView` 做 `x: 20 → 0` 的**位移动画**(timeline.tsx:88-94 与 :163-168),页面标题/副标题用 `initial y: 20` 入场(:268-281)。reduced-motion 用户仍会被迫看到整屏平移入场。文件 imports(:2-7)没有引入 `useReducedMotion`。
2. **Pulse.astro:1-6**(首页 Now 卡片"现在"状态点,见 Now.astro:3):用 Tailwind `animate-ping` 做**无限 ping**(放大 + 淡出循环,默认 1s),没有任何 reduced-motion 处理。

当前代码(verbatim):

```tsx
// src/components/ui/timeline.tsx:88-94 — current(桌面内容卡)
<motion.div
  initial={{ opacity: 0, x: 20 }}
  whileInView={{ opacity: 1, x: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: "easeOut" }}
  className="w-full max-w-3xl"
>
```

```tsx
// src/components/ui/timeline.tsx:163-168 — current(移动端内容卡,结构相同)
```

```tsx
// src/components/ui/timeline.tsx:268-281 — current(页头)
<motion.h2
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  ...
</motion.h2>
// 以及紧随其后的 <motion.p>(:277-281,delay 0.2)
```

```astro
<!-- src/components/Pulse.astro:1-6 — current -->
<span class="relative flex h-4 w-4">
  <span
    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
  ></span>
  <span class="relative inline-flex h-4 w-4 rounded-full bg-green-500"></span>
</span>
```

## Target

reduced-motion 下:时间线内容只做透明度淡入(保留"有反馈"的淡入、去掉位移),页头不位移;Pulse 去掉 ping 扩圈但保留实心绿点(状态指示仍可读)。

```tsx
// src/components/ui/timeline.tsx — target
// 顶部 import 增加:
import {
  useScroll,
  useTransform,
  useReducedMotion,
  motion,
} from "framer-motion";

// TimelineItem 组件(:39)函数体第一行增加:
const reduceMotion = useReducedMotion();

// 桌面内容卡(:88-94)— initial 改为:
<motion.div
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 20 }}
  whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: reduceMotion ? 0.3 : 0.6, ease: "easeOut" }}
  className="w-full max-w-3xl"
>

// 移动端内容卡(:163-168)— 同上面三行改动(该组件内共两处同样的 initial/whileInView/transition)
```

```tsx
// src/components/ui/timeline.tsx 页头 — target(:268-281 的 <motion.h2> 与 :277-281 的 <motion.p>)
// h2:
<motion.h2
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
// p:
<motion.p
  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
```

> 注意:h2/p 在 `Timeline`(导出组件,:239)函数内,`reduceMotion` 需在该组件内也调用一次 `useReducedMotion()`(TimelineItem 与 Timeline 是两个组件,各自独立调用 hook;hooks 不能在条件里调用,放在函数体顶部即可)。

```astro
<!-- src/components/Pulse.astro — target: 整体替换 -->
<span class="relative flex h-4 w-4">
  <span
    class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 pulse-ring"
  ></span>
  <span class="relative inline-flex h-4 w-4 rounded-full bg-green-500"></span>
</span>

<style>
  @media (prefers-reduced-motion: reduce) {
    .pulse-ring {
      display: none;
    }
  }
</style>
```

## Repo conventions to follow

- 仓库已有完全一致的 framer 门控范例:**MastodonFeed.tsx:126** `const shouldReduceMotion = useReducedMotion();` + `initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}`。本计划同款做法(但保留透明度淡入,不放 `false`,因为 AUDIT 说 reduced motion ≠ 零动画,淡入保留)。
- CSS 侧关闭持续动画的既有范例:**Categorypage.astro:314-316** / **Tagpage.astro:311-313** 的 `@media (prefers-reduced-motion: reduce) { animation: none; }`。Pulse 走同款,但因 ping 扩圈整体无意义,直接 `display: none` 更干净(实心点仍在,语义保留)。

## Steps

1. timeline.tsx:import 加 `useReducedMotion`(与 `motion` 同组,见 imports :2-6)。
2. timeline.tsx:`TimelineItem`(:39)函数体顶部加 `const reduceMotion = useReducedMotion();`;把两处内容卡的 `initial`/`whileInView`/`transition` 三件套(桌面 :88-94、移动 :163-168)替换成 Target 写法(带 `reduceMotion ?` 分支)。
3. timeline.tsx:`Timeline`(:239)函数体顶部加 `const reduceMotion = useReducedMotion();`;把 `h2`(:268-271)与 `p`(:277-281)的 `initial` 改为 Target 写法。
4. Pulse.astro:在 ping 的 span 上加 `pulse-ring` 类并追加 `<style>` 块(Target 全文);注意 Astro scoped style 下类名会自动加 scope,`pulse-ring` 与 Tailwind `animate-ping` 不冲突。
5. 全局复查还有没有其它无限/位移动效缺门控(仅提示,不动代码):`grep -rn "whileInView\|animate-ping\|animate-pulse" src/`——命中中的 MastodonFeed 骨架屏 `animate-pulse`(MastodonFeed.tsx:184-194)是透明度呼吸,reduced-motion 下可接受,不处理;若有其它 whileInView 平移实例,STOP 报告。

## Boundaries

- 不动时间线的滚动联动(左列日期/圆点 `useTransform` 透明度、进度线 `heightTransform` 都是纯透明度/高度渐变,不在 reduced-motion 移除之列)。
- 不动时间线的 hover/布局/文案;不动 framer 动画的时长与曲线(非本计划主题)。
- 不改 Pulse 的绿点颜色/尺寸(状态语义),只去掉 ping 层。
- 不新增依赖。

## Verification

- **Mechanical**: `pnpm build` 通过;检查改动文件无未使用变量(若 TS 报 unused 错误,`reduceMotion` 两处都已被用)。
- **Feel check**:
  - 打开 /work 页滚动:内容卡照常从右 20px 滑入。
  - DevTools → Rendering → Emulate `prefers-reduced-motion: reduce` 后刷新 /work:卡片只淡入、无水平滑动;页头文字只淡入不上升。
  - 首页 Now 卡片(reduced-motion 模拟):绿点静止(无扩圈),颜色/语义不变;取消模拟后 ping 恢复。
  - 慢放(Animations 10%)确认时间线位移与原来一致,仅分支逻辑变化。
- **Done when**: reduced-motion 模拟下,/work 无任何水平/垂直位移动画、Pulse 无 ping;恢复设置后两处行为与改动前一致。
