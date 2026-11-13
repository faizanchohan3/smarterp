-- Run once in the Supabase SQL editor. Stores each user's Nourish data as one JSON document.
create table if not exists public.nourish_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.nourish_state enable row level security;

create policy "Users read their own state" on public.nourish_state
  for select using (auth.uid() = user_id);
create policy "Users insert their own state" on public.nourish_state
  for insert with check (auth.uid() = user_id);
create policy "Users update their own state" on public.nourish_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users delete their own state" on public.nourish_state
  for delete using (auth.uid() = user_id);
