/**
 * ponytail: 使用 pretext 的 walkLineRanges() 优化聊天气泡宽度
 * 避免 CSS fit-content 的空间浪费，找到最小宽度保持相同行数
 */

import { prepare, layout } from '@chenglou/pretext';

/**
 * 找到气泡的最优宽度（最小宽度，但保持相同行数）
 */
function findOptimalWidth(text: string, containerWidth: number, lineHeight: number, font: string): number {
  // ponytail: 先用容器最大宽度计算原始行数
  const prepared = prepare(text, font);
  const originalLayout = layout(prepared, containerWidth, lineHeight);
  const targetLineCount = originalLayout.lineCount;

  // ponytail: 用二分搜索找最小宽度
  let minWidth = 50; // ponytail: 最小50px，避免太窄
  let maxWidth = containerWidth;
  let optimalWidth = maxWidth;

  while (minWidth <= maxWidth) {
    const midWidth = Math.floor((minWidth + maxWidth) / 2);
    const midLayout = layout(prepared, midWidth, lineHeight);

    if (midLayout.lineCount === targetLineCount) {
      optimalWidth = midWidth;
      maxWidth = midWidth - 1; // ponytail: 继续往左找更小的
    } else {
      minWidth = midWidth + 1; // ponytail: 行数变了，需要更大的宽度
    }
  }

  return optimalWidth;
}

/**
 * 提取气泡内的纯文本（去除 HTML 标签）
 */
function extractText(element: Element): string {
  // ponytail: 简单提取文本，忽略代码块等复杂结构
  return element.textContent || '';
}

/**
 * 获取计算后的字体样式
 */
function getFont(element: Element): string {
  const style = window.getComputedStyle(element);
  const fontSize = style.fontSize;
  const fontFamily = style.fontFamily;
  return `${fontSize} ${fontFamily}`;
}

/**
 * 优化所有聊天气泡
 */
export function optimizeChatBubbles() {
  // ponytail: 只优化 user 的气泡（assistant 没气泡背景）
  const userBubbles = document.querySelectorAll('.chat-user .chat-bubble');

  userBubbles.forEach((bubble) => {
    const text = extractText(bubble);
    if (!text.trim()) return; // ponytail: 空气泡不处理

    const font = getFont(bubble);
    const style = window.getComputedStyle(bubble);
    const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.65;

    // ponytail: 计算容器最大宽度（80%）
    const parent = bubble.closest('.chat-msg');
    if (!parent) return;
    const parentWidth = parent.getBoundingClientRect().width;
    const maxBubbleWidth = parentWidth * 0.8;

    try {
      const optimalWidth = findOptimalWidth(text, maxBubbleWidth, lineHeight, font);

      // ponytail: 设置优化后的宽度（加上 padding）
      const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const finalWidth = optimalWidth + padding;

      // ponytail: 只在优化效果明显时才应用（节省 > 20px）
      const currentWidth = bubble.getBoundingClientRect().width;
      if (currentWidth - finalWidth > 20) {
        bubble.style.width = `${finalWidth}px`;
        bubble.style.maxWidth = `${finalWidth}px`;
      }
    } catch (e) {
      // ponytail: pretext 失败时保持原样，不破坏布局
      console.warn('Chat bubble optimization failed:', e);
    }
  });
}

// ponytail: 导出自动初始化函数
export function initChatOptimization() {
  // ponytail: 等待字体加载完成
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      optimizeChatBubbles();
    });
  } else {
    // ponytail: 降级方案：延迟执行
    setTimeout(optimizeChatBubbles, 100);
  }

  // ponytail: 窗口 resize 时重新优化
  let resizeTimer: number;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(optimizeChatBubbles, 200);
  });
}