begin;

do $$
declare
  vehicle_id_type text;
begin
  if to_regclass('public.vehicle_inquiries') is not null then
    raise exception 'public.vehicle_inquiries already exists. Inspect its columns and policies before applying this migration.';
  end if;

  if to_regclass('public.vehicles') is null
    or to_regclass('public.public_vehicles') is null
    or to_regclass('public.admin_users') is null then
    raise exception 'Expected public.vehicles, public.public_vehicles, and public.admin_users. Inspect the existing schema before applying this migration.';
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

  execute format(
    'create table public.vehicle_inquiries (
      id uuid primary key default gen_random_uuid(),
      vehicle_id %s not null references public.vehicles(id),
      buyer_name text not null check (char_length(btrim(buyer_name)) between 2 and 100),
      buyer_phone text not null check (buyer_phone ~ ''^[6-9][0-9]{9}$''),
      message text check (message is null or char_length(message) <= 1000),
      status text not null default ''new'' check (status in (''new'', ''contacted'', ''closed'')),
      created_at timestamptz not null default now(),
      constraint vehicle_inquiries_unique_buyer_per_vehicle unique (vehicle_id, buyer_phone)
    )',
    vehicle_id_type
  );
end
$$;

create index vehicle_inquiries_created_at_idx
on public.vehicle_inquiries (created_at desc);

alter table public.vehicle_inquiries enable row level security;

revoke all on table public.vehicle_inquiries from public, anon, authenticated;
grant insert on table public.vehicle_inquiries to anon, authenticated;
grant select on table public.vehicle_inquiries to authenticated;
grant update (status) on table public.vehicle_inquiries to authenticated;

create policy "vehicle_inquiries_insert_for_approved_vehicles"
on public.vehicle_inquiries
for insert
to anon, authenticated
with check (
  char_length(btrim(buyer_name)) between 2 and 100
  and buyer_phone ~ '^[6-9][0-9]{9}$'
  and (message is null or char_length(message) <= 1000)
  and status = 'new'
  and exists (
    select 1
    from public.public_vehicles as approved_vehicle
    where approved_vehicle.id = vehicle_id
  )
);

create policy "vehicle_inquiries_admin_read"
on public.vehicle_inquiries
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = auth.uid()
  )
);

create policy "vehicle_inquiries_admin_update_status"
on public.vehicle_inquiries
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = auth.uid()
  )
)
with check (
  status in ('new', 'contacted', 'closed')
  and exists (
    select 1
    from public.admin_users as admin
    where admin.user_id = auth.uid()
  )
);

commit;
