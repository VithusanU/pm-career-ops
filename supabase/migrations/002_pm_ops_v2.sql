-- PM Career Ops — Migration 002
-- Additive only: no DROP, no destructive ALTER. Safe to run on a database
-- that already has real application/contact/company_docs data — existing
-- rows are backfilled into the new structures, never deleted or overwritten.
--
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- after 001 (the schema already deployed).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Companies — first-class entity instead of a free-text field
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  slug text not null, -- normalized (lowercase, punctuation stripped) for matching
  checklist jsonb default '[]'::jsonb, -- [{ id, label, done }]
  created_at timestamptz default now(),
  unique (user_id, slug)
);

alter table companies enable row level security;

drop policy if exists "users_own_companies" on companies;
create policy "users_own_companies" on companies for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Backfill: one company row per distinct company name already in your
-- applications table. This is what preserves your existing pipeline —
-- nothing needs to be re-entered.
insert into companies (user_id, name, slug)
select distinct
  a.user_id,
  a.company,
  lower(regexp_replace(trim(a.company), '[^a-zA-Z0-9]+', '-', 'g'))
from applications a
where a.company is not null and trim(a.company) <> ''
on conflict (user_id, slug) do nothing;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Link applications / contacts / company_docs to companies via nullable
--    FK. The old free-text `company` column stays untouched as a fallback,
--    so nothing breaks if company_id is null for older rows.
-- ─────────────────────────────────────────────────────────────────────────
alter table applications add column if not exists company_id uuid references companies(id) on delete set null;
alter table contacts      add column if not exists company_id uuid references companies(id) on delete set null;
alter table company_docs  add column if not exists company_id uuid references companies(id) on delete set null;

update applications a
set company_id = c.id
from companies c
where c.user_id = a.user_id
  and c.slug = lower(regexp_replace(trim(a.company), '[^a-zA-Z0-9]+', '-', 'g'))
  and a.company_id is null;

update contacts t
set company_id = c.id
from companies c
where c.user_id = t.user_id
  and t.company is not null and trim(t.company) <> ''
  and c.slug = lower(regexp_replace(trim(t.company), '[^a-zA-Z0-9]+', '-', 'g'))
  and t.company_id is null;

update company_docs d
set company_id = c.id
from companies c
where c.user_id = d.user_id
  and c.slug = lower(regexp_replace(trim(d.company), '[^a-zA-Z0-9]+', '-', 'g'))
  and d.company_id is null;

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Fit-score rubric — additive sub-scores. The existing `score` column
--    is left exactly as-is, so every score you've already entered is
--    preserved. New entries can optionally use the 3-part rubric, which
--    then computes into `score` for continued sorting/compatibility.
-- ─────────────────────────────────────────────────────────────────────────
alter table applications add column if not exists score_role_fit integer;
alter table applications add column if not exists score_company_quality integer;
alter table applications add column if not exists score_skill_match integer;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Daily checklist history — was localStorage-only (device-bound, no
--    history). This lets the dashboard show streaks / past completion.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists daily_checklist_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  log_date date not null,
  checked_ids text[] default '{}',
  updated_at timestamptz default now(),
  unique (user_id, log_date)
);

alter table daily_checklist_log enable row level security;

drop policy if exists "users_own_checklist_log" on daily_checklist_log;
create policy "users_own_checklist_log" on daily_checklist_log for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Gmail application-status sync
--    - gmail_sync_tokens: one refresh token per user, RLS-protected,
--      never sent to the browser (only read by server-side API routes).
--    - gmail_status_signals: candidate matches surfaced to the user for
--      manual accept/dismiss — we never silently overwrite pipeline data.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists gmail_sync_tokens (
  user_id uuid references auth.users(id) on delete cascade primary key,
  refresh_token text not null,
  last_synced_at timestamptz,
  created_at timestamptz default now()
);

alter table gmail_sync_tokens enable row level security;

drop policy if exists "users_own_gmail_tokens" on gmail_sync_tokens;
create policy "users_own_gmail_tokens" on gmail_sync_tokens for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists gmail_status_signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  application_id uuid references applications(id) on delete cascade not null,
  gmail_message_id text not null,
  detected_type text not null, -- 'rejected' | 'interview' | 'update' | 'offer'
  snippet text default '',
  email_date timestamptz,
  status text default 'pending', -- 'pending' | 'accepted' | 'dismissed'
  created_at timestamptz default now(),
  unique (user_id, gmail_message_id, application_id)
);

alter table gmail_status_signals enable row level security;

drop policy if exists "users_own_gmail_signals" on gmail_status_signals;
create policy "users_own_gmail_signals" on gmail_status_signals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
