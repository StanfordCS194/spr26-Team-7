-- Row-level security for report_follows (run once in Supabase SQL Editor if not already applied).

alter table public.report_follows enable row level security;

drop policy if exists "Users can view own follows" on public.report_follows;
create policy "Users can view own follows"
  on public.report_follows for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own follows" on public.report_follows;
create policy "Users can insert own follows"
  on public.report_follows for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own follows" on public.report_follows;
create policy "Users can delete own follows"
  on public.report_follows for delete using (auth.uid() = user_id);
