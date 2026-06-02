const VISITOR_ID_KEY = 'reaction:visitor-id'

/**
 * 从 localStorage 读取访客 UUID,没有就生成一个并持久化。
 * SSR / localStorage 不可用时返回 null,调用方应能优雅降级。
 */
export function getOrCreateVisitorId(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY)
    if (existing) return existing
  } catch {
    /* private mode 等情况可能抛错,继续尝试生成 */
  }

  const generated = generateVisitorId()
  if (!generated) return null

  try {
    window.localStorage.setItem(VISITOR_ID_KEY, generated)
  } catch {
    /* 即便写不进去,也用本次会话的 ID 顶上 */
  }
  return generated
}

function generateVisitorId(): string | null {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // 极简兜底:8 字节随机十六进制
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return null
}

/**
 * 把 `{ emoji: count }` 形式的行数据聚合成 `{ emoji: count }`。
 * 提取出来方便 build-time 和 client 复用。
 */
export function aggregateCounts(
  rows: Array<{ emoji: string }>,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const row of rows) {
    result[row.emoji] = (result[row.emoji] ?? 0) + 1
  }
  return result
}

export { VISITOR_ID_KEY }
