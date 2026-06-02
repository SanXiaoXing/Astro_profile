import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as
  | string
  | undefined

const VISITOR_HEADER = 'x-visitor-id'

let cachedClient: SupabaseClient | null = null
let cachedVisitorId: string | null = null

/**
 * 返回一个可复用的 Supabase 客户端。
 *
 * - 第一次调用时(以及当 visitorId 变化时)会重建实例,
 *   以便把 `x-visitor-id` 自定义 header 注入到 PostgREST,
 *   让 RLS 策略能通过 `current_setting('request.headers', true)::json->>'x-visitor-id'` 读到。
 * - 如果环境变量没配,返回 null(调用方需自己处理 fallback)。
 */
export function getSupabase(visitorId?: string): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return null
  }

  const id = visitorId ?? cachedVisitorId

  if (cachedClient && id === cachedVisitorId) {
    return cachedClient
  }

  cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: id ? { [VISITOR_HEADER]: id } : {},
    },
  })
  cachedVisitorId = id ?? null

  return cachedClient
}

/**
 * 用于 build-time 的便捷函数 —— 不需要 RLS header,
 * 只做只读聚合查询。
 */
export function getSupabaseAnon(): SupabaseClient | null {
  return getSupabase()
}

export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}

export { VISITOR_HEADER }
