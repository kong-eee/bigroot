-- 마이페이지 본인 번호 + 주택/상가 각각 골든타임 알림

alter table public.profiles
  add column if not exists phone text,
  add column if not exists phone_consent_at timestamptz,
  add column if not exists contract_end_date_housing date,
  add column if not exists contract_end_date_commercial date;

alter table public.profiles drop constraint if exists profiles_phone_check;
alter table public.profiles add constraint profiles_phone_check
  check (phone is null or phone ~ '^010[0-9]{8}$');

-- 기존 단일 만기일 → 유형별 컬럼으로 이전 (profiles.contract_end_date 는 text)
update public.profiles
set contract_end_date_housing = contract_end_date::date
where contract_end_date is not null
  and contract_end_date ~ '^\d{4}-\d{2}-\d{2}$'
  and coalesce(property_type, '주택') = '주택'
  and contract_end_date_housing is null;

update public.profiles
set contract_end_date_commercial = contract_end_date::date
where contract_end_date is not null
  and contract_end_date ~ '^\d{4}-\d{2}-\d{2}$'
  and property_type = '상가'
  and contract_end_date_commercial is null;

-- 사용자당 주택·상가 각 1건 알림 예약
alter table public.golden_time_reminders drop constraint if exists golden_time_reminders_user_id_key;
drop index if exists golden_time_reminders_user_property_unique;
create unique index golden_time_reminders_user_property_unique
  on public.golden_time_reminders (user_id, property_type);
