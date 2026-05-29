-- 문의·요청(feedback_requests) + 운영자(is_admin)
-- Supabase Dashboard → SQL Editor 에서 실행하세요.

-- 1) 운영자 플래그 (profiles)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2) 문의·요청 테이블
create table if not exists public.feedback_requests (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 1),
  content text not null check (char_length(trim(content)) >= 2),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_requests_created_at_idx
  on public.feedback_requests (created_at desc);

create index if not exists feedback_requests_author_id_idx
  on public.feedback_requests (author_id);

-- Data API 노출 (2026-05-30~ 명시 GRANT 필수)
grant select on public.feedback_requests to anon;
grant select, insert, update, delete on public.feedback_requests to authenticated;
grant select, insert, update, delete on public.feedback_requests to service_role;

-- 3) 운영자 여부 (RLS용)
create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.is_app_admin() to anon;

-- 4) RLS
alter table public.feedback_requests enable row level security;

drop policy if exists feedback_select on public.feedback_requests;
drop policy if exists feedback_select_anon on public.feedback_requests;
drop policy if exists feedback_select_authenticated on public.feedback_requests;

create policy feedback_select_anon on public.feedback_requests
  for select to anon
  using (is_public = true);

create policy feedback_select_authenticated on public.feedback_requests
  for select to authenticated
  using (
    is_public = true
    or author_id = auth.uid()
    or public.is_app_admin()
  );

-- PostgREST profiles(nickname) embed
do $$
begin
  alter table public.feedback_requests
    add constraint feedback_requests_author_profiles_fkey
    foreign key (author_id) references public.profiles (id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;

drop policy if exists feedback_insert on public.feedback_requests;
create policy feedback_insert on public.feedback_requests
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.nickname is not null
        and char_length(trim(p.nickname)) > 0
    )
  );

drop policy if exists feedback_update_own on public.feedback_requests;
create policy feedback_update_own on public.feedback_requests
  for update to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

drop policy if exists feedback_delete on public.feedback_requests;
create policy feedback_delete on public.feedback_requests
  for delete to authenticated
  using (author_id = auth.uid() or public.is_app_admin());

-- 5) updated_at 자동 갱신
create or replace function public.set_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feedback_requests_updated_at on public.feedback_requests;
create trigger feedback_requests_updated_at
  before update on public.feedback_requests
  for each row execute function public.set_feedback_updated_at();

-- ============================================================
-- 운영자 계정 설정 (본인 UUID로 1회 실행)
-- ============================================================
-- 1) Supabase → Authentication → Users 에서 본인 계정 UUID 복사
-- 2) 아래 SQL의 YOUR_USER_UUID 를 붙여넣고 실행:
--
--   update public.profiles
--   set is_admin = true
--   where id = 'YOUR_USER_UUID';
--
-- 3) profiles 에 행이 없으면 먼저 앱에서 로그인·닉네임 설정 후 다시 실행
