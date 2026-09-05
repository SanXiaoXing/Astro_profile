# Animation Plans

Improve-animations 审计(commit `ed96266`)产出的动效改进计划。由改进前的 8 条发现中用户选出的 7 条构成。

## 计划总览

| # | 标题 | 严重度 | 状态 |
| --- | --- | --- | --- |
| 001 | 移除首页整页双层入场(500ms 空白 + 1s ease-in-out blur) | HIGH | DONE |
| 002 | 去掉 Blog/Tags 渐变文字常驻无限循环动画 | MEDIUM | DONE |
| 003 | 建立全站动效令牌,收紧 transition:all 与重复曲线 | MEDIUM | DONE |
| 004 | 为工作页时间线与首页 Pulse 补齐 prefers-reduced-motion | MEDIUM | DONE |
| 005 | MastodonFeed 嘟文入场改为视口驱动 | LOW | DONE |
| 006 | 删除 globals.css 中无引用的入场动画死代码 | LOW | DONE |
| 007 | 为可点击卡片与按钮补上按压(active)反馈 | LOW | DONE |

## 推荐执行顺序与依赖

1. **003(令牌)→ 最先**:为后续所有计划提供 `--ease-out` / `--duration-*` 命名来源;007 明确允许二选一写法,001/002/004/005/006 不依赖它,但先落地可让 007 用令牌写法。
2. **001(首页入口)→ 次之**:删 `[data-animate-enter]` 及其 keyframes 时,注意与 006 的删除块**相邻但独立**,两计划均按"精确文本匹配"删除各自的块,先后顺序无关;README 建议 001 → 006 顺序执行,减少同文件连续编辑的心智负担。
3. **006(死代码)**:可紧跟 001(同文件,块独立),或任意时间执行。
4. **002(渐变文字)**:独立,无依赖。
5. **004(reduced-motion 补齐)**:独立;时间线部分与 003 都动了 timeline.tsx,但 004 只改 framer 的 `initial/whileInView` 分支,003 只改 hover 的 CSS 类,互不重叠,可并行/任意序;建议 003 后做 004,避免同文件两人(两轮)冲突。
6. **005(MastodonFeed 视口)**:独立,可随时。
7. **007(按压反馈)**:依赖 003 的令牌语义(可选),建议 003 之后执行以统一曲线写法。

依赖速览:`007 → 003(软)`;`006 → 001(文件相邻,建议顺序)`;其余相互独立,可并行(注意 003/004 同触 timeline.tsx、003/001 同触 globals.css,分开提交或顺序执行)。

## 验证口径

每个计划含 Mechanical(构建:`pnpm build`)与 Feel check(慢放、reduced-motion 模拟、真机/DevTools)。执行后请按各计划 Verification 的 Done when 逐条确认,再回填本表状态。

## 执行记录(2026-09-06,commit `ed96266` 上落地;含相对原计划的偏差)

7 份计划已全部执行:逐份经 worker 落地 + 主代理 diff 审阅;`pnpm build` 通过(104 页);随后 `code_review`(deep)复查出 9 项,已修复其中 6 项(其余为可选项,见下)。

- **001**:globals.css 删除 `@keyframes enter`/`blurOut`/`[data-animate-enter]`,首页改单次卡片入场 + reduced-motion 直出;`loaderAnimation` 常量随 script 重写一并移除。修复 code_review 发现:`<script is:inline>` 中不能用 TS 泛型(`querySelector<HTMLElement>` 会原样进浏览器,reduced-motion 分支失效)→ 改为 `querySelector('.loader')`。
- **002**:渐变文字停循环、hover 单次 500ms 扫过;补回 hover 规则里的 `-webkit-background-clip: text`(background 简写会重置 clip);缓动改用令牌 `var(--ease-in-out)`,使该令牌有真实消费方。
- **003**:令牌进 globals.css `:root`(`--ease-out`/`--ease-out-strong`/`--ease-in-out`/`--duration-fast|base|slow`);清理范围覆盖 components/layouts/styles **及 src/pages** 全部 `.astro`/`.tsx`,全仓 `transition: all`/`transition-all` 归零(grep 复核为空)。期间修复 reaction-chip 按钮 transition 名单漏 `transform`(bump 缩放会瞬跳)。
- **004**:timeline.tsx 与 Pulse.astro 补齐 reduced-motion。偏差:工作页 h2/p 的 reduced 分支由「纯淡入(0.8s)」进一步改为 `initial={reduceMotion ? false : …}`——reduce 用户直接可见,与 MastodonFeed 的 `initial={false}` 惯例一致(原计划倾向保留淡入,code_review 建议与全站一致后采纳)。可选建议(未做):滚动联动的 `useScroll/useTransform` 在 reduce 下仍逐帧写样式,属既有行为、非本次回归,未动。
- **005**:`animate` → `whileInView` + `viewport.once`。偏差:原计划 `margin: "0px 0px -120px 0px"` 经 code_review 指出可能让末尾矮卡片永不触发(永远停在 opacity:0)→ 改 `viewport={{ once: true }}`,仍是视口驱动。
- **006**:删除 `.fade-in` 与 `@keyframes fadeIn`,grep 确认无引用。
- **007**:Card/`.post-link`/MastodonFeed 两按钮/ThemeToggle 补 `:active` 按压反馈;ThemeToggle 基类 transition 补 `transform`(否则松手瞬间回弹)。注意 `.card-animate:active` 依赖基类 `transition: transform var(--duration-fast) var(--ease-out)` 已就位,按压与回弹都平滑。
- **执行注意(教训)**:批次并行执行中 timeline.tsx 曾被整体回退(plan 003/004 的改动一度丢失,`pnpm build` 报 `reduceMotion is not defined`),已在任务 #9 重建该文件至应有终态并经构建验证。若再次出现多 worker 同文件/同批次,务必串行或逐份复核 git diff。

## 遗留(Feel-check 需人工在浏览器确认)

各计划 Verification 中的 feel-check(慢放、DevTools Rendering 模拟 `prefers-reduced-motion: reduce`、悬停按压手感)需在本地 `pnpm start` 后人工过一遍;本仓库无自动化视觉测试。
