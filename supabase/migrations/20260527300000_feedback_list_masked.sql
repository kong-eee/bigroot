-- 비공개 글: 비작성자·비운영자에게는 제목만, 내용은 안내 문구로 표시

create or replace function public.list_feedback_requests()
returns table (
  id uuid,
  author_id uuid,
  title text,
  content text,
  is_public boolean,
  content_masked boolean,
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
    not (
      fr.is_public
      or (auth.uid() is not null and fr.author_id = auth.uid())
      or public.is_app_admin()
    ) as content_masked,
    fr.created_at
  from public.feedback_requests fr
  order by fr.created_at desc;
$$;

revoke all on function public.list_feedback_requests() from public;
grant execute on function public.list_feedback_requests() to anon;
grant execute on function public.list_feedback_requests() to authenticated;
