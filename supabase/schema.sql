-- StockGuru Database Schema
-- Run this in Supabase SQL Editor after creating project

-- Enable RLS on all tables
-- Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text not null,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'founding_pro', 'trader')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Subscriptions table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  plan text not null default 'free' check (plan in ('free', 'pro', 'founding_pro', 'trader')),
  status text not null default 'active' check (status in ('active', 'canceled', 'past_due', 'expired')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.subscriptions enable row level security;

create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Usage counters (daily/periodic reset via cron)
create table if not exists public.usage_counters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  ai_questions_today int not null default 0,
  ai_questions_month int not null default 0,
  ai_questions_reset_date date not null default current_date,
  ai_questions_reset_month date not null default date_trunc('month', current_date)::date,
  watchlist_count int not null default 0,
  alerts_count int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.usage_counters enable row level security;

create policy "Users can view own usage"
  on public.usage_counters for select
  using (auth.uid() = user_id);

create policy "Users can insert own usage"
  on public.usage_counters for insert
  with check (auth.uid() = user_id);

create policy "Users can update own usage"
  on public.usage_counters for update
  using (auth.uid() = user_id);

-- Watchlists (server-side persistence)
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  notes text,
  added_at timestamptz default now(),
  unique(user_id, symbol)
);

alter table public.watchlists enable row level security;

create policy "Users can CRUD own watchlist"
  on public.watchlists for all
  using (auth.uid() = user_id);

-- Alerts (server-side persistence)
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  type text not null default 'price' check (type in ('price', 'percent_change', 'volume_spike')),
  target_price numeric not null,
  condition text not null check (condition in ('above', 'below')),
  triggered boolean default false,
  triggered_at timestamptz,
  notification_channels text[] default '{"email"}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Idempotency ledger for alert deliveries. Cron checks this before sending email/push.
create table if not exists public.alert_deliveries (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid references public.alerts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  channel text not null check (channel in ('email', 'push')),
  delivery_key text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_attempt_at timestamptz,
  sent_at timestamptz,
  error text,
  created_at timestamptz default now(),
  unique(alert_id, channel, delivery_key)
);

-- Web push subscriptions.
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, endpoint)
);

alter table public.alerts enable row level security;
alter table public.alert_deliveries enable row level security;
alter table public.push_subscriptions enable row level security;

create policy "Users can CRUD own alerts"
  on public.alerts for all
  using (auth.uid() = user_id);

create policy "Users can view own alert deliveries"
  on public.alert_deliveries for select
  using (auth.uid() = user_id);

create policy "Users can CRUD own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);

-- AI usage logs
create table if not exists public.ai_usage_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  feature text not null default 'chat',
  prompt text,
  response text,
  prompt_length int,
  response_length int,
  tokens_used int,
  latency_ms int,
  error text,
  created_at timestamptz default now()
);

alter table public.ai_usage_logs enable row level security;

create policy "Users can view own AI logs"
  on public.ai_usage_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own AI logs"
  on public.ai_usage_logs for insert
  with check (auth.uid() = user_id);

-- Billing events (for debugging/webhooks)
create table if not exists public.billing_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  event_type text not null,
  stripe_event_id text,
  payload jsonb,
  created_at timestamptz default now()
);

alter table public.billing_events enable row level security;

create policy "Users can view own billing events"
  on public.billing_events for select
  using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, plan)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'free');
  
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active');
  
  insert into public.usage_counters (user_id)
  values (new.id);

  if to_regclass('public.portfolios') is not null then
    execute 'insert into public.portfolios (user_id, name, type, currency) values ($1, ''Default'', ''real'', ''THB'')'
    using new.id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- News articles table
create table if not exists public.news_articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  summary text not null,
  content text[] default '{}',
  url text not null,
  source text not null,
  image_url text,
  published_at timestamptz not null,
  updated_at timestamptz default now(),
  category text not null check (category in ('market', 'sector', 'company', 'global', 'crypto')),
  related_symbols text[] default '{}',
  market_impact_score int check (market_impact_score >= 0 and market_impact_score <= 100),
  impact_points jsonb default '[]',
  references jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.news_articles enable row level security;

create policy "Anyone can read news articles"
  on public.news_articles for select
  to authenticated, anon
  using (true);

create policy "Only service role can manage news"
  on public.news_articles for all
  to service_role
  using (true)
  with check (true);

create index if not exists idx_news_published_at on public.news_articles(published_at desc);
create index if not exists idx_news_category on public.news_articles(category);
create index if not exists idx_news_slug on public.news_articles(slug);

-- Cleanup old news articles (keep last 200)
create or replace function public.cleanup_old_news()
returns void as $$
begin
  delete from public.news_articles
  where id not in (
    select id from public.news_articles
    order by published_at desc
    limit 200
  );
end;
$$ language plpgsql security definer;

-- Holdings table (portfolio positions)
create table if not exists public.holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  quantity int not null check (quantity > 0),
  buy_price numeric not null check (buy_price > 0),
  currency text not null default 'THB',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.holdings enable row level security;

create policy "Users can CRUD own holdings"
  on public.holdings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_holdings_user_id on public.holdings(user_id);
create index if not exists idx_holdings_symbol on public.holdings(symbol);

-- ============================================================
-- Trading Journal (merged from journal-schema.sql)
-- ============================================================

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

alter table public.ai_usage_logs
  alter column prompt drop not null,
  add column if not exists feature text not null default 'chat',
  add column if not exists prompt_length int,
  add column if not exists response_length int;

create index if not exists idx_trades_user_id on public.trades(user_id);
create index if not exists idx_trades_portfolio_id on public.trades(portfolio_id);
create index if not exists idx_trades_status on public.trades(status);
create index if not exists idx_trades_opened_at on public.trades(opened_at);
create index if not exists idx_portfolios_user_id on public.portfolios(user_id);
create index if not exists idx_journal_reviews_user_period on public.journal_reviews(user_id, period_start, period_end);
create index if not exists idx_ai_usage_logs_user_feature_created on public.ai_usage_logs(user_id, feature, created_at);

create or replace function public.delete_user_journal_data(target_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid() <> target_user_id then raise exception 'not allowed'; end if;
  delete from public.trades where user_id = target_user_id;
  delete from public.portfolios where user_id = target_user_id;
  delete from public.journal_reviews where user_id = target_user_id;
end; $$;

create or replace function public.ensure_default_portfolio()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.portfolios where user_id = new.user_id and active = true) then
    insert into public.portfolios (user_id, name, type, currency) values (new.user_id, 'Default', 'real', 'THB');
  end if;
  return new;
end; $$;

drop trigger if exists ensure_portfolio_before_trade on public.trades;
create trigger ensure_portfolio_before_trade
  before insert on public.trades
  for each row execute procedure public.ensure_default_portfolio();
