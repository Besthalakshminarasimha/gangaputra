
create table public.autopilot_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  objective text not null,
  plan jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.autopilot_templates enable row level security;
create policy "tpl_select_own" on public.autopilot_templates for select using (auth.uid() = user_id);
create policy "tpl_insert_own" on public.autopilot_templates for insert with check (auth.uid() = user_id);
create policy "tpl_update_own" on public.autopilot_templates for update using (auth.uid() = user_id);
create policy "tpl_delete_own" on public.autopilot_templates for delete using (auth.uid() = user_id);
create trigger tpl_set_updated before update on public.autopilot_templates
for each row execute function public.update_updated_at_column();

create table public.autopilot_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  objective text not null,
  status text not null default 'running',
  mode text not null default 'guided',
  summary text,
  plan jsonb not null default '[]'::jsonb,
  logs jsonb not null default '[]'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.autopilot_runs enable row level security;
create policy "run_select_own" on public.autopilot_runs for select using (auth.uid() = user_id);
create policy "run_insert_own" on public.autopilot_runs for insert with check (auth.uid() = user_id);
create policy "run_update_own" on public.autopilot_runs for update using (auth.uid() = user_id);
create policy "run_delete_own" on public.autopilot_runs for delete using (auth.uid() = user_id);
create index autopilot_runs_user_started on public.autopilot_runs(user_id, started_at desc);
