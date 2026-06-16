-- Migration: RLS WITH CHECK hardening
-- Date: 2026-06-16
-- Purpose: Add WITH CHECK to FOR ALL policies on watchlists, alerts, push_subscriptions
--          so that INSERT/UPDATE cannot re-target rows to another user.
--
-- RLS USING only filters which rows are *visible*; WITHOUT a WITH CHECK clause,
-- a write could change user_id to another account on tables that allow client
-- writes to that column. WITH CHECK re-validates ownership on the written row.
--
-- Schema.sql (fresh-install reference) already carries these changes; this
-- migration applies them to databases created before this fix.
--
-- Idempotent: uses DROP POLICY + CREATE POLICY so re-running is safe.

begin;

-- watchlists
drop policy if exists "Users can CRUD own watchlist" on public.watchlists;
create policy "Users can CRUD own watchlist"
  on public.watchlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- alerts
drop policy if exists "Users can CRUD own alerts" on public.alerts;
create policy "Users can CRUD own alerts"
  on public.alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- push_subscriptions
drop policy if exists "Users can CRUD own push subscriptions" on public.push_subscriptions;
create policy "Users can CRUD own push subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

commit;
