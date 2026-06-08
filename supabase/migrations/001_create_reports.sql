-- Matches the team's Supabase reports table schema.

create table if not exists public.reports (
  id uuid not null default gen_random_uuid(),
  user_id uuid null references auth.users (id) on delete cascade,
  external_id text not null,
  title text not null,
  category text not null,
  tag text not null,
  district text not null default 'San Jose'::text,
  status text not null default 'Submitted'::text,
  description text not null default ''::text,
  address text not null,
  assigned_to text not null default 'Dept. of Public Works'::text,
  estimated_resolution text not null default 'Pending review'::text,
  report_count integer not null default 1,
  photo_count integer not null default 1,
  location_main text null,
  location_sub text null,
  merged boolean not null default false,
  pin jsonb null,
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_pkey primary key (id),
  constraint reports_external_id_key unique (external_id)
);

alter table public.reports enable row level security;

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
  on public.reports for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
  on public.reports for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
  on public.reports for update using (auth.uid() = user_id);
