-- 문의·요청 운영자 답변 스레드 (여러 댓글 + 수정)

create table if not exists public.feedback_replies (
  id uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback_requests (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) >= 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feedback_replies_feedback_id_idx
  on public.feedback_replies (feedback_id, created_at asc);

grant select on public.feedback_replies to anon;
grant select, insert, update, delete on public.feedback_replies to authenticated;
grant select, insert, update, delete on public.feedback_replies to service_role;

alter table public.feedback_replies enable row level security;

drop policy if exists feedback_replies_select on public.feedback_replies;
create policy feedback_replies_select on public.feedback_replies
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.feedback_requests fr
      where fr.id = feedback_id
        and (
          fr.is_public
          or (auth.uid() is not null and fr.author_id = auth.uid())
          or public.is_app_admin()
        )
    )
  );

drop policy if exists feedback_replies_insert_admin on public.feedback_replies;
create policy feedback_replies_insert_admin on public.feedback_replies
  for insert to authenticated
  with check (public.is_app_admin() and author_id = auth.uid());

drop policy if exists feedback_replies_update_own on public.feedback_replies;
create policy feedback_replies_update_own on public.feedback_replies
  for update to authenticated
  using (public.is_app_admin() and author_id = auth.uid())
  with check (public.is_app_admin() and author_id = auth.uid());

drop policy if exists feedback_replies_delete_own on public.feedback_replies;
create policy feedback_replies_delete_own on public.feedback_replies
  for delete to authenticated
  using (public.is_app_admin() and author_id = auth.uid());

-- 기존 admin_reply 1건 → 스레드로 이전
insert into public.feedback_replies (feedback_id, author_id, content, created_at, updated_at)
select
  fr.id,
  coalesce(fr.replied_by, fr.author_id),
  fr.admin_reply,
  coalesce(fr.replied_at, fr.updated_at, fr.created_at),
  coalesce(fr.replied_at, fr.updated_at, fr.created_at)
from public.feedback_requests fr
where fr.admin_reply is not null
  and char_length(trim(fr.admin_reply)) >= 2
  and not exists (
    select 1 from public.feedback_replies r where r.feedback_id = fr.id
  );

create or replace function public.set_feedback_reply_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists feedback_replies_updated_at on public.feedback_replies;
create trigger feedback_replies_updated_at
  before update on public.feedback_replies
  for each row execute function public.set_feedback_reply_updated_at();

-- 새 답변 등록 시 작성자 알림
create or replace function public.notify_author_on_feedback_reply_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_author uuid;
begin
  select fr.author_id into request_author
  from public.feedback_requests fr
  where fr.id = new.feedback_id;

  if request_author is null or request_author = new.author_id then
    return new;
  end if;

  insert into public.notifications (user_id, actor_id, post_id, feedback_id, type, is_read)
  values (request_author, new.author_id, null, new.feedback_id, 'feedback_reply', false);

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists trg_notify_author_on_feedback_reply_insert on public.feedback_replies;
create trigger trg_notify_author_on_feedback_reply_insert
  after insert on public.feedback_replies
  for each row execute function public.notify_author_on_feedback_reply_insert();
