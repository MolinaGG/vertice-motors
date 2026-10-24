-- Additive, project-scoped migration. No unrelated schema or auth settings changed.
create table public.vertice_vehicles (
 id text primary key check (id ~ '^[a-z0-9-]{3,80}$'),
 payload jsonb not null, status text not null default 'available' check(status in ('available','reserved','sold')),
 archived boolean not null default false, updated_at timestamptz not null default now()
);
create index vertice_vehicles_catalog_idx on public.vertice_vehicles(status) where archived=false;
create table public.vertice_settings (id integer primary key check(id=1), payload jsonb not null, updated_at timestamptz not null default now());
create table public.vertice_leads (
 id uuid primary key default gen_random_uuid(), vehicle_id text references public.vertice_vehicles(id),
 payload jsonb not null, status text not null default 'new' check(status in ('new','in_progress','completed','dismissed')),
 request_id uuid unique, created_at timestamptz not null default now()
);
create index vertice_leads_created_idx on public.vertice_leads(created_at desc);
create index vertice_leads_vehicle_idx on public.vertice_leads(vehicle_id);
create table public.vertice_admins (id integer primary key check(id=1), user_id text not null unique, created_at timestamptz not null default now());
create table public.vertice_runtime_access (id integer primary key check(id=1), token_hash text not null check(length(token_hash)=64));
create table public.vertice_audit (id uuid primary key default gen_random_uuid(), actor_id text not null, action text not null, object_id text, created_at timestamptz not null default now());
create table public.vertice_rate_limits (key text primary key, hits integer not null default 1, window_start timestamptz not null default now());
alter table public.vertice_vehicles enable row level security;
alter table public.vertice_settings enable row level security;
alter table public.vertice_leads enable row level security;
alter table public.vertice_admins enable row level security;
alter table public.vertice_runtime_access enable row level security;
alter table public.vertice_audit enable row level security;
alter table public.vertice_rate_limits enable row level security;
revoke all on public.vertice_vehicles,public.vertice_settings,public.vertice_leads,public.vertice_admins,public.vertice_runtime_access,public.vertice_audit,public.vertice_rate_limits from anon,authenticated;
grant select on public.vertice_vehicles,public.vertice_settings to anon,authenticated;
grant select,insert,update,delete on public.vertice_vehicles,public.vertice_settings,public.vertice_leads,public.vertice_admins,public.vertice_runtime_access,public.vertice_audit,public.vertice_rate_limits to service_role;
create policy vertice_catalog_read on public.vertice_vehicles for select to anon,authenticated using (archived=false and status in ('available','reserved'));
create policy vertice_public_settings on public.vertice_settings for select to anon,authenticated using (id=1);
create function public.vertice_consume_rate_limit(p_key text) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer;
begin
 if length(p_key)<>64 then return false; end if;
 insert into public.vertice_rate_limits(key,hits,window_start) values(p_key,1,now())
 on conflict(key) do update set hits=case when public.vertice_rate_limits.window_start < now()-interval '1 hour' then 1 else public.vertice_rate_limits.hits+1 end,
 window_start=case when public.vertice_rate_limits.window_start < now()-interval '1 hour' then now() else public.vertice_rate_limits.window_start end
 returning hits into n;
 delete from public.vertice_rate_limits where window_start<now()-interval '2 days';
 return n<=5;
end;
$$;
revoke all on function public.vertice_consume_rate_limit(text) from public,anon,authenticated;
grant execute on function public.vertice_consume_rate_limit(text) to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('vertice-vehicle-images','vertice-vehicle-images',false,5242880,array['image/jpeg','image/png','image/webp']);
comment on table public.vertice_leads is 'Vértice demo contacts. Private to authorized server; never expose client access.';
