# Astro ViewTransitions 导致的 JS 初始化失效问题

## 问题描述

在博客中使用了 Astro 的 `ViewTransitions`（视图过渡）功能后，发现部分依赖 JavaScript 初始化的交互组件在首次加载时正常工作，但在点击站内链接进行页面切换后失效。必须手动刷新浏览器才能恢复正常。

具体受影响的组件包括：
1. **返回顶部按钮（Progress Wrap）**：页面跳转后按钮不显示，滚动页面也没有出现环形进度条效果。
2. **Twikoo 评论区开关**：页面跳转后，"展开评论" 按钮点击无响应，且评论数量角标无法加载。

## 原因分析

Astro 的 `<ViewTransitions />` 机制会拦截同域内的链接点击事件。它不会像传统多页应用（MPA）那样重新请求并加载整个 HTML 页面，而是仅通过 fetch 获取新页面的内容，并利用浏览器的 View Transitions API 平滑替换当前文档的 DOM（特别是 `<main>` 等动态区域）。

这种机制导致了以下结果：
1. 页面跳转时，**浏览器不会再次触发 `DOMContentLoaded` 或 `window.onload` 事件**。
2. 许多写在 `<script>` 标签里的初始化函数（由于绑定在 `DOMContentLoaded` 上）在页面切换后**不会被执行**。
3. 页面原有的 DOM 元素被替换销毁，旧的事件监听器丢失，但新生成的 DOM 元素却没有被重新绑定事件。

## 解决方案

为了解决这个问题，Astro 提供了一系列专门针对视图过渡的生命周期事件。我们需要将原先绑定在 `DOMContentLoaded` 的初始化逻辑，改绑到 `astro:page-load` 事件上。

`astro:page-load` 事件的特点是：**它不仅在页面初始加载完成时触发一次，在每一次视图过渡导航完成、新 DOM 注入后也会触发。**

### 1. 返回顶部按钮修复

**修改文件**: `src/layouts/Layout.astro`

**修改前**：
```javascript
// 直接在 script 顶层获取元素和绑定事件
const progressWrap = document.querySelector('.progress-wrap');
// ... 
window.addEventListener('scroll', () => { /*...*/ });
```

**修改后**：
将逻辑封装，并绑定到 `astro:page-load`，同时注意清理旧的事件监听以防内存泄漏。
```javascript
function initBackToTop() {
  const progressWrap = document.querySelector('.progress-wrap');
  // ... (进度条初始化逻辑)
  
  // 移除旧的事件监听器，防止多次跳转后重复绑定
  const newScrollHandler = () => { /*...*/ };
  window.removeEventListener('scroll', window._scrollHandler || (() => {}));
  window._scrollHandler = newScrollHandler;
  window.addEventListener('scroll', newScrollHandler);
}

// 页面首次加载时初始化
document.addEventListener('DOMContentLoaded', initBackToTop);

// Astro ViewTransitions 导航后重新初始化
document.addEventListener('astro:page-load', initBackToTop);
```

### 2. 评论组件修复

**修改文件**: `src/components/Comments.astro`

**修改前**：
使用了不可靠的 `astro:after-swap` 事件。
```javascript
document.addEventListener('astro:after-swap', () => {
  initCommentSection();
});
```

**修改后**：
统一使用 `astro:page-load` 事件。
```javascript
document.addEventListener('astro:page-load', () => {
  initCommentSection();
  // 稍微延迟获取评论数量，确保 Twikoo 脚本已就绪
  setTimeout(() => {
    if (typeof window.getCommentCount === 'function') {
      window.getCommentCount();
    }
  }, 300);
});
```

## 总结与最佳实践

在使用 Astro 框架并开启 ViewTransitions 时，对于所有包含客户端交互（如绑定 click、scroll 事件、操作 DOM 等）的脚本，应遵循以下模式：

```html
<script>
  function setup() {
    // 1. 获取 DOM
    const btn = document.getElementById('my-btn');
    if (!btn) return;
    
    // 2. 绑定事件 (如果是绑定在 window/document 上的全局事件，需要先 remove 旧的)
    btn.addEventListener('click', () => {
      console.log('clicked');
    });
  }

  // 初次加载
  document.addEventListener('DOMContentLoaded', setup);
  // 后续路由跳转加载
  document.addEventListener('astro:page-load', setup);
</script>
```