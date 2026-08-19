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
