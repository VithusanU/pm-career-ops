-- PM Career Ops — Supabase Schema
-- Run this in the Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- Applications
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company text not null default '',
  role text not null default '',
  url text default '',
  source text default 'LinkedIn',
  stage text default 'Researching',
  priority text default 'Medium',
  score integer default 50,
  date_added date default current_date,
  date_applied date,
  next_action text default '',
  next_action_date date,
  notes text default '',
  ats_keywords text[] default '{}',
  contact_name text default '',
  contact_linkedin text default '',
  response text default 'None',
  created_at timestamptz default now()
);

alter table applications enable row level security;
create policy "users_own_applications" on applications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default '',
  title text default '',
  company text default '',
  linkedin text default '',
  type text default 'PM',
  status text default 'Pending',
  last_contact date,
  next_follow_up date,
  notes text default '',
  coffee_chat boolean default false,
  created_at timestamptz default now()
);

alter table contacts enable row level security;
create policy "users_own_contacts" on contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Content Items
create table if not exists content_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  type text default 'Company Analysis',
  status text default 'Idea',
  target_company text default '',
  platform text[] default '{}',
  date_drafted date,
  date_published date,
  outline text default '',
  notes text default '',
  created_at timestamptz default now()
);

alter table content_items enable row level security;
create policy "users_own_content" on content_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Company Research Documents
create table if not exists company_docs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  company text not null,
  file_name text not null,
  file_path text not null,
  file_size integer not null default 0,
  file_type text not null default '',
  created_at timestamptz default now()
);

alter table company_docs enable row level security;
create policy "users_own_company_docs" on company_docs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage bucket for company research documents
-- Run these in the Supabase SQL Editor:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-docs',
  'company-docs',
  false,
  20971520, -- 20 MB per file
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/csv',
    'image/png',
    'image/jpeg'
  ]
) on conflict (id) do nothing;

-- Storage RLS policies
create policy "users_upload_own_docs"
  on storage.objects for insert
  with check (bucket_id = 'company-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users_read_own_docs"
  on storage.objects for select
  using (bucket_id = 'company-docs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "users_delete_own_docs"
  on storage.objects for delete
  using (bucket_id = 'company-docs' and auth.uid()::text = (storage.foldername(name))[1]);
