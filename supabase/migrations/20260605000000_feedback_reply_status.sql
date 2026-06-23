-- 문의 목록: 답변 여부 공개 (비공개 글도 답변 전/후 구분)

drop function if exists public.list_feedback_requests();

create or replace function public.list_feedback_requests()
returns table (
  id uuid,
  author_id uuid,
  title text,
  content text,
  is_public boolean,
  content_masked boolean,
  has_admin_reply boolean,
  reply_count int,
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
      when (
        exists (select 1 from public.feedback_replies r where r.feedback_id = fr.id)
        or (fr.admin_reply is not null and char_length(trim(fr.admin_reply)) >= 2)
      ) then '비공개 글입니다. 운영자 답변이 완료되었어요. (내용은 작성자·운영자만 볼 수 있어요)'
      else '비공개 글입니다. 운영자 답변을 기다리는 중이에요. (내용은 작성자·운영자만 볼 수 있어요)'
    end as content,
    fr.is_public,
    (
      not fr.is_public
      and not (auth.uid() is not null and fr.author_id = auth.uid())
      and not public.is_app_admin()
    ) as content_masked,
    (
      exists (select 1 from public.feedback_replies r where r.feedback_id = fr.id)
      or (fr.admin_reply is not null and char_length(trim(fr.admin_reply)) >= 2)
    ) as has_admin_reply,
    (
      select count(*)::int from public.feedback_replies r where r.feedback_id = fr.id
    ) + case
      when fr.admin_reply is not null
        and char_length(trim(fr.admin_reply)) >= 2
        and not exists (select 1 from public.feedback_replies r where r.feedback_id = fr.id)
      then 1
      else 0
    end as reply_count,
    case
      when fr.admin_reply is null or char_length(trim(fr.admin_reply)) = 0 then null
      when fr.is_public then fr.admin_reply
      when auth.uid() is not null and fr.author_id = auth.uid() then fr.admin_reply
      when public.is_app_admin() then fr.admin_reply
      else null
    end as admin_reply,
    coalesce(
      (select max(r.created_at) from public.feedback_replies r where r.feedback_id = fr.id),
      fr.replied_at
    ) as replied_at,
    fr.created_at
  from public.feedback_requests fr
  order by fr.created_at desc;
$$;

revoke all on function public.list_feedback_requests() from public;
grant execute on function public.list_feedback_requests() to anon;
grant execute on function public.list_feedback_requests() to authenticated;
