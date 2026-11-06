-- Foundation only: further product modules require subsequent migrations.
create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null check(length(display_name) between 1 and 80),
 created_at timestamptz not null default now()
);
create table public.places (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(trim(name)) between 3 and 120),
 category text not null check(category in ('Comer','Lazer','Compras','Serviços')),
 city text not null check(length(trim(city)) between 2 and 100),
 state text not null check(state ~ '^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$'),
 address text not null check(length(trim(address)) between 5 and 240),
 country text not null default 'BR' check(country='BR'),
 geom extensions.geography(point,4326),
 source text not null default 'community' check(source='community'),
 created_by uuid references auth.users on delete set null,
 verification_status text not null default 'pending' check(verification_status in ('pending','approved','rejected','merged')),
 created_at timestamptz not null default now()
);
create index places_geo on public.places using gist(geom);
create index places_city_state on public.places(state,city);
create index places_name_search on public.places using gin(name extensions.gin_trgm_ops);
create table public.reviews (
 id uuid primary key default gen_random_uuid(),
 place_id uuid not null references public.places on delete cascade,
 author_id uuid not null references auth.users on delete cascade,
 rating integer not null check(rating between 1 and 5),
 body text not null check(length(trim(body)) between 3 and 500),
 status text not null default 'pending' check(status in ('pending','approved','hidden')),
 created_at timestamptz not null default now(),
 unique(place_id,author_id)
);
create table public.place_messages (
 id uuid primary key default gen_random_uuid(),
 place_id uuid not null references public.places on delete cascade,
 author_id uuid not null references auth.users on delete cascade,
 body text not null check(length(trim(body)) between 1 and 1000),
 status text not null default 'published' check(status in ('published','hidden')),
 created_at timestamptz not null default now()
);
create index messages_cursor on public.place_messages(place_id,created_at desc,id);
create index reviews_place on public.reviews(place_id,status);
-- Do not grant table-wide UPDATE: ownership, moderation and timestamps stay immutable.
revoke all on public.profiles, public.places, public.reviews, public.place_messages from anon,authenticated;
grant select on public.profiles,public.places,public.reviews,public.place_messages to anon,authenticated;
grant insert(id,display_name),update(display_name) on public.profiles to authenticated;
grant insert(name,category,city,state,address,created_by) on public.places to authenticated;
grant insert(place_id,author_id,rating,body),update(rating,body),delete on public.reviews to authenticated;
grant insert(place_id,author_id,body),delete on public.place_messages to authenticated;
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.reviews enable row level security;
alter table public.place_messages enable row level security;
create policy profile_read on public.profiles for select using(true);
create policy profile_insert on public.profiles for insert to authenticated with check(id=auth.uid());
create policy profile_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy place_read on public.places for select using(verification_status='approved' or created_by=auth.uid());
create policy place_insert on public.places for insert to authenticated with check(created_by=auth.uid() and verification_status='pending');
create policy review_read on public.reviews for select using((status='approved' or author_id=auth.uid()) and exists(select 1 from public.places p where p.id=place_id and p.verification_status='approved'));
create policy review_insert on public.reviews for insert to authenticated with check(author_id=auth.uid() and status='pending' and exists(select 1 from public.places p where p.id=place_id and p.verification_status='approved'));
create policy review_update on public.reviews for update to authenticated using(author_id=auth.uid()) with check(author_id=auth.uid());
create policy review_delete on public.reviews for delete to authenticated using(author_id=auth.uid());
create policy message_read on public.place_messages for select using(status='published' and exists(select 1 from public.places p where p.id=place_id and p.verification_status='approved'));
create policy message_insert on public.place_messages for insert to authenticated with check(author_id=auth.uid() and status='published' and exists(select 1 from public.places p where p.id=place_id and p.verification_status='approved'));
create policy message_delete on public.place_messages for delete to authenticated using(author_id=auth.uid());
-- Re-review edits rather than allow previously approved content to bypass moderation.
create function public.review_edit_pending() returns trigger language plpgsql set search_path='' as $$ begin new.status := 'pending'; return new; end $$;
create trigger review_edit_pending before update of rating,body on public.reviews for each row execute function public.review_edit_pending();
create view public.place_ratings with(security_invoker=true) as select place_id,avg(rating)::numeric(3,2) as rating,count(*) as review_count from public.reviews where status='approved' group by place_id;
grant select on public.place_ratings to anon,authenticated;
-- Serialize writes per user before counting, so concurrent requests cannot bypass limits.
create function public.limit_contributions() returns trigger language plpgsql security definer set search_path='' as $$
declare recent_count integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,0));
 if tg_table_name='places' then
  select count(*) into recent_count from public.places where created_by=auth.uid() and created_at>now()-interval '1 hour';
  if recent_count>=5 then raise exception 'Limite de cadastros por hora atingido'; end if;
 else
  select count(*) into recent_count from public.place_messages where author_id=auth.uid() and created_at>now()-interval '1 minute';
  if recent_count>=10 then raise exception 'Limite de mensagens por minuto atingido'; end if;
 end if;
 return new;
end $$;
revoke all on function public.limit_contributions() from public,anon,authenticated;
create trigger limit_places before insert on public.places for each row execute function public.limit_contributions();
create trigger limit_messages before insert on public.place_messages for each row execute function public.limit_contributions();
alter publication supabase_realtime add table public.place_messages;
