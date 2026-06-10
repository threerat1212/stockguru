-- StockGuru PR12/PR15 schema migration
-- Run once in Supabase SQL Editor on the StockGuru project.

-- 1) alerts: smart alert type + notification channels
alter table public.alerts
  add column if not exists type text;

update public.alerts
set type = 'price'
where type is null;

alter table public.alerts
  alter column type set default 'price';

alter table public.alerts
  alter column type set not null;

alter table public.alerts
  drop constraint if exists alerts_type_check;

alter table public.alerts
  add constraint alerts_type_check
  check (type in ('price', 'percent_change', 'volume_spike'));

alter table public.alerts
  add column if not exists notification_channels text[];

update public.alerts
set notification_channels = ARRAY['email']::text[]
where notification_channels is null;

alter table public.alerts
  alter column notification_channels set default ARRAY['email']::text[];

alter table public.alerts
  alter column notification_channels set not null;

-- 2) alert delivery idempotency ledger
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

-- 3) web push subscriptions
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  endpoint text not null,
  p256dh text not null,
  "auth" text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, endpoint)
);

-- 4) indexes
create index if not exists alerts_user_id_idx
  on public.alerts (user_id);

create index if not exists alert_deliveries_user_id_idx
  on public.alert_deliveries (user_id);

create index if not exists push_subscriptions_user_id_idx
  on public.push_subscriptions (user_id);

-- 5) RLS
alter table public.alerts enable row level security;
alter table public.alert_deliveries enable row level security;
alter table public.push_subscriptions enable row level security;

-- 6) policies
drop policy if exists "Users can CRUD own alerts" on public.alerts;

create policy "Users can CRUD own alerts"
  on public.alerts
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can view own alert deliveries" on public.alert_deliveries;

create policy "Users can view own alert deliveries"
  on public.alert_deliveries
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can CRUD own push subscriptions" on public.push_subscriptions;

create policy "Users can CRUD own push subscriptions"
  on public.push_subscriptions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 7) allow authenticated users to use these tables through Supabase client
grant select, insert, update, delete on public.alerts to authenticated;
grant select, insert, update, delete on public.alert_deliveries to authenticated;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
