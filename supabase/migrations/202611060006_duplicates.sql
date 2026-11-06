create extension if not exists unaccent with schema extensions;
create function public.normalize_place_name(value text) returns text language sql immutable set search_path='' as $$select trim(lower(regexp_replace(extensions.unaccent('extensions.unaccent'::regdictionary,value),'[^a-zA-Z0-9]+',' ','g')))$$;
revoke all on function public.normalize_place_name(text) from public;
grant execute on function public.normalize_place_name(text) to anon,authenticated,service_role;
alter table public.places add column normalized_name text generated always as(public.normalize_place_name(name)) stored;
create index places_normalized on public.places(normalized_name,city,state);
create function public.duplicate_candidates(term text,city_input text,state_input text) returns table(id uuid,name text,category text,city text,state text,address text,longitude double precision,latitude double precision,rating numeric,review_count bigint) language sql stable set search_path='' as $$
 select p.id,p.name,p.category,p.city,p.state,p.address,extensions.st_x(p.geom::extensions.geometry),extensions.st_y(p.geom::extensions.geometry),r.rating,coalesce(r.review_count,0) from public.places p left join public.place_ratings r on r.place_id=p.id
 where length(term) between 3 and 120 and p.moderation_state='approved' and p.verification_status='approved' and lower(p.city)=lower(city_input) and p.state=state_input
 and extensions.similarity(p.normalized_name,public.normalize_place_name(term))>=0.4
 order by extensions.similarity(p.normalized_name,public.normalize_place_name(term)) desc,p.id limit 10
$$;
revoke all on function public.duplicate_candidates(text,text,text) from public;
grant execute on function public.duplicate_candidates(text,text,text) to anon,authenticated;
create or replace function public.place_duplicate_guard() returns trigger language plpgsql security definer set search_path='' as $$
declare normalized text:=public.normalize_place_name(new.name);
begin
 if not new.is_public_venue then raise exception 'Confirme que é estabelecimento público';end if;
 if new.geom is not null and (extensions.st_y(new.geom::extensions.geometry) not between -34 and 6 or extensions.st_x(new.geom::extensions.geometry) not between -74 and -34) then raise exception 'Posição fora da área brasileira suportada';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(normalized||lower(trim(new.city))||new.state,2));
 if exists(select 1 from public.places p where p.verification_status in ('pending','approved') and public.normalize_place_name(p.name)=normalized and lower(trim(p.city))=lower(trim(new.city)) and p.state=new.state and(p.geom is null or new.geom is null or extensions.st_dwithin(p.geom,new.geom,150))) then raise exception 'Lugar semelhante já cadastrado ou aguardando revisão. Pesquise antes de enviar.';end if;
 return new;
end$$;
-- Index matches the viewport cast used by search_places.
create index places_viewport_geometry on public.places using gist((geom::extensions.geometry));
