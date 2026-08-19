-- QA Management: user-owned data + private artifact storage
-- Apply to project qa-management

create table if not exists public.app_rows (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  collection text not null,
  project_id text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists app_rows_user_collection_idx
  on public.app_rows (user_id, collection);

alter table public.app_rows enable row level security;

drop policy if exists "Users manage own rows" on public.app_rows;
create policy "Users manage own rows"
  on public.app_rows
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on public.app_rows to authenticated;

create or replace function public.replace_collection(p_collection text, p_rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.app_rows
  where user_id = auth.uid()
    and collection = p_collection;

  insert into public.app_rows (id, user_id, collection, project_id, data, updated_at)
  select
    coalesce(nullif(item->>'id', ''), gen_random_uuid()::text),
    auth.uid(),
    p_collection,
    nullif(item->>'projectId', ''),
    item,
    now()
  from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) as item;
end;
$$;

grant execute on function public.replace_collection(text, jsonb) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artifacts',
  'artifacts',
  false,
  52428800,
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/heic',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg', 'video/x-m4v'
  ]
)
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types,
    public = false;

drop policy if exists "Users read own artifacts" on storage.objects;
drop policy if exists "Users write own artifacts" on storage.objects;
drop policy if exists "Users update own artifacts" on storage.objects;
drop policy if exists "Users delete own artifacts" on storage.objects;

create policy "Users read own artifacts"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users write own artifacts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own artifacts"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own artifacts"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = auth.uid()::text);

-- Public share snapshots. Recipients open /s/{token}; API uses the service role.
create table if not exists public.shares (
  token text primary key,
  kind text not null check (kind in ('project', 'list')),
  title text not null,
  project_id text not null,
  project_name text not null,
  suite_id text,
  role text not null check (role in ('view', 'edit', 'full')),
  permissions jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked boolean not null default false,
  allowed_emails text[] not null default '{}',
  columns jsonb not null default '[]'::jsonb,
  lists jsonb not null default '[]'::jsonb,
  rows jsonb not null default '[]'::jsonb
);

create index if not exists shares_owner_lookup_idx
  on public.shares (created_by, project_id, kind, suite_id)
  where not revoked;

alter table public.shares enable row level security;
revoke all on table public.shares from anon, authenticated;

create or replace function public.get_share_by_token(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare rec public.shares;
begin
  if p_token is null or length(trim(p_token)) < 16 then
    return null;
  end if;
  select * into rec from public.shares where token = p_token and revoked = false;
  if not found then
    return null;
  end if;
  return to_jsonb(rec);
end;
$$;

create or replace function public.find_share_for_resource(
  p_created_by uuid,
  p_project_id text,
  p_kind text,
  p_suite_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare rec public.shares;
begin
  if p_kind = 'list' then
    select * into rec
    from public.shares
    where created_by = p_created_by
      and project_id = p_project_id
      and kind = p_kind
      and suite_id = p_suite_id
      and revoked = false
    order by updated_at desc
    limit 1;
  else
    select * into rec
    from public.shares
    where created_by = p_created_by
      and project_id = p_project_id
      and kind = p_kind
      and suite_id is null
      and revoked = false
    order by updated_at desc
    limit 1;
  end if;
  if not found then
    return null;
  end if;
  return to_jsonb(rec);
end;
$$;

create or replace function public.upsert_share(p_share jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare rec public.shares;
begin
  if p_share is null or coalesce(p_share->>'token','') = '' or coalesce(p_share->>'created_by','') = '' then
    raise exception 'Missing share fields';
  end if;

  insert into public.shares (
    token, kind, title, project_id, project_name, suite_id, role, permissions,
    created_by, created_at, updated_at, revoked, allowed_emails, columns, lists, rows
  ) values (
    p_share->>'token',
    p_share->>'kind',
    p_share->>'title',
    p_share->>'project_id',
    p_share->>'project_name',
    nullif(p_share->>'suite_id', ''),
    p_share->>'role',
    coalesce(p_share->'permissions', '{}'::jsonb),
    (p_share->>'created_by')::uuid,
    coalesce((p_share->>'created_at')::timestamptz, now()),
    now(),
    false,
    coalesce(array(select jsonb_array_elements_text(coalesce(p_share->'allowed_emails', '[]'::jsonb))), '{}'::text[]),
    coalesce(p_share->'columns', '[]'::jsonb),
    coalesce(p_share->'lists', '[]'::jsonb),
    coalesce(p_share->'rows', '[]'::jsonb)
  )
  on conflict (token) do update set
    title = excluded.title,
    project_name = excluded.project_name,
    role = excluded.role,
    permissions = excluded.permissions,
    updated_at = now(),
    revoked = false,
    allowed_emails = excluded.allowed_emails,
    columns = excluded.columns,
    lists = excluded.lists,
    rows = excluded.rows,
    kind = excluded.kind,
    project_id = excluded.project_id,
    suite_id = excluded.suite_id
  returning * into rec;

  return to_jsonb(rec);
end;
$$;

create or replace function public.revoke_share(p_token text, p_created_by uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.shares
  set revoked = true, updated_at = now()
  where token = p_token and created_by = p_created_by and revoked = false;
  return found;
end;
$$;

create or replace function public.save_share_rows(
  p_token text,
  p_actor_id text,
  p_email text,
  p_rows jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare rec public.shares;
declare email text := lower(trim(coalesce(p_email, '')));
begin
  select * into rec from public.shares where token = p_token and revoked = false;
  if not found then
    return null;
  end if;

  if rec.created_by::text = coalesce(p_actor_id, '') then
    null;
  elsif coalesce(array_length(rec.allowed_emails, 1), 0) = 0 then
    null;
  elsif email <> '' and email = any(rec.allowed_emails) then
    null;
  else
    raise exception 'Forbidden';
  end if;

  update public.shares
  set rows = coalesce(p_rows, '[]'::jsonb), updated_at = now()
  where token = p_token
  returning * into rec;

  return to_jsonb(rec);
end;
$$;

grant execute on function public.get_share_by_token(text) to anon, authenticated;
grant execute on function public.find_share_for_resource(uuid, text, text, text) to anon, authenticated;
grant execute on function public.upsert_share(jsonb) to anon, authenticated;
grant execute on function public.revoke_share(text, uuid) to anon, authenticated;
grant execute on function public.save_share_rows(text, text, text, jsonb) to anon, authenticated;

drop policy if exists "Read shared artifacts" on storage.objects;
create policy "Read shared artifacts"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'shares');

drop policy if exists "Write shared artifacts" on storage.objects;
create policy "Write shared artifacts"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'shares');

drop policy if exists "Update shared artifacts" on storage.objects;
create policy "Update shared artifacts"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'shares')
with check (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'shares');

drop policy if exists "Delete shared artifacts" on storage.objects;
create policy "Delete shared artifacts"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'artifacts' and (storage.foldername(name))[1] = 'shares');
