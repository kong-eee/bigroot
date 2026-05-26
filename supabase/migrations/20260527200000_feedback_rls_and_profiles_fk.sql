-- 문의 목록이 페이지에 안 보이는 문제 수정
-- 1) anon 이 is_app_admin() 실행 불가 → SELECT 전체 실패
-- 2) profiles(nickname) embed 용 FK

grant execute on function public.is_app_admin() to anon;
grant execute on function public.is_app_admin() to authenticated;

drop policy if exists feedback_select on public.feedback_requests;

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

-- PostgREST embed: feedback_requests.author_id → profiles.id
do $$
begin
  alter table public.feedback_requests
    add constraint feedback_requests_author_profiles_fkey
    foreign key (author_id) references public.profiles (id)
    on delete cascade;
exception
  when duplicate_object then null;
end $$;
