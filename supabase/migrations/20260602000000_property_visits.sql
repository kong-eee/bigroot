-- 임장(매물 방문) 기록 — 사용자별 저장·비교
-- Supabase SQL Editor에서 실행

create table if not exists public.property_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  property_type text not null check (property_type in ('주택', '상가')),
  title text not null check (char_length(trim(title)) >= 1),
  address text,
  visited_at date not null default (current_date),
  deposit_won bigint,
  monthly_rent_won bigint,
  maintenance_won bigint,
  key_money_won bigint,
  area_m2 numeric(8, 2),
  floor text,
  direction text,
  building_year smallint,
  parking text,
  transport text,
  neighborhood text,
  sunlight text,
  noise text,
  humidity text,
  facilities text,
  pros text,
  cons text,
  features text,
  landlord_impression text,
  agent_info text,
  contract_notes text,
  overall_score smallint check (overall_score is null or overall_score between 1 and 5),
  decision text check (decision is null or decision in ('관심', '보류', '제외')),
  checklist jsonb not null default '{}'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists property_visits_user_visited_idx
  on public.property_visits (user_id, visited_at desc);

create index if not exists property_visits_user_type_idx
  on public.property_visits (user_id, property_type);

grant select, insert, update, delete on public.property_visits to authenticated;
grant select, insert, update, delete on public.property_visits to service_role;

alter table public.property_visits enable row level security;

drop policy if exists property_visits_select_own on public.property_visits;
create policy property_visits_select_own on public.property_visits
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists property_visits_insert_own on public.property_visits;
create policy property_visits_insert_own on public.property_visits
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists property_visits_update_own on public.property_visits;
create policy property_visits_update_own on public.property_visits
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists property_visits_delete_own on public.property_visits;
create policy property_visits_delete_own on public.property_visits
  for delete to authenticated using (auth.uid() = user_id);

create or replace function public.set_property_visit_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists property_visits_updated_at on public.property_visits;
create trigger property_visits_updated_at
  before update on public.property_visits
  for each row execute function public.set_property_visit_updated_at();

-- 사진 저장소 (비공개 버킷, 경로: {user_id}/{visit_id}/{file})
insert into storage.buckets (id, name, public)
values ('property-visit-photos', 'property-visit-photos', false)
on conflict (id) do nothing;

drop policy if exists property_visit_photos_insert on storage.objects;
create policy property_visit_photos_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists property_visit_photos_select on storage.objects;
create policy property_visit_photos_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'property-visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists property_visit_photos_delete on storage.objects;
create policy property_visit_photos_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-visit-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
