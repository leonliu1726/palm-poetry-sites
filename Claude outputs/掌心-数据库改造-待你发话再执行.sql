-- 掌心官网改造 · 数据库部分
-- 2026-09-22 拟
-- 状态：【未执行】等 Leon 发话
--
-- 原则：只新增，不修改、不删除任何现有数据。
-- 现有 members(74) / works(51) / work_revisions(69) 一行不动、一列不改。
-- 执行前必须先做整库导出（见本文件末尾"执行顺序"）。

-- =====================================================================
-- 第一步：管理员表 —— 取代写死在权限策略里的单个邮箱
-- =====================================================================
-- 现状问题：谁能上传，是直接把邮箱写死在 works_insert 策略里的。
--   kind='collection'（历年诗文汇）→ 只有海边一个邮箱能插
--   kind='video'（掌心影音）      → 只有挑灯看剑一个邮箱能插
-- 要加飞鸿，就得改写策略本身。以后每加一个人都要改一次，不可持续。
-- 改成一张表管理，加人只是加一行。

create table if not exists public.admins (
  email      text primary key,
  name       text,
  scope      text[] not null default '{}',   -- work / collection / video / gathering / post
  added_at   timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy admins_read on public.admins
  for select using (true);

-- 只能由后台（service_role）增删，前台改不了
-- 无 insert/update/delete 策略 = 前台一律拒绝

create or replace function public.is_admin(want text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(auth.jwt() ->> 'email')
      and (want = any(scope) or 'all' = any(scope))
  );
$$;

-- 落人：邮箱不用手填、也不用贴到任何地方 —— 直接从 members 表里按名字取。
-- 已核实：晓鸣、海边、挑灯看剑、飞鸿四人在 members 表中均已绑定邮箱。
insert into public.admins(email, name, scope)
select m.owner_email, m.name,
       case m.name
         when '晓鸣'     then array['work']                   -- 作品区
         when '海边'     then array['collection','gathering'] -- 历年诗文汇 · 雅集
         when '挑灯看剑' then array['video']                  -- 掌心影音
         when '飞鸿'     then array['work','post']            -- 作品区（晓鸣之后）· 诗海流风
       end
from public.members m
where m.name in ('晓鸣','海边','挑灯看剑','飞鸿')
  and m.owner_email is not null
on conflict (email) do update set scope = excluded.scope, name = excluded.name;


-- =====================================================================
-- 第二步：作品卡补正文 —— 散文与赋终于能进页面、进搜索
-- =====================================================================
-- 只加两列，现有 51 条记录不受影响（新列为空）。

alter table public.works add column if not exists body    text;
alter table public.works add column if not exists body_en text;


-- =====================================================================
-- 第三步：雅集单独建表 —— 一次雅集一条记录
-- =====================================================================
-- 现状问题：历年诗文汇挤在 works 表里，字段只有
--   title / url（单个文件）/ note（一句话）/ cover_url
-- 一次雅集几十张照片、多位作者的诗文，这四个字段装不下。
-- 这是海边传不动的真正原因，不是他不会用。

create table if not exists public.gatherings (
  id           uuid primary key default gen_random_uuid(),
  held_on      date not null,                 -- 雅集日期
  title        text not null,                 -- 名称
  place        text,                          -- 地点
  cover_url    text,                          -- 封面
  summary      text,                          -- 摘要
  summary_en   text,
  body         text,                          -- 正文：全部诗文整段贴入
  body_en      text,
  participants text[] not null default '{}',  -- 参与者
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- 照片与附件：一次雅集挂任意多条
create table if not exists public.gathering_assets (
  id            uuid primary key default gen_random_uuid(),
  gathering_id  uuid not null references public.gatherings(id) on delete cascade,
  kind          text not null check (kind in ('photo','file','video')),
  url           text not null,
  caption       text,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists gathering_assets_gid on public.gathering_assets(gathering_id, sort_order);

alter table public.gatherings       enable row level security;
alter table public.gathering_assets enable row level security;

create policy gatherings_read   on public.gatherings       for select using (true);
create policy gassets_read      on public.gathering_assets for select using (true);

create policy gatherings_write  on public.gatherings
  for all using (public.is_admin('gathering')) with check (public.is_admin('gathering'));
create policy gassets_write     on public.gathering_assets
  for all using (public.is_admin('gathering')) with check (public.is_admin('gathering'));

-- 旧的 2 条 collection 记录：原样留在 works 表，页面照常显示。
-- 等海边在新表里把对应雅集重建好，再由他自己决定撤不撤旧卡。不自动迁移、不自动删除。


-- =====================================================================
-- 第四步：诗海流风 —— 发帖即写，登录即发
-- =====================================================================
-- 不要分类、不要信任等级、不要禁言机制。

create table if not exists public.posts (
  id            uuid primary key default gen_random_uuid(),
  author_email  text not null,
  author_name   text not null,
  title         text,
  body          text not null,
  created_at    timestamptz not null default now(),
  edited_at     timestamptz,
  -- 从 Discourse 迁过来的 17 帖用下面两列保留原始出处与日期
  legacy_source text,
  legacy_date   timestamptz
);

create index if not exists posts_created on public.posts(coalesce(legacy_date, created_at) desc);

alter table public.posts enable row level security;

create policy posts_read on public.posts
  for select using (true);

-- 登录的成员即可发帖
create policy posts_insert on public.posts
  for insert with check (
    lower(author_email) = lower(auth.jwt() ->> 'email')
    and public.is_bound_member()
  );

-- 只能改自己的
create policy posts_update_own on public.posts
  for update using (lower(author_email) = lower(auth.jwt() ->> 'email'))
       with check (lower(author_email) = lower(auth.jwt() ->> 'email'));

-- 自己能删自己的；管理员也能删（唯一保留的管理动作）
create policy posts_delete on public.posts
  for delete using (
    lower(author_email) = lower(auth.jwt() ->> 'email')
    or public.is_admin('post')
  );


-- =====================================================================
-- 第五步：改权限策略，从写死邮箱换成管理员表
-- =====================================================================
-- 这一步会替换现有的 works_insert 策略。
-- 替换前后行为对照：
--   替换前：collection 只有海边、video 只有挑灯看剑
--   替换后：由 admins 表决定，初始就把这两人写进去 —— 他们的权限一点不减
-- 所以这不是收权，是把同一份权限从代码里搬到表里。

drop policy if exists works_insert on public.works;

create policy works_insert on public.works
  for insert with check (
    lower(owner_email) = lower(auth.jwt() ->> 'email')
    and (
         (kind = 'member'     and public.is_bound_member())
      or (kind = 'collection' and public.is_admin('collection'))
      or (kind = 'video'      and public.is_admin('video'))
    )
  );


-- =====================================================================
-- 第六步：存储桶 —— 批量上传照片，不再需要外部图床
-- =====================================================================
-- 在 Supabase 后台 Storage 新建一个公开桶 `gallery`，
-- 上传策略限 is_admin('gathering')。
-- 建桶这步在后台点几下比写 SQL 稳妥，我到时带你点。


-- =====================================================================
-- 执行顺序（一步都不要跳）
-- =====================================================================
-- 0. 整库导出留底：Supabase 后台 → Table Editor → 依次打开 members / works /
--    work_revisions → 右上角 Export → Download as CSV。三个文件存好。
--    （另有现成的 backup_json() 函数可一次导出 JSON，我确认过它只读不写。）
-- 1. 第一步 admins 表 + is_admin 函数
-- 2. 把四个人的邮箱 insert 进 admins（含飞鸿）
-- 3. 第二步 works 加 body 两列
-- 4. 第三、四步建新表
-- 5. 第五步替换 works_insert 策略 —— 做完立刻请海边试传一次，确认没被挡住
-- 6. 第六步建存储桶
--
-- 回退：第一到第四步都是新增，drop 掉即可。第五步若出问题，
-- 把旧策略原样建回来就恢复现状（旧策略原文我已留存）。
