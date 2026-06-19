-- 운영자(is_admin) 전체 게시글·댓글 삭제 권한

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_current_user_admin() to authenticated;

drop policy if exists posts_delete_admin on public.posts;
create policy posts_delete_admin on public.posts
  for delete to authenticated
  using (public.is_current_user_admin());

drop policy if exists comments_delete_admin on public.comments;
create policy comments_delete_admin on public.comments
  for delete to authenticated
  using (public.is_current_user_admin());
