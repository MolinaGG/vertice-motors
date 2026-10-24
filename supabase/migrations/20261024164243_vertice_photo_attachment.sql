create function public.vertice_attach_photo(p_vehicle_id text,p_url text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare current_payload jsonb; photos jsonb;
begin
 if p_vehicle_id !~ '^[a-z0-9-]{3,80}$' or p_url !~ ('^/api/media/'||p_vehicle_id||'/[a-f0-9]{64}[.](jpg|png|webp)$') then raise exception 'Invalid photo'; end if;
 select payload into current_payload from public.vertice_vehicles where id=p_vehicle_id for update;
 if current_payload is null then raise exception 'Vehicle not found'; end if;
 photos:=coalesce(current_payload->'photos','[]'::jsonb);
 if photos ? p_url then return current_payload; end if;
 if jsonb_array_length(photos)>=12 then raise exception 'Photo limit reached'; end if;
 current_payload:=jsonb_set(current_payload,'{photos}',photos||jsonb_build_array(p_url));
 update public.vertice_vehicles set payload=current_payload,updated_at=now() where id=p_vehicle_id;
 return current_payload;
end;
$$;
revoke all on function public.vertice_attach_photo(text,text) from public,anon,authenticated;
grant execute on function public.vertice_attach_photo(text,text) to service_role;
