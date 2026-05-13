create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  zip_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  external_id text not null unique,
  title text not null,
  category text not null,
  tag text not null,
  district text not null default 'San Jose',
  status text not null default 'Submitted',
  description text not null default '',
  address text not null,
  assigned_to text not null default 'Dept. of Public Works',
  estimated_resolution text not null default 'Pending review',
  report_count integer not null default 1,
  photo_count integer not null default 1,
  location_main text,
  location_sub text,
  merged boolean not null default false,
  pin jsonb,
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_follows (
  user_id uuid not null references auth.users (id) on delete cascade,
  report_id uuid not null references public.reports (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, report_id)
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists reports_set_updated_at on public.reports;
create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, zip_code)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'zip_code'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_follows enable row level security;

drop policy if exists "profiles are viewable by owner" on public.profiles;
create policy "profiles are viewable by owner"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "profiles are insertable by owner" on public.profiles;
create policy "profiles are insertable by owner"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles are updatable by owner" on public.profiles;
create policy "profiles are updatable by owner"
on public.profiles
for update
using (auth.uid() = id);

drop policy if exists "reports are viewable by owner or public or followed" on public.reports;
create policy "reports are viewable by owner or public or followed"
on public.reports
for select
using (
  user_id is null
  or user_id = auth.uid()
  or exists (
    select 1
    from public.report_follows rf
    where rf.report_id = reports.id
      and rf.user_id = auth.uid()
  )
);

drop policy if exists "reports insertable by owner" on public.reports;
create policy "reports insertable by owner"
on public.reports
for insert
with check (user_id = auth.uid());

drop policy if exists "reports updatable by owner" on public.reports;
create policy "reports updatable by owner"
on public.reports
for update
using (user_id = auth.uid());

drop policy if exists "follows viewable by owner" on public.report_follows;
create policy "follows viewable by owner"
on public.report_follows
for select
using (user_id = auth.uid());

drop policy if exists "follows insertable by owner" on public.report_follows;
create policy "follows insertable by owner"
on public.report_follows
for insert
with check (user_id = auth.uid());

drop policy if exists "follows deletable by owner" on public.report_follows;
create policy "follows deletable by owner"
on public.report_follows
for delete
using (user_id = auth.uid());

insert into public.reports (
  id,
  user_id,
  external_id,
  title,
  category,
  tag,
  district,
  status,
  description,
  address,
  assigned_to,
  estimated_resolution,
  report_count,
  photo_count,
  location_main,
  location_sub,
  merged,
  pin,
  timeline
)
values
  (
    '11111111-1111-1111-1111-111111111111',
    null,
    'GC-2026-04821',
    'Pothole at Glen Eyrie and Carolyn',
    'Pothole',
    'Road hazard',
    'Willow Glen District',
    'In Progress',
    'Large pothole in the right lane creating a sharp dip for cars and bikes turning through the intersection.',
    'Glen Eyrie Ave & Carolyn Ave, San Jose, CA 95125',
    'Dept. of Transportation',
    'Estimated 5-7 days based on downtown pothole repairs',
    14,
    2,
    'Glen Eyrie Ave & Carolyn Ave',
    'San Jose, CA 95125',
    false,
    '{"top": 38, "left": 76, "color": "#F08B00"}'::jsonb,
    '[{"label":"Submitted","dateText":"Apr 22, 2026 at 8:12 AM","reached":true},{"label":"Received","dateText":"Apr 22, 2026 at 9:03 AM","reached":true},{"label":"In Progress","dateText":"Apr 26, 2026 at 2:40 PM","reached":true},{"label":"Resolved","dateText":"Pending","reached":false}]'::jsonb
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    null,
    'GC-2026-04778',
    'Broken streetlight on Elm and 2nd',
    'Streetlight Outage',
    'Night visibility',
    'Civic Center District',
    'Received',
    'Streetlight has been out for three nights, leaving the crosswalk and bus stop corner unlit.',
    'Elm St & 2nd St, San Jose, CA 95112',
    'Dept. of Public Works',
    'Estimated 2-4 days based on recent utility response times',
    9,
    1,
    'Elm St & 2nd St',
    'San Jose, CA 95112',
    false,
    '{"top": 108, "left": 148, "color": "#0F9CFF"}'::jsonb,
    '[{"label":"Submitted","dateText":"Apr 24, 2026 at 6:51 PM","reached":true},{"label":"Received","dateText":"Apr 24, 2026 at 7:25 PM","reached":true},{"label":"In Progress","dateText":"Queued for crew assignment","reached":false},{"label":"Resolved","dateText":"Pending","reached":false}]'::jsonb
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    null,
    'GC-2026-04691',
    'Illegal dumping near Parkside Lot',
    'Illegal Dumping',
    'Bulk waste',
    'Parkside District',
    'Received',
    'Three bags of construction debris and a broken chair dumped along the fence line by the public lot.',
    'Parkside Lot, 1180 Park Ave, San Jose, CA 95126',
    'Environmental Services',
    'Estimated 3-5 days based on sanitation pickup history',
    7,
    1,
    'Parkside Lot',
    'San Jose, CA 95126',
    false,
    '{"top": 68, "left": 246, "color": "#28A745"}'::jsonb,
    '[{"label":"Submitted","dateText":"Apr 25, 2026 at 7:14 AM","reached":true},{"label":"Received","dateText":"Apr 25, 2026 at 8:02 AM","reached":true},{"label":"In Progress","dateText":"Pending route confirmation","reached":false},{"label":"Resolved","dateText":"Pending","reached":false}]'::jsonb
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    null,
    'GC-2026-04564',
    'Graffiti on library mural wall',
    'Graffiti',
    'Public art damage',
    'Market South District',
    'Resolved',
    'Fresh graffiti covers the lower section of the community mural facing the bus plaza.',
    'Main Library Plaza, Market St, San Jose, CA 95113',
    'Parks & Recreation Dept.',
    'Resolved in 2 days, faster than the 4-day district average',
    5,
    3,
    'Main Library Plaza',
    'San Jose, CA 95113',
    false,
    '{"top": 154, "left": 216, "color": "#A35DFF"}'::jsonb,
    '[{"label":"Submitted","dateText":"Apr 18, 2026 at 10:09 AM","reached":true},{"label":"Received","dateText":"Apr 18, 2026 at 10:27 AM","reached":true},{"label":"In Progress","dateText":"Apr 19, 2026 at 8:10 AM","reached":true},{"label":"Resolved","dateText":"Apr 20, 2026 at 4:42 PM","reached":true}]'::jsonb
  )
on conflict (id) do nothing;
