-- StockGuru Trading Journal Schema Additions
-- NOTE: These objects are now included in schema.sql (single source of truth).
-- Keep this file for incremental migrations on existing databases only.

-- Update profiles plan check to include trader
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro', 'founding_pro', 'trader'));

-- Update subscriptions plan check to include trader
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions add constraint subscriptions_plan_check check (plan in ('free', 'pro', 'founding_pro', 'trader'));

-- Portfolios table
create table if not exists public.portfolios (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null default 'Default',
  type text not null default 'real' check (type in ('real', 'demo', 'prop_firm')),
  currency text not null default 'THB',
  broker text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.portfolios enable row level security;

drop policy if exists "Users can CRUD own portfolios" on public.portfolios;
create policy "Users can CRUD own portfolios"
  on public.portfolios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Trades table
create table if not exists public.trades (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  portfolio_id uuid references public.portfolios on delete cascade not null,
  symbol text not null,
  market text not null default 'SET',
  direction text not null check (direction in ('long', 'short')),
  entry_price numeric not null,
  exit_price numeric,
  stop_loss numeric,
  take_profit numeric,
  quantity numeric not null,
  fees numeric default 0,
  opened_at timestamptz not null,
  closed_at timestamptz,
  setup text,
  reason text,
  emotion text,
  mistake_tags text[] default '{}',
  result_note text,
  pnl numeric,
  r_multiple numeric,
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trades enable row level security;

drop policy if exists "Users can CRUD own trades" on public.trades;
create policy "Users can CRUD own trades"
  on public.trades for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Journal reviews table (AI weekly reviews)
create table if not exists public.journal_reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  period_start date not null,
  period_end date not null,
  total_trades int not null default 0,
  win_rate numeric not null default 0,
  profit_factor numeric not null default 0,
  avg_r numeric not null default 0,
  common_mistakes text[] default '{}',
  strengths text[] default '{}',
  ai_summary text,
  created_at timestamptz default now(),
  unique(user_id, period_start, period_end)
);

alter table public.journal_reviews enable row level security;

drop policy if exists "Users can view own reviews" on public.journal_reviews;
create policy "Users can view own reviews"
  on public.journal_reviews for select
  using (auth.uid() = user_id);

-- AI usage log columns required by journal review and paid AI limits
alter table public.ai_usage_logs
  alter column prompt drop not null,
  add column if not exists feature text not null default 'chat',
  add column if not exists prompt_length int,
  add column if not exists response_length int;

drop policy if exists "Users can insert own AI logs" on public.ai_usage_logs;
create policy "Users can insert own AI logs"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own usage" on public.usage_counters;
create policy "Users can insert own usage"
  on public.usage_counters for insert
  with check (auth.uid() = user_id);

-- Indexes for performance
create index if not exists idx_trades_user_id on public.trades(user_id);
create index if not exists idx_trades_portfolio_id on public.trades(portfolio_id);
create index if not exists idx_trades_status on public.trades(status);
create index if not exists idx_trades_opened_at on public.trades(opened_at);
create index if not exists idx_portfolios_user_id on public.portfolios(user_id);
create index if not exists idx_journal_reviews_user_period on public.journal_reviews(user_id, period_start, period_end);
create index if not exists idx_ai_usage_logs_user_feature_created on public.ai_usage_logs(user_id, feature, created_at);

-- Safe delete all user journal data (GDPR / data portability)
create or replace function public.delete_user_journal_data(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    raise exception 'not allowed';
  end if;

  delete from public.trades where user_id = target_user_id;
  delete from public.portfolios where user_id = target_user_id;
  delete from public.journal_reviews where user_id = target_user_id;
end;
$$;

-- Safe export all user journal data as JSON
create or replace function public.export_user_journal_data(target_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or auth.uid() <> target_user_id then
    raise exception 'not allowed';
  end if;

  select jsonb_build_object(
    'portfolios', coalesce((select jsonb_agg(to_jsonb(p.*)) from public.portfolios p where p.user_id = target_user_id), '[]'::jsonb),
    'trades', coalesce((select jsonb_agg(to_jsonb(t.*)) from public.trades t where t.user_id = target_user_id), '[]'::jsonb),
    'reviews', coalesce((select jsonb_agg(to_jsonb(r.*)) from public.journal_reviews r where r.user_id = target_user_id), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;

-- Auto-create default portfolio on first trade insert if none exists
create or replace function public.ensure_default_portfolio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.portfolios where user_id = new.user_id and active = true
  ) then
    insert into public.portfolios (user_id, name, type, currency)
    values (new.user_id, 'Default', 'real', 'THB');
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_portfolio_before_trade on public.trades;
create trigger ensure_portfolio_before_trade
  before insert on public.trades
  for each row execute procedure public.ensure_default_portfolio();
