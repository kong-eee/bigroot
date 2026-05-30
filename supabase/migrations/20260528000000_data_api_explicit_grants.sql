-- =============================================================================
-- Supabase Data API: explicit GRANT (2026-05-30 신규 프로젝트 / 2026-10-30 기존 프로젝트)
-- https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
--
-- supabase-js(PostgREST)로 public 스키마 테이블에 접근하므로, 테이블마다 역할별 GRANT가 필요합니다.
-- RLS는 그대로 두고, GRANT는 "API가 테이블을 볼 수 있는지"만 결정합니다.
--
-- Supabase Dashboard → SQL Editor 에서 1회 실행하세요. (이미 있으면 GRANT는 멱등합니다)
-- =============================================================================

-- ── 테이블: 빅루트 앱에서 사용하는 public 객체 ──

grant select on public.profiles to anon;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.profiles to service_role;

grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.posts to service_role;

grant select on public.comments to anon;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, update, delete on public.comments to service_role;

grant select on public.post_likes to anon;
grant select, insert, update, delete on public.post_likes to authenticated;
grant select, insert, update, delete on public.post_likes to service_role;

grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.notifications to service_role;
-- notifications: 클라이언트는 본인 알림만 RLS로 조회 (anon SELECT 불필요)

grant select on public.feedback_requests to anon;
grant select, insert, update, delete on public.feedback_requests to authenticated;
grant select, insert, update, delete on public.feedback_requests to service_role;

grant select, insert, update, delete on public.golden_time_reminders to authenticated;
grant select, insert, update, delete on public.golden_time_reminders to service_role;

-- uuid/serial 기본값용 시퀀스 (신규 프로젝트에서 INSERT 실패 방지)
grant usage, select on all sequences in schema public to authenticated, service_role;

-- ── RPC: Data API로 호출하는 함수 ──

grant execute on function public.is_app_admin() to anon, authenticated;

grant execute on function public.list_feedback_requests() to anon, authenticated;

-- 조회수 (커뮤니티). 함수가 없으면 이 블록만 무시됩니다.
do $$
begin
  grant execute on function public.increment_view_count(uuid) to anon, authenticated;
exception
  when undefined_function then
    raise notice 'increment_view_count 없음 — 커뮤니티에서 사용 중이면 SQL Editor에 함수 생성 후 GRANT 추가';
end;
$$;
