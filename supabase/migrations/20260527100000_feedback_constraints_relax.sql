-- feedback_requests 내용 길이 제약 완화 (5자 → 2자)
-- Supabase SQL Editor에서 실행 (이미 테이블이 있는 경우)

alter table public.feedback_requests
  drop constraint if exists feedback_requests_content_check;

alter table public.feedback_requests
  drop constraint if exists feedback_requests_title_check;

alter table public.feedback_requests
  add constraint feedback_requests_title_check
  check (char_length(trim(title)) >= 1);

alter table public.feedback_requests
  add constraint feedback_requests_content_check
  check (char_length(trim(content)) >= 2);
