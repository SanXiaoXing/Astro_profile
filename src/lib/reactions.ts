const VISITOR_ID_KEY = 'reaction:visitor-id'
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined

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
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const buf = new Uint8Array(16)
    crypto.getRandomValues(buf)
    return Array.from(buf, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return null
}

/**
 * 专供 Astro build-time (Node.js) 使用的只读聚合查询。
 * 直接用 fetch + anon key 调 Supabase REST API,避免 createClient
 * 在 Node 20 下因缺少原生 WebSocket 而报错。
 */
export async function fetchBuildTimeCounts(
  postSlug: string,
): Promise<Record<string, number>> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return {}

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/reactions`, SUPABASE_URL)
    url.searchParams.set('post_slug', `eq.${postSlug}`)
    url.searchParams.set('select', 'emoji')

    const res = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) return {}

    const data: Array<{ emoji: string }> = await res.json()
    return aggregateCounts(data)
  } catch {
    return {}
  }
}

/**
 * 在 React 组件(浏览器端)执行的实时查询:获取当前文章的聚合计数 + 我的当前选择。
 * 浏览器有原生 WebSocket,所以这里继续使用 @supabase/supabase-js。
 */
export async function fetchLiveCounts(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  postSlug: string,
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('post_slug', postSlug)

  if (error || !data) return {}
  return aggregateCounts(data)
}

/**
 * 获取当前访客对某篇文章已选的反应(浏览器端)。
 */
export async function fetchMySelection(
  supabase: import('@supabase/supabase-js').SupabaseClient,
  postSlug: string,
  visitorId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('post_slug', postSlug)
    .eq('visitor_id', visitorId)
    .maybeSingle()

  if (error || !data) return null
  return data.emoji
}

/**
 * 把 `{ emoji: count }` 形式的行数据聚合成 `{ emoji: count }`。
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
