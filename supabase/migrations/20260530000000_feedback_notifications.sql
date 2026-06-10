-- 문의·요청 운영자 답변 + 알림 (Supabase SQL Editor에서 실행)

-- 1) 답변 컬럼
alter table public.feedback_requests
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists replied_by uuid references auth.users (id) on delete set null;

-- 2) notifications — 문의 알림 지원
alter table public.notifications alter column post_id drop not null;

alter table public.notifications
  add column if not exists feedback_id uuid references public.feedback_requests (id) on delete cascade;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in ('comment', 'like', 'feedback_new', 'feedback_reply'));

alter table public.notifications drop constraint if exists notifications_target_check;
alter table public.notifications add constraint notifications_target_check
  check (
    (type in ('comment', 'like') and post_id is not null)
    or (type in ('feedback_new', 'feedback_reply') and feedback_id is not null)
  );

-- 3) 운영자 답변 UPDATE
drop policy if exists feedback_admin_reply on public.feedback_requests;
create policy feedback_admin_reply on public.feedback_requests
  for update to authenticated
  using (public.is_app_admin())
  with check (public.is_app_admin());

-- 4) 새 문의 → 운영자 알림
create or replace function public.notify_admins_on_feedback_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  admin_id uuid;
begin
  for admin_id in
    select p.id from public.profiles p where p.is_admin = true
  loop
    if admin_id = new.author_id then
      continue;
    end if;
    insert into public.notifications (user_id, actor_id, post_id, feedback_id, type, is_read)
    values (admin_id, new.author_id, null, new.id, 'feedback_new', false);
  end loop;
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists trg_notify_admins_on_feedback on public.feedback_requests;
create trigger trg_notify_admins_on_feedback
  after insert on public.feedback_requests
  for each row execute function public.notify_admins_on_feedback_insert();

-- 5) 운영자 답변 → 작성자 알림
create or replace function public.notify_author_on_feedback_reply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  replier uuid;
begin
  if new.admin_reply is null or char_length(trim(new.admin_reply)) = 0 then
    return new;
  end if;
  if old.admin_reply is not distinct from new.admin_reply then
    return new;
  end if;

  replier := coalesce(new.replied_by, auth.uid());
  if new.author_id is null or new.author_id = replier then
    return new;
  end if;

  insert into public.notifications (user_id, actor_id, post_id, feedback_id, type, is_read)
  values (new.author_id, replier, null, new.id, 'feedback_reply', false);

  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists trg_notify_author_on_feedback_reply on public.feedback_requests;
create trigger trg_notify_author_on_feedback_reply
  after update of admin_reply, replied_by on public.feedback_requests
  for each row execute function public.notify_author_on_feedback_reply();

-- 6) 목록 RPC — 답변 필드 포함 (반환 타입 변경 시 replace 불가 → drop 후 재생성)
drop function if exists public.list_feedback_requests();

create or replace function public.list_feedback_requests()
returns table (
  id uuid,
  author_id uuid,
  title text,
  content text,
  is_public boolean,
  content_masked boolean,
  admin_reply text,
  replied_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fr.id,
    fr.author_id,
    fr.title,
    case
      when fr.is_public then fr.content
      when auth.uid() is not null and fr.author_id = auth.uid() then fr.content
      when public.is_app_admin() then fr.content
      else '비공개 글입니다. 작성자와 운영자만 내용을 확인할 수 있어요.'
    end as content,
    fr.is_public,
    (
      not fr.is_public
      and not (auth.uid() is not null and fr.author_id = auth.uid())
      and not public.is_app_admin()
    ) as content_masked,
    case
      when fr.admin_reply is null or char_length(trim(fr.admin_reply)) = 0 then null
      when fr.is_public then fr.admin_reply
      when auth.uid() is not null and fr.author_id = auth.uid() then fr.admin_reply
      when public.is_app_admin() then fr.admin_reply
      else null
    end as admin_reply,
    fr.replied_at,
    fr.created_at
  from public.feedback_requests fr
  order by fr.created_at desc;
$$;

revoke all on function public.list_feedback_requests() from public;
grant execute on function public.list_feedback_requests() to anon;
grant execute on function public.list_feedback_requests() to authenticated;
