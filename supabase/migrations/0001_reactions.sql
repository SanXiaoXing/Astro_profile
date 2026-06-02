-- =============================================================
-- Supabase migration: blog reactions
-- 在 Supabase SQL Editor 里跑一次即可
-- =============================================================

-- 1. 建表 ------------------------------------------------------------
create table if not exists public.reactions (
  id          uuid        primary key default gen_random_uuid(),
  post_slug   text        not null,
  emoji       text        not null check (char_length(emoji) between 1 and 8),
  visitor_id  text        not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. 一篇文章 × 一个访客 = 只能有一行(切 emoji 时 UPDATE 即可)
alter table public.reactions
  add constraint reactions_post_visitor_unique
  unique (post_slug, visitor_id);

-- 3. 加速按文章聚合
create index if not exists reactions_post_slug_idx
  on public.reactions (post_slug);

-- 4. 启用 RLS
alter table public.reactions enable row level security;

-- 5. 读取开放(聚合人数)
drop policy if exists "reactions_read_all" on public.reactions;
create policy "reactions_read_all"
  on public.reactions
  for select
  to anon, authenticated
  using (true);

-- 6. 写入卡口:visitor_id 必须等于请求里 X-Visitor-Id 自定义 header
--    (前端 React 组件在 createClient 时把它注入到 global.headers,
--     Supabase 自动转给 PostgREST 的 request.headers GUC)
drop policy if exists "reactions_insert_self" on public.reactions;
create policy "reactions_insert_self"
  on public.reactions
  for insert
  to anon, authenticated
  with check (
    visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
  );

drop policy if exists "reactions_update_self" on public.reactions;
create policy "reactions_update_self"
  on public.reactions
  for update
  to anon, authenticated
  using      (visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id')
  with check (visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id');

drop policy if exists "reactions_delete_self" on public.reactions;
create policy "reactions_delete_self"
  on public.reactions
  for delete
  to anon, authenticated
  using (visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id');

-- 7. updated_at 自动刷新:先建函数,再建 trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists reactions_set_updated_at on public.reactions;
create trigger reactions_set_updated_at
  before update on public.reactions
  for each row
  execute function public.set_updated_at();
