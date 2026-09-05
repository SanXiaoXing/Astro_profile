# 007 — 为可点击卡片与按钮补上按压(active)反馈

- **Status**: DONE
- **Commit**: ed96266
- **Severity**: LOW
- **Category**: Physicality(按压反馈)
- **Estimated scope**: 5 个文件(Card.astro、Categorypage.astro、Tagpage.astro、MastodonFeed.tsx、ThemeToggle.astro),约 20 行改动

## Problem

站内多处"整块可点"的 UI 只有 hover、没有 `:active` 按压反馈——按下到松开之间没有任何视觉确认,手感"粘";这与站内已有的正确范例不一致(BackToTop.astro:60-63 `.progress-wrap:active { transform: translateY(-1px) scale(0.98); transition-duration: 100ms; }`)。逐处确认过:

- **Card.astro:45-72**:href 卡片整卡是 `<a>`,hover 有渐变蒙层/箭头位移,但按压无缩放。
- **Categorypage.astro:411-429 / Tagpage.astro(同构)**:`.post-link` hover 有 `translateX(4px)` + 阴影,按压无变化。
- **MastodonFeed.tsx:68-77(敏感内容按钮)与 :247-252(重试按钮)**:按钮无按压反馈。
- **ThemeToggle.astro:231-251**:`.theme-toggle` 有 hover,无 `:active`。

## Target

按压统一为 `scale(0.97)`、时长 150ms(按压反馈预算 100-160ms)、曲线用强 ease-out `cubic-bezier(0.23, 1, 0.32, 1)`。移开鼠标/松手时经既有过渡平滑回弹。

```css
/* src/components/Card.astro — 在 <style> 内追加(整卡按下的缩放作用于卡片根节点;href 卡的内容 <a> 占满整卡,点击即触发) */
.card-animate:active {
  transform: scale(0.97);
  transition: transform 150ms cubic-bezier(0.23, 1, 0.32, 1);
}
/* 注意:若 plan 003 已执行(Card.astro:25 的 transition-all duration-500 被移除),此处的显式 transition 正好补齐按压过渡;若 003 未执行,该规则也生效(:active 内联 transition 优先级高于类上的 transition-all?否——同属性冲突时 :active 规则特异性更高且写在后面,可覆盖,无需担心)。 */
```

```css
/* src/components/blog/Categorypage.astro — .post-link:hover(:424-429)之后追加 */
.post-link:active {
  transform: translateX(4px) scale(0.97);
}
/* 若 plan 003 未执行,.post-link 的 transition: all 0.25s ease 会让按压以 250ms 生效,偏慢但可用;003 执行后自动变 200ms。Tagpage.astro 若存在同名 .post-link 规则,追加同款。 */
```

```tsx
// src/components/MastodonFeed.tsx — 敏感内容按钮(:70-72 className)与重试按钮(:249 className)各追加按压类
// 敏感内容按钮 className 现为:
// "mt-4 text-left text-xs text-[var(--gray)] transition-colors hover:text-[var(--fontc)]"
// 改为(追加 active:scale 与 transform 过渡):
// "mt-4 text-left text-xs text-[var(--gray)] transition-[transform,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[var(--fontc)] active:scale-[0.97]"

// 重试按钮 className 现为:
// "rounded-lg border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 font-mono text-xs text-[var(--hc)] transition-all hover:bg-[hsl(var(--primary)/0.14)]"
// 改为(顺带把 transition-all 收窄为 transition-[transform,background-color]):
// "rounded-lg border border-[hsl(var(--primary)/0.35)] bg-[hsl(var(--primary)/0.08)] px-4 py-2 font-mono text-xs text-[var(--hc)] transition-[transform,background-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[hsl(var(--primary)/0.14)] active:scale-[0.97]"
```

```css
/* src/components/ThemeToggle.astro — 在 .theme-toggle:hover 规则(:247-251)之后追加 */
.theme-toggle:active {
  transform: scale(0.96);
  transition-duration: 100ms;
}
```

## Repo conventions to follow

- 站内已确立的按压范式是 **BackToTop.astro:60-63**:`:active` 里 `scale(0.98)` + `transition-duration: 100ms`。本计划数值取 AUDIT 的 0.95-0.98 区间与 100-160ms 预算,曲线取 AUDIT 推荐 `cubic-bezier(0.23, 1, 0.32, 1)`。
- 若 plan 003 已把仓库接上 `--ease-out`/`--duration-fast` 令牌,上述 `150ms cubic-bezier(0.23, 1, 0.32, 1)` 可统一写作 `var(--duration-fast) var(--ease-out)`(二选一即可,保持一致,不混用)。

## Steps

1. Card.astro `<style>` 内追加 `.card-animate:active` 规则(Target 第一段)。若 plan 003 已移除根节点上的 `transition-all duration-500`,则无需其它改动;否则保留原类(不冲突)。
2. Categorypage.astro `.post-link:hover` 之后追加 `.post-link:active`;检查 Tagpage.astro 是否有同样的 `.post-link:hover`(grep `post-link:hover` 确认),有则同款追加。
3. MastodonFeed.tsx:替换敏感内容按钮与重试按钮的 className(Target 第三段两处全文)。
4. ThemeToggle.astro:在 `.theme-toggle:hover` 规则后追加 `.theme-toggle:active`。
5. grep 复查:确认没有遗漏的"整卡链接无 active"(仅提示,不扩范围):`grep -rn "group-hover" src/components/Card.astro` 与 `grep -rn "className=.*cursor-pointer" src/` 仅供参考,不在本计划范围的新发现请 STOP 报告。

## Boundaries

- 只加 `:active` 反馈与必要的最小过渡声明;不动 hover 效果、不改布局/结构/文案。
- 不改动已是正确范例的 BackToTop、reaction-chip、MastodonFeed 其余 hover。
- 缩放幅度限 0.96-0.97,不得低于 0.95;不得让整页其它元素随之位移(都是 transform 缩放,不触发布局)。
- 不新增依赖。

## Verification

- **Mechanical**: `pnpm build` 通过。
- **Feel check**:
  - 按住首页 Blog/Tags 渐变卡、博客分类/标签列表项、主题切换按钮、嘟文"敏感内容"按钮:按下瞬间有轻微缩小(约 0.97),松手平滑回弹,无跳动。
  - 快速连点(按下-松开-再按):每次按压都即时反馈,不被上一次过渡阻塞。
  - reduced-motion 模拟下:按压缩放可保留(它是按压确认,非大位移;若希望完全关闭,把各 `:active` 的 transform 移入 `@media (prefers-reduced-motion: reduce)` 之外即可——按 AUDIT,保留按压反馈更优,故不设 reduce 分支)。
- **Done when**: 上述五处控件按下均有 ≥0.96 的即时缩放并平滑回弹;构建通过;视觉上无布局位移。
