-- 커뮤니티 알림: RLS + Realtime (Supabase SQL Editor에서 실행)
-- 이미 정책이 있으면 중복 오류는 무시하고 진행하세요.

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notifications_insert_as_actor" on public.notifications;
create policy "notifications_insert_as_actor"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = actor_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id);

-- Realtime (이미 추가됐으면 오류 무시)
alter publication supabase_realtime add table public.notifications;
