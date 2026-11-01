begin;

do $$
declare
  vehicle_id_type text;
  bucket_is_public boolean;
begin
  if to_regclass('public.vehicles') is null
    or to_regclass('public.public_vehicles') is null
    or to_regclass('public.admin_users') is null then
    raise exception 'Expected public.vehicles, public.public_vehicles, and public.admin_users. Inspect the live schema before applying this migration.';
  end if;

  if to_regclass('storage.buckets') is null
    or to_regclass('storage.objects') is null then
    raise exception 'Supabase Storage tables are unavailable. Inspect the project before applying this migration.';
  end if;

  if to_regclass('public.vehicle_photos') is not null then
    raise exception 'public.vehicle_photos already exists. Inspect its columns and policies before applying this migration.';
  end if;

  select format_type(attribute.atttypid, attribute.atttypmod)
  into vehicle_id_type
  from pg_attribute as attribute
  where attribute.attrelid = 'public.vehicles'::regclass
    and attribute.attname = 'id'
    and attribute.attnum > 0
    and not attribute.attisdropped;

  if vehicle_id_type is null then
    raise exception 'Could not determine public.vehicles.id type.';
  end if;

  if not exists (
    select 1
    from pg_attribute as attribute
    where attribute.attrelid = 'public.admin_users'::regclass
      and attribute.attname = 'user_id'
      and attribute.atttypid = 'uuid'::regtype
      and attribute.attnum > 0
      and not attribute.attisdropped
  ) then
    raise exception 'Expected public.admin_users.user_id to be a UUID matching auth.uid().';
  end if;

  insert into storage.buckets (id, name, public)
  values ('vehicle-photos-private', 'vehicle-photos-private', false)
  on conflict (id) do nothing;

  select bucket.public
  into bucket_is_public
  from storage.buckets as bucket
  where bucket.id = 'vehicle-photos-private'
    and bucket.name = 'vehicle-photos-private';

  if bucket_is_public is distinct from false then
    raise exception 'The vehicle-photos-private bucket is missing, mismatched, or public. Inspect it before applying this migration.';
  end if;

  execute format(
    'create table public.vehicle_photos (
      id uuid primary key default gen_random_uuid(),
      vehicle_id %s not null references public.vehicles(id),
      storage_path text not null unique check (char_length(btrim(storage_path)) > 0),
      sort_order integer not null default 0 check (sort_order >= 0),
      created_at timestamptz not null default now()
    )',
    vehicle_id_type
  );
end
$$;

alter table public.vehicle_photos enable row level security;

revoke all on table public.vehicle_photos from public, anon, authenticated;
grant select on table public.vehicle_photos to anon, authenticated;
grant select, insert, update, delete on table public.vehicle_photos to service_role;

create policy "vehicle_photos_public_read_approved"
on public.vehicle_photos
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.public_vehicles as approved_vehicle
    where approved_vehicle.id = vehicle_id
  )
);

create policy "vehicle_photos_admin_read"
on public.vehicle_photos
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = auth.uid()
  )
);

create policy "vehicle_private_photos_read_approved"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'vehicle-photos-private'
  and exists (
    select 1
    from public.vehicle_photos as photo
    join public.public_vehicles as approved_vehicle
      on approved_vehicle.id = photo.vehicle_id
    where photo.storage_path = name
  )
);

create policy "vehicle_private_photos_admin_read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'vehicle-photos-private'
  and exists (
    select 1
    from public.vehicle_photos as photo
    where photo.storage_path = name
  )
  and exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = auth.uid()
  )
);

-- Prevent older permissive Storage policies from exposing this private bucket.
create policy "vehicle_private_photos_read_guard"
on storage.objects
as restrictive
for select
to public
using (
  bucket_id <> 'vehicle-photos-private'
  or (
    exists (
      select 1
      from public.vehicle_photos as photo
      join public.public_vehicles as approved_vehicle
        on approved_vehicle.id = photo.vehicle_id
      where photo.storage_path = name
    )
    or exists (
      select 1
      from public.vehicle_photos as photo
      join public.admin_users as admin
        on admin.user_id = auth.uid()
      where photo.storage_path = name
    )
  )
);

-- Block direct Storage DELETE for every client role on this bucket.
-- Trusted server-side service-role deletion bypasses RLS.
create policy "vehicle_private_photos_delete_guard"
on storage.objects
as restrictive
for delete
to public
using (
  bucket_id <> 'vehicle-photos-private'
);

-- Uploads and object mutations must use trusted server code, never a browser client.
create policy "vehicle_private_photos_insert_guard"
on storage.objects
as restrictive
for insert
to public
with check (
  bucket_id <> 'vehicle-photos-private'
);

create policy "vehicle_private_photos_update_guard"
on storage.objects
as restrictive
for update
to public
using (
  bucket_id <> 'vehicle-photos-private'
)
with check (
  bucket_id <> 'vehicle-photos-private'
);

-- A trusted server must verify admin_users membership, remove the Storage object
-- through the Storage API, and only then delete its vehicle_photos row.
-- Service-role access stays server-side; never expose its key in browser code.

commit;
