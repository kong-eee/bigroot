-- 관심 임대차 유형 (주택·상가, 복수 선택 가능)

alter table public.profiles
  add column if not exists interest_types text[] not null default '{}';

alter table public.profiles drop constraint if exists profiles_interest_types_check;
alter table public.profiles add constraint profiles_interest_types_check
  check (interest_types <@ array['주택', '상가']::text[]);
