-- 알림 테이블 + 댓글/좋아요 시 자동 알림 (Supabase SQL Editor에서 실행)
-- RLS로 클라이언트 INSERT가 막혀도 트리거로 알림이 생성됩니다.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  actor_id uuid not null references auth.users (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  type text not null check (type in ('comment', 'like')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, is_read);

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

-- 댓글 작성 시 글 작성자에게 알림
create or replace function public.notify_post_author_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if post_author is null or post_author = new.author_id then
    return new;
  end if;

  insert into public.notifications (user_id, actor_id, post_id, type, is_read)
  values (post_author, new.author_id, new.post_id, 'comment', false);

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists trg_notify_post_author_on_comment on public.comments;
create trigger trg_notify_post_author_on_comment
  after insert on public.comments
  for each row
  execute function public.notify_post_author_on_comment();

-- 좋아요 시 글 작성자에게 알림
create or replace function public.notify_post_author_on_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
begin
  select author_id into post_author from public.posts where id = new.post_id;

  if post_author is null or post_author = new.user_id then
    return new;
  end if;

  insert into public.notifications (user_id, actor_id, post_id, type, is_read)
  values (post_author, new.user_id, new.post_id, 'like', false);

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists trg_notify_post_author_on_like on public.post_likes;
create trigger trg_notify_post_author_on_like
  after insert on public.post_likes
  for each row
  execute function public.notify_post_author_on_like();

-- Realtime (이미 추가됐으면 오류 무시)
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then
    null;
end;
$$;
