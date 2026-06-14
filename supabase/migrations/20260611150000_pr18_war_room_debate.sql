-- PR18 — MiroFish-style War Room Debate persistence

create table if not exists public.war_room_debate_runs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  run_id text not null unique,
  question text not null,
  symbols text[] not null default '{}',
  scenario text not null,
  timeframe text not null,
  mode text not null,
  summary text not null,
  thesis text not null,
  risks text[] not null default '{}',
  suggested_checks text[] not null default '{}',
  confidence int not null check (confidence >= 0 and confidence <= 100),
  is_demo boolean not null default false,
  latency_ms int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.war_room_debate_messages (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  run_id uuid references public.war_room_debate_runs on delete cascade not null,
  external_run_id text not null,
  agent_id text not null,
  agent_label text not null,
  round int not null check (round > 0),
  phase text not null,
  message text not null,
  status text not null check (status in ('pass', 'needs_review', 'blocked')),
  confidence int not null check (confidence >= 0 and confidence <= 100),
  evidence_count int not null default 0,
  created_at timestamptz default now()
);

create table if not exists public.war_room_debate_evidence (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  run_id uuid references public.war_room_debate_runs on delete cascade not null,
  external_run_id text not null,
  agent_id text not null,
  label text not null,
  value text not null,
  source text not null,
  created_at timestamptz default now()
);

create table if not exists public.war_room_debate_verifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  run_id uuid references public.war_room_debate_runs on delete cascade not null,
  external_run_id text not null,
  status text not null check (status in ('pass', 'needs_review', 'blocked')),
  confidence int not null check (confidence >= 0 and confidence <= 100),
  checks jsonb not null default '[]'::jsonb,
  issues text[] not null default '{}',
  created_at timestamptz default now()
);

alter table public.war_room_debate_runs enable row level security;
alter table public.war_room_debate_messages enable row level security;
alter table public.war_room_debate_evidence enable row level security;
alter table public.war_room_debate_verifications enable row level security;

drop policy if exists "Users can view own war room debate runs" on public.war_room_debate_runs;
create policy "Users can view own war room debate runs"
  on public.war_room_debate_runs
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own war room debate runs" on public.war_room_debate_runs;
create policy "Users can insert own war room debate runs"
  on public.war_room_debate_runs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own war room debate messages" on public.war_room_debate_messages;
create policy "Users can view own war room debate messages"
  on public.war_room_debate_messages
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own war room debate messages" on public.war_room_debate_messages;
create policy "Users can insert own war room debate messages"
  on public.war_room_debate_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own war room debate evidence" on public.war_room_debate_evidence;
create policy "Users can view own war room debate evidence"
  on public.war_room_debate_evidence
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own war room debate evidence" on public.war_room_debate_evidence;
create policy "Users can insert own war room debate evidence"
  on public.war_room_debate_evidence
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view own war room debate verifications" on public.war_room_debate_verifications;
create policy "Users can view own war room debate verifications"
  on public.war_room_debate_verifications
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own war room debate verifications" on public.war_room_debate_verifications;
create policy "Users can insert own war room debate verifications"
  on public.war_room_debate_verifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.war_room_debate_runs to authenticated;
grant select, insert on public.war_room_debate_messages to authenticated;
grant select, insert on public.war_room_debate_evidence to authenticated;
grant select, insert on public.war_room_debate_verifications to authenticated;

create index if not exists idx_war_room_debate_runs_user_created on public.war_room_debate_runs(user_id, created_at desc);
create index if not exists idx_war_room_debate_messages_run_round on public.war_room_debate_messages(run_id, round);
create index if not exists idx_war_room_debate_evidence_run_agent on public.war_room_debate_evidence(run_id, agent_id);
create index if not exists idx_war_room_debate_verifications_run on public.war_room_debate_verifications(run_id);
