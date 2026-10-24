-- Additive proposal for the existing Vértice project. Sites owns visitor identity;
-- user_id is the opaque Sites id, deliberately independent of auth.users.
begin;

create table public.vertice_user_favorites (
 user_id text not null check (length(user_id) between 1 and 512 and length(btrim(user_id)) > 0 and user_id !~ '[[:cntrl:]]'),
 vehicle_id text not null references public.vertice_vehicles(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key (user_id, vehicle_id)
);
create index vertice_user_favorites_owner_created_idx on public.vertice_user_favorites(user_id, created_at desc, vehicle_id);
create index vertice_user_favorites_vehicle_idx on public.vertice_user_favorites(vehicle_id);

create table public.vertice_fipe_history (
 id uuid primary key default gen_random_uuid(),
 user_id text not null check (length(user_id) between 1 and 512 and length(btrim(user_id)) > 0 and user_id !~ '[[:cntrl:]]'),
 query_key text not null check (query_key ~ '^[1-9][0-9]{0,6}/[1-9][0-9]{0,6}/(19[0-9]{2}|20[0-9]{2}|32000)-[1-9]$'),
 reference_month text not null check (length(btrim(reference_month)) between 1 and 80),
 result jsonb not null check (jsonb_typeof(result) = 'object' and octet_length(result::text) <= 16000),
 created_at timestamptz not null default now(),
 unique (user_id, query_key, reference_month)
);
create index vertice_fipe_history_owner_created_idx on public.vertice_fipe_history(user_id, created_at desc, id desc);

alter table public.vertice_user_favorites enable row level security;
alter table public.vertice_fipe_history enable row level security;
-- No browser access or auth.uid() policies: only the validated machine gateway
-- can read or mutate these tables, always with the trusted Sites owner filter.
revoke all on public.vertice_user_favorites, public.vertice_fipe_history from public, anon, authenticated;
grant select, insert, update, delete on public.vertice_user_favorites, public.vertice_fipe_history to service_role;

-- One operation checks current public eligibility, deduplicates imports, and
-- returns only this owner's favorite ids. Removing archived favorites is allowed.
create function public.vertice_set_user_favorites(p_user_id text, p_vehicle_ids text[], p_favorite boolean)
returns table(vehicle_id text)
language plpgsql security invoker set search_path = '' as $$
begin
 if p_user_id is null or length(p_user_id) not between 1 and 512 or length(btrim(p_user_id)) = 0 or p_user_id ~ '[[:cntrl:]]'
    or p_vehicle_ids is null or coalesce(array_ndims(p_vehicle_ids), 1) <> 1 or cardinality(p_vehicle_ids) > 50 or p_favorite is null then
  raise exception 'Invalid account operation' using errcode = '22023';
 end if;
 if exists (select 1 from unnest(p_vehicle_ids) as requested(id) where requested.id is null or requested.id !~ '^[a-z0-9-]{3,80}$') then
  raise exception 'Invalid vehicle identifier' using errcode = '22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('vertice_favorites:' || p_user_id, 0));
 if p_favorite then
  insert into public.vertice_user_favorites as favorite(user_id, vehicle_id)
  select p_user_id, vehicle.id from public.vertice_vehicles as vehicle
  where vehicle.id = any(p_vehicle_ids) and vehicle.archived = false and vehicle.status in ('available', 'reserved')
  on conflict on constraint vertice_user_favorites_pkey do nothing;
 else
  delete from public.vertice_user_favorites as favorite where favorite.user_id = p_user_id and favorite.vehicle_id = any(p_vehicle_ids);
 end if;
 return query select favorite.vehicle_id from public.vertice_user_favorites as favorite where favorite.user_id = p_user_id order by favorite.created_at desc, favorite.vehicle_id;
end;
$$;
revoke all on function public.vertice_set_user_favorites(text, text[], boolean) from public, anon, authenticated;
grant execute on function public.vertice_set_user_favorites(text, text[], boolean) to service_role;

-- The advisory transaction lock prevents concurrent quotes for one owner from
-- escaping the 50-entry limit. The query/reference pair is saved only once.
create function public.vertice_save_fipe_history(p_user_id text, p_query_key text, p_reference_month text, p_result jsonb)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare saved_id uuid;
begin
 if p_user_id is null or length(p_user_id) not between 1 and 512 or length(btrim(p_user_id)) = 0 or p_user_id ~ '[[:cntrl:]]'
    or p_query_key is null or p_query_key !~ '^[1-9][0-9]{0,6}/[1-9][0-9]{0,6}/(19[0-9]{2}|20[0-9]{2}|32000)-[1-9]$'
    or p_reference_month is null or length(btrim(p_reference_month)) not between 1 and 80
    or p_result is null or jsonb_typeof(p_result) <> 'object' or octet_length(p_result::text) > 16000 then
  raise exception 'Invalid history operation' using errcode = '22023';
 end if;
 if not (p_result ?& array['vehicleType','price','brand','model','modelYear','fuel','codeFipe','referenceMonth','fuelAcronym'])
    or (p_result - array['vehicleType','price','brand','model','modelYear','fuel','codeFipe','referenceMonth','fuelAcronym']) <> '{}'::jsonb
    or p_result->'vehicleType' <> '1'::jsonb
    or jsonb_typeof(p_result->'modelYear') <> 'number'
    or p_result->>'modelYear' !~ '^(19[0-9]{2}|20[0-9]{2}|32000)$'
    or jsonb_typeof(p_result->'price') <> 'string' or length(p_result->>'price') > 40
    or p_result->>'price' !~ '^R\$[[:space:]]?([0-9]{1,3}(\.[0-9]{3})*|[0-9]+),[0-9]{2}$'
    or replace(regexp_replace(p_result->>'price', '[^0-9,]', '', 'g'), ',', '.')::numeric <= 0
    or jsonb_typeof(p_result->'codeFipe') <> 'string' or p_result->>'codeFipe' !~ '^[0-9]{6}-[0-9]$'
    or jsonb_typeof(p_result->'referenceMonth') <> 'string' or p_result->>'referenceMonth' <> p_reference_month
    or exists (select 1 from jsonb_each(p_result) as field(name, value) where field.name in ('brand','model','fuel','referenceMonth','fuelAcronym') and (jsonb_typeof(field.value) <> 'string' or length(btrim(field.value #>> '{}')) = 0 or length(field.value #>> '{}') > case field.name when 'fuelAcronym' then 8 when 'fuel' then 80 when 'referenceMonth' then 80 else 240 end)) then
  raise exception 'Invalid FIPE result' using errcode = '22023';
 end if;
 perform pg_advisory_xact_lock(hashtextextended('vertice_fipe_history:' || p_user_id, 0));
 insert into public.vertice_fipe_history as history(user_id, query_key, reference_month, result)
 values(p_user_id, p_query_key, p_reference_month, p_result)
 on conflict (user_id, query_key, reference_month) do update set result = excluded.result, created_at = clock_timestamp()
 returning id into saved_id;
 delete from public.vertice_fipe_history as history
 where history.user_id = p_user_id and history.id in (
  select older.id from public.vertice_fipe_history as older where older.user_id = p_user_id order by older.created_at desc, older.id desc offset 50
 );
 return saved_id;
end;
$$;
revoke all on function public.vertice_save_fipe_history(text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.vertice_save_fipe_history(text, text, text, jsonb) to service_role;

comment on table public.vertice_user_favorites is 'Private Sites visitor favorites; no Supabase Auth linkage or browser grants.';
comment on table public.vertice_fipe_history is 'Private normalized real FIPE quotes, deduplicated by owner/query/reference and capped at 50 through the gateway RPC.';
commit;
