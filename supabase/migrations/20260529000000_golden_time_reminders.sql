-- 골든타임 카톡(문자) 알림 예약
-- Supabase SQL Editor에서 실행

create table if not exists public.golden_time_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_type text not null check (property_type in ('주택', '상가')),
  contract_end_date date not null,
  phone text not null check (phone ~ '^010[0-9]{8}$'),
  consent_at timestamptz not null default now(),
  remind_on_1 date,
  remind_on_2 date,
  remind_on_3 date,
  label_1 text,
  label_2 text,
  label_3 text,
  sent_at_1 timestamptz,
  sent_at_2 timestamptz,
  sent_at_3 timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

create index if not exists golden_time_reminders_remind_1_idx
  on public.golden_time_reminders (remind_on_1) where sent_at_1 is null;
create index if not exists golden_time_reminders_remind_2_idx
  on public.golden_time_reminders (remind_on_2) where sent_at_2 is null;
create index if not exists golden_time_reminders_remind_3_idx
  on public.golden_time_reminders (remind_on_3) where sent_at_3 is null;

grant select, insert, update, delete on public.golden_time_reminders to authenticated;
grant select, insert, update, delete on public.golden_time_reminders to service_role;

alter table public.golden_time_reminders enable row level security;

drop policy if exists golden_reminders_select_own on public.golden_time_reminders;
create policy golden_reminders_select_own on public.golden_time_reminders
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists golden_reminders_insert_own on public.golden_time_reminders;
create policy golden_reminders_insert_own on public.golden_time_reminders
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists golden_reminders_update_own on public.golden_time_reminders;
create policy golden_reminders_update_own on public.golden_time_reminders
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists golden_reminders_delete_own on public.golden_time_reminders;
create policy golden_reminders_delete_own on public.golden_time_reminders
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_golden_reminder_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists golden_time_reminders_updated_at on public.golden_time_reminders;
create trigger golden_time_reminders_updated_at
  before update on public.golden_time_reminders
  for each row execute function public.set_golden_reminder_updated_at();
