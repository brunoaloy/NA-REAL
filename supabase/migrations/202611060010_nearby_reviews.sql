-- Additive: existing national/viewport search contract remains intact.
create function public.search_places_near(
 origin_latitude double precision, origin_longitude double precision,
 term text default '', category_filter text default 'Todos',
 city_filter text default '', state_filter text default '', page_number integer default 0
) returns table(id uuid,name text,category text,city text,state text,address text,
 longitude double precision,latitude double precision,rating numeric,review_count bigint)
 language plpgsql stable set search_path='' as $$
declare origin extensions.geography;
begin
 if $1 is null or $2 is null or $1 not between -90 and 90 or $2 not between -180 and 180
 or $7 is null or $7 not between 0 and 500 or length($3)>120 or length($5)>100
 then raise exception 'Invalid proximity search'; end if;
 origin := extensions.st_setsrid(extensions.st_makepoint($2,$1),4326)::extensions.geography;
 return query
 select p.id,p.name,p.category,p.city,p.state,p.address,
 extensions.st_x(p.geom::extensions.geometry),extensions.st_y(p.geom::extensions.geometry),
 r.rating,coalesce(r.review_count,0)
 from public.places p left join public.place_ratings r on r.place_id=p.id
 where p.moderation_state='approved' and p.verification_status='approved' and p.geom is not null
 and ($3='' or strpos(lower(p.name),lower($3))>0 or strpos(lower(p.city),lower($3))>0)
 and ($4='Todos' or p.category=$4)
 and ($5='' or strpos(lower(p.city),lower($5))>0)
 and ($6='' or p.state=$6)
 order by p.geom operator(extensions.<->) origin,p.id limit 50 offset $7*50;
end $$;
revoke all on function public.search_places_near(double precision,double precision,text,text,text,text,integer) from public;
grant execute on function public.search_places_near(double precision,double precision,text,text,text,text,integer) to anon,authenticated;
create index reviews_place_cursor on public.reviews(place_id,created_at desc,id desc);
