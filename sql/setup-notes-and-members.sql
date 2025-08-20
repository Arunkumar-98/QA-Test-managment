-- Setup Notes and Multi-User Project Memberships
-- Safe to run multiple times (idempotent where possible)

-- ===============
-- NOTES TABLE
-- ===============
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null default '',
  content text not null default '',
  tags text[] default array[]::text[],
  color text default '',
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;

drop policy if exists "notes_select" on public.notes;
drop policy if exists "notes_insert" on public.notes;
drop policy if exists "notes_update" on public.notes;
drop policy if exists "notes_delete" on public.notes;

create policy "notes_select" on public.notes
  for select using (auth.uid() = user_id);

create policy "notes_insert" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "notes_update" on public.notes
  for update using (auth.uid() = user_id);

create policy "notes_delete" on public.notes
  for delete using (auth.uid() = user_id);

create or replace function public.update_notes_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_notes_updated_at on public.notes;
create trigger trg_update_notes_updated_at
  before update on public.notes
  for each row execute function public.update_notes_updated_at();


-- =====================================
-- MULTI-USER PROJECT MEMBERSHIPS TABLE
-- =====================================
create table if not exists public.project_memberships (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('owner','admin','editor','viewer')),
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  invited_by uuid,
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.project_memberships enable row level security;

drop policy if exists pm_select on public.project_memberships;
drop policy if exists pm_insert on public.project_memberships;
drop policy if exists pm_update on public.project_memberships;
drop policy if exists pm_delete on public.project_memberships;

create policy pm_select on public.project_memberships
  for select using (auth.uid() = user_id or auth.uid() = invited_by);

create policy pm_insert on public.project_memberships
  for insert with check (true);

create policy pm_update on public.project_memberships
  for update using (auth.uid() = user_id or auth.uid() = invited_by);

create policy pm_delete on public.project_memberships
  for delete using (auth.uid() = invited_by);

create or replace function public.update_pm_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_update_pm_updated on public.project_memberships;
create trigger trg_update_pm_updated
  before update on public.project_memberships
  for each row execute function public.update_pm_updated_at();


-- =========================
-- HELPER / PERMISSION RPCs
-- =========================
drop function if exists public.get_user_projects(uuid);

create or replace function public.has_project_permission(project_uuid uuid, user_uuid uuid, required_role text)
returns boolean
language plpgsql
as $$
declare r text;
begin
  select role into r
  from public.project_memberships
  where project_id = project_uuid and user_id = user_uuid and status = 'accepted'
  limit 1;

  if r is null then return false; end if;
  if required_role = 'viewer' then return true; end if;
  if required_role = 'editor' then return r in ('owner','admin','editor'); end if;
  if required_role = 'admin'  then return r in ('owner','admin'); end if;
  if required_role = 'owner'  then return r = 'owner'; end if;
  return false;
end;
$$;

create or replace function public.get_user_projects(user_uuid uuid)
returns table(
  project_id uuid,
  project_name text,
  project_description text,
  user_role text,
  is_owner boolean,
  member_count int,
  created_at timestamptz
)
language sql
as $$
  select p.id, p.name, p.description,
         pm.role, (pm.role = 'owner') as is_owner,
         (select count(*) from public.project_memberships pm2 where pm2.project_id = p.id and pm2.status = 'accepted') as member_count,
         p.created_at
  from public.projects p
  join public.project_memberships pm on pm.project_id = p.id and pm.user_id = user_uuid and pm.status = 'accepted';
$$;

