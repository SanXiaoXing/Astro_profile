# 005 — MastodonFeed 嘟文入场改为视口驱动

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: LOW
- **Category**: Performance / Purpose & frequency
- **Estimated scope**: 1 个文件(src/components/MastodonFeed.tsx),约 10 行改动

## Problem

嘟文列表共 20 条(API limit=20),数据加载完成后**所有卡同时 mount 即播**入场动画(MastodonFeed.tsx:129-136 的 `motion.article` 用 `animate` 而非 `whileInView`),并按 `index * 0.07` 错落——最后一张卡要等约 1.3s 才开始自己的 0.5s 动画。结果:用户快速往下滚动时,底部内容早已"在看不见的地方"播完了动画;每一条都白耗一次位移动画。滚动联动型列表应在条目**进入视口**时才入场。

当前代码(verbatim):

```tsx
// src/components/MastodonFeed.tsx:125-137 — current
function StatusCard({ status, index }: { status: Status; index: number }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: shouldReduceMotion ? 0 : index * 0.07,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
```

## Target

卡片首次滚入视口(距底部 120px 内)时才播放入场;同批进入的卡用一个很短的错落(≤4 张 × 40ms)保留层次,不再等 1.3s。reduced-motion 分支保持原样(直接可见、无动画)。

```tsx
// src/components/MastodonFeed.tsx:129-136 — target
    <motion.article
      initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -120px 0px" }}
      transition={{
        duration: 0.5,
        delay: shouldReduceMotion ? 0 : (index % 4) * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group relative"
    >
```

> 说明:`animate` → `whileInView`;`index * 0.07`(最长 ~1.33s)→ `(index % 4) * 0.04`(最长 120ms)。`viewport.margin` 的负下边距让动画在卡片进入视口下缘 120px 时即触发,而不是等到屏幕正中央。

## Repo conventions to follow

- 仓库已有 framer 的视口入场范例:**timeline.tsx:88-94** `whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-100px" }}`。本计划同款 `whileInView` + `viewport.once`。
- reduced-motion 门控继续沿用 MastodonFeed 自身已有的 `shouldReduceMotion` 变量(:126),reduced 时 `initial=false` 且不设 whileInView(内容直接可见)。

## Steps

1. 把 MastodonFeed.tsx:129-136 的 `motion.article` 三件套(`initial`/`animate`/`transition`)替换为 Target 写法。注意 `viewport` 与 `transition` 的 props 顺序无要求,但缩进对齐现有 6 空格。
2. `index` 参数仍被使用(`(index % 4) * 0.04`),函数签名(:125)不变,调用处(:272-274 `statuses.map((s, i) => <StatusCard ... index={i} />)`)不变。
3. 若有 TypeScript 报错提示 `viewport.margin` 类型(应接受 string),确认该字段写法与 timeline.tsx:91 一致即可;如报 unused,检查是否仍有 `shouldReduceMotion ? 0 :` 引用。

## Boundaries

- 只改这一张卡的入场触发方式与错落算法;不动卡片内容、hover、敏感内容 reveal、骨架屏、加载逻辑。
- 不动 reduced-motion 既有语义(它已正确)。
- 不新增依赖;不改布局。

## Verification

- **Mechanical**: `pnpm build` 通过。
- **Feel check**:
  - 打开 /mastodon 页,等数据加载:首屏内的卡依次淡入(错落 ≤120ms);**不滚动时底部卡保持隐藏**(DevTools 检查未入视口的 article 的 opacity 为 0,或快速滚到底时看到卡"正在播放入场"而非早已静止)。
  - 快速滚到页面底部:底部卡片应就地入场(淡入 + 上移 18px),而不是已经静止。
  - DevTools → Rendering 模拟 `prefers-reduced-motion: reduce`:列表直接完整显示,无动画、无错落。
- **Done when**: 滚动到底部时能看到底部卡片在视口边缘处入场;首屏错落总时长 ≤ ~200ms;reduced-motion 行为与改动前一致。
